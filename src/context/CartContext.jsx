import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import * as cartApi from '../api/cart.js'
import { readToken } from '../api/client.js'
import { useAuth } from './AuthContext.jsx'
import {
  applyLocalAdd,
  applyLocalQuantity,
  computeCartSubtotal,
  createQuantitySyncQueue,
  findCartLine,
  lineKey,
  maxAllowedForProduct,
  resolveVariantId,
} from '../utils/cartLine.js'

const CartContext = createContext(null)

function cartFromBackend(data) {
  if (!data) {
    return {
      items: [],
      count: 0,
      subtotal: 0,
      appliedCoupon: null,
      appliedCouponCode: null,
      couponMessage: null,
    }
  }
  return {
    items: Array.isArray(data.items) ? data.items : [],
    count: data.count ?? 0,
    subtotal: data.subtotal ?? 0,
    appliedCoupon: data.appliedCoupon || null,
    appliedCouponCode: data.appliedCouponCode || data.appliedCoupon?.code || null,
    couponMessage: data.couponMessage || null,
  }
}

const GUEST_CART_KEY = 'svhub.cart.guest'
const GUEST_COUPON_KEY = 'svhub.cart.guestCoupon'

function readGuestCart() {
  try {
    const raw = window.localStorage.getItem(GUEST_CART_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writeGuestCart(cartItems) {
  try {
    const guestOnly = (cartItems || []).filter((it) => !it.itemId)
    if (guestOnly.length > 0) {
      window.localStorage.setItem(GUEST_CART_KEY, JSON.stringify(guestOnly))
    } else {
      window.localStorage.removeItem(GUEST_CART_KEY)
    }
  } catch {
    /* ignore storage errors */
  }
}

function readGuestCouponCode() {
  try {
    return String(window.localStorage.getItem(GUEST_COUPON_KEY) || '')
      .trim()
      .toUpperCase()
  } catch {
    return ''
  }
}

function writeGuestCouponCode(code) {
  try {
    const normalized = String(code || '')
      .trim()
      .toUpperCase()
    if (normalized) window.localStorage.setItem(GUEST_COUPON_KEY, normalized)
    else window.localStorage.removeItem(GUEST_COUPON_KEY)
  } catch {
    /* ignore */
  }
}

function friendlyCartError(error) {
  if (!error) return 'Could not update your cart. Please try again.'
  if (error.code === 'insufficient_stock') return error.message || 'Not enough stock available.'
  if (error.code === 'quantity_limit_exceeded') return error.message || 'Maximum quantity reached.'
  if (error.code === 'unauthenticated' || error.code === 'token_expired' || error.status === 401) {
    return 'Please log in again to update your cart.'
  }
  if (error.code === 'network') return error.message || 'Could not reach SV Hub. Check your connection.'
  return error.message || 'Could not update your cart. Please try again.'
}

export function CartProvider({ children }) {
  const { user } = useAuth()
  const prevUserRef = useRef(user)
  const itemsRef = useRef([])
  const pendingAddsRef = useRef(new Map())
  const syncingRef = useRef(false)
  const qtyQueueRef = useRef(null)

  const [items, setItems] = useState(() => {
    if (!readToken()) return readGuestCart()
    return []
  })
  const [subtotal, setSubtotal] = useState(0)
  const [appliedCoupon, setAppliedCoupon] = useState(null)
  const [couponMessage, setCouponMessage] = useState('')
  const [loading, setLoading] = useState(() => Boolean(readToken() && user))
  const [cartError, setCartError] = useState('')

  itemsRef.current = items

  const isLoggedIn = useCallback(() => Boolean(readToken() && user), [user])

  const applyServerCart = useCallback((res) => {
    const parsed = cartFromBackend(res?.data)
    itemsRef.current = parsed.items
    setItems(parsed.items)
    setSubtotal(parsed.subtotal)
    setAppliedCoupon(parsed.appliedCoupon)
    if (parsed.couponMessage) setCouponMessage(parsed.couponMessage)
    else setCouponMessage('')
    if (parsed.appliedCouponCode) writeGuestCouponCode('')
  }, [])

  const applyOptimisticItems = useCallback((nextItems) => {
    const normalized = nextItems || []
    itemsRef.current = normalized
    setItems(normalized)
    setSubtotal(computeCartSubtotal(normalized))
  }, [])

  const syncCart = useCallback(async () => {
    if (!readToken() || !user || syncingRef.current) return
    syncingRef.current = true
    try {
      setLoading(true)
      const res = await cartApi.getCart()
      applyServerCart(res)
    } catch {
      // Keep existing cart state
    } finally {
      setLoading(false)
      syncingRef.current = false
    }
  }, [user, applyServerCart])

  if (!qtyQueueRef.current) {
    qtyQueueRef.current = createQuantitySyncQueue({
      update: (itemId, quantity) => cartApi.updateCartItem(itemId, quantity),
      remove: (itemId) => cartApi.removeCartItem(itemId),
      onSuccess: (res) => {
        // Preserve newer optimistic quantities for lines still pending sync.
        const queue = qtyQueueRef.current
        const parsed = cartFromBackend(res?.data)
        const backendItems = parsed.items
        const total = parsed.subtotal
        if (!queue || queue.pendingCount() === 0) {
          itemsRef.current = backendItems
          setItems(backendItems)
          setSubtotal(total)
          setAppliedCoupon(parsed.appliedCoupon)
          setCartError('')
          return
        }

        const merged = backendItems.map((item) => {
          const key = lineKey(item)
          if (queue.hasPending(key)) {
            const local = findCartLine(itemsRef.current, item)
            if (local) return { ...item, quantity: local.quantity, lineTotal: (Number(item.price) || 0) * local.quantity }
          }
          return item
        })
        itemsRef.current = merged
        setItems(merged)
        setSubtotal(computeCartSubtotal(merged))
        setAppliedCoupon(parsed.appliedCoupon)
        setCartError('')
      },
      onError: async (error) => {
        setCartError(friendlyCartError(error))
        try {
          const res = await cartApi.getCart()
          applyServerCart(res)
        } catch {
          // Keep optimistic state if refresh also fails; error is already shown.
        }
      },
    })
  }

  const mergeGuestCart = useCallback(
    async (guestItems) => {
      const itemsToMerge = guestItems?.length ? guestItems : readGuestCart()
      const guestCoupon = readGuestCouponCode()
      if (!itemsToMerge?.length) {
        await syncCart()
        if (guestCoupon && isLoggedIn()) {
          try {
            const couponRes = await cartApi.applyCartCoupon(guestCoupon)
            writeGuestCouponCode('')
            applyServerCart(couponRes)
            if (couponRes?.meta?.replaced) {
              setCouponMessage('Replaced previous coupon')
            }
          } catch (error) {
            writeGuestCouponCode('')
            setCouponMessage(error?.message || 'Saved coupon could not be applied.')
          }
        }
        return
      }

      const mappable = itemsToMerge
        .map((item) => ({
          productId: item.productId || item.id,
          variantId: item.variantId || resolveVariantId(item) || '500g',
          quantity: item.quantity || 1,
        }))
        .filter((item) => item.productId && item.variantId)

      if (!mappable.length) {
        writeGuestCart([])
        await syncCart()
        return
      }

      try {
        const res = await cartApi.mergeCart(mappable)
        writeGuestCart([])
        applyServerCart(res)
        if (guestCoupon) {
          try {
            const couponRes = await cartApi.applyCartCoupon(guestCoupon)
            writeGuestCouponCode('')
            applyServerCart(couponRes)
            if (couponRes?.meta?.replaced) setCouponMessage('Replaced previous coupon')
          } catch (error) {
            writeGuestCouponCode('')
            setCouponMessage(error?.message || 'Saved coupon could not be applied.')
          }
        }
      } catch {
        writeGuestCart([])
        await syncCart()
      }
    },
    [syncCart, applyServerCart, isLoggedIn],
  )

  useEffect(() => {
    const prevUser = prevUserRef.current
    prevUserRef.current = user

    if (!prevUser && user) {
      const guestItems = itemsRef.current.filter((it) => !it.itemId)
      const stored = readGuestCart()
      const combined = guestItems.length > 0 ? guestItems : stored
      if (combined.length > 0) {
        mergeGuestCart(combined)
      } else {
        syncCart()
      }
    } else if (prevUser && !user) {
      qtyQueueRef.current?.clear()
      pendingAddsRef.current.clear()
      writeGuestCart([])
      itemsRef.current = []
      setItems([])
      setSubtotal(0)
      setAppliedCoupon(null)
      setCouponMessage('')
      setCartError('')
    } else if (user) {
      syncCart()
    }
  }, [user, mergeGuestCart, syncCart])

  const count = useMemo(() => items.reduce((total, item) => total + (Number(item.quantity) || 0), 0), [items])

  const effectiveSubtotal = useMemo(() => {
    if (isLoggedIn()) return subtotal
    return computeCartSubtotal(items)
  }, [isLoggedIn, subtotal, items])

  const discountAmount = appliedCoupon?.discountAmount || 0
  const discountedSubtotal = Math.max(0, effectiveSubtotal - discountAmount)

  const clearCartError = useCallback(() => setCartError(''), [])

  const applyCoupon = useCallback(
    async (rawCode) => {
      const code = String(rawCode || '')
        .trim()
        .toUpperCase()
      setCouponMessage('')
      if (!code) {
        setCouponMessage('Enter a coupon code.')
        throw new Error('Enter a coupon code.')
      }

      if (!isLoggedIn()) {
        writeGuestCouponCode(code)
        setAppliedCoupon({ code, discountAmount: 0, pending: true })
        setCouponMessage('Coupon saved. Sign in to apply it to your cart.')
        return { pending: true, code }
      }

      try {
        const res = await cartApi.applyCartCoupon(code)
        applyServerCart(res)
        const message = res?.meta?.replaced
          ? 'Replaced previous coupon'
          : res?.meta?.message || res?.data?.appliedCoupon?.message || `Coupon ${code} applied`
        setCouponMessage(message)
        return res
      } catch (error) {
        setCouponMessage(error?.message || 'Could not apply coupon.')
        throw error
      }
    },
    [isLoggedIn, applyServerCart],
  )

  const removeCoupon = useCallback(async () => {
    setCouponMessage('')
    writeGuestCouponCode('')
    if (!isLoggedIn()) {
      setAppliedCoupon(null)
      return
    }
    try {
      const res = await cartApi.removeCartCoupon()
      applyServerCart(res)
    } catch (error) {
      setCouponMessage(error?.message || 'Could not remove coupon.')
      throw error
    }
  }, [isLoggedIn, applyServerCart])

  const addItem = useCallback(
    async (product, quantity = 1) => {
      const qty = Math.max(1, Number(quantity) || 1)
      const variantId = product.variantId || resolveVariantId(product)
      const productId = product.productId || product.id || product._id
      const key = lineKey({ ...product, productId, variantId })
      setCartError('')

      if (!isLoggedIn()) {
        const updated = applyLocalAdd(itemsRef.current, { ...product, productId, variantId }, qty)
        itemsRef.current = updated
        writeGuestCart(updated)
        setItems(updated)
        return
      }

      if (!productId || !variantId) return

      const snapshot = itemsRef.current
      applyOptimisticItems(applyLocalAdd(snapshot, { ...product, productId, variantId }, qty))

      const addPromise = (async () => {
        try {
          const res = await cartApi.addToCart({ productId, variantId, quantity: qty })
          const queue = qtyQueueRef.current
          if (queue && queue.pendingCount() > 0) {
            const { items: backendItems } = cartFromBackend(res?.data)
            const merged = backendItems.map((item) => {
              const line = lineKey(item)
              if (queue.hasPending(line)) {
                const local = findCartLine(itemsRef.current, item)
                if (local) {
                  return {
                    ...item,
                    quantity: local.quantity,
                    lineTotal: (Number(item.price) || 0) * local.quantity,
                  }
                }
              }
              return item
            })
            itemsRef.current = merged
            setItems(merged)
            setSubtotal(computeCartSubtotal(merged))
          } else {
            applyServerCart(res)
          }
          const matched = findCartLine(cartFromBackend(res?.data).items, {
            productId,
            variantId,
          })
          return matched?.itemId || null
        } catch (error) {
          setCartError(friendlyCartError(error))
          applyOptimisticItems(snapshot)
          throw error
        } finally {
          pendingAddsRef.current.delete(key)
        }
      })()

      pendingAddsRef.current.set(key, addPromise)
      try {
        await addPromise
      } catch {
        /* error already surfaced */
      }
    },
    [isLoggedIn, applyOptimisticItems, applyServerCart],
  )

  const setItemQuantity = useCallback(
    async (product, quantity) => {
      const qty = Math.max(0, Number(quantity) || 0)
      setCartError('')

      if (!isLoggedIn()) {
        const updated = applyLocalQuantity(itemsRef.current, product, qty)
        itemsRef.current = updated
        writeGuestCart(updated)
        setItems(updated)
        return
      }

      const snapshot = itemsRef.current
      const currentLine = findCartLine(snapshot, product)
      const maxAllowed = maxAllowedForProduct(product, currentLine)

      if (qty > maxAllowed) {
        setCartError(`Only ${maxAllowed} available.`)
      }

      const targetQty = Math.min(qty, maxAllowed)
      const key = lineKey({
        ...product,
        ...(currentLine || {}),
        variantId: product.variantId || currentLine?.variantId || resolveVariantId(product),
      })

      applyOptimisticItems(applyLocalQuantity(snapshot, currentLine || product, targetQty))

      let itemId = product.itemId || currentLine?.itemId
      if (!itemId) {
        const pendingAdd = pendingAddsRef.current.get(key)
        if (pendingAdd) {
          try {
            itemId = await pendingAdd
          } catch {
            return
          }
        }
      }

      if (!itemId) {
        const refreshed = findCartLine(itemsRef.current, product)
        itemId = refreshed?.itemId
      }

      if (!itemId) {
        setCartError('Could not update that item. Please refresh and try again.')
        applyOptimisticItems(snapshot)
        return
      }

      await qtyQueueRef.current.enqueue({
        key,
        itemId,
        quantity: targetQty,
        snapshot,
      })
    },
    [isLoggedIn, applyOptimisticItems],
  )

  /**
   * Prefer this for +/- controls. Reads the latest quantity from itemsRef so
   * rapid clicks before React re-renders are not lost.
   */
  const adjustItemQuantity = useCallback(
    async (product, delta) => {
      const change = Number(delta) || 0
      if (!change) return

      const currentLine = findCartLine(itemsRef.current, product)
      const currentQty = currentLine?.quantity ?? 0
      const nextQty = Math.max(0, currentQty + change)
      return setItemQuantity(currentLine || product, nextQty)
    },
    [setItemQuantity],
  )

  const quantityOf = useCallback(
    (product) => findCartLine(items, product)?.quantity ?? 0,
    [items],
  )

  const clearCart = useCallback(async () => {
    const snapshot = itemsRef.current
    const snapshotSubtotal = subtotal
    const snapshotCoupon = appliedCoupon
    qtyQueueRef.current?.clear()
    pendingAddsRef.current.clear()
    itemsRef.current = []
    setItems([])
    setSubtotal(0)
    setAppliedCoupon(null)
    writeGuestCart([])
    writeGuestCouponCode('')
    setCartError('')
    if (!isLoggedIn()) return
    try {
      await cartApi.clearCart()
    } catch (error) {
      setCartError(friendlyCartError(error))
      itemsRef.current = snapshot
      setItems(snapshot)
      setSubtotal(snapshotSubtotal)
      setAppliedCoupon(snapshotCoupon)
    }
  }, [isLoggedIn, subtotal, appliedCoupon])

  const value = useMemo(
    () => ({
      items,
      count,
      subtotal: effectiveSubtotal,
      discountedSubtotal,
      discountAmount,
      appliedCoupon,
      couponMessage,
      loading,
      cartError,
      clearCartError,
      addItem,
      setItemQuantity,
      adjustItemQuantity,
      quantityOf,
      clearCart,
      syncCart,
      mergeGuestCart,
      applyCoupon,
      removeCoupon,
    }),
    [
      items,
      count,
      effectiveSubtotal,
      discountedSubtotal,
      discountAmount,
      appliedCoupon,
      couponMessage,
      loading,
      cartError,
      clearCartError,
      addItem,
      setItemQuantity,
      adjustItemQuantity,
      quantityOf,
      clearCart,
      syncCart,
      mergeGuestCart,
      applyCoupon,
      removeCoupon,
    ],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within CartProvider')
  }
  return context
}

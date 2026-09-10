import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import * as cartApi from '../api/cart.js'
import { readToken } from '../api/client.js'
import { useAuth } from './AuthContext.jsx'

const CartContext = createContext(null)

// ─── Shape helpers ─────────────────────────────────────────────────────────────
// Backend cart items have: itemId, productId, slug, name, type, category, storefront,
// variantId, variantLabel, weight, sku, image, price, originalPrice, discount,
// quantity, lineTotal, stock, availableStock, inStock, maxAllowed

function lineKey(item) {
  if (!item) return ''
  const prodId = item.productId || item.id || item._id || ''
  const vId = item.variantId || item.weight || ''
  return `${prodId}::${vId}`
}

function cartFromBackend(data) {
  if (!data) return { items: [], count: 0, subtotal: 0 }
  return {
    items: Array.isArray(data.items) ? data.items : [],
    count: data.count ?? 0,
    subtotal: data.subtotal ?? 0,
  }
}

const GUEST_CART_KEY = 'svhub.cart.guest'

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

// ─── Provider ──────────────────────────────────────────────────────────────────
export function CartProvider({ children }) {
  const { user } = useAuth()
  const prevUserRef = useRef(user)
  const [items, setItems] = useState(() => {
    if (!readToken()) {
      return readGuestCart()
    }
    return []
  })
  const [subtotal, setSubtotal] = useState(0)
  const [loading, setLoading] = useState(() => Boolean(readToken() && user))
  const syncingRef = useRef(false)

  const isLoggedIn = useCallback(() => Boolean(readToken() && user), [user])

  function applyServerCart(res) {
    const { items: backendItems, subtotal: total } = cartFromBackend(res?.data)
    setItems(backendItems)
    setSubtotal(total)
  }

  // ── Sync from backend ───────────────────────────────────────────────────────
  const syncCart = useCallback(async () => {
    if (!readToken() || !user || syncingRef.current) return
    syncingRef.current = true
    try {
      setLoading(true)
      const res = await cartApi.getCart()
      applyServerCart(res)
    } catch {
      // Silent — keep existing cart state
    } finally {
      setLoading(false)
      syncingRef.current = false
    }
  }, [user])

  // ── Merge guest cart on login ────────────────────────────────────────────────
  const mergeGuestCart = useCallback(async (guestItems) => {
    const itemsToMerge = guestItems?.length ? guestItems : readGuestCart()
    if (!itemsToMerge?.length) {
      await syncCart()
      return
    }

    const mappable = itemsToMerge
      .map((item) => ({
        productId: item.productId || item.id,
        variantId: item.variantId || (item.weight ? item.weight.replace(/\s+/g, '').toLowerCase() : '500g'),
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
    } catch {
      writeGuestCart([])
      await syncCart()
    }
  }, [syncCart])

  // ── Handle user login / logout / init ────────────────────────────────────────
  useEffect(() => {
    const prevUser = prevUserRef.current
    prevUserRef.current = user

    if (!prevUser && user) {
      // User logged in: merge in-memory and stored guest items if any
      setItems((currentItems) => {
        const guestItems = currentItems.filter((it) => !it.itemId)
        const stored = readGuestCart()
        const combined = guestItems.length > 0 ? guestItems : stored
        if (combined.length > 0) {
          mergeGuestCart(combined)
        } else {
          syncCart()
        }
        return currentItems
      })
    } else if (prevUser && !user) {
      // User logged out: clear cart state for strict isolation
      writeGuestCart([])
      setItems([])
      setSubtotal(0)
    } else if (user) {
      syncCart()
    }
  }, [user, mergeGuestCart, syncCart])

  // ── Computed ────────────────────────────────────────────────────────────────
  const count = useMemo(
    () => items.reduce((total, item) => total + item.quantity, 0),
    [items],
  )

  const effectiveSubtotal = useMemo(() => {
    if (isLoggedIn()) return subtotal
    return items.reduce(
      (total, item) => total + (item.lineTotal ?? (Number(item.price) || 0) * (Number(item.quantity) || 1)),
      0,
    )
  }, [isLoggedIn, subtotal, items])

  // ── Add item ────────────────────────────────────────────────────────────────
  const addItem = useCallback(async (product, quantity = 1) => {
    const qty = Math.max(1, Number(quantity) || 1)

    if (!isLoggedIn()) {
      // Guest: in-memory + localStorage
      setItems((current) => {
        const key = lineKey(product)
        const existing = current.find((item) => lineKey(item) === key)
        let updated
        if (existing) {
          updated = current.map((item) =>
            lineKey(item) === key ? { ...item, quantity: item.quantity + qty } : item,
          )
        } else {
          updated = [...current, { ...product, quantity: qty }]
        }
        writeGuestCart(updated)
        return updated
      })
      return
    }

    // Logged in: need productId + variantId
    const productId = product.productId || product.id

    // Find variantId: prefer explicit, else pick first available variant from product.variants
    let variantId = product.variantId
    if (!variantId && Array.isArray(product.variants) && product.variants.length > 0) {
      const firstAvail = product.variants.find((v) => v.stock !== 'out-of-stock') ?? product.variants[0]
      variantId = firstAvail.variantId ?? firstAvail.id
    }
    if (!variantId) {
      // Last fallback: derive from weight
      variantId = (product.weight ?? '500g').replace(/\s+/g, '').toLowerCase()
    }

    if (!productId || !variantId) return

    try {
      const res = await cartApi.addToCart({ productId, variantId, quantity: qty })
      applyServerCart(res)
    } catch (err) {
      console.error('addItem failed:', err.message)
    }
  }, [isLoggedIn])

  // ── Set quantity ─────────────────────────────────────────────────────────────
  const setItemQuantity = useCallback(async (product, quantity) => {
    const qty = Math.max(0, Number(quantity) || 0)

    if (!isLoggedIn()) {
      // Guest: in-memory + localStorage
      setItems((current) => {
        const prodId = product.productId || product.id || product._id
        const key = lineKey(product)
        let updated
        if (qty === 0) {
          updated = current.filter((item) => {
            const itemProdId = item.productId || item.id || item._id
            return lineKey(item) !== key && itemProdId !== prodId
          })
        } else {
          const existing = current.find(
            (item) => lineKey(item) === key || (item.productId || item.id || item._id) === prodId
          )
          if (existing) {
            const matchKey = lineKey(existing)
            updated = current.map((item) => (lineKey(item) === matchKey ? { ...item, quantity: qty } : item))
          } else {
            updated = [...current, { ...product, quantity: qty }]
          }
        }
        writeGuestCart(updated)
        return updated
      })
      return
    }

    // Logged in: resolve itemId (backend cart line _id)
    let itemId = product.itemId
    if (!itemId) {
      const prodId = product.productId || product.id || product._id
      const backendItem = items.find(
        (it) =>
          it.itemId === product.itemId ||
          it.productId === prodId ||
          it.id === prodId ||
          String(it.productId) === String(prodId) ||
          String(it.id) === String(prodId) ||
          (product.slug && it.slug === product.slug)
      )
      itemId = backendItem?.itemId
    }

    if (!itemId) {
      console.warn('setItemQuantity: could not resolve itemId for product', product)
      return
    }

    try {
      if (qty === 0) {
        const res = await cartApi.removeCartItem(itemId)
        applyServerCart(res)
      } else {
        const res = await cartApi.updateCartItem(itemId, qty)
        applyServerCart(res)
      }
    } catch (err) {
      console.error('setItemQuantity failed:', err.message)
    }
  }, [isLoggedIn, items])

  // ── Quantity of ──────────────────────────────────────────────────────────────
  const quantityOf = useCallback((product) => {
    // For logged-in users: search backend cart items by productId or slug
    const productId = product.productId || product.id || product._id
    if (productId) {
      const backendItem = items.find(
        (item) =>
          item.productId === productId ||
          item.id === productId ||
          String(item.productId) === String(productId) ||
          String(item.id) === String(productId) ||
          (product.slug && item.slug === product.slug)
      )
      if (backendItem) return backendItem.quantity
    }
    // Fallback for guest cart: check by key
    const key = lineKey(product)
    return items.find((item) => lineKey(item) === key || (item.productId || item.id) === productId)?.quantity ?? 0
  }, [items])

  // ── Clear cart ───────────────────────────────────────────────────────────────
  const clearCart = useCallback(async () => {
    setItems([])
    setSubtotal(0)
    writeGuestCart([])
    if (!isLoggedIn()) return
    try {
      await cartApi.clearCart()
    } catch (err) {
      console.error('clearCart failed:', err.message)
    }
  }, [isLoggedIn])


  const value = useMemo(
    () => ({
      items,
      count,
      subtotal: effectiveSubtotal,
      loading,
      addItem,
      setItemQuantity,
      quantityOf,
      clearCart,
      syncCart,
      mergeGuestCart,
    }),
    [items, count, effectiveSubtotal, loading, addItem, setItemQuantity, quantityOf, clearCart, syncCart, mergeGuestCart],
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

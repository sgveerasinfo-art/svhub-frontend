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
  // Works for both backend items (itemId + variantId) and guest items (id + weight)
  return item.itemId ? `${item.productId}::${item.variantId}` : `${item.id}::${item.weight ?? ''}`
}

function cartFromBackend(data) {
  if (!data) return { items: [], count: 0, subtotal: 0 }
  return {
    items: Array.isArray(data.items) ? data.items : [],
    count: data.count ?? 0,
    subtotal: data.subtotal ?? 0,
  }
}

// ─── Provider ──────────────────────────────────────────────────────────────────
export function CartProvider({ children }) {
  const { user } = useAuth()
  const prevUserRef = useRef(user)
  const [items, setItems] = useState([])
  const [subtotal, setSubtotal] = useState(0)
  const [loading, setLoading] = useState(false)
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
    if (!guestItems?.length) {
      await syncCart()
      return
    }

    const mappable = guestItems
      .map((item) => ({
        productId: item.productId || item.id,
        variantId: item.variantId || (item.weight ? item.weight.replace(/\s+/g, '').toLowerCase() : '500g'),
        quantity: item.quantity || 1,
      }))
      .filter((item) => item.productId && item.variantId)

    if (!mappable.length) {
      await syncCart()
      return
    }

    try {
      const res = await cartApi.mergeCart(mappable)
      applyServerCart(res)
    } catch {
      await syncCart()
    }
  }, [syncCart])

  // ── Handle user login / logout / init ────────────────────────────────────────
  useEffect(() => {
    const prevUser = prevUserRef.current
    prevUserRef.current = user

    if (!prevUser && user) {
      // User logged in: merge in-memory guest items if any
      setItems((currentItems) => {
        const guestItems = currentItems.filter((it) => !it.itemId)
        if (guestItems.length > 0) {
          mergeGuestCart(guestItems)
        } else {
          syncCart()
        }
        return currentItems
      })
    } else if (prevUser && !user) {
      // User logged out: clear cart state for strict isolation
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

  // ── Add item ────────────────────────────────────────────────────────────────
  const addItem = useCallback(async (product, quantity = 1) => {
    const qty = Math.max(1, Number(quantity) || 1)

    if (!isLoggedIn()) {
      // Guest: in-memory only
      guestItemsRef.current = [...guestItemsRef.current]
      setItems((current) => {
        const key = lineKey(product)
        const existing = current.find((item) => lineKey(item) === key)
        if (existing) {
          return current.map((item) =>
            lineKey(item) === key ? { ...item, quantity: item.quantity + qty } : item,
          )
        }
        return [...current, { ...product, quantity: qty }]
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
      // Guest: in-memory only
      setItems((current) => {
        const key = lineKey(product)
        if (qty === 0) return current.filter((item) => lineKey(item) !== key)
        const existing = current.find((item) => lineKey(item) === key)
        if (existing) {
          return current.map((item) => (lineKey(item) === key ? { ...item, quantity: qty } : item))
        }
        return [...current, { ...product, quantity: qty }]
      })
      return
    }

    // Logged in: use itemId (backend cart line _id)
    const itemId = product.itemId
    if (!itemId) return

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
  }, [isLoggedIn])

  // ── Quantity of ──────────────────────────────────────────────────────────────
  const quantityOf = useCallback((product) => {
    // For logged-in users: search backend cart items by productId
    const productId = product.productId || product.id
    if (productId) {
      const backendItem = items.find((item) => item.productId === productId)
      if (backendItem) return backendItem.quantity
    }
    // Fallback for guest cart: check by key
    const key = lineKey(product)
    return items.find((item) => lineKey(item) === key)?.quantity ?? 0
  }, [items])

  // ── Clear cart ───────────────────────────────────────────────────────────────
  const clearCart = useCallback(async () => {
    setItems([])
    setSubtotal(0)
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
      subtotal,
      loading,
      addItem,
      setItemQuantity,
      quantityOf,
      clearCart,
      syncCart,
      mergeGuestCart,
    }),
    [items, count, subtotal, loading, addItem, setItemQuantity, quantityOf, clearCart, syncCart, mergeGuestCart],
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

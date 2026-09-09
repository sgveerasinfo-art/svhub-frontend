import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  ADMIN_STORAGE_KEY,
  LOW_STOCK_MAX,
  seedAdminStore,
  skuFor,
  slugify,
  stockFromQty,
} from '../data/admin.js'

const AdminStoreContext = createContext(null)

function readStore() {
  try {
    const raw = window.localStorage.getItem(ADMIN_STORAGE_KEY)
    if (!raw) return { data: seedAdminStore(), error: null }
    const parsed = JSON.parse(raw)
    if (!parsed?.products || !parsed?.orders) {
      return { data: seedAdminStore(), error: null }
    }
    return {
      data: {
        ...seedAdminStore(),
        ...parsed,
        settings: { ...seedAdminStore().settings, ...(parsed.settings || {}) },
      },
      error: null,
    }
  } catch {
    return { data: seedAdminStore(), error: 'Could not load saved admin data. Demo catalogue was restored.' }
  }
}

function writeStore(data) {
  try {
    window.localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(data))
  } catch {
    /* ignore quota / private mode */
  }
}

export function AdminStoreProvider({ children }) {
  const [store, setStore] = useState(() => seedAdminStore())
  const [ready, setReady] = useState(false)
  const [bootError, setBootError] = useState('')

  useEffect(() => {
    const loaded = readStore()
    const timer = window.setTimeout(() => {
      setStore(loaded.data)
      setBootError(loaded.error || '')
      setReady(true)
    }, 280)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!ready) return
    writeStore(store)
  }, [ready, store])

  const commit = useCallback((updater) => {
    setStore((current) => (typeof updater === 'function' ? updater(current) : updater))
  }, [])

  const upsertProduct = useCallback((payload) => {
    const qty = Math.max(0, Number(payload.qty) || 0)
    const name = String(payload.name || '').trim()
    const slug = slugify(payload.slug || name) || `product-${Date.now()}`
    const id = payload.id || slug
    const price = Math.max(0, Number(payload.price) || 0)
    const originalPrice =
      payload.originalPrice === undefined
        ? undefined
        : payload.originalPrice
          ? Number(payload.originalPrice)
          : null
    const ingredients = Array.isArray(payload.ingredients)
      ? payload.ingredients.map((item) => String(item).trim()).filter(Boolean)
      : String(payload.ingredients || '')
          .split(/[\n,]/)
          .map((item) => item.trim())
          .filter(Boolean)
    const gallery = Array.isArray(payload.gallery) ? payload.gallery.filter(Boolean) : undefined

    let saved = null
    commit((current) => {
      const existing = current.products.find((item) => item.id === id)
      const nextOriginal = originalPrice !== undefined ? originalPrice : existing?.originalPrice ?? null
      saved = {
        ...existing,
        id,
        slug,
        name,
        type: payload.type ?? existing?.type ?? '',
        category: payload.category || existing?.category || '',
        storefront: payload.storefront || existing?.storefront || 'nutri-hub',
        price,
        originalPrice: nextOriginal,
        discount: nextOriginal && nextOriginal > price ? Math.round((1 - price / nextOriginal) * 100) : null,
        weight: payload.weight ?? existing?.weight ?? '',
        image: payload.image !== undefined ? payload.image : existing?.image ?? '',
        gallery: gallery !== undefined ? gallery : existing?.gallery ?? [],
        sku: payload.sku || existing?.sku || skuFor({ ...payload, id }),
        qty,
        stock: stockFromQty(qty),
        active: payload.active !== undefined ? payload.active !== false : existing?.active !== false,
        description: payload.description ?? existing?.description ?? '',
        ingredients: payload.ingredients !== undefined ? ingredients : existing?.ingredients ?? [],
        details: payload.details ?? existing?.details ?? '',
        updatedAt: new Date().toISOString(),
      }
      return {
        ...current,
        products: existing
          ? current.products.map((item) => (item.id === id ? saved : item))
          : [saved, ...current.products],
      }
    })
    return saved
  }, [commit])

  const removeProduct = useCallback((productId) => {
    commit((current) => ({
      ...current,
      products: current.products.filter((item) => item.id !== productId),
    }))
  }, [commit])

  const adjustInventory = useCallback((productId, qty) => {
    commit((current) => ({
      ...current,
      products: current.products.map((item) =>
        item.id === productId
          ? { ...item, qty: Math.max(0, Number(qty) || 0), stock: stockFromQty(qty) }
          : item,
      ),
    }))
  }, [commit])

  const upsertCategory = useCallback((payload) => {
    let saved = null
    commit((current) => {
      const name = String(payload.name || '').trim()
      const id = payload.id || slugify(payload.slug || name)
      const existing = current.categories.find((item) => item.id === id)
      saved = {
        ...existing,
        id,
        name,
        slug: slugify(payload.slug || existing?.slug || name) || id,
        storefront: payload.storefront || existing?.storefront || 'nutri-hub',
        description: payload.description !== undefined ? payload.description : existing?.description ?? '',
        active: payload.active !== undefined ? payload.active !== false : existing?.active !== false,
        updatedAt: new Date().toISOString(),
      }
      return {
        ...current,
        categories: existing
          ? current.categories.map((item) => (item.id === id ? saved : item))
          : [...current.categories, saved],
      }
    })
    return saved
  }, [commit])

  const removeCategory = useCallback((categoryId) => {
    commit((current) => ({
      ...current,
      categories: current.categories.filter((item) => item.id !== categoryId),
    }))
  }, [commit])

  const updateOrder = useCallback((orderId, patch) => {
    commit((current) => ({
      ...current,
      orders: current.orders.map((order) => (order.id === orderId ? { ...order, ...patch } : order)),
    }))
  }, [commit])

  const updateCustomer = useCallback((customerId, patch) => {
    commit((current) => ({
      ...current,
      customers: current.customers.map((customer) =>
        customer.id === customerId ? { ...customer, ...patch } : customer,
      ),
    }))
  }, [commit])

  const updateSettings = useCallback((settings) => {
    commit((current) => ({ ...current, settings: { ...current.settings, ...settings } }))
  }, [commit])

  const resetStore = useCallback(() => {
    const next = seedAdminStore()
    writeStore(next)
    setStore(next)
    setBootError('')
  }, [])

  const value = useMemo(
    () => ({
      ...store,
      ready,
      bootError,
      lowStockMax: store.settings?.lowStockAlert ?? LOW_STOCK_MAX,
      upsertProduct,
      removeProduct,
      adjustInventory,
      upsertCategory,
      removeCategory,
      updateOrder,
      updateCustomer,
      updateSettings,
      resetStore,
    }),
    [
      store,
      ready,
      bootError,
      upsertProduct,
      removeProduct,
      adjustInventory,
      upsertCategory,
      removeCategory,
      updateOrder,
      updateCustomer,
      updateSettings,
      resetStore,
    ],
  )

  return <AdminStoreContext.Provider value={value}>{children}</AdminStoreContext.Provider>
}

export function useAdminStore() {
  const context = useContext(AdminStoreContext)
  if (!context) throw new Error('useAdminStore must be used within AdminStoreProvider')
  return context
}

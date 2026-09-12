/**
 * Pure cart line helpers — kept free of React for reliable unit tests.
 */

export function lineKey(item) {
  if (!item) return ''
  const prodId = item.productId || item.id || item._id || ''
  const vId = item.variantId || item.weight || ''
  return `${String(prodId)}::${String(vId)}`
}

export function productIdsMatch(a, b) {
  if (a == null || b == null) return false
  return String(a) === String(b)
}

export function resolveVariantId(product) {
  if (!product) return ''
  if (product.variantId) return String(product.variantId)
  if (Array.isArray(product.variants) && product.variants.length > 0) {
    const firstAvail =
      product.variants.find((v) => v.stock !== 'out-of-stock' && v.isActive !== false) ??
      product.variants[0]
    return String(firstAvail.variantId ?? firstAvail.id ?? '')
  }
  if (product.weight) return String(product.weight).replace(/\s+/g, '').toLowerCase()
  return ''
}

export function findCartLine(items, product) {
  if (!product || !Array.isArray(items)) return undefined

  if (product.itemId) {
    const byItemId = items.find((item) => String(item.itemId) === String(product.itemId))
    if (byItemId) return byItemId
  }

  const key = lineKey({
    ...product,
    variantId: product.variantId || resolveVariantId(product),
  })
  const byKey = items.find((item) => lineKey(item) === key)
  if (byKey) return byKey

  // Only fall back to productId when the product has no variant identity.
  const hasVariantHint = Boolean(product.variantId || product.weight || product.variants?.length)
  if (hasVariantHint) return undefined

  const prodId = product.productId || product.id || product._id
  return items.find(
    (item) =>
      productIdsMatch(item.productId, prodId) ||
      productIdsMatch(item.id, prodId) ||
      (product.slug && item.slug === product.slug),
  )
}

export function lineUnitPrice(item) {
  return Number(item?.price) || 0
}

export function computeCartSubtotal(items = []) {
  return items.reduce((total, item) => {
    if (item.lineTotal != null && Number.isFinite(Number(item.lineTotal))) {
      return total + Number(item.lineTotal)
    }
    return total + lineUnitPrice(item) * (Number(item.quantity) || 0)
  }, 0)
}

export function withUpdatedLineTotals(items = []) {
  return items.map((item) => ({
    ...item,
    lineTotal: lineUnitPrice(item) * (Number(item.quantity) || 0),
  }))
}

export function applyLocalQuantity(items, product, quantity) {
  const qty = Math.max(0, Number(quantity) || 0)
  const key = lineKey({
    ...product,
    variantId: product.variantId || resolveVariantId(product),
  })

  if (qty === 0) {
    return withUpdatedLineTotals(items.filter((item) => lineKey(item) !== key))
  }

  const existing = findCartLine(items, product)
  if (existing) {
    const existingKey = lineKey(existing)
    return withUpdatedLineTotals(
      items.map((item) =>
        lineKey(item) === existingKey ? { ...item, quantity: qty } : item,
      ),
    )
  }

  return withUpdatedLineTotals([
    ...items,
    {
      ...product,
      productId: product.productId || product.id || product._id,
      variantId: product.variantId || resolveVariantId(product),
      quantity: qty,
    },
  ])
}

export function applyLocalAdd(items, product, quantity = 1) {
  const qty = Math.max(1, Number(quantity) || 1)
  const key = lineKey({
    ...product,
    variantId: product.variantId || resolveVariantId(product),
  })
  const existing = items.find((item) => lineKey(item) === key)

  if (existing) {
    return withUpdatedLineTotals(
      items.map((item) =>
        lineKey(item) === key
          ? { ...item, quantity: (Number(item.quantity) || 0) + qty }
          : item,
      ),
    )
  }

  return withUpdatedLineTotals([
    ...items,
    {
      ...product,
      productId: product.productId || product.id || product._id,
      variantId: product.variantId || resolveVariantId(product),
      quantity: qty,
    },
  ])
}

export function maxAllowedForProduct(product, currentLine) {
  const candidates = [
    currentLine?.maxAllowed,
    currentLine?.availableStock,
    product?.maxAllowed,
    product?.availableStock,
  ]
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value) && value >= 0)

  if (candidates.length === 0) return 99
  return Math.min(99, ...candidates)
}

/**
 * Coalescing sync queue: rapid absolute quantity updates keep the latest desired
 * target and never let an older response overwrite newer local intent.
 */
export function createQuantitySyncQueue({ update, remove, onSuccess, onError }) {
  const state = new Map()

  async function flush(key) {
    const entry = state.get(key)
    if (!entry || entry.inFlight) return

    entry.inFlight = true

    try {
      while (state.has(key)) {
        const current = state.get(key)
        const desired = current.desiredQty
        const gen = current.gen
        const itemId = current.itemId

        try {
          const res =
            desired === 0 ? await remove(itemId) : await update(itemId, desired)

          const latest = state.get(key)
          if (!latest || latest.gen !== gen || latest.desiredQty !== desired) {
            // Newer intent exists — ignore this response body and sync again.
            continue
          }

          state.delete(key)
          onSuccess?.(res, { key, itemId, quantity: desired })
          break
        } catch (error) {
          state.delete(key)
          onError?.(error, { key, itemId, quantity: desired, snapshot: current.snapshot })
          break
        }
      }
    } finally {
      const leftover = state.get(key)
      if (leftover) leftover.inFlight = false
    }
  }

  return {
    enqueue({ key, itemId, quantity, snapshot }) {
      const existing = state.get(key) || { gen: 0, inFlight: false }
      existing.desiredQty = quantity
      existing.itemId = itemId
      existing.gen = (existing.gen || 0) + 1
      if (snapshot && !existing.snapshot) existing.snapshot = snapshot
      state.set(key, existing)
      return flush(key)
    },
    hasPending(key) {
      return state.has(key)
    },
    clear(key) {
      if (key) state.delete(key)
      else state.clear()
    },
    pendingCount() {
      return state.size
    },
  }
}

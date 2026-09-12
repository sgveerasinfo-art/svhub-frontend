import assert from 'node:assert/strict'
import {
  applyLocalAdd,
  applyLocalQuantity,
  computeCartSubtotal,
  createQuantitySyncQueue,
  findCartLine,
  lineKey,
  maxAllowedForProduct,
} from '../src/utils/cartLine.js'

// --- Identity / variant matching ---
const items = [
  { itemId: 'a1', productId: 'p1', variantId: '500g', quantity: 2, price: 100 },
  { itemId: 'a2', productId: 'p1', variantId: '1kg', quantity: 1, price: 180 },
]

assert.equal(lineKey(items[0]), 'p1::500g')
assert.equal(findCartLine(items, { productId: 'p1', variantId: '1kg' })?.itemId, 'a2')
assert.equal(findCartLine(items, { productId: 'p1', variantId: '500g' })?.quantity, 2)
assert.equal(findCartLine(items, { itemId: 'a1' })?.variantId, '500g')
// Must not collapse variants to the first product match
assert.notEqual(findCartLine(items, { productId: 'p1', variantId: '1kg' })?.itemId, 'a1')

// --- Local quantity / remove only matching variant ---
const removed = applyLocalQuantity(items, { productId: 'p1', variantId: '500g' }, 0)
assert.equal(removed.length, 1)
assert.equal(removed[0].variantId, '1kg')

const bumped = applyLocalQuantity(items, { productId: 'p1', variantId: '500g' }, 5)
assert.equal(bumped.find((i) => i.variantId === '500g').quantity, 5)
assert.equal(bumped.find((i) => i.variantId === '1kg').quantity, 1)

const added = applyLocalAdd(items, { productId: 'p1', variantId: '500g', price: 100 }, 3)
assert.equal(added.find((i) => i.variantId === '500g').quantity, 5)
assert.equal(computeCartSubtotal(added), 5 * 100 + 1 * 180)

// --- Stock max ---
assert.equal(maxAllowedForProduct({}, { maxAllowed: 5, availableStock: 8 }), 5)
assert.equal(maxAllowedForProduct({ availableStock: 3 }, null), 3)

// --- Coalescing queue: rapid absolute updates keep latest; stale responses ignored ---
const calls = []
let resolveUpdate
const updatePromise = new Promise((resolve) => {
  resolveUpdate = resolve
})

const queue = createQuantitySyncQueue({
  update: async (itemId, quantity) => {
    calls.push({ itemId, quantity })
    if (calls.length === 1) {
      await updatePromise
      return { data: { items: [{ itemId, quantity }], subtotal: quantity * 10, count: quantity } }
    }
    return { data: { items: [{ itemId, quantity }], subtotal: quantity * 10, count: quantity } }
  },
  remove: async () => ({ data: { items: [], subtotal: 0, count: 0 } }),
  onSuccess: (res) => {
    calls.push({ successQty: res.data.items[0]?.quantity ?? 0 })
  },
  onError: () => {
    calls.push({ error: true })
  },
})

const p1 = queue.enqueue({ key: 'p1::500g', itemId: 'a1', quantity: 2, snapshot: items })
const p2 = queue.enqueue({ key: 'p1::500g', itemId: 'a1', quantity: 3, snapshot: items })
const p3 = queue.enqueue({ key: 'p1::500g', itemId: 'a1', quantity: 6, snapshot: items })

// First request still in flight with desired evolving to 6
assert.equal(calls.length, 1)
assert.equal(calls[0].quantity, 2)

resolveUpdate()
await Promise.all([p1, p2, p3])

// After first resolves, queue should sync the latest desired (6), not apply stale 2 as final success alone
assert.ok(calls.some((c) => c.quantity === 6))
assert.equal(calls.filter((c) => c.successQty != null).at(-1).successQty, 6)

// --- Queue error path ---
const errCalls = []
const errQueue = createQuantitySyncQueue({
  update: async () => {
    throw Object.assign(new Error('Only 4 available.'), { code: 'insufficient_stock' })
  },
  remove: async () => ({}),
  onSuccess: () => errCalls.push('success'),
  onError: (error) => errCalls.push(error.code),
})

await errQueue.enqueue({ key: 'x', itemId: 'y', quantity: 9, snapshot: [] })
assert.deepEqual(errCalls, ['insufficient_stock'])

// --- Simulate rapid adjust against a mutable ref (frontend contract) ---
let liveItems = [{ itemId: 'a1', productId: 'p1', variantId: '500g', quantity: 1, price: 50 }]
for (let i = 0; i < 5; i += 1) {
  const current = findCartLine(liveItems, { productId: 'p1', variantId: '500g' }).quantity
  liveItems = applyLocalQuantity(liveItems, { productId: 'p1', variantId: '500g' }, current + 1)
}
assert.equal(liveItems[0].quantity, 6)

liveItems = applyLocalQuantity(liveItems, { productId: 'p1', variantId: '500g' }, liveItems[0].quantity - 1)
liveItems = applyLocalQuantity(liveItems, { productId: 'p1', variantId: '500g' }, liveItems[0].quantity - 1)
liveItems = applyLocalQuantity(liveItems, { productId: 'p1', variantId: '500g' }, liveItems[0].quantity + 1)
liveItems = applyLocalQuantity(liveItems, { productId: 'p1', variantId: '500g' }, liveItems[0].quantity + 1)
liveItems = applyLocalQuantity(liveItems, { productId: 'p1', variantId: '500g' }, liveItems[0].quantity - 1)
liveItems = applyLocalQuantity(liveItems, { productId: 'p1', variantId: '500g' }, liveItems[0].quantity - 1)
liveItems = applyLocalQuantity(liveItems, { productId: 'p1', variantId: '500g' }, liveItems[0].quantity + 1)
// Start 6; - - + + - - + => 5
assert.equal(liveItems[0].quantity, 5)

console.log('cartLine + quantity sync queue: all cases passed')

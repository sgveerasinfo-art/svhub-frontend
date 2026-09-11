/**
 * src/api/orders.js
 * Customer Orders API — all endpoints require authentication.
 */

import { apiFetch } from './client.js'

/**
 * Create a new order from the authenticated user's cart.
 * @param {Object} options
 * @param {string} [options.addressId]       - Saved address MongoDB ObjectId
 * @param {Object} [options.shippingAddress] - Inline address (if no addressId)
 * @param {string} [options.shippingMethod]  - 'standard' | 'express'
 * @param {string} [options.notes]           - Optional order notes
 */
export async function createOrder({ addressId, shippingAddress, shippingMethod = 'standard', notes = '' } = {}) {
  return apiFetch('/orders', {
    method: 'POST',
    body: { addressId, shippingAddress, shippingMethod, notes },
    auth: true,
  })
}

/**
 * Get the authenticated user's order history.
 * @param {number} [limit=20]
 */
export async function getOrders(limit = 20) {
  return apiFetch(`/orders?limit=${limit}`, { auth: true })
}

/**
 * Get a single order by MongoDB ObjectId or orderNumber.
 * @param {string} id
 */
export async function getOrder(id) {
  return apiFetch(`/orders/${encodeURIComponent(id)}`, { auth: true })
}

/**
 * Cancel a customer order.
 * @param {string} id - Order MongoDB ObjectId
 * @param {string} [reason] - Optional cancellation reason
 */
export async function cancelOrder(id, reason = '') {
  return apiFetch(`/orders/${encodeURIComponent(id)}/cancel`, {
    method: 'POST',
    body: { reason },
    auth: true,
  })
}

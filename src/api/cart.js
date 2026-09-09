/**
 * src/api/cart.js
 * Cart API — all endpoints require authentication.
 */

import { apiFetch } from './client.js'

/** Get the authenticated user's cart. */
export async function getCart() {
  return apiFetch('/cart', { auth: true })
}

/**
 * Add an item to the cart.
 * @param {{ productId: string, variantId: string, quantity?: number }} item
 */
export async function addToCart({ productId, variantId, quantity = 1 }) {
  return apiFetch('/cart/items', {
    method: 'POST',
    body: { productId, variantId, quantity },
    auth: true,
  })
}

/**
 * Update the quantity of a cart line item.
 * @param {string} itemId - Cart line item _id
 * @param {number} quantity - New quantity (0 = remove)
 */
export async function updateCartItem(itemId, quantity) {
  return apiFetch(`/cart/items/${encodeURIComponent(itemId)}`, {
    method: 'PATCH',
    body: { quantity },
    auth: true,
  })
}

/**
 * Remove a cart line item.
 * @param {string} itemId - Cart line item _id or variantId
 */
export async function removeCartItem(itemId) {
  return apiFetch(`/cart/items/${encodeURIComponent(itemId)}`, {
    method: 'DELETE',
    auth: true,
  })
}

/** Clear all cart items. */
export async function clearCart() {
  return apiFetch('/cart', {
    method: 'DELETE',
    auth: true,
  })
}

/**
 * Merge guest cart items into the server cart on login.
 * @param {Array<{ productId: string, variantId: string, quantity: number }>} items
 */
export async function mergeCart(items) {
  return apiFetch('/cart/merge', {
    method: 'POST',
    body: { items },
    auth: true,
  })
}

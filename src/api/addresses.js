/**
 * src/api/addresses.js
 * Addresses API — all endpoints require authentication.
 */

import { apiFetch } from './client.js'

/** Get all saved addresses for the authenticated user. */
export async function getAddresses() {
  return apiFetch('/addresses', { auth: true })
}

/**
 * Create a new address.
 * @param {{ name: string, phone: string, street: string, city: string, state: string, pin: string }} data
 */
export async function createAddress(data) {
  return apiFetch('/addresses', {
    method: 'POST',
    body: data,
    auth: true,
  })
}

/**
 * Update an existing address.
 * @param {string} id - Address MongoDB ObjectId
 * @param {Object} data
 */
export async function updateAddress(id, data) {
  return apiFetch(`/addresses/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: data,
    auth: true,
  })
}

/**
 * Delete an address.
 * @param {string} id - Address MongoDB ObjectId
 */
export async function deleteAddress(id) {
  return apiFetch(`/addresses/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    auth: true,
  })
}

/**
 * Set an address as the default.
 * @param {string} id - Address MongoDB ObjectId
 */
export async function setDefaultAddress(id) {
  return apiFetch(`/addresses/${encodeURIComponent(id)}/default`, {
    method: 'PATCH',
    auth: true,
  })
}

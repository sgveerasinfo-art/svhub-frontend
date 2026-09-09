/**
 * src/api/categories.js
 * Categories API — public catalog, no auth required.
 */

import { apiFetch } from './client.js'

/**
 * List active categories.
 * @param {string} storefront - Optional storefront filter ('nutri-hub' | 'self-care' | 'all')
 */
export async function getCategories(storefront = '') {
  const params = new URLSearchParams()
  if (storefront && storefront !== 'all') {
    params.set('storefront', storefront)
  }
  const query = params.toString()
  return apiFetch(`/categories${query ? `?${query}` : ''}`)
}

/**
 * Get category detail by slug or ID.
 * @param {string} slugOrId
 */
export async function getCategory(slugOrId) {
  return apiFetch(`/categories/${encodeURIComponent(slugOrId)}`)
}

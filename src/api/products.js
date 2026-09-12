/**
 * src/api/products.js
 * Products API — public catalog, no auth required.
 */

import { apiFetch } from './client.js'

/**
 * List products with server-side filtering, sorting, and pagination.
 * @param {Object} filters
 */
export async function getProducts(filters = {}) {
  const params = new URLSearchParams()

  if (filters.q?.trim()) params.set('search', filters.q.trim())
  if (filters.storefront && filters.storefront !== 'all') params.set('storefront', filters.storefront)
  if (filters.categoryIds?.length) params.set('category', filters.categoryIds[0])

  // Price range mapping
  if (filters.price && filters.price !== 'all') {
    if (filters.price === 'under-200') params.set('max', '199')
    else if (filters.price === '200-250') { params.set('min', '200'); params.set('max', '250') }
    else if (filters.price === 'over-250') params.set('min', '251')
  }

  // Sort: map frontend sort keys to backend keys
  const sortMap = {
    'price-asc': 'price-asc',
    'price-desc': 'price-desc',
    'name': 'name-asc',
    'newest': 'newest',
    'discount': 'price-asc', // best approximation
    'featured': 'featured',
  }
  const sortVal = sortMap[filters.sort] || 'featured'
  if (sortVal !== 'featured') params.set('sort', sortVal)

  if (filters.page && filters.page > 1) params.set('page', String(filters.page))
  if (filters.limit) params.set('limit', String(filters.limit))

  const query = params.toString()
  return apiFetch(`/products${query ? `?${query}` : ''}`, {
    signal: filters.signal,
  })
}

/**
 * Get featured products.
 */
export async function getFeaturedProducts(limit = 8) {
  return apiFetch(`/products/featured?limit=${limit}`)
}

/**
 * Get a single product by slug or MongoDB ObjectId.
 */
export async function getProduct(slugOrId) {
  return apiFetch(`/products/${encodeURIComponent(slugOrId)}`)
}

/**
 * Get related products for a given product slug or id.
 */
export async function getRelatedProducts(slugOrId, limit = 4) {
  return apiFetch(`/products/${encodeURIComponent(slugOrId)}/related?limit=${limit}`)
}

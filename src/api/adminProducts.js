import { readToken } from './auth.js'

const API_URL = import.meta.env.VITE_API_URL || '/api'

export class AdminApiError extends Error {
  constructor(code, message, status) {
    super(message)
    this.name = 'AdminApiError'
    this.code = code
    this.status = status
  }
}

async function adminRequest(path, { method = 'GET', body, query } = {}) {
  let queryString = ''
  if (query && typeof query === 'object') {
    const searchParams = new URLSearchParams()
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '' && value !== 'all') {
        searchParams.set(key, String(value))
      }
    }
    const qs = searchParams.toString()
    if (qs) queryString = `?${qs}`
  }

  const token = readToken()
  const headers = {
    Accept: 'application/json',
    ...(body ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }

  let response
  try {
    response = await fetch(`${API_URL}${path}${queryString}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new AdminApiError('network', 'Could not connect to the SV Hub server. Check your connection.', 0)
  }

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const errorObj = data.error || data
    throw new AdminApiError(
      errorObj.code || `http_${response.status}`,
      errorObj.message || 'Request failed.',
      response.status,
    )
  }

  return data
}

/**
 * List products for admin with filters and pagination.
 */
export async function getAdminProducts(query = {}) {
  return adminRequest('/admin/products', { query })
}

/**
 * Get product detail by ID or slug for admin.
 */
export async function getAdminProduct(id) {
  return adminRequest(`/admin/products/${encodeURIComponent(id)}`)
}

/**
 * Create a new product.
 */
export async function createAdminProduct(payload) {
  return adminRequest('/admin/products', {
    method: 'POST',
    body: payload,
  })
}

/**
 * Update product details.
 */
export async function updateAdminProduct(id, payload) {
  return adminRequest(`/admin/products/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: payload,
  })
}

/**
 * Deactivate / delete product safely.
 */
export async function deleteAdminProduct(id) {
  return adminRequest(`/admin/products/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}

/**
 * Update variant or product inventory stock.
 */
export async function updateAdminInventory(id, { qty, stock, variantId } = {}) {
  return adminRequest(`/admin/products/${encodeURIComponent(id)}/inventory`, {
    method: 'PATCH',
    body: {
      stock: qty !== undefined ? qty : stock,
      ...(variantId ? { variantId } : {}),
    },
  })
}

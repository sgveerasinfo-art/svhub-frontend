import { apiFetch } from './client.js'

export class AdminApiError extends Error {
  constructor(code, message, status) {
    super(message)
    this.name = 'AdminApiError'
    this.code = code
    this.status = status
  }
}

async function adminRequest(path, { method = 'GET', body, query } = {}) {
  try {
    return await apiFetch(path, { method, body, query, auth: true })
  } catch (error) {
    throw new AdminApiError(
      error.code || 'server_error',
      error.message || 'Request failed.',
      error.status || 0,
    )
  }
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

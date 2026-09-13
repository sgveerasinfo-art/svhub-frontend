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
 * List all categories for admin.
 */
export async function getAdminCategories(query = {}) {
  return adminRequest('/admin/categories', { query })
}

/**
 * Get category detail by ID or slug for admin.
 */
export async function getAdminCategory(id) {
  return adminRequest(`/admin/categories/${encodeURIComponent(id)}`)
}

/**
 * Create a new category.
 */
export async function createAdminCategory(payload) {
  return adminRequest('/admin/categories', {
    method: 'POST',
    body: payload,
  })
}

/**
 * Update category details.
 */
export async function updateAdminCategory(id, payload) {
  return adminRequest(`/admin/categories/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: payload,
  })
}

/**
 * Delete / deactivate category.
 */
export async function deleteAdminCategory(id) {
  return adminRequest(`/admin/categories/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}

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

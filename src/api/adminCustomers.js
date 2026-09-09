import { readToken } from './auth.js'

const API_URL = import.meta.env.VITE_API_URL || '/api'

export class AdminCustomerApiError extends Error {
  constructor(code, message, status) {
    super(message)
    this.name = 'AdminCustomerApiError'
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
    throw new AdminCustomerApiError('network', 'Could not connect to the SV Hub server.', 0)
  }

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const errorObj = data.error || data
    throw new AdminCustomerApiError(
      errorObj.code || `http_${response.status}`,
      errorObj.message || 'Request failed.',
      response.status,
    )
  }

  return data
}

/**
 * List customers with optional search, filtering, and sorting
 */
export async function getAdminCustomers(query = {}) {
  return adminRequest('/admin/customers', { query })
}

/**
 * Get detailed customer profile with order history and addresses
 */
export async function getAdminCustomer(id) {
  return adminRequest(`/admin/customers/${encodeURIComponent(id)}`)
}

/**
 * Update administrative customer information (name, phone, status, notes)
 */
export async function updateAdminCustomer(id, payload) {
  return adminRequest(`/admin/customers/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: payload,
  })
}

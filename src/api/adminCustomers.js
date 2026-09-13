import { apiFetch } from './client.js'

export class AdminCustomerApiError extends Error {
  constructor(code, message, status) {
    super(message)
    this.name = 'AdminCustomerApiError'
    this.code = code
    this.status = status
  }
}

async function adminRequest(path, { method = 'GET', body, query } = {}) {
  try {
    return await apiFetch(path, { method, body, query, auth: true })
  } catch (error) {
    throw new AdminCustomerApiError(
      error.code || 'server_error',
      error.message || 'Request failed.',
      error.status || 0,
    )
  }
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

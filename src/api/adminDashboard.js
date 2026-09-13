import { apiFetch } from './client.js'

export class AdminDashboardApiError extends Error {
  constructor(code, message, status) {
    super(message)
    this.name = 'AdminDashboardApiError'
    this.code = code
    this.status = status
  }
}

/**
 * Fetch real-time dashboard analytics from MongoDB backend
 */
export async function getAdminDashboard(query = {}) {
  try {
    return await apiFetch('/admin/dashboard', { auth: true, query })
  } catch (error) {
    throw new AdminDashboardApiError(
      error.code || 'server_error',
      error.message || 'Request failed.',
      error.status || 0,
    )
  }
}

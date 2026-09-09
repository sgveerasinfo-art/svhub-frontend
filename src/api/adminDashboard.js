import { readToken } from './auth.js'

const API_URL = import.meta.env.VITE_API_URL || '/api'

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
  let queryString = ''
  if (query && typeof query === 'object') {
    const searchParams = new URLSearchParams()
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.set(key, String(value))
      }
    }
    const qs = searchParams.toString()
    if (qs) queryString = `?${qs}`
  }

  const token = readToken()
  const headers = {
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }

  let response
  try {
    response = await fetch(`${API_URL}/admin/dashboard${queryString}`, {
      method: 'GET',
      headers,
    })
  } catch {
    throw new AdminDashboardApiError('network', 'Could not connect to the SV Hub server.', 0)
  }

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const errorObj = data.error || data
    throw new AdminDashboardApiError(
      errorObj.code || `http_${response.status}`,
      errorObj.message || 'Request failed.',
      response.status,
    )
  }

  return data
}

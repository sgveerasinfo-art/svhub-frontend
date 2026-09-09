import { readToken } from './auth.js'

const API_URL = import.meta.env.VITE_API_URL || '/api'

export class AdminSettingsApiError extends Error {
  constructor(code, message, status) {
    super(message)
    this.name = 'AdminSettingsApiError'
    this.code = code
    this.status = status
  }
}

/**
 * Fetch administrative store settings from backend
 */
export async function getAdminSettings() {
  const token = readToken()
  const headers = {
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }

  let response
  try {
    response = await fetch(`${API_URL}/admin/settings`, {
      method: 'GET',
      headers,
    })
  } catch {
    throw new AdminSettingsApiError('network', 'Could not connect to the SV Hub server.', 0)
  }

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const errorObj = data.error || data
    throw new AdminSettingsApiError(
      errorObj.code || `http_${response.status}`,
      errorObj.message || 'Request failed.',
      response.status,
    )
  }

  return data
}

/**
 * Update administrative store settings in MongoDB
 */
export async function updateAdminSettings(payload) {
  const token = readToken()
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }

  let response
  try {
    response = await fetch(`${API_URL}/admin/settings`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(payload),
    })
  } catch {
    throw new AdminSettingsApiError('network', 'Could not connect to the SV Hub server.', 0)
  }

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const errorObj = data.error || data
    throw new AdminSettingsApiError(
      errorObj.code || `http_${response.status}`,
      errorObj.message || 'Request failed.',
      response.status,
    )
  }

  return data
}

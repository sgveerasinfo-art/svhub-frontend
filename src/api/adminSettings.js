import { apiFetch } from './client.js'

export class AdminSettingsApiError extends Error {
  constructor(code, message, status) {
    super(message)
    this.name = 'AdminSettingsApiError'
    this.code = code
    this.status = status
  }
}

async function settingsRequest(path, options = {}) {
  try {
    return await apiFetch(path, { auth: true, ...options })
  } catch (error) {
    throw new AdminSettingsApiError(
      error.code || 'server_error',
      error.message || 'Request failed.',
      error.status || 0,
    )
  }
}

export async function getAdminSettings() {
  return settingsRequest('/admin/settings')
}

export async function updateAdminSettings(payload) {
  return settingsRequest('/admin/settings', {
    method: 'PATCH',
    body: payload,
  })
}

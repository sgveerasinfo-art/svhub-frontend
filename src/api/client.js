/**
 * src/api/client.js
 * Shared API client with auth token injection.
 */

const API_URL = import.meta.env.VITE_API_URL || '/api'
const SESSION_KEY = 'svhub.auth.session'

export class ApiError extends Error {
  constructor(code, message, status) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
  }
}

export function readToken() {
  try {
    const raw = window.localStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw)?.token ?? '') : ''
  } catch {
    return ''
  }
}

export async function apiFetch(path, { method = 'GET', body, auth = false, signal } = {}) {
  const token = auth ? readToken() : ''

  let response
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      signal,
      headers: {
        Accept: 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch (error) {
    if (error?.name === 'AbortError') throw error
    throw new ApiError('network', 'Could not reach SV Hub. Check your connection.', 0)
  }

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const code = data?.error?.code || data?.code || 'server_error'
    const message = data?.error?.message || data?.message || 'Something went wrong.'
    throw new ApiError(code, message, response.status)
  }

  return data
}

export async function getHealth() {
  return apiFetch('/health')
}

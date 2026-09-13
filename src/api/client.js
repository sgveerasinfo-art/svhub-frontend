/**
 * src/api/client.js
 * Shared API client with auth token injection.
 */

const API_URL = import.meta.env.VITE_API_URL || '/api'
const SESSION_KEY = 'svhub.auth.session'
const SESSION_INVALID_CODES = new Set(['session_revoked', 'token_expired', 'invalid_token', 'unauthenticated'])

export const SESSION_INVALID_EVENT = 'svhub:session-invalid'

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

export function clearStoredSession() {
  try {
    window.localStorage.removeItem(SESSION_KEY)
  } catch {
    /* ignore */
  }
}

export function notifyIfSessionInvalid(status, code, { hadToken = false } = {}) {
  if (!hadToken || Number(status) !== 401) return
  if (!SESSION_INVALID_CODES.has(String(code || ''))) return
  clearStoredSession()
  try {
    window.sessionStorage.setItem(
      'svhub.auth.notice',
      'Your session is no longer valid. Please log in again.',
    )
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent(SESSION_INVALID_EVENT, { detail: { code } }))
}

function toQueryString(query) {
  if (!query || typeof query !== 'object') return ''
  const searchParams = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '' || value === 'all') continue
    searchParams.set(key, String(value))
  }
  const qs = searchParams.toString()
  return qs ? `?${qs}` : ''
}

export async function apiFetch(path, { method = 'GET', body, auth = false, signal, query } = {}) {
  const token = auth ? readToken() : ''
  const url = `${API_URL}${path}${toQueryString(query)}`

  let response
  try {
    response = await fetch(url, {
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
    notifyIfSessionInvalid(response.status, code, { hadToken: Boolean(token) })
    throw new ApiError(code, message, response.status)
  }

  return data
}

export async function getHealth() {
  return apiFetch('/health')
}

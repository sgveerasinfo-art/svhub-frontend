import { getHealth, notifyIfSessionInvalid } from './client.js'

const API_URL = import.meta.env.VITE_API_URL || '/api'
const SESSION_KEY = 'svhub.auth.session'

export class AuthError extends Error {
  constructor(code, message) {
    super(message)
    this.name = 'AuthError'
    this.code = code
  }
}

function readJson(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function saveSession(user, token) {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify({ user, token }))
}

export function readSession() {
  return readJson(SESSION_KEY, null)?.user ?? null
}

export function readToken() {
  return readJson(SESSION_KEY, null)?.token ?? ''
}

async function request(path, { method = 'POST', body, auth = false } = {}) {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    throw new AuthError('network', 'We couldn’t reach SV Hub. Check your connection and try again.')
  }

  const token = auth ? readToken() : ''
  let response
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new AuthError('network', 'We couldn’t reach SV Hub. Check your connection and try again.')
  }

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const code = data.code || 'server'
    notifyIfSessionInvalid(response.status, code, { hadToken: Boolean(token) })
    throw new AuthError(code, data.message || 'Something went wrong. Please try again.')
  }

  return data
}

export async function login({ email, identifier, password }) {
  const data = await request('/auth/login', {
    body: { identifier: identifier || email, password },
  })
  saveSession(data.user, data.token)
  return data.user
}

export async function loginWithGoogle(idToken) {
  const data = await request('/auth/google', { body: { idToken } })
  saveSession(data.user, data.token)
  return { user: data.user, created: Boolean(data.created) }
}

export async function register({ name, email, phone, password }) {
  const data = await request('/auth/register', { body: { name, email, phone, password } })
  return data.user
}

export async function requestReset(email) {
  return request('/auth/forgot-password', { body: { email } })
}

export async function inspectResetToken(token) {
  const query = new URLSearchParams({ token }).toString()
  return request(`/auth/reset-password?${query}`, { method: 'GET' })
}

export async function resetPassword({ token, password }) {
  return request('/auth/reset-password', { body: { token, password } })
}

export async function updateProfile(payload) {
  const data = await request('/auth/profile', { method: 'PATCH', body: payload, auth: true })
  saveSession(data.user, readToken())
  return data.user
}

export function logout() {
  window.localStorage.removeItem(SESSION_KEY)
}

export { getHealth }

import { emailError } from './authValidation.js'

const ADMIN_GATE_KEY = 'svhub.admin.gate'
const LOCAL_ADMIN_USER = 'admin'
const LOCAL_ADMIN_PASS = 'admin123'

function readJson(key) {
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function allowedAdminEmails() {
  return String(import.meta.env.VITE_ADMIN_EMAILS || '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
}

export function normalizeAdminIdentifier(value = '') {
  return String(value).trim().toLowerCase()
}

export function adminIdentifierError(value = '') {
  const identifier = String(value).trim()
  if (!identifier) return 'Enter your email or username.'
  if (normalizeAdminIdentifier(identifier) === LOCAL_ADMIN_USER) return ''
  return emailError(identifier)
}

export function isLocalAdminCredentials(identifier, password) {
  return normalizeAdminIdentifier(identifier) === LOCAL_ADMIN_USER && password === LOCAL_ADMIN_PASS
}

export function isLocalAdminUsername(identifier) {
  return normalizeAdminIdentifier(identifier) === LOCAL_ADMIN_USER
}

export function isAllowedAdminEmail(email = '') {
  const allow = allowedAdminEmails()
  if (!allow.length) return true
  return allow.includes(String(email).trim().toLowerCase())
}

export function readAdminGate() {
  return readJson(ADMIN_GATE_KEY)
}

export function grantAdminAccess(user, extra = {}) {
  window.localStorage.setItem(
    ADMIN_GATE_KEY,
    JSON.stringify({
      email: user?.email || '',
      at: Date.now(),
      ...extra,
    }),
  )
}

export function grantLocalAdminAccess() {
  grantAdminAccess({ email: LOCAL_ADMIN_USER }, { kind: 'local' })
}

export function revokeAdminAccess() {
  window.localStorage.removeItem(ADMIN_GATE_KEY)
}

export function hasAdminAccess(user) {
  if (!user) return false
  if (String(user.role || '').toUpperCase() === 'ADMIN') return true
  const gate = readAdminGate()
  if (!gate) return false
  if (gate.email && user.email && gate.email.toLowerCase() !== String(user.email).toLowerCase()) {
    return false
  }
  return isAllowedAdminEmail(user.email)
}

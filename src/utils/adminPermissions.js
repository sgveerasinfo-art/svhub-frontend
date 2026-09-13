import { emailError } from './authValidation.js'

export const STAFF_ROLES = ['ADMIN', 'SUPER_ADMIN']

export const PERMISSIONS = {
  DASHBOARD_VIEW: 'dashboard:view',
  PRODUCTS_MANAGE: 'products:manage',
  CATEGORIES_MANAGE: 'categories:manage',
  ORDERS_MANAGE: 'orders:manage',
  CUSTOMERS_MANAGE: 'customers:manage',
  INVENTORY_MANAGE: 'inventory:manage',
  SETTINGS_MANAGE: 'settings:manage',
  COUPONS_MANAGE: 'coupons:manage',
  ACCESS_MANAGE: 'access:manage',
  AUDIT_VIEW: 'audit:view',
}

export function normalizeRole(role) {
  return String(role || '').toUpperCase()
}

export function isStaffRole(role) {
  return STAFF_ROLES.includes(normalizeRole(role))
}

export function isSuperAdmin(userOrRole) {
  const role = typeof userOrRole === 'string' ? userOrRole : userOrRole?.role
  return normalizeRole(role) === 'SUPER_ADMIN'
}

export function permissionsOf(user) {
  if (Array.isArray(user?.permissions) && user.permissions.length) {
    return user.permissions
  }
  const role = normalizeRole(user?.role)
  if (role === 'SUPER_ADMIN') {
    return Object.values(PERMISSIONS)
  }
  if (role === 'ADMIN') {
    return Object.values(PERMISSIONS).filter(
      (value) => value !== PERMISSIONS.ACCESS_MANAGE && value !== PERMISSIONS.AUDIT_VIEW,
    )
  }
  return []
}

export function hasPermission(user, permission) {
  return permissionsOf(user).includes(permission)
}

/** Backend-derived staff access only — never trust localStorage gates. */
export function hasAdminAccess(user) {
  return Boolean(user && isStaffRole(user.role))
}

export function adminIdentifierError(value = '') {
  return emailError(value)
}

export function roleLabel(role) {
  const normalized = normalizeRole(role)
  if (normalized === 'SUPER_ADMIN') return 'Super Admin'
  if (normalized === 'ADMIN') return 'Admin'
  return normalized || '—'
}

export function clearAdminLocalState() {
  try {
    window.localStorage.removeItem('svhub.admin.gate')
  } catch {
    /* ignore */
  }
}

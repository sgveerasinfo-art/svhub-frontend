import { apiFetch } from './client.js'

export class AdminApiError extends Error {
  constructor(code, message, status) {
    super(message)
    this.name = 'AdminApiError'
    this.code = code
    this.status = status
  }
}

async function adminRequest(path, { method = 'GET', body, query } = {}) {
  try {
    return await apiFetch(path, { method, body, query, auth: true })
  } catch (error) {
    throw new AdminApiError(
      error.code || 'server_error',
      error.message || 'Request failed.',
      error.status || 0,
    )
  }
}

export async function getAdminCoupons(query = {}) {
  return adminRequest('/admin/coupons', { query })
}

export async function getAdminCoupon(id) {
  return adminRequest(`/admin/coupons/${encodeURIComponent(id)}`)
}

export async function createAdminCoupon(payload) {
  return adminRequest('/admin/coupons', {
    method: 'POST',
    body: payload,
  })
}

export async function updateAdminCoupon(id, payload) {
  return adminRequest(`/admin/coupons/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: payload,
  })
}

export async function disableAdminCoupon(id) {
  return adminRequest(`/admin/coupons/${encodeURIComponent(id)}/disable`, {
    method: 'POST',
  })
}

export async function archiveAdminCoupon(id) {
  return adminRequest(`/admin/coupons/${encodeURIComponent(id)}/archive`, {
    method: 'POST',
  })
}

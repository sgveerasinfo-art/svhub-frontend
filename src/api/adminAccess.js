/**
 * Admin access management API (Super Admin).
 */

import { apiFetch } from './client.js'

export async function listAdminUsers() {
  return apiFetch('/admin/access/users', { auth: true })
}

export async function updateAdminUser(id, body) {
  return apiFetch(`/admin/access/users/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    auth: true,
    body,
  })
}

export async function listAdminInvitations() {
  return apiFetch('/admin/access/invitations', { auth: true })
}

export async function createAdminInvitation(body) {
  return apiFetch('/admin/access/invitations', {
    method: 'POST',
    auth: true,
    body,
  })
}

export async function resendAdminInvitation(id) {
  return apiFetch(`/admin/access/invitations/${encodeURIComponent(id)}/resend`, {
    method: 'POST',
    auth: true,
  })
}

export async function revokeAdminInvitation(id) {
  return apiFetch(`/admin/access/invitations/${encodeURIComponent(id)}/revoke`, {
    method: 'POST',
    auth: true,
  })
}

export async function listAccessAudit(limit = 40) {
  return apiFetch(`/admin/access/audit?limit=${limit}`, { auth: true })
}

export async function validateAdminSetup(token) {
  return apiFetch(`/admin/access/setup?token=${encodeURIComponent(token)}`)
}

export async function acceptAdminSetup({ token, password }) {
  return apiFetch('/admin/access/setup', {
    method: 'POST',
    body: { token, password },
  })
}

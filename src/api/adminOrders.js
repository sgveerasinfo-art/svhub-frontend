import { readToken } from './auth.js'

const API_URL = import.meta.env.VITE_API_URL || '/api'

export class AdminApiError extends Error {
  constructor(code, message, status) {
    super(message)
    this.name = 'AdminApiError'
    this.code = code
    this.status = status
  }
}

const STATUS_TO_UI = {
  PENDING_PAYMENT: 'Pending',
  CONFIRMED: 'Confirmed',
  PROCESSING: 'Processing',
  SHIPPED: 'Shipped',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  REQUIRES_RECONCILIATION: 'Pending',
}

const PAYMENT_TO_UI = {
  PENDING: 'Pending',
  SUCCESS: 'Paid',
  PAID: 'Paid',
  FAILED: 'Failed',
  REFUNDED: 'Refunded',
}

const STATUS_TO_BACKEND = {
  Pending: 'PENDING_PAYMENT',
  Confirmed: 'CONFIRMED',
  Processing: 'PROCESSING',
  Shipped: 'SHIPPED',
  'Out for Delivery': 'OUT_FOR_DELIVERY',
  Delivered: 'DELIVERED',
  Cancelled: 'CANCELLED',
}

const PAYMENT_TO_BACKEND = {
  Pending: 'PENDING',
  Paid: 'PAID',
  Failed: 'FAILED',
  Refunded: 'REFUNDED',
}

export function normalizeOrderForAdmin(order) {
  if (!order) return null

  const id = order._id || order.id
  const number = order.orderNumber || order.number || ''
  const uiStatus = STATUS_TO_UI[order.status] || order.displayStatus || order.status || 'Pending'
  const uiPaymentStatus =
    PAYMENT_TO_UI[order.paymentStatus] ||
    order.displayPaymentStatus ||
    (order.paymentStatus === 'SUCCESS' ? 'Paid' : order.paymentStatus) ||
    'Pending'

  const shippingAddress = order.shippingAddress || order.address || null
  const addressLines = shippingAddress?.lines?.length
    ? shippingAddress.lines
    : [
        shippingAddress?.street,
        `${shippingAddress?.city || ''}, ${shippingAddress?.state || ''} - ${shippingAddress?.pin || ''}`
          .trim()
          .replace(/^,\s*|-\s*$/g, ''),
      ].filter(Boolean)

  const items = (order.items || []).map((item) => ({
    ...item,
    id: item.variantId || item.productId || item.id,
    name: item.productName || item.name || '',
    productName: item.productName || item.name || '',
    weight: item.variantLabel || item.weight || '',
    variantLabel: item.variantLabel || item.weight || '',
    price: item.unitPrice ?? item.price ?? 0,
    unitPrice: item.unitPrice ?? item.price ?? 0,
    quantity: item.quantity ?? 1,
    lineTotal: item.lineTotal ?? (item.unitPrice ?? item.price ?? 0) * (item.quantity ?? 1),
    storefront: item.storefront || '',
  }))

  const history = (order.history || order.statusHistory || []).map((h) => ({
    status: STATUS_TO_UI[h.status] || h.status,
    rawStatus: h.status,
    at: h.at,
    note: h.note || '',
  }))

  return {
    ...order,
    id: String(id),
    _id: String(id),
    number,
    orderNumber: number,
    customerName: order.customerName || order.user?.name || '',
    email: order.email || order.user?.email || '',
    phone: order.phone || order.user?.phone || '',
    status: uiStatus,
    rawStatus: order.status,
    paymentStatus: uiPaymentStatus,
    rawPaymentStatus: order.paymentStatus,
    amount: order.totalAmount ?? order.amount ?? 0,
    total: order.totalAmount ?? order.total ?? 0,
    totalAmount: order.totalAmount ?? order.amount ?? 0,
    subtotal: order.subtotal ?? 0,
    shipping: order.shippingFee ?? order.shipping ?? 0,
    shippingFee: order.shippingFee ?? order.shipping ?? 0,
    discount: order.discount ?? 0,
    expectedDeliveryDate: order.expectedDeliveryDate || null,
    courier: order.courier || null,
    trackingNumber: order.trackingNumber || null,
    trackingUrl: order.trackingUrl || null,
    notes: order.notes || '',
    date: order.createdAt || order.date || new Date().toISOString(),
    createdAt: order.createdAt || order.date,
    payment: order.payment || (order.paymentMethod ? `Paid via ${order.paymentMethod}` : 'Online Payment'),
    address: shippingAddress
      ? {
          name: shippingAddress.name,
          phone: shippingAddress.phone,
          city: shippingAddress.city,
          state: shippingAddress.state,
          pin: shippingAddress.pin,
          country: shippingAddress.country || 'India',
          lines: addressLines,
        }
      : null,
    items,
    history,
    statusHistory: history,
    storefronts:
      order.storefronts || Array.from(new Set(items.map((i) => i.storefront).filter(Boolean))),
  }
}

async function adminRequest(path, { method = 'GET', body, query } = {}) {
  let queryString = ''
  if (query && typeof query === 'object') {
    const searchParams = new URLSearchParams()
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '' && value !== 'all') {
        searchParams.set(key, String(value))
      }
    }
    const qs = searchParams.toString()
    if (qs) queryString = `?${qs}`
  }

  const token = readToken()
  const headers = {
    Accept: 'application/json',
    ...(body ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }

  let response
  try {
    response = await fetch(`${API_URL}${path}${queryString}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new AdminApiError('network', 'Could not connect to the SV Hub server. Check your connection.', 0)
  }

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const errorObj = data.error || data
    throw new AdminApiError(
      errorObj.code || `http_${response.status}`,
      errorObj.message || 'Request failed.',
      response.status,
    )
  }

  return data
}

export async function getAdminOrders(params = {}) {
  const query = { ...params }
  if (query.status && STATUS_TO_BACKEND[query.status]) {
    query.status = STATUS_TO_BACKEND[query.status]
  }
  if (query.paymentStatus && PAYMENT_TO_BACKEND[query.paymentStatus]) {
    query.paymentStatus = PAYMENT_TO_BACKEND[query.paymentStatus]
  }
  const res = await adminRequest('/admin/orders', { query })
  return {
    success: res.success,
    orders: (res.orders || []).map(normalizeOrderForAdmin),
    pagination: res.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 },
  }
}

export async function getAdminOrder(id) {
  const res = await adminRequest(`/admin/orders/${id}`)
  return {
    success: res.success,
    order: normalizeOrderForAdmin(res.order),
  }
}

export async function updateAdminOrder(id, payload = {}) {
  const body = { ...payload }
  if (body.status && STATUS_TO_BACKEND[body.status]) {
    body.status = STATUS_TO_BACKEND[body.status]
  }
  if (body.paymentStatus && PAYMENT_TO_BACKEND[body.paymentStatus]) {
    body.paymentStatus = PAYMENT_TO_BACKEND[body.paymentStatus]
  }
  const res = await adminRequest(`/admin/orders/${id}`, {
    method: 'PATCH',
    body,
  })
  return {
    success: res.success,
    order: normalizeOrderForAdmin(res.order),
    message: res.message,
  }
}

export async function cancelAdminOrder(id, reason) {
  const res = await adminRequest(`/admin/orders/${id}/cancel`, {
    method: 'POST',
    body: { reason },
  })
  return {
    success: res.success,
    order: normalizeOrderForAdmin(res.order),
    message: res.message,
  }
}

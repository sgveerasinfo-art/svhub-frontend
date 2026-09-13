const ORDERS_KEY = 'svhub.account.orders'
const ADDRESSES_KEY = 'svhub.account.addresses'
const LAST_ORDER_KEY = 'svhub.lastOrder'

export const ORDER_STATUSES = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled']
export const ORDER_TIMELINE = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered']
export const PAYMENT_STATUSES = ['Pending', 'Paid', 'Failed', 'Refunded']

export function paymentStatusOf(raw) {
  if (raw?.paymentStatus && PAYMENT_STATUSES.includes(raw.paymentStatus)) {
    return raw.paymentStatus
  }

  const value = String(raw?.payment || '').toLowerCase()
  if (value.includes('fail')) return 'Failed'
  if (value.includes('refund')) return 'Refunded'
  if (value.includes('pending')) return 'Pending'
  return 'Paid'
}

function readJson(key, fallback) {
  try {
    const raw = window.sessionStorage?.getItem(key) ?? window.localStorage?.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function readLocal(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function writeLocal(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* ignore quota / private mode */
  }
}

function ownerKey(base, ownerId) {
  return ownerId ? `${base}.${ownerId}` : base
}

function ownerIdOf(user) {
  return user?.id || user?.email || ''
}

export function orderIdFromNumber(number) {
  return String(number || '')
    .replace(/^order\s*#?/i, '')
    .replace(/^#/, '')
    .trim()
    .toLowerCase()
}

export function normalizeOrder(raw) {
  if (!raw) return null
  const number = raw.number || raw.orderNumber
  if (!number) return null

  return {
    id: raw.id || orderIdFromNumber(number),
    number,
    date: raw.date || new Date().toISOString(),
    amount: Number(raw.amount ?? raw.total) || 0,
    status: ORDER_STATUSES.includes(raw.status) ? raw.status : 'Confirmed',
    payment: raw.payment || 'Paid via Razorpay',
    paymentStatus: paymentStatusOf(raw),
    email: raw.email || '',
    ownerId: raw.ownerId || '',
    items: Array.isArray(raw.items) ? raw.items : [],
    subtotal: raw.subtotal == null ? null : Number(raw.subtotal) || 0,
    shipping: raw.shipping == null ? null : Number(raw.shipping) || 0,
    discount: Number(raw.discount) || 0,
    expectedDeliveryDate: raw.expectedDeliveryDate || null,
    address: raw.address || {
      label: 'Delivery',
      name: raw.addressName || '',
      phone: raw.addressPhone || '',
      lines: raw.addressLines || [],
    },
  }
}

export function orderTotals(order) {
  const items = order?.items || []
  const lineSubtotal = items.reduce(
    (sum, item) => sum + Number(item.price || 0) * (item.quantity || 1),
    0,
  )
  const subtotal = Number(order?.subtotal) || lineSubtotal
  const discount = Number(order?.discount) || 0
  const shipping =
    order?.shipping == null
      ? Math.max(0, (Number(order?.amount) || 0) - subtotal + discount)
      : Number(order.shipping) || 0
  const total = Number(order?.amount) || Math.max(0, subtotal + shipping - discount)
  return { subtotal, shipping, discount, total }
}

export function timelineIndex(status) {
  if (status === 'Cancelled') return -1
  const index = ORDER_TIMELINE.indexOf(status)
  return index < 0 ? 0 : index
}

export function recordAccountOrder(raw, user) {
  const ownerId = ownerIdOf(user)
  const order = normalizeOrder({
    ...raw,
    email: raw.email || user?.email || '',
    ownerId,
  })
  if (!order || typeof window === 'undefined') return order

  const key = ownerKey(ORDERS_KEY, ownerId)
  const stored = readLocal(key, [])
  const next = [order, ...stored.filter((item) => item.id !== order.id)].slice(0, 24)
  writeLocal(key, next)

  if (order.address?.lines?.length && ownerId) {
    recordAccountAddress(user, {
      label: order.address.label || 'Home',
      name: order.address.name || user?.name || '',
      phone: order.address.phone || user?.phone || '',
      lines: order.address.lines,
    })
  }

  return order
}

export function getAccountOrders(user) {
  const ownerId = ownerIdOf(user)
  const recorded = readLocal(ownerKey(ORDERS_KEY, ownerId), []).map(normalizeOrder).filter(Boolean)
  const last = normalizeOrder(readJson(LAST_ORDER_KEY, null))
  const lastMatches =
    last &&
    Boolean(ownerId) &&
    ((last.ownerId && last.ownerId === ownerId) ||
      (last.email && user?.email && last.email.toLowerCase() === user.email.toLowerCase()))
  const extra = lastMatches && !recorded.some((order) => order.id === last.id) ? [last] : []
  const list = [...extra, ...recorded]
  return list
}

export function getAccountOrder(orderId, user) {
  const id = String(orderId || '').toLowerCase()
  return getAccountOrders(user).find((order) => order.id === id) ?? null
}

function partsFromLines(lines = []) {
  const street = String(lines[0] || '')
    .replace(/,$/, '')
    .trim()
  const cityState = String(lines[1] || '')
  const [city = '', state = ''] = cityState.split(',').map((part) => part.trim())
  const pin = String(lines[2] || '')
    .replace(/,$/, '')
    .replace(/\D/g, '')
    .trim()
  return { street, city, state, pin }
}

function linesFromParts({ street = '', city = '', state = '', pin = '' }) {
  return [street, [city, state].filter(Boolean).join(', '), pin].filter(Boolean)
}

function normalizeAddress(raw, index = 0) {
  if (!raw) return null
  const parsed = partsFromLines(Array.isArray(raw.lines) ? raw.lines : [])
  const street = String(raw.street || parsed.street || '').trim()
  const city = String(raw.city || parsed.city || '').trim()
  const state = String(raw.state || parsed.state || '').trim()
  const pin = String(raw.pin || parsed.pin || '').replace(/\D/g, '')
  const lines = linesFromParts({ street, city, state, pin })
  if (!street && !lines.length) return null

  return {
    id: raw.id || `address-${Date.now()}-${index}`,
    label: raw.label || 'Home',
    name: raw.name || '',
    phone: raw.phone || '',
    street,
    city,
    state,
    pin,
    lines,
    isDefault: Boolean(raw.isDefault),
  }
}

export function getAccountAddresses(user) {
  return readLocal(ownerKey(ADDRESSES_KEY, ownerIdOf(user)), []).map(normalizeAddress).filter(Boolean)
}

export function saveAccountAddresses(user, addresses) {
  writeLocal(ownerKey(ADDRESSES_KEY, ownerIdOf(user)), addresses.map(normalizeAddress).filter(Boolean))
}

export function recordAccountAddress(user, raw) {
  const next = normalizeAddress(raw)
  if (!next || !ownerIdOf(user)) return next
  const current = getAccountAddresses(user)
  const match = current.find(
    (item) => item.lines.join(' ').toLowerCase() === next.lines.join(' ').toLowerCase(),
  )
  if (match) return match
  const withDefault = current.length ? next : { ...next, isDefault: true }
  saveAccountAddresses(user, [...current, withDefault])
  return withDefault
}

export function upsertAccountAddress(user, raw) {
  const next = normalizeAddress(raw)
  if (!next) return null
  const current = getAccountAddresses(user)
  const existing = current.find((item) => item.id === next.id)
  const merged = existing
    ? { ...existing, ...next, isDefault: existing.isDefault }
    : { ...next, isDefault: current.length === 0 || next.isDefault }

  let list = existing
    ? current.map((item) => (item.id === merged.id ? merged : item))
    : [...current, merged]

  if (merged.isDefault) {
    list = list.map((item) => ({ ...item, isDefault: item.id === merged.id }))
  } else if (list.length && !list.some((item) => item.isDefault)) {
    list = list.map((item, index) => ({ ...item, isDefault: index === 0 }))
  }

  saveAccountAddresses(user, list)
  return list.find((item) => item.id === merged.id) ?? merged
}

export function setDefaultAccountAddress(user, addressId) {
  const current = getAccountAddresses(user)
  if (!current.some((item) => item.id === addressId)) return
  saveAccountAddresses(
    user,
    current.map((item) => ({ ...item, isDefault: item.id === addressId })),
  )
}

export function removeAccountAddress(user, addressId) {
  const next = getAccountAddresses(user).filter((item) => item.id !== addressId)
  if (next.length && !next.some((item) => item.isDefault)) {
    next[0] = { ...next[0], isDefault: true }
  }
  saveAccountAddresses(user, next)
}

export function formatOrderDate(value) {
  const date = value ? new Date(value) : null
  if (!date || Number.isNaN(date.getTime())) return '—'

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
    .format(date)
    .toUpperCase()
}

export function formatDeliveryDate(value) {
  const date = value ? new Date(value) : null
  if (!date || Number.isNaN(date.getTime())) return '—'

  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export function statusClass(status) {
  return String(status || 'pending')
    .toLowerCase()
    .replace(/\s+/g, '-')
}

export function orderProductsLabel(order) {
  const items = order?.items || []
  if (!items.length) return '—'

  const extra = items.length - 1
  if (!extra) return items[0].name
  return `${items[0].name} + ${extra} more`
}

export function padCount(value) {
  const count = Number(value) || 0
  return String(count).padStart(2, '0')
}

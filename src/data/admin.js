import { ORDER_STATUSES, PAYMENT_STATUSES, orderIdFromNumber } from './account.js'
import { categories as storefrontCategories } from './categories.js'
import { products as catalogProducts } from './products.js'

export const ADMIN_STORAGE_KEY = 'svhub.admin.store'
export const ADMIN_PAGE_SIZE = 8
export const LOW_STOCK_MAX = 10

export const STOREFRONTS = [
  { id: 'nutri-hub', label: 'Nutri-Hub' },
  { id: 'self-care', label: 'Self-Care' },
]

export { ORDER_STATUSES, PAYMENT_STATUSES, orderIdFromNumber }

const CUSTOMERS = [
  {
    id: 'cus-priya',
    name: 'Priya Venkatesh',
    email: 'priya.venkatesh@email.com',
    phone: '+91 98765 43210',
    city: 'Coimbatore',
    state: 'Tamil Nadu',
    joined: '2026-03-12T09:00:00.000Z',
    status: 'VIP',
  },
  {
    id: 'cus-arjun',
    name: 'Arjun Menon',
    email: 'arjun.menon@email.com',
    phone: '+91 98401 22334',
    city: 'Chennai',
    state: 'Tamil Nadu',
    joined: '2026-04-02T11:20:00.000Z',
    status: 'Active',
  },
  {
    id: 'cus-lakshmi',
    name: 'Lakshmi Iyer',
    email: 'lakshmi.iyer@email.com',
    phone: '+91 97860 11442',
    city: 'Madurai',
    state: 'Tamil Nadu',
    joined: '2026-04-18T08:40:00.000Z',
    status: 'VIP',
  },
  {
    id: 'cus-rohan',
    name: 'Rohan Nair',
    email: 'rohan.nair@email.com',
    phone: '+91 99001 55667',
    city: 'Bengaluru',
    state: 'Karnataka',
    joined: '2026-05-09T14:10:00.000Z',
    status: 'Inactive',
  },
  {
    id: 'cus-meera',
    name: 'Meera Krishnan',
    email: 'meera.krishnan@email.com',
    phone: '+91 97111 88990',
    city: 'Coimbatore',
    state: 'Tamil Nadu',
    joined: '2026-05-22T16:30:00.000Z',
    status: 'Active',
  },
  {
    id: 'cus-suresh',
    name: 'Suresh Kumar',
    email: 'suresh.kumar@email.com',
    phone: '+91 94444 33110',
    city: 'Hyderabad',
    state: 'Telangana',
    joined: '2026-06-04T10:05:00.000Z',
    status: 'Active',
  },
  {
    id: 'cus-ananya',
    name: 'Ananya Rao',
    email: 'ananya.rao@email.com',
    phone: '+91 98200 77665',
    city: 'Chennai',
    state: 'Tamil Nadu',
    joined: '2026-06-19T12:45:00.000Z',
    status: 'VIP',
  },
  {
    id: 'cus-karthik',
    name: 'Karthik Subramanian',
    email: 'karthik.s@email.com',
    phone: '+91 96770 22118',
    city: 'Coimbatore',
    state: 'Tamil Nadu',
    joined: '2026-07-03T09:25:00.000Z',
    status: 'Active',
  },
  {
    id: 'cus-divya',
    name: 'Divya Patel',
    email: 'divya.patel@email.com',
    phone: '+91 98860 44551',
    city: 'Bengaluru',
    state: 'Karnataka',
    joined: '2026-07-21T15:00:00.000Z',
    status: 'Active',
  },
  {
    id: 'cus-naveen',
    name: 'Naveen Raj',
    email: 'naveen.raj@email.com',
    phone: '+91 90909 66772',
    city: 'Madurai',
    state: 'Tamil Nadu',
    joined: '2026-08-08T07:50:00.000Z',
    status: 'Active',
  },
]

const ORDER_SEEDS = [
  {
    number: '#SVH12345',
    date: '2026-09-02T10:30:00.000Z',
    status: 'Processing',
    paymentStatus: 'Paid',
    paymentId: 'pay_rzp_svh12345',
    paymentMethod: 'Razorpay UPI (Google Pay)',
    courier: 'BlueDart Express',
    trackingNumber: 'BLU-98214-IN',
    customerId: 'cus-priya',
    shipping: 0,
    discount: 50,
    notes: 'Customer requested eco-friendly packaging. Express dispatched via BlueDart.',
    history: [
      { status: 'Pending', at: '2026-09-02T10:30:00.000Z', note: 'Order placed by customer via Storefront.' },
      { status: 'Confirmed', at: '2026-09-02T10:35:00.000Z', note: 'Payment verified via Razorpay ID pay_rzp_svh12345.' },
      { status: 'Processing', at: '2026-09-02T11:15:00.000Z', note: 'Kitchen and apothecary packing in progress.' },
    ],
    items: [
      ['kullakar-rice', 2],
      ['kasthuri-manjal-soap', 1],
      ['venthaya-thokku', 1],
    ],
  },
  {
    number: '#SVH-98234',
    date: '2026-08-18T10:00:00.000Z',
    status: 'Delivered',
    paymentStatus: 'Paid',
    customerId: 'cus-priya',
    shipping: 0,
    discount: 80,
    items: [
      ['kullakar-rice', 2],
      ['venthaya-thokku', 1],
    ],
  },
  {
    number: '#SVH-98110',
    date: '2026-08-24T09:30:00.000Z',
    status: 'Shipped',
    paymentStatus: 'Paid',
    customerId: 'cus-meera',
    items: [
      ['kasthuri-manjal-soap', 2],
      ['vettiver-soap', 1],
    ],
  },
  {
    number: '#SVH-98002',
    date: '2026-08-27T14:15:00.000Z',
    status: 'Processing',
    paymentStatus: 'Paid',
    customerId: 'cus-arjun',
    items: [
      ['tomato-thokku', 1],
      ['garam-masala', 2],
    ],
  },
  {
    number: '#SVH-97888',
    date: '2026-08-29T11:40:00.000Z',
    status: 'Confirmed',
    paymentStatus: 'Paid',
    customerId: 'cus-lakshmi',
    items: [['mappillai-samba-rice', 1]],
  },
  {
    number: '#SVH-97701',
    date: '2026-08-31T08:20:00.000Z',
    status: 'Pending',
    paymentStatus: 'Pending',
    customerId: 'cus-naveen',
    shipping: 40,
    items: [
      ['athirasam', 1],
      ['mysore-pak', 1],
    ],
  },
  {
    number: '#SVH-96540',
    date: '2026-08-12T16:05:00.000Z',
    status: 'Cancelled',
    paymentStatus: 'Refunded',
    customerId: 'cus-rohan',
    items: [['karuppu-kavuni-rice', 1]],
  },
  {
    number: '#SVH-98301',
    date: '2026-08-20T13:10:00.000Z',
    status: 'Delivered',
    paymentStatus: 'Paid',
    customerId: 'cus-suresh',
    items: [
      ['kullakar-rice', 1],
      ['chat-masala', 1],
      ['thattai', 2],
    ],
  },
  {
    number: '#SVH-98344',
    date: '2026-08-22T17:45:00.000Z',
    status: 'Delivered',
    paymentStatus: 'Paid',
    customerId: 'cus-ananya',
    items: [
      ['hibiscus-soap', 1],
      ['sweet-basil-soap', 1],
    ],
  },
  {
    number: '#SVH-98410',
    date: '2026-08-25T08:05:00.000Z',
    status: 'Shipped',
    paymentStatus: 'Paid',
    customerId: 'cus-karthik',
    items: [
      ['vadu-maanga-thokku', 2],
      ['karuveppilai-thokku', 1],
    ],
  },
  {
    number: '#SVH-98488',
    date: '2026-08-26T19:20:00.000Z',
    status: 'Processing',
    paymentStatus: 'Paid',
    customerId: 'cus-divya',
    items: [
      ['multanimitti-soap', 2],
      ['kuppaimeni-soap', 1],
    ],
  },
  {
    number: '#SVH-98520',
    date: '2026-08-28T10:55:00.000Z',
    status: 'Confirmed',
    paymentStatus: 'Paid',
    customerId: 'cus-priya',
    items: [
      ['idiyappam-meal', 2],
      ['pasta-seasoning', 1],
    ],
  },
  {
    number: '#SVH-98567',
    date: '2026-08-30T15:30:00.000Z',
    status: 'Pending',
    paymentStatus: 'Failed',
    customerId: 'cus-arjun',
    shipping: 40,
    items: [['noodles-masala', 2]],
  },
  {
    number: '#SVH-98602',
    date: '2026-08-31T18:10:00.000Z',
    status: 'Confirmed',
    paymentStatus: 'Paid',
    customerId: 'cus-meera',
    items: [
      ['kasthuri-manjal-soap', 1],
      ['peri-peri-seasoning', 1],
    ],
  },
  {
    number: '#SVH-98640',
    date: '2026-09-01T06:40:00.000Z',
    status: 'Pending',
    paymentStatus: 'Paid',
    customerId: 'cus-lakshmi',
    items: [
      ['kullakar-rice', 3],
      ['cream-onion-powder', 1],
    ],
  },
  {
    number: '#SVH-98661',
    date: '2026-09-01T08:15:00.000Z',
    status: 'Processing',
    paymentStatus: 'Paid',
    customerId: 'cus-naveen',
    items: [['murukku', 2]],
  },
  {
    number: '#SVH-97420',
    date: '2026-08-08T12:00:00.000Z',
    status: 'Cancelled',
    paymentStatus: 'Refunded',
    customerId: 'cus-divya',
    items: [['paneer-butter-masala', 1]],
  },
]

function hashCode(value) {
  return [...String(value)].reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) | 0, 0)
}

export function storefrontLabel(id) {
  return STOREFRONTS.find((item) => item.id === id)?.label || id || '—'
}

export function categoryLabel(id, categoryList = storefrontCategories) {
  return categoryList.find((item) => item.id === id || item.slug === id)?.name || id || '—'
}

export function skuFor(product) {
  const prefix = product.storefront === 'self-care' ? 'SC' : 'NH'
  const stem = String(product.id || product.name || 'ITEM')
    .replace(/[^a-z0-9]/gi, '')
    .slice(0, 6)
    .toUpperCase()
  return `SVH-${prefix}-${stem || 'ITEM'}`
}

export function stockFromQty(qty) {
  const count = Math.max(0, Number(qty) || 0)
  if (count <= 0) return 'out-of-stock'
  if (count <= LOW_STOCK_MAX) return 'low-stock'
  return 'in-stock'
}

export function qtyFor(product) {
  if (product.qty != null) return Math.max(0, Number(product.qty) || 0)
  if (product.stock === 'out-of-stock') return 0
  const seed = Math.abs(hashCode(product.id))
  if (product.stock === 'low-stock') return 3 + (seed % 6)
  return 24 + (seed % 52)
}

export function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function productById(id) {
  return catalogProducts.find((product) => product.id === id)
}

function orderItem(productId, quantity = 1) {
  const product = productById(productId)
  if (!product) return null
  return {
    id: product.id,
    slug: product.slug ?? product.id,
    name: product.name,
    weight: product.weight,
    quantity,
    price: product.price,
    image: product.image,
    storefront: product.storefront,
    category: product.category,
  }
}

export function defaultSettings() {
  return {
    supportEmail: 'sgveeras.info@gmail.com',
    supportPhone: '+91 422 450 2100',
    freeShippingFrom: 799,
    standardShipping: 40,
    lowStockAlert: LOW_STOCK_MAX,
  }
}

export function buildAdminProducts() {
  return catalogProducts.map((product) => {
    const qty = qtyFor(product)
    return {
      ...product,
      slug: product.slug ?? product.id,
      sku: skuFor(product),
      qty,
      stock: stockFromQty(qty),
      active: true,
    }
  })
}

export function buildAdminCategories() {
  return storefrontCategories.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    storefront: category.storefront,
    description: category.description,
  }))
}

export function buildAdminCustomers() {
  return CUSTOMERS.map((customer) => ({
    ...customer,
    status: customer.status || 'Active',
    notes: customer.notes || '',
  }))
}

export function buildAdminOrders() {
  return ORDER_SEEDS.map((row) => {
    const customer = CUSTOMERS.find((item) => item.id === row.customerId)
    const items = row.items.map(([id, quantity]) => orderItem(id, quantity)).filter(Boolean)
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const shipping = row.shipping ?? 0
    const discount = row.discount ?? 0
    const storefronts = [...new Set(items.map((item) => item.storefront))]
    const cleanNum = String(row.number || '').replace(/[^a-z0-9]/gi, '').toLowerCase()
    const paymentId = row.paymentId || `pay_rzp_${cleanNum}`
    const paymentMethod =
      row.paymentMethod ||
      (row.paymentStatus === 'Paid'
        ? 'Razorpay UPI (Google Pay)'
        : row.paymentStatus === 'Refunded'
          ? 'Razorpay (Refunded to Source)'
          : row.paymentStatus === 'Failed'
            ? 'Razorpay (Gateway Timeout)'
            : 'Payment Pending (Razorpay Link)')

    return {
      id: orderIdFromNumber(row.number),
      number: row.number,
      date: row.date,
      status: row.status,
      paymentStatus: row.paymentStatus,
      paymentId,
      paymentMethod,
      payment:
        row.paymentStatus === 'Paid'
          ? 'Paid via Razorpay'
          : row.paymentStatus === 'Refunded'
            ? 'Refunded to source'
            : row.paymentStatus === 'Failed'
              ? 'Payment failed'
              : 'Payment pending',
      customerId: row.customerId,
      customerName: customer?.name || '',
      email: customer?.email || '',
      phone: customer?.phone || '',
      items,
      storefronts,
      address: {
        label: 'Home',
        name: customer?.name || '',
        phone: customer?.phone || '',
        street: '12 Heritage Lane, RS Puram',
        city: customer?.city || 'Coimbatore',
        state: customer?.state || 'Tamil Nadu',
        pin: '641002',
        country: 'India',
        lines: ['12 Heritage Lane, RS Puram', `${customer?.city || 'Coimbatore'}, ${customer?.state || 'Tamil Nadu'}`, '641002', 'India'],
      },
      subtotal,
      shipping,
      discount,
      amount: Math.max(0, subtotal + shipping - discount),
      courier: row.courier || (row.status === 'Shipped' || row.status === 'Delivered' ? 'BlueDart Express' : 'Delhivery Express'),
      trackingNumber: row.trackingNumber || (row.status === 'Shipped' || row.status === 'Delivered' ? `BLU-${cleanNum.slice(0, 8).toUpperCase()}` : ''),
      notes: row.notes || '',
      history: row.history || [
        { status: 'Pending', at: row.date, note: 'Order created' },
        ...(row.status !== 'Pending' ? [{ status: row.status, at: row.date, note: `Status updated to ${row.status}` }] : []),
      ],
    }
  })
}

export function seedAdminStore() {
  return {
    products: buildAdminProducts(),
    orders: buildAdminOrders(),
    customers: buildAdminCustomers(),
    categories: buildAdminCategories(),
    settings: defaultSettings(),
  }
}

export function customerStats(customer, orders) {
  const theirs = orders.filter((order) => order.customerId === customer.id)
  const counted = theirs.filter((order) => order.status !== 'Cancelled' && order.paymentStatus !== 'Failed')
  const last = [...theirs].sort((a, b) => new Date(b.date) - new Date(a.date))[0]
  return {
    orderCount: theirs.length,
    spent: counted.reduce((sum, order) => sum + (Number(order.amount) || 0), 0),
    lastOrder: last?.date || null,
    lastOrderId: last?.id || null,
  }
}

export function matchesQuery(query, ...fields) {
  const needle = String(query || '')
    .trim()
    .toLowerCase()
  if (!needle) return true
  return fields.some((field) => String(field || '').toLowerCase().includes(needle))
}

export function paginate(items, page, pageSize = ADMIN_PAGE_SIZE) {
  const total = items.length
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const current = Math.min(Math.max(1, page), pageCount)
  const start = (current - 1) * pageSize
  return {
    items: items.slice(start, start + pageSize),
    page: current,
    pageCount,
    total,
    from: total ? start + 1 : 0,
    to: Math.min(start + pageSize, total),
  }
}

export function formatAdminDate(value) {
  const date = value ? new Date(value) : null
  if (!date || Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export function formatAdminDateTime(value) {
  const date = value ? new Date(value) : null
  if (!date || Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function statusTone(status) {
  return String(status || 'pending')
    .toLowerCase()
    .replace(/\s+/g, '-')
}

export function fulfillmentQueue(orders) {
  return orders.filter((order) => ['Pending', 'Confirmed', 'Processing'].includes(order.status)).length
}

export function revenueOf(orders) {
  return orders
    .filter((order) => order.status !== 'Cancelled' && order.paymentStatus === 'Paid')
    .reduce((sum, order) => sum + (Number(order.amount) || 0), 0)
}

export function lastNDays(n = 7) {
  const days = []
  const now = new Date()
  now.setHours(12, 0, 0, 0)
  for (let i = n - 1; i >= 0; i -= 1) {
    const date = new Date(now)
    date.setDate(now.getDate() - i)
    days.push(date)
  }
  return days
}

export function dayKey(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

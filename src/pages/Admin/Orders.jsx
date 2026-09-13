import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { getAdminOrders, updateAdminOrder, cancelAdminOrder } from '../../api/adminOrders.js'
import { useAdminUi, usePagedList } from '../../context/AdminUi.jsx'
import {
  ADMIN_PAGE_SIZE,
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  formatAdminDate,
  formatAdminDateTime,
  matchesQuery,
  storefrontLabel,
} from '../../data/admin.js'
import { formatPrice } from '../../utils/money.js'
import { Icon } from '../../components/admin/icons.jsx'
import { ErrorState, LoadingState, StatusBadge } from '../../components/admin/ui.jsx'
import './Orders.css'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const STATUS_FLOW = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered']

function formatExpectedDate(value) {
  const date = value ? new Date(value) : null
  if (!date || Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function startOfDay(value) {
  const date = new Date(value)
  date.setHours(0, 0, 0, 0)
  return date
}

function toDateKey(value) {
  const date = startOfDay(value)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseDateKey(key) {
  if (!key || !/^\d{4}-\d{2}-\d{2}$/.test(key)) return null
  const date = new Date(`${key}T00:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

function sameDay(a, b) {
  if (!a || !b) return false
  return toDateKey(a) === toDateKey(b)
}

function buildMonthGrid(viewMonth) {
  const year = viewMonth.getFullYear()
  const month = viewMonth.getMonth()
  const first = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < first.getDay(); i += 1) cells.push(null)
  for (let day = 1; day <= daysInMonth; day += 1) cells.push(new Date(year, month, day))
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

function formatMonthLabel(value) {
  return new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' }).format(value)
}

function formatDayLabel(value) {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(value)
}

function formatShortDayLabel(value) {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(value)
}

function formatRangeLabel(fromKey, toKey) {
  const start = parseDateKey(fromKey)
  const end = parseDateKey(toKey)
  if (!start) return 'Select a day'
  if (!end || fromKey === toKey) return formatDayLabel(start)
  return `${formatShortDayLabel(start)} – ${formatShortDayLabel(end)}`
}

function normalizeRangeKeys(a, b) {
  if (!a) return { from: b, to: b }
  if (!b) return { from: a, to: a }
  return a <= b ? { from: a, to: b } : { from: b, to: a }
}

function isKeyInRange(key, fromKey, toKey) {
  if (!key || !fromKey || !toKey) return false
  return key >= fromKey && key <= toKey
}

function matchesDayFilter(iso, dateMode, from, to) {
  if (dateMode === 'all') return true
  const time = new Date(iso).getTime()
  if (Number.isNaN(time)) return false
  const start = from ? new Date(`${from}T00:00:00`).getTime() : -Infinity
  const end = to ? new Date(`${to}T23:59:59.999`).getTime() : Infinity
  return time >= start && time <= end
}

function orderAmount(order) {
  return Number(order.amount ?? order.total ?? order.totalAmount ?? 0) || 0
}

function initials(name) {
  const letters = String(name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
  return letters || '?'
}

function itemCount(order) {
  return order.items?.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0) || 0
}

function nextStatus(status) {
  const index = STATUS_FLOW.indexOf(status)
  if (index < 0 || index >= STATUS_FLOW.length - 1) return null
  return STATUS_FLOW[index + 1]
}

function pageList(page, pageCount) {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, index) => index + 1)
  const pages = new Set([1, pageCount, page - 1, page, page + 1])
  return [...pages].filter((value) => value >= 1 && value <= pageCount).sort((a, b) => a - b)
}

function useCompactOrders() {
  const [compact, setCompact] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 720px)').matches : false,
  )

  useEffect(() => {
    const media = window.matchMedia('(max-width: 720px)')
    const sync = () => setCompact(media.matches)
    sync()
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [])

  return compact
}

function OrderDialog({ eyebrow, title, copy, onClose, children }) {
  const dialogRef = useRef(null)
  const lastFocus = useRef(null)

  useEffect(() => {
    lastFocus.current = document.activeElement
    const node = dialogRef.current
    node?.querySelector('input, select, textarea, button')?.focus()

    function onKey(event) {
      if (event.key === 'Escape') onClose()
      if (event.key !== 'Tab' || !node) return
      const items = [...node.querySelectorAll('button, [href], input, select, textarea')]
      if (!items.length) return
      const first = items[0]
      const last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      lastFocus.current?.focus?.()
    }
  }, [onClose])

  const isHashTitle = String(title || '').startsWith('#')
  const displayTitle = isHashTitle ? (
    <>
      <span className="admin-orders-dialog__hash">#</span>
      {String(title).slice(1)}
    </>
  ) : (
    title
  )

  return createPortal(
    <div className="admin-orders-dialog" role="presentation">
      <button type="button" className="admin-orders-dialog__backdrop" aria-label="Close dialog" onClick={onClose} />
      <div ref={dialogRef} className="admin-orders-dialog__panel" role="dialog" aria-modal="true" aria-labelledby="orders-dialog-title">
        <header className="admin-orders-dialog__head">
          <div className="admin-orders-dialog__head-content">
            {eyebrow ? <span className="admin-orders-dialog__eyebrow">{eyebrow}</span> : null}
            <h2 id="orders-dialog-title">{displayTitle}</h2>
            {copy ? <p className="admin-orders-dialog__copy">{copy}</p> : null}
          </div>
          <button type="button" className="admin-orders-dialog__close" onClick={onClose} aria-label="Close">
            <Icon name="close" size={16} />
          </button>
        </header>
        {children}
      </div>
    </div>,
    document.body,
  )
}

function OrderView({ order, onClose, onEdit, onOpen }) {
  const count = itemCount(order)
  return (
    <OrderDialog eyebrow="Order" title={order.number} copy={formatAdminDateTime(order.date)} onClose={onClose}>
      <div className="admin-orders-view">
        <div className="admin-orders-view__hero">
          <div className="admin-orders-view__customer">
            <span className="admin-orders__avatar" aria-hidden="true">
              {initials(order.customerName)}
            </span>
            <div className="admin-orders-view__customer-meta">
              <strong>{order.customerName}</strong>
              <span>{order.email}</span>
            </div>
          </div>
          <div className="admin-orders-view__amount-box">
            <span className="admin-orders-view__amount-label">Order Total</span>
            <strong className="admin-orders-view__total">{formatPrice(order.amount)}</strong>
          </div>
        </div>

        <div className="admin-orders-view__badges">
          <StatusBadge status={order.paymentStatus} kind="pay" />
          <StatusBadge status={order.status} />
        </div>

        <div className="admin-orders-view__meta-card">
          <dl className="admin-orders-view__dl">
            <div>
              <dt>Items</dt>
              <dd>
                {count} {count === 1 ? 'item' : 'items'}
              </dd>
            </div>
            <div>
              <dt>Payment</dt>
              <dd>{order.payment}</dd>
            </div>
            <div>
              <dt>Expected Delivery</dt>
              <dd>{formatExpectedDate(order.expectedDeliveryDate)}</dd>
            </div>
            <div>
              <dt>Ship to</dt>
              <dd>{order.address?.city || '—'}</dd>
            </div>
            <div>
              <dt>Phone</dt>
              <dd>{order.phone || '—'}</dd>
            </div>
          </dl>
        </div>

        <div className="admin-orders-view__items-wrap">
          <div className="admin-orders-view__items-head">
            <span>Ordered Items ({count})</span>
          </div>
          <ul className="admin-orders-view__items">
            {order.items?.map((item) => (
              <li key={`${item.id}-${item.weight}`}>
                <div className="admin-orders-view__item-info">
                  <span className="admin-orders-view__item-name">{item.name}</span>
                  <em className="admin-orders-view__item-sub">
                    {item.quantity} × {item.weight}
                    {item.storefront ? ` · ${storefrontLabel(item.storefront)}` : ''}
                  </em>
                </div>
                <strong className="admin-orders-view__item-price">{formatPrice(item.price * item.quantity)}</strong>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <footer className="admin-orders-dialog__actions">
        <button type="button" className="admin-orders-dialog__ghost" onClick={onEdit}>
          <Icon name="edit" size={14} />
          Update status
        </button>
        <button type="button" className="admin-orders-dialog__submit" onClick={onOpen}>
          Open order
          <span aria-hidden="true" style={{ marginLeft: 6 }}>→</span>
        </button>
      </footer>
    </OrderDialog>
  )
}

function StatusForm({ order, onClose, onSave }) {
  const [status, setStatus] = useState(order.status)
  const [paymentStatus, setPaymentStatus] = useState(order.paymentStatus)
  const [courier, setCourier] = useState(order.courier || '')
  const [trackingUrl, setTrackingUrl] = useState(order.trackingUrl || '')
  const [formError, setFormError] = useState('')

  const initialDateStr = useMemo(() => {
    if (!order.expectedDeliveryDate) return ''
    const d = new Date(order.expectedDeliveryDate)
    return !Number.isNaN(d.getTime()) ? d.toISOString().slice(0, 10) : ''
  }, [order.expectedDeliveryDate])
  const [expectedDate, setExpectedDate] = useState(initialDateStr)
  const [busy, setBusy] = useState(false)

  const isShippedStage = ['Shipped', 'Out for Delivery', 'Delivered'].includes(status)

  const dirty =
    status !== order.status ||
    paymentStatus !== order.paymentStatus ||
    expectedDate !== initialDateStr ||
    courier !== (order.courier || '') ||
    trackingUrl !== (order.trackingUrl || '')

  async function submit(event) {
    event.preventDefault()
    if (!dirty || busy) return
    setFormError('')

    let formattedUrl = trackingUrl.trim()
    if (formattedUrl && !/^https?:\/\//i.test(formattedUrl)) {
      if (!/^[a-z0-9+-.]+:/i.test(formattedUrl)) {
        formattedUrl = `https://${formattedUrl}`
      }
    }

    if (status === 'Shipped') {
      const c = courier.trim()
      if (!c) {
        setFormError('Delivery Partner (Courier) is required when status is Shipped.')
        return
      }
      if (!formattedUrl) {
        setFormError('Tracking URL is required when status is Shipped.')
        return
      }
      try {
        const parsed = new URL(formattedUrl)
        if (!['http:', 'https:'].includes(parsed.protocol)) {
          setFormError('Tracking URL must start with http:// or https://')
          return
        }
      } catch {
        setFormError('Please enter a valid tracking URL (e.g. https://delhivery.com/track/123)')
        return
      }
    } else if (formattedUrl) {
      try {
        const parsed = new URL(formattedUrl)
        if (!['http:', 'https:'].includes(parsed.protocol)) {
          setFormError('Tracking URL must start with http:// or https://')
          return
        }
      } catch {
        setFormError('Please enter a valid tracking URL (e.g. https://delhivery.com/track/123)')
        return
      }
    }

    setBusy(true)
    const payload = { status, paymentStatus }
    if (courier !== (order.courier || '')) payload.courier = courier.trim()
    if (formattedUrl !== (order.trackingUrl || '')) payload.trackingUrl = formattedUrl
    if (expectedDate && expectedDate !== initialDateStr) {
      payload.expectedDeliveryDate = new Date(`${expectedDate}T12:00:00.000Z`).toISOString()
    }
    const ok = await onSave(payload)
    setBusy(false)
    if (ok) onClose()
  }

  return (
    <OrderDialog eyebrow="Fulfillment" title={order.number} copy="Update payment, status, delivery partner, or tracking URL." onClose={onClose}>
      <form className="admin-orders-form" onSubmit={submit}>
        <div className="admin-orders-form__summary">
          <div className="admin-orders-form__summary-customer">
            <span className="admin-orders__avatar" aria-hidden="true">
              {initials(order.customerName)}
            </span>
            <div className="admin-orders-form__summary-meta">
              <strong>{order.customerName}</strong>
              <span>{order.email}</span>
            </div>
          </div>
          <div className="admin-orders-view__amount-box">
            <span className="admin-orders-view__amount-label">Order Total</span>
            <strong className="admin-orders-view__total">{formatPrice(order.amount)}</strong>
          </div>
        </div>

        <div className="admin-orders-form__card">
          <label className="admin-orders-form__field">
            <div className="admin-orders-form__label-row">
              <span>Order status</span>
              <span className="admin-orders-form__current">Current: {order.status}</span>
            </div>
            <select value={status} onChange={(event) => { setStatus(event.target.value); setFormError('') }}>
              {ORDER_STATUSES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          {isShippedStage && (
            <>
              <label className="admin-orders-form__field">
                <div className="admin-orders-form__label-row">
                  <span>Delivery Partner (Courier) {status === 'Shipped' && <span style={{ color: 'var(--terracotta)' }}>*</span>}</span>
                  <span className="admin-orders-form__current">Current: {order.courier || 'None'}</span>
                </div>
                <input
                  type="text"
                  className="admin-orders-form__input"
                  placeholder="e.g. Delhivery, BlueDart, DTDC"
                  value={courier}
                  onChange={(event) => { setCourier(event.target.value); setFormError('') }}
                  required={status === 'Shipped'}
                />
              </label>

              <label className="admin-orders-form__field">
                <div className="admin-orders-form__label-row">
                  <span>Tracking URL {status === 'Shipped' && <span style={{ color: 'var(--terracotta)' }}>*</span>}</span>
                  <span className="admin-orders-form__current">Current: {order.trackingUrl ? 'Set' : 'None'}</span>
                </div>
                <input
                  type="url"
                  className="admin-orders-form__input"
                  placeholder="https://www.delhivery.com/track/package/XXXXXX"
                  value={trackingUrl}
                  onChange={(event) => { setTrackingUrl(event.target.value); setFormError('') }}
                  required={status === 'Shipped'}
                />
              </label>
            </>
          )}

          <label className="admin-orders-form__field">
            <div className="admin-orders-form__label-row">
              <span>Payment status</span>
              <span className="admin-orders-form__current">Current: {order.paymentStatus}</span>
            </div>
            <select value={paymentStatus} onChange={(event) => setPaymentStatus(event.target.value)}>
              {PAYMENT_STATUSES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label className="admin-orders-form__field">
            <div className="admin-orders-form__label-row">
              <span>Expected delivery</span>
              <span className="admin-orders-form__current">
                Current: {formatExpectedDate(order.expectedDeliveryDate)}
              </span>
            </div>
            <input
              type="date"
              className="admin-orders-form__input"
              value={expectedDate}
              onChange={(event) => setExpectedDate(event.target.value)}
            />
          </label>

          {formError && (
            <p role="alert" style={{ color: 'var(--terracotta)', fontSize: '13px', margin: '6px 0 0', fontWeight: 600 }}>
              {formError}
            </p>
          )}
        </div>

        <footer className="admin-orders-dialog__actions">
          <button type="button" className="admin-orders-dialog__ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="admin-orders-dialog__submit" disabled={!dirty || busy}>
            {busy ? 'Saving…' : 'Save Changes'}
          </button>
        </footer>
      </form>
    </OrderDialog>
  )
}

function RowMenu({ order, open, onToggle, onView, onEdit, onAdvance, onCancel }) {
  const buttonRef = useRef(null)
  const menuRef = useRef(null)
  const [coords, setCoords] = useState(null)
  const advance = nextStatus(order.status)
  const canCancel = order.status !== 'Cancelled' && order.status !== 'Delivered'

  useEffect(() => {
    if (!open) return undefined
    function onDoc(event) {
      if (buttonRef.current?.contains(event.target) || menuRef.current?.contains(event.target)) return
      onToggle(null)
    }
    function onReposition() {
      onToggle(null)
    }
    document.addEventListener('mousedown', onDoc)
    window.addEventListener('resize', onReposition)
    document.querySelector('.admin-main')?.addEventListener('scroll', onReposition)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      window.removeEventListener('resize', onReposition)
      document.querySelector('.admin-main')?.removeEventListener('scroll', onReposition)
    }
  }, [open, onToggle])

  return (
    <div className="admin-orders__pop">
      <button
        ref={buttonRef}
        type="button"
        className="admin-orders__more"
        aria-expanded={open}
        aria-label={`More actions for ${order.number}`}
        onClick={(event) => {
          event.stopPropagation()
          const rect = event.currentTarget.getBoundingClientRect()
          setCoords({ top: rect.bottom + 6, right: window.innerWidth - rect.right })
          onToggle(open ? null : order.id)
        }}
      >
        <Icon name="more" size={16} />
      </button>
      {open
        ? createPortal(
            <div className="admin-orders__menu" role="menu" ref={menuRef} style={coords || undefined}>
              <button
                type="button"
                role="menuitem"
                onClick={(event) => {
                  event.stopPropagation()
                  onToggle(null)
                  onView(order)
                }}
              >
                View
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={(event) => {
                  event.stopPropagation()
                  onToggle(null)
                  onEdit(order)
                }}
              >
                Update status
              </button>
              {advance ? (
                <button
                  type="button"
                  role="menuitem"
                  onClick={(event) => {
                    event.stopPropagation()
                    onToggle(null)
                    onAdvance(order, advance)
                  }}
                >
                  Mark {advance.toLowerCase()}
                </button>
              ) : null}
              {canCancel ? (
                <button
                  type="button"
                  role="menuitem"
                  className="is-danger"
                  onClick={(event) => {
                    event.stopPropagation()
                    onToggle(null)
                    onCancel(order)
                  }}
                >
                  Cancel order
                </button>
              ) : null}
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}

function OrderActions({ order, menuId, setMenuId, onView, onEdit, onAdvance, onCancel }) {
  return (
    <div className="admin-orders__do">
      <button
        type="button"
        className="admin-orders__view"
        onClick={(event) => {
          event.stopPropagation()
          onView(order)
        }}
      >
        View
      </button>
      <RowMenu
        order={order}
        open={menuId === order.id}
        onToggle={setMenuId}
        onView={onView}
        onEdit={onEdit}
        onAdvance={onAdvance}
        onCancel={onCancel}
      />
    </div>
  )
}

function Orders() {
  const navigate = useNavigate()
  const { toast, confirm } = useAdminUi()
  const [params, setParams] = useSearchParams()
  const [viewing, setViewing] = useState(null)
  const [editing, setEditing] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [menuId, setMenuId] = useState(null)
  const compact = useCompactOrders()
  const todayKey = toDateKey(new Date())
  const query = params.get('q') || ''
  const status = params.get('status') || 'all'
  const payment = params.get('payment') || 'all'
  const dateMode = params.get('date') === 'all' ? 'all' : 'day'
  const fromParam = params.get('from') || ''
  const toParam = params.get('to') || ''
  const range = dateMode === 'day'
    ? normalizeRangeKeys(fromParam || todayKey, toParam || fromParam || todayKey)
    : { from: '', to: '' }
  const from = range.from
  const to = range.to
  const isRange = Boolean(from && to && from !== to)
  const coupon = (params.get('coupon') || '').trim().toUpperCase()
  const filtersOn = Boolean(query || status !== 'all' || payment !== 'all' || coupon)
  const rangeStart = dateMode === 'day' ? parseDateKey(from) : null

  const [viewMonth, setViewMonth] = useState(() => {
    const base = parseDateKey(fromParam) || new Date()
    return new Date(base.getFullYear(), base.getMonth(), 1)
  })
  const [pickingEnd, setPickingEnd] = useState(false)
  const [hoverKey, setHoverKey] = useState(null)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true)
      setLoadError(null)
      const res = await getAdminOrders({
        limit: 100,
        ...(coupon ? { couponCode: coupon } : {}),
      })
      setOrders(res.orders || [])
    } catch (err) {
      setLoadError(err.message || 'Failed to load orders from server.')
    } finally {
      setLoading(false)
    }
  }, [coupon])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  useEffect(() => {
    if (params.get('date') === 'all') return
    const next = new URLSearchParams(params)
    let changed = false
    if (params.get('date') !== 'day') {
      next.set('date', 'day')
      changed = true
    }
    const fromKey = params.get('from') || todayKey
    if (!params.get('from')) {
      next.set('from', fromKey)
      changed = true
    }
    if (!params.get('to')) {
      next.set('to', next.get('from') || fromKey)
      changed = true
    } else {
      const normalized = normalizeRangeKeys(next.get('from') || fromKey, next.get('to'))
      if (next.get('from') !== normalized.from || next.get('to') !== normalized.to) {
        next.set('from', normalized.from)
        next.set('to', normalized.to)
        changed = true
      }
    }
    if (changed) setParams(next, { replace: true })
  }, [params, setParams, todayKey])

  useEffect(() => {
    if (!rangeStart) return
    setViewMonth((current) => {
      if (current.getFullYear() === rangeStart.getFullYear() && current.getMonth() === rangeStart.getMonth()) {
        return current
      }
      return new Date(rangeStart.getFullYear(), rangeStart.getMonth(), 1)
    })
  }, [rangeStart])

  function set(key, value) {
    const next = new URLSearchParams(params)
    if (!value || value === 'all') next.delete(key)
    else next.set(key, value)
    setParams(next)
  }

  function applyRange(fromKey, toKey, { continuePicking = false } = {}) {
    const normalized = normalizeRangeKeys(fromKey, toKey)
    const next = new URLSearchParams(params)
    next.set('date', 'day')
    next.set('from', normalized.from)
    next.set('to', normalized.to)
    setParams(next)
    setPickingEnd(continuePicking)
    setHoverKey(null)
    const focus = parseDateKey(normalized.from)
    if (focus) setViewMonth(new Date(focus.getFullYear(), focus.getMonth(), 1))
  }

  function selectDay(day) {
    const key = toDateKey(day)
    if (dateMode === 'all' || !pickingEnd) {
      applyRange(key, key, { continuePicking: true })
      return
    }
    applyRange(from || key, key, { continuePicking: false })
  }

  function showAllOrders() {
    const next = new URLSearchParams(params)
    next.set('date', 'all')
    next.delete('from')
    next.delete('to')
    setParams(next)
    setPickingEnd(false)
    setHoverKey(null)
  }

  function clearFilters() {
    const next = new URLSearchParams()
    if (dateMode === 'day' && from && to) {
      next.set('date', 'day')
      next.set('from', from)
      next.set('to', to)
    } else if (dateMode === 'all') {
      next.set('date', 'all')
    }
    setParams(next)
  }

  const previewRange = useMemo(() => {
    if (dateMode !== 'day' || !from) return { from: '', to: '' }
    if (pickingEnd && hoverKey) return normalizeRangeKeys(from, hoverKey)
    return { from, to }
  }, [dateMode, from, to, pickingEnd, hoverKey])

  const ordersByDay = useMemo(() => {
    const map = new Map()
    for (const order of orders) {
      const key = toDateKey(order.date)
      map.set(key, (map.get(key) || 0) + 1)
    }
    return map
  }, [orders])

  const periodOrders = useMemo(() => {
    if (dateMode !== 'day' || !from || !to) return []
    return orders.filter((order) => matchesDayFilter(order.date, 'day', from, to))
  }, [orders, dateMode, from, to])

  const dayStats = useMemo(() => {
    const pending = periodOrders.filter((order) => order.status === 'Pending').length
    const processing = periodOrders.filter((order) =>
      ['Confirmed', 'Processing', 'Shipped', 'Out for Delivery'].includes(order.status),
    ).length
    const paid = periodOrders.filter((order) => order.paymentStatus === 'Paid').length
    const issues = periodOrders.filter(
      (order) => order.paymentStatus === 'Failed' || order.status === 'Cancelled',
    ).length
    const revenue = periodOrders.reduce((sum, order) => sum + orderAmount(order), 0)
    return {
      orders: periodOrders.length,
      revenue,
      pending,
      processing,
      paid,
      issues,
    }
  }, [periodOrders])

  const boardStats = useMemo(() => {
    if (dateMode === 'day') return dayStats
    const pending = orders.filter((order) => order.status === 'Pending').length
    const processing = orders.filter((order) =>
      ['Confirmed', 'Processing', 'Shipped', 'Out for Delivery'].includes(order.status),
    ).length
    const paid = orders.filter((order) => order.paymentStatus === 'Paid').length
    const issues = orders.filter(
      (order) => order.paymentStatus === 'Failed' || order.status === 'Cancelled',
    ).length
    const revenue = orders.reduce((sum, order) => sum + orderAmount(order), 0)
    return {
      orders: orders.length,
      revenue,
      pending,
      processing,
      paid,
      issues,
    }
  }, [dateMode, dayStats, orders])

  const monthCells = useMemo(() => buildMonthGrid(viewMonth), [viewMonth])

  const filtered = useMemo(() => {
    return [...orders]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .filter((order) => matchesQuery(query, order.number, order.customerName, order.email, order.phone))
      .filter((order) => (status === 'all' ? true : order.status === status))
      .filter((order) => (payment === 'all' ? true : order.paymentStatus === payment))
      .filter((order) => matchesDayFilter(order.date, dateMode, from, to))
      .filter((order) =>
        coupon
          ? String(order.coupon?.code || '').toUpperCase() === coupon
          : true,
      )
  }, [orders, query, status, payment, dateMode, from, to, coupon])

  const paged = usePagedList(
    filtered,
    ADMIN_PAGE_SIZE,
    `${query}|${status}|${payment}|${dateMode}|${from}|${to}|${coupon}|${filtered.length}`,
  )

  useEffect(() => {
    setMenuId(null)
  }, [paged.page, query, status, payment, dateMode, from, to, coupon])

  function openOrder(order) {
    setSelectedId(order.id)
    setViewing(order)
    setMenuId(null)
  }

  async function saveStatus(order, patch) {
    try {
      if (patch.status === 'Cancelled' && order.status !== 'Cancelled') {
        const ok = await confirm({
          title: `Cancel ${order.number}?`,
          message: 'The kitchen will not fulfill this order. Use this only when the customer or operations has cancelled it.',
          confirmLabel: 'Cancel order',
          danger: true,
        })
        if (!ok) return false
        await cancelAdminOrder(order.id, 'Cancelled by admin from orders view')
      } else {
        await updateAdminOrder(order.id, patch)
      }
      toast.success('Order updated')
      await fetchOrders()
      setViewing((current) => (current?.id === order.id ? { ...current, ...patch } : current))
      return true
    } catch (err) {
      toast.error(err.message || 'Failed to update order')
      return false
    }
  }

  async function handleAdvance(order, statusValue) {
    await saveStatus(order, { status: statusValue })
  }

  async function handleCancel(order) {
    await saveStatus(order, { status: 'Cancelled' })
  }

  if (loading) return <LoadingState label="Loading orders" />
  if (loadError) {
    return <ErrorState title="Could not load orders" copy={loadError} onRetry={fetchOrders} />
  }

  const pages = pageList(paged.page, paged.pageCount)
  const emptyTitle =
    orders.length && dateMode === 'day'
      ? isRange
        ? 'No orders in this range'
        : 'No orders on this day'
      : orders.length
        ? 'No orders match'
        : 'No orders yet'
  const emptyCopy =
    orders.length && dateMode === 'day'
      ? 'Pick another day or range on the calendar, or show all orders.'
      : orders.length
        ? 'Try another search or clear a filter.'
        : 'Orders will appear here as customers check out.'
  const todaySelected = dateMode === 'day' && from === todayKey && to === todayKey

  return (
    <div className="admin-orders">
      <header className="admin-orders__head">
        <div>
          <p className="admin-orders__eyebrow">Fulfillment</p>
          <h1 className="admin-title">Orders</h1>
          <p className="admin-orders__copy">Track payment and fulfillment across Nutri-Hub and Self-Care.</p>
        </div>
      </header>

      <section className="admin-orders__board" aria-label="Orders calendar and day overview">
        <div className="admin-orders__calendar">
          <div className="admin-orders__cal-head">
            <button
              type="button"
              className="admin-orders__cal-nav"
              onClick={() =>
                setViewMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))
              }
              aria-label="Previous month"
            >
              ←
            </button>
            <h2>{formatMonthLabel(viewMonth)}</h2>
            <button
              type="button"
              className="admin-orders__cal-nav"
              onClick={() =>
                setViewMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))
              }
              aria-label="Next month"
            >
              →
            </button>
          </div>
          <div className="admin-orders__cal-weekdays" aria-hidden="true">
            {WEEKDAYS.map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
          <div
            className="admin-orders__cal-grid"
            role="grid"
            aria-label={formatMonthLabel(viewMonth)}
            onMouseLeave={() => setHoverKey(null)}
          >
            {monthCells.map((day, index) => {
              if (!day) {
                return <span key={`empty-${index}`} className="admin-orders__cal-cell is-empty" />
              }
              const key = toDateKey(day)
              const count = ordersByDay.get(key) || 0
              const inPreview = dateMode === 'day' && isKeyInRange(key, previewRange.from, previewRange.to)
              const isStart = dateMode === 'day' && key === previewRange.from
              const isEnd = dateMode === 'day' && key === previewRange.to
              const isToday = sameDay(day, new Date())
              return (
                <button
                  key={key}
                  type="button"
                  role="gridcell"
                  className={[
                    'admin-orders__cal-cell',
                    inPreview ? 'is-in-range' : '',
                    isStart ? 'is-range-start' : '',
                    isEnd ? 'is-range-end' : '',
                    isStart && isEnd ? 'is-selected' : '',
                    isToday ? 'is-today' : '',
                    count ? 'has-orders' : '',
                    pickingEnd && key === from ? 'is-picking' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => selectDay(day)}
                  onMouseEnter={() => {
                    if (pickingEnd) setHoverKey(key)
                  }}
                  aria-label={`${formatDayLabel(day)}${count ? `, ${count} orders` : ''}`}
                  aria-pressed={inPreview}
                >
                  <span className="admin-orders__cal-day">{day.getDate()}</span>
                  {count ? <span className="admin-orders__cal-dot" aria-hidden="true" /> : null}
                </button>
              )
            })}
          </div>
          <div className="admin-orders__cal-foot">
            <button
              type="button"
              className={`admin-orders__all-btn${dateMode === 'all' ? ' is-on' : ''}`}
              onClick={showAllOrders}
            >
              All orders
            </button>
            {!todaySelected ? (
              <button
                type="button"
                className="admin-orders__today-btn"
                onClick={() => applyRange(todayKey, todayKey, { continuePicking: true })}
              >
                Today
              </button>
            ) : null}
            <p className="admin-orders__cal-hint">
              {pickingEnd
                ? 'Tap another day to set the end of the range.'
                : 'Tap a day, then another to select a range.'}
            </p>
          </div>
        </div>

        <div className="admin-orders__daypane">
          <div className="admin-orders__daypane-head">
            <p className="admin-orders__eyebrow">{isRange ? 'Range overview' : 'Day overview'}</p>
            <h2>
              {dateMode === 'all'
                ? 'All orders'
                : formatRangeLabel(from, to)}
            </h2>
            <p className="admin-orders__daypane-copy">
              {dateMode === 'all'
                ? 'Showing the full order list. Pick a day on the calendar to focus the table.'
                : pickingEnd
                  ? 'Start date set — choose an end date, or leave it as a single day.'
                  : isRange
                    ? 'Metrics and table below are scoped to this date range.'
                    : 'Metrics and table below are scoped to this day.'}
            </p>
          </div>
          <div className="admin-orders__daycards" aria-label="Selected period metrics">
            <div className="admin-orders__daycard">
              <strong>{boardStats.orders}</strong>
              <span>Orders</span>
            </div>
            <div className="admin-orders__daycard">
              <strong>{formatPrice(boardStats.revenue)}</strong>
              <span>Revenue</span>
            </div>
            <button
              type="button"
              className={`admin-orders__daycard${status === 'Pending' ? ' is-on' : ''}`}
              onClick={() => set('status', status === 'Pending' ? 'all' : 'Pending')}
            >
              <strong>{boardStats.pending}</strong>
              <span>Pending</span>
            </button>
            <button
              type="button"
              className={`admin-orders__daycard${status === 'Processing' ? ' is-on' : ''}`}
              onClick={() => set('status', status === 'Processing' ? 'all' : 'Processing')}
            >
              <strong>{boardStats.processing}</strong>
              <span>In fulfillment</span>
            </button>
            <div className="admin-orders__daycard">
              <strong>{boardStats.paid}</strong>
              <span>Paid</span>
            </div>
            <button
              type="button"
              className={`admin-orders__daycard admin-orders__daycard--alert${payment === 'Failed' || status === 'Cancelled' ? ' is-on' : ''}`}
              onClick={() => set('payment', payment === 'Failed' ? 'all' : 'Failed')}
            >
              <strong>{boardStats.issues}</strong>
              <span>Issues</span>
            </button>
          </div>
        </div>
      </section>

      <div className="admin-orders__toolbar">
        <label className="admin-orders__search">
          <Icon name="search" size={15} />
          <input
            value={query}
            onChange={(event) => set('q', event.target.value)}
            placeholder="Search order or customer"
          />
        </label>
        <label className="admin-orders__select">
          <span>Coupon</span>
          <input
            value={coupon}
            onChange={(event) => set('coupon', event.target.value.toUpperCase())}
            placeholder="Code"
            aria-label="Filter by coupon code"
          />
        </label>
        <label className="admin-orders__select">
          <span>Payment</span>
          <select value={payment} onChange={(event) => set('payment', event.target.value)}>
            <option value="all">All</option>
            {PAYMENT_STATUSES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label className="admin-orders__select">
          <span>Status</span>
          <select value={status} onChange={(event) => set('status', event.target.value)}>
            <option value="all">All</option>
            {ORDER_STATUSES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        {filtersOn ? (
          <button type="button" className="admin-orders__clear" onClick={clearFilters}>
            Clear filters
          </button>
        ) : null}
      </div>

      <section className="admin-orders__sheet">
        {!compact ? (
          <div className="admin-orders__table-wrap">
            {paged.items.length ? (
              <table className="admin-orders__table">
                <caption className="sr-only">Orders</caption>
                <thead>
                  <tr>
                    <th>Order number</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Payment status</th>
                    <th>Order status</th>
                    <th className="is-actions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.items.map((order, index) => {
                    const count = itemCount(order)
                    return (
                      <tr
                        key={order.id}
                        className={selectedId === order.id ? 'is-selected' : undefined}
                        style={{ '--i': index }}
                        onClick={() => openOrder(order)}
                      >
                        <td>
                          <div className="admin-orders__number">
                            <Link to={`/admin/orders/${order.id}`} onClick={(event) => event.stopPropagation()}>
                              {order.number}
                            </Link>
                            <span>
                              {count} {count === 1 ? 'item' : 'items'}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="admin-orders__customer">
                            <span className="admin-orders__avatar" aria-hidden="true">
                              {initials(order.customerName)}
                            </span>
                            <div>
                              <strong>{order.customerName}</strong>
                              <span>{order.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="admin-orders__date">{formatAdminDate(order.date)}</td>
                        <td className="admin-orders__amount">{formatPrice(order.amount)}</td>
                        <td>
                          <StatusBadge status={order.paymentStatus} kind="pay" />
                        </td>
                        <td>
                          <StatusBadge status={order.status} />
                        </td>
                        <td>
                          <OrderActions
                            order={order}
                            menuId={menuId}
                            setMenuId={setMenuId}
                            onView={openOrder}
                            onEdit={setEditing}
                            onAdvance={handleAdvance}
                            onCancel={handleCancel}
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            ) : (
              <div className="admin-orders__empty">
                <h3>{emptyTitle}</h3>
                <p>{emptyCopy}</p>
                {filtersOn ? (
                  <button type="button" className="admin-orders__clear" onClick={clearFilters}>
                    Clear filters
                  </button>
                ) : null}
              </div>
            )}
          </div>
        ) : (
          <div className="admin-orders__cards">
            {paged.items.length ? (
              paged.items.map((order, index) => {
                const count = itemCount(order)
                return (
                  <article
                    key={order.id}
                    className={`admin-orders__card${selectedId === order.id ? ' is-selected' : ''}`}
                    style={{ '--i': index }}
                    onClick={() => openOrder(order)}
                  >
                    <div className="admin-orders__card-top">
                      <div className="admin-orders__number">
                        <strong>{order.number}</strong>
                        <span>
                          {formatAdminDate(order.date)} · {count} {count === 1 ? 'item' : 'items'}
                        </span>
                      </div>
                      <OrderActions
                        order={order}
                        menuId={menuId}
                        setMenuId={setMenuId}
                        onView={openOrder}
                        onEdit={setEditing}
                        onAdvance={handleAdvance}
                        onCancel={handleCancel}
                      />
                    </div>
                    <div className="admin-orders__customer">
                      <span className="admin-orders__avatar" aria-hidden="true">
                        {initials(order.customerName)}
                      </span>
                      <div>
                        <strong>{order.customerName}</strong>
                        <span>{order.email}</span>
                      </div>
                      <strong className="admin-orders__amount">{formatPrice(order.amount)}</strong>
                    </div>
                    <div className="admin-orders__card-badges">
                      <StatusBadge status={order.paymentStatus} kind="pay" />
                      <StatusBadge status={order.status} />
                    </div>
                  </article>
                )
              })
            ) : (
              <div className="admin-orders__empty">
                <h3>{emptyTitle}</h3>
                <p>{emptyCopy}</p>
                {filtersOn ? (
                  <button type="button" className="admin-orders__clear" onClick={clearFilters}>
                    Clear filters
                  </button>
                ) : null}
              </div>
            )}
          </div>
        )}

        <footer className="admin-orders__foot">
          <span>
            Showing {paged.from}–{paged.to} of {paged.total}
          </span>
          {paged.total ? (
            <nav className="admin-orders__pages" aria-label="Pagination">
              <button type="button" disabled={paged.page <= 1} onClick={() => paged.setPage(paged.page - 1)} aria-label="Previous page">
                ←
              </button>
              {pages.map((page, index) => {
                const prev = pages[index - 1]
                return (
                  <span key={page} className="admin-orders__pagewrap">
                    {prev && page - prev > 1 ? <span className="admin-orders__ellipsis">…</span> : null}
                    <button
                      type="button"
                      className={page === paged.page ? 'is-current' : undefined}
                      onClick={() => paged.setPage(page)}
                      aria-current={page === paged.page ? 'page' : undefined}
                    >
                      {page}
                    </button>
                  </span>
                )
              })}
              <button
                type="button"
                disabled={paged.page >= paged.pageCount}
                onClick={() => paged.setPage(paged.page + 1)}
                aria-label="Next page"
              >
                →
              </button>
            </nav>
          ) : null}
        </footer>
      </section>

      {viewing ? (
        <OrderView
          order={viewing}
          onClose={() => setViewing(null)}
          onEdit={() => {
            setEditing(viewing)
            setViewing(null)
          }}
          onOpen={() => navigate(`/admin/orders/${viewing.id}`)}
        />
      ) : null}

      {editing ? (
        <StatusForm
          order={editing}
          onClose={() => setEditing(null)}
          onSave={(patch) => saveStatus(editing, patch)}
        />
      ) : null}
    </div>
  )
}

export default Orders

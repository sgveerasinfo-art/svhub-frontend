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

const DATE_OPTIONS = [
  { value: 'all', label: 'All time' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: 'month', label: 'This month' },
  { value: 'custom', label: 'Custom' },
]

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

function matchesDateFilter(iso, range, from, to) {
  const time = new Date(iso).getTime()
  if (Number.isNaN(time)) return false
  const today = startOfDay(new Date())
  if (range === '7d') return time >= today.getTime() - 6 * 86400000
  if (range === '30d') return time >= today.getTime() - 29 * 86400000
  if (range === 'month') return time >= new Date(today.getFullYear(), today.getMonth(), 1).getTime()
  if (range === 'custom') {
    const start = from ? new Date(`${from}T00:00:00`).getTime() : -Infinity
    const end = to ? new Date(`${to}T23:59:59.999`).getTime() : Infinity
    return time >= start && time <= end
  }
  return true
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
  const initialDateStr = useMemo(() => {
    if (!order.expectedDeliveryDate) return ''
    const d = new Date(order.expectedDeliveryDate)
    return !Number.isNaN(d.getTime()) ? d.toISOString().slice(0, 10) : ''
  }, [order.expectedDeliveryDate])
  const [expectedDate, setExpectedDate] = useState(initialDateStr)
  const [busy, setBusy] = useState(false)
  const dirty =
    status !== order.status ||
    paymentStatus !== order.paymentStatus ||
    expectedDate !== initialDateStr

  async function submit(event) {
    event.preventDefault()
    if (!dirty || busy) return
    setBusy(true)
    const payload = { status, paymentStatus }
    if (expectedDate && expectedDate !== initialDateStr) {
      payload.expectedDeliveryDate = new Date(`${expectedDate}T12:00:00.000Z`).toISOString()
    }
    const ok = await onSave(payload)
    setBusy(false)
    if (ok) onClose()
  }

  return (
    <OrderDialog eyebrow="Fulfillment" title={order.number} copy="Update payment, status, or expected delivery." onClose={onClose}>
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
            <select value={status} onChange={(event) => setStatus(event.target.value)}>
              {ORDER_STATUSES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
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
  const query = params.get('q') || ''
  const status = params.get('status') || 'all'
  const payment = params.get('payment') || 'all'
  const date = params.get('date') || 'all'
  const from = params.get('from') || ''
  const to = params.get('to') || ''
  const filtersOn = Boolean(query || status !== 'all' || payment !== 'all' || date !== 'all' || from || to)

  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true)
      setLoadError(null)
      const res = await getAdminOrders({ limit: 100 })
      setOrders(res.orders || [])
    } catch (err) {
      setLoadError(err.message || 'Failed to load orders from server.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  function set(key, value) {
    const next = new URLSearchParams(params)
    if (!value || value === 'all') next.delete(key)
    else next.set(key, value)
    if (key === 'date' && value !== 'custom') {
      next.delete('from')
      next.delete('to')
    }
    setParams(next)
  }

  function clearFilters() {
    setParams(new URLSearchParams())
  }

  const stats = useMemo(
    () => ({
      total: orders.length,
      pending: orders.filter((order) => order.status === 'Pending').length,
      processing: orders.filter((order) => order.status === 'Processing').length,
      issues: orders.filter((order) => order.paymentStatus === 'Failed').length,
    }),
    [orders],
  )

  const filtered = useMemo(() => {
    return [...orders]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .filter((order) => matchesQuery(query, order.number, order.customerName, order.email, order.phone))
      .filter((order) => (status === 'all' ? true : order.status === status))
      .filter((order) => (payment === 'all' ? true : order.paymentStatus === payment))
      .filter((order) => matchesDateFilter(order.date, date, from, to))
  }, [orders, query, status, payment, date, from, to])

  const paged = usePagedList(
    filtered,
    ADMIN_PAGE_SIZE,
    `${query}|${status}|${payment}|${date}|${from}|${to}|${filtered.length}`,
  )

  useEffect(() => {
    setMenuId(null)
  }, [paged.page, query, status, payment, date, from, to])

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
  const emptyTitle = orders.length ? 'No orders match' : 'No orders yet'
  const emptyCopy = orders.length ? 'Try another search or clear a filter.' : 'Orders will appear here as customers check out.'

  return (
    <div className="admin-orders">
      <header className="admin-orders__head">
        <div>
          <p className="admin-orders__eyebrow">Fulfillment</p>
          <h1 className="admin-title">Orders</h1>
          <p className="admin-orders__copy">Track payment and fulfillment across Nutri-Hub and Self-Care.</p>
        </div>
      </header>

      <section className="admin-orders__stats" aria-label="Order summary">
        <button
          type="button"
          className={`admin-orders__stat${!filtersOn ? ' is-on' : ''}`}
          onClick={clearFilters}
        >
          <strong>{stats.total}</strong>
          <span>Total orders</span>
        </button>
        <button
          type="button"
          className={`admin-orders__stat${status === 'Pending' ? ' is-on' : ''}`}
          onClick={() => set('status', status === 'Pending' ? 'all' : 'Pending')}
        >
          <strong>{stats.pending}</strong>
          <span>Pending</span>
        </button>
        <button
          type="button"
          className={`admin-orders__stat${status === 'Processing' ? ' is-on' : ''}`}
          onClick={() => set('status', status === 'Processing' ? 'all' : 'Processing')}
        >
          <strong>{stats.processing}</strong>
          <span>Processing</span>
        </button>
        <button
          type="button"
          className={`admin-orders__stat admin-orders__stat--alert${payment === 'Failed' ? ' is-on' : ''}`}
          onClick={() => set('payment', payment === 'Failed' ? 'all' : 'Failed')}
        >
          <strong>{stats.issues}</strong>
          <span>Issues</span>
        </button>
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
          <span>Date</span>
          <select value={date} onChange={(event) => set('date', event.target.value)}>
            {DATE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        {date === 'custom' ? (
          <>
            <label className="admin-orders__select admin-orders__select--date">
              <span>From</span>
              <input type="date" value={from} onChange={(event) => set('from', event.target.value)} />
            </label>
            <label className="admin-orders__select admin-orders__select--date">
              <span>To</span>
              <input type="date" value={to} onChange={(event) => set('to', event.target.value)} />
            </label>
          </>
        ) : null}
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

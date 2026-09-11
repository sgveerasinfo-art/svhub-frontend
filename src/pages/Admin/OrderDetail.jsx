import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getAdminOrder, updateAdminOrder, cancelAdminOrder } from '../../api/adminOrders.js'
import { useAdminUi } from '../../context/AdminUi.jsx'
import {
  ORDER_STATUSES,
  formatAdminDateTime,
  orderIdFromNumber,
  storefrontLabel,
} from '../../data/admin.js'
import { formatPrice } from '../../utils/money.js'
import { Icon } from '../../components/admin/icons.jsx'
import {
  AdminButton,
  EmptyState,
  LoadingState,
  Money,
  StatusBadge,
  StorefrontChip,
} from '../../components/admin/ui.jsx'
import './OrderDetail.css'

const TIMELINE_STAGES = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered']

function cleanSlug(val) {
  return String(val || '')
    .replace(/[^a-z0-9]/gi, '')
    .toLowerCase()
}

export default function AdminOrderDetail() {
  const { id, orderId } = useParams()
  const paramId = id || orderId
  const { toast } = useAdminUi()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchOrder = useCallback(async () => {
    if (!paramId) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      setError(null)
      const res = await getAdminOrder(paramId)
      setOrder(res.order)
    } catch (err) {
      setError(err.message || 'Order not found')
    } finally {
      setLoading(false)
    }
  }, [paramId])

  useEffect(() => {
    fetchOrder()
  }, [fetchOrder])

  if (loading) {
    return (
      <div className="admin-order-page">
        <LoadingState label="Loading order details..." lines={8} />
      </div>
    )
  }

  if (!order || error) {
    return (
      <div className="admin-order-page">
        <EmptyState
          title={`Order "${paramId}" not found`}
          copy={error || 'The requested order ID could not be located in the operational database. You can browse active orders.'}
          action={
            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
              <AdminButton to="/admin/orders" variant="ghost">
                View all orders
              </AdminButton>
            </div>
          }
        />
      </div>
    )
  }

  return <OrderDetailContent key={order.id} order={order} onOrderUpdated={setOrder} toast={toast} />
}

function OrderDetailContent({ order, onOrderUpdated, toast }) {
  const [currentStatus, setCurrentStatus] = useState(order.status)
  const [currentPaymentStatus, setCurrentPaymentStatus] = useState(order.paymentStatus)
  const [notes, setNotes] = useState(order.notes || '')
  const [savingNotes, setSavingNotes] = useState(false)

  // Critical status confirmation modal state
  const [criticalModal, setCriticalModal] = useState(null)
  const [courierInput, setCourierInput] = useState(order.courier || '')
  const [trackingUrlInput, setTrackingUrlInput] = useState(order.trackingUrl || '')
  const [shippedFormError, setShippedFormError] = useState('')
  const [cancelReasonInput, setCancelReasonInput] = useState('')

  // Sync tracking input states whenever order prop updates
  useEffect(() => {
    setCourierInput(order.courier || '')
    setTrackingUrlInput(order.trackingUrl || '')
    setCurrentStatus(order.status)
    setCurrentPaymentStatus(order.paymentStatus)
  }, [order.courier, order.trackingUrl, order.status, order.paymentStatus])

  const headerTitle = useMemo(() => {
    if (!order.number) return 'Order #SVH12345'
    return order.number.startsWith('Order ') ? order.number : `Order ${order.number}`
  }, [order.number])

  const currentStageIndex = TIMELINE_STAGES.indexOf(currentStatus)
  const isCancelled = currentStatus === 'Cancelled'

  // Copy helper with toast
  function copyToClipboard(text, label) {
    if (!text) return
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`Copied ${label} to clipboard`)
    }).catch(() => {
      toast.info(text)
    })
  }

  // Handle status changes with confirmation for critical statuses
  function handleStatusSelect(newStatus) {
    if (newStatus === currentStatus) {
      if (newStatus === 'Shipped') {
        setCriticalModal({ targetStatus: 'Shipped', isEditing: true })
      }
      return
    }

    // Critical statuses require confirmation
    if (['Shipped', 'Delivered', 'Cancelled'].includes(newStatus)) {
      setCriticalModal({ targetStatus: newStatus })
    } else {
      applyStatusUpdate(newStatus)
    }
  }

  async function applyStatusUpdate(newStatus, extra = {}) {
    try {
      let res
      if (newStatus === 'Cancelled') {
        const reason = extra.note || cancelReasonInput.trim() || 'Order cancelled by SV Hub Administration'
        res = await cancelAdminOrder(order.id, reason)
      } else {
        const patch = {
          status: newStatus,
          ...extra,
        }
        res = await updateAdminOrder(order.id, patch)
      }
      if (res?.order) {
        onOrderUpdated(res.order)
        setCurrentStatus(res.order.status)
        setCurrentPaymentStatus(res.order.paymentStatus)
        toast.success(`${headerTitle} updated to ${res.order.status}`)
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update order status')
    } finally {
      setCriticalModal(null)
    }
  }

  function confirmCriticalTransition() {
    if (!criticalModal) return
    const { targetStatus } = criticalModal

    if (targetStatus === 'Shipped') {
      // Frontend validation before submitting
      const providerTrimmed = courierInput.trim()
      let urlTrimmed = trackingUrlInput.trim()
      if (!providerTrimmed) {
        setShippedFormError('Delivery Provider is required.')
        return
      }
      if (!urlTrimmed) {
        setShippedFormError('Tracking URL is required.')
        return
      }

      // Auto-prefix protocol if missing (e.g. www.delhivery.com/track/123)
      if (!/^https?:\/\//i.test(urlTrimmed)) {
        if (/^[a-z0-9+-.]+:/i.test(urlTrimmed)) {
          setShippedFormError('Only http:// and https:// URLs are allowed.')
          return
        }
        urlTrimmed = `https://${urlTrimmed}`
      }

      try {
        const parsed = new URL(urlTrimmed)
        if (!['http:', 'https:'].includes(parsed.protocol)) {
          setShippedFormError('Tracking URL must start with http:// or https://')
          return
        }
      } catch {
        setShippedFormError('Please enter a valid tracking URL (e.g. https://provider.com/track/ABC123)')
        return
      }
      setShippedFormError('')
      applyStatusUpdate('Shipped', {
        courier: providerTrimmed,
        trackingUrl: urlTrimmed,
        note: `Dispatched via ${providerTrimmed}`,
      })
    } else if (targetStatus === 'Delivered') {
      applyStatusUpdate('Delivered', {
        note: 'Shipment delivered to customer address and verified.',
      })
    } else if (targetStatus === 'Cancelled') {
      applyStatusUpdate('Cancelled', {
        note: cancelReasonInput.trim() || 'Order cancelled by SV Hub Administration',
      })
    }
  }

  async function handleSaveNotes(event) {
    event.preventDefault()
    setSavingNotes(true)
    try {
      const res = await updateAdminOrder(order.id, { notes })
      if (res?.order) {
        onOrderUpdated(res.order)
      }
      toast.success('Internal notes saved')
    } catch (err) {
      toast.error(err.message || 'Failed to save internal notes')
    } finally {
      setSavingNotes(false)
    }
  }

  function handlePrint() {
    window.print()
  }

  function handleResendReceipt() {
    toast.success(`Receipt & invoice re-sent to ${order.email || 'customer'}`)
  }

  // Next status progression helper
  const nextStatusTarget = useMemo(() => {
    if (currentStageIndex >= 0 && currentStageIndex < TIMELINE_STAGES.length - 1) {
      return TIMELINE_STAGES[currentStageIndex + 1]
    }
    return null
  }, [currentStageIndex])

  return (
    <div className="admin-order-page">
      {/* Navigation Breadcrumb */}
      <div className="admin-order-nav">
        <Link to="/admin/orders" className="admin-order-back">
          <Icon name="arrow" size={15} />
          <span>Back to all orders</span>
        </Link>
        <div className="admin-order-nav__meta">
          <span>Operations Dashboard</span>
          <span>/</span>
          <span>Orders</span>
          <span>/</span>
          <strong>{order.number}</strong>
        </div>
      </div>

      {/* Main Order Header */}
      <header className="admin-order-header">
        <div className="admin-order-header__info">
          <div className="admin-order-eyebrow">
            <span>Fulfillment</span>
            <span className="admin-dot-sep" />
            <span>ID: {order.id}</span>
            <span className="admin-dot-sep" />
            <span>{order.storefronts?.map((sf) => storefrontLabel(sf)).join(' & ') || 'SV Hub Storefront'}</span>
          </div>
          <div className="admin-order-header__title-row">
            <h1 className="admin-order-title">{headerTitle}</h1>
            <div className="admin-order-header__badges">
              <StatusBadge status={currentStatus} />
              <StatusBadge status={currentPaymentStatus} kind="pay" />
              {order.storefronts?.map((sf) => (
                <StorefrontChip key={sf} id={sf} />
              ))}
            </div>
          </div>
          <p className="admin-order-placed">
            Placed on <strong>{formatAdminDateTime(order.date)}</strong> · Customer: <strong>{order.customerName}</strong>
          </p>
        </div>

        <div className="admin-order-header__actions">
          <AdminButton variant="ghost" icon="printer" onClick={handlePrint}>
            Print invoice
          </AdminButton>
          <AdminButton variant="ghost" icon="mail" onClick={handleResendReceipt}>
            Send receipt
          </AdminButton>
          <AdminButton to="/admin/orders" variant="ghost">
            All orders
          </AdminButton>
        </div>
      </header>

      {/* Cancellation Insight Banner — shown when order is CANCELLED */}
      {isCancelled && (() => {
        const cancelEvent = order.history
          ? [...order.history].reverse().find((h) => h.status === 'CANCELLED' || h.status === 'Cancelled')
          : null
        const byRole = order.cancelledByRole || cancelEvent?.cancelledBy || null
        const reason = order.cancellationReason || cancelEvent?.note || null
        const cancelledAt = cancelEvent?.at ? formatAdminDateTime(cancelEvent.at) : null

        const isAdminCancel = byRole === 'admin'
        const isCustomerCancel = byRole === 'customer'

        return (
          <div className={`admin-cancel-insight ${isAdminCancel ? 'admin-cancel-insight--admin' : isCustomerCancel ? 'admin-cancel-insight--customer' : 'admin-cancel-insight--unknown'}`}>
            <div className="admin-cancel-insight__icon">
              <Icon name="alert" size={20} />
            </div>
            <div className="admin-cancel-insight__body">
              <div className="admin-cancel-insight__who">
                {isAdminCancel && <span className="admin-cancel-tag admin-cancel-tag--admin">Cancelled by Admin</span>}
                {isCustomerCancel && <span className="admin-cancel-tag admin-cancel-tag--customer">Cancelled by Customer</span>}
                {!byRole && <span className="admin-cancel-tag admin-cancel-tag--unknown">Order Cancelled</span>}
                {cancelledAt && <span className="admin-cancel-insight__time">{cancelledAt}</span>}
              </div>
              <p className="admin-cancel-insight__reason">
                <strong>Reason:</strong>{' '}
                {reason || (isAdminCancel ? 'Order cancelled by SV Hub Administration' : isCustomerCancel ? 'Cancelled by customer' : 'No reason recorded')}
              </p>
              {['PAID', 'SUCCESS', 'REFUNDED', 'PARTIALLY_REFUNDED'].includes(order.rawPaymentStatus) && (
                <p className="admin-cancel-insight__refund">
                  <Icon name="credit-card" size={13} />
                  <span>Payment was captured — refund may have been auto-initiated. Check Payment Information below.</span>
                </p>
              )}
            </div>
          </div>
        )
      })()}

      {/* Main 2-Column Dashboard Grid */}
      <div className="admin-order-grid">
        {/* Left / Main Column */}
        <div className="admin-order-main">
          {/* Order Status Timeline Stepper */}
          <section className="admin-card-box admin-timeline-card" aria-label="Order status timeline">
            <div className="admin-timeline-header">
              <h2>
                <Icon name="package" size={17} />
                <span>Order Status Timeline</span>
              </h2>
              <span className="admin-timeline-kicker">
                {isCancelled
                  ? 'Order Cancelled'
                  : `Stage ${Math.max(1, currentStageIndex + 1)} of ${TIMELINE_STAGES.length}`}
              </span>
            </div>

            <div className="admin-timeline-stepper">
              <div className="admin-timeline-track">
                <div
                  className="admin-timeline-track__fill"
                  style={{
                    width: isCancelled
                      ? '100%'
                      : `${Math.max(0, (currentStageIndex / (TIMELINE_STAGES.length - 1)) * 100)}%`,
                    backgroundColor: isCancelled ? 'var(--terracotta)' : 'var(--sv-green)',
                  }}
                />
              </div>

              {TIMELINE_STAGES.map((stage, idx) => {
                const isDone = !isCancelled && idx < currentStageIndex
                const isCurrent = !isCancelled && idx === currentStageIndex
                const isUpcoming = !isCancelled && idx > currentStageIndex

                // Find timestamp for stage if recorded in history
                const hist = order.history?.find((h) => h.status === stage)

                return (
                  <div
                    key={stage}
                    className={`admin-timeline-step ${isDone ? 'is-done' : ''} ${isCurrent ? 'is-current' : ''} ${
                      isCancelled && idx === currentStageIndex ? 'is-cancelled' : ''
                    }`}
                  >
                    <div className="admin-timeline-step__node">
                      {isDone ? (
                        <Icon name="check" size={14} />
                      ) : isCancelled && idx === currentStageIndex ? (
                        '✕'
                      ) : (
                        <span>{idx + 1}</span>
                      )}
                    </div>
                    <div className="admin-timeline-step__info">
                      <span className="admin-timeline-step__label">{stage}</span>
                      <span className="admin-timeline-step__time">
                        {hist ? formatAdminDateTime(hist.at) : isCurrent ? 'In progress' : isUpcoming ? 'Pending' : '—'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Quick Action Footer within Timeline */}
            <div className="admin-timeline-quickbar">
              <div className="admin-timeline-quickbar__left">
                <span>Current fulfillment stage:</span>
                <StatusBadge status={currentStatus} />
              </div>
              <div className="admin-timeline-quickbar__actions">
                {nextStatusTarget && !isCancelled && (
                  <AdminButton
                    size="sm"
                    variant="primary"
                    icon="arrow"
                    onClick={() => handleStatusSelect(nextStatusTarget)}
                  >
                    Advance to {nextStatusTarget}
                  </AdminButton>
                )}
                <AdminButton
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    const el = document.getElementById('admin-status-dropdown')
                    el?.focus()
                  }}
                >
                  Change status
                </AdminButton>
              </div>
            </div>
          </section>

          {/* Ordered Products Table Card */}
          <section className="admin-card-box" aria-label="Order line items">
            <div className="admin-card-box__head">
              <h2>
                <Icon name="orders" size={17} />
                <span>Line Items ({order.items?.length || 0})</span>
              </h2>
              <div className="admin-actions">
                {order.storefronts?.map((sf) => (
                  <StorefrontChip key={sf} id={sf} />
                ))}
              </div>
            </div>

            <div className="admin-table-wrap">
              <table className="admin-order-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>House</th>
                    <th>Price</th>
                    <th style={{ textAlign: 'center' }}>Quantity</th>
                    <th style={{ textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items?.map((item) => (
                    <tr key={`${item.id}-${item.weight || 'std'}`}>
                      <td>
                        <div className="admin-item-cell">
                          {item.image ? (
                            <img className="admin-item-thumb" src={item.image} alt={item.name} />
                          ) : (
                            <div className="admin-item-thumb admin-item-thumb--placeholder">
                              {item.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="admin-item-meta">
                            <strong className="admin-item-name">{item.name}</strong>
                            <div className="admin-item-sub">
                              {item.weight && <span>{item.weight}</span>}
                              <span>•</span>
                              <span>SKU: {item.slug || item.id}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`admin-chip admin-chip--${item.storefront || 'nutri-hub'} admin-chip--sm`}>
                          {storefrontLabel(item.storefront)}
                        </span>
                      </td>
                      <td className="is-num">{formatPrice(item.price)}</td>
                      <td style={{ textAlign: 'center' }} className="is-num">
                        <strong>{item.quantity}</strong>
                      </td>
                      <td style={{ textAlign: 'right' }} className="is-num">
                        <strong>{formatPrice(item.price * item.quantity)}</strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Summary Calculation */}
            <div className="admin-financials">
              <dl className="admin-financials-dl">
                <div>
                  <dt>Subtotal</dt>
                  <dd>
                    <Money value={order.subtotal} />
                  </dd>
                </div>
                <div>
                  <dt>Shipping</dt>
                  <dd>{order.shipping ? <Money value={order.shipping} /> : <span style={{ color: 'var(--leaf-green)' }}>Free</span>}</dd>
                </div>
                {order.discount > 0 && (
                  <div className="is-discount">
                    <dt>Discount</dt>
                    <dd>-<Money value={order.discount} /></dd>
                  </div>
                )}
                <div className="is-total">
                  <dt>Total Amount</dt>
                  <dd>
                    <Money value={order.amount} />
                  </dd>
                </div>
              </dl>
            </div>
          </section>

          {/* Internal Staff Notes & Timeline Activity Log */}
          <section className="admin-card-box admin-notes-card" aria-label="Staff notes and order history">
            <div className="admin-card-box__head">
              <h2>
                <Icon name="edit" size={16} />
                <span>Internal Staff Notes & Activity Log</span>
              </h2>
            </div>
            <div className="admin-card-box__body">
              <form className="admin-notes-form" onSubmit={handleSaveNotes}>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add internal kitchen packing instructions, courier references, or customer preferences..."
                />
                <div className="admin-notes-actions">
                  <AdminButton type="submit" size="sm" variant="primary" disabled={savingNotes}>
                    {savingNotes ? 'Saving…' : 'Save note'}
                  </AdminButton>
                </div>
              </form>

              {/* History / Audit Log */}
              {order.history && order.history.length > 0 && (
                <div className="admin-audit-log">
                  <h4>Status Event Log</h4>
                  <ul className="admin-audit-list">
                    {order.history.map((event, idx) => (
                      <li key={idx} className="admin-audit-item">
                        <span className="admin-audit-dot" />
                        <div className="admin-audit-meta">
                          <strong>{event.status}</strong>
                          {event.note && <span> — {event.note}</span>}
                          <em>({formatAdminDateTime(event.at)})</em>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right / Sidebar Column */}
        <aside className="admin-order-aside">
          {/* Quick Status Control Panel */}
          <div className="admin-card-box admin-status-control">
            <div className="admin-card-box__head" style={{ padding: '0 0 12px', borderBottom: '1px solid var(--admin-line)' }}>
              <h2>
                <Icon name="settings" size={16} />
                <span>Update Order Status</span>
              </h2>
            </div>
            <div style={{ paddingTop: 14 }} className="admin-status-form">
              <div className="admin-status-select-wrap">
                <label htmlFor="admin-status-dropdown">Fulfillment Stage</label>
                <select
                  id="admin-status-dropdown"
                  className="admin-status-select"
                  value={currentStatus}
                  onChange={(e) => handleStatusSelect(e.target.value)}
                >
                  {ORDER_STATUSES.map((statusOption) => (
                    <option key={statusOption} value={statusOption}>
                      {statusOption} {statusOption === currentStatus ? '(Current)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {['Shipped', 'Out for Delivery', 'Delivered'].includes(currentStatus) && (
                <button
                  type="button"
                  onClick={() => setCriticalModal({ targetStatus: 'Shipped', isEditing: true })}
                  style={{
                    marginTop: 10,
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: '1px solid var(--sv-green, #5a7a2e)',
                    background: 'rgba(90,122,46,0.08)',
                    color: 'var(--sv-green, #5a7a2e)',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Edit Shipment / Tracking Link
                </button>
              )}

              {currentStatus === 'Cancelled' ? (
                <div className="admin-status-warning">
                  <Icon name="alert" size={16} />
                  <span>This order is cancelled. Fulfillment has been stopped.</span>
                </div>
              ) : (
                <p style={{ fontSize: 12, color: 'var(--admin-mute)', margin: '8px 0 0' }}>
                  Changing to critical statuses (Shipped, Delivered, or Cancelled) will prompt a confirmation modal.
                </p>
              )}
            </div>
          </div>

          {/* Customer Details Card */}
          <div className="admin-card-box admin-customer-card">
            <div className="admin-card-box__head">
              <h2>
                <Icon name="user" size={16} />
                <span>Customer</span>
              </h2>
              <Link
                to={`/admin/customers?q=${encodeURIComponent(order.customerName || '')}`}
                className="admin-textlink"
                style={{ fontSize: 12 }}
              >
                View profile
              </Link>
            </div>
            <div className="admin-card-box__body" style={{ display: 'grid', gap: 14 }}>
              <div className="admin-customer-profile">
                <div className="admin-customer-avatar">
                  {order.customerName
                    ? order.customerName
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase()
                    : 'CU'}
                </div>
                <div className="admin-customer-meta">
                  <strong>{order.customerName || 'Guest Customer'}</strong>
                  <span>Verified SV Hub Member</span>
                </div>
              </div>

              <div className="admin-contact-list">
                <div className="admin-contact-item">
                  <div className="admin-contact-item__left">
                    <Icon name="mail" size={14} />
                    <a href={`mailto:${order.email}`} title="Send email">
                      {order.email || 'No email provided'}
                    </a>
                  </div>
                  {order.email && (
                    <button
                      type="button"
                      className="admin-copy-btn"
                      title="Copy email"
                      onClick={() => copyToClipboard(order.email, 'email')}
                    >
                      <Icon name="copy" size={13} />
                    </button>
                  )}
                </div>

                <div className="admin-contact-item">
                  <div className="admin-contact-item__left">
                    <Icon name="phone" size={14} />
                    <a href={`tel:${order.phone}`} title="Call phone">
                      {order.phone || 'No phone provided'}
                    </a>
                  </div>
                  {order.phone && (
                    <button
                      type="button"
                      className="admin-copy-btn"
                      title="Copy phone"
                      onClick={() => copyToClipboard(order.phone, 'phone number')}
                    >
                      <Icon name="copy" size={13} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Delivery & Shipping Address Card */}
          <div className="admin-card-box admin-delivery-card">
            <div className="admin-card-box__head">
              <h2>
                <Icon name="truck" size={16} />
                <span>Delivery Address</span>
              </h2>
            </div>
            <div className="admin-card-box__body" style={{ display: 'grid', gap: 12 }}>
              <div className="admin-delivery-address">
                <div className="admin-delivery-recipient">
                  <span>{order.address?.name || order.customerName}</span>
                  <span className="admin-delivery-tag">{order.address?.label || 'Home'}</span>
                </div>
                {order.address?.street && (
                  <div className="admin-delivery-line">{order.address.street}</div>
                )}
                {order.address?.lines && !order.address?.street && (
                  <div className="admin-delivery-line">{order.address.lines.join(', ')}</div>
                )}
                <div className="admin-delivery-line">
                  {order.address?.city || 'Coimbatore'}, {order.address?.state || 'Tamil Nadu'} — {order.address?.pin || '641002'}
                </div>
                <div className="admin-delivery-line" style={{ color: 'var(--admin-mute)', fontSize: 12 }}>
                  India
                </div>
              </div>

              {/* Courier and tracking info */}
              <div className="admin-delivery-courier">
                <div className="admin-courier-meta">
                  <strong>{order.courier || '—'}</strong>
                  <span>Delivery Partner</span>
                </div>
                {order.trackingNumber ? (
                  <div className="admin-tracking-code">
                    <span>{order.trackingNumber}</span>
                    <button
                      type="button"
                      className="admin-copy-btn"
                      style={{ padding: 0 }}
                      title="Copy tracking number"
                      onClick={() => copyToClipboard(order.trackingNumber, 'tracking code')}
                    >
                      <Icon name="copy" size={12} />
                    </button>
                  </div>
                ) : null}
                {order.trackingUrl ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginTop: 4 }}>
                    <a
                      href={/^https?:\/\//i.test(order.trackingUrl) ? order.trackingUrl : `https://${order.trackingUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="admin-textlink"
                      style={{ fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    >
                      <Icon name="arrow" size={11} />
                      Open tracking page
                    </a>
                    <button
                      type="button"
                      className="admin-textlink"
                      style={{ fontSize: 12, cursor: 'pointer', background: 'none', border: 'none', padding: 0, textDecoration: 'underline' }}
                      onClick={() => setCriticalModal({ targetStatus: 'Shipped', isEditing: true })}
                    >
                      Edit tracking link
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <span style={{ fontSize: 11, color: 'var(--admin-mute)' }}>
                      {['Shipped', 'Out for Delivery', 'Delivered'].includes(order.status) ? 'No tracking URL set' : 'Pending dispatch'}
                    </span>
                    {['Shipped', 'Out for Delivery', 'Delivered'].includes(order.status) && (
                      <button
                        type="button"
                        className="admin-textlink"
                        style={{ fontSize: 12, cursor: 'pointer', background: 'none', border: 'none', padding: 0, textDecoration: 'underline' }}
                        onClick={() => setCriticalModal({ targetStatus: 'Shipped', isEditing: true })}
                      >
                        Add tracking link
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Payment Details Card */}
          <div className="admin-card-box admin-payment-card">
            <div className="admin-card-box__head">
              <h2>
                <Icon name="credit-card" size={16} />
                <span>Payment Information</span>
              </h2>
            </div>
            <div className="admin-card-box__body" style={{ display: 'grid', gap: 12 }}>
              <div className="admin-payment-row">
                <span>Payment ID</span>
                <div className="admin-payment-id-tag">
                  <span>{order.paymentId || 'pay_rzp_svh12345'}</span>
                  <button
                    type="button"
                    className="admin-copy-btn"
                    style={{ padding: 0 }}
                    title="Copy Payment ID"
                    onClick={() => copyToClipboard(order.paymentId || 'pay_rzp_svh12345', 'Payment ID')}
                  >
                    <Icon name="copy" size={12} />
                  </button>
                </div>
              </div>

              <div className="admin-payment-row">
                <span>Payment Status</span>
                <StatusBadge status={currentPaymentStatus} kind="pay" />
              </div>

              <div className="admin-payment-row">
                <span>Payment Method</span>
                <strong>{order.paymentMethod || order.payment || 'Razorpay UPI (Google Pay)'}</strong>
              </div>

              <div className="admin-payment-row">
                <span>Total Settled</span>
                <strong style={{ fontSize: 15, color: 'var(--charcoal-green)' }}>
                  <Money value={order.amount} />
                </strong>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Critical Status Confirmation Dialog Modal */}
      {criticalModal && (
        <div className="admin-modal-root" role="presentation">
          <button
            type="button"
            className="admin-modal__backdrop"
            aria-label="Close modal"
            onClick={() => setCriticalModal(null)}
          />
          <div
            className="admin-modal admin-confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-modal-title"
          >
            <div className="admin-modal__head">
              <h2 id="confirm-modal-title">
                {criticalModal.targetStatus === 'Shipped' && 'Confirm Order Dispatch'}
                {criticalModal.targetStatus === 'Delivered' && 'Confirm Order Delivery'}
                {criticalModal.targetStatus === 'Cancelled' && 'Confirm Order Cancellation'}
              </h2>
              <button
                type="button"
                className="admin-iconbtn"
                onClick={() => setCriticalModal(null)}
                aria-label="Close modal"
              >
                <Icon name="close" />
              </button>
            </div>

            {criticalModal.targetStatus === 'Shipped' && (
              <div style={{ display: 'grid', gap: 14 }}>
                <div className="admin-confirm-modal__alert admin-confirm-modal__alert--info">
                  <Icon name="truck" size={18} />
                  <span>
                    Marking this order as <strong>Shipped</strong> will notify{' '}
                    <strong>{order.customerName}</strong> ({order.email}) that their parcel is on its way.
                  </span>
                </div>

                {shippedFormError && (
                  <p style={{ margin: 0, padding: '8px 12px', background: 'rgba(220,38,38,0.08)', borderRadius: 6, color: 'var(--terracotta)', fontSize: 13 }} role="alert">
                    {shippedFormError}
                  </p>
                )}

                <div className="admin-confirm-field">
                  <label htmlFor="courier-name-input">Delivery Provider <span style={{ color: 'var(--terracotta)' }}>*</span></label>
                  <input
                    id="courier-name-input"
                    type="text"
                    value={courierInput}
                    onChange={(e) => { setCourierInput(e.target.value); setShippedFormError('') }}
                    placeholder="e.g. Delhivery, BlueDart, DTDC"
                    required
                  />
                </div>

                <div className="admin-confirm-field">
                  <label htmlFor="tracking-url-input">Tracking URL <span style={{ color: 'var(--terracotta)' }}>*</span></label>
                  <input
                    id="tracking-url-input"
                    type="url"
                    value={trackingUrlInput}
                    onChange={(e) => { setTrackingUrlInput(e.target.value); setShippedFormError('') }}
                    placeholder="https://www.delhivery.com/track/package/XXXXXXXX"
                    required
                  />
                  <span style={{ fontSize: '11px', color: 'var(--admin-mute)', marginTop: '4px', display: 'block' }}>
                    Paste the exact tracking page URL provided by the delivery partner. The customer will be redirected here.
                  </span>
                </div>
              </div>
            )}

            {criticalModal.targetStatus === 'Delivered' && (
              <div style={{ display: 'grid', gap: 14 }}>
                <div className="admin-confirm-modal__alert admin-confirm-modal__alert--info">
                  <Icon name="check" size={18} />
                  <span>
                    Confirm that parcel <strong>{order.number}</strong> was successfully received at{' '}
                    <strong>{order.address?.city || 'Coimbatore'}</strong>. This will complete the fulfillment lifecycle.
                  </span>
                </div>
              </div>
            )}

            {criticalModal.targetStatus === 'Cancelled' && (
              <div style={{ display: 'grid', gap: 14 }}>
                <div className="admin-confirm-modal__alert admin-confirm-modal__alert--warning">
                  <Icon name="alert" size={18} />
                  <span>
                    Are you sure you want to cancel <strong>{order.number}</strong>? You may provide an optional reason below.
                  </span>
                </div>
                <div className="admin-confirm-field">
                  <label htmlFor="cancel-reason-input">Cancellation Reason (optional)</label>
                  <input
                    id="cancel-reason-input"
                    type="text"
                    value={cancelReasonInput}
                    onChange={(e) => setCancelReasonInput(e.target.value)}
                    placeholder="e.g. Customer requested via phone, out of stock (optional)"
                  />
                  <span style={{ fontSize: '11px', color: 'var(--admin-mute)', marginTop: '4px', display: 'block' }}>
                    If left blank, the customer order page will show &ldquo;Order cancelled by SV Hub Administration&rdquo;.
                  </span>
                </div>
              </div>
            )}

            <div className="admin-modal__actions">
              <AdminButton variant="ghost" onClick={() => setCriticalModal(null)}>
                Go back
              </AdminButton>
              <AdminButton
                variant={criticalModal.targetStatus === 'Cancelled' ? 'danger' : 'primary'}
                onClick={confirmCriticalTransition}
              >
                {criticalModal.targetStatus === 'Shipped' && 'Confirm & Mark Shipped'}
                {criticalModal.targetStatus === 'Delivered' && 'Confirm Delivery'}
                {criticalModal.targetStatus === 'Cancelled' && 'Confirm Cancellation'}
              </AdminButton>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

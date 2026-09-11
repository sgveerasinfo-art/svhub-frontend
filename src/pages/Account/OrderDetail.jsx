import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { formatPrice } from '../../utils/money.js'
import { getOrder, cancelOrder } from '../../api/orders.js'
import { formatOrderDate, formatDeliveryDate } from '../../data/account.js'
import OrderTimeline from '../../components/order/OrderTimeline.jsx'
import AccountLoginPrompt from './AccountLoginPrompt.jsx'
import './OrderDetail.css'

// ─── Status mapping ────────────────────────────────────────────────────────────
function mapStatus(raw) {
  const map = {
    PENDING_PAYMENT: 'Pending',
    CONFIRMED: 'Confirmed',
    PROCESSING: 'Processing',
    SHIPPED: 'Shipped',
    OUT_FOR_DELIVERY: 'Out for Delivery',
    DELIVERED: 'Delivered',
    CANCELLED: 'Cancelled',
  }
  return map[String(raw || '').toUpperCase()] ?? String(raw ?? 'Pending')
}

function mapPaymentStatus(raw) {
  const map = {
    PENDING: 'Pending',
    PAID: 'Paid',
    SUCCESS: 'Paid',
    FAILED: 'Failed',
    REFUNDED: 'Refunded',
  }
  return map[String(raw || '').toUpperCase()] ?? String(raw ?? 'Pending')
}

function orderHeading(number) {
  const value = String(number || '').trim()
  if (!value) return 'Order details'
  return value.startsWith('#') ? `Order ${value}` : `Order #${value}`
}

function crumbNumber(number) {
  const value = String(number || '').trim()
  if (!value) return 'Order'
  return value.startsWith('#') ? value : `#${value}`
}

function formatPhone(phone) {
  const raw = String(phone || '').trim()
  if (!raw) return ''
  const digits = raw.replace(/\D/g, '')
  if (digits.length === 10) return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`
  }
  return raw
}

function Arrow({ back = false }) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      {back ? (
        <path
          d="M13 8H3M6.5 4.5 3 8l3.5 3.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <path
          d="M3 8h10M9.5 4.5 13 8l-3.5 3.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  )
}

function StatusLine({ label, value }) {
  const v = String(value || '').trim()
  if (!v) return null
  const tone =
    v === 'Paid' || v === 'Delivered'
      ? 'paid'
      : v === 'Cancelled' || v === 'Failed'
        ? 'cancelled'
        : 'pending'

  return (
    <div className={`od-badge od-badge--${tone}`}>
      <span className="od-badge__kicker">{label}</span>
      <span className="od-badge__val">{v}</span>
    </div>
  )
}

function OrderDetail() {
  const { user } = useAuth()
  const { orderId } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState('')

  // Cancellation states
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelling, setCancelling] = useState(false)
  const [cancelError, setCancelError] = useState('')
  const [cancelSuccessMsg, setCancelSuccessMsg] = useState('')

  const fetchOrderDetail = () => {
    if (!user || !orderId) return
    setLoading(true)
    setNotFound(false)
    setError('')

    getOrder(orderId)
      .then((res) => {
        const raw = res.data
        const cancelHistory = Array.isArray(raw.history)
          ? [...raw.history].reverse().find((h) => h.status === 'CANCELLED')
          : null
        const cancellationReason =
          raw.cancellationReason ||
          cancelHistory?.note ||
          (String(raw.status || '').toUpperCase() === 'CANCELLED'
            ? 'Order cancelled by SV Hub Administration'
            : '')

        setOrder({
          id: raw.id,
          rawStatus: String(raw.status || '').toUpperCase(),
          number: raw.orderNumber,
          date: raw.createdAt,
          status: mapStatus(raw.status),
          cancellationReason,
          history: raw.history || [],
          expectedDeliveryDate: raw.expectedDeliveryDate || null,
          paymentStatus: mapPaymentStatus(raw.paymentStatus),
          rawPaymentStatus: String(raw.paymentStatus || '').toUpperCase(),
          payment: raw.paymentMethod || null,
          amount: raw.totalAmount,
          subtotal: raw.subtotal,
          shippingFee: raw.shippingFee,
          discount: raw.discount,
          address: raw.shippingAddress,
          items: (raw.items || []).map((item) => ({
            id: item.productId,
            name: item.productName,
            weight: item.variantLabel || item.weight || '',
            quantity: item.quantity,
            price: item.unitPrice,
            lineTotal: item.lineTotal,
            image: item.image || '',
            slug: item.slug || '',
          })),
        })
      })
      .catch((err) => {
        if (err.status === 404) setNotFound(true)
        else setError(err.message || 'Could not load order.')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchOrderDetail()
  }, [user, orderId])

  const handleCancelSubmit = async (e) => {
    e.preventDefault()
    if (!order?.id || cancelling) return
    setCancelling(true)
    setCancelError('')
    setCancelSuccessMsg('')

    try {
      const res = await cancelOrder(order.id, cancelReason)
      setCancelSuccessMsg(res.message || 'Order cancelled successfully.')
      setCancelModalOpen(false)
      setCancelReason('')
      fetchOrderDetail()
    } catch (err) {
      setCancelError(err.message || 'Failed to cancel order.')
    } finally {
      setCancelling(false)
    }
  }

  if (!user) {
    return (
      <div className="account-panel">
        <AccountLoginPrompt
          title="Log in to view this order"
          copy="Sign in to see order details, delivery status and the items you purchased."
        />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="account-panel od">
        <p className="od-note" aria-busy="true">Loading order details…</p>
      </div>
    )
  }

  if (notFound || (!loading && !order && !error)) {
    return (
      <div className="account-panel od">
        <Link to="/account/orders" className="od-back">
          <Arrow back />
          All orders
        </Link>
        <div className="account-empty">
          <h2>Order not found</h2>
          <p>We couldn&apos;t find this order. It may have been moved, or the link is out of date.</p>
          <Link to="/account/orders" className="od-action">
            Back to orders
            <Arrow />
          </Link>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="account-panel od">
        <Link to="/account/orders" className="od-back">
          <Arrow back />
          All orders
        </Link>
        <p className="orders__error" role="alert">{error}</p>
      </div>
    )
  }

  const heading = orderHeading(order.number)
  const items = order.items || []
  const count = items.length
  const countLabel = count === 1 ? '1 item' : `${count} items`
  const address = order.address

  return (
    <article className="od" aria-labelledby="od-heading">
      <nav className="od-crumb" aria-label="Account">
        <Link to="/account">My Account</Link>
        <span aria-hidden="true">/</span>
        <Link to="/account/orders">Orders</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{crumbNumber(order.number)}</span>
      </nav>

      <Link to="/account/orders" className="od-back">
        <Arrow back />
        All orders
      </Link>

      <header className="od-head">
        <div className="od-head__main">
          <p className="od-kicker">Order details</p>
          <h1 id="od-heading">{heading}</h1>
          <p className="od-head__date">{formatOrderDate(order.date)}</p>
        </div>
        <div className="od-head__meta">
          <StatusLine label="Payment" value={order.paymentStatus} />
          <StatusLine label="Order status" value={order.status} />
        </div>
      </header>

      {order.expectedDeliveryDate && order.rawStatus !== 'CANCELLED' ? (
        <section className="od-delivery" aria-label="Delivery Estimation">
          <div className="od-delivery__badge">
            <span className="od-delivery__icon" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path
                  d="M3 7.5h11v8H3v-8Zm11 2h4.2L21 13v2.5h-7V9.5Z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
                <circle cx="7" cy="17.5" r="1.6" stroke="currentColor" strokeWidth="1.6" />
                <circle cx="17" cy="17.5" r="1.6" stroke="currentColor" strokeWidth="1.6" />
              </svg>
            </span>
            <div className="od-delivery__details">
              <span className="od-delivery__label">Expected delivery</span>
              <strong className="od-delivery__date">{formatDeliveryDate(order.expectedDeliveryDate)}</strong>
            </div>
          </div>
          <div className="od-delivery__stage">
            <span className="od-delivery__stage-label">Current fulfillment stage:</span>
            <span className="od-delivery__stage-val">
              <span className="od-delivery__dot" aria-hidden="true" />
              {order.status}
            </span>
          </div>
        </section>
      ) : null}

      {order.rawStatus === 'CANCELLED' ? (
        <section className="od-cancellation-banner" aria-label="Cancellation notice">
          <div className="od-cancellation-banner__icon" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
              <path d="m15 9-6 6M9 9l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <div className="od-cancellation-banner__content">
            <h2 className="od-cancellation-banner__title">Order Cancelled</h2>
            <p className="od-cancellation-banner__reason">
              <strong>Status:</strong> {order.cancellationReason || 'Order cancelled by SV Hub Administration'}
            </p>
            {['PAID', 'SUCCESS', 'REFUNDED', 'PARTIALLY_REFUNDED'].includes(order.rawPaymentStatus) ? (
              <p className="od-cancellation-banner__refund">
                <strong>Payment & Refund:</strong> Payment status is <em>{order.paymentStatus || 'Refunded'}</em>. Any captured funds are automatically refunded to your original payment method.
              </p>
            ) : (
              <p className="od-cancellation-banner__refund">
                No payment was charged for this order.
              </p>
            )}
          </div>
        </section>
      ) : null}

      <OrderTimeline status={order.status} cancellationReason={order.cancellationReason} />

      <section className="od-block" aria-labelledby="od-items-heading">
        <div className="od-block__head">
          <h2 id="od-items-heading">Your order</h2>
          <p>{countLabel}</p>
        </div>
        {items.length ? (
          <ul className="od-items">
            {items.map((item, index) => {
              const image = item.image ? (
                <img src={item.image} alt="" width="96" height="96" />
              ) : (
                <span className="od-items__thumb" aria-hidden="true" />
              )
              return (
                <li key={`${item.name}-${item.weight}-${index}`}>
                  <span className="od-items__media">{image}</span>
                  <div className="od-items__info">
                    <p className="od-items__name">{item.name}</p>
                    {item.weight ? <p className="od-items__weight">{item.weight}</p> : null}
                  </div>
                  <p className="od-items__qty">
                    <span>Qty</span> {item.quantity || 1}
                  </p>
                  <p className="od-items__price">
                    <span>Price</span>
                    {formatPrice(item.price)}
                  </p>
                  <p className="od-items__total">
                    <span>Total</span>
                    {formatPrice(item.lineTotal ?? item.price * item.quantity)}
                  </p>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="od-note">No items are listed on this order.</p>
        )}
      </section>

      <div className="od-split">
        <section className="od-block" aria-labelledby="od-deliver-heading">
          <h2 id="od-deliver-heading" className="od-kicker">
            Deliver to
          </h2>
          {address ? (
            <div className="od-address">
              {address.name ? <p className="od-address__name">{address.name}</p> : null}
              {address.street ? <p>{address.street}</p> : null}
              {address.city || address.state ? (
                <p>{[address.city, address.state].filter(Boolean).join(', ')}</p>
              ) : null}
              {address.pin ? <p>{address.pin}</p> : null}
              {address.phone ? <p className="od-address__phone">{formatPhone(address.phone)}</p> : null}
            </div>
          ) : (
            <p className="od-note">No delivery address is on file for this order.</p>
          )}
        </section>

        <div className="od-side">
          <section className="od-block" aria-labelledby="od-summary-heading">
            <h2 id="od-summary-heading" className="od-kicker">
              Order summary
            </h2>
            <dl className="od-summary">
              <div>
                <dt>Subtotal</dt>
                <dd>{formatPrice(order.subtotal ?? 0)}</dd>
              </div>
              <div>
                <dt>Shipping</dt>
                <dd>{order.shippingFee ? formatPrice(order.shippingFee) : 'Free'}</dd>
              </div>
              <div>
                <dt>Discount</dt>
                <dd>{order.discount ? `− ${formatPrice(order.discount)}` : formatPrice(0)}</dd>
              </div>
              <div className="od-summary__total">
                <dt>Total</dt>
                <dd>{formatPrice(order.amount ?? 0)}</dd>
              </div>
            </dl>
          </section>

          {order.paymentStatus ? (
            <section className="od-block" aria-labelledby="od-pay-heading">
              <h2 id="od-pay-heading" className="od-kicker">
                Payment
              </h2>
              <dl className="od-pay">
                {order.payment ? (
                  <div>
                    <dt>Method</dt>
                    <dd>{order.payment}</dd>
                  </div>
                ) : null}
                <div>
                  <dt>Status</dt>
                  <dd>{order.paymentStatus}</dd>
                </div>
              </dl>
            </section>
          ) : null}
        </div>
      </div>

      {cancelSuccessMsg ? (
        <div className="od-alert od-alert--success" role="status">
          <p>{cancelSuccessMsg}</p>
        </div>
      ) : null}

      {/* Show Cancel Order button only when eligible (Pending, Confirmed, Processing) */}
      <div className="od-actions">
        {['PENDING_PAYMENT', 'CONFIRMED', 'PROCESSING'].includes(order.rawStatus) && order.rawStatus !== 'CANCELLED' ? (
          <button
            type="button"
            className="od-action od-action--cancel"
            onClick={() => {
              setCancelError('')
              setCancelModalOpen(true)
            }}
          >
            Cancel order
          </button>
        ) : null}

        <Link to="/shop" className="od-action od-action--primary">
          Continue shopping
          <Arrow />
        </Link>
        <Link to="/contact" className="od-action">
          Contact support
          <Arrow />
        </Link>
      </div>

      {cancelModalOpen ? (
        <div className="od-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="cancel-modal-title">
          <div className="od-modal">
            <h2 id="cancel-modal-title" className="od-modal__title">Cancel Order</h2>
            <p className="od-modal__desc">
              Are you sure you want to cancel this order?
              {order.rawPaymentStatus === 'PAID' ? ' Since payment was received, an automatic refund will be processed to your original payment method.' : ''}
            </p>

            {cancelError ? (
              <p className="od-modal__error" role="alert">{cancelError}</p>
            ) : null}

            <form onSubmit={handleCancelSubmit}>
              <div className="od-modal__field">
                <label htmlFor="cancel-reason" className="od-modal__label">
                  Reason for cancellation (optional)
                </label>
                <textarea
                  id="cancel-reason"
                  className="od-modal__textarea"
                  rows="3"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g., Ordered by mistake, found a better price, changed shipping address..."
                  disabled={cancelling}
                />
              </div>

              <div className="od-modal__buttons">
                <button
                  type="button"
                  className="od-modal__btn od-modal__btn--secondary"
                  onClick={() => {
                    if (!cancelling) setCancelModalOpen(false)
                  }}
                  disabled={cancelling}
                >
                  Keep Order
                </button>
                <button
                  type="submit"
                  className="od-modal__btn od-modal__btn--danger"
                  disabled={cancelling}
                >
                  {cancelling ? 'Cancelling…' : 'Confirm Cancellation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </article>
  )
}

export default OrderDetail

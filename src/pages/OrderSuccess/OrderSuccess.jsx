import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { getOrder } from '../../api/orders.js'
import { LOGO_ALT, LOGO_SRC } from '../../data/brand.js'
import './OrderSuccess.css'

function readStoredOrder() {
  try {
    const raw = sessionStorage.getItem('svhub.lastOrder')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function formatMoney(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0)
}

function formatDate(value, month = 'long') {
  const date = value ? new Date(value) : null
  if (!date || Number.isNaN(date.getTime())) return null

  return new Intl.DateTimeFormat('en-US', {
    month,
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

function paymentLabel(order) {
  const status = String(order.paymentStatus || order.payment || '').toUpperCase()
  if (status === 'PAID' || status === 'CAPTURED' || status.includes('PAID')) {
    return 'Paid via Razorpay'
  }
  if (status === 'PENDING' || status === 'PENDING_PAYMENT' || status.includes('PENDING')) {
    return 'Payment pending'
  }
  if (status === 'FAILED' || status.includes('FAIL')) {
    return 'Payment failed'
  }
  if (order.payment && typeof order.payment === 'string' && !/sample|heritage|demo/i.test(order.payment)) {
    return order.payment
  }
  return 'Payment status unavailable'
}

function IconCheck() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6.4 12.2 10.1 16l7.5-8.2"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconVerified() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 2.4 4.6 5.7v5.3c0 4.8 3.2 8.2 7.4 9.7 4.2-1.5 7.4-4.9 7.4-9.7V5.7L12 2.4Zm-1.1 12.4-2.8-2.8 1.3-1.3 1.5 1.5 3.7-3.7 1.3 1.3-5 5Z"
      />
    </svg>
  )
}

function IconTruck() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 7.5h11v8H3v-8Zm11 2h4.2L21 13v2.5h-7V9.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="7" cy="17.5" r="1.6" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="17" cy="17.5" r="1.6" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

function IconBell() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6.2 9.4a5.8 5.8 0 0 1 11.6 0c0 4.2 1.4 5.6 1.4 5.6H4.8s1.4-1.4 1.4-5.6Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M10 18.4a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function IconLeaf() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 18.5s1.2-8.2 9.8-11.8C20.4 4.8 20 8 18.2 12.5 15.8 18 9 19 5 18.5Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M9.5 14.5c2-2.6 4.4-4.4 8-6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

function IconBloom() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="2.2" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M12 4.5c.8 2.2.8 3.8 0 6M12 13.5c.8 2.2.8 3.8 0 6M4.5 12c2.2-.8 3.8-.8 6 0M13.5 12c2.2-.8 3.8-.8 6 0M7 7c1.8 1.4 3 2.6 4.2 4.8M12.8 12.2C14 14.4 15.2 15.6 17 17M17 7c-1.8 1.4-3 2.6-4.2 4.8M11.2 12.2C10 14.4 8.8 15.6 7 17"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  )
}

function IconStar() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="m12 3.5 2.1 5.4 5.8.4-4.5 3.6 1.5 5.6L12 15.6 6.1 18.5l1.5-5.6-4.5-3.6 5.8-.4L12 3.5Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function buildOrderView({ state, stored, liveOrder }) {
  if (liveOrder) {
    const lines = liveOrder.shippingAddress?.lines
    const city = liveOrder.shippingAddress?.city
      ? `${liveOrder.shippingAddress.city}${liveOrder.shippingAddress.state ? `, ${liveOrder.shippingAddress.state}` : ''}`
      : ''
    return {
      id: liveOrder.id,
      orderNumber: liveOrder.orderNumber,
      total: liveOrder.totalAmount,
      date: liveOrder.createdAt,
      city,
      addressLines: Array.isArray(lines) ? lines : [],
      paymentStatus: liveOrder.paymentStatus,
      items: liveOrder.items || [],
      source: 'api',
    }
  }

  const candidate = { ...(stored || {}), ...(state || {}) }
  const orderNumber = candidate.orderNumber || candidate.number
  const total = candidate.total ?? candidate.totalAmount
  const id = candidate.id || candidate.orderId
  if (!orderNumber && total == null && !id) return null

  return {
    id,
    orderNumber,
    total,
    date: candidate.date || candidate.createdAt,
    city: candidate.city || '',
    addressLines: Array.isArray(candidate.addressLines) ? candidate.addressLines : [],
    paymentStatus: candidate.paymentStatus || candidate.payment,
    payment: typeof candidate.payment === 'string' ? candidate.payment : undefined,
    items: candidate.items || [],
    source: state ? 'checkout' : 'session',
  }
}

function OrderSuccess() {
  const location = useLocation()
  const state = location.state
  const [liveOrder, setLiveOrder] = useState(null)
  const [loading, setLoading] = useState(false)
  const [fetchFailed, setFetchFailed] = useState(false)

  const orderId = state?.orderId || new URLSearchParams(location.search).get('orderId')
  const stored = readStoredOrder()

  useEffect(() => {
    document.title = 'Order Confirmed — SV Hub'
    window.scrollTo(0, 0)

    if (!orderId) {
      return () => {
        document.title = 'SV Hub — Pure Native Goodness'
      }
    }

    let cancelled = false
    setLoading(true)
    setFetchFailed(false)
    getOrder(orderId)
      .then((res) => {
        if (cancelled) return
        if (res.data) setLiveOrder(res.data)
        else setFetchFailed(true)
      })
      .catch(() => {
        if (!cancelled) setFetchFailed(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
      document.title = 'SV Hub — Pure Native Goodness'
    }
  }, [orderId])

  const order = buildOrderView({ state, stored, liveOrder })
  const missing = !loading && !order
  const unavailable = !loading && Boolean(orderId) && fetchFailed && !order

  if (loading) {
    return (
      <section className="success">
        <div className="success__inner">
          <Link to="/" className="success__brand" aria-label="SV Hub home">
            <img src={LOGO_SRC} alt={LOGO_ALT} width={1024} height={1024} decoding="async" />
          </Link>
          <article className="success__stage">
            <header className="success__hero">
              <h1 className="success__title">Loading order…</h1>
              <p className="success__lede">Fetching your order details securely.</p>
            </header>
          </article>
        </div>
      </section>
    )
  }

  if (missing || unavailable) {
    return (
      <section className="success">
        <div className="success__inner">
          <Link to="/" className="success__brand" aria-label="SV Hub home">
            <img src={LOGO_SRC} alt={LOGO_ALT} width={1024} height={1024} decoding="async" />
          </Link>
          <article className="success__stage">
            <header className="success__hero">
              <h1 className="success__title">Order not found</h1>
              <p className="success__lede">
                We could not find a confirmed order for this page. If you just checked out, open your
                account orders or return to the shop.
              </p>
            </header>
            <div className="success__actions">
              <Link to="/account/orders" className="success__btn success__btn--solid">
                View my orders
              </Link>
              <Link to="/shop" className="success__btn success__btn--ghost">
                Continue shopping
              </Link>
            </div>
          </article>
        </div>
      </section>
    )
  }

  const orderNumber = order.orderNumber || '—'
  const canonicalOrderId = order.id || orderId
  const orderHref = canonicalOrderId ? `/account/orders/${canonicalOrderId}` : '/account/orders'
  const total = order.total != null ? formatMoney(order.total) : '—'
  const dateLong = formatDate(order.date, 'long') || '—'
  const dateShort = formatDate(order.date, 'short') || '—'
  const city = order.city || '—'
  const addressLines = order.addressLines || []
  const payment = paymentLabel(order)

  return (
    <section className="success">
      <div className="success__glow success__glow--tl" aria-hidden="true" />
      <div className="success__glow success__glow--br" aria-hidden="true" />

      <div className="success__confetti" aria-hidden="true">
        <span className="success__petal success__petal--leaf">
          <IconLeaf />
        </span>
        <span className="success__petal success__petal--bloom">
          <IconBloom />
        </span>
        <span className="success__petal success__petal--star">
          <IconStar />
        </span>
      </div>

      <div className="success__inner">
        <Link to="/" className="success__brand" aria-label="SV Hub home">
          <img src={LOGO_SRC} alt={LOGO_ALT} width={1024} height={1024} decoding="async" />
        </Link>

        <article className="success__stage">
          <header className="success__hero">
            <div className="success__check">
              <span className="success__ping" aria-hidden="true" />
              <IconCheck />
            </div>
            <h1 className="success__title">
              Order Confirmed<span className="success__dot">.</span>
            </h1>
            <p className="success__lede">Thank you for bringing a little more native goodness home.</p>
          </header>

          <div className="success__sheet">
            <dl className="success__facts">
              <div className="success__fact">
                <dt>Order Number</dt>
                <dd>{orderNumber}</dd>
              </div>
              <div className="success__fact">
                <dt>
                  <span className="success__desk">Order Date</span>
                  <span className="success__mob">Date</span>
                </dt>
                <dd>
                  <span className="success__desk">{dateLong}</span>
                  <span className="success__mob">{dateShort}</span>
                </dd>
              </div>
              <div className="success__fact success__fact--pay">
                <dt>Payment Status</dt>
                <dd>
                  <IconVerified />
                  {payment}
                </dd>
              </div>
              <div className="success__fact success__fact--ship">
                <dt>Shipping to</dt>
                <dd>{city}</dd>
              </div>
              <div className="success__fact success__fact--total">
                <dt>
                  <span className="success__desk">Total Amount</span>
                  <span className="success__mob">Total</span>
                </dt>
                <dd>{total}</dd>
              </div>
            </dl>

            {addressLines.length ? (
              <div className="success__address">
                <h2>Delivery Address</h2>
                <p>
                  {addressLines.map((line) => (
                    <span key={line}>
                      {line}
                      <br />
                    </span>
                  ))}
                </p>
              </div>
            ) : null}

            {order.items && order.items.length > 0 ? (
              <div className="success__items">
                <h2>Items Ordered ({order.items.length})</h2>
                <ul className="success__items-list">
                  {order.items.map((item, idx) => (
                    <li key={idx} className="success__item-line">
                      {item.image ? (
                        <img src={item.image} alt="" className="success__item-img" />
                      ) : null}
                      <div className="success__item-info">
                        <span className="success__item-name">{item.productName || item.name}</span>
                        <span className="success__item-meta">
                          {[item.variantLabel || item.weight, `Qty: ${item.quantity}`].filter(Boolean).join(' • ')}
                        </span>
                      </div>
                      <span className="success__item-price">
                        {formatMoney((item.unitPrice || item.price || 0) * (item.quantity || 1))}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          <div className="success__banner">
            <IconTruck />
            <p>We&apos;ve received your order! Updates on your delivery will be sent to your email and phone.</p>
          </div>

          <div className="success__actions">
            <Link to={orderHref} className="success__btn success__btn--solid">
              View Order
            </Link>
            <Link to="/shop" className="success__btn success__btn--ghost">
              Continue Shopping
            </Link>
          </div>
        </article>

        <p className="success__foot">
          <IconBell />
          You&apos;ll receive order updates via email and SMS.
        </p>
      </div>
    </section>
  )
}

export default OrderSuccess

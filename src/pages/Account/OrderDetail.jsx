import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { formatPrice } from '../../utils/money.js'
import { getOrder } from '../../api/orders.js'
import { formatOrderDate } from '../../data/account.js'
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
    DELIVERED: 'Delivered',
    CANCELLED: 'Cancelled',
  }
  return map[String(raw || '').toUpperCase()] ?? String(raw ?? 'Pending')
}

function mapPaymentStatus(raw) {
  const map = {
    PENDING: 'Pending',
    PAID: 'Paid',
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
  const pending = String(value).toLowerCase() === 'pending' || String(value).toLowerCase() === 'failed'
  return (
    <p className={`od-status${pending ? ' is-pending' : ''}`}>
      <span>{label}</span>
      <span className="od-status__value">
        <span className="od-status__dot" aria-hidden="true" />
        {value}
      </span>
    </p>
  )
}

function OrderDetail() {
  const { user } = useAuth()
  const { orderId } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user || !orderId) return
    setLoading(true)
    setNotFound(false)
    setError('')

    getOrder(orderId)
      .then((res) => {
        const raw = res.data
        setOrder({
          id: raw.id,
          number: raw.orderNumber,
          date: raw.createdAt,
          status: mapStatus(raw.status),
          paymentStatus: mapPaymentStatus(raw.paymentStatus),
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
  }, [user, orderId])

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

      <OrderTimeline status={order.status} />

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

      <div className="od-actions">
        <Link to="/shop" className="od-action od-action--primary">
          Continue shopping
          <Arrow />
        </Link>
        <Link to="/contact" className="od-action">
          Contact support
          <Arrow />
        </Link>
      </div>
    </article>
  )
}

export default OrderDetail

import { useEffect, useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { LOGO_ALT, LOGO_SRC } from '../../data/brand.js'
import './PaymentFailed.css'

function readStoredAttempt() {
  try {
    const raw = sessionStorage.getItem('svhub.lastPayment')
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

function IconError() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="currentColor" />
      <path d="M12 7v6.2" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="12" cy="16.6" r="1.15" fill="#fff" />
    </svg>
  )
}

function IconHelp() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M9.6 9.4a2.4 2.4 0 0 1 4.6.8c0 1.5-1.4 2-2.2 2.6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="12" cy="16.4" r="0.9" fill="currentColor" />
    </svg>
  )
}

function PaymentFailed() {
  const { state } = useLocation()
  const stored = useMemo(readStoredAttempt, [])

  useEffect(() => {
    document.title = 'Payment Failed — SV Hub'
    window.scrollTo(0, 0)
    return () => {
      document.title = 'SV Hub — Pure Native Goodness'
    }
  }, [])

  const attempt = {
    ...(stored || {}),
    ...(state || {}),
  }

  const reference = attempt.reference || attempt.orderNumber || '—'
  const amount = attempt.total != null ? formatMoney(attempt.total) : '—'

  return (
    <section className="fail">
      <div className="fail__glow" aria-hidden="true" />

      <Link to="/" className="fail__brand" aria-label="SV Hub home">
        <img src={LOGO_SRC} alt={LOGO_ALT} width={1024} height={1024} decoding="async" />
      </Link>

      <article className="fail__card">
        <div className="fail__icon">
          <IconError />
        </div>

        <h1 className="fail__title">We Couldn&apos;t Complete Your Payment</h1>
        <p className="fail__lede">Your order has not been confirmed. You can try the payment again.</p>

        <div className="fail__sheet">
          <h2>Transaction Details</h2>
          <dl>
            <div>
              <dt>Reference</dt>
              <dd>{reference}</dd>
            </div>
            <div>
              <dt>Amount</dt>
              <dd className="fail__amount">{amount}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd className="fail__status">Unsuccessful</dd>
            </div>
          </dl>
        </div>

        <div className="fail__actions">
          <Link to="/checkout" className="fail__btn fail__btn--solid">
            Try Payment Again
          </Link>
          <Link to="/cart" className="fail__btn fail__btn--ghost">
            Return to Cart
          </Link>
        </div>

        <p className="fail__help">
          <IconHelp />
          <span>
            Need help?{' '}
            <Link to="/contact">Contact our support team</Link>
          </span>
        </p>
      </article>
    </section>
  )
}

export default PaymentFailed

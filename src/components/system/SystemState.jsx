import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BasketIllustration,
  BatchIllustration,
  BrandLeafLoader,
  JarIllustration,
  LockSealIllustration,
  MortarIllustration,
  ParcelIllustration,
  PaymentAlertIllustration,
  SearchSprigIllustration,
  SignalIllustration,
} from './illustrations.jsx'
import { Icon } from '../admin/icons.jsx'
import './SystemState.css'

/* ==========================================================================
   1. 404 Page Not Found
   ========================================================================== */
export function NotFoundState({
  eyebrow = 'Page 404',
  title = 'This path has wandered off the map',
  copy = "The page you are looking for may have been moved, renamed, or is taking a quiet rest. Let's guide you back to our native pantry and self-care essentials.",
  mode = 'page', // 'page' | 'card' | 'inline'
  primaryTo = '/',
  primaryLabel = 'Return to Storefront',
  secondaryTo = '/shop',
  secondaryLabel = 'Browse Catalog',
  className = '',
}) {
  return (
    <div className={`sys-state sys-state--${mode} ${className}`.trim()}>
      <div className="sys-ill-wrap">
        <JarIllustration size={mode === 'page' ? 128 : 96} />
      </div>
      <p className="sys-eyebrow">{eyebrow}</p>
      <h1 className="sys-title">{title}</h1>
      <p className="sys-copy">{copy}</p>
      <div className="sys-actions">
        {primaryTo && (
          <Link to={primaryTo} className="sys-btn sys-btn--primary">
            {primaryLabel}
          </Link>
        )}
        {secondaryTo && (
          <Link to={secondaryTo} className="sys-btn sys-btn--ghost">
            {secondaryLabel}
          </Link>
        )}
      </div>
    </div>
  )
}

/* ==========================================================================
   2. 500 Server Error
   ========================================================================== */
export function ServerErrorState({
  eyebrow = 'Server Error 500',
  title = 'Something unexpected simmered over',
  copy = 'Our kitchen servers ran into a momentary hiccup while preparing this view. Our team has been notified. Please try refreshing in a moment.',
  mode = 'page',
  onRetry = () => window.location.reload(),
  homeTo = '/',
  className = '',
}) {
  return (
    <div className={`sys-state sys-state--${mode} ${className}`.trim()}>
      <div className="sys-ill-wrap">
        <MortarIllustration size={mode === 'page' ? 128 : 96} />
      </div>
      <p className="sys-eyebrow sys-eyebrow--alert">{eyebrow}</p>
      <h1 className="sys-title">{title}</h1>
      <p className="sys-copy">{copy}</p>
      <div className="sys-actions">
        <button type="button" className="sys-btn sys-btn--primary" onClick={onRetry}>
          Try Refreshing
        </button>
        {homeTo && (
          <Link to={homeTo} className="sys-btn sys-btn--ghost">
            Return Home
          </Link>
        )}
      </div>
    </div>
  )
}

/* ==========================================================================
   3. Network / API Error
   ========================================================================== */
export function NetworkErrorState({
  eyebrow = 'Connection Paused',
  title = 'We lost our connection to the hearth',
  copy = 'It looks like your internet connection paused or our service did not respond in time. Please check your signal and we will reconnect immediately.',
  mode = 'card',
  onRetry,
  className = '',
}) {
  const [retrying, setRetrying] = useState(false)

  function handleRetry() {
    setRetrying(true)
    if (onRetry) {
      Promise.resolve(onRetry()).finally(() => setRetrying(false))
    } else {
      setTimeout(() => setRetrying(false), 800)
    }
  }

  return (
    <div className={`sys-state sys-state--${mode} ${className}`.trim()}>
      <div className="sys-ill-wrap">
        <SignalIllustration size={mode === 'page' ? 120 : 88} />
      </div>
      <p className="sys-eyebrow sys-eyebrow--alert">{eyebrow}</p>
      <h2 className="sys-title">{title}</h2>
      <p className="sys-copy">{copy}</p>
      <div className="sys-actions">
        <button type="button" className="sys-btn sys-btn--primary" onClick={handleRetry} disabled={retrying}>
          {retrying ? 'Reconnecting…' : 'Retry Connection'}
        </button>
      </div>
    </div>
  )
}

/* ==========================================================================
   4. Empty Cart
   ========================================================================== */
export function EmptyCartState({
  eyebrow = 'Cart & Basket',
  title = 'Your basket is quietly waiting',
  copy = 'You haven’t gathered any heirloom grains, cold-pressed soaps, or traditional thokkus yet. Discover what our growers and makers have prepared for you.',
  mode = 'page',
  shopTo = '/shop',
  nutriTo = '/nutri-hub',
  careTo = '/self-care',
  className = '',
}) {
  return (
    <div className={`sys-state sys-state--${mode} ${className}`.trim()}>
      <div className="sys-ill-wrap">
        <BasketIllustration size={mode === 'page' ? 128 : 96} />
      </div>
      <p className="sys-eyebrow">{eyebrow}</p>
      <h1 className="sys-title">{title}</h1>
      <p className="sys-copy">{copy}</p>
      <div className="sys-actions">
        {shopTo && (
          <Link to={shopTo} className="sys-btn sys-btn--primary">
            Explore All Provisions
          </Link>
        )}
        {nutriTo && (
          <Link to={nutriTo} className="sys-btn sys-btn--ghost">
            Nutri-Hub Pantry
          </Link>
        )}
        {careTo && (
          <Link to={careTo} className="sys-btn sys-btn--ghost">
            Self-Care Apothecary
          </Link>
        )}
      </div>
    </div>
  )
}

/* ==========================================================================
   5. Empty Search Results
   ========================================================================== */
export function EmptySearchState({
  eyebrow = 'Search Results',
  query = '',
  title = 'No native goods matched your search',
  copy,
  mode = 'card',
  onClear,
  suggestions = ['Kullakar Rice', 'Kasthuri Manjal Soap', 'Venthaya Thokku', 'Athirasam', 'Vettiver Soap'],
  className = '',
}) {
  const defaultCopy = query
    ? `We couldn't find provisions or self-care items matching "${query}". Check for spelling or try searching simpler native ingredients.`
    : 'Try searching for traditional rice varieties, authentic spices, cold-pressed soaps, or snacks.'

  return (
    <div className={`sys-state sys-state--${mode} ${className}`.trim()}>
      <div className="sys-ill-wrap">
        <SearchSprigIllustration size={mode === 'page' ? 120 : 90} />
      </div>
      <p className="sys-eyebrow sys-eyebrow--muted">{eyebrow}</p>
      <h2 className="sys-title">{title}</h2>
      <p className="sys-copy">{copy || defaultCopy}</p>

      {onClear && (
        <div className="sys-actions">
          <button type="button" className="sys-btn sys-btn--ghost" onClick={onClear}>
            Clear Search
          </button>
        </div>
      )}

      {suggestions && suggestions.length > 0 && (
        <div className="sys-chips-block">
          <span className="sys-chips-label">Popular native explorations:</span>
          <ul className="sys-chips-list">
            {suggestions.map((item) => (
              <li key={item}>
                <Link to={`/search?q=${encodeURIComponent(item)}`} className="sys-chip">
                  {item}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

/* ==========================================================================
   6. Empty Orders
   ========================================================================== */
export function EmptyOrdersState({
  eyebrow = 'Order History',
  title = 'No orders in your kitchen ledger yet',
  copy = 'When you place an order for pure native provisions and apothecary essentials, your receipts, invoice PDFs, and dispatch tracking will bloom right here.',
  mode = 'card',
  shopTo = '/shop',
  className = '',
}) {
  return (
    <div className={`sys-state sys-state--${mode} ${className}`.trim()}>
      <div className="sys-ill-wrap">
        <ParcelIllustration size={mode === 'page' ? 120 : 92} />
      </div>
      <p className="sys-eyebrow">{eyebrow}</p>
      <h2 className="sys-title">{title}</h2>
      <p className="sys-copy">{copy}</p>
      <div className="sys-actions">
        <Link to={shopTo} className="sys-btn sys-btn--primary">
          Start Your First Order
        </Link>
      </div>
    </div>
  )
}

/* ==========================================================================
   7. Product Out of Stock
   ========================================================================== */
export function OutOfStockState({
  eyebrow = 'Batch In Preparation',
  title = 'Fresh batch currently simmering',
  copy,
  productName = 'this product',
  mode = 'card',
  onNotify,
  similarTo = '/shop',
  className = '',
}) {
  const defaultCopy = `This seasonal harvest or artisanal batch of ${productName} has temporarily run out. We craft in small, mindful batches to preserve purity and potency.`
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    if (!email) return
    if (onNotify) onNotify(email)
    setSubmitted(true)
  }

  return (
    <div className={`sys-state sys-state--${mode} ${className}`.trim()}>
      <div className="sys-ill-wrap">
        <BatchIllustration size={mode === 'page' ? 120 : 88} />
      </div>
      <p className="sys-eyebrow sys-eyebrow--alert">{eyebrow}</p>
      <h2 className="sys-title">{title}</h2>
      <p className="sys-copy">{copy || defaultCopy}</p>

      {submitted ? (
        <div style={{ color: 'var(--leaf-green)', fontWeight: 600, fontSize: 13.5, margin: '8px 0 16px' }}>
          ✓ Thank you! We will notify you when the fresh batch arrives.
        </div>
      ) : (
        <form className="sys-notify-form" onSubmit={handleSubmit}>
          <input
            type="email"
            className="sys-notify-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter email to get restock alert"
            required
          />
          <button type="submit" className="sys-btn sys-btn--primary">
            Notify Me
          </button>
        </form>
      )}

      {similarTo && (
        <div className="sys-actions">
          <Link to={similarTo} className="sys-btn sys-btn--ghost">
            Explore Available Provisions
          </Link>
        </div>
      )}
    </div>
  )
}

/* ==========================================================================
   8. Loading (Spinner & Brand Loader)
   ========================================================================== */
export function LoadingState({
  eyebrow = 'Gathering Goodness',
  title = 'Harvesting fresh provisions…',
  copy = 'Taking mindful care with cold-pressed oils, native grains, and fresh ingredients.',
  mode = 'card', // 'page' | 'card' | 'inline'
  size = 56,
  className = '',
}) {
  if (mode === 'inline') {
    return (
      <div className={`sys-state sys-state--inline ${className}`.trim()} style={{ flexDirection: 'row', gap: 12 }}>
        <BrandLeafLoader size={28} />
        <span style={{ fontSize: 13, color: 'var(--admin-mute)' }}>{title}</span>
      </div>
    )
  }

  return (
    <div className={`sys-state sys-state--${mode} ${className}`.trim()}>
      <div className="sys-ill-wrap" style={{ animation: 'none' }}>
        <BrandLeafLoader size={size} />
      </div>
      {eyebrow && <p className="sys-eyebrow">{eyebrow}</p>}
      <h2 className="sys-title" style={{ fontSize: mode === 'page' ? 28 : 22 }}>
        {title}
      </h2>
      {copy && <p className="sys-copy">{copy}</p>}
    </div>
  )
}

/* ==========================================================================
   9. Skeleton Loading Primitives
   ========================================================================== */
export function SkeletonState({ type = 'card', lines = 3, count = 1, className = '' }) {
  if (type === 'table') {
    return (
      <div className={`sys-skel-table ${className}`.trim()}>
        <div className="sys-skel-table-row" style={{ background: 'rgba(59,70,50,0.03)' }}>
          <div className="sys-skel" style={{ width: '25%', height: 14 }} />
          <div className="sys-skel" style={{ width: '20%', height: 14 }} />
          <div className="sys-skel" style={{ width: '15%', height: 14 }} />
          <div className="sys-skel" style={{ width: '20%', height: 14 }} />
        </div>
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="sys-skel-table-row">
            <div className="sys-skel" style={{ width: '32%', height: 16 }} />
            <div className="sys-skel" style={{ width: '22%', height: 16 }} />
            <div className="sys-skel" style={{ width: '14%', height: 16 }} />
            <div className="sys-skel" style={{ width: '18%', height: 16 }} />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gap: 16, width: '100%' }} className={className}>
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="sys-skel-card">
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div className="sys-skel" style={{ width: 44, height: 44, borderRadius: 8, flexShrink: 0 }} />
            <div style={{ flex: 1, display: 'grid', gap: 6 }}>
              <div className="sys-skel" style={{ width: '55%', height: 16 }} />
              <div className="sys-skel" style={{ width: '35%', height: 12 }} />
            </div>
          </div>
          {Array.from({ length: lines }).map((_, lIdx) => (
            <div
              key={lIdx}
              className="sys-skel"
              style={{ width: `${90 - (lIdx % 3) * 15}%`, height: 12 }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

/* ==========================================================================
   10. Form Validation Error
   ========================================================================== */
export function FormErrorState({
  title = 'Please review the highlighted details',
  message = 'A few required fields need your attention before we can proceed with your request.',
  errors = [],
  className = '',
}) {
  return (
    <div className={`sys-form-banner ${className}`.trim()} role="alert">
      <div style={{ marginTop: 2 }}>
        <Icon name="alert" size={18} />
      </div>
      <div>
        <strong>{title}</strong>
        <span>{message}</span>
        {errors && errors.length > 0 && (
          <ul>
            {errors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export function FormFieldError({ message }) {
  if (!message) return null
  return (
    <span className="sys-field-error">
      <Icon name="alert" size={12} />
      <span>{message}</span>
    </span>
  )
}

/* ==========================================================================
   11. Payment Error
   ========================================================================== */
export function PaymentErrorState({
  eyebrow = 'Payment Incomplete',
  title = "Your payment couldn't be confirmed",
  copy = 'The bank or payment gateway was unable to authorize this transaction. No funds were captured, or any reserved amount will reverse automatically within 24–48 hours.',
  mode = 'card',
  code = 'ERR_GATEWAY_TIMEOUT',
  onRetry,
  changeMethodTo = '/checkout',
  className = '',
}) {
  return (
    <div className={`sys-state sys-state--${mode} ${className}`.trim()}>
      <div className="sys-ill-wrap">
        <PaymentAlertIllustration size={mode === 'page' ? 120 : 92} />
      </div>
      <p className="sys-eyebrow sys-eyebrow--alert">{eyebrow}</p>
      <h2 className="sys-title">{title}</h2>
      {code && <span className="sys-code-tag">Ref: {code}</span>}
      <p className="sys-copy">{copy}</p>
      <div className="sys-actions">
        {onRetry && (
          <button type="button" className="sys-btn sys-btn--primary" onClick={onRetry}>
            Retry Payment
          </button>
        )}
        {changeMethodTo && (
          <Link to={changeMethodTo} className="sys-btn sys-btn--ghost">
            Choose Another Payment Method
          </Link>
        )}
      </div>
    </div>
  )
}

/* ==========================================================================
   12. Success Toast
   ========================================================================== */
export function SuccessToast({
  title = 'Saved successfully',
  message = 'Your changes have been preserved.',
  onDismiss,
  className = '',
}) {
  return (
    <div className={`sys-toast sys-toast--success ${className}`.trim()} role="status">
      <div className="sys-toast__icon">
        <Icon name="check" size={14} />
      </div>
      <div className="sys-toast__content">
        <span className="sys-toast__title">{title}</span>
        {message && <span>{message}</span>}
      </div>
      {onDismiss && (
        <button type="button" className="sys-toast__close" onClick={onDismiss} aria-label="Close notification">
          ✕
        </button>
      )}
    </div>
  )
}

/* ==========================================================================
   13. Error Toast
   ========================================================================== */
export function ErrorToast({
  title = 'Action could not be completed',
  message = 'Please check your connection and try again.',
  onRetry,
  onDismiss,
  className = '',
}) {
  return (
    <div className={`sys-toast sys-toast--error ${className}`.trim()} role="alert">
      <div className="sys-toast__icon">
        <Icon name="alert" size={14} />
      </div>
      <div className="sys-toast__content">
        <span className="sys-toast__title">{title}</span>
        {message && <span>{message}</span>}
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            style={{
              alignSelf: 'flex-start',
              marginTop: 4,
              fontSize: 11.5,
              fontWeight: 600,
              textDecoration: 'underline',
              border: 0,
              background: 'transparent',
              color: '#FFF',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            Retry action
          </button>
        )}
      </div>
      {onDismiss && (
        <button type="button" className="sys-toast__close" onClick={onDismiss} aria-label="Close notification">
          ✕
        </button>
      )}
    </div>
  )
}

/* ==========================================================================
   14. Confirmation Modal
   ========================================================================== */
export function ConfirmModal({
  title = 'Confirm this action?',
  message = 'Please confirm that you want to proceed with this operation.',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  className = '',
}) {
  return (
    <div className="sys-modal-root" role="presentation">
      <button type="button" className="sys-modal__backdrop" onClick={onCancel} aria-label="Cancel confirmation" />
      <div
        className={`sys-modal sys-modal--confirm ${className}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
      >
        <div className="sys-modal__badge">
          <Icon name="check" size={24} />
        </div>
        <h2 id="confirm-modal-title">{title}</h2>
        {message && <p>{message}</p>}
        <div className="sys-modal__actions">
          <button type="button" className="sys-btn sys-btn--ghost" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button type="button" className="sys-btn sys-btn--primary" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ==========================================================================
   15. Delete / Destructive Confirmation Modal
   ========================================================================== */
export function DeleteModal({
  title = 'Remove this item from your shelf?',
  message = 'This item will be permanently removed from your saved list. This action cannot be undone.',
  confirmLabel = 'Yes, Remove Item',
  cancelLabel = 'Keep Item',
  onConfirm,
  onCancel,
  className = '',
}) {
  return (
    <div className="sys-modal-root" role="presentation">
      <button type="button" className="sys-modal__backdrop" onClick={onCancel} aria-label="Cancel deletion" />
      <div
        className={`sys-modal sys-modal--delete ${className}`.trim()}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-modal-title"
      >
        <div className="sys-modal__badge">
          <Icon name="trash" size={24} />
        </div>
        <h2 id="delete-modal-title">{title}</h2>
        {message && <p>{message}</p>}
        <div className="sys-modal__actions">
          <button type="button" className="sys-btn sys-btn--ghost" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button type="button" className="sys-btn sys-btn--terracotta" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ==========================================================================
   16. Session Expired
   ========================================================================== */
export function SessionExpiredState({
  eyebrow = 'Security & Session',
  title = 'Your session has taken a rest',
  copy = 'For the protection of your SV Hub account, orders, and delivery addresses, your session timed out after a period of inactivity. Please sign back in to continue.',
  mode = 'card',
  loginTo = '/login',
  guestTo = '/shop',
  className = '',
}) {
  return (
    <div className={`sys-state sys-state--${mode} ${className}`.trim()}>
      <div className="sys-ill-wrap">
        <LockSealIllustration size={mode === 'page' ? 120 : 92} />
      </div>
      <p className="sys-eyebrow sys-eyebrow--muted">{eyebrow}</p>
      <h2 className="sys-title">{title}</h2>
      <p className="sys-copy">{copy}</p>
      <div className="sys-actions">
        {loginTo && (
          <Link to={loginTo} className="sys-btn sys-btn--primary">
            Sign In Again
          </Link>
        )}
        {guestTo && (
          <Link to={guestTo} className="sys-btn sys-btn--ghost">
            Continue Browsing as Guest
          </Link>
        )}
      </div>
    </div>
  )
}

/* ==========================================================================
   Unified Polymorphic Wrapper Component
   ========================================================================== */
export default function SystemState({ type, ...props }) {
  switch (type) {
    case '404':
    case 'not-found':
      return <NotFoundState {...props} />
    case '500':
    case 'server-error':
      return <ServerErrorState {...props} />
    case 'network':
    case 'network-error':
      return <NetworkErrorState {...props} />
    case 'empty-cart':
      return <EmptyCartState {...props} />
    case 'empty-search':
      return <EmptySearchState {...props} />
    case 'empty-orders':
      return <EmptyOrdersState {...props} />
    case 'out-of-stock':
      return <OutOfStockState {...props} />
    case 'loading':
      return <LoadingState {...props} />
    case 'skeleton':
      return <SkeletonState {...props} />
    case 'form-error':
      return <FormErrorState {...props} />
    case 'payment-error':
      return <PaymentErrorState {...props} />
    case 'success-toast':
      return <SuccessToast {...props} />
    case 'error-toast':
      return <ErrorToast {...props} />
    case 'confirm-modal':
      return <ConfirmModal {...props} />
    case 'delete-modal':
      return <DeleteModal {...props} />
    case 'session-expired':
      return <SessionExpiredState {...props} />
    default:
      return <NotFoundState {...props} />
  }
}

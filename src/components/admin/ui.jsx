import { useEffect, useId, useRef } from 'react'
import { Link } from 'react-router-dom'
import { formatPrice } from '../../utils/money.js'
import { storefrontLabel } from '../../data/admin.js'
import { Icon } from './icons.jsx'

export function AdminButton({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  icon,
  to,
  href,
  disabled,
  onClick,
  className = '',
  ...rest
}) {
  const classes = `admin-btn admin-btn--${variant} admin-btn--${size} ${className}`.trim()
  const content = (
    <>
      {icon ? <Icon name={icon} size={size === 'sm' ? 14 : 16} /> : null}
      {children}
    </>
  )

  if (to) {
    return (
      <Link to={to} className={classes} onClick={onClick} {...rest}>
        {content}
      </Link>
    )
  }

  if (href) {
    return (
      <a href={href} className={classes} onClick={onClick} {...rest}>
        {content}
      </a>
    )
  }

  return (
    <button type={type} className={classes} disabled={disabled} onClick={onClick} {...rest}>
      {content}
    </button>
  )
}

export function StatusBadge({ status, kind = 'order' }) {
  const tone = String(status || 'pending')
    .toLowerCase()
    .replace(/\s+/g, '-')
  return (
    <span className={`admin-badge admin-badge--${kind}-${tone}`}>
      <span className="admin-badge__dot" aria-hidden="true" />
      {status}
    </span>
  )
}

export function StorefrontChip({ id }) {
  return <span className={`admin-chip admin-chip--${id}`}>{storefrontLabel(id)}</span>
}

export function PageHeader({ eyebrow, title, copy, actions }) {
  return (
    <header className="admin-pagehead">
      <div>
        {eyebrow ? <p className="admin-pagehead__eyebrow">{eyebrow}</p> : null}
        <h1 className="admin-title">{title}</h1>
        {copy ? <p className="admin-pagehead__copy">{copy}</p> : null}
      </div>
      {actions ? <div className="admin-pagehead__actions">{actions}</div> : null}
    </header>
  )
}

export function SearchInput({ value, onChange, placeholder = 'Search', className = '' }) {
  const id = useId()
  return (
    <label className={`admin-search ${className}`.trim()} htmlFor={id}>
      <Icon name="search" size={16} />
      <span className="sr-only">Search</span>
      <input
        id={id}
        type="search"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}

export function SelectFilter({ label, value, onChange, options }) {
  const id = useId()
  return (
    <label className="admin-select" htmlFor={id}>
      <span>{label}</span>
      <select id={id} value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

export function FilterBar({ children }) {
  return <div className="admin-filters">{children}</div>
}

export function DataTable({ caption, columns, rows, rowKey, empty, loading, renderCard }) {
  if (loading) return <LoadingState />
  if (!rows.length) return empty || <EmptyState title="Nothing here yet" copy="Try another filter or add a record." />

  return (
    <>
      <div className="admin-table-wrap">
        <table className="admin-table">
          {caption ? <caption className="sr-only">{caption}</caption> : null}
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key} scope="col" className={column.className}>
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={rowKey(row)}>
                {columns.map((column) => (
                  <td key={column.key} className={column.className}>
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {renderCard ? (
        <ul className="admin-cards">
          {rows.map((row) => (
            <li key={rowKey(row)}>{renderCard(row)}</li>
          ))}
        </ul>
      ) : null}
    </>
  )
}

export function Pagination({ page, pageCount, from, to, total, onPage }) {
  if (total <= 0) return null
  return (
    <div className="admin-pagebar">
      <p>
        Showing {from}–{to} of {total}
      </p>
      <div className="admin-pagebar__btns">
        <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          Previous
        </button>
        <span>
          {page} / {pageCount}
        </span>
        <button type="button" disabled={page >= pageCount} onClick={() => onPage(page + 1)}>
          Next
        </button>
      </div>
    </div>
  )
}

export function LoadingState({ lines = 6, label = 'Loading' }) {
  return (
    <div className="admin-loading" role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
      {Array.from({ length: lines }, (_, index) => (
        <div key={index} className="admin-skel" style={{ width: `${88 - (index % 3) * 12}%` }} />
      ))}
    </div>
  )
}

export function EmptyState({ title, copy, action }) {
  return (
    <div className="admin-empty">
      <h3>{title}</h3>
      {copy ? <p>{copy}</p> : null}
      {action}
    </div>
  )
}

export function ErrorState({ title = 'Something went wrong', copy, onRetry }) {
  return (
    <div className="admin-error" role="alert">
      <Icon name="alert" />
      <div>
        <h3>{title}</h3>
        {copy ? <p>{copy}</p> : null}
      </div>
      {onRetry ? (
        <AdminButton variant="ghost" size="sm" onClick={onRetry}>
          Retry
        </AdminButton>
      ) : null}
    </div>
  )
}

export function FormField({ label, hint, error, children }) {
  return (
    <label className={`admin-field ${error ? 'admin-field--error' : ''}`.trim()}>
      <span>{label}</span>
      {children}
      {error ? <em>{error}</em> : hint ? <small>{hint}</small> : null}
    </label>
  )
}

export function Modal({ title, onClose, children, wide = false }) {
  const dialogRef = useRef(null)
  const lastFocus = useRef(null)

  useEffect(() => {
    lastFocus.current = document.activeElement
    const node = dialogRef.current
    const focusable = node?.querySelector('input, select, textarea, button')
    focusable?.focus()

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

  return (
    <div className="admin-modal-root" role="presentation">
      <button type="button" className="admin-modal__backdrop" aria-label="Close dialog" onClick={onClose} />
      <div
        ref={dialogRef}
        className={`admin-modal ${wide ? 'admin-modal--wide' : ''}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-modal-title"
      >
        <header className="admin-modal__head">
          <h2 id="admin-modal-title">{title}</h2>
          <button type="button" className="admin-iconbtn" onClick={onClose} aria-label="Close">
            <Icon name="close" />
          </button>
        </header>
        {children}
      </div>
    </div>
  )
}

export function ConfirmDialog({ title, message, confirmLabel, cancelLabel, danger, onConfirm, onCancel }) {
  return (
    <div className="admin-modal-root" role="presentation">
      <button type="button" className="admin-modal__backdrop" aria-label="Cancel" onClick={onCancel} />
      <div className="admin-modal admin-modal--confirm" role="alertdialog" aria-modal="true" aria-labelledby="admin-confirm-title">
        <h2 id="admin-confirm-title">{title}</h2>
        {message ? <p>{message}</p> : null}
        <div className="admin-modal__actions">
          <AdminButton variant="ghost" onClick={onCancel}>
            {cancelLabel || 'Cancel'}
          </AdminButton>
          <AdminButton variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>
            {confirmLabel || 'Confirm'}
          </AdminButton>
        </div>
      </div>
    </div>
  )
}

export function ToastViewport({ toasts, onDismiss }) {
  return (
    <div className="admin-toasts" aria-live="polite">
      {toasts.map((toast) => (
        <button key={toast.id} type="button" className={`admin-toast admin-toast--${toast.tone}`} onClick={() => onDismiss(toast.id)}>
          {toast.tone === 'error' ? <Icon name="alert" size={16} /> : <Icon name="check" size={16} />}
          <span>{toast.message}</span>
        </button>
      ))}
    </div>
  )
}

export function Thumb({ src, name }) {
  if (src) return <img className="admin-thumb" src={src} alt="" width="40" height="40" />
  return (
    <span className="admin-thumb admin-thumb--mark" aria-hidden="true">
      {String(name || 'P')
        .slice(0, 1)
        .toUpperCase()}
    </span>
  )
}

export function Money({ value }) {
  return <span className="admin-money">{formatPrice(value || 0)}</span>
}

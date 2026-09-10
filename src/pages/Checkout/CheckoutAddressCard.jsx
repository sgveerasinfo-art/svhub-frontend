import './Checkout.css'

function IconCheck() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m5 13 4 4L19 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconHome() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m3 9.5 9-7 9 7v10a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 19.5v-10Z" stroke="currentColor" strokeWidth="1.6" />
      <path d="M9 21v-6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v6" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}

function IconWork() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="7" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 12v2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function IconPin() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8Z" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}

export default function CheckoutAddressCard({
  address,
  selected,
  onSelect,
  onEdit,
  onDelete,
  isDeleting,
  onConfirmDelete,
  onCancelDelete,
}) {
  const type = address.label || 'Home'
  const isDefault = Boolean(address.isDefault)
  const isPinned =
    Number.isFinite(Number(address.latitude)) && Number.isFinite(Number(address.longitude))
  const recipientName = address.name || address.fullName || ''
  const streetLine = [
    address.house,
    address.street || address.addressLine1 || address.lines?.[0],
    address.area,
  ]
    .filter(Boolean)
    .join(', ') || address.street || ''
  const cityStatePin = [
    address.city,
    address.state ? `${address.state} — ${address.pin || address.postalCode || ''}` : address.pin,
  ]
    .filter(Boolean)
    .join(', ')
  const phone = address.phone ? `+91 ${address.phone.replace(/^(\+91|91)/, '').trim()}` : ''

  return (
    <div
      role="radio"
      aria-checked={selected}
      tabIndex={0}
      className={`co-addr-card${selected ? ' is-selected' : ''}`}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault()
          onSelect()
        }
      }}
    >
      <div className="co-addr-card__header">
        <div className="co-addr-card__tags">
          <span className={`co-addr-badge co-addr-badge--${type.toLowerCase()}`}>
            {type === 'Work' ? <IconWork /> : type === 'Other' ? <IconPin /> : <IconHome />}
            {type.toUpperCase()}
          </span>
          {isDefault && <span className="co-addr-badge co-addr-badge--default">DEFAULT</span>}
          {isPinned && <span className="co-addr-badge co-addr-badge--pinned">📍 MAP PINNED</span>}
        </div>

        <div className={`co-addr-indicator${selected ? ' is-checked' : ''}`} aria-hidden="true">
          {selected && <IconCheck />}
        </div>
      </div>

      <div className="co-addr-card__body">
        <h3 className="co-addr-card__name">{recipientName}</h3>
        <p className="co-addr-card__street">{streetLine}</p>
        {address.landmark && (
          <p className="co-addr-card__landmark">Near: {address.landmark}</p>
        )}
        <p className="co-addr-card__city">{cityStatePin}</p>
        {phone && <p className="co-addr-card__phone">{phone}</p>}
      </div>

      {isDeleting ? (
        <div className="co-addr-card__delete-prompt" onClick={(e) => e.stopPropagation()}>
          <p>Remove this address?</p>
          <div className="co-addr-card__delete-actions">
            <button
              type="button"
              className="co-addr-btn co-addr-btn--cancel"
              onClick={onCancelDelete}
            >
              Cancel
            </button>
            <button
              type="button"
              className="co-addr-btn co-addr-btn--confirm-delete"
              onClick={onConfirmDelete}
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div className="co-addr-card__footer" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className="co-addr-action-btn"
            onClick={onEdit}
            aria-label={`Edit address for ${recipientName}`}
          >
            Edit
          </button>
          <span className="co-addr-action-sep" aria-hidden="true">·</span>
          <button
            type="button"
            className="co-addr-action-btn co-addr-action-btn--delete"
            onClick={onDelete}
            aria-label={`Remove address for ${recipientName}`}
          >
            Remove
          </button>
        </div>
      )}
    </div>
  )
}

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { formatPrice } from '../../utils/money.js'
import './CartRemoveModal.css'

function IconClose() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

export default function CartRemoveModal({ item, onConfirm, onCancel }) {
  const [isClosing, setIsClosing] = useState(false)
  const cancelBtnRef = useRef(null)

  const handleClose = useCallback(() => {
    if (isClosing) return
    setIsClosing(true)
    setTimeout(() => {
      onCancel()
    }, 200)
  }, [isClosing, onCancel])

  const handleConfirm = useCallback(() => {
    if (isClosing) return
    setIsClosing(true)
    setTimeout(() => {
      onConfirm()
    }, 200)
  }, [isClosing, onConfirm])

  useEffect(() => {
    // Focus Cancel button on open for safe keyboard navigation
    const timer = setTimeout(() => {
      cancelBtnRef.current?.focus()
    }, 50)

    // Handle Escape key
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        handleClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)

    // Lock body scroll while modal is open
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      clearTimeout(timer)
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = prevOverflow
    }
  }, [handleClose])

  if (!item) return null

  const meta = [item.type, item.weight].filter(Boolean).join(' • ')

  return createPortal(
    <div
      className={`sv-modal-overlay ${isClosing ? 'is-closing' : ''}`}
      onClick={handleClose}
      role="presentation"
    >
      <div
        className={`sv-modal-card ${isClosing ? 'is-closing' : ''}`}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="sv-remove-title"
        aria-describedby="sv-remove-desc"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="sv-modal-close-btn"
          onClick={handleClose}
          aria-label="Close dialog"
        >
          <IconClose />
        </button>

        <div className="sv-modal-body">
          {item.image && (
            <div className="sv-modal-preview">
              <img src={item.image} alt="" className="sv-modal-thumb" />
              <div className="sv-modal-item-info">
                <span className="sv-modal-item-name">{item.name}</span>
                {meta && <span className="sv-modal-item-meta">{meta}</span>}
                {item.price && (
                  <span className="sv-modal-item-price">{formatPrice(item.price)}</span>
                )}
              </div>
            </div>
          )}

          <h3 id="sv-remove-title" className="sv-modal-title">
            Remove from Cart?
          </h3>

          <p id="sv-remove-desc" className="sv-modal-message">
            Do you want to remove this product from cart?
          </p>

          <div className="sv-modal-actions">
            <button
              ref={cancelBtnRef}
              type="button"
              className="sv-modal-btn sv-modal-btn--cancel"
              onClick={handleClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className="sv-modal-btn sv-modal-btn--confirm"
              onClick={handleConfirm}
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}

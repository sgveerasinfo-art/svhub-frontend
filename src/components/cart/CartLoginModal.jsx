import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import './CartLoginModal.css'

function IconClose() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function IconUserLock() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 20c0-3.3 3.6-6 8-6m5 2v-2a2 2 0 1 1 4 0v2m-5 0h6v4h-6v-4Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function CartLoginModal({ onConfirm, onCancel }) {
  const [isClosing, setIsClosing] = useState(false)
  const confirmBtnRef = useRef(null)

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
    const timer = setTimeout(() => {
      confirmBtnRef.current?.focus()
    }, 50)

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        handleClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      clearTimeout(timer)
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = prevOverflow
    }
  }, [handleClose])

  return createPortal(
    <div
      className={`sv-modal-overlay ${isClosing ? 'is-closing' : ''}`}
      onClick={handleClose}
      role="presentation"
    >
      <div
        className={`sv-modal-card cart-login-modal ${isClosing ? 'is-closing' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-login-title"
        aria-describedby="cart-login-desc"
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
          <div className="cart-login-modal__icon-wrap">
            <IconUserLock />
          </div>

          <h3 id="cart-login-title" className="sv-modal-title">
            Login to Checkout
          </h3>

          <p id="cart-login-desc" className="sv-modal-message">
            Please log in to continue with your order. Your cart items will be saved for you.
          </p>

          <div className="sv-modal-actions">
            <button
              type="button"
              className="sv-modal-btn sv-modal-btn--cancel"
              onClick={handleClose}
            >
              Cancel
            </button>
            <button
              ref={confirmBtnRef}
              type="button"
              className="sv-modal-btn cart-login-modal__btn-confirm"
              onClick={handleConfirm}
            >
              OK, Log In
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}

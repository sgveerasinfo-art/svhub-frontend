import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../../context/CartContext.jsx'
import { formatPrice } from '../../utils/money.js'
import './StickyCartBar.css'

function CartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 7h15l-1.4 9.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.6L4.2 4.8H2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="9" cy="21" r="1.2" fill="currentColor" />
      <circle cx="17" cy="21" r="1.2" fill="currentColor" />
    </svg>
  )
}

function ArrowRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M3 8h10M9.5 4.5 13 8l-3.5 3.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function StickyCartBar() {
  const { count, subtotal, discountedSubtotal, discountAmount, cartError, clearCartError } = useCart()
  const [isExiting, setIsExiting] = useState(false)
  const [isVisible, setIsVisible] = useState(count > 0)
  const [pulse, setPulse] = useState(false)
  const prevCountRef = useRef(count)

  useEffect(() => {
    let timer

    if (count > 0) {
      const frame = requestAnimationFrame(() => {
        setIsVisible(true)
      })

      if (prevCountRef.current !== count && prevCountRef.current > 0) {
        setPulse(true)
        timer = setTimeout(() => setPulse(false), 240)
      }
      prevCountRef.current = count

      return () => {
        cancelAnimationFrame(frame)
        if (timer) clearTimeout(timer)
      }
    } else if (prevCountRef.current > 0) {
      // Trigger smooth slide-down exit
      setIsVisible(false)
      setIsExiting(true)
      timer = setTimeout(() => {
        setIsExiting(false)
      }, 320)
      prevCountRef.current = 0

      return () => {
        if (timer) clearTimeout(timer)
      }
    }
  }, [count])

  const shouldRender = count > 0 || isExiting
  if (!shouldRender) return null

  const itemText = count === 1 ? '1 ITEM' : `${count} ITEMS`
  const displayTotal = discountAmount > 0 ? discountedSubtotal : subtotal
  const formattedTotal = formatPrice(displayTotal)
  const accessibleLabel = `Go to cart. ${count} ${count === 1 ? 'item' : 'items'}. Total ${formattedTotal}.`

  return (
    <aside
      className={`sticky-cart-container ${isVisible ? 'is-visible' : ''}`}
      aria-label="Cart summary bar"
    >
      {cartError ? (
        <div className="sticky-cart-error" role="alert">
          <span>{cartError}</span>
          <button type="button" onClick={clearCartError} aria-label="Dismiss cart error">
            ×
          </button>
        </div>
      ) : null}
      <Link
        to="/cart"
        className="sticky-cart-bar"
        aria-label={accessibleLabel}
      >
        <div className="sticky-cart-bar__info">
          <div className="sticky-cart-bar__icon-wrap" aria-hidden="true">
            <CartIcon />
            <span className="sticky-cart-bar__badge">{count}</span>
          </div>

          <div className={`sticky-cart-bar__summary ${pulse ? 'is-pulsing' : ''}`}>
            <span className="sticky-cart-bar__count">{itemText}</span>
            <span className="sticky-cart-bar__dot" aria-hidden="true">·</span>
            <span className="sticky-cart-bar__price">{formattedTotal}</span>
          </div>
        </div>

        <div className="sticky-cart-bar__cta">
          <span className="sticky-cart-bar__cta-text">GO TO CART</span>
          <span className="sticky-cart-bar__arrow" aria-hidden="true">
            <ArrowRight />
          </span>
        </div>
      </Link>
    </aside>
  )
}

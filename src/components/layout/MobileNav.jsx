import { useEffect, useRef } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import Logo from '../brand/Logo.jsx'
import './MobileNav.css'

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M4 4l10 10M14 4 4 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function MobileNav({ open, onClose, links }) {
  const { user } = useAuth()
  const closeRef = useRef(null)
  const panelRef = useRef(null)

  const navLinks = [
    ...links,
    {
      to: '/account',
      label: user ? 'Account' : 'Account / Login',
    },
  ]

  useEffect(() => {
    if (!open) return undefined
    const id = window.requestAnimationFrame(() => closeRef.current?.focus())
    return () => window.cancelAnimationFrame(id)
  }, [open])

  useEffect(() => {
    if (!open) return undefined

    function onKey(event) {
      if (event.key !== 'Tab' || !panelRef.current) return
      const focusable = panelRef.current.querySelectorAll(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <div className={`mobile-nav${open ? ' is-open' : ''}`} id="mobile-nav">
      <button type="button" className="mobile-nav__backdrop" onClick={onClose} tabIndex={open ? 0 : -1} aria-label="Close menu" />
      <aside
        ref={panelRef}
        className="mobile-nav__panel"
        aria-hidden={!open}
        aria-label="Mobile menu"
        inert={!open || undefined}
      >
        <div className="mobile-nav__top">
          <span onClick={onClose}>
            <Logo />
          </span>
          <button ref={closeRef} type="button" className="mobile-nav__close" onClick={onClose} aria-label="Close menu">
            <CloseIcon />
          </button>
        </div>

        <p className="mobile-nav__eyebrow">Explore SV Hub</p>

        <nav className="mobile-nav__links" aria-label="Mobile">
          {navLinks.map((link, index) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                `mobile-nav__link${isActive ? ' mobile-nav__link--active' : ''}`
              }
              onClick={onClose}
            >
              <span className="mobile-nav__index">{String(index + 1).padStart(2, '0')}</span>
              <span className="mobile-nav__label">{link.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </div>
  )
}

export default MobileNav

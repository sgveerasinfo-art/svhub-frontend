import { useEffect, useRef } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import Logo from '../brand/Logo.jsx'
import {
  homeLink,
  primaryDestinations,
  secondaryLinks,
} from '../../data/navigation.js'
import './MobileNav.css'

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M4 4l10 10M14 4 4 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function MobileNav({ open, onClose }) {
  const { user } = useAuth()
  const closeRef = useRef(null)
  const panelRef = useRef(null)

  const moreLinks = [
    homeLink,
    ...secondaryLinks,
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
      <button
        type="button"
        className="mobile-nav__backdrop"
        onClick={onClose}
        tabIndex={open ? 0 : -1}
        aria-label="Close menu"
      />
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
          <button
            ref={closeRef}
            type="button"
            className="mobile-nav__close"
            onClick={onClose}
            aria-label="Close menu"
          >
            <CloseIcon />
          </button>
        </div>

        <nav className="mobile-nav__nav" aria-label="Mobile">
          <p className="mobile-nav__section-label" id="mobile-nav-primary-label">
            Primary
          </p>
          <div
            className="mobile-nav__primary"
            role="group"
            aria-labelledby="mobile-nav-primary-label"
          >
            {primaryDestinations.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `mobile-nav__dest${isActive ? ' mobile-nav__dest--active' : ''}`
                }
                onClick={onClose}
              >
                <span>{link.label}</span>
                <span className="mobile-nav__dest-arrow" aria-hidden="true">
                  →
                </span>
              </NavLink>
            ))}
          </div>

          <p className="mobile-nav__section-label" id="mobile-nav-more-label">
            More
          </p>
          <div className="mobile-nav__links" role="group" aria-labelledby="mobile-nav-more-label">
            {moreLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end || link.to === '/'}
                className={({ isActive }) =>
                  `mobile-nav__link${isActive ? ' mobile-nav__link--active' : ''}`
                }
                onClick={onClose}
              >
                <span className="mobile-nav__label">{link.label}</span>
              </NavLink>
            ))}
          </div>
        </nav>
      </aside>
    </div>
  )
}

export default MobileNav

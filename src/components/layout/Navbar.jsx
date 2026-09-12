import { NavLink, Link, useLocation } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import Logo from '../brand/Logo.jsx'
import MobileNav from './MobileNav.jsx'
import { useCart } from '../../context/CartContext.jsx'
import {
  homeLink,
  primaryDestinations,
  secondaryLinks,
} from '../../data/navigation.js'
import './Navbar.css'

function IconSearch() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M16.2 16.2 20 20" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  )
}

function IconAccount() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M5 19.2c1.4-3.2 4-4.8 7-4.8s5.6 1.6 7 4.8"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  )
}

function IconCart() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 7h15l-1.4 9.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.6L4.2 4.8H2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="9" cy="21" r="1.15" fill="currentColor" />
      <circle cx="17" cy="21" r="1.15" fill="currentColor" />
    </svg>
  )
}

function NavItem({ to, label, end = false, primary = false, featured = false }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        [
          'navbar__link',
          primary ? 'navbar__link--primary' : '',
          featured ? 'navbar__link--shop' : '',
          isActive ? 'navbar__link--active' : '',
        ]
          .filter(Boolean)
          .join(' ')
      }
    >
      {label}
    </NavLink>
  )
}

function Navbar() {
  const { count } = useCart()
  const { pathname } = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const menuBtnRef = useRef(null)
  const wasOpen = useRef(false)
  const [navPath, setNavPath] = useState(pathname)

  if (navPath !== pathname) {
    setNavPath(pathname)
    if (menuOpen) setMenuOpen(false)
  }

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 28)
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [pathname])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  useEffect(() => {
    if (!menuOpen) return undefined
    function onKey(event) {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen])

  useEffect(() => {
    if (menuOpen) {
      wasOpen.current = true
      return undefined
    }
    if (wasOpen.current) {
      menuBtnRef.current?.focus()
      wasOpen.current = false
    }
    return undefined
  }, [menuOpen])

  return (
    <header className={`navbar${scrolled ? ' navbar--compact' : ''}`}>
      <div className="navbar__inner">
        <Logo />

        <nav className="navbar__links" aria-label="Primary">
          <NavItem to={homeLink.to} label={homeLink.label} end />

          <div className="navbar__primary" role="group" aria-label="Shop destinations">
            {primaryDestinations.map((link) => (
              <NavItem
                key={link.to}
                to={link.to}
                label={link.label}
                primary
                featured={Boolean(link.featured)}
              />
            ))}
          </div>

          {secondaryLinks.map((link) => (
            <NavItem key={link.to} to={link.to} label={link.label} />
          ))}
        </nav>

        <div className="navbar__actions">
          <Link to="/search" className="navbar__icon navbar__icon--desktop" aria-label="Search products">
            <IconSearch />
          </Link>
          <Link
            to="/account"
            className={`navbar__icon navbar__icon--desktop${
              pathname.startsWith('/account') ? ' is-active' : ''
            }`}
            aria-current={pathname.startsWith('/account') ? 'page' : undefined}
            aria-label="Account"
          >
            <IconAccount />
          </Link>
          <Link to="/cart" className="navbar__icon" aria-label={`Cart, ${count} items`}>
            <IconCart />
            {count > 0 && <span className="navbar__badge">{count}</span>}
          </Link>
          <button
            ref={menuBtnRef}
            type="button"
            className={`navbar__menu${menuOpen ? ' is-open' : ''}`}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="navbar__burger" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          </button>
        </div>
      </div>

      <MobileNav open={menuOpen} onClose={() => setMenuOpen(false)} />
    </header>
  )
}

export default Navbar

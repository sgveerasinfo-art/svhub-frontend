import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { AdminStoreProvider, useAdminStore } from '../../context/AdminStore.jsx'
import { AdminUiProvider, useAdminUi } from '../../context/AdminUi.jsx'
import { matchesQuery } from '../../data/admin.js'
import { revokeAdminAccess } from '../../utils/adminAuth.js'
import { Icon } from './icons.jsx'
import { ConfirmDialog, ToastViewport } from './ui.jsx'
import { LOGO_ALT, LOGO_SRC } from '../../data/brand.js'
import './admin.css'

const MAIN_NAV = [
  { to: '/admin', label: 'Dashboard', icon: 'dashboard', end: true },
  { to: '/admin/products', label: 'Products', icon: 'products' },
  { to: '/admin/categories', label: 'Categories', icon: 'categories' },
  { to: '/admin/orders', label: 'Orders', icon: 'orders' },
  { to: '/admin/customers', label: 'Customers', icon: 'customers' },
]

const MANAGEMENT_NAV = [{ to: '/admin/inventory', label: 'Inventory', icon: 'inventory' }]

const ALL_NAV = [...MAIN_NAV, ...MANAGEMENT_NAV, { to: '/admin/settings', label: 'Settings', icon: 'settings' }]

function titleFromPath(pathname) {
  if (pathname === '/admin') return 'Dashboard'
  if (pathname === '/admin/products/new') return 'Add Product'
  if (pathname.startsWith('/admin/products/') && pathname.endsWith('/edit')) return 'Edit Product'
  if (pathname.startsWith('/admin/orders/')) return 'Order'
  const hit = ALL_NAV.find((item) => item.to !== '/admin' && pathname.startsWith(item.to))
  return hit?.label || 'Admin'
}

function isMac() {
  return typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)
}

function AdminBrand({ onNavigate }) {
  return (
    <Link to="/admin" className="admin-brand" onClick={onNavigate}>
      <img className="admin-brand__img" src={LOGO_SRC} alt={LOGO_ALT} width={1024} height={1024} decoding="async" />
      <span className="admin-brand__text">
        <span className="admin-brand__name">SV Hub</span>
        <span className="admin-brand__tag">Admin</span>
      </span>
    </Link>
  )
}

function NavGroup({ title, items, onNavigate }) {
  return (
    <div className="admin-sidenav__group">
      {title ? <p className="admin-sidenav__label">{title}</p> : null}
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          title={item.label}
          className={({ isActive }) => `admin-sidenav__link${isActive ? ' is-active' : ''}`}
          onClick={onNavigate}
        >
          <Icon name={item.icon} size={16} />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </div>
  )
}

function NavList({ onNavigate, onLogout }) {
  return (
    <nav className="admin-sidenav" aria-label="Admin">
      <NavGroup title="Main" items={MAIN_NAV} onNavigate={onNavigate} />
      <NavGroup title="Management" items={MANAGEMENT_NAV} onNavigate={onNavigate} />
      <div className="admin-sidenav__foot">
        <NavLink
          to="/admin/settings"
          title="Settings"
          className={({ isActive }) => `admin-sidenav__link${isActive ? ' is-active' : ''}`}
          onClick={onNavigate}
        >
          <Icon name="settings" size={16} />
          <span>Settings</span>
        </NavLink>
        <button type="button" className="admin-sidenav__link admin-sidenav__logout" onClick={onLogout}>
          <Icon name="logout" size={16} />
          <span>Logout</span>
        </button>
      </div>
    </nav>
  )
}

function GlobalSearch() {
  const { products, orders, ready } = useAdminStore()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const inputRef = useRef(null)
  const navigate = useNavigate()
  const hint = isMac() ? '⌘K' : 'Ctrl K'

  const results = useMemo(() => {
    if (!ready || query.trim().length < 2) return { products: [], orders: [] }
    return {
      products: products.filter((item) => matchesQuery(query, item.name, item.sku, item.type)).slice(0, 4),
      orders: orders.filter((item) => matchesQuery(query, item.number, item.customerName, item.email)).slice(0, 4),
    }
  }, [products, orders, query, ready])

  const hasResults = results.products.length + results.orders.length > 0

  useEffect(() => {
    function onKey(event) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setExpanded(true)
        window.setTimeout(() => inputRef.current?.focus(), 0)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  function go(path) {
    setQuery('')
    setOpen(false)
    setExpanded(false)
    navigate(path)
  }

  return (
    <div className={`admin-global${expanded ? ' is-open' : ''}`}>
      <button
        type="button"
        className="admin-iconbtn admin-global__toggle"
        aria-label="Open search"
        onClick={() => {
          setExpanded(true)
          window.setTimeout(() => inputRef.current?.focus(), 0)
        }}
      >
        <Icon name="search" size={16} />
      </button>
      <label className="admin-search admin-search--top">
        <Icon name="search" size={15} />
        <span className="sr-only">Search orders and products</span>
        <input
          ref={inputRef}
          type="search"
          value={query}
          placeholder="Search orders, products..."
          onChange={(event) => {
            setQuery(event.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() =>
            window.setTimeout(() => {
              setOpen(false)
              setExpanded(false)
            }, 160)
          }
        />
        <kbd className="admin-kbd">{hint}</kbd>
      </label>
      {open && query.trim().length >= 2 ? (
        <div className="admin-global__panel">
          {!hasResults ? <p className="admin-global__empty">No matches</p> : null}
          {results.orders.length ? (
            <div>
              <p className="admin-global__label">Orders</p>
              {results.orders.map((order) => (
                <button key={order.id} type="button" onMouseDown={() => go(`/admin/orders/${order.id}`)}>
                  {order.number}
                  <span>{order.customerName}</span>
                </button>
              ))}
            </div>
          ) : null}
          {results.products.length ? (
            <div>
              <p className="admin-global__label">Products</p>
              {results.products.map((product) => (
                <button key={product.id} type="button" onMouseDown={() => go(`/admin/products?q=${encodeURIComponent(product.name)}`)}>
                  {product.name}
                  <span>{product.sku}</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

function useDismiss(open, setOpen) {
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    function onPointer(event) {
      if (!ref.current?.contains(event.target)) setOpen(false)
    }
    function onKey(event) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, setOpen])

  return ref
}

function AlertMenu() {
  const { ready, orders, products } = useAdminStore()
  const [open, setOpen] = useState(false)
  const ref = useDismiss(open, setOpen)
  const pending = orders.filter((order) => order.status === 'Pending')
  const low = products.filter((product) => product.stock === 'low-stock' || product.stock === 'out-of-stock')
  const count = pending.length + low.length

  if (!ready) return null

  return (
    <div className="admin-pop" ref={ref}>
      <button
        type="button"
        className="admin-iconbtn"
        aria-label={count ? `${count} items need attention` : 'Notifications'}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Icon name="bell" size={16} />
        {count ? <span className="admin-pop__dot" /> : null}
      </button>
      {open ? (
        <div className="admin-pop__panel">
          <p className="admin-global__label">Attention</p>
          {pending.slice(0, 3).map((order) => (
            <Link key={order.id} to={`/admin/orders/${order.id}`} onClick={() => setOpen(false)}>
              {order.number}
              <span>Pending</span>
            </Link>
          ))}
          {low.slice(0, 3).map((product) => (
            <Link key={product.id} to="/admin/inventory" onClick={() => setOpen(false)}>
              {product.name}
              <span>{product.qty} left</span>
            </Link>
          ))}
          {!count ? <p className="admin-global__empty">Nothing waiting</p> : null}
        </div>
      ) : null}
    </div>
  )
}

function StaffMenu({ onLogout, user }) {
  const [open, setOpen] = useState(false)
  const ref = useDismiss(open, setOpen)
  const displayName = user?.name || 'Operations Admin'
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="admin-pop admin-staff" ref={ref}>
      <button type="button" className="admin-staff__btn" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        <span className="admin-staff__avatar" aria-hidden="true">
          {initials}
        </span>
        <span className="admin-staff__meta">
          <strong>{displayName}</strong>
          <em>Operations</em>
        </span>
        <Icon name="chevron" size={14} />
      </button>
      {open ? (
        <div className="admin-pop__panel admin-pop__panel--staff">
          <Link to="/" onClick={() => setOpen(false)}>
            View storefront
          </Link>
          <Link to="/admin/settings" onClick={() => setOpen(false)}>
            Settings
          </Link>
          <button type="button" onClick={onLogout}>
            Logout
          </button>
        </div>
      ) : null}
    </div>
  )
}

function AdminShell() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { confirm, confirmState, settleConfirm, toasts, dismissToast } = useAdminUi()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    document.documentElement.classList.add('admin-open')
    return () => document.documentElement.classList.remove('admin-open')
  }, [])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  const closeMenu = () => setMenuOpen(false)

  async function handleLogout() {
    closeMenu()
    const ok = await confirm({
      title: 'Log out of admin?',
      message: 'You will leave the operations dashboard and return to the storefront.',
      confirmLabel: 'Log out',
      danger: true,
    })
    if (!ok) return
    revokeAdminAccess()
    await logout()
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="admin">
      <aside className="admin-sidebar">
        <AdminBrand />
        <NavList onLogout={handleLogout} />
      </aside>

      <div
        className={`admin-drawer ${menuOpen ? 'is-open' : ''}`}
        aria-hidden={!menuOpen}
        inert={!menuOpen || undefined}
      >
        <button type="button" className="admin-drawer__backdrop" aria-label="Close menu" onClick={closeMenu} />
        <div className="admin-drawer__panel">
          <div className="admin-drawer__head">
            <AdminBrand onNavigate={closeMenu} />
            <button type="button" className="admin-iconbtn admin-iconbtn--light" onClick={closeMenu} aria-label="Close menu">
              <Icon name="close" />
            </button>
          </div>
          <NavList onNavigate={closeMenu} onLogout={handleLogout} />
        </div>
      </div>

      <div className="admin-main">
        <header className="admin-topbar">
          <button
            type="button"
            className="admin-iconbtn admin-topbar__menu"
            aria-label="Open navigation"
            onClick={() => setMenuOpen(true)}
          >
            <Icon name="menu" />
          </button>
          <p className="admin-topbar__title">{titleFromPath(pathname)}</p>
          <GlobalSearch />
          <div className="admin-topbar__right">
            <AlertMenu />
            <StaffMenu onLogout={handleLogout} user={user} />
          </div>
        </header>

        <main className="admin-content">
          <div className="admin-canvas">
            <Outlet />
          </div>
        </main>
      </div>

      <ToastViewport toasts={toasts} onDismiss={dismissToast} />
      {confirmState ? (
        <ConfirmDialog {...confirmState} onConfirm={() => settleConfirm(true)} onCancel={() => settleConfirm(false)} />
      ) : null}
    </div>
  )
}

export default function AdminLayout() {
  return (
    <AdminStoreProvider>
      <AdminUiProvider>
        <AdminShell />
      </AdminUiProvider>
    </AdminStoreProvider>
  )
}

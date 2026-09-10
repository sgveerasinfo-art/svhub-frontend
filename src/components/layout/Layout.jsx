import { Outlet, useLocation } from 'react-router-dom'
import Navbar from './Navbar.jsx'
import Footer from './Footer.jsx'
import StickyCartBar from '../cart/StickyCartBar.jsx'
import { useCart } from '../../context/CartContext.jsx'
import './Layout.css'

function Layout() {
  const { pathname } = useLocation()
  const { count } = useCart()
  const bare =
    pathname === '/checkout' || pathname === '/order-success' || pathname === '/payment-failed'
  const compactFooter = pathname.startsWith('/account') || pathname === '/about'
  const isCart = pathname === '/cart'
  const showStickyCart = !bare && !isCart && count > 0

  return (
    <div className={`page-frame${showStickyCart ? ' has-sticky-cart' : ''}`}>
      <div className="page-shell">
        {bare ? null : <Navbar />}
        <main>
          <Outlet />
        </main>
        {bare ? null : <Footer compact={compactFooter} />}
        {!bare && !isCart && <StickyCartBar />}
      </div>
    </div>
  )
}

export default Layout

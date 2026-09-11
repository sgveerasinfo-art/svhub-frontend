import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import { CartProvider } from './context/CartContext.jsx'
import AdminLayout from './components/admin/AdminLayout.jsx'
import RequireAdmin from './components/admin/RequireAdmin.jsx'
import RequireCustomerAuth from './components/auth/RequireCustomerAuth.jsx'
import Layout from './components/layout/Layout.jsx'
import AdminDashboard from './pages/Admin/Dashboard.jsx'
import AdminOrders from './pages/Admin/Orders.jsx'
import AdminOrderDetail from './pages/Admin/OrderDetail.jsx'
import AdminProducts from './pages/Admin/Products.jsx'
import AdminProductNew from './pages/Admin/ProductNew.jsx'
import AdminProductEdit from './pages/Admin/ProductEdit.jsx'
import AdminInventory from './pages/Admin/Inventory.jsx'
import AdminCategories from './pages/Admin/Categories.jsx'
import AdminCustomers from './pages/Admin/Customers.jsx'
import AdminSettings from './pages/Admin/Settings.jsx'
import AdminLogin from './pages/Admin/Login.jsx'
import Home from './pages/Home/Home.jsx'
import Shop from './pages/Shop/Shop.jsx'
import NutriHub from './pages/NutriHub/NutriHub.jsx'
import Search from './pages/Search/Search.jsx'
import Category from './pages/Category/Category.jsx'
import Product from './pages/Product/Product.jsx'
import CartPage from './pages/CartPage.jsx'
import Checkout from './pages/Checkout/Checkout.jsx'
import OrderSuccess from './pages/OrderSuccess/OrderSuccess.jsx'
import PaymentFailed from './pages/PaymentFailed/PaymentFailed.jsx'
import SelfCare from './pages/SelfCare/SelfCare.jsx'
import About from './pages/About/About.jsx'
import Contact from './pages/Contact/Contact.jsx'
import Login from './pages/Auth/Login.jsx'
import Register from './pages/Auth/Register.jsx'
import ForgotPassword from './pages/Auth/ForgotPassword.jsx'
import ResetPassword from './pages/Auth/ResetPassword.jsx'
import Account from './pages/Account/Account.jsx'
import Overview from './pages/Account/Overview.jsx'
import Profile from './pages/Account/Profile.jsx'
import Orders from './pages/Account/Orders.jsx'
import OrderDetail from './pages/Account/OrderDetail.jsx'
import Addresses from './pages/Account/Addresses.jsx'
import PrivacyPolicy from './pages/Legal/PrivacyPolicy.jsx'
import Terms from './pages/Legal/Terms.jsx'
import ShippingPolicy from './pages/Legal/ShippingPolicy.jsx'
import RefundPolicy from './pages/Legal/RefundPolicy.jsx'
import SystemErrorBoundary from './components/system/SystemErrorBoundary.jsx'
import NotFoundPage from './pages/NotFound/NotFoundPage.jsx'
import SystemStatesPage from './pages/SystemStates/SystemStatesPage.jsx'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <SystemErrorBoundary>
            <Routes>
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route element={<RequireAdmin />}>
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="orders" element={<AdminOrders />} />
                  <Route path="orders/:orderId" element={<AdminOrderDetail />} />
                  <Route path="orders/:id" element={<AdminOrderDetail />} />
                  <Route path="products" element={<AdminProducts />} />
                  <Route path="products/new" element={<AdminProductNew />} />
                  <Route path="products/:id/edit" element={<AdminProductEdit />} />
                  <Route path="inventory" element={<AdminInventory />} />
                  <Route path="categories" element={<AdminCategories />} />
                  <Route path="customers" element={<AdminCustomers />} />
                  <Route path="settings" element={<AdminSettings />} />
                  <Route path="system-states" element={<SystemStatesPage />} />
                  <Route path="*" element={<Navigate to="/admin" replace />} />
                </Route>
              </Route>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route element={<Layout />}>
                <Route path="/" element={<Home />} />
                <Route path="/cart" element={<CartPage />} />
                <Route element={<RequireCustomerAuth />}>
                  <Route path="/checkout" element={<Checkout />} />
                </Route>
                <Route path="/order-success" element={<OrderSuccess />} />
                <Route path="/payment-failed" element={<PaymentFailed />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/nutri-hub" element={<NutriHub />} />
                <Route path="/self-care" element={<SelfCare />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/search" element={<Search />} />
                <Route path="/system-states" element={<SystemStatesPage />} />
                <Route path="/404" element={<NotFoundPage />} />
                <Route path="/account" element={<Account />}>
                  <Route index element={<Overview />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="orders" element={<Orders />} />
                  <Route path="orders/:orderId" element={<OrderDetail />} />
                  <Route path="addresses" element={<Addresses />} />
                </Route>
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/privacy" element={<Navigate to="/privacy-policy" replace />} />
                <Route path="/terms-and-conditions" element={<Terms />} />
                <Route path="/terms" element={<Navigate to="/terms-and-conditions" replace />} />
                <Route path="/shipping-policy" element={<ShippingPolicy />} />
                <Route path="/shipping" element={<Navigate to="/shipping-policy" replace />} />
                <Route path="/refund-policy" element={<RefundPolicy />} />
                <Route path="/refund" element={<Navigate to="/refund-policy" replace />} />
                <Route path="/category/:slug" element={<Category />} />
                <Route path="/product/:slug" element={<Product />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Routes>
          </SystemErrorBoundary>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App

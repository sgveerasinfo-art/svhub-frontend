import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useCart } from '../../context/CartContext.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { readToken } from '../../api/auth.js'
import { createOrder } from '../../api/orders.js'
import { createRazorpayOrder, verifyRazorpayPayment, recordPaymentFailure } from '../../api/payments.js'
import { getAddresses, createAddress, updateAddress, deleteAddress } from '../../api/addresses.js'
import CheckoutAddressCard from './CheckoutAddressCard.jsx'
import CheckoutAddressForm from './CheckoutAddressForm.jsx'
import LocationPicker from './LocationPicker.jsx'
import { loadRazorpayScript } from '../../lib/razorpay.js'
import { formatPrice } from '../../utils/money.js'
import Logo from '../../components/brand/Logo.jsx'
import './Checkout.css'

const STANDARD = 40
const EXPRESS = 120
const STATE_SHORT = {
  'Tamil Nadu': 'TN',
  Kerala: 'KL',
  Karnataka: 'KA',
  'Andhra Pradesh': 'AP',
  Telangana: 'TS',
  Puducherry: 'PY',
}

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  delivery: 'standard',
  payMethod: 'card',
  cardNumber: '',
  cardExpiry: '',
  cardCvc: '',
  cardName: '',
}

function IconBack() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M15 6 9 12l6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconLock() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M8 11V8.5a4 4 0 0 1 8 0V11" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  )
}

function IconShield() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3.5 5 6.5v5.2c0 4.3 2.9 7.2 7 8.8 4.1-1.6 7-4.5 7-8.8V6.5L12 3.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconVerified() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="m8.5 12.2 2.2 2.2 4.8-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function IconCard() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="5.5" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3 10h18" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}

function IconWallet() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="6" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M16 12.5h4V19H5a2 2 0 0 1-2-2V8" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="16.5" cy="12.5" r="1" fill="currentColor" />
    </svg>
  )
}

function emailOk(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

function phoneOk(value) {
  const digits = value.replace(/\D/g, '')
  return digits.length === 10 || (digits.length === 12 && digits.startsWith('91'))
}

function Field({ id, label, error, className = '', children }) {
  return (
    <div className={`co-field${error ? ' is-invalid' : ''}${className ? ` ${className}` : ''}`}>
      {label ? (
        <label htmlFor={id} className="co-label">
          {label}
        </label>
      ) : null}
      {children}
      {error ? (
        <p className="co-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}

function StepHead({ step, mobileStep, title, mobileTitle }) {
  return (
    <div className="co-step">
      <span className={`co-step__num${step === '1' ? ' is-active' : ''}`}>
        <span className="co-step__desk">{step}</span>
        <span className="co-step__mob">{mobileStep || step}</span>
      </span>
      <h2>
        <span className={mobileTitle ? 'co-step__desk' : undefined}>{title}</span>
        {mobileTitle ? <span className="co-step__mob">{mobileTitle}</span> : null}
      </h2>
    </div>
  )
}

function Checkout() {
  const { items, clearCart, loading: cartLoading } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [placed, setPlaced] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  // Saved Address States
  const [savedAddresses, setSavedAddresses] = useState([])
  const [loadingAddresses, setLoadingAddresses] = useState(Boolean(user))
  const [addressFetchError, setAddressFetchError] = useState('')
  const [selectedAddressId, setSelectedAddressId] = useState(null)
  const [addressFlow, setAddressFlow] = useState(null) // null | 'location-picker' | 'form'
  const [editingAddress, setEditingAddress] = useState(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)
  const [addressSaveLoading, setAddressSaveLoading] = useState(false)
  const [addressSelectionError, setAddressSelectionError] = useState('')
  const [guestAddress, setGuestAddress] = useState(null)

  useEffect(() => {
    window.scrollTo(0, 0)
    if (!user && !readToken()) {
      navigate('/login', {
        replace: true,
        state: {
          from: '/checkout',
          message: 'Please log in to continue with your order.',
        },
      })
    }
  }, [user, navigate])

  // Prefill user details
  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        name: prev.name || user.name || '',
        email: prev.email || user.email || '',
        phone: prev.phone || user.phone || '',
      }))
    }
  }, [user])

  // Fetch saved delivery addresses for authenticated customer
  const fetchAddresses = useCallback(async () => {
    if (!user) {
      setLoadingAddresses(false)
      return
    }
    setLoadingAddresses(true)
    setAddressFetchError('')
    try {
      const res = await getAddresses()
      const list = res?.data || []
      setSavedAddresses(list)
      if (list.length > 0) {
        setSelectedAddressId((current) => {
          if (current && list.some((a) => (a.id || a._id) === current)) {
            return current
          }
          const def = list.find((a) => a.isDefault) || list[0]
          return def.id || def._id
        })
      } else {
        setSelectedAddressId(null)
      }
    } catch {
      setAddressFetchError('Unable to load saved addresses.')
    } finally {
      setLoadingAddresses(false)
    }
  }, [user])

  useEffect(() => {
    fetchAddresses()
  }, [fetchAddresses])

  const shipping = form.delivery === 'express' ? EXPRESS : STANDARD
  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items],
  )
  const total = subtotal + shipping

  function setValue(key, value) {
    setForm((current) => ({ ...current, [key]: value }))
    if (errors[key]) setErrors((current) => ({ ...current, [key]: '' }))
  }

  function fullName() {
    return form.name.trim()
  }

  const handleSelectAddress = useCallback(
    (id) => {
      setSelectedAddressId(id)
      setAddressSelectionError('')
      const addr =
        savedAddresses.find((a) => (a.id || a._id) === id) ||
        (guestAddress?.id === id ? guestAddress : null)
      if (addr) {
        setForm((prev) => ({
          ...prev,
          name: prev.name || addr.name || addr.fullName || '',
          phone: prev.phone || addr.phone || '',
        }))
      }
    },
    [savedAddresses, guestAddress],
  )

  function handleAddNewAddress() {
    setEditingAddress(null)
    setAddressFlow('location-picker')
    setAddressSelectionError('')
  }

  function handleEditAddress(addr) {
    setEditingAddress(addr)
    setAddressFlow('form')
    setAddressSelectionError('')
  }

  function handleCancelAddressFlow() {
    setAddressFlow(null)
    setEditingAddress(null)
  }

  async function handleSaveAddress(formData) {
    setAddressSaveLoading(true)
    try {
      const isEditing = Boolean(formData.id)
      const lat = Number.isFinite(Number(formData.latitude)) ? Number(formData.latitude) : null
      const lng = Number.isFinite(Number(formData.longitude)) ? Number(formData.longitude) : null

      if (user && formData.saveForFuture !== false) {
        const payload = {
          label: formData.label || 'Home',
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          house: (formData.house || '').trim(),
          street: (formData.street || '').trim() || (formData.house || '').trim(),
          area: (formData.area || '').trim(),
          landmark: (formData.landmark || '').trim(),
          city: formData.city.trim(),
          state: formData.state,
          pin: formData.pin.trim(),
          latitude: lat,
          longitude: lng,
        }

        let savedAddr
        if (isEditing) {
          const res = await updateAddress(formData.id, payload)
          savedAddr = res?.data
          setSavedAddresses((prev) =>
            prev.map((a) => ((a.id || a._id) === savedAddr.id ? savedAddr : a)),
          )
        } else {
          const res = await createAddress(payload)
          savedAddr = res?.data
          setSavedAddresses((prev) => [savedAddr, ...prev])
        }

        const newId = savedAddr.id || savedAddr._id
        setSelectedAddressId(newId)
        setForm((prev) => ({
          ...prev,
          name: prev.name || savedAddr.name,
          phone: prev.phone || savedAddr.phone,
        }))
      } else {
        const tempAddr = {
          id: formData.id || 'guest-temp-addr',
          label: formData.label || 'Home',
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          house: (formData.house || '').trim(),
          street: (formData.street || '').trim() || (formData.house || '').trim(),
          area: (formData.area || '').trim(),
          landmark: (formData.landmark || '').trim(),
          city: formData.city.trim(),
          state: formData.state,
          pin: formData.pin.trim(),
          country: 'India',
          latitude: lat,
          longitude: lng,
        }
        setGuestAddress(tempAddr)
        setSelectedAddressId(tempAddr.id)
        setForm((prev) => ({
          ...prev,
          name: prev.name || tempAddr.name,
          phone: prev.phone || tempAddr.phone,
        }))
      }

      setAddressFlow(null)
      setEditingAddress(null)
      setAddressSelectionError('')
    } finally {
      setAddressSaveLoading(false)
    }
  }

  async function handleConfirmDelete(id) {
    try {
      await deleteAddress(id)
      const nextList = savedAddresses.filter((a) => (a.id || a._id) !== id)
      setSavedAddresses(nextList)
      setDeleteConfirmId(null)

      if (selectedAddressId === id) {
        if (nextList.length > 0) {
          const nextDef = nextList.find((a) => a.isDefault) || nextList[0]
          setSelectedAddressId(nextDef.id || nextDef._id)
        } else {
          setSelectedAddressId(null)
        }
      }
    } catch (err) {
      console.error('Failed to delete address:', err)
      setDeleteConfirmId(null)
    }
  }

  function validate() {
    const next = {}
    if (!fullName()) next.name = 'Enter your name.'
    if (!emailOk(form.email)) next.email = 'Enter a valid email address.'
    if (!phoneOk(form.phone)) next.phone = 'Enter a 10-digit mobile number.'

    const activeAddress =
      savedAddresses.find((a) => (a.id || a._id) === selectedAddressId) ||
      (guestAddress?.id === selectedAddressId ? guestAddress : null)

    if (!activeAddress) {
      next.address = 'Please select a delivery address to continue.'
      setAddressSelectionError('Please select a delivery address to continue.')
    } else {
      setAddressSelectionError('')
    }

    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handlePay(event) {
    if (event) {
      event.preventDefault?.()
      event.stopPropagation?.()
    }
    if (!validate()) {
      const activeAddress =
        savedAddresses.find((a) => (a.id || a._id) === selectedAddressId) ||
        (guestAddress?.id === selectedAddressId ? guestAddress : null)

      if (!activeAddress) {
        document.getElementById('co-delivery-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      } else {
        const first = document.querySelector('.co-field.is-invalid')
        first?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      return
    }

    const activeAddress =
      savedAddresses.find((a) => (a.id || a._id) === selectedAddressId) ||
      (guestAddress?.id === selectedAddressId ? guestAddress : null)

    if (!activeAddress) {
      setAddressSelectionError('Please select a delivery address to continue.')
      document.getElementById('co-delivery-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    const city = activeAddress.city
    const state = activeAddress.state
    const pin = activeAddress.pin

    setSubmitting(true)
    setSubmitError('')
    try {
      const isSaved = activeAddress.id && activeAddress.id !== 'guest-temp-addr'
      const streetLine = [activeAddress.house, activeAddress.street, activeAddress.area].filter(Boolean).join(', ') || activeAddress.street

      const orderPayload = {
        shippingMethod: form.delivery === 'express' ? 'express' : 'standard',
        ...(isSaved
          ? { addressId: activeAddress.id }
          : {
              shippingAddress: {
                name: activeAddress.name || fullName(),
                phone: activeAddress.phone || form.phone.trim(),
                house: activeAddress.house || '',
                street: activeAddress.street,
                area: activeAddress.area || '',
                landmark: activeAddress.landmark || '',
                city: activeAddress.city,
                state: activeAddress.state,
                pin: activeAddress.pin,
                country: activeAddress.country || 'India',
                latitude: activeAddress.latitude ?? null,
                longitude: activeAddress.longitude ?? null,
              },
            }),
      }

      // 1. Create authoritative SV Hub Order in MongoDB (status: PENDING_PAYMENT)
      const res = await createOrder(orderPayload)
      const orderData = res.data

      // 2. Load official Razorpay Checkout SDK dynamically
      const scriptLoaded = await loadRazorpayScript()
      if (!scriptLoaded || !window.Razorpay) {
        throw new Error('Razorpay Checkout could not be loaded. Please verify your connection.')
      }

      // 3. Request server to create Razorpay Order
      const rzpRes = await createRazorpayOrder(orderData.id)
      const rzpData = rzpRes.data

      // 4. Configure Razorpay Standard Checkout modal
      const options = {
        key: rzpData.keyId,
        amount: rzpData.amount,
        currency: rzpData.currency || 'INR',
        name: 'SV Hub',
        description: `Order ${orderData.orderNumber}`,
        order_id: rzpData.razorpayOrderId,
        prefill: {
          name: rzpData.customer?.name || activeAddress.name || fullName(),
          email: rzpData.customer?.email || form.email.trim(),
          contact: rzpData.customer?.phone || activeAddress.phone || form.phone.trim(),
        },
        theme: {
          color: '#16a34a',
        },
        handler: async function (response) {
          try {
            setSubmitting(true)
            // 5. Server-side signature verification, stock deduction, and order confirmation
            const verifyRes = await verifyRazorpayPayment({
              orderId: orderData.id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            })

            const confirmedOrder = verifyRes.data?.order || orderData

            // 6. Only clear customer cart after verified payment and confirmation
            await clearCart()

            const successState = {
              orderId: confirmedOrder.id || orderData.id,
              orderNumber: confirmedOrder.orderNumber || orderData.orderNumber,
              total: confirmedOrder.totalAmount ?? orderData.totalAmount,
              date: confirmedOrder.createdAt || orderData.createdAt,
              city: `${city}, ${STATE_SHORT[state] || state}`,
              email: confirmedOrder.email || user?.email || form.email.trim(),
              subtotal: confirmedOrder.subtotal ?? orderData.subtotal,
              shipping: confirmedOrder.shippingFee ?? orderData.shippingFee,
              discount: confirmedOrder.discount || 0,
              amount: confirmedOrder.totalAmount ?? orderData.totalAmount,
              status: confirmedOrder.status || 'CONFIRMED',
              paymentStatus: confirmedOrder.paymentStatus || 'SUCCESS',
              addressLines: [streetLine, `${city}, ${state}`, pin],
              address: {
                name: activeAddress.name || fullName(),
                phone: activeAddress.phone || form.phone.trim(),
                lines: [streetLine, `${city}, ${state}`, pin],
              },
              items: (confirmedOrder.items || orderData.items || []).map((item) => ({
                name: item.productName || item.name,
                weight: item.variantLabel || item.weight || '',
                quantity: item.quantity,
                price: item.unitPrice || item.price,
                image: item.image || '',
              })),
            }

            try {
              sessionStorage.setItem('svhub.lastOrder', JSON.stringify(successState))
            } catch {
              /* ignore storage exceptions */
            }

            setPlaced(successState)
            navigate('/order-success', { state: successState, replace: true })
          } catch (verifyErr) {
            setSubmitError(verifyErr.message || 'Payment verification failed. Please try again.')
            window.scrollTo({ top: 0, behavior: 'smooth' })
          } finally {
            setSubmitting(false)
          }
        },
        modal: {
          ondismiss: async function () {
            setSubmitting(false)
            setSubmitError('Payment was cancelled. Your items are still safely saved in your cart.')
            await recordPaymentFailure({
              orderId: orderData.id,
              razorpay_order_id: rzpData.razorpayOrderId,
              errorReason: 'Customer closed payment checkout modal',
            }).catch(() => {})
          },
        },
      }

      const rzpInstance = new window.Razorpay(options)
      rzpInstance.on('payment.failed', async function (failedResponse) {
        setSubmitting(false)
        const reason = failedResponse.error?.description || failedResponse.error?.reason || 'Payment failed'
        setSubmitError(`Payment failed: ${reason}. Your items remain in your cart.`)
        await recordPaymentFailure({
          orderId: orderData.id,
          razorpay_order_id: rzpData.razorpayOrderId,
          errorReason: reason,
        }).catch(() => {})
      })

      rzpInstance.open()
    } catch (err) {
      setSubmitError(err.message || 'Could not initiate payment. Please try again.')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      setSubmitting(false)
    }
  }

  if (!placed && cartLoading && items.length === 0) {
    return (
      <div className="co">
        <header className="co-top">
          <Link to="/cart" className="co-back">
            <IconBack />
            Back to cart
          </Link>
          <Logo compact />
          <span className="co-top__spacer" aria-hidden="true" />
        </header>
        <main className="co-main" style={{ display: 'grid', placeItems: 'center', minHeight: '50vh' }}>
          <div className="co-loc-search-spinner" style={{ width: '36px', height: '36px' }} />
        </main>
      </div>
    )
  }

  if (!placed && !cartLoading && items.length === 0) {
    return <Navigate to="/cart" replace />
  }

  if (placed) return null

  const summary = (
    <aside className="co-summary">
      <h2>Order Summary</h2>
      <ul className="co-lines">
        {items.map((item) => (
          <li key={`${item.id}::${item.weight ?? ''}`}>
            <div className="co-lines__media">
              <img src={item.image} alt="" />
            </div>
            <div className="co-lines__copy">
              <p className="co-lines__name">{item.name}</p>
              <p className="co-lines__meta">
                Qty: {item.quantity}
                {item.weight ? ` × ${item.weight}` : ''}
              </p>
              <p className="co-lines__price">{formatPrice(item.price * item.quantity)}</p>
            </div>
          </li>
        ))}
      </ul>
      <ul className="co-lines co-lines--plain">
        {items.map((item) => (
          <li key={`plain-${item.id}::${item.weight ?? ''}`}>
            <span>
              {item.name}
              {item.weight ? ` (${item.weight})` : ''} × {item.quantity}
            </span>
            <span>{formatPrice(item.price * item.quantity)}</span>
          </li>
        ))}
      </ul>
      <dl className="co-totals">
        <div>
          <dt>Subtotal</dt>
          <dd>{formatPrice(subtotal)}</dd>
        </div>
        <div>
          <dt>Shipping</dt>
          <dd>{formatPrice(shipping)}</dd>
        </div>
        <div className="co-totals__grand">
          <dt>Total</dt>
          <dd>{formatPrice(total)}</dd>
        </div>
      </dl>
      <button
        type="button"
        onClick={handlePay}
        className="co-pay co-pay--desk"
        disabled={submitting}
        aria-busy={submitting}
      >
        <IconLock />
        {submitting ? 'Placing order…' : 'Pay Securely'}
      </button>
      <p className="co-ssl">
        <IconVerified /> 256-bit SSL Encryption
      </p>
    </aside>
  )

  return (
    <div className="co">
      <header className="co-top">
        <Link to="/cart" className="co-back">
          <IconBack />
          Back to cart
        </Link>
        <Logo compact />
        <span className="co-top__spacer" aria-hidden="true" />
      </header>

      <main className="co-main">
        <div className="co-intro">
          <h1>
            <span className="co-step__desk">Secure Checkout</span>
            <span className="co-step__mob">Checkout</span>
          </h1>
          <p className="co-intro__mob">Complete your order securely.</p>
        </div>

        <form id="checkout-form" className="co-grid" onSubmit={handlePay} noValidate>
          <div className="co-form">
            <section className="co-card">
              <StepHead step="1" title="Customer Information" mobileTitle="Customer Info" />
              <div className="co-fields">
                <Field id="co-name" label="Full Name" error={errors.name} className="is-wide">
                  <input
                    id="co-name"
                    name="name"
                    autoComplete="name"
                    placeholder="Full Name"
                    value={form.name}
                    onChange={(event) => setValue('name', event.target.value)}
                  />
                </Field>
                <Field id="co-email" label="Email Address" error={errors.email} className="is-mobile-wide">
                  <input
                    id="co-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="Email Address"
                    value={form.email}
                    onChange={(event) => setValue('email', event.target.value)}
                  />
                </Field>
                <Field id="co-phone" label="Phone Number" error={errors.phone} className="is-mobile-wide">
                  <input
                    id="co-phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    inputMode="tel"
                    placeholder="Phone Number"
                    value={form.phone}
                    onChange={(event) => setValue('phone', event.target.value)}
                  />
                </Field>
              </div>
            </section>

            <section className="co-card" id="co-delivery-section">
              <StepHead step="2" title="Delivery Address" />

              {addressSelectionError && (
                <p className="co-addr-select-error" role="alert">
                  {addressSelectionError}
                </p>
              )}

              {loadingAddresses ? (
                <div className="co-addr-skeletons" aria-label="Loading saved addresses">
                  <div className="co-addr-skeleton" />
                  <div className="co-addr-skeleton" />
                </div>
              ) : addressFetchError ? (
                <div className="co-addr-error-state" role="alert">
                  <p>{addressFetchError}</p>
                  <button type="button" className="co-btn co-btn--outline" onClick={fetchAddresses}>
                    Try Again
                  </button>
                </div>
              ) : addressFlow === 'location-picker' ? (
                <LocationPicker
                  initialLocation={editingAddress}
                  onSave={handleSaveAddress}
                  onCancel={handleCancelAddressFlow}
                  saving={addressSaveLoading}
                  isAuthenticated={Boolean(user)}
                  initialUser={user}
                  onEnterManually={() => {
                    setEditingAddress(null)
                    setAddressFlow('form')
                  }}
                />
              ) : addressFlow === 'form' ? (
                <CheckoutAddressForm
                  initialData={editingAddress}
                  onSave={handleSaveAddress}
                  onCancel={handleCancelAddressFlow}
                  onChangeLocation={() => setAddressFlow('location-picker')}
                  saving={addressSaveLoading}
                  isAuthenticated={Boolean(user)}
                />
              ) : savedAddresses.length > 0 || guestAddress ? (
                <div className="co-addr-section-content">
                  <p className="co-section-sub">Choose where you want your order delivered.</p>
                  <div className="co-addr-grid" role="radiogroup" aria-label="Delivery addresses">
                    {savedAddresses.map((addr) => {
                      const addrId = addr.id || addr._id
                      return (
                        <CheckoutAddressCard
                          key={addrId}
                          address={addr}
                          selected={selectedAddressId === addrId}
                          onSelect={() => handleSelectAddress(addrId)}
                          onEdit={() => handleEditAddress(addr)}
                          onDelete={() => setDeleteConfirmId(addrId)}
                          isDeleting={deleteConfirmId === addrId}
                          onConfirmDelete={() => handleConfirmDelete(addrId)}
                          onCancelDelete={() => setDeleteConfirmId(null)}
                        />
                      )
                    })}
                    {guestAddress && !savedAddresses.some((a) => (a.id || a._id) === guestAddress.id) && (
                      <CheckoutAddressCard
                        key={guestAddress.id}
                        address={guestAddress}
                        selected={selectedAddressId === guestAddress.id}
                        onSelect={() => handleSelectAddress(guestAddress.id)}
                        onEdit={() => handleEditAddress(guestAddress)}
                        onDelete={() => {
                          setGuestAddress(null)
                          setSelectedAddressId(null)
                        }}
                        isDeleting={false}
                        onConfirmDelete={() => {}}
                        onCancelDelete={() => {}}
                      />
                    )}
                  </div>
                  <button
                    type="button"
                    className="co-add-addr-btn"
                    onClick={handleAddNewAddress}
                  >
                    + ADD NEW ADDRESS
                  </button>
                </div>
              ) : (
                <div className="co-addr-empty">
                  <p className="co-addr-empty__desc">No saved delivery address yet.</p>
                  <button
                    type="button"
                    className="co-btn co-btn--outline co-add-first-addr-btn"
                    onClick={handleAddNewAddress}
                  >
                    + ADD DELIVERY ADDRESS
                  </button>
                </div>
              )}
            </section>

            <section className="co-card co-card--delivery">
              <StepHead step="3" title="Delivery Options" />
              <div className="co-ship">
                <label className={`co-ship__opt${form.delivery === 'standard' ? ' is-on' : ''}`}>
                  <input
                    type="radio"
                    name="delivery"
                    value="standard"
                    checked={form.delivery === 'standard'}
                    onChange={() => setValue('delivery', 'standard')}
                  />
                  <span>
                    <span className="co-ship__row">
                      <strong>Standard Delivery</strong>
                      <b>{formatPrice(STANDARD)}</b>
                    </span>
                    <em>Delivery in 3–5 business days</em>
                  </span>
                </label>
                <label className={`co-ship__opt${form.delivery === 'express' ? ' is-on' : ''}`}>
                  <input
                    type="radio"
                    name="delivery"
                    value="express"
                    checked={form.delivery === 'express'}
                    onChange={() => setValue('delivery', 'express')}
                  />
                  <span>
                    <span className="co-ship__row">
                      <strong>Express Delivery</strong>
                      <b>{formatPrice(EXPRESS)}</b>
                    </span>
                    <em>Delivery in 1–2 business days</em>
                  </span>
                </label>
              </div>
            </section>

            <section className="co-card">
              <StepHead step="4" mobileStep="3" title="Payment" />

              <div className="co-razor">
                <IconShield />
                <h3>Secure Payment via Razorpay</h3>
                <p>
                  You will be redirected to Razorpay’s secure payment gateway to complete your purchase using UPI,
                  Cards, or Netbanking.
                </p>
              </div>

              <div className="co-methods">
                <button
                  type="button"
                  className={`co-method${form.payMethod === 'card' ? ' is-on' : ''}`}
                  onClick={() => setValue('payMethod', 'card')}
                >
                  <span>
                    <IconCard />
                    Credit Card
                  </span>
                  <span className="co-radio" aria-hidden="true" />
                </button>
                {form.payMethod === 'card' ? (
                  <div className="co-card-fields">
                    <Field id="co-ccn" error={errors.cardNumber}>
                      <input
                        id="co-ccn"
                        name="cardNumber"
                        inputMode="numeric"
                        autoComplete="cc-number"
                        placeholder="Card Number"
                        value={form.cardNumber}
                        onChange={(event) =>
                          setValue('cardNumber', event.target.value.replace(/[^\d ]/g, '').slice(0, 19))
                        }
                      />
                    </Field>
                    <div className="co-card-row">
                      <Field id="co-exp" error={errors.cardExpiry}>
                        <input
                          id="co-exp"
                          name="cardExpiry"
                          autoComplete="cc-exp"
                          placeholder="MM / YY"
                          value={form.cardExpiry}
                          onChange={(event) => setValue('cardExpiry', event.target.value.slice(0, 7))}
                        />
                      </Field>
                      <Field id="co-cvc" error={errors.cardCvc}>
                        <input
                          id="co-cvc"
                          name="cardCvc"
                          inputMode="numeric"
                          autoComplete="cc-csc"
                          placeholder="CVC"
                          value={form.cardCvc}
                          onChange={(event) => setValue('cardCvc', event.target.value.replace(/\D/g, '').slice(0, 4))}
                        />
                      </Field>
                    </div>
                    <Field id="co-ccname" error={errors.cardName}>
                      <input
                        id="co-ccname"
                        name="cardName"
                        autoComplete="cc-name"
                        placeholder="Name on Card"
                        value={form.cardName}
                        onChange={(event) => setValue('cardName', event.target.value)}
                      />
                    </Field>
                  </div>
                ) : null}
                <button
                  type="button"
                  className={`co-method${form.payMethod === 'upi' ? ' is-on' : ''}`}
                  onClick={() => setValue('payMethod', 'upi')}
                >
                  <span>
                    <IconWallet />
                    UPI / Digital Wallet
                  </span>
                  <span className="co-radio" aria-hidden="true" />
                </button>
              </div>
            </section>
          </div>

          {summary}
        </form>
      </main>

      <div className="co-dock">
        {submitError ? (
          <p className="co-error" role="alert" style={{ color: 'var(--state-error)', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
            {submitError}
          </p>
        ) : null}
        <button
          type="button"
          onClick={handlePay}
          className="co-pay"
          disabled={submitting}
          aria-busy={submitting}
        >
          <IconLock />
          {submitting ? 'Placing order…' : `Pay Securely — ${formatPrice(total)}`}
        </button>
      </div>
    </div>
  )
}

export default Checkout

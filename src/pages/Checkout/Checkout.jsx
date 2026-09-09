import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useCart } from '../../context/CartContext.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { createOrder } from '../../api/orders.js'
import { formatPrice } from '../../utils/money.js'
import './Checkout.css'

const STANDARD = 40
const EXPRESS = 120
const STATES = ['Tamil Nadu', 'Kerala', 'Karnataka', 'Andhra Pradesh', 'Telangana', 'Puducherry']
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
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  street: '',
  apt: '',
  city: '',
  state: '',
  pin: '',
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

function IconError() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 8v4.5M12 16.2v.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
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

function pinOk(value) {
  return /^\d{6}$/.test(value.trim())
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
  const { items, clearCart } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [pinTouched, setPinTouched] = useState(false)
  const [placed, setPlaced] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

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
    return form.name.trim() || `${form.firstName.trim()} ${form.lastName.trim()}`.trim()
  }

  function validate() {
    const next = {}
    if (!fullName()) next.name = 'Enter your name.'
    if (!form.firstName.trim() && !form.name.trim()) next.firstName = 'Required'
    if (!form.lastName.trim() && !form.name.trim()) next.lastName = 'Required'
    if (!emailOk(form.email)) next.email = 'Enter a valid email address.'
    if (!phoneOk(form.phone)) next.phone = 'Enter a 10-digit mobile number.'
    if (!form.street.trim()) next.street = 'Enter your street address.'
    if (!form.city.trim()) next.city = 'Enter your city.'
    if (!form.state) next.state = 'Select your state.'
    if (!pinOk(form.pin)) next.pin = 'Please enter a valid 6-digit numeric PIN code.'
    setPinTouched(true)
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handlePay(event) {
    event.preventDefault()
    if (!validate()) {
      const first = document.querySelector('.co-field.is-invalid')
      first?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    const street = [form.street.trim(), form.apt.trim()].filter(Boolean).join(', ')
    const city = form.city.trim()
    const shippingAddress = {
      name: fullName(),
      phone: form.phone.trim(),
      street,
      city,
      state: form.state,
      pin: form.pin.trim(),
      country: 'India',
    }

    setSubmitting(true)
    setSubmitError('')
    try {
      const res = await createOrder({
        shippingAddress,
        shippingMethod: form.delivery === 'express' ? 'express' : 'standard',
      })
      const orderData = res.data
      const successState = {
        orderNumber: orderData.orderNumber,
        total: orderData.totalAmount,
        date: orderData.createdAt,
        city: `${city}, ${STATE_SHORT[form.state] || form.state}`,
        email: user?.email || form.email.trim(),
        subtotal: orderData.subtotal,
        shipping: orderData.shippingFee,
        discount: orderData.discount || 0,
        amount: orderData.totalAmount,
        status: 'Pending',
        paymentStatus: 'Pending',
        addressLines: [street, `${city}, ${form.state}`, form.pin.trim()],
        address: {
          name: fullName(),
          phone: form.phone.trim(),
          lines: [street, `${city}, ${form.state}`, form.pin.trim()],
        },
        items: (orderData.items || []).map((item) => ({
          name: item.productName,
          weight: item.variantLabel || item.weight || '',
          quantity: item.quantity,
          price: item.unitPrice,
          image: item.image || '',
        })),
      }

      try {
        sessionStorage.setItem('svhub.lastOrder', JSON.stringify(successState))
      } catch {
        /* ignore quota / private mode */
      }

      setPlaced(successState)
      await clearCart()
      navigate('/order-success', { state: successState, replace: true })
    } catch (err) {
      setSubmitError(err.message || 'Could not place order. Please try again.')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setSubmitting(false)
    }
  }

  const pinError = pinTouched && form.pin !== '' && !pinOk(form.pin) ? 'Please enter a valid 6-digit numeric PIN code.' : errors.pin

  if (!placed && items.length === 0) {
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
      <button type="submit" form="checkout-form" className="co-pay co-pay--desk">
        <IconLock />
        Pay Securely
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
        <Link to="/" className="co-brand">
          SV Hub
        </Link>
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
                <Field id="co-name" label="Full Name" error={errors.name} className="is-wide is-desk">
                  <input
                    id="co-name"
                    name="name"
                    autoComplete="name"
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

            <section className="co-card">
              <StepHead step="2" title="Delivery Address" />
              <div className="co-fields">
                <Field id="co-first" label="First Name" error={errors.firstName} className="is-half is-mob">
                  <input
                    id="co-first"
                    name="firstName"
                    autoComplete="given-name"
                    placeholder="First Name"
                    value={form.firstName}
                    onChange={(event) => setValue('firstName', event.target.value)}
                  />
                </Field>
                <Field id="co-last" label="Last Name" error={errors.lastName} className="is-half is-mob">
                  <input
                    id="co-last"
                    name="lastName"
                    autoComplete="family-name"
                    placeholder="Last Name"
                    value={form.lastName}
                    onChange={(event) => setValue('lastName', event.target.value)}
                  />
                </Field>
                <Field id="co-street" label="Street Address" error={errors.street} className="is-wide">
                  <input
                    id="co-street"
                    name="street"
                    autoComplete="street-address"
                    placeholder="Street Address"
                    value={form.street}
                    onChange={(event) => setValue('street', event.target.value)}
                  />
                </Field>
                <Field id="co-apt" label="Apartment" className="is-wide is-mob">
                  <input
                    id="co-apt"
                    name="apt"
                    autoComplete="address-line2"
                    placeholder="Apt, Suite, etc. (Optional)"
                    value={form.apt}
                    onChange={(event) => setValue('apt', event.target.value)}
                  />
                </Field>
                <Field id="co-city" label="City" error={errors.city}>
                  <input
                    id="co-city"
                    name="city"
                    autoComplete="address-level2"
                    placeholder="City"
                    value={form.city}
                    onChange={(event) => setValue('city', event.target.value)}
                  />
                </Field>
                <Field id="co-pin-mob" label="Postal Code" error={pinError} className="is-mob">
                  <input
                    id="co-pin-mob"
                    name="postal-mobile"
                    inputMode="numeric"
                    autoComplete="postal-code"
                    placeholder="Postal Code"
                    maxLength={6}
                    value={form.pin}
                    onBlur={() => setPinTouched(true)}
                    onChange={(event) => {
                      setPinTouched(true)
                      setValue('pin', event.target.value.replace(/\D/g, '').slice(0, 6))
                    }}
                  />
                </Field>
                <Field id="co-state" label="State" error={errors.state} className="is-mobile-wide">
                  <select
                    id="co-state"
                    name="state"
                    autoComplete="address-level1"
                    value={form.state}
                    onChange={(event) => setValue('state', event.target.value)}
                  >
                    <option value="">Select state</option>
                    {STATES.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field id="co-pin" label="PIN Code" error={pinError} className="is-wide is-desk">
                  <div className="co-pin">
                    <input
                      id="co-pin"
                      name="postal"
                      inputMode="numeric"
                      autoComplete="postal-code"
                      maxLength={6}
                      value={form.pin}
                      onBlur={() => setPinTouched(true)}
                      onChange={(event) => {
                        setPinTouched(true)
                        setValue('pin', event.target.value.replace(/\D/g, '').slice(0, 6))
                      }}
                    />
                    {pinError ? (
                      <span className="co-pin__icon" aria-hidden="true">
                        <IconError />
                      </span>
                    ) : null}
                  </div>
                </Field>
              </div>
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
        <button type="submit" form="checkout-form" className="co-pay" disabled={submitting} aria-busy={submitting}>
          <IconLock />
          {submitting ? 'Placing order…' : `Pay Securely — ${formatPrice(total)}`}
        </button>
      </div>
    </div>
  )
}

export default Checkout

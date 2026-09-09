import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import AuthField from '../../components/auth/AuthField.jsx'
import '../../components/auth/Auth.css'
import Button from '../../components/ui/Button.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from '../../api/addresses.js'
import { nameError, phoneError } from '../../utils/authValidation.js'
import AccountLoginPrompt from './AccountLoginPrompt.jsx'
import { EmptyState } from './OrderList.jsx'
import './Addresses.css'

const STATES = ['Tamil Nadu', 'Kerala', 'Karnataka', 'Andhra Pradesh', 'Telangana', 'Puducherry']

const emptyForm = {
  id: '',
  name: '',
  phone: '',
  street: '',
  city: '',
  state: '',
  pin: '',
}

function streetError(value = '') {
  return value.trim() ? '' : 'Enter your address.'
}

function cityError(value = '') {
  return value.trim() ? '' : 'Enter your city.'
}

function stateError(value = '') {
  return value.trim() ? '' : 'Select your state.'
}

function pinError(value = '') {
  const pin = value.trim()
  if (!pin) return 'Enter your PIN code.'
  if (!/^\d{6}$/.test(pin)) return 'Enter a valid 6-digit PIN code.'
  return ''
}

function firstErrorId(errors) {
  const order = [
    ['name', 'address-name'],
    ['phone', 'address-phone'],
    ['street', 'address-street'],
    ['city', 'address-city'],
    ['state', 'address-state'],
    ['pin', 'address-pin'],
  ]
  return order.find(([key]) => errors[key])?.[1] || ''
}

function AddressSheet({ open, title, onClose, children }) {
  const panelRef = useRef(null)
  const closeRef = useRef(null)
  const lastFocus = useRef(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (!open) return undefined

    lastFocus.current = document.activeElement
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const frame = window.requestAnimationFrame(() => {
      const name = panelRef.current?.querySelector('#address-name')
      if (name instanceof HTMLElement) name.focus()
      else closeRef.current?.focus()
    })

    function onKey(event) {
      if (event.key === 'Escape') onCloseRef.current()
    }

    window.addEventListener('keydown', onKey)
    return () => {
      window.cancelAnimationFrame(frame)
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKey)
      if (lastFocus.current instanceof HTMLElement) lastFocus.current.focus()
    }
  }, [open])

  if (!open) return null

  return createPortal(
    <div className="account-sheet" role="presentation">
      <button type="button" className="account-sheet__backdrop" aria-label="Close" onClick={onClose} />
      <div
        ref={panelRef}
        className="account-sheet__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="address-sheet-title"
      >
        <div className="account-sheet__handle" aria-hidden="true" />
        <header className="account-sheet__header">
          <div>
            <p className="account-kicker">Delivery</p>
            <h2 id="address-sheet-title">{title}</h2>
          </div>
          <button ref={closeRef} type="button" className="account-sheet__close" onClick={onClose}>
            Close
          </button>
        </header>
        {children}
      </div>
    </div>,
    document.body,
  )
}

function AddressCard({ address, pendingDelete, onEdit, onDelete, onConfirmDelete, onCancelDelete, onSetDefault }) {
  return (
    <article className={`address-card${address.isDefault ? ' is-default' : ''}`}>
      <header className="address-card__top">
        {address.isDefault ? (
          <p className="address-card__badge">Default address</p>
        ) : (
          <p className="address-card__label">{address.label || 'Saved address'}</p>
        )}
      </header>

      <dl className="address-card__facts">
        <div>
          <dt>Name</dt>
          <dd>{address.name || '—'}</dd>
        </div>
        <div>
          <dt>Phone</dt>
          <dd>{address.phone || '—'}</dd>
        </div>
        <div className="is-wide">
          <dt>Address</dt>
          <dd>{address.street || address.lines?.[0] || '—'}</dd>
        </div>
        <div>
          <dt>City</dt>
          <dd>{address.city || '—'}</dd>
        </div>
        <div>
          <dt>State</dt>
          <dd>{address.state || '—'}</dd>
        </div>
        <div>
          <dt>PIN code</dt>
          <dd>{address.pin || '—'}</dd>
        </div>
      </dl>

      {pendingDelete ? (
        <div className="address-card__confirm">
          <p>Remove this address?</p>
          <div className="address-card__actions">
            <button type="button" className="account-text-link" onClick={onConfirmDelete}>
              Yes, delete
            </button>
            <button type="button" className="account-text-link account-text-link--quiet" onClick={onCancelDelete}>
              Keep it
            </button>
          </div>
        </div>
      ) : (
        <div className="address-card__actions">
          <button type="button" className="account-text-link" onClick={onEdit}>
            Edit
          </button>
          <button type="button" className="account-text-link account-text-link--quiet" onClick={onDelete}>
            Delete
          </button>
          {address.isDefault ? null : (
            <button type="button" className="account-text-link" onClick={onSetDefault}>
              Set as default
            </button>
          )}
        </div>
      )}
    </article>
  )
}

function Addresses() {
  const { user } = useAuth()
  const [addresses, setAddresses] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [apiError, setApiError] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [touched, setTouched] = useState({})
  const [open, setOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState('')

  // Load addresses from backend
  useEffect(() => {
    if (!user) return
    setLoading(true)
    getAddresses()
      .then((res) => {
        const list = (res.data || []).map((a) => ({
          id: a.id,
          name: a.name,
          phone: a.phone,
          street: a.street,
          city: a.city,
          state: a.state,
          pin: a.pin,
          isDefault: a.isDefault,
          label: a.label || '',
        }))
        setAddresses(list.sort((a, b) => Number(b.isDefault) - Number(a.isDefault)))
      })
      .catch((err) => setApiError(err.message || 'Could not load addresses.'))
      .finally(() => setLoading(false))
  }, [user])

  function closeSheet() {
    setOpen(false)
    setTouched({})
    setForm(emptyForm)
  }

  function startAdd() {
    setForm({
      ...emptyForm,
      name: user?.name || '',
      phone: user?.phone || '',
    })
    setTouched({})
    setPendingDelete('')
    setOpen(true)
  }

  function startEdit(address) {
    setForm({
      id: address.id,
      name: address.name || '',
      phone: address.phone || '',
      street: address.street || '',
      city: address.city || '',
      state: address.state || '',
      pin: address.pin || '',
    })
    setTouched({})
    setPendingDelete('')
    setOpen(true)
  }

  function setField(key, value) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function blur(key) {
    setTouched((current) => ({ ...current, [key]: true }))
  }

  const errors = {
    name: touched.name ? nameError(form.name) : '',
    phone: touched.phone ? phoneError(form.phone) : '',
    street: touched.street ? streetError(form.street) : '',
    city: touched.city ? cityError(form.city) : '',
    state: touched.state ? stateError(form.state) : '',
    pin: touched.pin ? pinError(form.pin) : '',
  }

  function validate() {
    return {
      name: nameError(form.name),
      phone: phoneError(form.phone),
      street: streetError(form.street),
      city: cityError(form.city),
      state: stateError(form.state),
      pin: pinError(form.pin),
    }
  }

  async function handleSave(event) {
    event.preventDefault()
    const next = validate()
    setTouched({
      name: true,
      phone: true,
      street: true,
      city: true,
      state: true,
      pin: true,
    })
    if (Object.values(next).some(Boolean)) {
      window.requestAnimationFrame(() => {
        document.getElementById(firstErrorId(next))?.focus()
      })
      return
    }

    setSaving(true)
    setApiError('')
    try {
      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        street: form.street.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        pin: form.pin.trim(),
      }
      if (form.id) {
        await updateAddress(form.id, payload)
      } else {
        await createAddress(payload)
      }
      // Reload addresses
      const res = await getAddresses()
      const list = (res.data || []).map((a) => ({
        id: a.id,
        name: a.name,
        phone: a.phone,
        street: a.street,
        city: a.city,
        state: a.state,
        pin: a.pin,
        isDefault: a.isDefault,
        label: a.label || '',
      }))
      setAddresses(list.sort((a, b) => Number(b.isDefault) - Number(a.isDefault)))
      closeSheet()
    } catch (err) {
      setApiError(err.message || 'Could not save address.')
    } finally {
      setSaving(false)
    }
  }

  async function handleRemove(addressId) {
    try {
      await deleteAddress(addressId)
      setAddresses((prev) => prev.filter((a) => a.id !== addressId))
    } catch (err) {
      setApiError(err.message || 'Could not delete address.')
    }
    setPendingDelete('')
  }

  async function handleDefault(addressId) {
    try {
      await setDefaultAddress(addressId)
      setAddresses((prev) =>
        prev
          .map((a) => ({ ...a, isDefault: a.id === addressId }))
          .sort((a, b) => Number(b.isDefault) - Number(a.isDefault)),
      )
    } catch (err) {
      setApiError(err.message || 'Could not update default.')
    }
  }

  if (!user) {
    return (
      <div className="account-panel">
        <AccountLoginPrompt
          title="Log in to manage addresses"
          copy="Sign in to save delivery addresses for a smoother next order."
        />
      </div>
    )
  }

  return (
    <div className="account-panel address-page">
      <section className="account-section" aria-labelledby="addresses-heading">
        <p className="account-kicker">Delivery</p>
        <div className="address-page__head">
          <h2 id="addresses-heading">Your Addresses</h2>
          <Button type="button" variant="primary" size="md" onClick={startAdd}>
            Add new address
          </Button>
        </div>
        <p className="address-page__lede">Keep a default address ready so checkout stays simple.</p>

        {apiError ? <p className="orders__error" role="alert">{apiError}</p> : null}
        {loading ? (
          <p className="od-note" aria-busy="true">Loading addresses…</p>
        ) : addresses.length ? (
          <ul className="address-cards">
            {addresses.map((address) => (
              <li key={address.id}>
                <AddressCard
                  address={address}
                  pendingDelete={pendingDelete === address.id}
                  onEdit={() => startEdit(address)}
                  onDelete={() => setPendingDelete(address.id)}
                  onConfirmDelete={() => handleRemove(address.id)}
                  onCancelDelete={() => setPendingDelete('')}
                  onSetDefault={() => handleDefault(address.id)}
                />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title="No saved addresses"
            copy="Save an address for a smoother next order."
            action="Add new address"
            onAction={startAdd}
          />
        )}
      </section>

      <AddressSheet open={open} title={form.id ? 'Edit address' : 'New address'} onClose={closeSheet}>
        <form className="address-form" onSubmit={handleSave} noValidate>
          <AuthField
            id="address-name"
            label="Name"
            type="text"
            name="name"
            autoComplete="name"
            placeholder="Recipient name"
            value={form.name}
            error={errors.name}
            onChange={(event) => setField('name', event.target.value)}
            onBlur={() => blur('name')}
          />
          <AuthField
            id="address-phone"
            label="Phone"
            type="tel"
            name="phone"
            autoComplete="tel"
            inputMode="tel"
            placeholder="10-digit mobile number"
            value={form.phone}
            error={errors.phone}
            onChange={(event) => setField('phone', event.target.value)}
            onBlur={() => blur('phone')}
          />
          <AuthField
            id="address-street"
            label="Address"
            type="text"
            name="street"
            autoComplete="street-address"
            placeholder="House number and street"
            value={form.street}
            error={errors.street}
            onChange={(event) => setField('street', event.target.value)}
            onBlur={() => blur('street')}
          />
          <div className="address-form__split">
            <AuthField
              id="address-city"
              label="City"
              type="text"
              name="city"
              autoComplete="address-level2"
              placeholder="City"
              value={form.city}
              error={errors.city}
              onChange={(event) => setField('city', event.target.value)}
              onBlur={() => blur('city')}
            />
            <div className={`auth-field${errors.state ? ' is-invalid' : ''}`}>
              <label className="auth-field__label" htmlFor="address-state">
                State
              </label>
              <div className="auth-field__control">
                <select
                  id="address-state"
                  name="state"
                  autoComplete="address-level1"
                  value={form.state}
                  aria-invalid={Boolean(errors.state)}
                  aria-describedby={errors.state ? 'address-state-error' : undefined}
                  onChange={(event) => setField('state', event.target.value)}
                  onBlur={() => blur('state')}
                >
                  <option value="">Select state</option>
                  {STATES.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </div>
              {errors.state ? (
                <p id="address-state-error" className="auth-field__error" role="alert">
                  {errors.state}
                </p>
              ) : null}
            </div>
            <AuthField
              id="address-pin"
              label="PIN code"
              type="text"
              name="postal-code"
              autoComplete="postal-code"
              inputMode="numeric"
              maxLength={6}
              placeholder="6-digit PIN"
              value={form.pin}
              error={errors.pin}
              onChange={(event) => setField('pin', event.target.value.replace(/\D/g, '').slice(0, 6))}
              onBlur={() => blur('pin')}
            />
          </div>
          <div className="address-form__actions">
            <Button type="submit" variant="primary" size="md">
              Save address
            </Button>
            <button type="button" className="account-text-link account-text-link--quiet" onClick={closeSheet}>
              Cancel
            </button>
          </div>
        </form>
      </AddressSheet>
    </div>
  )
}

export default Addresses

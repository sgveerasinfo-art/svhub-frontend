import { useState } from 'react'
import './Checkout.css'

const STATES = [
  'Tamil Nadu',
  'Kerala',
  'Karnataka',
  'Andhra Pradesh',
  'Telangana',
  'Puducherry',
  'Maharashtra',
  'Delhi',
  'Gujarat',
  'Rajasthan',
  'West Bengal',
  'Goa',
]

function phoneOk(value = '') {
  const digits = value.replace(/\D/g, '')
  return digits.length === 10 || (digits.length === 12 && digits.startsWith('91'))
}

function pinOk(value = '') {
  return /^\d{6}$/.test(value.trim())
}

function IconHome() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m3 9.5 9-7 9 7v10a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 19.5v-10Z" stroke="currentColor" strokeWidth="1.6" />
      <path d="M9 21v-6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v6" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}

function IconWork() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="7" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 12v2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function IconPin() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8Z" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}

function IconMap() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M8 2v16M16 6v16" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}

export default function CheckoutAddressForm({
  initialData,
  onSave,
  onCancel,
  onChangeLocation,
  saving = false,
  isAuthenticated = false,
}) {
  const [formData, setFormData] = useState({
    name: initialData?.name || initialData?.fullName || '',
    phone: initialData?.phone ? initialData.phone.replace(/^(\+91|91)/, '').trim() : '',
    house: initialData?.house || '',
    street: initialData?.street || initialData?.addressLine1 || '',
    area: initialData?.area || '',
    landmark: initialData?.landmark || initialData?.apt || '',
    city: initialData?.city || '',
    state: initialData?.state || '',
    pin: initialData?.pin || initialData?.postalCode || '',
    label: initialData?.label || 'Home',
    latitude: initialData?.latitude ?? null,
    longitude: initialData?.longitude ?? null,
    saveForFuture: isAuthenticated,
  })

  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState('')

  function handleChange(field, value) {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  function validate() {
    const errs = {}
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      errs.name = 'Please enter a valid recipient name.'
    }
    if (!phoneOk(formData.phone)) {
      errs.phone = 'Please enter a valid 10-digit mobile number.'
    }
    if (!formData.house.trim()) {
      errs.house = 'House / Flat / Building number is required.'
    }
    if (!formData.city.trim()) {
      errs.city = 'Please enter your city.'
    }
    if (!formData.state) {
      errs.state = 'Please select your state.'
    }
    if (!pinOk(formData.pin)) {
      errs.pin = 'Please enter a valid 6-digit PIN code.'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e) {
    if (e) {
      e.preventDefault?.()
      e.stopPropagation?.()
    }
    if (!validate()) {
      const firstInvalid = document.querySelector('.co-addr-form .is-invalid')
      firstInvalid?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    setApiError('')
    try {
      await onSave({
        ...formData,
        id: initialData?.id || initialData?._id,
        // Composite street if needed for backward compatibility
        street: formData.street.trim() || formData.house.trim(),
      })
    } catch (err) {
      setApiError(err?.message || 'Unable to save address. Please try again.')
    }
  }

  const isEditing = Boolean(initialData?.id || initialData?._id)
  const hasCoordinates =
    Number.isFinite(Number(formData.latitude)) && Number.isFinite(Number(formData.longitude))

  return (
    <div
      className="co-addr-form"
      onKeyDown={(e) => {
        if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
          e.preventDefault()
          handleSubmit(e)
        }
      }}
    >
      <div className="co-addr-form__header">
        <h4>{isEditing ? 'Edit Address' : 'Address Details'}</h4>
        <p className="co-addr-form__sub">
          {isEditing
            ? 'Update your delivery information below.'
            : 'Review and complete your delivery details below. Every field can be edited.'}
        </p>
      </div>

      {/* Linked map location indicator */}
      {hasCoordinates && (
        <div className="co-addr-map-linked">
          <div className="co-addr-map-linked__info">
            <IconMap />
            <span>
              Pinned on map: {Number(formData.latitude).toFixed(4)}, {Number(formData.longitude).toFixed(4)}
            </span>
          </div>
          {onChangeLocation && (
            <button
              type="button"
              className="co-addr-map-linked__btn"
              onClick={onChangeLocation}
            >
              Adjust on map
            </button>
          )}
        </div>
      )}

      {apiError && (
        <div className="co-addr-form__alert" role="alert">
          {apiError}
        </div>
      )}

      {/* Address Type Badges */}
      <div className="co-addr-form__type-group">
        <label className="co-addr-form__label">Address Type</label>
        <div className="co-addr-form__types" role="radiogroup" aria-label="Address Type">
          {[
            { id: 'Home', icon: <IconHome /> },
            { id: 'Work', icon: <IconWork /> },
            { id: 'Other', icon: <IconPin /> },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              role="radio"
              aria-checked={formData.label === item.id}
              className={`co-addr-type-btn${formData.label === item.id ? ' is-active' : ''}`}
              onClick={() => handleChange('label', item.id)}
            >
              {item.icon}
              <span>{item.id}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="co-fields">
        {/* Full Name */}
        <div className={`co-field is-wide${errors.name ? ' is-invalid' : ''}`}>
          <label htmlFor="addr-name" className="co-label">
            Full Name <span className="co-required">*</span>
          </label>
          <input
            id="addr-name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder="Recipient full name"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
          />
          {errors.name && <p className="co-error">{errors.name}</p>}
        </div>

        {/* Mobile Number */}
        <div className={`co-field is-wide${errors.phone ? ' is-invalid' : ''}`}>
          <label htmlFor="addr-phone" className="co-label">
            Phone Number <span className="co-required">*</span>
          </label>
          <div className="co-phone-wrap">
            <span className="co-phone-prefix">+91</span>
            <input
              id="addr-phone"
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              placeholder="10-digit mobile number"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
            />
          </div>
          {errors.phone && <p className="co-error">{errors.phone}</p>}
        </div>

        {/* House / Flat / Building * */}
        <div className={`co-field is-wide${errors.house ? ' is-invalid' : ''}`}>
          <label htmlFor="addr-house" className="co-label">
            House / Flat / Building <span className="co-required">*</span>
          </label>
          <input
            id="addr-house"
            name="house"
            type="text"
            placeholder="Flat / Floor / Villa / House no."
            value={formData.house}
            onChange={(e) => handleChange('house', e.target.value)}
          />
          {errors.house && <p className="co-error">{errors.house}</p>}
        </div>

        {/* Street / Road */}
        <div className="co-field is-wide">
          <label htmlFor="addr-street" className="co-label">
            Street / Road
          </label>
          <input
            id="addr-street"
            name="street"
            type="text"
            placeholder="Street name, road, avenue"
            value={formData.street}
            onChange={(e) => handleChange('street', e.target.value)}
          />
        </div>

        {/* Area / Locality */}
        <div className="co-field is-wide">
          <label htmlFor="addr-area" className="co-label">
            Area / Locality
          </label>
          <input
            id="addr-area"
            name="area"
            type="text"
            placeholder="Area, neighborhood, sector"
            value={formData.area}
            onChange={(e) => handleChange('area', e.target.value)}
          />
        </div>

        {/* Landmark (Optional) */}
        <div className="co-field is-wide">
          <label htmlFor="addr-landmark" className="co-label">
            Landmark (Optional)
          </label>
          <input
            id="addr-landmark"
            name="landmark"
            type="text"
            placeholder="Near temple, hospital, school, etc."
            value={formData.landmark}
            onChange={(e) => handleChange('landmark', e.target.value)}
          />
        </div>

        {/* City */}
        <div className={`co-field is-half${errors.city ? ' is-invalid' : ''}`}>
          <label htmlFor="addr-city" className="co-label">
            City <span className="co-required">*</span>
          </label>
          <input
            id="addr-city"
            name="city"
            type="text"
            placeholder="City / Town"
            value={formData.city}
            onChange={(e) => handleChange('city', e.target.value)}
          />
          {errors.city && <p className="co-error">{errors.city}</p>}
        </div>

        {/* State */}
        <div className={`co-field is-half${errors.state ? ' is-invalid' : ''}`}>
          <label htmlFor="addr-state" className="co-label">
            State <span className="co-required">*</span>
          </label>
          <select
            id="addr-state"
            name="state"
            value={formData.state}
            onChange={(e) => handleChange('state', e.target.value)}
          >
            <option value="">Select State</option>
            {STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          {errors.state && <p className="co-error">{errors.state}</p>}
        </div>

        {/* PIN Code */}
        <div className={`co-field is-half${errors.pin ? ' is-invalid' : ''}`}>
          <label htmlFor="addr-pin" className="co-label">
            PIN Code <span className="co-required">*</span>
          </label>
          <input
            id="addr-pin"
            name="pin"
            type="text"
            inputMode="numeric"
            autoComplete="postal-code"
            placeholder="6-digit PIN"
            maxLength={6}
            value={formData.pin}
            onChange={(e) => handleChange('pin', e.target.value.replace(/\D/g, '').slice(0, 6))}
          />
          {errors.pin && <p className="co-error">{errors.pin}</p>}
        </div>
      </div>

      {/* Save Address Toggle for logged-in users */}
      {isAuthenticated && (
        <div className="co-addr-form__save-toggle">
          <label className="co-checkbox-label">
            <input
              type="checkbox"
              checked={formData.saveForFuture}
              onChange={(e) => handleChange('saveForFuture', e.target.checked)}
            />
            <span>Save this address for future orders</span>
          </label>
        </div>
      )}

      {/* Form Buttons */}
      <div className="co-addr-form__actions">
        <button
          type="button"
          className="co-btn co-btn--outline"
          onClick={onCancel}
          disabled={saving}
        >
          Cancel
        </button>
        <button
          type="button"
          className="co-btn co-btn--primary"
          onClick={handleSubmit}
          disabled={saving}
        >
          {saving ? 'Saving…' : isEditing ? 'Save Changes' : 'Save Address'}
        </button>
      </div>
    </div>
  )
}

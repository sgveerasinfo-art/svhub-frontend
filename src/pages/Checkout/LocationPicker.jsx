import { useEffect, useRef, useState, useCallback } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  getCurrentPosition,
  reverseGeocode,
  searchLocations,
  getGooglePlaceDetails,
} from '../../services/mapService.js'
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
  'Uttar Pradesh',
  'Haryana',
  'Punjab',
  'Madhya Pradesh',
  'Bihar',
  'Odisha',
  'Assam',
  'Jharkhand',
  'Chhattisgarh',
  'Uttarakhand',
  'Himachal Pradesh',
  'Jammu and Kashmir',
]

function matchState(stateStr) {
  if (!stateStr) return ''
  const clean = stateStr.toLowerCase().trim()
  const match = STATES.find(
    (s) =>
      s.toLowerCase() === clean ||
      clean.includes(s.toLowerCase()) ||
      s.toLowerCase().includes(clean),
  )
  return match || stateStr
}

function phoneOk(value = '') {
  const digits = value.replace(/\D/g, '')
  return digits.length === 10 || (digits.length === 12 && digits.startsWith('91'))
}

function pinOk(value = '') {
  return /^\d{6}$/.test(value.trim())
}

function formatPreviewText(addr) {
  if (!addr) return 'Selected Location'
  const parts = [
    addr.street,
    addr.area,
    addr.city,
    addr.state,
  ].filter(Boolean)
  if (parts.length > 0) {
    return parts.join(', ') + (addr.pin ? ` — ${addr.pin}` : '')
  }
  return addr.formattedAddress || 'Selected Location'
}

function IconGps() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="12" r="2.5" fill="currentColor" />
    </svg>
  )
}

function IconSearch() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
      <path d="m16.5 16.5 4.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function IconPin() {
  return (
    <svg width="36" height="46" viewBox="0 0 36 46" fill="none" aria-hidden="true">
      <path
        d="M18 0C8.06 0 0 8.06 0 18C0 31.5 18 46 18 46C18 46 36 31.5 36 18C36 8.06 27.94 0 18 0Z"
        fill="#3b4a20"
      />
      <circle cx="18" cy="18" r="8" fill="#ffffff" />
      <circle cx="18" cy="18" r="4.5" fill="#6e8c28" />
    </svg>
  )
}

function IconPinSmall() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2C7.58 2 4 5.58 4 10c0 5.25 8 12 8 12s8-6.75 8-12c0-4.42-3.58-8-8-8Z"
        fill="#3b4a20"
      />
      <circle cx="12" cy="10" r="3" fill="#ffffff" />
    </svg>
  )
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

function IconAlert() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 8v4.5M12 16.2v.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

// Default center: Chennai, Tamil Nadu
const DEFAULT_CENTER = { lat: 13.0827, lng: 80.2707 }

export default function LocationPicker({
  initialLocation,
  onSave,
  onConfirmLocation,
  onEnterManually,
  onCancel,
  saving = false,
  isAuthenticated = false,
  initialUser = null,
}) {
  const mapContainerRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const debounceTimerRef = useRef(null)
  const searchDebounceRef = useRef(null)

  // UX Steps: 'select' (Pick location on map) | 'form' (Review/edit address details)
  const [step, setStep] = useState('select')

  const [locating, setLocating] = useState(false)
  const [geocoding, setGeocoding] = useState(false)
  const [permissionNotice, setPermissionNotice] = useState(null)
  const [accuracyNotice, setAccuracyNotice] = useState(null)
  const [mapError, setMapError] = useState(false)

  const [detectedAddress, setDetectedAddress] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)

  // Track which fields the user has manually touched/edited to prevent overwriting
  const [userEdited, setUserEdited] = useState({
    name: false,
    phone: false,
    house: false,
    street: false,
    area: false,
    landmark: false,
    city: false,
    state: false,
    pin: false,
  })

  // Full address form state
  const [formData, setFormData] = useState({
    name: initialLocation?.name || initialLocation?.fullName || initialUser?.displayName || initialUser?.name || '',
    phone: initialLocation?.phone ? initialLocation.phone.replace(/^(\+91|91)/, '').trim() : (initialUser?.phoneNumber ? initialUser.phoneNumber.replace(/^(\+91|91)/, '').trim() : ''),
    house: initialLocation?.house || '',
    street: initialLocation?.street || '',
    area: initialLocation?.area || '',
    landmark: initialLocation?.landmark || '',
    city: initialLocation?.city || '',
    state: initialLocation?.state || '',
    pin: initialLocation?.pin || '',
    label: initialLocation?.label || 'Home',
    latitude: initialLocation?.latitude ?? DEFAULT_CENTER.lat,
    longitude: initialLocation?.longitude ?? DEFAULT_CENTER.lng,
    saveForFuture: isAuthenticated,
  })

  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState('')

  // Populate address form fields from reverse-geocoded data without overwriting user-edited fields
  const populateAddressFromGeocoding = useCallback((addr) => {
    if (!addr) return

    setFormData((prev) => {
      const updated = { ...prev }

      if (addr.latitude != null) updated.latitude = addr.latitude
      if (addr.longitude != null) updated.longitude = addr.longitude

      // Route / Street
      if (!userEdited.street) {
        updated.street = addr.street || ''
      }

      // Area / Locality
      if (!userEdited.area) {
        updated.area = addr.area || ''
      }

      // City
      if (!userEdited.city && addr.city) {
        updated.city = addr.city
      }

      // State
      if (!userEdited.state && addr.state) {
        updated.state = matchState(addr.state)
      }

      // PIN Code
      if (!userEdited.pin && addr.pin) {
        updated.pin = addr.pin
      }

      // House / Flat (only if explicitly returned by provider and not yet touched)
      if (!userEdited.house && !prev.house && addr.house) {
        updated.house = addr.house
      }

      // Landmark (only if explicitly returned and not touched)
      if (!userEdited.landmark && !prev.landmark && addr.landmark) {
        updated.landmark = addr.landmark
      }

      return updated
    })
  }, [userEdited])

  // Reverse geocode when map center changes
  const handleCenterChange = useCallback(async (lat, lng) => {
    setGeocoding(true)
    try {
      const addr = await reverseGeocode(lat, lng)
      setDetectedAddress(addr)
    } catch {
      setDetectedAddress({
        formattedAddress: 'Selected location on map',
        latitude: lat,
        longitude: lng,
      })
    } finally {
      setGeocoding(false)
    }
  }, [])

  // Initialize interactive Leaflet map immediately on mount
  useEffect(() => {
    if (step !== 'select' || !mapContainerRef.current) return

    // If map instance already exists, just resize it
    if (mapInstanceRef.current) {
      setTimeout(() => mapInstanceRef.current?.invalidateSize(), 100)
      return
    }

    const initialLat = initialLocation?.latitude || DEFAULT_CENTER.lat
    const initialLng = initialLocation?.longitude || DEFAULT_CENTER.lng

    try {
      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: 16,
        zoomControl: false,
        attributionControl: true,
        touchZoom: true,
        dragging: true,
        tap: false,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>',
      }).addTo(map)

      mapInstanceRef.current = map

      // Debounced moveend reverse geocoding
      map.on('moveend', () => {
        const center = map.getCenter()
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
        debounceTimerRef.current = setTimeout(() => {
          handleCenterChange(center.lat, center.lng)
        }, 350)
      })

      // Initial reverse geocode
      handleCenterChange(initialLat, initialLng)

      const resizeTimer = setTimeout(() => {
        map.invalidateSize()
      }, 200)

      const handleWindowResize = () => {
        map.invalidateSize()
      }
      window.addEventListener('resize', handleWindowResize)
      window.addEventListener('orientationchange', handleWindowResize)

      return () => {
        clearTimeout(resizeTimer)
        window.removeEventListener('resize', handleWindowResize)
        window.removeEventListener('orientationchange', handleWindowResize)
      }
    } catch (err) {
      console.error('Map initialization error:', err)
      setMapError(true)
    }
  }, [step, initialLocation, handleCenterChange])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  // User manually edits a form field
  function handleFieldChange(field, value) {
    setUserEdited((prev) => ({ ...prev, [field]: true }))
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  // Action: Use My Current Location (GPS)
  async function handleUseCurrentLocation() {
    setLocating(true)
    setPermissionNotice(null)
    setAccuracyNotice(null)

    try {
      const pos = await getCurrentPosition()
      const { latitude, longitude, accuracy } = pos

      if (accuracy && accuracy > 100) {
        setAccuracyNotice('Please confirm the pin location before continuing.')
      }

      if (mapInstanceRef.current) {
        mapInstanceRef.current.setView([latitude, longitude], 17, { animate: true })
      }

      await handleCenterChange(latitude, longitude)
    } catch (err) {
      console.warn('Geolocation denied or failed:', err)
      setPermissionNotice(
        'Location access was not allowed. You can still select your location on the map.',
      )
    } finally {
      setLocating(false)
    }
  }

  // Action: Autocomplete search input
  function handleSearchInput(e) {
    const val = e.target.value
    setSearchQuery(val)

    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)

    if (!val || val.trim().length < 2) {
      setSearchResults([])
      setShowSearchResults(false)
      return
    }

    searchDebounceRef.current = setTimeout(async () => {
      setSearchLoading(true)
      try {
        const results = await searchLocations(val.trim())
        setSearchResults(results)
        setShowSearchResults(results.length > 0)
      } catch {
        setSearchResults([])
      } finally {
        setSearchLoading(false)
      }
    }, 280)
  }

  // Action: Select location from search dropdown
  async function handleSelectSearchResult(result) {
    setShowSearchResults(false)
    setSearchQuery(result.name || result.formattedAddress)

    let lat = result.latitude
    let lng = result.longitude
    let details = result.address

    if (result.placeId && (!lat || !lng)) {
      setGeocoding(true)
      const placeDetails = await getGooglePlaceDetails(result.placeId)
      if (placeDetails) {
        lat = placeDetails.latitude
        lng = placeDetails.longitude
        details = placeDetails
      }
      setGeocoding(false)
    }

    if (lat && lng) {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setView([lat, lng], 17, { animate: true })
      }
      if (details) {
        setDetectedAddress(details)
      } else {
        await handleCenterChange(lat, lng)
      }
    }
  }

  // Action: Trigger explicit search
  async function handleExplicitSearch() {
    if (!searchQuery.trim()) return

    setSearchLoading(true)
    try {
      const results = await searchLocations(searchQuery.trim())
      if (results.length > 0) {
        handleSelectSearchResult(results[0])
      } else {
        setShowSearchResults(false)
      }
    } catch {
      // ignore
    } finally {
      setSearchLoading(false)
    }
  }

  function handleSearchKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleExplicitSearch()
    } else if (e.key === 'Escape') {
      setShowSearchResults(false)
    }
  }

  // Zoom controls
  function handleZoomIn() {
    mapInstanceRef.current?.zoomIn()
  }

  function handleZoomOut() {
    mapInstanceRef.current?.zoomOut()
  }

  // Action: User clicks "CONFIRM LOCATION"
  function handleConfirmLocation() {
    if (!detectedAddress && !formData.latitude) return

    // Populate the address form from the geocoded location
    if (detectedAddress) {
      populateAddressFromGeocoding(detectedAddress)
    }

    // Transition to the address form step
    setStep('form')

    // If parent callback was provided, notify
    if (onConfirmLocation && detectedAddress) {
      onConfirmLocation(detectedAddress)
    }
  }

  // Action: User chooses manual address entry
  function handleSwitchToManual() {
    setStep('form')
    if (onEnterManually) onEnterManually()
  }

  // Action: User wants to change location from the form back to map
  function handleChangeLocation() {
    setStep('select')
  }

  // Form validation
  function validate() {
    const errs = {}
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      errs.name = 'Please enter recipient full name.'
    }
    if (!phoneOk(formData.phone)) {
      errs.phone = 'Please enter a valid 10-digit mobile number.'
    }
    if (!formData.house.trim()) {
      errs.house = 'House / Flat / Building is required.'
    }
    if (!formData.city.trim()) {
      errs.city = 'Please enter city.'
    }
    if (!formData.state) {
      errs.state = 'Please select state.'
    }
    if (!pinOk(formData.pin)) {
      errs.pin = 'Please enter a valid 6-digit PIN code.'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  // Form submission
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
      const payload = {
        ...formData,
        id: initialLocation?.id || initialLocation?._id,
        street: formData.street.trim() || formData.house.trim(),
      }

      if (onSave) {
        await onSave(payload)
      }
    } catch (err) {
      setApiError(err?.message || 'Unable to save address. Please try again.')
    }
  }

  return (
    <div className="co-loc-picker" role="region" aria-label="Add delivery address via interactive map">
      {/* Header */}
      <div className="co-loc-header">
        <h3 className="co-loc-title">Add Delivery Address</h3>
        <p className="co-loc-desc">
          Choose your delivery location on the map for accurate, fast delivery.
        </p>
      </div>

      {mapError ? (
        <div className="co-map-error-state" role="alert">
          <p>Unable to load the map.</p>
          <small>You can still enter your address manually below.</small>
        </div>
      ) : null}

      {/* STEP 1: Map & Location Selection */}
      {step === 'select' && (
        <div className="co-loc-interactive-wrap">
          {/* Top Search Bar */}
          <div className="co-loc-search-bar">
            <div className="co-loc-search-input-box">
              <span className="co-loc-search-icon" aria-hidden="true">
                <IconSearch />
              </span>
              <input
                type="text"
                className="co-loc-search-input"
                placeholder="Search area, street, landmark…"
                value={searchQuery}
                onChange={handleSearchInput}
                onKeyDown={handleSearchKeyDown}
                onFocus={() => {
                  if (searchResults.length > 0) setShowSearchResults(true)
                }}
                aria-label="Search area, street, landmark"
                autoComplete="off"
              />
              {searchLoading && <span className="co-loc-search-spinner" aria-hidden="true" />}
              {searchQuery && !searchLoading && (
                <button
                  type="button"
                  className="co-loc-search-clear"
                  onClick={() => {
                    setSearchQuery('')
                    setSearchResults([])
                    setShowSearchResults(false)
                  }}
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </div>

            <button
              type="button"
              className="co-loc-search-btn"
              onClick={handleExplicitSearch}
              disabled={searchLoading || !searchQuery.trim()}
            >
              Search
            </button>

            {/* Suggestions dropdown */}
            {showSearchResults && searchResults.length > 0 && (
              <ul className="co-loc-suggestions" role="listbox">
                {searchResults.map((res) => (
                  <li
                    key={res.id}
                    role="option"
                    aria-selected={false}
                    className="co-loc-suggestion-item"
                    onClick={() => handleSelectSearchResult(res)}
                  >
                    <strong>{res.name}</strong>
                    <small>{res.formattedAddress}</small>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Map Canvas Frame */}
          <div className="co-map-canvas-container" aria-label="Interactive map. Move map to position pin on delivery address.">
            <div ref={mapContainerRef} className="co-map-canvas" />

            {/* Fixed Centered Pin */}
            <div className="co-map-center-marker" aria-hidden="true">
              <div className="co-map-pin-icon">
                <IconPin />
              </div>
              <div className="co-map-pin-shadow" />
            </div>

            {/* Zoom Controls */}
            <div className="co-map-zoom-controls" aria-label="Map zoom controls">
              <button
                type="button"
                className="co-map-zoom-btn"
                onClick={handleZoomIn}
                aria-label="Zoom in"
                title="Zoom in"
              >
                +
              </button>
              <button
                type="button"
                className="co-map-zoom-btn"
                onClick={handleZoomOut}
                aria-label="Zoom out"
                title="Zoom out"
              >
                −
              </button>
            </div>

            {/* Floating 'Use my current location' button */}
            <div className="co-map-locate-wrap">
              <button
                type="button"
                className="co-map-locate-btn"
                onClick={handleUseCurrentLocation}
                disabled={locating}
                aria-busy={locating}
              >
                <IconGps />
                <span>{locating ? 'Locating you…' : 'Use my current location'}</span>
              </button>
            </div>
          </div>

          {/* Subtle Notices */}
          {permissionNotice && (
            <div className="co-loc-notice-banner" role="status">
              <IconAlert />
              <span>{permissionNotice}</span>
            </div>
          )}
          {accuracyNotice && !permissionNotice && (
            <div className="co-loc-notice-banner co-loc-notice-banner--warn" role="status">
              <IconAlert />
              <span>{accuracyNotice}</span>
            </div>
          )}

          {/* Location Selected Human-Readable Preview Card */}
          <div className="co-loc-preview-box">
            <div className="co-loc-preview-head">
              <span className="co-loc-preview-heading">LOCATION SELECTED</span>
              {geocoding && <span className="co-loc-preview-shimmer">Finding address…</span>}
            </div>

            <div className="co-loc-preview-content">
              <div className="co-loc-preview-icon" aria-hidden="true">
                <IconPinSmall />
              </div>
              <div className="co-loc-preview-details">
                {geocoding && !detectedAddress ? (
                  <p className="co-loc-preview-placeholder">Finding address…</p>
                ) : (
                  <div className="co-loc-preview-lines">
                    {detectedAddress?.street && (
                      <p className="co-loc-preview-line1">{detectedAddress.street}</p>
                    )}
                    {(detectedAddress?.area || detectedAddress?.city) && (
                      <p className="co-loc-preview-line2">
                        {[detectedAddress.area, detectedAddress.city].filter(Boolean).join(', ')}
                      </p>
                    )}
                    {(detectedAddress?.state || detectedAddress?.pin) && (
                      <p className="co-loc-preview-line3">
                        {detectedAddress.state}
                        {detectedAddress.pin ? ` — ${detectedAddress.pin}` : ''}
                      </p>
                    )}
                    {!detectedAddress?.street && !detectedAddress?.area && (
                      <p className="co-loc-preview-line1">
                        {detectedAddress?.formattedAddress || 'Selected location on map'}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Prominent CONFIRM LOCATION Action Button */}
            <div className="co-loc-confirm-wrap">
              <button
                type="button"
                className="co-btn co-btn--primary co-loc-confirm-btn"
                onClick={handleConfirmLocation}
                disabled={geocoding || !detectedAddress}
              >
                CONFIRM LOCATION
              </button>
            </div>

            {/* Manual entry fallback option */}
            <div className="co-loc-map-toggle-row">
              <button
                type="button"
                className="co-loc-text-link"
                onClick={handleSwitchToManual}
              >
                Enter address manually without map
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Address Details Form (Shown after clicking CONFIRM LOCATION or entering manually) */}
      {step === 'form' && (
        <div className="co-loc-form-container">
          {/* Confirmed Location Banner with Change Location Action */}
          {detectedAddress && (
            <div className="co-loc-confirmed-banner">
              <div className="co-loc-confirmed-info">
                <IconPinSmall />
                <div>
                  <strong>Confirmed Delivery Location</strong>
                  <p>{formatPreviewText(detectedAddress)}</p>
                </div>
              </div>
              <button
                type="button"
                className="co-btn co-btn--outline co-loc-change-btn"
                onClick={handleChangeLocation}
              >
                CHANGE LOCATION
              </button>
            </div>
          )}

          {!detectedAddress && (
            <div className="co-loc-manual-banner">
              <span>Entering address manually without map.</span>
              <button
                type="button"
                className="co-loc-show-map-btn"
                onClick={handleChangeLocation}
              >
                🗺 Pick location on map
              </button>
            </div>
          )}

          <div
            className="co-addr-form co-loc-form"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
                e.preventDefault()
                handleSubmit(e)
              }
            }}
          >
            <div className="co-addr-form__header">
              <h4>Address Details</h4>
              <p className="co-addr-form__sub">
                Review and complete your delivery details below. Every field can be edited.
              </p>
            </div>

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
                  { id: 'Other', icon: <IconPinSmall /> },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    role="radio"
                    aria-checked={formData.label === item.id}
                    className={`co-addr-type-btn${formData.label === item.id ? ' is-active' : ''}`}
                    onClick={() => handleFieldChange('label', item.id)}
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
                  Recipient Full Name <span className="co-required">*</span>
                </label>
                <input
                  id="addr-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Recipient full name"
                  value={formData.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
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
                    onChange={(e) =>
                      handleFieldChange('phone', e.target.value.replace(/\D/g, '').slice(0, 10))
                    }
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
                  onChange={(e) => handleFieldChange('house', e.target.value)}
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
                  onChange={(e) => handleFieldChange('street', e.target.value)}
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
                  onChange={(e) => handleFieldChange('area', e.target.value)}
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
                  onChange={(e) => handleFieldChange('landmark', e.target.value)}
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
                  onChange={(e) => handleFieldChange('city', e.target.value)}
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
                  onChange={(e) => handleFieldChange('state', e.target.value)}
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
                  onChange={(e) =>
                    handleFieldChange('pin', e.target.value.replace(/\D/g, '').slice(0, 6))
                  }
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
                    onChange={(e) => handleFieldChange('saveForFuture', e.target.checked)}
                  />
                  <span>Save this address for future orders</span>
                </label>
              </div>
            )}

            {/* Action Buttons */}
            <div className="co-addr-form__actions">
              {onCancel && (
                <button
                  type="button"
                  className="co-btn co-btn--outline"
                  onClick={onCancel}
                  disabled={saving}
                >
                  Cancel
                </button>
              )}

              <button
                type="button"
                className="co-btn co-btn--primary co-addr-form__submit"
                onClick={handleSubmit}
                disabled={saving}
              >
                {saving ? 'Saving…' : 'SAVE ADDRESS'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

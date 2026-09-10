/**
 * src/services/mapService.js
 * Location, Geocoding, and Mapping abstraction for SV Hub.
 *
 * Supports Google Maps Platform if VITE_GOOGLE_MAPS_API_KEY is configured.
 * Provides resilient, high-speed, rate-limit-free reverse geocoding and search
 * using Photon (OSM) and BigDataCloud for seamless local & production development.
 */

const GOOGLE_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''

let googleMapsScriptPromise = null

/**
 * Dynamically load Google Maps script if API key is provided
 */
export function loadGoogleMaps() {
  if (!GOOGLE_KEY) return Promise.resolve(null)
  if (window.google?.maps) return Promise.resolve(window.google.maps)

  if (!googleMapsScriptPromise) {
    googleMapsScriptPromise = new Promise((resolve) => {
      const script = document.createElement('script')
      script.id = 'svhub-google-maps-script'
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(GOOGLE_KEY)}&libraries=places`
      script.async = true
      script.defer = true
      script.onload = () => resolve(window.google?.maps || null)
      script.onerror = (err) => {
        console.warn('Failed to load Google Maps script, falling back to open geocoding:', err)
        resolve(null)
      }
      document.head.appendChild(script)
    })
  }

  return googleMapsScriptPromise
}

/**
 * Browser Geolocation Request
 * Wraps navigator.geolocation.getCurrentPosition with structured errors.
 */
export function getCurrentPosition(options = {}) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      return reject({
        code: 'UNSUPPORTED',
        message: 'Location access is not supported by your browser.',
      })
    }

    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
      ...options,
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        })
      },
      (error) => {
        let code = 'UNKNOWN'
        let message = 'Unable to detect your location.'

        switch (error.code) {
          case error.PERMISSION_DENIED:
            code = 'PERMISSION_DENIED'
            message = 'Location access was not allowed.'
            break
          case error.POSITION_UNAVAILABLE:
            code = 'POSITION_UNAVAILABLE'
            message = 'Your location is currently unavailable.'
            break
          case error.TIMEOUT:
            code = 'TIMEOUT'
            message = 'Location request timed out. Please try again.'
            break
          default:
            code = 'ERROR'
            message = error.message || 'Unable to detect location.'
        }

        reject({ code, message, originalError: error })
      },
      defaultOptions,
    )
  })
}

/**
 * Reverse Geocode coordinates to normalized address fields
 * Multi-tier strategy:
 * 1. Google Maps Geocoder (if API key available)
 * 2. Photon (OSM-based, high performance, no rate limiting, rich Indian addresses)
 * 3. BigDataCloud client API (administrative locality / city / state enrichment)
 * 4. OpenStreetMap Nominatim
 */
export async function reverseGeocode(latitude, longitude) {
  // 1. Google Maps Platform (if key present)
  const gMaps = await loadGoogleMaps().catch(() => null)
  if (gMaps && gMaps.Geocoder) {
    try {
      const geocoder = new gMaps.Geocoder()
      const response = await new Promise((resolve, reject) => {
        geocoder.geocode({ location: { lat: latitude, lng: longitude } }, (results, status) => {
          if (status === 'OK' && results?.[0]) {
            resolve(results[0])
          } else {
            reject(new Error(status || 'Geocoding failed'))
          }
        })
      })

      return normalizeGoogleResult(response, latitude, longitude)
    } catch (err) {
      console.warn('Google reverse geocoding error, falling back to open services:', err)
    }
  }

  // 2. Photon (Komoot OSM) + BigDataCloud Client Geocoding (Parallel & resilient)
  let photonProps = null
  let bdcData = null

  try {
    const [photonRes, bdcRes] = await Promise.allSettled([
      fetch(`https://photon.komoot.io/reverse?lat=${latitude}&lon=${longitude}`),
      fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`),
    ])

    if (photonRes.status === 'fulfilled' && photonRes.value.ok) {
      const pJson = await photonRes.value.json().catch(() => null)
      photonProps = pJson?.features?.[0]?.properties || null
    }

    if (bdcRes.status === 'fulfilled' && bdcRes.value.ok) {
      bdcData = await bdcRes.value.json().catch(() => null)
    }
  } catch (err) {
    console.warn('Photon/BDC fetch warning:', err)
  }

  if (photonProps || bdcData) {
    const p = photonProps || {}
    const b = bdcData || {}

    const house = p.housenumber || ''
    // Route/Street
    const street = p.street || (p.osm_key === 'highway' ? p.name : '') || ''
    // Area/Locality (suburb, district, locality)
    const area = p.district || p.suburb || p.locality || b.locality || ''
    // Landmark (point of interest / building name if distinct from street)
    const landmark = (p.name && p.name !== p.street && p.osm_key !== 'highway') ? p.name : ''
    // City
    const city = p.city || p.town || b.city || p.county || ''
    // State
    const state = p.state || b.principalSubdivision || ''
    // PIN Code
    const rawPin = p.postcode || b.postcode || ''
    const pin = rawPin.replace(/\D/g, '').slice(0, 6)
    const country = p.country || b.countryName || 'India'

    // Clean human-readable address line
    const addressParts = [
      street || landmark,
      area,
      city,
      state,
    ].filter(Boolean)

    const formattedAddress = addressParts.length > 0
      ? (addressParts.join(', ') + (pin ? ` — ${pin}` : ''))
      : (b.locality ? `${b.locality}, ${b.city || ''}`.trim() : 'Selected Location')

    return {
      house,
      street,
      area,
      landmark,
      city,
      state,
      pin,
      country,
      formattedAddress,
      latitude,
      longitude,
    }
  }

  // 3. Fallback: OpenStreetMap Nominatim
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&addressdetails=1`
    const res = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
    })

    if (res.ok) {
      const data = await res.json()
      return normalizeNominatimResult(data, latitude, longitude)
    }
  } catch (err) {
    console.warn('Nominatim fallback failed:', err)
  }

  // Graceful fallback with human readable fallback (never raw coordinates string)
  return {
    house: '',
    street: '',
    area: '',
    landmark: '',
    city: '',
    state: '',
    pin: '',
    country: 'India',
    formattedAddress: 'Selected location on map',
    latitude,
    longitude,
  }
}

/**
 * Search places/locations
 * Priority: Google Places Autocomplete if key available, else Photon Search API
 */
export async function searchLocations(query) {
  if (!query || query.trim().length < 2) return []

  const gMaps = await loadGoogleMaps().catch(() => null)

  if (gMaps && gMaps.places?.AutocompleteService) {
    try {
      const service = new gMaps.places.AutocompleteService()
      const predictions = await new Promise((resolve) => {
        service.getPlacePredictions(
          {
            input: query,
            componentRestrictions: { country: 'in' },
          },
          (results, status) => {
            if (status === gMaps.places.PlacesServiceStatus.OK && results) {
              resolve(results)
            } else {
              resolve([])
            }
          },
        )
      })

      if (predictions.length > 0) {
        return predictions.map((p) => ({
          id: p.place_id,
          name: p.structured_formatting?.main_text || p.description,
          formattedAddress: p.description,
          placeId: p.place_id,
        }))
      }
    } catch (err) {
      console.warn('Google autocomplete error, falling back to open search:', err)
    }
  }

  // Photon Search for India
  try {
    const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=6`
    const res = await fetch(url)

    if (res.ok) {
      const data = await res.json()
      const features = data?.features || []

      if (features.length > 0) {
        return features.map((f) => {
          const p = f.properties || {}
          const coords = f.geometry?.coordinates || []
          const lng = coords[0]
          const lat = coords[1]

          const house = p.housenumber || ''
          const street = p.street || (p.osm_key === 'highway' ? p.name : '') || ''
          const area = p.district || p.suburb || p.locality || ''
          const landmark = (p.name && p.name !== p.street && p.osm_key !== 'highway') ? p.name : ''
          const city = p.city || p.town || p.county || ''
          const state = p.state || ''
          const pin = (p.postcode || '').replace(/\D/g, '').slice(0, 6)

          const parts = [p.name, area, city, state].filter(Boolean)
          const formattedAddress = parts.join(', ') + (pin ? ` — ${pin}` : '')

          return {
            id: String(p.osm_id || `${lat}-${lng}`),
            name: p.name || formattedAddress.split(',')[0],
            formattedAddress,
            latitude: lat,
            longitude: lng,
            address: {
              house,
              street,
              area,
              landmark,
              city,
              state,
              pin,
              country: p.country || 'India',
              formattedAddress,
              latitude: lat,
              longitude: lng,
            },
          }
        })
      }
    }
  } catch (err) {
    console.warn('Photon search error, trying Nominatim fallback:', err)
  }

  // Fallback: Nominatim Search
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(query)}&countrycodes=in&limit=5&addressdetails=1`
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
    })

    if (res.ok) {
      const data = await res.json()
      return (data || []).map((item) => ({
        id: String(item.place_id || item.osm_id),
        name: item.name || item.display_name.split(',')[0],
        formattedAddress: item.display_name,
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
        address: normalizeNominatimAddress(item.address, parseFloat(item.lat), parseFloat(item.lon)),
      }))
    }
  } catch (err) {
    console.error('Location search failed:', err)
  }

  return []
}

/**
 * Fetch coordinates and details for Google placeId
 */
export async function getGooglePlaceDetails(placeId) {
  const gMaps = await loadGoogleMaps().catch(() => null)
  if (!gMaps) return null

  try {
    const dummyDiv = document.createElement('div')
    const service = new gMaps.places.PlacesService(dummyDiv)
    return new Promise((resolve) => {
      service.getDetails(
        {
          placeId,
          fields: ['geometry', 'formatted_address', 'address_components', 'name'],
        },
        (place, status) => {
          if (status === gMaps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
            const lat = place.geometry.location.lat()
            const lng = place.geometry.location.lng()
            resolve(normalizeGoogleResult(place, lat, lng))
          } else {
            resolve(null)
          }
        },
      )
    })
  } catch {
    return null
  }
}

/* ---------------- Normalization Helpers ---------------- */

function normalizeGoogleResult(result, latitude, longitude) {
  const comps = result.address_components || []
  const getComp = (type) => comps.find((c) => c.types.includes(type))?.long_name || ''

  // India-specific mapping rules:
  // premise, subpremise, street_number -> House / Flat / Building
  const house = getComp('subpremise') || getComp('premise') || getComp('street_number') || ''
  // route -> Street / Road
  const street = getComp('route') || ''
  // sublocality, neighborhood -> Area / Locality
  const area =
    getComp('sublocality_level_1') ||
    getComp('sublocality') ||
    getComp('neighborhood') ||
    ''
  // point_of_interest -> Landmark
  const landmark = getComp('point_of_interest') || ''
  // locality / administrative_area_level_2 -> City
  const city =
    getComp('locality') ||
    getComp('administrative_area_level_2') ||
    getComp('sublocality_level_2') ||
    ''
  // administrative_area_level_1 -> State
  const state = getComp('administrative_area_level_1') || ''
  // postal_code -> PIN Code
  const pin = (getComp('postal_code') || '').replace(/\D/g, '').slice(0, 6)
  const country = getComp('country') || 'India'

  const parts = [street || landmark, area, city, state].filter(Boolean)
  const formattedAddress = result.formatted_address || (parts.join(', ') + (pin ? ` — ${pin}` : ''))

  return {
    house,
    street,
    area,
    landmark,
    city,
    state,
    pin,
    country,
    formattedAddress,
    latitude,
    longitude,
  }
}

function normalizeNominatimResult(result, latitude, longitude) {
  const addr = result.address || {}
  const normalized = normalizeNominatimAddress(addr, latitude, longitude)
  return {
    ...normalized,
    formattedAddress: result.display_name || normalized.formattedAddress,
  }
}

function normalizeNominatimAddress(addr = {}, latitude, longitude) {
  const house = addr.house_number || addr.building || addr.flat || ''
  const street = addr.road || addr.street || addr.pedestrian || addr.footway || ''
  const area =
    addr.suburb ||
    addr.neighbourhood ||
    addr.residential ||
    addr.subdistrict ||
    addr.city_district ||
    ''
  const landmark = addr.amenity || addr.landmark || addr.shop || ''
  const city =
    addr.city ||
    addr.town ||
    addr.village ||
    addr.county ||
    addr.state_district ||
    ''
  const state = addr.state || ''
  const pin = (addr.postcode || '').replace(/\D/g, '').slice(0, 6)
  const country = addr.country || 'India'

  const parts = [street || landmark, area, city, state].filter(Boolean)
  const formattedAddress = parts.join(', ') + (pin ? ` — ${pin}` : '')

  return {
    house,
    street,
    area,
    landmark,
    city,
    state,
    pin,
    country,
    formattedAddress,
    latitude,
    longitude,
  }
}

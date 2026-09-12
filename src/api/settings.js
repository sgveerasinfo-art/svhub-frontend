/**
 * Public store settings — used by homepage hero campaign resolution.
 */

const API_URL = import.meta.env.VITE_API_URL || '/api'

export async function getPublicSettings({ signal } = {}) {
  let response
  try {
    response = await fetch(`${API_URL}/settings/public?_=${Date.now()}`, {
      method: 'GET',
      headers: { Accept: 'application/json', 'Cache-Control': 'no-cache' },
      cache: 'no-store',
      signal,
    })
  } catch (error) {
    if (error?.name === 'AbortError') throw error
    throw new Error('Could not load store settings.')
  }

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data?.message || data?.error?.message || 'Could not load store settings.')
  }
  return data
}

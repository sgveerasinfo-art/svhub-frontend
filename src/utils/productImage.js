/**
 * Shared product media helpers.
 * Single rule: render Product.image from the API. On load failure, show
 * the professional photo-required placeholder — never another product or category image.
 */

export const PRODUCT_PHOTO_PLACEHOLDER = '/catalog/_photo-required.svg'

/** True when the value is already the approved neutral placeholder. */
export function isProductPhotoPlaceholder(src) {
  if (!src || typeof src !== 'string') return true
  return src === PRODUCT_PHOTO_PLACEHOLDER || src.endsWith('/_photo-required.svg')
}

/**
 * Resolve display src for a product image.
 * Empty/missing → placeholder. Otherwise use the API value as-is.
 */
export function resolveDisplayProductImage(src) {
  if (!src || typeof src !== 'string' || !src.trim()) return PRODUCT_PHOTO_PLACEHOLDER
  return src.trim()
}

/**
 * onError handler for product <img> tags.
 * Swaps broken remotes to the placeholder once (avoids loops).
 */
export function handleProductImageError(event) {
  const img = event?.currentTarget
  if (!img) return
  if (img.dataset.fallbackApplied === '1') return
  img.dataset.fallbackApplied = '1'
  img.src = PRODUCT_PHOTO_PLACEHOLDER
}

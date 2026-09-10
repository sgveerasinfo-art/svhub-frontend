/**
 * src/lib/razorpay.js
 * Utility to asynchronously load Razorpay Standard Checkout SDK.
 */

let scriptLoadingPromise = null

export function loadRazorpayScript() {
  if (typeof window === 'undefined') {
    return Promise.resolve(false)
  }

  if (window.Razorpay) {
    return Promise.resolve(true)
  }

  if (scriptLoadingPromise) {
    return scriptLoadingPromise
  }

  scriptLoadingPromise = new Promise((resolve) => {
    const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')
    if (existing) {
      existing.addEventListener('load', () => resolve(true))
      existing.addEventListener('error', () => {
        scriptLoadingPromise = null
        resolve(false)
      })
      return
    }

    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => {
      resolve(true)
    }
    script.onerror = () => {
      scriptLoadingPromise = null
      resolve(false)
    }
    document.body.appendChild(script)
  })

  return scriptLoadingPromise
}

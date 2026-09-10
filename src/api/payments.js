/**
 * src/api/payments.js
 * Razorpay Payment API calls for authenticated customers.
 */

import { apiFetch } from './client.js'

/**
 * Request server to initialize a Razorpay Order for an existing SV Hub order.
 * @param {string} orderId - MongoDB ObjectId of SV Hub Order
 */
export async function createRazorpayOrder(orderId) {
  return apiFetch('/payments/razorpay/create-order', {
    method: 'POST',
    body: { orderId },
    auth: true,
  })
}

/**
 * Request server to verify cryptographic signature, deduct inventory, and confirm order.
 * @param {Object} payload
 * @param {string} payload.orderId
 * @param {string} payload.razorpay_order_id
 * @param {string} payload.razorpay_payment_id
 * @param {string} payload.razorpay_signature
 */
export async function verifyRazorpayPayment(payload) {
  return apiFetch('/payments/razorpay/verify', {
    method: 'POST',
    body: payload,
    auth: true,
  })
}

/**
 * Inform server of payment failure or cancellation.
 * @param {Object} payload
 */
export async function recordPaymentFailure(payload) {
  return apiFetch('/payments/razorpay/record-failure', {
    method: 'POST',
    body: payload,
    auth: true,
  })
}

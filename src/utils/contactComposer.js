import { contact } from '../data/contact.js'
import { normalizePhone } from './authValidation.js'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function contactNameError(value = '') {
  if (!value.trim()) return 'Please enter your name.'
  return ''
}

export function contactEmailError(value = '') {
  const email = value.trim()
  if (!email || !EMAIL_PATTERN.test(email)) return 'Please enter a valid email address.'
  return ''
}

export function contactPhoneError(value = '') {
  if (!value.trim()) return 'Please enter a valid 10-digit mobile number.'
  const digits = normalizePhone(value)
  if (!/^[6-9]\d{9}$/.test(digits)) return 'Please enter a valid 10-digit mobile number.'
  return ''
}

export function contactMessageError(value = '') {
  if (!(value.trim().length > 0)) return 'Please enter a message.'
  return ''
}

export function validateContactForm(form = {}) {
  return {
    name: contactNameError(form.name),
    email: contactEmailError(form.email),
    phone: contactPhoneError(form.phone),
    message: contactMessageError(form.message),
  }
}

export function normalizeContactForm(form = {}) {
  return {
    name: String(form.name ?? '').trim(),
    email: String(form.email ?? '').trim(),
    phone: normalizePhone(form.phone),
    message: String(form.message ?? '').trim(),
  }
}

export function buildWhatsAppText(form) {
  const { name, email, phone, message } = normalizeContactForm(form)
  return [
    'Hello SV Hub,',
    '',
    `Name: ${name}`,
    `Email: ${email}`,
    `Phone: ${phone}`,
    '',
    'Message:',
    message,
    '',
    'Thank you.',
  ].join('\n')
}

export function buildEmailSubject(form) {
  const { name } = normalizeContactForm(form)
  return `SV Hub Contact — ${name}`
}

export function buildEmailBody(form) {
  const { name, email, phone, message } = normalizeContactForm(form)
  return [
    `Name: ${name}`,
    `Email: ${email}`,
    `Phone: ${phone}`,
    '',
    'Message:',
    '',
    message,
  ].join('\n')
}

export function whatsappHref(form) {
  const text = encodeURIComponent(buildWhatsAppText(form))
  return `${contact.whatsappUrl}?text=${text}`
}

export function mailHref(form) {
  const subject = encodeURIComponent(buildEmailSubject(form))
  const body = encodeURIComponent(buildEmailBody(form))
  return `mailto:${contact.email}?subject=${subject}&body=${body}`
}

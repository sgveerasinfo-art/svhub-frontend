import assert from 'node:assert/strict'
import {
  buildEmailBody,
  buildEmailSubject,
  buildWhatsAppText,
  contactMessageError,
  contactNameError,
  mailHref,
  validateContactForm,
  whatsappHref,
} from '../src/utils/contactComposer.js'
import { contact } from '../src/data/contact.js'

function decodeWhatsAppText(href) {
  const url = new URL(href)
  assert.equal(url.origin + url.pathname, contact.whatsappUrl)
  return decodeURIComponent(url.searchParams.get('text') || '')
}

function decodeMailto(href) {
  assert.ok(href.startsWith(`mailto:${contact.email}?`))
  const query = href.slice(`mailto:${contact.email}?`.length)
  const params = new URLSearchParams(query)
  return {
    subject: params.get('subject') || '',
    body: params.get('body') || '',
  }
}

const case1 = {
  name: 'SV',
  email: 'test@example.com',
  phone: '9876543210',
  message: 'Hi',
}

assert.deepEqual(validateContactForm(case1), {
  name: '',
  email: '',
  phone: '',
  message: '',
})
assert.equal(contactNameError('SV'), '')
assert.equal(contactMessageError('Hi'), '')
assert.equal(contactMessageError('Help'), '')
assert.equal(contactMessageError('Need help with my order'), '')
assert.equal(contactMessageError(''), 'Please enter a message.')
assert.equal(contactMessageError('   '), 'Please enter a message.')
assert.equal(contactMessageError('Order?'), '')
assert.equal(contactMessageError("Can you help me?"), '')

const wa1 = decodeWhatsAppText(whatsappHref(case1))
assert.match(wa1, /Name: SV/)
assert.match(wa1, /Email: test@example\.com/)
assert.match(wa1, /Phone: 9876543210/)
assert.match(wa1, /Message:\nHi/)
assert.ok(wa1.includes('Hi'))

const mail1 = decodeMailto(mailHref(case1))
assert.equal(mail1.subject, 'SV Hub Contact — SV')
assert.match(mail1.body, /Name: SV/)
assert.match(mail1.body, /Email: test@example\.com/)
assert.match(mail1.body, /Phone: 9876543210/)
assert.match(mail1.body, /Message:\n\nHi/)

const case6 = {
  name: 'Venkat',
  email: 'test@example.com',
  phone: '+91 93463 99677',
  message: 'Can you help me?',
}

assert.deepEqual(validateContactForm(case6), {
  name: '',
  email: '',
  phone: '',
  message: '',
})

const wa6Text = buildWhatsAppText(case6)
assert.equal(
  wa6Text,
  [
    'Hello SV Hub,',
    '',
    'Name: Venkat',
    'Email: test@example.com',
    'Phone: 9346399677',
    '',
    'Message:',
    'Can you help me?',
    '',
    'Thank you.',
  ].join('\n'),
)

const wa6 = decodeWhatsAppText(whatsappHref(case6))
assert.equal(wa6, wa6Text)
assert.ok(wa6.includes('Name: Venkat'))
assert.ok(wa6.includes('Email: test@example.com'))
assert.ok(wa6.includes('Phone: 9346399677'))
assert.ok(wa6.includes('Can you help me?'))

const mail6 = decodeMailto(mailHref(case6))
assert.equal(mail6.subject, buildEmailSubject(case6))
assert.equal(mail6.body, buildEmailBody(case6))
assert.ok(mail6.body.includes('Name: Venkat'))
assert.ok(mail6.body.includes('Email: test@example.com'))
assert.ok(mail6.body.includes('Phone: 9346399677'))
assert.ok(mail6.body.includes('Can you help me?'))

const special = {
  name: "O'Brien",
  email: 'test+tag@example.com',
  phone: '09346399677',
  message: 'Need rice & soap — asap?\nLine two',
}

const waSpecial = decodeWhatsAppText(whatsappHref(special))
assert.ok(waSpecial.includes("O'Brien"))
assert.ok(waSpecial.includes('Need rice & soap — asap?'))
assert.ok(waSpecial.includes('Line two'))
assert.ok(waSpecial.includes('Phone: 9346399677'))

const mailSpecial = decodeMailto(mailHref(special))
assert.ok(mailSpecial.body.includes("O'Brien"))
assert.ok(mailSpecial.body.includes('Need rice & soap — asap?'))
assert.ok(mailSpecial.body.includes('Line two'))

assert.equal(contact.whatsappUrl, 'https://wa.me/919346399677')
assert.equal(contact.email, 'info@svhub.com')
assert.ok(whatsappHref(case1).startsWith('https://wa.me/919346399677?text='))
assert.ok(mailHref(case1).startsWith('mailto:info@svhub.com?'))

console.log('contactComposer: all cases passed')

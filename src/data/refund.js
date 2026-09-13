import { contact } from './contact.js'

export const refundPolicy = {
  eyebrow: 'Policies',
  title: 'Refund & Cancellation Policy',
  lede: 'How cancellations, returns and refunds work at SV Hub.',
  effectiveDate: '1 September 2026',
  lastUpdated: 'August 2026',
  related: [
    { to: '/terms-and-conditions', label: 'Terms & Conditions' },
    { to: '/shipping-policy', label: 'Shipping Policy' },
    { to: '/privacy-policy', label: 'Privacy Policy' },
    { to: '/contact', label: 'Contact' },
  ],
  sections: [
    { id: 'cancellation', label: 'Order cancellation' },
    { id: 'eligibility', label: 'Refund eligibility' },
    { id: 'process', label: 'Refund process' },
    { id: 'damaged', label: 'Damaged products' },
    { id: 'returns', label: 'Return conditions' },
    { id: 'timelines', label: 'Refund timelines' },
    { id: 'support', label: 'Customer support' },
  ],
  cancellation: [
    {
      kicker: 'Before packing',
      title: 'Before an order is packed',
      copy: 'Contact us with your order number as soon as possible. If the order has not been packed, we will usually cancel it and refund the payment.',
    },
    {
      kicker: 'After dispatch',
      title: 'After dispatch',
      copy: 'Once an order has left Coimbatore, cancellation is usually not possible. We can help you refuse delivery or arrange a return where eligible.',
    },
    {
      kicker: 'How to ask',
      title: 'How to request a cancellation',
      copy: 'Email or WhatsApp us with your order number and reason. We will confirm the outcome in writing.',
    },
  ],
  eligibility: [
    {
      kicker: 'Review',
      title: 'Possible reasons for review',
      copy: 'We review requests for wrong items, missing items, damaged parcels, and clear quality concerns.',
    },
    {
      kicker: 'Food',
      title: 'Nutri-Hub food products',
      copy: 'Because many Nutri-Hub products are food, opened or perishable items may not be returnable for hygiene reasons. Damaged or incorrect deliveries are still reviewed.',
    },
    {
      kicker: 'Self-Care',
      title: 'Self-Care products',
      copy: 'Handmade soaps and other Self-Care items should usually be unused and in original packing for a return, unless the item arrived damaged.',
    },
    {
      kicker: 'Change of mind',
      title: 'Change of mind',
      copy: 'Change-of-mind returns are limited for food and opened personal-care items. Contact support and we will tell you what is possible for your order.',
    },
  ],
  steps: [
    {
      number: '01',
      title: 'Tell us about the order',
      copy: 'Share your order number, the product, and what went wrong. Photos help when an item is damaged or incorrect.',
    },
    {
      number: '02',
      title: 'We review the request',
      copy: 'We look into the order details and reply with the next step — refund, replacement, or another resolution.',
    },
    {
      number: '03',
      title: 'Outcome',
      copy: 'Where a refund or replacement is due, we will confirm it clearly before taking action.',
    },
    {
      number: '04',
      title: 'If a refund is due',
      copy: 'Approved refunds are returned to the original payment method wherever the payment partner allows.',
    },
  ],
  damaged: [
    {
      kicker: 'Promptly',
      title: 'Tell us promptly',
      copy: 'Please contact us soon after delivery if something arrives damaged. Keep packaging and photos ready.',
    },
    {
      kicker: 'Evidence',
      title: 'What we may ask for',
      copy: 'We may ask for photos of the product, packaging, and order number so we can look into it with the courier if needed.',
    },
    {
      kicker: 'Resolution',
      title: 'Replacement or refund',
      copy: 'Depending on stock and the issue, we may offer a replacement, a refund, or another practical resolution.',
    },
  ],
  returns: [
    {
      kicker: 'Condition',
      title: 'Condition of goods',
      copy: 'Returned items should usually be unused and in original packing unless we agree otherwise for a damaged delivery.',
    },
    {
      kicker: 'Food & care',
      title: 'Food and handmade care',
      copy: 'Edible products and handmade soaps are assessed with hygiene and safety in mind. Contact support before returning these items.',
    },
    {
      kicker: 'Shipping',
      title: 'Return shipping',
      copy: 'If the return is due to our error or damage in transit, we will arrange or cover return shipping where possible. Otherwise return shipping may be your responsibility.',
    },
  ],
  timelines: [
    {
      kicker: 'Review',
      title: 'Review time',
      copy: 'We aim to review cancellation and refund requests within a few working days of receiving the details we need.',
    },
    {
      kicker: 'Refund',
      title: 'After a refund is approved',
      copy: 'Once approved, refunds are initiated promptly. Banks and UPI providers may take additional time to show the credit.',
    },
    {
      kicker: 'Updates',
      title: 'How you will hear from us',
      copy: 'We update you by email or WhatsApp, and you can also check status in My Orders.',
    },
  ],
  supportNote: contact.replyNote,
}

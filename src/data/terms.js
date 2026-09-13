export const terms = {
  eyebrow: 'Policies',
  title: 'Terms & Conditions',
  lede: 'Please read these terms before you browse, create an account or place an order with SV Hub.',
  effectiveDate: '1 September 2026',
  lastUpdated: '1 September 2026',
  draftLabel: 'Draft for V1',
  draftNotice:
    'This is placeholder copy for design and review. The final Terms & Conditions will be supplied and approved by SV Hub before this page goes live. Until then, nothing here should be treated as a binding legal statement.',
  related: [
    { to: '/privacy-policy', label: 'Privacy Policy' },
    { to: '/shipping-policy', label: 'Shipping Policy' },
    { to: '/refund-policy', label: 'Refund Policy' },
    { to: '/contact', label: 'Contact' },
  ],
  sections: [
    {
      id: 'agreement',
      number: '1',
      title: 'Agreement to these terms',
      blocks: [
        'These Terms & Conditions (“Terms”) are a draft outline of the agreement between you and SV Hub (Sadhguru Veera’s) when you use svhub.in, create an account, or place an order.',
      ],
      subsections: [
        {
          id: 'agreement-binding',
          number: '1.1',
          title: 'When these terms apply',
          blocks: [
            'By using this website or placing an order, you agree to these Terms. If you do not agree, please do not use the site or place an order.',
          ],
        },
        {
          id: 'agreement-related',
          number: '1.2',
          title: 'Related policies',
          blocks: [
            {
              parts: [
                'These Terms should be read together with our ',
                { to: '/privacy-policy', label: 'Privacy Policy' },
                ', ',
                { to: '/shipping-policy', label: 'Shipping Policy' },
                ' and ',
                { to: '/refund-policy', label: 'Refund Policy' },
                '. Where a dedicated policy covers a subject in more detail, that policy will apply to that subject once it is approved and published.',
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'about',
      number: '2',
      title: 'About SV Hub',
      blocks: [
        'SV Hub is an organic food and natural self-care brand based in Coimbatore, Tamil Nadu. We sell Nutri-Hub products (organic staples, native grains, thokku, masalas, sweets, savouries and daily meals) and Self-Care products (handmade soaps).',
        'References to “we”, “us” and “our” mean SV Hub. References to “you” mean the person using this website or placing an order.',
      ],
    },
    {
      id: 'eligibility',
      number: '3',
      title: 'Eligibility',
      blocks: [
        'You should be 18 years or older, and able to enter a contract under Indian law, to create an account or place an order.',
        'If you order on behalf of a household, you confirm that you are authorised to do so.',
      ],
    },
    {
      id: 'account',
      number: '4',
      title: 'Your account',
      subsections: [
        {
          id: 'account-create',
          number: '4.1',
          title: 'Creating an account',
          blocks: [
            'Some features, including checkout and saved addresses, may require an account. You agree to give information that is accurate and to keep it up to date in My Account.',
          ],
        },
        {
          id: 'account-security',
          number: '4.2',
          title: 'Account security',
          blocks: [
            'You are responsible for keeping your password private and for activity on your account. Please tell us promptly if you think someone else has used it.',
            {
              parts: [
                'You may sign in with email and password or with Google Sign-In, as described on our ',
                { to: '/login', label: 'Login' },
                ' and ',
                { to: '/register', label: 'Register' },
                ' pages.',
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'products',
      number: '5',
      title: 'Products and information',
      subsections: [
        {
          id: 'products-catalogue',
          number: '5.1',
          title: 'Catalogue and descriptions',
          blocks: [
            'Product names, images, ingredients, weights and prices on this website are shown in good faith. Native and regional names are kept as they are used at home — for example Venthaya Thokku or Kasthuri Manjal Soap.',
            'We may correct errors, update descriptions, or withdraw a product at any time. Dummy catalogue data used in V1 will be replaced with the client’s live products without changing this layout.',
          ],
        },
        {
          id: 'products-care',
          number: '5.2',
          title: 'Food and self-care',
          blocks: [
            'Our food and handmade soaps are traditional, natural products. They are not medicines. Nothing on this website is a medical, clinical or therapeutic claim.',
            'Please read ingredient lists if you have allergies or dietary needs. If you are unsure, write to us before you order.',
          ],
        },
      ],
    },
    {
      id: 'orders',
      number: '6',
      title: 'Orders',
      subsections: [
        {
          id: 'orders-placing',
          number: '6.1',
          title: 'Placing an order',
          blocks: [
            'An order is an offer to buy. Adding items to your cart does not reserve stock. We may accept or decline an order, for example if a product is unavailable, a price is listed in error, or we cannot deliver to your address.',
          ],
        },
        {
          id: 'orders-acceptance',
          number: '6.2',
          title: 'Acceptance',
          blocks: [
            'A contract is formed when we confirm the order after successful payment, or as otherwise stated in the approved terms. You will receive an order number and payment status on the order confirmation page and in My Orders.',
          ],
        },
        {
          id: 'orders-availability',
          number: '6.3',
          title: 'Availability',
          blocks: [
            'If an item cannot be fulfilled after you pay, we will contact you and, where appropriate, refund that item in line with the approved refund policy.',
          ],
        },
      ],
    },
    {
      id: 'payment',
      number: '7',
      title: 'Prices and payment',
      subsections: [
        {
          id: 'payment-prices',
          number: '7.1',
          title: 'Prices',
          blocks: [
            'Prices are shown in Indian Rupees (INR) and include applicable taxes unless we say otherwise. A listed original price and discount, where shown, are for that product at the time you view it.',
            'Delivery charges, if any, will be shown before you pay.',
          ],
        },
        {
          id: 'payment-method',
          number: '7.2',
          title: 'Payment',
          blocks: [
            'Payment is intended to be processed securely through Razorpay. SV Hub does not store full card numbers on this website.',
            'If a payment fails, the order is not confirmed. You may try again from checkout or return to your cart.',
          ],
        },
      ],
    },
    {
      id: 'delivery',
      number: '8',
      title: 'Delivery',
      blocks: [
        {
          parts: [
            'We currently fulfil orders from Coimbatore, Tamil Nadu. Delivery areas, timeframes and charges will be set out in the ',
            { to: '/shipping-policy', label: 'Shipping Policy' },
            ' once that page is approved.',
          ],
        },
        'You are responsible for providing a complete and accurate delivery address. Risk in the goods passes as described in the approved shipping terms.',
      ],
    },
    {
      id: 'returns',
      number: '9',
      title: 'Cancellations, returns and refunds',
      blocks: [
        {
          parts: [
            'How you may cancel an order, return a product, or receive a refund will be described in the ',
            { to: '/refund-policy', label: 'Refund Policy' },
            '. Food and handmade care items may have specific rules for hygiene and perishability.',
          ],
        },
        'Until that policy is approved, please write to us if you need help with an order.',
      ],
    },
    {
      id: 'use',
      number: '10',
      title: 'Use of the website',
      blocks: [
        'You agree to use svhub.in only for lawful purposes and in a way that does not harm the site, other customers, or SV Hub.',
        {
          list: [
            'Do not attempt to access accounts, data or systems you are not authorised to use',
            'Do not copy, scrape or resell catalogue content except as allowed by law',
            'Do not misuse checkout, payments, or promotional offers',
            'Do not post or send content that is unlawful, misleading or harmful',
          ],
        },
      ],
    },
    {
      id: 'ip',
      number: '11',
      title: 'Intellectual property',
      blocks: [
        'The SV Hub name, logo, product photography, copy and website design belong to SV Hub or our licensors. You may view and use the site to browse and shop. You may not copy, modify or use our brand or content for another business without our written permission.',
      ],
    },
    {
      id: 'disclaimer',
      number: '12',
      title: 'Disclaimer',
      blocks: [
        'Products are offered as traditional food and handmade self-care. We do not promise any particular health outcome. Information on the site is for general shopping guidance only.',
        'The website is provided as available. We may suspend or change it for maintenance, updates or reasons beyond our control.',
      ],
    },
    {
      id: 'liability',
      number: '13',
      title: 'Limitation of liability',
      blocks: [
        'The approved terms will describe the limits of our liability under Indian law, including for delay, unavailability, or loss that we could not reasonably have avoided.',
        'Nothing in the final terms will exclude liability that cannot be excluded by law, including for fraud or personal injury caused by negligence.',
      ],
    },
    {
      id: 'privacy',
      number: '14',
      title: 'Privacy',
      blocks: [
        {
          parts: [
            'How we collect and use personal information is described in our ',
            { to: '/privacy-policy', label: 'Privacy Policy' },
            '. By using the site you acknowledge that draft policy. The approved policy will replace it.',
          ],
        },
      ],
    },
    {
      id: 'changes',
      number: '15',
      title: 'Changes to these terms',
      blocks: [
        'When the client-approved Terms are published, we will update the effective date on this page. If we make important changes later, we will revise this page and, where appropriate, notify account holders.',
        'The version dated on this page is the one that applies to new orders placed after that date.',
      ],
    },
    {
      id: 'law',
      number: '16',
      title: 'Governing law',
      blocks: [
        'These Terms are intended to be governed by the laws of India. Disputes will be subject to the courts of Coimbatore, Tamil Nadu, unless the approved terms say otherwise.',
      ],
    },
    {
      id: 'contact',
      number: '17',
      title: 'Contact',
      blocks: [
        {
          parts: [
            'For questions about these Terms, write to ',
            { href: 'mailto:sgveeras.info@gmail.com', label: 'sgveeras.info@gmail.com' },
            ', call ',
            { href: 'tel:+919346399677', label: '+91 93463 99677' },
            ', or use our ',
            { to: '/contact', label: 'Contact' },
            ' page.',
          ],
        },
        'SV Hub · Coimbatore, Tamil Nadu',
      ],
    },
  ],
}

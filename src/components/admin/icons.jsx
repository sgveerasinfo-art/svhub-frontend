export function Icon({ name, size = 18 }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    'aria-hidden': 'true',
  }

  switch (name) {
    case 'dashboard':
      return (
        <svg {...common}>
          <path d="M4 4h7v9H4V4Zm9 0h7v5h-7V4ZM4 15h7v5H4v-5Zm9-4h7v9h-7v-9Z" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      )
    case 'orders':
      return (
        <svg {...common}>
          <path d="M7 7h13l-1.4 8.2a2 2 0 0 1-2 1.8H9.2a2 2 0 0 1-2-1.6L6 4H3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="9" cy="20" r="1.2" fill="currentColor" />
          <circle cx="17" cy="20" r="1.2" fill="currentColor" />
        </svg>
      )
    case 'products':
      return (
        <svg {...common}>
          <path d="M4 8.5 12 4l8 4.5v7L12 20l-8-4.5v-7Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M12 12v8M12 12 4 8.5M12 12l8-3.5" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      )
    case 'inventory':
      return (
        <svg {...common}>
          <path d="M4 7h16v12H4V7Z" stroke="currentColor" strokeWidth="1.6" />
          <path d="M4 11h16M9 7V5h6v2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      )
    case 'categories':
      return (
        <svg {...common}>
          <path d="M4 6h7l2 2h7v10H4V6Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        </svg>
      )
    case 'customers':
      return (
        <svg {...common}>
          <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.6" />
          <path d="M4 19c.6-3 2.8-5 5-5s4.4 2 5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="17" cy="9" r="2.2" stroke="currentColor" strokeWidth="1.6" />
          <path d="M16.2 14.2c1.8.4 3.3 1.8 3.8 4.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      )
    case 'settings':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
          <path d="M12 4v2.2M12 17.8V20M4 12h2.2M17.8 12H20M6.3 6.3l1.6 1.6M16.1 16.1l1.6 1.6M17.7 6.3l-1.6 1.6M7.9 16.1l-1.6 1.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      )
    case 'search':
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.6" />
          <path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      )
    case 'menu':
      return (
        <svg {...common}>
          <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      )
    case 'close':
      return (
        <svg {...common}>
          <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      )
    case 'plus':
      return (
        <svg {...common}>
          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      )
    case 'edit':
      return (
        <svg {...common}>
          <path d="M4 20h4L19 9l-4-4L4 16v4Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        </svg>
      )
    case 'trash':
      return (
        <svg {...common}>
          <path d="M5 7h14M10 7V5h4v2M8 7l.8 12h6.4L16 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'external':
      return (
        <svg {...common}>
          <path d="M9 5H5v14h14v-4M12 12 20 4M14 4h6v6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'alert':
      return (
        <svg {...common}>
          <path d="M12 8v5M12 16.5v.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          <path d="M12 4 3.6 19h16.8L12 4Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        </svg>
      )
    case 'check':
      return (
        <svg {...common}>
          <path d="m5 12 5 5 9-10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'store':
      return (
        <svg {...common}>
          <path d="M4 10h16v10H4V10ZM4 10l1.5-5h13L20 10M9 20v-6h6v6" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        </svg>
      )
    case 'logout':
      return (
        <svg {...common}>
          <path d="M10 4H6v16h4M10 12h10M16 8l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'bell':
      return (
        <svg {...common}>
          <path d="M6 9a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 13 6 9Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M10 18.5a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      )
    case 'chevron':
      return (
        <svg {...common}>
          <path d="m7 10 5 5 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'refresh':
      return (
        <svg {...common}>
          <path d="M20 12a8 8 0 1 1-2.2-5.5M20 4v5h-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'arrow':
      return (
        <svg {...common}>
          <path d="M5 12h12M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'eye':
      return (
        <svg {...common}>
          <path d="M2.5 12S6 6.5 12 6.5 21.5 12 21.5 12 18 17.5 12 17.5 2.5 12 2.5 12Z" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="12" cy="12" r="2.4" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      )
    case 'eye-off':
      return (
        <svg {...common}>
          <path d="M4 5.5 19.5 21M9.2 9.4A3.2 3.2 0 0 0 12 15.2M6.2 7.8C4.2 9.2 2.8 11.2 2.5 12c0 0 3.5 5.5 9.5 5.5 1.5 0 2.8-.3 4-.8M10.2 6.7c.6-.1 1.2-.2 1.8-.2 6 0 9.5 5.5 9.5 5.5-.4.7-1.1 1.8-2.1 2.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      )
    case 'more':
      return (
        <svg {...common}>
          <circle cx="6" cy="12" r="1.35" fill="currentColor" />
          <circle cx="12" cy="12" r="1.35" fill="currentColor" />
          <circle cx="18" cy="12" r="1.35" fill="currentColor" />
        </svg>
      )
    case 'upload':
      return (
        <svg {...common}>
          <path d="M12 16V7M8.5 10 12 6.5 15.5 10M5 18h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'printer':
      return (
        <svg {...common}>
          <path d="M6 9V4h12v5M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6 14h12v7H6v-7Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          <circle cx="18" cy="12" r="1" fill="currentColor" />
        </svg>
      )
    case 'copy':
      return (
        <svg {...common}>
          <rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.6" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      )
    case 'map-pin':
      return (
        <svg {...common}>
          <path d="M12 21s-7-5.5-7-11.5a7 7 0 0 1 14 0C19 15.5 12 21 12 21Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="12" cy="9.5" r="2.5" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      )
    case 'credit-card':
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M3 10h18M7 15h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      )
    case 'phone':
      return (
        <svg {...common}>
          <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'mail':
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" />
          <path d="m3 7 9 6 9-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'truck':
      return (
        <svg {...common}>
          <path d="M1 3h14v13H1V3Zm14 5h4l3 3v5h-7V8Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          <circle cx="5.5" cy="18.5" r="2.5" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="17.5" cy="18.5" r="2.5" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      )
    case 'package':
      return (
        <svg {...common}>
          <path d="m12 3 9 4.5v9L12 21l-9-4.5v-9L12 3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M12 12v9M12 12 3 7.5M12 12l9-4.5" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      )
    case 'user':
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.6" />
          <path d="M5 20c.5-4 3.5-6 7-6s6.5 2 7 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      )
    default:
      return null
  }
}

/**
 * Shared site navigation — single source for header + mobile menu.
 * Active state must come from the router (NavLink / pathname), never local click state.
 */

export const homeLink = { to: '/', label: 'Home', end: true }

/** Primary shopping destinations — visually grouped in the header */
export const primaryDestinations = [
  { to: '/shop', label: 'Shop', featured: true },
  { to: '/nutri-hub', label: 'Nutri-Hub' },
  { to: '/self-care', label: 'Self-Care' },
]

/** Secondary / informational */
export const secondaryLinks = [
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
]

/** Flat list (legacy / simple consumers) */
export const mainNavLinks = [homeLink, ...primaryDestinations, ...secondaryLinks]

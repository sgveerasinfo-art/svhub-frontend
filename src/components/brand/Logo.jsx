import { Link } from 'react-router-dom'
import { LOGO_ALT, LOGO_SRC } from '../../data/brand.js'
import './Logo.css'

function Logo({ variant = 'light', compact = false, to = '/' }) {
  return (
    <Link
      to={to}
      className={`logo logo--${variant}${compact ? ' logo--compact' : ''}`}
      aria-label="SV Hub home"
    >
      <img
        className="logo__img"
        src={LOGO_SRC}
        alt={LOGO_ALT}
        width={1024}
        height={1024}
        decoding="async"
        fetchPriority="high"
      />
    </Link>
  )
}

export default Logo

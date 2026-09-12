import { Link } from 'react-router-dom'
import Reveal from '../../components/ui/Reveal.jsx'
import { finalCta } from '../../data/home.js'
import { images } from '../../data/images.js'
import { LOGO_ALT, LOGO_SRC } from '../../data/brand.js'
import './FinalCta.css'

function splitHeadline(text) {
  const match = text.match(/^(Bring Native)\s+(Goodness Home\.?)$/i)
  if (match) {
    return (
      <>
        <span className="close__line">{match[1]}</span>
        <span className="close__line close__line--accent">{match[2]}</span>
      </>
    )
  }

  return text
}

function CloseArrow() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M3.5 9h11M10.5 5l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function FinalCta() {
  return (
    <section className="close" aria-label="Shop SV Hub">
      <div className="close__media" data-speed="0.2" aria-hidden="true">
        <img src={images.farmland} alt="" />
        <span className="close__veil" />
        <span className="close__grain" />
      </div>

      <span className="close__watermark" aria-hidden="true">
        Goodness
      </span>

      <div className="home-container close__layout">
        <Reveal className="close__main">
          <p className="close__eyebrow">{finalCta.eyebrow}</p>
          <h2>{splitHeadline(finalCta.headline)}</h2>
          <p className="close__note" aria-hidden="true">
            from our roots to your home
            <svg viewBox="0 0 36 16" fill="none">
              <path
                d="M2 11c8-1 14-7 22-7.2 3.4-.1 6.8 1.6 10 4.8"
                stroke="currentColor"
                strokeWidth="1.35"
                strokeLinecap="round"
              />
              <path
                d="M28.4 4.4 34 8.8l-6.2 2"
                stroke="currentColor"
                strokeWidth="1.35"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </p>
          <p className="close__copy">{finalCta.copy}</p>

          <div className="close__actions">
            <Link to={finalCta.primary.to} className="close__primary">
              <span>{finalCta.primary.label}</span>
              <CloseArrow />
            </Link>
            <Link to={finalCta.secondary.to} className="close__secondary">
              {finalCta.secondary.label}
            </Link>
          </div>
        </Reveal>

        <Reveal className="close__seal" delay={180}>
          <p className="close__index">
            01
            <span aria-hidden="true"> — </span>
            2026
          </p>
          <img className="close__brand" src={LOGO_SRC} alt={LOGO_ALT} width={1024} height={1024} decoding="async" />
          <p className="close__seal-copy">Rooted in tradition</p>
        </Reveal>
      </div>
    </section>
  )
}

export default FinalCta

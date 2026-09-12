import { Link } from 'react-router-dom'
import { heroContent } from '../../data/home.js'
import { primaryDestinations } from '../../data/navigation.js'
import './Hero.css'

function Star({ className }) {
  return (
    <svg className={className} width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
      <path d="M5 1v8M1 5h8" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    </svg>
  )
}

function GoodnessMark() {
  return (
    <span className="hero__goodness">
      Goodness
      <svg viewBox="0 0 152 16" fill="none" aria-hidden="true" focusable="false">
        <path
          d="M3.2 10.4c14.2-5.6 27.8 3.8 42.1 1.2 16.4-3 31.2-8.6 48-4.6 13.2 3.1 25.6 7.4 39.4 3.4 10.6-3.1 13.8-5.8 16.8-2.8"
          stroke="currentColor"
          strokeWidth="1.55"
          strokeLinecap="round"
        />
      </svg>
    </span>
  )
}

function HeroTitle({ text }) {
  const parts = String(text).split(/(Goodness)/i)
  return parts.map((part, index) =>
    /^Goodness$/i.test(part) ? <GoodnessMark key={`goodness-${index}`} /> : <span key={`t-${index}`}>{part}</span>,
  )
}

/** Existing premium homepage hero — default / fallback. */
function NormalHero() {
  return (
    <section className="hero" aria-labelledby="home-hero-heading">
      <div className="hero__top">
        <div className="hero__layer" aria-hidden="true" />

        <div className="hero__content">
          <Star className="hero__star hero__star--a" />
          <Star className="hero__star hero__star--b" />
          <Star className="hero__star hero__star--c" />
          <Star className="hero__star hero__star--d" />

          <p className="hero__eyebrow">{heroContent.eyebrow}</p>
          <h1 id="home-hero-heading">
            <HeroTitle text={heroContent.title} />
          </h1>
          <p className="hero__description">{heroContent.copy}</p>
          <Link to={heroContent.ctaTo} className="hero__button">
            {heroContent.cta}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M3 8h10M9 4l4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>

          <nav className="hero__destinations" aria-label="Explore destinations">
            {primaryDestinations.map((link) => (
              <Link key={link.to} to={link.to} className="hero__destination">
                {link.label}
                <span aria-hidden="true">→</span>
              </Link>
            ))}
          </nav>
        </div>
      </div>

      <div className="hero__image" data-speed="0.18">
        <img src={heroContent.image} alt={heroContent.imageAlt} />
      </div>
    </section>
  )
}

export default NormalHero

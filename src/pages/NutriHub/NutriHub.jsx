import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  nutriHubCategories,
  nutriHubClose,
  nutriHubFeatured,
  nutriHubFeaturedIntro,
  nutriHubIntro,
  nutriHubPantry,
  nutriHubStory,
} from '../../data/nutriHub.js'
import { getProducts } from '../../api/products.js'
import ShopProduct from '../Shop/ShopProduct.jsx'
import './NutriHub.css'

function Arrow({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 12h14M13 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function NutriHero() {
  return (
    <section className="nh-hero" aria-labelledby="nutri-hero-heading">
      <div className="nh-hero__media" aria-hidden="true">
        <img src={nutriHubIntro.image} alt="" fetchPriority="high" />
      </div>
      <div className="nh-hero__copy">
        <p className="nh-hero__eyebrow">{nutriHubIntro.eyebrow}</p>
        <h1 id="nutri-hero-heading">
          Rooted in Tradition,
          <br className="nh-hero__break" />
          {' '}
          Made for Every Day.
        </h1>
        <p className="nh-hero__text">{nutriHubIntro.copy}</p>
        <Link to={nutriHubIntro.ctaTo} className="nh-hero__cta">
          {nutriHubIntro.cta}
        </Link>
      </div>
    </section>
  )
}

function NutriPantry() {
  return (
    <section className="nh-pantry" aria-labelledby="nutri-pantry-heading">
      <div className="nh-wrap">
        <div className="nh-pantry__intro">
          <h2 id="nutri-pantry-heading">{nutriHubPantry.title}</h2>
          <p>{nutriHubPantry.copy}</p>
        </div>

        <ul className="nh-pantry__grid">
          {nutriHubCategories.map((category, index) => (
            <li key={category.id} className={index === 0 ? 'is-lead' : undefined}>
              <Link to={category.to} className="nh-pantry__card" aria-label={`Explore ${category.displayName}`}>
                <img src={category.image} alt="" loading="lazy" decoding="async" />
                <span className="nh-pantry__veil" />
                <span className="nh-pantry__label">
                  <span className="nh-pantry__name">{category.displayName}</span>
                  {index === 0 ? (
                    <span className="nh-pantry__explore">
                      {nutriHubPantry.explore}
                      <Arrow size={18} />
                    </span>
                  ) : null}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function NutriFeatured() {
  const [items, setItems] = useState(nutriHubFeatured)

  useEffect(() => {
    let cancelled = false
    getProducts({ storefront: 'nutri-hub', limit: 4 })
      .then((res) => {
        if (!cancelled && res?.data?.length) {
          setItems(res.data.slice(0, 4))
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section className="nh-featured" aria-labelledby="nutri-featured-heading">
      <div className="nh-wrap">
        <div className="nh-featured__head">
          <p className="nh-kicker">{nutriHubFeaturedIntro.eyebrow}</p>
          <h2 id="nutri-featured-heading">{nutriHubFeaturedIntro.title}</h2>
          <Link to={nutriHubFeaturedIntro.ctaTo} className="nh-featured__all">
            {nutriHubFeaturedIntro.cta}
            <Arrow size={18} />
          </Link>
        </div>

        <ul className="nh-product-grid">
          {items.map((product, index) => (
            <li key={product.id || product.slug}>
              <ShopProduct product={product} index={index} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function NutriStory() {
  return (
    <section className="nh-story" aria-labelledby="nutri-story-heading">
      <div className="nh-wrap nh-story__grid">
        <div className="nh-story__copy">
          <p className="nh-kicker">{nutriHubStory.eyebrow}</p>
          <h2 id="nutri-story-heading">{nutriHubStory.title}</h2>
          {nutriHubStory.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          <Link to={nutriHubStory.ctaTo} className="nh-story__cta">
            {nutriHubStory.cta}
          </Link>
        </div>
        <figure className="nh-story__figure">
          <img src={nutriHubStory.image} alt={nutriHubStory.imageAlt} loading="lazy" decoding="async" />
        </figure>
      </div>
    </section>
  )
}

function NutriClose() {
  return (
    <section className="nh-close" aria-labelledby="nutri-close-heading">
      <div className="nh-close__media" aria-hidden="true">
        <img src={nutriHubClose.image} alt="" loading="lazy" decoding="async" />
      </div>
      <div className="nh-close__copy">
        <h2 id="nutri-close-heading">{nutriHubClose.headline}</h2>
        <Link to={nutriHubClose.ctaTo} className="nh-close__cta">
          {nutriHubClose.cta}
        </Link>
      </div>
    </section>
  )
}

function NutriHub() {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="nh">
      <NutriHero />
      <NutriPantry />
      <NutriFeatured />
      <NutriStory />
      <NutriClose />
    </div>
  )
}

export default NutriHub

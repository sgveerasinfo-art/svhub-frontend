import { useEffect, useState } from 'react'
import Reveal from '../../components/ui/Reveal.jsx'
import {
  selfCareClose,
  selfCareCollectionIntro,
  selfCareIntro,
  selfCareProducts,
  selfCareStory,
} from '../../data/selfCare.js'
import { getProducts } from '../../api/products.js'
import HomeScroll from '../Home/HomeScroll.jsx'
import '../Home/Home.css'
import ShopProduct from '../Shop/ShopProduct.jsx'
import './SelfCare.css'

function Arrow({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M3 8h10M9.5 4.5 13 8l-3.5 3.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function splitHero(text) {
  const comma = text.indexOf(',')
  if (comma === -1) return text
  return (
    <>
      {text.slice(0, comma + 1)}
      <br />
      {text.slice(comma + 1).trim()}
    </>
  )
}

function CareHero() {
  return (
    <section className="sc-hero" aria-labelledby="self-care-hero-heading">
      <div className="sc-hero__media" aria-hidden="true">
        <img src={selfCareIntro.image} alt="" fetchPriority="high" />
        <span className="sc-hero__veil" />
      </div>

      <div className="sc-hero__copy">
        <p className="sc-hero__eyebrow">{selfCareIntro.eyebrow}</p>
        <h1 id="self-care-hero-heading">{splitHero(selfCareIntro.title)}</h1>
        <p className="sc-hero__text">{selfCareIntro.copy}</p>
        <a href={selfCareIntro.ctaHref} className="sc-btn sc-btn--leaf">
          {selfCareIntro.cta}
        </a>
      </div>
    </section>
  )
}

function CareCollection() {
  const [items, setItems] = useState(selfCareProducts)

  useEffect(() => {
    let cancelled = false
    getProducts({ storefront: 'self-care', limit: 12 })
      .then((res) => {
        if (!cancelled && res?.data?.length) {
          setItems(res.data)
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section
      id="handmade-soaps"
      className="sc-collection"
      aria-labelledby="self-care-collection-heading"
    >
      <div className="home-container">
        <Reveal className="sc-collection__intro">
          <h2 id="self-care-collection-heading">{selfCareCollectionIntro.title}</h2>
          <span className="sc-rule" aria-hidden="true" />
          <p>{selfCareCollectionIntro.copy}</p>
        </Reveal>

        {items.length ? (
          <Reveal as="ul" className="home-stagger sc-grid">
            {items.map((product, index) => (
              <li key={product.id || product.slug}>
                <ShopProduct product={product} index={index} />
              </li>
            ))}
          </Reveal>
        ) : (
          <div className="sc-empty">
            <p className="sc-eyebrow">Coming soon</p>
            <h3>These handmade soaps are being prepared.</h3>
            <p>Return shortly, or browse the rest of the shop while this collection is set out.</p>
          </div>
        )}
      </div>
    </section>
  )
}

function CareStory() {
  return (
    <section className="sc-story" aria-labelledby="self-care-story-heading">
      <span className="sc-story__glow" aria-hidden="true" />
      <div className="home-container sc-story__layout">
        <Reveal className="sc-story__copy">
          <p className="sc-eyebrow">{selfCareStory.eyebrow}</p>
          <h2 id="self-care-story-heading">{selfCareStory.title}</h2>
          <span className="sc-rule sc-rule--terracotta" aria-hidden="true" />
          <p className="sc-story__lede">{selfCareStory.lede}</p>
          <p className="sc-story__text">{selfCareStory.copy}</p>
          <a href={selfCareStory.ctaHref} className="sc-story__link">
            {selfCareStory.cta}
            <Arrow size={14} />
          </a>
        </Reveal>

        <Reveal className="sc-story__visual" delay={80}>
          <figure className="sc-story__figure">
            <img src={selfCareStory.figure.src} alt={selfCareStory.figure.alt} loading="lazy" decoding="async" />
          </figure>
          <aside className="sc-story__card">
            <h3>{selfCareStory.cardTitle}</h3>
            <p>{selfCareStory.cardCopy}</p>
          </aside>
        </Reveal>
      </div>
    </section>
  )
}

function CareClose() {
  return (
    <section className="sc-close" aria-labelledby="self-care-close-heading">
      <span className="sc-close__dots" aria-hidden="true" />
      <div className="sc-close__inner">
        <h2 id="self-care-close-heading">{selfCareClose.headline}</h2>
        <p>{selfCareClose.copy}</p>
        <a href={selfCareClose.ctaHref} className="sc-btn sc-btn--clay">
          {selfCareClose.cta}
        </a>
      </div>
    </section>
  )
}

function SelfCare() {
  useEffect(() => {
    if (window.location.hash) {
      const node = document.querySelector(window.location.hash)
      node?.scrollIntoView()
      return
    }
    window.scrollTo(0, 0)
  }, [])

  return (
    <HomeScroll>
      <div className="sc">
        <CareHero />
        <CareCollection />
        <CareStory />
        <CareClose />
      </div>
    </HomeScroll>
  )
}

export default SelfCare

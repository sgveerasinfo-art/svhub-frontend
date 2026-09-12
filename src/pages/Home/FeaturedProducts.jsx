import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Reveal from '../../components/ui/Reveal.jsx'
import CartStepper from '../../components/ui/CartStepper.jsx'
import { featuredIntro } from '../../data/home.js'
import { productHref } from '../../data/products.js'
import { getFeaturedProducts } from '../../api/products.js'
import { getStorefront } from '../../data/storefronts.js'
import { handleProductImageError, resolveDisplayProductImage } from '../../utils/productImage.js'
import './FeaturedProducts.css'

const stockLabels = {
  'in-stock': 'In Stock',
  'low-stock': 'Low stock',
  'out-of-stock': 'Out of stock',
}

const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

const layouts = ['anchor', 'lift', 'set', 'drop']

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

function FavouritesNote() {
  return (
    <span className="featured__note">
      <span className="featured__note-label">everyday favourites</span>
      <svg className="featured__note-arrow" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <path
          d="M4 14c3.2-1.8 6.4-5.4 9.8-10.2M13.2 3.2h4.2v4.1"
          stroke="currentColor"
          strokeWidth="1.35"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <svg className="featured__note-mark" viewBox="0 0 168 14" fill="none" aria-hidden="true">
        <path
          d="M2.4 9.6c18.8-4.8 36.2 2.8 55.1.4 16.6-2.1 31.8-6.6 48.4-4.2 14.2 2 27.6 5.8 42.6 2.4 7.4-1.7 14.2-4.2 17.8-1.6"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </svg>
    </span>
  )
}

function FeaturedItem({ product, layout }) {
  const house = getStorefront(product.storefront)
  const showStock = product.stock !== 'in-stock'
  const hasCompare = Boolean(product.originalPrice && product.originalPrice > product.price)
  const productTo = productHref(product)
  const accentColor = house?.accentToken === 'terracotta' ? 'var(--terracotta)' : 'var(--charcoal-green)'

  return (
    <li
      className={`featured-item featured-item--${layout}${house?.accentToken === 'terracotta' ? ' featured-item--terracotta' : ''}${product.discount ? ' featured-item--sale' : ''}`}
      style={{ '--item-accent': accentColor }}
    >
      <article>
        <div className="featured-item__frame">
          <Link
            to={productTo}
            className="featured-item__media"
            data-speed="0.1"
            aria-label={`View ${product.name}`}
          >
            <img
              src={resolveDisplayProductImage(product.image)}
              alt=""
              loading="lazy"
              decoding="async"
              onError={handleProductImageError}
            />
            <span className="featured-item__peek" aria-hidden="true">
              View product
              <Arrow size={13} />
            </span>
          </Link>
          {product.discount ? (
            <p className="featured-item__sale">
              <span>{product.discount}% off</span>
            </p>
          ) : null}
          <div className="featured-item__step">
            <CartStepper product={product} />
          </div>
        </div>

        <div className="featured-item__body">
          <p className="featured-item__type">{product.type}</p>
          <h3 className="featured-item__name">
            <Link to={productTo}>{product.name}</Link>
          </h3>
          <p className="featured-item__meta">
            <span className="featured-item__price">
              {hasCompare ? (
                <s className="featured-item__original">{inr.format(product.originalPrice)}</s>
              ) : null}
              {inr.format(product.price)}
            </span>
            {product.weight ? <span className="featured-item__size">{product.weight}</span> : null}
          </p>
          {showStock ? (
            <p className={`featured-item__stock featured-item__stock--${product.stock}`}>
              {stockLabels[product.stock]}
            </p>
          ) : null}
        </div>
      </article>
    </li>
  )
}

function FeaturedProducts() {
  const [items, setItems] = useState([])

  useEffect(() => {
    let cancelled = false
    getFeaturedProducts(4)
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
    <section className="home-section home-section--white featured" aria-labelledby="featured-heading">
      <div className="home-container">
        <Reveal className="featured__header">
          <div className="featured__heading">
            <p className="featured__eyebrow">{featuredIntro.eyebrow}</p>
            <h2 id="featured-heading" className="featured__title">
              {featuredIntro.title}
            </h2>
            <FavouritesNote />
          </div>
          <p className="featured__copy">{featuredIntro.copy}</p>
        </Reveal>

        <Reveal as="ul" className="home-stagger featured__showcase">
          {items.map((product, index) => (
            <FeaturedItem
              key={product.id || product.slug}
              product={product}
              layout={layouts[index] ?? 'set'}
            />
          ))}
        </Reveal>

        <Reveal className="featured__footer" delay={80}>
          <Link to={featuredIntro.ctaTo} className="featured__explore">
            {featuredIntro.cta}
            <Arrow size={15} />
          </Link>
        </Reveal>
      </div>
    </section>
  )
}

export default FeaturedProducts

import { Link } from 'react-router-dom'
import CartStepper from '../../components/ui/CartStepper.jsx'
import { productHref } from '../../data/products.js'
import { getStorefront } from '../../data/storefronts.js'
import { formatPrice } from '../../utils/money.js'
import { handleProductImageError, resolveDisplayProductImage } from '../../utils/productImage.js'
import './SearchProduct.css'

const stockLabels = {
  'in-stock': 'In stock',
  'low-stock': 'Low stock',
  'out-of-stock': 'Out of stock',
}

function Arrow({ size = 13 }) {
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

function SearchProduct({ product, index }) {
  const outOfStock = product.stock === 'out-of-stock'
  const house = getStorefront(product.storefront)
  const hasCompare = Boolean(product.originalPrice && product.originalPrice > product.price)
  const productTo = productHref(product)
  const accent = house?.accentToken === 'terracotta' ? 'terracotta' : 'espresso'
  const accentColor = house?.accentToken === 'terracotta' ? 'var(--terracotta)' : 'var(--charcoal-green)'

  return (
    <article
      className={`find-card find-card--${accent}${outOfStock ? ' is-unavailable' : ''}`}
      style={{ '--card-accent': accentColor, '--item-accent': accentColor }}
    >
      <p className="find-card__index" aria-hidden="true">
        {String(index + 1).padStart(2, '0')}
      </p>

      <div className="find-card__frame">
        <Link to={productTo} className="find-card__media" aria-label={`View ${product.name}`}>
          <img
            src={resolveDisplayProductImage(product.image)}
            alt=""
            loading="lazy"
            decoding="async"
            onError={handleProductImageError}
          />
          <span className="find-card__view">
            View product <Arrow />
          </span>
        </Link>
        <div className="find-card__step">
          <CartStepper product={product} />
        </div>
      </div>

      <div className="find-card__body">
        <p className="find-card__type">{product.type}</p>
        <h3 className="find-card__name">
          <Link to={productTo}>{product.name}</Link>
        </h3>
        {product.stock !== 'in-stock' ? (
          <p className={`find-card__stock find-card__stock--${product.stock}`}>
            {stockLabels[product.stock]}
          </p>
        ) : null}
        <p className="find-card__meta">
          <span className="find-card__price">
            {hasCompare ? (
              <s className="find-card__original">{formatPrice(product.originalPrice)}</s>
            ) : null}
            {formatPrice(product.price)}
          </span>
          {product.weight ? <span className="find-card__weight">{product.weight}</span> : null}
        </p>
      </div>
    </article>
  )
}

export default SearchProduct

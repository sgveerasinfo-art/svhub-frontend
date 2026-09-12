import { Link } from 'react-router-dom'
import CartStepper from './CartStepper.jsx'
import { productHref } from '../../data/products.js'
import { getStorefront } from '../../data/storefronts.js'
import { formatPrice } from '../../utils/money.js'
import { handleProductImageError, resolveDisplayProductImage } from '../../utils/productImage.js'
import './ProductCard.css'

const stockLabels = {
  'low-stock': 'Low stock',
  'out-of-stock': 'Out of stock',
}

function ProductCard({ product }) {
  const house = getStorefront(product.storefront)
  const hasCompare = Boolean(product.originalPrice && product.originalPrice > product.price)
  const productTo = productHref(product)
  const accent = house?.accentToken === 'terracotta' ? 'terracotta' : 'espresso'
  const accentColor = house?.accentToken === 'terracotta' ? 'var(--terracotta)' : 'var(--charcoal-green)'

  return (
    <article
      className={`product-card product-card--${accent}`}
      style={{ '--card-accent': accentColor, '--item-accent': accentColor }}
    >
      <div className="product-card__frame">
        <Link to={productTo} className="product-card__media" aria-label={`View ${product.name}`}>
          <img
            src={resolveDisplayProductImage(product.image)}
            alt=""
            loading="lazy"
            decoding="async"
            onError={handleProductImageError}
          />
        </Link>
        {product.discount ? (
          <p className="product-card__badge">
            <span>{product.discount}% off</span>
          </p>
        ) : null}
        <div className="product-card__step">
          <CartStepper product={product} />
        </div>
      </div>

      <div className="product-card__body">
        <p className="product-card__type">{product.type}</p>
        <h3 className="product-card__name">
          <Link to={productTo}>{product.name}</Link>
        </h3>
        {product.stock !== 'in-stock' ? (
          <p className={`product-card__stock product-card__stock--${product.stock}`}>
            {stockLabels[product.stock]}
          </p>
        ) : null}
        <p className="product-card__meta">
          <span className="product-card__price">
            {hasCompare ? (
              <s className="product-card__original">{formatPrice(product.originalPrice)}</s>
            ) : null}
            {formatPrice(product.price)}
          </span>
          {product.weight ? <span className="product-card__weight">{product.weight}</span> : null}
        </p>
      </div>
    </article>
  )
}

export default ProductCard

import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ProductGallery from '../../components/product/ProductGallery.jsx'
import Button from '../../components/ui/Button.jsx'
import QuantitySelector from '../../components/ui/QuantitySelector.jsx'
import { useCart } from '../../context/CartContext.jsx'
import { getProduct, getRelatedProducts } from '../../api/products.js'
import { getCategoryBySlug } from '../../data/categories.js'
import { getStorefront } from '../../data/storefronts.js'
import { defaultShipping } from '../../data/productDetails.js'
import ShopProduct from '../Shop/ShopProduct.jsx'
import { formatPrice } from '../../utils/money.js'
import './Product.css'

const stockLabels = {
  'in-stock': 'In stock',
  'low-stock': 'Low stock',
  'out-of-stock': 'Out of stock',
}

const PAGE_TITLE = 'SV Hub — Pure Native Goodness'

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

function IconCheck() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8.25" stroke="currentColor" strokeWidth="1.6" />
      <path d="m8.8 12.2 2.2 2.2 4.3-4.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function IconShip() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 7.5h11v8H3v-8Zm11 2h4.2L21 13v2.5h-7V9.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="7" cy="17.5" r="1.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="17" cy="17.5" r="1.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

function IconLock() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5" y="11" width="14" height="9" rx="1.6" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 11V8.4A4 4 0 0 1 12 4.5 4 4 0 0 1 16 8.4V11" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}

function CrumbSep() {
  return (
    <span className="pdp__crumb-sep" aria-hidden="true">
      /
    </span>
  )
}

function ProductNotFound() {
  return (
    <section className="pdp pdp--missing" aria-labelledby="pdp-missing-heading">
      <div className="pdp__container">
        <nav className="pdp__crumbs" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <CrumbSep />
          <Link to="/shop">Shop</Link>
          <CrumbSep />
          <span aria-current="page">Product</span>
        </nav>
        <p className="pdp__eyebrow">Product</p>
        <h1 id="pdp-missing-heading">This product is not in the catalogue.</h1>
        <p className="pdp__missing-copy">
          It may have been moved, or the link is out of date. Browse the shop to find native rice,
          thokku, masalas and handmade soaps.
        </p>
        <Button to="/shop" arrow>
          Browse the shop
        </Button>
      </div>
    </section>
  )
}

function ProductLoading() {
  return (
    <section className="pdp" aria-label="Loading product">
      <div className="pdp__container">
        <div className="pdp__layout" style={{ opacity: 0.5 }}>
          <div className="shop-skel" style={{ height: 480 }} aria-hidden="true">
            <span className="shop-skel__media" style={{ height: '100%' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <span className="shop-skel__line shop-skel__line--type" />
            <span className="shop-skel__line shop-skel__line--name" style={{ height: '2rem' }} />
            <span className="shop-skel__line shop-skel__line--price" />
          </div>
        </div>
      </div>
    </section>
  )
}

function DetailBlock({ title, open = false, children }) {
  return (
    <details className="pdp-detail" open={open}>
      <summary>
        <h2>{title}</h2>
      </summary>
      <div className="pdp-detail__body">{children}</div>
    </details>
  )
}

function ProductRail({ id, eyebrow, title, products }) {
  if (!products.length) return null

  return (
    <section className="pdp-rail" aria-labelledby={id}>
      <div className="pdp__container">
        <header className="pdp-rail__header">
          <p className="pdp__eyebrow">{eyebrow}</p>
          <h2 id={id}>{title}</h2>
        </header>
        <ul className="pdp-rail__grid">
          {products.map((item, index) => (
            <li key={item.id}>
              <ShopProduct product={item} index={index} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

// Enrich a backend product with UI metadata from static lookups
function enrichProduct(apiProduct) {
  const storefrontData = getStorefront(apiProduct.storefront)
  const categoryData = getCategoryBySlug(apiProduct.category)

  // Normalize variants: backend uses variantId, UI uses id
  const variants = (apiProduct.variants || []).map((v) => ({
    ...v,
    id: v.variantId, // UI compatibility
    stock: v.stock || (v.qty > 0 ? (v.qty <= 10 ? 'low-stock' : 'in-stock') : 'out-of-stock'),
  }))

  // Derive gallery: backend returns array of strings, UI expects { src, alt }[]
  const gallery = (apiProduct.gallery || [apiProduct.image]).filter(Boolean).map((src, i) => ({
    src,
    alt: i === 0 ? apiProduct.name : `${apiProduct.name} — view ${i + 1}`,
  }))

  return {
    ...apiProduct,
    variants,
    gallery,
    // Reconstruct static metadata the UI expects
    storefrontMeta: storefrontData
      ? {
          name: storefrontData.name,
          accent: storefrontData.accent,
          accentToken: storefrontData.accentToken,
          to: storefrontData.to,
        }
      : { name: apiProduct.storefront, accent: 'var(--espresso-brown)', accentToken: 'espresso', to: '/shop' },
    categoryMeta: categoryData
      ? { name: categoryData.name, to: categoryData.to }
      : { name: apiProduct.category, to: '/shop' },
    // information = specifications (same field, different name in old static data)
    information: apiProduct.specifications || [],
    shipping: defaultShipping,
    // stock from base product
    stock: apiProduct.stock || (apiProduct.qty > 0 ? (apiProduct.qty <= 10 ? 'low-stock' : 'in-stock') : 'out-of-stock'),
  }
}

function Product() {
  const { slug } = useParams()
  const [product, setProduct] = useState(null)
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    setNotFound(false)
    setProduct(null)
    setRelated([])

    getProduct(slug)
      .then((res) => {
        const enriched = enrichProduct(res.data)
        setProduct(enriched)
        document.title = `${enriched.name} · SV Hub`
        // Store recently viewed by slug in localStorage
        try {
          const RECENT_KEY = 'svhub.recentlyViewed'
          const current = JSON.parse(window.localStorage.getItem(RECENT_KEY) ?? '[]')
          const list = Array.isArray(current) ? current.filter((s) => s !== enriched.slug) : []
          window.localStorage.setItem(RECENT_KEY, JSON.stringify([enriched.slug, ...list].slice(0, 8)))
        } catch { /* ignore */ }

        // Fetch related in background
        return getRelatedProducts(slug, 4)
      })
      .then((res) => {
        setRelated((res?.data || []).map(enrichProduct))
      })
      .catch((err) => {
        if (err.status === 404) {
          setNotFound(true)
        } else {
          setNotFound(true) // treat errors as not found for simplicity
        }
        document.title = PAGE_TITLE
      })
      .finally(() => setLoading(false))

    return () => {
      document.title = PAGE_TITLE
    }
  }, [slug])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [slug])

  if (loading) return <ProductLoading />
  if (notFound || !product) return <ProductNotFound />

  const [recent] = useState(() => readViewed(product.id, 4))

  return <ProductView key={product.id} product={product} related={related} recent={recent} />
}

function ProductView({ product, related, recent }) {
  const navigate = useNavigate()
  const { addItem, setItemQuantity, quantityOf, items } = useCart()
  const [variantId, setVariantId] = useState(product.variants[0]?.id ?? '')
  const actionsRef = useRef(null)
  const [showSticky, setShowSticky] = useState(false)
  const [narrow, setNarrow] = useState(false)

  const variant =
    product.variants.find((item) => item.id === variantId) ?? product.variants[0] ?? null
  const accentToken = product.storefrontMeta?.accentToken === 'terracotta' ? 'terracotta' : 'espresso'
  const accent = product.storefrontMeta?.accent ?? 'var(--espresso-brown)'
  const outOfStock = (variant?.stock ?? product.stock) === 'out-of-stock'
  const stock = variant?.stock ?? product.stock
  const price = variant?.price ?? product.price
  const originalPrice = variant?.originalPrice ?? product.originalPrice
  const discount = variant?.discount ?? product.discount
  const sku = variant?.sku ?? product.sku
  const hasCompare = Boolean(originalPrice && originalPrice > price)
  const houseName = product.storefrontMeta?.name
  const categoryName = product.categoryMeta?.name
  const categoryTo = product.categoryMeta?.to ?? '/shop'
  const houseTo = product.storefrontMeta?.to ?? '/shop'
  const trust = [
    { icon: <IconShip />, text: product.shipping.notes[0] },
    { icon: <IconLock />, text: product.shipping.notes[2] },
    { icon: <IconCheck />, text: 'Packed in Coimbatore' },
  ].filter((item) => item.text)

  useEffect(() => {
    const media = window.matchMedia('(max-width: 959px)')
    const update = () => setNarrow(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    const node = actionsRef.current
    if (!node) return undefined

    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowSticky(!entry.isIntersecting)
      },
      { threshold: 0.15, rootMargin: '-48px 0px 0px 0px' },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  // For backend cart: we need productId (MongoDB ObjectId) + variantId
  const cartProduct = {
    // Backend cart item shape
    productId: product.id,          // MongoDB ObjectId
    variantId: variant?.variantId ?? variant?.id ?? variantId,
    // UI display shape (for guest cart + display)
    id: product.id,
    slug: product.slug,
    name: product.name,
    type: product.type,
    category: product.category,
    storefront: product.storefront,
    image: product.image,
    price,
    originalPrice,
    discount,
    sku,
    weight: variant?.label ?? variant?.weight ?? product.weight,
    stock,
  }

  // Look up quantity: check items by itemId (logged in) or by product+variant (guest)
  const cartItemKey = `${product.id}::${cartProduct.variantId}`
  const quantity = useMemo(() => {
    // Try to find in backend cart items first (itemId-keyed)
    const backendItem = items.find(
      (item) => item.productId === product.id && item.variantId === cartProduct.variantId,
    )
    if (backendItem) return backendItem.quantity
    // Fallback for guest cart (id+weight keyed)
    return quantityOf(cartProduct)
  }, [items, product.id, cartProduct.variantId, cartProduct, quantityOf])

  const inCart = quantity > 0

  function handleQuantity(next) {
    if (outOfStock) return
    const backendItem = items.find(
      (item) => item.productId === product.id && item.variantId === cartProduct.variantId,
    )
    if (backendItem) {
      setItemQuantity(backendItem, next)
    } else {
      setItemQuantity(cartProduct, next)
    }
  }

  function handleAdd() {
    if (outOfStock) return
    if (inCart) {
      navigate('/cart')
      return
    }
    addItem(cartProduct, 1)
  }

  function handleBuy() {
    if (outOfStock) return
    if (!inCart) addItem(cartProduct, 1)
    navigate('/cart')
  }

  const addLabel = outOfStock ? 'Out of stock' : inCart ? 'Go to cart' : 'Add to cart'

  return (
    <div className={`pdp pdp--${accentToken}`} style={{ '--pdp-accent': accent }}>
      <section className="pdp__hero" aria-labelledby="pdp-heading">
        <div className="pdp__container">
          <nav className="pdp__crumbs" aria-label="Breadcrumb">
            <Link to="/">Home</Link>
            <CrumbSep />
            <Link to="/shop">Shop</Link>
            <CrumbSep />
            <Link to={houseTo}>{houseName}</Link>
            <CrumbSep />
            <Link to={categoryTo}>{categoryName}</Link>
            <CrumbSep />
            <span aria-current="page">{product.name}</span>
          </nav>

          <div className="pdp__layout">
            <ProductGallery
              key={product.id}
              images={product.gallery}
              name={product.name}
              discount={discount}
              accent={accent}
            />

            <div className="pdp__info">
              <p className="pdp__eyebrow">
                <Link to={houseTo}>{houseName}</Link>
              </p>
              <h1 id="pdp-heading">{product.name}</h1>
              <p className="pdp__kicker">
                <Link to={categoryTo}>{product.type}</Link>
              </p>

              <p className="pdp__price-row">
                <span className="pdp__price">{formatPrice(price)}</span>
                {hasCompare ? <s className="pdp__original">{formatPrice(originalPrice)}</s> : null}
                {discount ? <span className="pdp__save">{discount}% off</span> : null}
              </p>

              <p className={`pdp__stock pdp__stock--${stock}`}>
                <span className="pdp__stock-mark" aria-hidden="true" />
                {stockLabels[stock]}
                {stock === 'low-stock' ? ' — a few packs left' : null}
              </p>

              <p className="pdp__lede">{product.description}</p>

              {product.variants.length ? (
                <fieldset className="pdp__variants">
                  <legend>Select weight</legend>
                  <div className="pdp__variant-list">
                    {product.variants.map((item) => {
                      const selected = item.id === variant?.id
                      const unavailable = item.stock === 'out-of-stock'
                      return (
                        <label
                          key={item.id}
                          className={`pdp__variant${selected ? ' is-selected' : ''}${
                            unavailable ? ' is-unavailable' : ''
                          }`}
                        >
                          <input
                            type="radio"
                            name="pdp-variant"
                            value={item.id}
                            checked={selected}
                            disabled={unavailable && !selected}
                            onChange={() => setVariantId(item.id)}
                          />
                          <span className="pdp__variant-label">{item.label}</span>
                          <span className="pdp__variant-price">{formatPrice(item.price)}</span>
                        </label>
                      )
                    })}
                  </div>
                </fieldset>
              ) : null}

              <div className="pdp__buy" ref={actionsRef}>
                <QuantitySelector
                  value={quantity}
                  onChange={handleQuantity}
                  min={0}
                  disabled={outOfStock}
                />
                <div className="pdp__actions">
                  <Button
                    variant="primary"
                    disabled={outOfStock}
                    onClick={handleAdd}
                    aria-live="polite"
                    aria-label={
                      outOfStock
                        ? `${product.name} is out of stock`
                        : inCart
                          ? 'Go to cart'
                          : `Add ${quantity} ${product.name} to cart`
                    }
                  >
                    {addLabel}
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={outOfStock}
                    onClick={handleBuy}
                    aria-label={outOfStock ? `${product.name} is out of stock` : `Buy ${product.name} now`}
                  >
                    Buy now
                  </Button>
                </div>
              </div>

              <ul className="pdp__trust">
                {trust.map((item) => (
                  <li key={item.text}>
                    {item.icon}
                    <span>{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="pdp__details" aria-label="Product details">
        <div className="pdp__container pdp__details-grid">
          <DetailBlock title="Description" open>
            <p>{product.description}</p>
          </DetailBlock>

          <DetailBlock title="Ingredients" open={!narrow}>
            <ul className="pdp__ingredients">
              {product.ingredients.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </DetailBlock>

          <DetailBlock title="Product information" open={!narrow}>
            <dl className="pdp__facts">
              <div>
                <dt>Category</dt>
                <dd>
                  <Link to={categoryTo}>{categoryName}</Link>
                </dd>
              </div>
              <div>
                <dt>Storefront</dt>
                <dd>
                  <Link to={houseTo}>{houseName}</Link>
                </dd>
              </div>
              {sku ? (
                <div>
                  <dt>SKU</dt>
                  <dd>{sku}</dd>
                </div>
              ) : null}
              {product.information.map((row) => (
                <div key={row.label}>
                  <dt>{row.label}</dt>
                  <dd>{row.value}</dd>
                </div>
              ))}
              <div>
                <dt>Availability</dt>
                <dd>{stockLabels[stock]}</dd>
              </div>
            </dl>
          </DetailBlock>

          <DetailBlock title="Weight / variants" open={!narrow}>
            <ul className="pdp__packs">
              {product.variants.map((item) => (
                <li key={item.id}>
                  <span>{item.label}</span>
                  <span>{formatPrice(item.price)}</span>
                  <span>{stockLabels[item.stock]}</span>
                </li>
              ))}
            </ul>
          </DetailBlock>

          <DetailBlock title="Shipping information" open={!narrow}>
            <p>{product.shipping.summary}</p>
            <ul className="pdp__ship-notes">
              {product.shipping.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
            <Link className="pdp__policy" to="/shipping-policy">
              Check our shipping policy
              <Arrow />
            </Link>
          </DetailBlock>
        </div>
      </section>

      <ProductRail
        id="pdp-related-heading"
        eyebrow="Related"
        title="From the same kitchen."
        products={related}
      />
      <ProductRail
        id="pdp-recent-heading"
        eyebrow="Recently viewed"
        title="Back to the pantry."
        products={recent || []}
      />

      <div className={`pdp-sticky${showSticky ? ' is-visible' : ''}`} aria-hidden={!showSticky}>
        <div className="pdp-sticky__inner">
          <div className="pdp-sticky__price">
            <p>{formatPrice(price)}</p>
            <span>{product.name}</span>
          </div>
          <button
            type="button"
            className="pdp-sticky__cart"
            disabled={outOfStock}
            tabIndex={showSticky ? 0 : -1}
            aria-label={
              outOfStock
                ? `${product.name} is out of stock`
                : inCart
                  ? 'Go to cart'
                  : `Add ${quantity} ${product.name} to cart`
            }
            onClick={handleAdd}
          >
            {addLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Product

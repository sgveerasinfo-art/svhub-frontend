import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { getCategoryBySlug } from '../data/categories.js'
import { productHref } from '../data/products.js'
import { getFeaturedProducts } from '../api/products.js'
import { getStorefront } from '../data/storefronts.js'
import { formatPrice } from '../utils/money.js'
import { handleProductImageError, resolveDisplayProductImage } from '../utils/productImage.js'
import CartRemoveModal from '../components/cart/CartRemoveModal.jsx'
import CartLoginModal from '../components/cart/CartLoginModal.jsx'
import './CartPage.css'

const MAX_QTY = 12

function lineKey(item) {
  return item.itemId || `${item.id || item.productId}::${item.weight ?? ''}`
}

function houseClass(storefront) {
  return storefront === 'self-care' ? 'cart-house--self' : 'cart-house--nutri'
}

function IconClose() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  )
}

function IconMinus() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 12h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function IconPlus() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 6v12M6 12h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function IconBag() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6.5 8h11l.8 11.2a1.5 1.5 0 0 1-1.5 1.6H7.2a1.5 1.5 0 0 1-1.5-1.6L6.5 8Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M9 8V6.4A3 3 0 0 1 12 3.5 3 3 0 0 1 15 6.4V8" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

function IconShield() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3.5 5 6.5v5.2c0 4.3 2.9 7.2 7 8.8 4.1-1.6 7-4.5 7-8.8V6.5L12 3.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="m9.2 12.2 1.9 1.9 3.7-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function IconTruck() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 7.5h11v8H3v-8Zm11 2h4.2L21 13v2.5h-7V9.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="7" cy="17.5" r="1.6" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="17" cy="17.5" r="1.6" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

function IconLeaf() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 18.5s1.2-8.2 9.8-11.8C20.4 4.8 20 8 18.2 12.5 15.8 18 9 19 5 18.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M9.5 14.5c2-2.6 4.4-4.4 8-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function IconCartAdd() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 5h1.6l1.3 9.2a1.5 1.5 0 0 0 1.5 1.3h8.4a1.5 1.5 0 0 0 1.5-1.2L20 8H8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="19" r="1.2" fill="currentColor" />
      <circle cx="17.2" cy="19" r="1.2" fill="currentColor" />
      <path d="M16 4v4M14 6h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function IconHeart() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 19.4s-6.4-3.8-8.2-7.6C2.4 9.2 3.6 6 6.8 6c1.8 0 3 1.1 3.7 2.2C11.2 7.1 12.4 6 14.2 6c3.2 0 4.4 3.2 3 5.8-1.8 3.8-8.2 7.6-8.2 7.6Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconArrow() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function QuantityPill({ item, quantity, onChange }) {
  return (
    <div className="cart-qty" role="group" aria-label={`Quantity of ${item.name}`}>
      <button
        type="button"
        className="cart-qty__btn"
        onClick={() => onChange(quantity - 1)}
        disabled={quantity <= 1}
        aria-label={`Decrease quantity of ${item.name}`}
      >
        <IconMinus />
      </button>
      <span className="cart-qty__value" aria-live="polite">
        {quantity}
      </span>
      <button
        type="button"
        className="cart-qty__btn"
        onClick={() => onChange(quantity + 1)}
        disabled={quantity >= MAX_QTY}
        aria-label={`Increase quantity of ${item.name}`}
      >
        <IconPlus />
      </button>
    </div>
  )
}

function CartLine({ item, onQuantity, onRemove }) {
  const house = getStorefront(item.storefront)
  const lineTotal = item.price * item.quantity
  const compareTotal =
    item.originalPrice && item.originalPrice > item.price ? item.originalPrice * item.quantity : null
  const meta = [item.type, item.weight].filter(Boolean).join(' • ')

  return (
    <article className="cart-line">
      <Link to={productHref(item)} className="cart-line__media" aria-label={`View ${item.name}`}>
        <img
          src={resolveDisplayProductImage(item.image)}
          alt=""
          onError={handleProductImageError}
        />
      </Link>

      <div className="cart-line__body">
        <div className="cart-line__top">
          <div>
            <span className={`cart-house ${houseClass(item.storefront)}`}>{house?.name ?? item.storefront}</span>
            <h3 className="cart-line__name">
              <Link to={productHref(item)}>{item.name}</Link>
            </h3>
            {meta ? <p className="cart-line__meta">{meta}</p> : null}
          </div>
          <button type="button" className="cart-line__remove" onClick={onRemove} aria-label={`Remove ${item.name}`}>
            <IconClose />
          </button>
        </div>

        <div className="cart-line__bottom">
          <QuantityPill item={item} quantity={item.quantity} onChange={onQuantity} />
          <div className="cart-line__price">
            <span className="cart-line__total">{formatPrice(lineTotal)}</span>
            {compareTotal ? <s className="cart-line__compare">{formatPrice(compareTotal)}</s> : null}
          </div>
        </div>
      </div>
    </article>
  )
}

function RelatedCard({ product, onAdd }) {
  const house = getStorefront(product.storefront)
  const category = getCategoryBySlug(product.category)

  return (
    <article className={`cart-suggest ${houseClass(product.storefront)}`}>
      <div className="cart-suggest__media">
        <Link to={productHref(product)} aria-label={`View ${product.name}`}>
          <img
            src={resolveDisplayProductImage(product.image)}
            alt=""
            onError={handleProductImageError}
          />
        </Link>
        <span className="cart-suggest__save" aria-hidden="true">
          <IconHeart />
        </span>
      </div>
      <div className="cart-suggest__body">
        <div className="cart-suggest__copy">
          <span className={`cart-house ${houseClass(product.storefront)}`}>{house?.name ?? product.storefront}</span>
          <h3 className="cart-suggest__name">
            <Link to={productHref(product)}>{product.name}</Link>
          </h3>
          {category?.description ? <p className="cart-suggest__blurb">{category.description}</p> : null}
        </div>
        <div className="cart-suggest__foot">
          <span className="cart-suggest__price">{formatPrice(product.price)}</span>
          <button
            type="button"
            className="cart-suggest__add"
            onClick={() => onAdd(product)}
            aria-label={`Add ${product.name} to cart`}
          >
            <IconCartAdd />
          </button>
        </div>
      </div>
    </article>
  )
}

function CartPage() {
  const { items, count, addItem, setItemQuantity } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [promo, setPromo] = useState('')
  const [itemPendingRemoval, setItemPendingRemoval] = useState(null)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items],
  )
  const [featuredList, setFeaturedList] = useState([])

  function handleProceedToCheckout() {
    if (!user) {
      setShowLoginModal(true)
      return
    }
    navigate('/checkout')
  }

  function handleConfirmLogin() {
    setShowLoginModal(false)
    navigate('/login', {
      state: {
        from: '/checkout',
        message: 'Please log in to continue with your order.',
      },
    })
  }

  useEffect(() => {
    let cancelled = false
    getFeaturedProducts(6)
      .then((res) => {
        if (!cancelled && res?.data) {
          setFeaturedList(res.data)
        }
      })
      .catch((err) => {
        console.error('Failed to load featured products:', err)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const suggested = useMemo(() => {
    const inCartIds = new Set(items.map((item) => item.productId || item.id || item.slug))
    return featuredList
      .filter((product) => !inCartIds.has(product.id) && !inCartIds.has(product.slug))
      .slice(0, 3)
  }, [items, featuredList])

  return (
    <section className="cart-page">
      <div className="container cart-page__inner">
        <header className="cart-page__intro">
          <span className="cart-page__eyebrow">Your cart</span>
          <h1 className="cart-page__title">Goodness Worth Bringing Home.</h1>
        </header>

        {items.length === 0 ? (
          <div className="cart-empty">
            <IconBag />
            <h2>Your cart is empty</h2>
            <p>Looks like you haven't added anything to your cart yet. Discover our premium farm-to-home products.</p>
            <Link to="/shop" className="cart-btn cart-btn--solid">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="cart-page__layout">
            <div className="cart-page__items">
              {items.map((item) => (
                <CartLine
                  key={lineKey(item)}
                  item={item}
                  onQuantity={(qty) => setItemQuantity(item, qty)}
                  onRemove={() => setItemPendingRemoval(item)}
                />
              ))}
            </div>

            <aside className="cart-page__aside">
              <div className="cart-summary">
                <h2 className="cart-summary__title">Order Summary</h2>

                <dl className="cart-summary__rows">
                  <div>
                    <dt>Subtotal ({count} {count === 1 ? 'item' : 'items'})</dt>
                    <dd>{formatPrice(subtotal)}</dd>
                  </div>
                  <div>
                    <dt>
                      <span className="cart-summary__desk">Shipping</span>
                      <span className="cart-summary__mob">Shipping Estimate</span>
                    </dt>
                    <dd className="cart-summary__hint">Calculated at checkout</dd>
                  </div>
                  <div className="cart-summary__mob-row">
                    <dt>Taxes</dt>
                    <dd className="cart-summary__hint">Calculated at checkout</dd>
                  </div>
                </dl>

                <form
                  className="cart-promo"
                  onSubmit={(event) => {
                    event.preventDefault()
                  }}
                >
                  <input
                    type="text"
                    name="promo"
                    aria-label="Promo code"
                    placeholder="Promo code"
                    value={promo}
                    onChange={(event) => setPromo(event.target.value)}
                    autoComplete="off"
                  />
                  <button type="submit">Apply</button>
                </form>

                <div className="cart-summary__total">
                  <span>Total</span>
                  <strong>{formatPrice(subtotal)}</strong>
                </div>

                <button
                  type="button"
                  onClick={handleProceedToCheckout}
                  className="cart-btn cart-btn--solid"
                >
                  Proceed to Checkout
                </button>
                <Link to="/shop" className="cart-btn cart-btn--ghost">
                  Continue Shopping
                </Link>

                <div className="cart-trust">
                  <span>
                    <IconShield /> Secure
                  </span>
                  <span>
                    <IconTruck /> Fast Ship
                  </span>
                  <span>
                    <IconLeaf /> Organic
                  </span>
                </div>
              </div>
            </aside>
          </div>
        )}

        {suggested.length > 0 ? (
          <section className="cart-related" aria-labelledby="cart-related-heading">
            <div className="cart-related__head">
              <div>
                <span className="cart-page__eyebrow">Curated for you</span>
                <h2 id="cart-related-heading">You Might Also Like</h2>
              </div>
              <Link to="/shop" className="cart-related__all">
                Explore All <IconArrow />
              </Link>
            </div>
            <div className="cart-related__grid">
              {suggested.map((product) => (
                <RelatedCard key={product.id} product={product} onAdd={(item) => addItem(item, 1)} />
              ))}
            </div>
          </section>
        ) : null}
      </div>

      {itemPendingRemoval ? (
        <CartRemoveModal
          item={itemPendingRemoval}
          onConfirm={() => {
            const target = itemPendingRemoval
            setItemPendingRemoval(null)
            setItemQuantity(target, 0)
          }}
          onCancel={() => setItemPendingRemoval(null)}
        />
      ) : null}

      {showLoginModal ? (
        <CartLoginModal
          onConfirm={handleConfirmLogin}
          onCancel={() => setShowLoginModal(false)}
        />
      ) : null}
    </section>
  )
}

export default CartPage

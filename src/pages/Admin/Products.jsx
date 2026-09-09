import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { getAdminProducts, updateAdminProduct } from '../../api/adminProducts.js'
import { getAdminCategories } from '../../api/adminCategories.js'
import { useAdminUi, usePagedList } from '../../context/AdminUi.jsx'
import { ADMIN_PAGE_SIZE, STOREFRONTS, categoryLabel, formatAdminDate, matchesQuery, storefrontLabel } from '../../data/admin.js'
import { formatPrice } from '../../utils/money.js'
import { Icon } from '../../components/admin/icons.jsx'
import { LoadingState } from '../../components/admin/ui.jsx'
import './Products.css'

function ProductDialog({ eyebrow, title, copy, onClose, wide, children }) {
  const dialogRef = useRef(null)
  const lastFocus = useRef(null)

  useEffect(() => {
    lastFocus.current = document.activeElement
    const node = dialogRef.current
    node?.querySelector('input, select, textarea, button')?.focus()

    function onKey(event) {
      if (event.key === 'Escape') onClose()
      if (event.key !== 'Tab' || !node) return
      const items = [...node.querySelectorAll('button, [href], input, select, textarea')]
      if (!items.length) return
      const first = items[0]
      const last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      lastFocus.current?.focus?.()
    }
  }, [onClose])

  return createPortal(
    <div className="admin-catalog-dialog" role="presentation">
      <button type="button" className="admin-catalog-dialog__backdrop" aria-label="Close dialog" onClick={onClose} />
      <div
        ref={dialogRef}
        className={`admin-catalog-dialog__panel${wide ? ' is-wide' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="catalog-dialog-title"
      >
        <header className="admin-catalog-dialog__head">
          <div>
            {eyebrow ? <p className="admin-catalog-dialog__eyebrow">{eyebrow}</p> : null}
            <h2 id="catalog-dialog-title">{title}</h2>
            {copy ? <p className="admin-catalog-dialog__copy">{copy}</p> : null}
          </div>
          <button type="button" className="admin-catalog-dialog__close" onClick={onClose} aria-label="Close">
            <Icon name="close" size={16} />
          </button>
        </header>
        {children}
      </div>
    </div>,
    document.body,
  )
}

function ProductView({ product, categories, onClose, onEdit }) {
  return (
    <ProductDialog eyebrow="Catalogue" title={product.name} copy={product.sku} onClose={onClose}>
      <div className="admin-catalog-view">
        <div className="admin-catalog-view__hero">
          <ProductThumb product={product} />
          <div>
            <span className={`admin-catalog__house${product.storefront === 'self-care' ? ' admin-catalog__house--self-care' : ''}`}>
              {storefrontLabel(product.storefront)}
            </span>
            <strong>{formatPrice(product.price)}</strong>
          </div>
        </div>
        <dl className="admin-catalog-view__dl">
          <div>
            <dt>Category</dt>
            <dd>{categoryLabel(product.category, categories)}</dd>
          </div>
          <div>
            <dt>Stock</dt>
            <dd>
              {product.qty} · {product.stock.replaceAll('-', ' ')}
            </dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{product.active === false ? 'Inactive' : 'Active'}</dd>
          </div>
          <div>
            <dt>Updated</dt>
            <dd>{formatAdminDate(product.updatedAt)}</dd>
          </div>
        </dl>
      </div>
      <footer className="admin-catalog-dialog__actions">
        {product.slug ? (
          <Link className="admin-catalog-dialog__ghost" to={`/product/${product.slug}`}>
            Storefront
          </Link>
        ) : null}
        <button
          type="button"
          className="admin-catalog-dialog__submit"
          onClick={() => {
            onClose()
            onEdit(product)
          }}
        >
          Edit
        </button>
      </footer>
    </ProductDialog>
  )
}

function ProductThumb({ product }) {
  if (product.image) {
    return <img className="admin-catalog__thumb" src={product.image} alt="" width="50" height="50" />
  }
  return (
    <span className="admin-catalog__thumb admin-catalog__thumb--mark" aria-hidden="true">
      {String(product.name || 'P')
        .slice(0, 1)
        .toUpperCase()}
    </span>
  )
}

function formatUpdated(value) {
  const date = value ? new Date(value) : null
  if (!date || Number.isNaN(date.getTime())) return '—'
  const mins = Math.floor((Date.now() - date.getTime()) / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  return formatAdminDate(value)
}

function stockTone(product) {
  if (product.stock === 'out-of-stock' || Number(product.qty) === 0) return 'out'
  if (product.stock === 'low-stock') return 'low'
  return 'ok'
}

function stockCopy(tone) {
  if (tone === 'out') return 'Out of stock'
  if (tone === 'low') return 'Low stock'
  return 'In stock'
}

function stockFill(product) {
  const qty = Math.max(0, Number(product.qty) || 0)
  if (qty <= 0) return 0
  return Math.min(100, Math.round((qty / 80) * 100))
}

function houseTag(id) {
  return id === 'self-care' ? 'SELF-CARE' : 'NUTRI-HUB'
}

function StockCell({ product }) {
  const tone = stockTone(product)
  return (
    <div className={`admin-catalog__stock${tone === 'ok' ? '' : ` is-${tone}`}`}>
      <strong>{product.qty}</strong>
      <div className={`admin-catalog__meter${tone === 'ok' ? '' : ` is-${tone}`}`} aria-hidden="true">
        <span style={{ width: `${stockFill(product)}%` }} />
      </div>
      <span className={`admin-catalog__hint${tone === 'ok' ? '' : ` is-${tone}`}`}>
        <i />
        {stockCopy(tone)}
      </span>
    </div>
  )
}

function StatusDot({ product }) {
  const inactive = product.active === false
  return (
    <span className={`admin-catalog__live${inactive ? ' is-off' : ''}`}>
      <i />
      {inactive ? 'Inactive' : 'Active'}
    </span>
  )
}

function RowMenu({ product, open, onToggle, onView, onEdit, onToggleStatus }) {
  const buttonRef = useRef(null)
  const menuRef = useRef(null)
  const [coords, setCoords] = useState(null)

  useEffect(() => {
    if (!open) return undefined
    function onDoc(event) {
      if (buttonRef.current?.contains(event.target) || menuRef.current?.contains(event.target)) return
      onToggle(null)
    }
    function onReposition() {
      onToggle(null)
    }
    document.addEventListener('mousedown', onDoc)
    window.addEventListener('resize', onReposition)
    document.querySelector('.admin-main')?.addEventListener('scroll', onReposition)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      window.removeEventListener('resize', onReposition)
      document.querySelector('.admin-main')?.removeEventListener('scroll', onReposition)
    }
  }, [open, onToggle])

  return (
    <div className="admin-catalog__pop">
      <button
        ref={buttonRef}
        type="button"
        className="admin-catalog__more"
        aria-expanded={open}
        aria-label={`More actions for ${product.name}`}
        onClick={(event) => {
          event.stopPropagation()
          const rect = event.currentTarget.getBoundingClientRect()
          setCoords({ top: rect.bottom + 6, right: window.innerWidth - rect.right })
          onToggle(open ? null : product.id)
        }}
      >
        <Icon name="more" size={16} />
      </button>
      {open
        ? createPortal(
            <div className="admin-catalog__menu" role="menu" ref={menuRef} style={coords || undefined}>
              <button
                type="button"
                role="menuitem"
                onClick={(event) => {
                  event.stopPropagation()
                  onToggle(null)
                  onEdit(product)
                }}
              >
                Edit
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={(event) => {
                  event.stopPropagation()
                  onToggle(null)
                  onView(product)
                }}
              >
                View
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={(event) => {
                  event.stopPropagation()
                  onToggle(null)
                  onToggleStatus(product)
                }}
              >
                {product.active === false ? 'Activate' : 'Deactivate'}
              </button>
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}

function ProductActions({ product, menuId, setMenuId, onView, onEdit, onToggle }) {
  return (
    <div className="admin-catalog__do">
      <button
        type="button"
        className="admin-catalog__view"
        onClick={(event) => {
          event.stopPropagation()
          onView(product)
        }}
      >
        View
      </button>
      <RowMenu
        product={product}
        open={menuId === product.id}
        onToggle={setMenuId}
        onView={onView}
        onEdit={onEdit}
        onToggleStatus={onToggle}
      />
    </div>
  )
}

function pageList(page, pageCount) {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, index) => index + 1)
  const pages = new Set([1, pageCount, page - 1, page, page + 1])
  return [...pages].filter((value) => value >= 1 && value <= pageCount).sort((a, b) => a - b)
}

function useCompactCatalog() {
  const [compact, setCompact] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 720px)').matches : false,
  )

  useEffect(() => {
    const media = window.matchMedia('(max-width: 720px)')
    const sync = () => setCompact(media.matches)
    sync()
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [])

  return compact
}

function Products() {
  const navigate = useNavigate()
  const { toast, confirm } = useAdminUi()
  const [params, setParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshIndex, setRefreshIndex] = useState(0)
  const [viewing, setViewing] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [menuId, setMenuId] = useState(null)
  const compact = useCompactCatalog()
  const query = params.get('q') || ''
  const house = params.get('house') || 'all'
  const category = params.get('category') || 'all'
  const status = params.get('status') || 'all'
  const stock = params.get('stock') || 'all'
  const filtersOn = Boolean(query || house !== 'all' || category !== 'all' || status !== 'all' || stock !== 'all')

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    Promise.all([
      getAdminProducts({ limit: 100 }).catch(() => ({ data: [] })),
      getAdminCategories().catch(() => ({ data: [] })),
    ])
      .then(([productsRes, categoriesRes]) => {
        if (cancelled) return
        setProducts(productsRes.data || [])
        setCategories(categoriesRes.data || [])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [refreshIndex])

  function set(key, value) {
    const next = new URLSearchParams(params)
    if (!value || value === 'all') next.delete(key)
    else next.set(key, value)
    if (key === 'house') next.delete('category')
    setParams(next)
  }

  function clearFilters() {
    setParams(new URLSearchParams())
  }

  const categoryOptions = useMemo(
    () =>
      categories
        .filter((item) => house === 'all' || item.storefront === house)
        .map((item) => ({ value: item.slug || item.id, label: item.name })),
    [categories, house],
  )

  const stats = useMemo(
    () => ({
      total: products.length,
      inStock: products.filter((product) => product.stock === 'in-stock').length,
      low: products.filter((product) => product.stock === 'low-stock').length,
      out: products.filter((product) => product.stock === 'out-of-stock').length,
    }),
    [products],
  )

  const filtered = useMemo(() => {
    return products
      .filter((product) => matchesQuery(query, product.name, product.sku, product.type))
      .filter((product) => (house === 'all' ? true : product.storefront === house))
      .filter((product) => (category === 'all' ? true : product.category === category || product.category?.slug === category))
      .filter((product) => {
        if (status === 'all') return true
        if (status === 'active') return product.active !== false
        return product.active === false
      })
      .filter((product) => {
        if (stock === 'all') return true
        if (stock === 'alert') return product.stock === 'low-stock' || product.stock === 'out-of-stock'
        return product.stock === stock
      })
  }, [products, query, house, category, status, stock])

  const paged = usePagedList(filtered, ADMIN_PAGE_SIZE, `${query}|${house}|${category}|${status}|${stock}|${filtered.length}`)

  useEffect(() => {
    setMenuId(null)
  }, [paged.page, query, house, category, status, stock])

  async function handleToggle(product) {
    const next = product.active === false
    const ok = await confirm({
      title: next ? `Activate ${product.name}?` : `Deactivate ${product.name}?`,
      message: next
        ? 'This SKU will be live on the storefront again.'
        : 'This SKU will be hidden from the storefront. Inventory is kept.',
      confirmLabel: next ? 'Activate' : 'Deactivate',
    })
    if (!ok) return
    try {
      await updateAdminProduct(product.id || product._id, { active: next, isActive: next })
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, active: next, isActive: next } : p))
      )
      toast.success(next ? 'Product activated' : 'Product deactivated')
    } catch (err) {
      toast.error(err.message || 'Could not update product status')
    }
  }

  function openEdit(product) {
    navigate(`/admin/products/${product.id}/edit`)
  }

  function openProduct(product) {
    setSelectedId(product.id)
    setViewing(product)
    setMenuId(null)
  }

  if (loading) return <LoadingState label="Loading products" />

  const pages = pageList(paged.page, paged.pageCount)

  return (
    <div className="admin-catalog">
      <header className="admin-catalog__head">
        <div>
          <p className="admin-catalog__eyebrow">Catalogue</p>
          <h1 className="admin-title">Products</h1>
          <p className="admin-catalog__copy">Manage SKUs across Nutri-Hub and Self-Care.</p>
        </div>
        <Link to="/admin/products/new" className="admin-catalog__add">
          <Icon name="plus" size={14} />
          Add Product
          <span className="admin-catalog__add-arrow">
            <Icon name="arrow" size={14} />
          </span>
        </Link>
      </header>

      <section className="admin-catalog__stats" aria-label="Catalogue summary">
        <div className="admin-catalog__stat">
          <strong>{stats.total}</strong>
          <span>Total products</span>
        </div>
        <div className="admin-catalog__stat">
          <strong>{stats.inStock}</strong>
          <span>In stock</span>
        </div>
        <div className="admin-catalog__stat admin-catalog__stat--low">
          <strong>{stats.low}</strong>
          <span>Low stock</span>
        </div>
        <div className="admin-catalog__stat admin-catalog__stat--out">
          <strong>{stats.out}</strong>
          <span>Out of stock</span>
        </div>
      </section>

      <div className="admin-catalog__toolbar">
        <label className="admin-catalog__search">
          <Icon name="search" size={15} />
          <input
            value={query}
            onChange={(event) => set('q', event.target.value)}
            placeholder="Search name or SKU"
          />
        </label>
        <label className="admin-catalog__select">
          <span>Storefront</span>
          <select value={house} onChange={(event) => set('house', event.target.value)}>
            <option value="all">All</option>
            {STOREFRONTS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label className="admin-catalog__select">
          <span>Category</span>
          <select value={category} onChange={(event) => set('category', event.target.value)}>
            <option value="all">All</option>
            {categoryOptions.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label className="admin-catalog__select">
          <span>Status</span>
          <select value={status} onChange={(event) => set('status', event.target.value)}>
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
        <label className="admin-catalog__select">
          <span>Stock</span>
          <select value={stock} onChange={(event) => set('stock', event.target.value)}>
            <option value="all">All</option>
            <option value="in-stock">In stock</option>
            <option value="low-stock">Low stock</option>
            <option value="out-of-stock">Out of stock</option>
            <option value="alert">Needs restock</option>
          </select>
        </label>
        {filtersOn ? (
          <button type="button" className="admin-catalog__clear" onClick={clearFilters}>
            Clear filters
          </button>
        ) : null}
      </div>

      <section className="admin-catalog__sheet">
        {!compact ? (
        <div className="admin-catalog__table-wrap">
          {paged.items.length ? (
            <table className="admin-catalog__table">
              <caption className="sr-only">Products</caption>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Storefront</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Updated</th>
                  <th className="is-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paged.items.map((product, index) => (
                  <tr
                    key={product.id}
                    className={selectedId === product.id ? 'is-selected' : undefined}
                    style={{ '--i': index }}
                    onClick={() => openProduct(product)}
                  >
                    <td>
                      <div className="admin-catalog__product">
                        <ProductThumb product={product} />
                        <div>
                          <strong>{product.name}</strong>
                          <span>{product.sku}</span>
                        </div>
                      </div>
                    </td>
                    <td>{categoryLabel(product.category, categories)}</td>
                    <td>
                      <span className={`admin-catalog__house${product.storefront === 'self-care' ? ' admin-catalog__house--self-care' : ''}`}>
                        {houseTag(product.storefront)}
                      </span>
                    </td>
                    <td className="admin-catalog__price">{formatPrice(product.price)}</td>
                    <td>
                      <StockCell product={product} />
                    </td>
                    <td>
                      <StatusDot product={product} />
                    </td>
                    <td className="admin-catalog__updated">{formatUpdated(product.updatedAt)}</td>
                    <td>
                      <ProductActions
                        product={product}
                        menuId={menuId}
                        setMenuId={setMenuId}
                        onView={openProduct}
                        onEdit={openEdit}
                        onToggle={handleToggle}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="admin-catalog__empty">
              <h3>No products match</h3>
              <p>Try another search or clear a filter.</p>
            </div>
          )}
        </div>
        ) : (
        <div className="admin-catalog__cards">
          {paged.items.length ? (
            paged.items.map((product, index) => (
              <article
                key={product.id}
                className={`admin-catalog__card${selectedId === product.id ? ' is-selected' : ''}`}
                style={{ '--i': index }}
                onClick={() => openProduct(product)}
              >
                <div className="admin-catalog__card-top">
                  <div className="admin-catalog__product">
                    <ProductThumb product={product} />
                    <div>
                      <strong>{product.name}</strong>
                      <span>{product.sku}</span>
                    </div>
                  </div>
                  <ProductActions
                    product={product}
                    menuId={menuId}
                    setMenuId={setMenuId}
                    onView={openProduct}
                    onEdit={openEdit}
                    onToggle={handleToggle}
                  />
                </div>
                <div className="admin-catalog__card-meta">
                  <span className={`admin-catalog__house${product.storefront === 'self-care' ? ' admin-catalog__house--self-care' : ''}`}>
                    {houseTag(product.storefront)}
                  </span>
                  <strong className="admin-catalog__price">{formatPrice(product.price)}</strong>
                </div>
                <div className="admin-catalog__card-meta">
                  <StockCell product={product} />
                  <StatusDot product={product} />
                </div>
              </article>
            ))
          ) : (
            <div className="admin-catalog__empty">
              <h3>No products match</h3>
              <p>Try another search or clear a filter.</p>
            </div>
          )}
        </div>
        )}

        <footer className="admin-catalog__foot">
          <span>
            Showing {paged.from}–{paged.to} of {paged.total}
          </span>
          <nav className="admin-catalog__pages" aria-label="Pagination">
            <button type="button" disabled={paged.page <= 1} onClick={() => paged.setPage(paged.page - 1)} aria-label="Previous page">
              ←
            </button>
            {pages.map((page, index) => {
              const prev = pages[index - 1]
              return (
                <span key={page} className="admin-catalog__pagewrap">
                  {prev && page - prev > 1 ? <span className="admin-catalog__ellipsis">…</span> : null}
                  <button
                    type="button"
                    className={page === paged.page ? 'is-current' : undefined}
                    onClick={() => paged.setPage(page)}
                    aria-current={page === paged.page ? 'page' : undefined}
                  >
                    {page}
                  </button>
                </span>
              )
            })}
            <button
              type="button"
              disabled={paged.page >= paged.pageCount}
              onClick={() => paged.setPage(paged.page + 1)}
              aria-label="Next page"
            >
              →
            </button>
          </nav>
        </footer>
      </section>

      {viewing ? (
        <ProductView
          product={viewing}
          categories={categories}
          onClose={() => setViewing(null)}
          onEdit={openEdit}
        />
      ) : null}
    </div>
  )
}

export default Products

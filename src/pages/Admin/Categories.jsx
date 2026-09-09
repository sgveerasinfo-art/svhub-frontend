import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  getAdminCategories,
  createAdminCategory,
  updateAdminCategory,
  deleteAdminCategory,
} from '../../api/adminCategories.js'
import { getAdminProducts } from '../../api/adminProducts.js'
import { useAdminUi, usePagedList } from '../../context/AdminUi.jsx'
import { ADMIN_PAGE_SIZE, STOREFRONTS, formatAdminDate, matchesQuery, slugify } from '../../data/admin.js'
import { Icon } from '../../components/admin/icons.jsx'
import { LoadingState } from '../../components/admin/ui.jsx'
import './Products.css'
import './Categories.css'

const EMPTY = { name: '', slug: '', storefront: 'nutri-hub', description: '', active: true }

function houseTag(id) {
  return id === 'self-care' ? 'Self-Care' : 'Nutri-Hub'
}

function CategoryDialog({ eyebrow, title, copy, onClose, children }) {
  const dialogRef = useRef(null)
  const lastFocus = useRef(null)

  useEffect(() => {
    lastFocus.current = document.activeElement
    const node = dialogRef.current
    node?.querySelector('input, textarea, button')?.focus()

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
    <div className="admin-catalog-dialog admin-cats" role="presentation">
      <button type="button" className="admin-catalog-dialog__backdrop" aria-label="Close dialog" onClick={onClose} />
      <div ref={dialogRef} className="admin-catalog-dialog__panel" role="dialog" aria-modal="true" aria-labelledby="category-dialog-title">
        <header className="admin-catalog-dialog__head">
          <div>
            {eyebrow ? <p className="admin-catalog-dialog__eyebrow">{eyebrow}</p> : null}
            <h2 id="category-dialog-title">{title}</h2>
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

function Field({ label, error, hint, children }) {
  return (
    <label className={`admin-catalog-form__field${error ? ' is-error' : ''}`}>
      <span>{label}</span>
      {children}
      {error ? <em>{error}</em> : hint ? <small>{hint}</small> : null}
    </label>
  )
}

function CategoryForm({ initial, categories, onClose, onSave }) {
  const editing = Boolean(initial?.id)
  const [form, setForm] = useState({
    ...EMPTY,
    ...initial,
    slug: initial?.slug || '',
    active: initial?.active !== false,
  })
  const [errors, setErrors] = useState({})
  const [slugTouched, setSlugTouched] = useState(editing)

  function set(key, value) {
    setForm((current) => ({ ...current, [key]: value }))
    setErrors((current) => {
      if (!current[key]) return current
      const next = { ...current }
      delete next[key]
      return next
    })
  }

  function setName(value) {
    setForm((current) => ({
      ...current,
      name: value,
      slug: slugTouched ? current.slug : slugify(value),
    }))
    setErrors((current) => {
      const next = { ...current }
      delete next.name
      if (!slugTouched) delete next.slug
      return next
    })
  }

  function submit(event) {
    event.preventDefault()
    const next = {}
    const slug = slugify(form.slug || form.name)
    if (!String(form.name).trim()) next.name = 'Enter a category name.'
    if (!slug) next.slug = 'Enter a URL slug.'
    else if (categories.some((item) => item.id !== form.id && (item.slug === slug || item.id === slug))) {
      next.slug = 'That slug is already in use.'
    }
    if (!form.storefront) next.storefront = 'Choose a storefront.'
    setErrors(next)
    if (Object.keys(next).length) return
    onSave({
      ...form,
      name: form.name.trim(),
      slug,
      description: form.description.trim(),
      active: form.active !== false,
    })
  }

  return (
    <CategoryDialog
      eyebrow="Catalogue"
      title={editing ? 'Edit category' : 'Add category'}
      copy={editing ? 'Update this group for Nutri-Hub or Self-Care.' : 'Create a group for Nutri-Hub or Self-Care.'}
      onClose={onClose}
    >
      <form className="admin-catalog-form" onSubmit={submit} noValidate>
        <div className="admin-catalog-form__grid">
          <Field label="Category name" error={errors.name}>
            <input value={form.name} onChange={(event) => setName(event.target.value)} placeholder="Native Rice" />
          </Field>
          <Field label="Slug" error={errors.slug} hint="Used in the storefront URL.">
            <input
              value={form.slug}
              onChange={(event) => {
                setSlugTouched(true)
                set('slug', event.target.value)
              }}
              placeholder="native-rice"
            />
          </Field>
        </div>

        <div>
          <p className="admin-catalog-form__section">Storefront</p>
          <div className="admin-cats__houses" role="radiogroup" aria-label="Storefront">
            {STOREFRONTS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="radio"
                aria-checked={form.storefront === item.id}
                className={`admin-cats__house${form.storefront === item.id ? ' is-on' : ''}${item.id === 'self-care' ? ' is-care' : ''}`}
                onClick={() => set('storefront', item.id)}
              >
                {houseTag(item.id)}
              </button>
            ))}
          </div>
          {errors.storefront ? <em className="admin-cats__error">{errors.storefront}</em> : null}
        </div>

        <Field label="Description" hint="Optional. Shown in the shop when needed.">
          <textarea
            rows={3}
            value={form.description}
            onChange={(event) => set('description', event.target.value)}
            placeholder="A short note about this group."
          />
        </Field>

        <label className="admin-catalog-form__live">
          <span>
            <strong>{form.active ? 'Active' : 'Inactive'}</strong>
            <small>{form.active ? 'Visible on the storefront.' : 'Hidden from the storefront. Products are kept.'}</small>
          </span>
          <input type="checkbox" checked={form.active} onChange={(event) => set('active', event.target.checked)} />
        </label>

        <footer className="admin-catalog-dialog__actions">
          <button type="button" className="admin-catalog-dialog__ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="admin-catalog-dialog__submit">
            {editing ? 'Save category' : 'Add category'}
          </button>
        </footer>
      </form>
    </CategoryDialog>
  )
}

function useCompact() {
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

function groupLabel(house) {
  if (house === 'nutri-hub') return 'Nutri-Hub'
  if (house === 'self-care') return 'Self-Care'
  return 'All categories'
}

function RowMenu({ category, open, onToggle, onEdit, onToggleStatus }) {
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
    function onKey(event) {
      if (event.key === 'Escape') onToggle(null)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    window.addEventListener('resize', onReposition)
    document.querySelector('.admin-content')?.addEventListener('scroll', onReposition)
    document.querySelector('.admin-main')?.addEventListener('scroll', onReposition)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', onReposition)
      document.querySelector('.admin-content')?.removeEventListener('scroll', onReposition)
      document.querySelector('.admin-main')?.removeEventListener('scroll', onReposition)
    }
  }, [open, onToggle])

  return (
    <div className="admin-cats__pop">
      <button
        ref={buttonRef}
        type="button"
        className="admin-cats__more"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`More actions for ${category.name}`}
        onClick={(event) => {
          event.stopPropagation()
          const rect = event.currentTarget.getBoundingClientRect()
          setCoords({ top: rect.bottom + 6, right: window.innerWidth - rect.right })
          onToggle(open ? null : category.id)
        }}
      >
        <Icon name="more" size={16} />
      </button>
      {open
        ? createPortal(
            <div className="admin-cats__menu" role="menu" ref={menuRef} style={coords || undefined}>
              <button
                type="button"
                role="menuitem"
                onClick={(event) => {
                  event.stopPropagation()
                  onToggle(null)
                  onEdit(category)
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
                  onToggleStatus(category)
                }}
              >
                {category.active === false ? 'Activate' : 'Deactivate'}
              </button>
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}

function CategoryRow({ category, count, maxCount, compact, index, menuOpen, setMenuId, onEdit, onToggle }) {
  const fill = Math.round((count / maxCount) * 100)
  const inactive = category.active === false

  return (
    <li className={`admin-cats__row${inactive ? ' is-off' : ''}`} style={{ '--i': index }}>
      <div className="admin-cats__identity">
        <strong className="admin-cats__title">{category.name}</strong>
        <span className="admin-cats__slug">{category.slug}</span>
      </div>

      <span className={`admin-cats__badge${category.storefront === 'self-care' ? ' is-care' : ''}`}>
        {houseTag(category.storefront)}
      </span>

      <div className="admin-cats__products">
        <b>{count}</b>
        <span> {count === 1 ? 'product' : 'products'}</span>
        <div className="admin-cats__meter" aria-hidden="true">
          <i style={{ width: `${fill}%` }} />
        </div>
      </div>

      <span className={`admin-cats__status${inactive ? ' is-off' : ''}`}>
        <i />
        {inactive ? 'Inactive' : 'Active'}
      </span>

      {!compact ? <span className="admin-cats__updated">{formatAdminDate(category.updatedAt)}</span> : null}

      <div className="admin-cats__actions">
        <button type="button" className="admin-cats__edit" onClick={() => onEdit(category)}>
          Edit
        </button>
        <RowMenu
          category={category}
          open={menuOpen}
          onToggle={setMenuId}
          onEdit={onEdit}
          onToggleStatus={onToggle}
        />
      </div>
    </li>
  )
}

function Categories() {
  const { toast, confirm } = useAdminUi()
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshIndex, setRefreshIndex] = useState(0)
  const [query, setQuery] = useState('')
  const [house, setHouse] = useState('all')
  const [status, setStatus] = useState('all')
  const [editing, setEditing] = useState(null)
  const [menuId, setMenuId] = useState(null)
  const compact = useCompact()
  const filtersOn = Boolean(query || house !== 'all' || status !== 'all')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all([
      getAdminCategories().catch(() => ({ data: [] })),
      getAdminProducts({ limit: 100 }).catch(() => ({ data: [] })),
    ])
      .then(([catsRes, prodsRes]) => {
        if (cancelled) return
        setCategories(catsRes.data || [])
        setProducts(prodsRes.data || [])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [refreshIndex])

  const counts = useMemo(() => {
    const map = {}
    products.forEach((product) => {
      map[product.category] = (map[product.category] || 0) + 1
    })
    return map
  }, [products])

  const filtered = useMemo(() => {
    return categories
      .filter((category) => matchesQuery(query, category.name, category.slug, category.description))
      .filter((category) => (house === 'all' ? true : category.storefront === house))
      .filter((category) => {
        if (status === 'all') return true
        if (status === 'active') return category.active !== false
        return category.active === false
      })
  }, [categories, query, house, status])

  const paged = usePagedList(filtered, ADMIN_PAGE_SIZE, `${query}|${house}|${status}|${filtered.length}`)
  const maxCount = useMemo(() => Math.max(1, ...Object.values(counts), 0), [counts])

  const stats = useMemo(
    () => ({
      total: categories.length,
      nutri: categories.filter((item) => item.storefront === 'nutri-hub').length,
      care: categories.filter((item) => item.storefront === 'self-care').length,
      inactive: categories.filter((item) => item.active === false).length,
    }),
    [categories],
  )

  useEffect(() => {
    setMenuId(null)
  }, [query, house, status, paged.page])

  function clearFilters() {
    setQuery('')
    setHouse('all')
    setStatus('all')
  }

  async function handleToggle(category) {
    const next = category.active === false
    const ok = await confirm({
      title: next ? `Activate ${category.name}?` : `Deactivate ${category.name}?`,
      message: next
        ? 'This group will be available on the storefront again.'
        : 'This group will be hidden from the storefront. Products stay assigned.',
      confirmLabel: next ? 'Activate' : 'Deactivate',
      danger: !next,
    })
    if (!ok) return
    try {
      await updateAdminCategory(category.id || category._id, { active: next, isActive: next })
      setCategories((prev) =>
        prev.map((c) => (c.id === category.id ? { ...c, active: next, isActive: next } : c))
      )
      toast.success(next ? 'Category activated' : 'Category deactivated')
    } catch (err) {
      toast.error(err.message || 'Could not update category status')
    }
  }

  async function handleSave(payload) {
    try {
      if (payload.id) {
        const res = await updateAdminCategory(payload.id, payload)
        if (res?.data) {
          setCategories((prev) => prev.map((c) => (c.id === payload.id ? res.data : c)))
        }
        toast.success('Category saved')
      } else {
        const res = await createAdminCategory(payload)
        if (res?.data) {
          setCategories((prev) => [...prev, res.data])
        }
        toast.success('Category added')
      }
      setEditing(null)
    } catch (err) {
      toast.error(err.message || 'Could not save category')
    }
  }

  if (loading) return <LoadingState label="Loading categories" />

  return (
    <div className="admin-catalog admin-cats">
      <header className="admin-cats__head">
        <div>
          <p className="admin-cats__eyebrow">Catalogue</p>
          <h1 className="admin-title">Categories</h1>
          <p className="admin-cats__lede">Manage how products are organised across Nutri-Hub and Self-Care.</p>
        </div>
        <button type="button" className="admin-cats__add" onClick={() => setEditing(EMPTY)}>
          <Icon name="plus" size={14} />
          Add Category
          <span className="admin-cats__add-arrow" aria-hidden="true">
            <Icon name="arrow" size={14} />
          </span>
        </button>
      </header>

      <section className="admin-cats__insights" aria-label="Category summary">
        <div>
          <span>Total</span>
          <strong>{stats.total}</strong>
        </div>
        <div className="is-nutri">
          <span>Nutri-Hub</span>
          <strong>{stats.nutri}</strong>
        </div>
        <div className="is-care">
          <span>Self-Care</span>
          <strong>{stats.care}</strong>
        </div>
        <div className="is-quiet">
          <span>Inactive</span>
          <strong>{stats.inactive}</strong>
        </div>
      </section>

      <div className="admin-cats__toolbar">
        <label className="admin-cats__search">
          <Icon name="search" size={15} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search categories..."
            aria-label="Search categories"
          />
        </label>
        <label className="admin-cats__filter">
          <span>Storefront</span>
          <select value={house} onChange={(event) => setHouse(event.target.value)} aria-label="Filter by storefront">
            <option value="all">All</option>
            {STOREFRONTS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label className="admin-cats__filter">
          <span>Status</span>
          <select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter by status">
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
      </div>

      <section className="admin-cats__board" aria-label="Category management">
        {paged.items.length ? (
          <>
            <div className="admin-cats__group">
              <p>{groupLabel(house)}</p>
              <span>
                {filtered.length} {filtered.length === 1 ? 'category' : 'categories'}
              </span>
            </div>

            {!compact ? (
              <div className="admin-cats__cols" aria-hidden="true">
                <span>Category</span>
                <span>Store</span>
                <span>Products</span>
                <span>Status</span>
                <span>Last updated</span>
                <span>Actions</span>
              </div>
            ) : null}

            <ul className="admin-cats__list">
              {paged.items.map((category, index) => (
                <CategoryRow
                  key={category.id}
                  category={category}
                  count={counts[category.id] || 0}
                  maxCount={maxCount}
                  compact={compact}
                  index={index}
                  menuOpen={menuId === category.id}
                  setMenuId={setMenuId}
                  onEdit={setEditing}
                  onToggle={handleToggle}
                />
              ))}
            </ul>

            <footer className="admin-cats__foot">
              <span>
                Showing {paged.from}–{paged.to} of {paged.total}
              </span>
              {paged.pageCount > 1 ? (
                <nav className="admin-cats__pages" aria-label="Pagination">
                  <button type="button" disabled={paged.page <= 1} onClick={() => paged.setPage(paged.page - 1)} aria-label="Previous page">
                    ‹
                  </button>
                  {Array.from({ length: paged.pageCount }, (_, index) => index + 1).map((page) => (
                    <button
                      key={page}
                      type="button"
                      className={page === paged.page ? 'is-current' : undefined}
                      onClick={() => paged.setPage(page)}
                      aria-current={page === paged.page ? 'page' : undefined}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    type="button"
                    disabled={paged.page >= paged.pageCount}
                    onClick={() => paged.setPage(paged.page + 1)}
                    aria-label="Next page"
                  >
                    ›
                  </button>
                </nav>
              ) : (
                <nav className="admin-cats__pages" aria-label="Pagination">
                  <button type="button" disabled aria-label="Previous page">
                    ‹
                  </button>
                  <button type="button" className="is-current" aria-current="page">
                    1
                  </button>
                  <button type="button" disabled aria-label="Next page">
                    ›
                  </button>
                </nav>
              )}
            </footer>
          </>
        ) : (
          <div className="admin-cats__empty">
            <h3>No categories found</h3>
            <p>Try adjusting your search or filters.</p>
            {filtersOn ? (
              <button type="button" className="admin-cats__clear" onClick={clearFilters}>
                Clear filters
              </button>
            ) : null}
          </div>
        )}
      </section>

      {editing ? (
        <CategoryForm initial={editing} categories={categories} onClose={() => setEditing(null)} onSave={handleSave} />
      ) : null}
    </div>
  )
}

export default Categories

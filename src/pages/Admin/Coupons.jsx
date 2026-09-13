import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  getAdminCoupons,
  createAdminCoupon,
  updateAdminCoupon,
  disableAdminCoupon,
  archiveAdminCoupon,
} from '../../api/adminCoupons.js'
import { getAdminCategories } from '../../api/adminCategories.js'
import { getAdminProducts } from '../../api/adminProducts.js'
import { useAdminUi, usePagedList } from '../../context/AdminUi.jsx'
import { ADMIN_PAGE_SIZE, formatAdminDate, matchesQuery } from '../../data/admin.js'
import { Icon } from '../../components/admin/icons.jsx'
import { LoadingState } from '../../components/admin/ui.jsx'
import './Products.css'
import './Categories.css'
import './Coupons.css'

const EMPTY = {
  code: '',
  discountType: 'PERCENTAGE',
  discountValue: 10,
  maxDiscount: '',
  minCartValue: 0,
  productScope: 'ALL',
  productIds: [],
  categoryScope: 'ALL',
  categorySlugs: [],
  customerEligibility: 'ALL',
  startAt: '',
  expiresAt: '',
  usageLimit: '',
  perCustomerLimit: '',
  enabled: true,
}

function statusLabel(status) {
  if (status === 'active') return 'Active'
  if (status === 'scheduled') return 'Scheduled'
  if (status === 'expired') return 'Expired'
  return 'Disabled'
}

function eligibilityLabel(value) {
  if (value === 'NEW') return 'New customers'
  if (value === 'EXISTING') return 'Existing customers'
  return 'All customers'
}

function discountLabel(coupon) {
  if (coupon.discountType === 'PERCENTAGE') {
    const base = `${coupon.discountValue}% off`
    return coupon.maxDiscount != null ? `${base} · max ₹${coupon.maxDiscount}` : base
  }
  return `₹${coupon.discountValue} off`
}

function scopeLabel(coupon) {
  const parts = []
  if (coupon.productScope === 'SELECTED') parts.push('Selected products')
  if (coupon.categoryScope === 'SELECTED') parts.push('Selected categories')
  if (!parts.length) parts.push('Entire catalogue')
  return parts.join(' · ')
}

function CouponDialog({ eyebrow, title, copy, onClose, children }) {
  const dialogRef = useRef(null)
  const lastFocus = useRef(null)

  useEffect(() => {
    lastFocus.current = document.activeElement
    dialogRef.current?.querySelector('input, select, textarea, button')?.focus()
    function onKey(event) {
      if (event.key === 'Escape') onClose()
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
    <div className="admin-catalog-dialog admin-cats admin-coupons-dialog" role="presentation">
      <button type="button" className="admin-catalog-dialog__backdrop" aria-label="Close dialog" onClick={onClose} />
      <div
        ref={dialogRef}
        className="admin-catalog-dialog__panel admin-coupons-dialog__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="coupon-dialog-title"
      >
        <header className="admin-catalog-dialog__head admin-coupons-dialog__head">
          <div>
            {eyebrow ? <p className="admin-catalog-dialog__eyebrow">{eyebrow}</p> : null}
            <h2 id="coupon-dialog-title">{title}</h2>
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

function Field({ label, error, hint, className = '', children }) {
  return (
    <label className={`admin-catalog-form__field admin-coupons-field${className ? ` ${className}` : ''}${error ? ' is-error' : ''}`}>
      <span>{label}</span>
      {children}
      {error ? <em>{error}</em> : hint ? <small>{hint}</small> : null}
    </label>
  )
}

function buildPreview(form) {
  const code = String(form.code || '').trim().toUpperCase() || 'CODE'
  const value = Number(form.discountValue)
  const discount =
    form.discountType === 'PERCENTAGE'
      ? Number.isFinite(value) && value > 0
        ? `${value}% off`
        : '—% off'
      : Number.isFinite(value) && value > 0
        ? `₹${value} off`
        : '₹— off'
  const parts = [code, discount]
  if (form.discountType === 'PERCENTAGE' && form.maxDiscount !== '' && form.maxDiscount != null) {
    parts.push(`cap ₹${form.maxDiscount}`)
  }
  const min = Number(form.minCartValue)
  if (Number.isFinite(min) && min > 0) parts.push(`min cart ₹${min}`)
  return parts.join(' · ')
}

function CouponForm({ initial, categories, products, onClose, onSave }) {
  const editing = Boolean(initial?.id)
  const [form, setForm] = useState({
    ...EMPTY,
    ...initial,
    maxDiscount: initial?.maxDiscount ?? '',
    usageLimit: initial?.usageLimit ?? '',
    perCustomerLimit: initial?.perCustomerLimit ?? '',
    startAt: initial?.startAtLocal || initial?.startAt || '',
    expiresAt: initial?.expiresAtLocal || initial?.expiresAt || '',
    productIds: initial?.productIds || [],
    categorySlugs: initial?.categorySlugs || [],
    enabled: initial?.enabled !== false,
  })
  const [errors, setErrors] = useState({})
  const [productQuery, setProductQuery] = useState('')
  const [saving, setSaving] = useState(false)

  function set(key, value) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function toggleProduct(id) {
    setForm((current) => {
      const ids = new Set(current.productIds || [])
      if (ids.has(id)) ids.delete(id)
      else ids.add(id)
      return { ...current, productIds: [...ids] }
    })
  }

  function toggleCategory(slug) {
    setForm((current) => {
      const slugs = new Set(current.categorySlugs || [])
      if (slugs.has(slug)) slugs.delete(slug)
      else slugs.add(slug)
      return { ...current, categorySlugs: [...slugs] }
    })
  }

  const filteredProducts = useMemo(() => {
    const q = productQuery.trim().toLowerCase()
    const list = products || []
    if (!q) return list
    const selected = new Set(form.productIds || [])
    return list.filter(
      (p) => selected.has(String(p.id || p._id)) || matchesQuery(q, p.name, p.slug, p.sku),
    )
  }, [products, productQuery, form.productIds])

  async function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = {}
    if (!String(form.code || '').trim()) nextErrors.code = 'Code is required'
    if (!form.discountValue || Number(form.discountValue) <= 0) nextErrors.discountValue = 'Enter a valid discount'
    if (!form.startAt) nextErrors.startAt = 'Start is required'
    if (!form.expiresAt) nextErrors.expiresAt = 'Expiry is required'
    if (form.productScope === 'SELECTED' && !(form.productIds || []).length) {
      nextErrors.productIds = 'Select at least one product'
    }
    if (form.categoryScope === 'SELECTED' && !(form.categorySlugs || []).length) {
      nextErrors.categorySlugs = 'Select at least one category'
    }
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    const payload = {
      code: String(form.code).trim().toUpperCase(),
      discountType: form.discountType,
      discountValue: Number(form.discountValue),
      maxDiscount:
        form.discountType === 'PERCENTAGE' && form.maxDiscount !== '' && form.maxDiscount != null
          ? Number(form.maxDiscount)
          : null,
      minCartValue: Number(form.minCartValue) || 0,
      productScope: form.productScope,
      productIds: form.productScope === 'SELECTED' ? form.productIds : [],
      categoryScope: form.categoryScope,
      categorySlugs: form.categoryScope === 'SELECTED' ? form.categorySlugs : [],
      customerEligibility: form.customerEligibility,
      startAt: form.startAt,
      expiresAt: form.expiresAt,
      usageLimit: form.usageLimit === '' || form.usageLimit == null ? null : Number(form.usageLimit),
      perCustomerLimit:
        form.perCustomerLimit === '' || form.perCustomerLimit == null ? null : Number(form.perCustomerLimit),
      enabled: form.enabled !== false,
    }
    if (editing) payload.id = initial.id

    setSaving(true)
    try {
      await onSave(payload)
    } finally {
      setSaving(false)
    }
  }

  const preview = buildPreview(form)
  const selectedProductCount = (form.productIds || []).length
  const selectedCategoryCount = (form.categorySlugs || []).length

  return (
    <CouponDialog
      eyebrow={editing ? 'Edit coupon' : 'New coupon'}
      title={editing ? form.code || 'Edit coupon' : 'Create coupon'}
      copy="Applied and verified server-side at cart and checkout."
      onClose={onClose}
    >
      <form className="admin-catalog-form admin-coupons-form" onSubmit={handleSubmit}>
        <div className="admin-coupons-form__scroll">
          <div className="admin-coupons-preview" aria-live="polite">
            <span className="admin-coupons-preview__label">Preview</span>
            <strong>{preview}</strong>
          </div>

          <section className="admin-coupons-section">
            <header className="admin-coupons-section__head">
              <h3>Discount</h3>
              <p>Code customers enter and how much they save.</p>
            </header>
            <div className="admin-catalog-form__grid">
              <Field label="Coupon code" error={errors.code} className="admin-coupons-field--code">
                <input
                  value={form.code}
                  onChange={(e) => set('code', e.target.value.toUpperCase())}
                  disabled={editing && (initial?.redeemedCount || 0) > 0}
                  placeholder="WELCOME10"
                  autoComplete="off"
                  spellCheck={false}
                />
              </Field>
              <div className="admin-coupons-field admin-coupons-type">
                <span>Discount type</span>
                <div className="admin-coupons-type__seg" role="group" aria-label="Discount type">
                  <button
                    type="button"
                    className={form.discountType === 'PERCENTAGE' ? 'is-active' : ''}
                    onClick={() => set('discountType', 'PERCENTAGE')}
                  >
                    Percentage
                  </button>
                  <button
                    type="button"
                    className={form.discountType === 'FIXED' ? 'is-active' : ''}
                    onClick={() => set('discountType', 'FIXED')}
                  >
                    Fixed ₹
                  </button>
                </div>
              </div>
              <Field
                label={form.discountType === 'PERCENTAGE' ? 'Percent off' : 'Amount off (₹)'}
                error={errors.discountValue}
              >
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.discountValue}
                  onChange={(e) => set('discountValue', e.target.value)}
                />
              </Field>
              {form.discountType === 'PERCENTAGE' ? (
                <Field label="Max discount (₹)" hint="Optional ceiling on percentage savings">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.maxDiscount}
                    onChange={(e) => set('maxDiscount', e.target.value)}
                    placeholder="No cap"
                  />
                </Field>
              ) : (
                <Field label="Min cart value (₹)" hint="Cart must reach this before the code applies">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.minCartValue}
                    onChange={(e) => set('minCartValue', e.target.value)}
                  />
                </Field>
              )}
              {form.discountType === 'PERCENTAGE' ? (
                <Field label="Min cart value (₹)" hint="Cart must reach this before the code applies">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.minCartValue}
                    onChange={(e) => set('minCartValue', e.target.value)}
                  />
                </Field>
              ) : null}
            </div>
            <label className="admin-catalog-form__live admin-coupons-enabled">
              <span>
                <strong>Coupon enabled</strong>
                <small>{form.enabled ? 'Live when the validity window allows' : 'Hidden from cart until you enable it'}</small>
              </span>
              <input
                type="checkbox"
                checked={form.enabled !== false}
                onChange={(e) => set('enabled', e.target.checked)}
              />
            </label>
          </section>

          <section className="admin-coupons-section">
            <header className="admin-coupons-section__head">
              <h3>Applies to</h3>
              <p>Limit the offer to products, categories, or the full catalogue.</p>
            </header>
            <div className="admin-catalog-form__grid">
              <Field label="Products">
                <select value={form.productScope} onChange={(e) => set('productScope', e.target.value)}>
                  <option value="ALL">Entire catalogue</option>
                  <option value="SELECTED">Selected products only</option>
                </select>
              </Field>
              <Field label="Categories">
                <select value={form.categoryScope} onChange={(e) => set('categoryScope', e.target.value)}>
                  <option value="ALL">All categories</option>
                  <option value="SELECTED">Selected categories only</option>
                </select>
              </Field>
            </div>
            {form.productScope === 'SELECTED' ? (
              <div className="admin-coupons-pick">
                <div className="admin-coupons-pick__bar">
                  <input
                    value={productQuery}
                    onChange={(e) => setProductQuery(e.target.value)}
                    placeholder="Search by name, SKU, or slug"
                  />
                  <span>
                    {selectedProductCount} selected · {filteredProducts.length}
                    {productQuery.trim() ? ` of ${(products || []).length}` : ''} shown
                  </span>
                </div>
                {errors.productIds ? <em className="admin-coupons-error">{errors.productIds}</em> : null}
                <div className="admin-coupons-pick__list">
                  {filteredProducts.map((p) => {
                    const id = String(p.id || p._id)
                    const checked = (form.productIds || []).includes(id)
                    return (
                      <label key={id} className={`admin-coupons-pick__item${checked ? ' is-checked' : ''}`}>
                        <input type="checkbox" checked={checked} onChange={() => toggleProduct(id)} />
                        <span>{p.name}</span>
                      </label>
                    )
                  })}
                  {!filteredProducts.length ? (
                    <p className="admin-coupons-pick__empty">No products match that search.</p>
                  ) : null}
                </div>
              </div>
            ) : null}
            {form.categoryScope === 'SELECTED' ? (
              <div className="admin-coupons-pick">
                <div className="admin-coupons-pick__bar">
                  <span className="admin-coupons-pick__bar-label">Choose categories</span>
                  <span>{selectedCategoryCount} selected</span>
                </div>
                {errors.categorySlugs ? <em className="admin-coupons-error">{errors.categorySlugs}</em> : null}
                <div className="admin-coupons-pick__list">
                  {(categories || []).map((c) => {
                    const slug = c.slug
                    const checked = (form.categorySlugs || []).includes(slug)
                    return (
                      <label key={slug} className={`admin-coupons-pick__item${checked ? ' is-checked' : ''}`}>
                        <input type="checkbox" checked={checked} onChange={() => toggleCategory(slug)} />
                        <span>{c.name}</span>
                      </label>
                    )
                  })}
                </div>
              </div>
            ) : null}
          </section>

          <section className="admin-coupons-section">
            <header className="admin-coupons-section__head">
              <h3>Customers &amp; limits</h3>
              <p>Who can redeem and how many times the code can be used.</p>
            </header>
            <div className="admin-catalog-form__grid">
              <Field label="Customer eligibility" className="admin-coupons-field--span">
                <select
                  value={form.customerEligibility}
                  onChange={(e) => set('customerEligibility', e.target.value)}
                >
                  <option value="ALL">All customers</option>
                  <option value="NEW">New customers only</option>
                  <option value="EXISTING">Existing customers only</option>
                </select>
              </Field>
              <Field label="Total usage limit" hint="Blank = unlimited redemptions">
                <input
                  type="number"
                  min="1"
                  value={form.usageLimit}
                  onChange={(e) => set('usageLimit', e.target.value)}
                  placeholder="Unlimited"
                />
              </Field>
              <Field label="Per-customer limit" hint="Blank = unlimited per account">
                <input
                  type="number"
                  min="1"
                  value={form.perCustomerLimit}
                  onChange={(e) => set('perCustomerLimit', e.target.value)}
                  placeholder="Unlimited"
                />
              </Field>
            </div>
          </section>

          <section className="admin-coupons-section admin-coupons-section--last">
            <header className="admin-coupons-section__head">
              <h3>Validity</h3>
              <p>Times use Asia/Kolkata. Outside this window the code will not apply.</p>
            </header>
            <div className="admin-catalog-form__grid">
              <Field label="Starts" error={errors.startAt}>
                <input
                  type="datetime-local"
                  value={String(form.startAt || '').slice(0, 16)}
                  onChange={(e) => set('startAt', e.target.value)}
                />
              </Field>
              <Field label="Expires" error={errors.expiresAt}>
                <input
                  type="datetime-local"
                  value={String(form.expiresAt || '').slice(0, 16)}
                  onChange={(e) => set('expiresAt', e.target.value)}
                />
              </Field>
            </div>
          </section>
        </div>

        <footer className="admin-catalog-dialog__actions admin-coupons-form__actions">
          <button type="button" className="admin-catalog-dialog__ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="admin-catalog-dialog__submit" disabled={saving}>
            {saving ? 'Saving…' : editing ? 'Save changes' : 'Create coupon'}
          </button>
        </footer>
      </form>
    </CouponDialog>
  )
}

function CouponRowMenu({ coupon, open, onToggle, onEdit, onDisable, onEnable, onArchive }) {
  const buttonRef = useRef(null)
  const menuRef = useRef(null)
  const [coords, setCoords] = useState(null)

  useEffect(() => {
    if (!open) return undefined
    function onDoc(event) {
      if (
        menuRef.current?.contains(event.target) ||
        buttonRef.current?.contains(event.target)
      ) {
        return
      }
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
        aria-label={`More actions for ${coupon.code}`}
        onClick={(event) => {
          event.stopPropagation()
          const rect = event.currentTarget.getBoundingClientRect()
          setCoords({ top: rect.bottom + 6, right: window.innerWidth - rect.right })
          onToggle(open ? null : coupon.id)
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
                  onEdit(coupon)
                }}
              >
                Edit coupon
              </button>
              {coupon.enabled ? (
                <button
                  type="button"
                  role="menuitem"
                  onClick={(event) => {
                    event.stopPropagation()
                    onToggle(null)
                    onDisable(coupon)
                  }}
                >
                  Disable
                </button>
              ) : (
                <button
                  type="button"
                  role="menuitem"
                  onClick={(event) => {
                    event.stopPropagation()
                    onToggle(null)
                    onEnable(coupon)
                  }}
                >
                  Enable
                </button>
              )}
              <button
                type="button"
                role="menuitem"
                className="is-danger"
                onClick={(event) => {
                  event.stopPropagation()
                  onToggle(null)
                  onArchive(coupon)
                }}
              >
                Archive
              </button>
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}

function CouponRow({
  coupon,
  index,
  menuOpen,
  setMenuId,
  onEdit,
  onDisable,
  onEnable,
  onArchive,
}) {
  const muted = coupon.status === 'expired' || coupon.status === 'disabled'

  return (
    <li className={`admin-coupons__row${muted ? ' is-muted' : ''}`} style={{ '--i': index }}>
      <div className="admin-coupons__identity">
        <strong className="admin-coupons__code">{coupon.code}</strong>
        <span className="admin-coupons__sub">
          {eligibilityLabel(coupon.customerEligibility)} · {scopeLabel(coupon)}
        </span>
      </div>

      <div className="admin-coupons__discount">
        <b>{discountLabel(coupon)}</b>
        {coupon.minCartValue > 0 ? <span>Min cart ₹{coupon.minCartValue}</span> : <span>No minimum</span>}
      </div>

      <span className={`admin-coupons__status is-${coupon.status}`}>
        <i />
        {statusLabel(coupon.status)}
      </span>

      <div className="admin-coupons__usage">
        <b>
          {coupon.usageCount || 0}
          {coupon.usageLimit != null ? ` / ${coupon.usageLimit}` : ''}
        </b>
        <span>{coupon.usageLimit != null ? 'redemptions' : 'unlimited'}</span>
      </div>

      <div className="admin-coupons__window">
        <span>{formatAdminDate(coupon.startAt)}</span>
        <span className="admin-coupons__window-to">→ {formatAdminDate(coupon.expiresAt)}</span>
      </div>

      <div className="admin-coupons__actions">
        <button type="button" className="admin-cats__edit" onClick={() => onEdit(coupon)}>
          Edit
        </button>
        <CouponRowMenu
          coupon={coupon}
          open={menuOpen}
          onToggle={setMenuId}
          onEdit={onEdit}
          onDisable={onDisable}
          onEnable={onEnable}
          onArchive={onArchive}
        />
      </div>
    </li>
  )
}

export default function Coupons() {
  const { toast, confirm } = useAdminUi()
  const [coupons, setCoupons] = useState([])
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [editing, setEditing] = useState(null)
  const [menuId, setMenuId] = useState(null)

  async function loadAllProducts() {
    const pageSize = 100
    let page = 1
    let totalPages = 1
    const all = []
    while (page <= totalPages) {
      const res = await getAdminProducts({ limit: pageSize, page })
      const batch = res.data || res.products || []
      all.push(...batch)
      totalPages = Math.max(1, res.pagination?.totalPages || 1)
      if (!batch.length) break
      page += 1
      if (page > 50) break
    }
    return all
  }

  async function load() {
    setLoading(true)
    try {
      const [couponRes, catRes, productList] = await Promise.all([
        getAdminCoupons({ archived: false }),
        getAdminCategories(),
        loadAllProducts(),
      ])
      setCoupons(couponRes.data || [])
      setCategories(catRes.data || [])
      setProducts(productList)
    } catch (err) {
      toast.error(err.message || 'Could not load coupons')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const liveCoupons = useMemo(() => coupons.filter((c) => !c.archived), [coupons])

  const filtered = useMemo(() => {
    return liveCoupons
      .filter((c) => matchesQuery(query, c.code))
      .filter((c) => (status === 'all' ? true : c.status === status))
  }, [liveCoupons, query, status])

  const paged = usePagedList(filtered, ADMIN_PAGE_SIZE, `${query}|${status}|${filtered.length}`)

  const stats = useMemo(
    () => ({
      total: liveCoupons.length,
      active: liveCoupons.filter((c) => c.status === 'active').length,
      scheduled: liveCoupons.filter((c) => c.status === 'scheduled').length,
      expired: liveCoupons.filter((c) => c.status === 'expired' || c.status === 'disabled').length,
    }),
    [liveCoupons],
  )

  const filtersOn = Boolean(query || status !== 'all')

  useEffect(() => {
    setMenuId(null)
  }, [query, status, paged.page])

  async function handleSave(payload) {
    try {
      if (payload.id) {
        const res = await updateAdminCoupon(payload.id, payload)
        setCoupons((prev) => prev.map((c) => (c.id === payload.id ? res.data : c)))
        toast.success('Coupon saved')
      } else {
        const res = await createAdminCoupon(payload)
        setCoupons((prev) => [res.data, ...prev])
        toast.success('Coupon created')
      }
      setEditing(null)
    } catch (err) {
      toast.error(err.message || 'Could not save coupon')
      throw err
    }
  }

  async function handleDisable(coupon) {
    const used = (coupon.redeemedCount || coupon.usageCount || 0) > 0
    const ok = await confirm({
      title: `Disable ${coupon.code}?`,
      message: used
        ? 'This coupon has been used on orders. Disabling stops new redemptions; past orders keep their discount snapshot.'
        : 'Customers will no longer be able to apply this code.',
      confirmLabel: 'Disable',
      danger: true,
    })
    if (!ok) return
    try {
      const res = await disableAdminCoupon(coupon.id)
      setCoupons((prev) => prev.map((c) => (c.id === coupon.id ? res.data : c)))
      toast.success('Coupon disabled')
    } catch (err) {
      toast.error(err.message || 'Could not disable coupon')
    }
  }

  async function handleEnable(coupon) {
    try {
      const res = await updateAdminCoupon(coupon.id, { enabled: true })
      setCoupons((prev) => prev.map((c) => (c.id === coupon.id ? res.data : c)))
      toast.success('Coupon enabled')
    } catch (err) {
      toast.error(err.message || 'Could not enable coupon')
    }
  }

  async function handleArchive(coupon) {
    const ok = await confirm({
      title: `Archive ${coupon.code}?`,
      message: 'Archived coupons are hidden from this list but kept for order history.',
      confirmLabel: 'Archive',
      danger: true,
    })
    if (!ok) return
    try {
      await archiveAdminCoupon(coupon.id)
      setCoupons((prev) => prev.filter((c) => c.id !== coupon.id))
      toast.success('Coupon archived')
    } catch (err) {
      toast.error(err.message || 'Could not archive coupon')
    }
  }

  function clearFilters() {
    setQuery('')
    setStatus('all')
  }

  if (loading) return <LoadingState label="Loading coupons" />

  return (
    <div className="admin-catalog admin-cats admin-coupons">
      <header className="admin-cats__head">
        <div>
          <p className="admin-cats__eyebrow">Promotions</p>
          <h1 className="admin-title">Coupons</h1>
          <p className="admin-cats__lede">
            Create checkout discount codes with eligibility, usage limits, and validity windows.
          </p>
        </div>
        <button type="button" className="admin-cats__add" onClick={() => setEditing(EMPTY)}>
          <Icon name="plus" size={14} />
          Add Coupon
          <span className="admin-cats__add-arrow" aria-hidden="true">
            <Icon name="arrow" size={14} />
          </span>
        </button>
      </header>

      <section className="admin-cats__insights admin-coupons__insights" aria-label="Coupon summary">
        <div>
          <span>Total</span>
          <strong>{stats.total}</strong>
        </div>
        <div className="is-active">
          <span>Active</span>
          <strong>{stats.active}</strong>
        </div>
        <div className="is-scheduled">
          <span>Scheduled</span>
          <strong>{stats.scheduled}</strong>
        </div>
        <div className="is-quiet">
          <span>Ended</span>
          <strong>{stats.expired}</strong>
        </div>
      </section>

      <div className="admin-cats__toolbar">
        <label className="admin-cats__search">
          <Icon name="search" size={15} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search coupon codes…"
            aria-label="Search coupon codes"
          />
        </label>
        <label className="admin-cats__filter">
          <span>Status</span>
          <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="scheduled">Scheduled</option>
            <option value="expired">Expired</option>
            <option value="disabled">Disabled</option>
          </select>
        </label>
        {filtersOn ? (
          <button type="button" className="admin-cats__clear" onClick={clearFilters}>
            Clear filters
          </button>
        ) : null}
      </div>

      <section className="admin-cats__board admin-coupons__board" aria-label="Coupon management">
        {paged.items.length ? (
          <>
            <div className="admin-cats__group">
              <p>Discount codes</p>
              <span>
                {filtered.length} {filtered.length === 1 ? 'coupon' : 'coupons'}
              </span>
            </div>

            <div className="admin-coupons__cols" aria-hidden="true">
              <span>Code</span>
              <span>Offer</span>
              <span>Status</span>
              <span>Usage</span>
              <span>Validity</span>
              <span>Actions</span>
            </div>

            <ul className="admin-coupons__list">
              {paged.items.map((coupon, index) => (
                <CouponRow
                  key={coupon.id}
                  coupon={coupon}
                  index={index}
                  menuOpen={menuId === coupon.id}
                  setMenuId={setMenuId}
                  onEdit={setEditing}
                  onDisable={handleDisable}
                  onEnable={handleEnable}
                  onArchive={handleArchive}
                />
              ))}
            </ul>

            <footer className="admin-cats__foot">
              <span>
                Showing {paged.from}–{paged.to} of {paged.total}
              </span>
              <nav className="admin-cats__pages" aria-label="Pagination">
                <button
                  type="button"
                  disabled={paged.page <= 1}
                  onClick={() => paged.setPage(paged.page - 1)}
                  aria-label="Previous page"
                >
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
            </footer>
          </>
        ) : (
          <div className="admin-cats__empty">
            <h3>{filtersOn ? 'No coupons match' : 'No coupons yet'}</h3>
            <p>
              {filtersOn
                ? 'Try another search or clear your filters.'
                : 'Create your first promotional code for checkout.'}
            </p>
            {filtersOn ? (
              <button type="button" className="admin-cats__clear" onClick={clearFilters}>
                Clear filters
              </button>
            ) : (
              <button type="button" className="admin-cats__add" onClick={() => setEditing(EMPTY)}>
                <Icon name="plus" size={14} />
                Add Coupon
              </button>
            )}
          </div>
        )}
      </section>

      {editing ? (
        <CouponForm
          initial={editing}
          categories={categories}
          products={products}
          onClose={() => setEditing(null)}
          onSave={handleSave}
        />
      ) : null}
    </div>
  )
}

import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  getAdminProduct,
  getAdminProducts,
  createAdminProduct,
  updateAdminProduct,
} from '../../api/adminProducts.js'
import { getAdminCategories } from '../../api/adminCategories.js'
import { useAdminUi } from '../../context/AdminUi.jsx'
import { STOREFRONTS, slugify, stockFromQty, storefrontLabel } from '../../data/admin.js'
import { getProductDetail } from '../../data/productDetails.js'
import { formatPrice } from '../../utils/money.js'
import { Icon } from '../../components/admin/icons.jsx'
import { EmptyState, LoadingState } from '../../components/admin/ui.jsx'
import ProductEditView from './ProductEditView.jsx'
import './Products.css'
import './ProductNew.css'

const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const MAX_GALLERY = 4
const HOUSE_COPY = {
  'nutri-hub': 'Native grains, foods & traditional pantry products',
  'self-care': 'Traditional soaps & natural self-care',
}

const EMPTY = {
  name: '',
  slug: '',
  description: '',
  storefront: 'nutri-hub',
  category: '',
  price: '',
  originalPrice: '',
  sku: '',
  qty: '24',
  image: '',
  gallery: [],
  weight: '',
  ingredients: '',
  details: '',
  active: true,
}

function stockCopy(stock) {
  if (stock === 'out-of-stock') return 'Out of stock'
  if (stock === 'low-stock') return 'Low stock'
  return 'In stock'
}

function discountFrom(price, original) {
  const sell = Number(price)
  const compare = Number(original)
  if (!(sell > 0) || !(compare > sell)) return 0
  return Math.round((1 - sell / compare) * 100)
}

function skuFrom(name, storefront) {
  const stem = slugify(name).replace(/-/g, '').slice(0, 6).toUpperCase() || 'ITEM'
  return `SVH-${storefront === 'self-care' ? 'SC' : 'NH'}-${stem}`
}

function textFromList(value, fallback) {
  if (Array.isArray(value) && value.length) return value.join('\n')
  if (typeof value === 'string' && value.trim()) return value
  if (Array.isArray(fallback) && fallback.length) return fallback.join('\n')
  return ''
}

function detailsFrom(value, information) {
  if (value && String(value).trim()) return String(value)
  if (Array.isArray(information) && information.length) {
    return information.map((row) => `${row.label}: ${row.value}`).join('\n')
  }
  return ''
}

function formFromProduct(product) {
  const detail = getProductDetail(product.slug || product.id)
  const hero = product.image || detail?.image || ''
  const extras = Array.isArray(product.gallery) && product.gallery.length
    ? product.gallery
    : (detail?.gallery || [])
        .map((item) => item?.src || item)
        .filter((src) => src && src !== hero)
        .slice(0, MAX_GALLERY)

  return {
    name: product.name || '',
    slug: product.slug || product.id || '',
    description: product.description || detail?.description || '',
    storefront: product.storefront || 'nutri-hub',
    category: product.category || '',
    price: product.price ?? '',
    originalPrice: product.originalPrice || '',
    sku: product.sku || '',
    qty: String(product.qty ?? ''),
    image: hero,
    gallery: extras,
    weight: product.weight || '',
    ingredients: textFromList(product.ingredients, detail?.ingredients),
    details: detailsFrom(product.details, detail?.information),
    active: product.active !== false,
  }
}

function Field({ label, error, hint, wide, children }) {
  return (
    <label className={`product-new__field${wide ? ' is-wide' : ''}${error ? ' is-error' : ''}`}>
      <span>{label}</span>
      {children}
      {error ? <em>{error}</em> : hint ? <small>{hint}</small> : null}
    </label>
  )
}

function readImageFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('Choose an image file.'))
      return
    }
    if (!file.type.startsWith('image/')) {
      reject(new Error('Use a JPG, PNG, or WebP image.'))
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      reject(new Error('Keep images under 5 MB.'))
      return
    }
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('Could not read that file.'))
    reader.readAsDataURL(file)
  })
}

function ImageSlot({ label, copy, value, status, error, onPick, onClear, compact }) {
  const [over, setOver] = useState(false)

  function take(file) {
    if (file) onPick(file)
  }

  return (
    <div
      className={`product-new__media${compact ? ' is-compact' : ''}${status === 'error' ? ' is-error' : ''}${value ? ' is-ready' : ''}${over ? ' is-over' : ''}`}
      onDragOver={(event) => {
        event.preventDefault()
        setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(event) => {
        event.preventDefault()
        setOver(false)
        take(event.dataTransfer.files?.[0])
      }}
    >
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={(event) => {
          const file = event.target.files?.[0]
          event.target.value = ''
          take(file)
        }}
      />
      {value ? (
        <>
          <img src={value} alt="" />
          <div className="product-new__media-do">
            <span>Replace</span>
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                onClear()
              }}
            >
              Remove
            </button>
          </div>
        </>
      ) : (
        <div className="product-new__media-empty">
          <span className="product-new__media-icon">
            <Icon name="upload" size={16} />
          </span>
          <strong>{status === 'reading' ? 'Reading image…' : over ? 'Drop to upload' : label}</strong>
          <small>{status === 'reading' ? 'Preparing preview' : copy || 'JPG / PNG / WEBP · MAX 5MB'}</small>
        </div>
      )}
      {error ? <em>{error}</em> : null}
    </div>
  )
}

function CategorySelect({ value, options, error, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const selected = options.find((item) => item.id === value || item.slug === value)

  useEffect(() => {
    if (!open) return undefined
    function onDoc(event) {
      if (!ref.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  return (
    <div className={`product-new__select${error ? ' is-error' : ''}${open ? ' is-open' : ''}`} ref={ref}>
      <span>Category</span>
      <button type="button" aria-expanded={open} onClick={() => setOpen((current) => !current)}>
        <Icon name="categories" size={15} />
        <strong>{selected?.name || 'Select category'}</strong>
        <Icon name="chevron" size={14} />
      </button>
      {open ? (
        <div className="product-new__menu" role="listbox">
          {options.map((item) => (
            <button
              key={item.id || item.slug}
              type="button"
              role="option"
              aria-selected={item.id === value || item.slug === value}
              onClick={() => {
                onChange(item.slug || item.id)
                setOpen(false)
              }}
            >
              {item.name}
            </button>
          ))}
        </div>
      ) : null}
      {error ? <em>{error}</em> : null}
    </div>
  )
}

export default function ProductWorkspace({ mode = 'create', productId }) {
  const editing = mode === 'edit'
  const navigate = useNavigate()
  const { toast, confirm } = useAdminUi()
  const [loading, setLoading] = useState(true)
  const [product, setProduct] = useState(null)
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [slugTouched, setSlugTouched] = useState(editing)
  const [skuTouched, setSkuTouched] = useState(editing)
  const [dirty, setDirty] = useState(false)
  const [saveState, setSaveState] = useState('idle')
  const [mainStatus, setMainStatus] = useState('idle')
  const [mainError, setMainError] = useState('')
  const [galleryStatus, setGalleryStatus] = useState('idle')
  const [galleryError, setGalleryError] = useState('')
  const [statusBusy, setStatusBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    const promises = [
      getAdminCategories().catch(() => ({ data: [] })),
      getAdminProducts({ limit: 100 }).catch(() => ({ data: [] })),
    ]
    if (editing && productId) {
      promises.push(getAdminProduct(productId).catch(() => ({ data: null })))
    }

    Promise.all(promises)
      .then(([catsRes, prodsRes, prodRes]) => {
        if (cancelled) return
        setCategories(catsRes.data || [])
        setProducts(prodsRes.data || [])
        if (editing && prodRes?.data) {
          const loadedProduct = prodRes.data
          setProduct(loadedProduct)
          const next = formFromProduct(loadedProduct)
          setForm(next)
          setSlugTouched(true)
          setSkuTouched(true)
          setDirty(false)
          setErrors({})
          setSaveState('idle')
          setMainStatus(next.image ? 'ready' : 'idle')
          setGalleryStatus(next.gallery.length ? 'ready' : 'idle')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [editing, productId])

  const houseCategories = useMemo(
    () => categories.filter((item) => item.storefront === form.storefront),
    [categories, form.storefront],
  )

  const stock = stockFromQty(form.qty)
  const discount = discountFrom(form.price, form.originalPrice)
  const categoryName = houseCategories.find((item) => item.id === form.category || item.slug === form.category)?.name || ''

  function touch(next) {
    setDirty(true)
    setForm(next)
  }

  function set(key, value) {
    touch((current) => ({ ...current, [key]: value }))
    setErrors((current) => {
      if (!current[key]) return current
      const next = { ...current }
      delete next[key]
      return next
    })
  }

  function setName(value) {
    touch((current) => ({
      ...current,
      name: value,
      slug: slugTouched ? current.slug : slugify(value),
      sku: skuTouched ? current.sku : skuFrom(value, current.storefront),
    }))
    setErrors((current) => {
      const next = { ...current }
      delete next.name
      if (!slugTouched) delete next.slug
      if (!skuTouched) delete next.sku
      return next
    })
  }

  function setHouse(id) {
    touch((current) => ({
      ...current,
      storefront: id,
      category: current.storefront === id ? current.category : '',
      sku: skuTouched ? current.sku : skuFrom(current.name, id),
    }))
    setErrors((current) => {
      const next = { ...current }
      delete next.storefront
      delete next.category
      return next
    })
  }

  function setStock(next) {
    if (next === 'out-of-stock') set('qty', '0')
    else if (next === 'low-stock') set('qty', '6')
    else set('qty', Number(form.qty) > 10 ? form.qty : '24')
  }

  async function pickMain(file) {
    setMainStatus('reading')
    setMainError('')
    try {
      const src = await readImageFile(file)
      set('image', src)
      setMainStatus('ready')
    } catch (error) {
      setMainStatus('error')
      setMainError(error.message)
    }
  }

  async function pickGallery(file, replaceIndex) {
    if (replaceIndex == null && form.gallery.length >= MAX_GALLERY) {
      setGalleryStatus('error')
      setGalleryError(`You can add up to ${MAX_GALLERY} extra images.`)
      return
    }
    setGalleryStatus('reading')
    setGalleryError('')
    try {
      const src = await readImageFile(file)
      touch((current) => ({
        ...current,
        gallery:
          replaceIndex == null
            ? [...current.gallery, src]
            : current.gallery.map((item, index) => (index === replaceIndex ? src : item)),
      }))
      setGalleryStatus('ready')
    } catch (error) {
      setGalleryStatus('error')
      setGalleryError(error.message)
    }
  }

  function validate() {
    const next = {}
    const sku = String(form.sku).trim()
    const self = (item) => (editing && product ? item.id !== product.id : true)
    if (!String(form.name).trim()) next.name = 'Enter a product name.'
    if (!String(form.slug).trim()) next.slug = 'Enter a URL slug.'
    else if (products.some((item) => self(item) && item.slug === slugify(form.slug))) next.slug = 'That slug is already in use.'
    if (!form.storefront) next.storefront = 'Choose a storefront.'
    if (!form.category) next.category = 'Choose a category.'
    if (!(Number(form.price) > 0)) next.price = 'Enter a valid price.'
    if (form.originalPrice && Number(form.originalPrice) > 0 && Number(form.originalPrice) < Number(form.price)) {
      next.originalPrice = 'Original price should be higher than the selling price.'
    }
    if (!sku) next.sku = 'Enter a SKU.'
    else if (products.some((item) => self(item) && item.sku === sku)) next.sku = 'SKU already exists.'
    if (form.qty === '' || Number(form.qty) < 0) next.qty = 'Enter a stock quantity.'
    return next
  }

  function payloadFromForm() {
    const category = houseCategories.find((item) => item.id === form.category || item.slug === form.category)
    return {
      ...(editing && product ? { id: product.id } : {}),
      name: form.name.trim(),
      slug: form.slug,
      description: form.description.trim(),
      storefront: form.storefront,
      category: category?.slug || form.category,
      type: category?.name || '',
      price: Number(form.price),
      originalPrice: form.originalPrice ? Number(form.originalPrice) : null,
      sku: form.sku.trim(),
      qty: Number(form.qty) || 0,
      image: form.image,
      gallery: form.gallery,
      weight: form.weight.trim(),
      ingredients: form.ingredients,
      details: form.details.trim(),
      active: form.active,
    }
  }

  async function submit(event) {
    event.preventDefault()
    if (saveState !== 'idle') return
    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    setSaveState('saving')
    try {
      const payload = payloadFromForm()
      let res
      if (editing) {
        res = await updateAdminProduct(product?.id || productId, payload)
        if (res?.data) {
          setProduct(res.data)
          const next = formFromProduct(res.data)
          setForm(next)
        }
      } else {
        res = await createAdminProduct(payload)
      }
      setSaveState('saved')
      setDirty(false)
      toast.success(editing ? 'Changes saved' : 'Product added')
      if (editing) {
        window.setTimeout(() => setSaveState('idle'), 900)
        return
      }
      window.setTimeout(() => navigate('/admin/products'), 700)
    } catch (err) {
      setSaveState('idle')
      toast.error(err.message || 'Could not save product')
    }
  }

  async function toggleStatus() {
    if (!product || statusBusy) return
    const next = product.active === false
    const ok = await confirm({
      title: next ? `Activate ${form.name || product.name}?` : `Deactivate ${form.name || product.name}?`,
      message: next
        ? 'This SKU will be live on the storefront again.'
        : 'This SKU will be hidden from the storefront. Inventory is kept.',
      confirmLabel: next ? 'Activate product' : 'Deactivate product',
      danger: !next,
    })
    if (!ok) return
    setStatusBusy(true)
    try {
      const res = await updateAdminProduct(product.id || productId, { active: next, isActive: next })
      if (res?.data) {
        setProduct(res.data)
      }
      setForm((current) => ({ ...current, active: next }))
      toast.success(next ? 'Product activated' : 'Product deactivated')
    } catch (err) {
      toast.error(err.message || 'Could not update product status')
    } finally {
      setStatusBusy(false)
    }
  }

  if (loading) return <LoadingState label={editing ? 'Loading product' : 'Loading catalogue'} />

  if (editing && !product) {
    return (
      <EmptyState
        title="Product not found"
        copy="This SKU is no longer in the catalogue."
        action={
          <Link to="/admin/products" className="product-new__back">
            ← Products
          </Link>
        }
      />
    )
  }

  if (editing) {
    return (
      <ProductEditView
        Field={Field}
        ImageSlot={ImageSlot}
        CategorySelect={CategorySelect}
        form={form}
        errors={errors}
        dirty={dirty}
        saveState={saveState}
        stock={stock}
        discount={discount}
        categoryName={categoryName}
        houseCategories={houseCategories}
        mainStatus={mainStatus}
        mainError={mainError}
        galleryStatus={galleryStatus}
        galleryError={galleryError}
        statusBusy={statusBusy}
        set={set}
        setName={setName}
        setHouse={setHouse}
        setStock={setStock}
        setSlugTouched={setSlugTouched}
        setSkuTouched={setSkuTouched}
        touch={touch}
        pickMain={pickMain}
        pickGallery={pickGallery}
        clearMain={() => {
          set('image', '')
          setMainStatus('idle')
          setMainError('')
        }}
        submit={submit}
        toggleStatus={toggleStatus}
      />
    )
  }

  const saveLabel =
    saveState === 'saving' ? 'Saving...' : saveState === 'saved' ? 'Saved ✓' : 'Save Product'

  return (
    <div className="product-new">
      <header className="product-new__head">
        <div>
          <p className="admin-catalog__eyebrow">Catalogue</p>
          <h1 className="admin-title">{editing ? 'Edit Product' : 'Add Product'}</h1>
          <p className="product-new__copy">
            {editing
              ? `Update this SKU for ${storefrontLabel(form.storefront) || 'Nutri-Hub or Self-Care'}.`
              : 'Create a SKU for Nutri-Hub or Self-Care.'}
          </p>
          {editing && (form.name || form.sku) ? (
            <p className="product-new__meta">
              {form.name || 'Untitled'}
              {form.sku ? ` · ${form.sku}` : ''}
            </p>
          ) : null}
        </div>
        <Link to="/admin/products" className="product-new__back">
          ← Products
        </Link>
      </header>

      <form className="product-new__workspace" onSubmit={submit} noValidate>
        <div className="product-new__main">
          <section className="product-new__block" style={{ '--i': 0 }}>
            <p>Basic information</p>
            <div className="product-new__grid">
              <Field label="Product name" error={errors.name}>
                <input value={form.name} onChange={(event) => setName(event.target.value)} placeholder="Kullakar Rice" />
              </Field>
              <Field label="Slug" error={errors.slug} hint="Used in the storefront URL.">
                <input
                  value={form.slug}
                  onChange={(event) => {
                    setSlugTouched(true)
                    set('slug', event.target.value)
                  }}
                  placeholder="kullakar-rice"
                />
              </Field>
              <Field label="Product description" wide hint="Optional. Shown on the product page.">
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(event) => set('description', event.target.value)}
                  placeholder="A short editorial note about origin, use, or character."
                />
              </Field>
            </div>
          </section>

          <section className="product-new__block" style={{ '--i': 1 }}>
            <p>Storefront</p>
            <div className="product-new__houses" role="radiogroup" aria-label="Storefront">
              {STOREFRONTS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="radio"
                  aria-checked={form.storefront === item.id}
                  className={`product-new__house${form.storefront === item.id ? ' is-on' : ''}${item.id === 'self-care' ? ' is-care' : ''}`}
                  onClick={() => setHouse(item.id)}
                >
                  <strong>{item.id === 'self-care' ? 'SELF-CARE' : 'NUTRI-HUB'}</strong>
                  <small>{HOUSE_COPY[item.id]}</small>
                  {form.storefront === item.id ? (
                    <i>
                      <Icon name="check" size={12} />
                    </i>
                  ) : null}
                </button>
              ))}
            </div>
            {errors.storefront ? <em className="product-new__error">{errors.storefront}</em> : null}
          </section>

          <section className="product-new__block" style={{ '--i': 2 }}>
            <CategorySelect
              value={form.category}
              options={houseCategories}
              error={errors.category}
              onChange={(value) => set('category', value)}
            />
          </section>

          <section className="product-new__block" style={{ '--i': 3 }}>
            <p>Pricing</p>
            <div className="product-new__pricing">
              <div className="product-new__grid is-prices">
                <Field label="Selling price (INR)" error={errors.price}>
                  <input type="number" min="1" value={form.price} onChange={(event) => set('price', event.target.value)} />
                </Field>
                <Field label="Original price" error={errors.originalPrice} hint="Optional compare-at price.">
                  <input
                    type="number"
                    min="0"
                    value={form.originalPrice}
                    onChange={(event) => set('originalPrice', event.target.value)}
                  />
                </Field>
                <Field label="Discount" hint="Calculated automatically.">
                  <input readOnly value={discount ? `${discount}%` : '0'} />
                </Field>
              </div>
              {discount ? (
                <aside className="product-new__offer" aria-label="Discount preview">
                  <strong>{formatPrice(form.price)}</strong>
                  <s>{formatPrice(form.originalPrice)}</s>
                  <span>{discount}% OFF</span>
                </aside>
              ) : null}
            </div>
          </section>

          <section className="product-new__block" style={{ '--i': 4 }}>
            <p>Inventory</p>
            <div className="product-new__grid">
              <Field label="SKU" error={errors.sku}>
                <input
                  value={form.sku}
                  onChange={(event) => {
                    setSkuTouched(true)
                    set('sku', event.target.value)
                  }}
                  placeholder="SVH-NH-KULLAK"
                />
              </Field>
              <Field label="Stock quantity" error={errors.qty}>
                <input type="number" min="0" value={form.qty} onChange={(event) => set('qty', event.target.value)} />
              </Field>
            </div>
            <div className="product-new__inv">
              <strong>{Number(form.qty) || 0} units</strong>
              <div className="product-new__inv-status" role="radiogroup" aria-label="Stock status">
                {['in-stock', 'low-stock', 'out-of-stock'].map((value) => (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={stock === value}
                    className={`is-${value}${stock === value ? ' is-on' : ''}`}
                    onClick={() => setStock(value)}
                  >
                    <i />
                    {stockCopy(value)}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="product-new__block" style={{ '--i': 5 }}>
            <p>Product media</p>
            <div className="product-new__media-grid">
              <div>
                <span className="product-new__label">Main product image</span>
                <ImageSlot
                  label="Drop or click to upload"
                  copy="JPG / PNG / WEBP · MAX 5MB"
                  value={form.image}
                  status={mainStatus}
                  error={mainError}
                  onPick={pickMain}
                  onClear={() => {
                    set('image', '')
                    setMainStatus('idle')
                    setMainError('')
                  }}
                />
              </div>
              <div>
                <span className="product-new__label">Additional images</span>
                <div className="product-new__gallery">
                  {form.gallery.map((src, index) => (
                    <ImageSlot
                      key={`${index}-${String(src).slice(-24)}`}
                      compact
                      label="Image"
                      value={src}
                      status="ready"
                      onPick={(file) => pickGallery(file, index)}
                      onClear={() =>
                        touch((current) => ({
                          ...current,
                          gallery: current.gallery.filter((_, itemIndex) => itemIndex !== index),
                        }))
                      }
                    />
                  ))}
                  {form.gallery.length < MAX_GALLERY ? (
                    <ImageSlot
                      compact
                      label="Add image"
                      copy="JPG / PNG / WEBP"
                      value=""
                      status={galleryStatus}
                      error={galleryError}
                      onPick={pickGallery}
                      onClear={() => {}}
                    />
                  ) : null}
                </div>
              </div>
            </div>
          </section>

          <section className="product-new__block" style={{ '--i': 6 }}>
            <p>Product information</p>
            <div className="product-new__grid">
              <Field label="Weight" hint="Shown on the storefront card.">
                <input
                  className="is-compact"
                  value={form.weight}
                  onChange={(event) => set('weight', event.target.value)}
                  placeholder="500 g"
                />
              </Field>
              <Field label="Ingredients" wide hint="Separate with commas or new lines.">
                <textarea
                  rows={3}
                  value={form.ingredients}
                  onChange={(event) => set('ingredients', event.target.value)}
                  placeholder="Kullakar rice"
                />
              </Field>
              <Field label="Product details" wide hint="Origin, how it is used, packing notes.">
                <textarea
                  rows={4}
                  value={form.details}
                  onChange={(event) => set('details', event.target.value)}
                  placeholder="Origin, how it is used, packing notes."
                />
              </Field>
            </div>
          </section>
        </div>

        <aside className="product-new__side">
          <div className="product-new__preview">
            <p>Product preview</p>
            <article>
              {form.image ? (
                <img src={form.image} alt="" />
              ) : (
                <div className="product-new__ph" aria-hidden="true">
                  <span>SV</span>
                </div>
              )}
              <div className="product-new__preview-body">
                <span>{categoryName || 'Category'}</span>
                <h2>{form.name.trim() || 'Your product'}</h2>
                <div className="product-new__preview-meta">
                  <strong>{form.price ? formatPrice(form.price) : '₹—'}</strong>
                  {form.weight ? <em>{form.weight}</em> : null}
                </div>
                <small className={`is-${stock}`}>
                  <i />
                  {stockCopy(stock)}
                </small>
                <b>{storefrontLabel(form.storefront)}</b>
              </div>
            </article>
          </div>

          <div className="product-new__publish">
            <p>Status</p>
            <div className="product-new__status" role="radiogroup" aria-label="Status">
              <button type="button" role="radio" aria-checked={form.active} className={form.active ? 'is-on' : ''} onClick={() => set('active', true)}>
                <i />
                Active
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={!form.active}
                className={!form.active ? 'is-on is-off' : ''}
                onClick={() => set('active', false)}
              >
                <i />
                Inactive
              </button>
            </div>
            <dl>
              <div>
                <dt>Storefront</dt>
                <dd>{storefrontLabel(form.storefront)}</dd>
              </div>
              <div>
                <dt>Category</dt>
                <dd>{categoryName || '—'}</dd>
              </div>
              <div>
                <dt>Stock</dt>
                <dd>{Number(form.qty) || 0} units</dd>
              </div>
              <div>
                <dt>Price</dt>
                <dd>{form.price ? formatPrice(form.price) : '—'}</dd>
              </div>
            </dl>
          </div>
        </aside>

        <footer className="product-new__bar">
          <span className={dirty && saveState === 'idle' ? 'is-dirty' : ''}>
            {saveState === 'saved' ? 'All changes saved' : dirty ? 'Unsaved changes' : editing ? 'Editing existing SKU' : 'No changes yet'}
          </span>
          <div>
            {editing ? (
              <button type="button" className="product-new__danger" onClick={toggleStatus} disabled={statusBusy}>
                {form.active ? 'Deactivate Product' : 'Activate Product'}
              </button>
            ) : null}
            <Link to="/admin/products" className="product-new__cancel">
              Cancel
            </Link>
            <button type="submit" className={`product-new__save is-${saveState}`} disabled={saveState !== 'idle'}>
              {saveLabel}
              {saveState === 'idle' ? (
                <span>
                  <Icon name="arrow" size={14} />
                </span>
              ) : null}
            </button>
          </div>
        </footer>
      </form>
    </div>
  )
}

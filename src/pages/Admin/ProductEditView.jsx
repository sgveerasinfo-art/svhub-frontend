import { Link } from 'react-router-dom'
import { STOREFRONTS, storefrontLabel } from '../../data/admin.js'
import { formatPrice } from '../../utils/money.js'
import { Icon } from '../../components/admin/icons.jsx'
import './ProductEdit.css'

const HOUSE_COPY = {
  'nutri-hub': 'Native grains, foods & traditional pantry products',
  'self-care': 'Traditional soaps & natural self-care',
}

const STOCK_OPTIONS = ['in-stock', 'low-stock', 'out-of-stock']

function stockCopy(stock) {
  if (stock === 'out-of-stock') return 'Out of stock'
  if (stock === 'low-stock') return 'Low stock'
  return 'In stock'
}

function Section({ index, title, copy, children }) {
  return (
    <section className="product-edit__section" style={{ '--i': index }}>
      <header className="product-edit__section-head">
        <span>{String(index).padStart(2, '0')}</span>
        <div>
          <h2>{title}</h2>
          {copy ? <p>{copy}</p> : null}
        </div>
      </header>
      {children}
    </section>
  )
}

export default function ProductEditView({
  Field,
  ImageSlot,
  CategorySelect,
  form,
  errors,
  dirty,
  saveState,
  stock,
  discount,
  categoryName,
  houseCategories,
  mainStatus,
  mainError,
  galleryStatus,
  galleryError,
  statusBusy,
  set,
  setName,
  setHouse,
  setStock,
  setSlugTouched,
  setSkuTouched,
  touch,
  pickMain,
  pickGallery,
  clearMain,
  submit,
  toggleStatus,
}) {
  const saveLabel = saveState === 'saving' ? 'Saving...' : saveState === 'saved' ? 'Saved ✓' : 'Save Product'
  const house = storefrontLabel(form.storefront)

  return (
    <div className="product-edit">
      <header className="product-edit__head">
        <div>
          <p className="product-edit__eyebrow">Catalogue</p>
          <h1>Edit Product</h1>
          <p className="product-edit__lede">Update this SKU for {house}.</p>
          {form.sku ? <p className="product-edit__sku">SKU: {form.sku}</p> : null}
        </div>
        <Link to="/admin/products" className="product-edit__back">
          ← Products
        </Link>
      </header>

      <form className="product-edit__workspace" onSubmit={submit} noValidate>
        <div className="product-edit__main">
          <Section index={1} title="Basic information" copy="Product identity and storefront-facing copy.">
            <div className="product-edit__grid">
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
                  rows={4}
                  value={form.description}
                  onChange={(event) => set('description', event.target.value)}
                  placeholder="A short editorial note about origin, use, or character."
                />
              </Field>
            </div>
          </Section>

          <Section index={2} title="Storefront" copy="Choose the house this SKU belongs to, then place it in a category.">
            <div className="product-edit__houses" role="radiogroup" aria-label="Storefront">
              {STOREFRONTS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="radio"
                  aria-checked={form.storefront === item.id}
                  className={`product-edit__house${form.storefront === item.id ? ' is-on' : ''}${item.id === 'self-care' ? ' is-care' : ''}`}
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
            {errors.storefront ? <em className="product-edit__error">{errors.storefront}</em> : null}
            <div className="product-edit__category">
              <CategorySelect
                value={form.category}
                options={houseCategories}
                error={errors.category}
                onChange={(value) => set('category', value)}
              />
            </div>
          </Section>

          <Section index={3} title="Pricing" copy="Selling price drives the storefront. Discount is calculated automatically.">
            <div className="product-edit__pricing">
              <div className="product-edit__grid is-3">
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
              <aside className="product-edit__insight" aria-label="Current selling price">
                <span>Current selling price</span>
                <strong>{form.price ? formatPrice(form.price) : '₹—'}</strong>
                {discount ? <b>{discount}% OFF</b> : <small>No compare-at discount</small>}
              </aside>
            </div>
          </Section>

          <Section index={4} title="Inventory" copy="SKU and quantity control availability on the storefront.">
            <div className="product-edit__grid">
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
            <div className="product-edit__inv">
              <p>
                <strong>{Number(form.qty) || 0} units</strong>
                <span className={`is-${stock}`}>
                  <i />
                  {stockCopy(stock)}
                </span>
              </p>
              <div className="product-edit__inv-options" role="radiogroup" aria-label="Stock status">
                {STOCK_OPTIONS.map((value) => (
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
          </Section>

          <Section index={5} title="Product media" copy="Main image first. Extra frames sit beside it.">
            <div className="product-edit__media">
              <div className="product-edit__media-main">
                <span>Main image</span>
                <ImageSlot
                  label="Drop or click to upload"
                  copy="JPG / PNG / WEBP · MAX 5MB"
                  value={form.image}
                  status={mainStatus}
                  error={mainError}
                  onPick={pickMain}
                  onClear={clearMain}
                />
              </div>
              <div className="product-edit__media-extra">
                <span>Additional images</span>
                <div className="product-edit__gallery">
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
                  {form.gallery.length < 4 ? (
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
          </Section>

          <Section index={6} title="Product information" copy="Weight, ingredients and packing notes shown on the product page.">
            <div className="product-edit__grid">
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
                  className="is-editorial"
                  rows={5}
                  value={form.ingredients}
                  onChange={(event) => set('ingredients', event.target.value)}
                  placeholder="Kullakar rice"
                />
              </Field>
              <Field label="Product details" wide hint="Origin, how it is used, packing notes.">
                <textarea
                  className="is-editorial"
                  rows={5}
                  value={form.details}
                  onChange={(event) => set('details', event.target.value)}
                  placeholder="Origin, how it is used, packing notes."
                />
              </Field>
            </div>
          </Section>

          <Section index={7} title="Status" copy="Product visibility.">
            <div className="product-edit__status" role="radiogroup" aria-label="Status">
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
                Inactive
              </button>
            </div>
            <p className="product-edit__status-copy">Visible on the storefront when active.</p>
          </Section>
        </div>

        <aside className="product-edit__side">
          <div className="product-edit__preview">
            <header>
              <p>Live preview</p>
              <small>Storefront appearance</small>
            </header>
            <article className={`product-edit__card${form.storefront === 'self-care' ? ' is-care' : ''}`}>
              <div className="product-edit__card-media">
                {form.image ? <img src={form.image} alt="" /> : <span>SV</span>}
                {discount ? <b>{discount}% off</b> : null}
              </div>
              <div className="product-edit__card-body">
                <em>{categoryName || 'Category'}</em>
                <h3>{form.name.trim() || 'Your product'}</h3>
                <div className="product-edit__card-price">
                  {discount ? <s>{formatPrice(form.originalPrice)}</s> : null}
                  <strong>{form.price ? formatPrice(form.price) : '₹—'}</strong>
                  {form.weight ? <span>{form.weight}</span> : null}
                </div>
                <small className={`is-${stock}`}>
                  <i />
                  {stockCopy(stock)}
                </small>
                <u>{house}</u>
              </div>
            </article>
          </div>
        </aside>

        <footer className="product-edit__bar">
          <span className={dirty && saveState === 'idle' ? 'is-dirty' : ''}>
            {saveState === 'saved' ? 'All changes saved' : dirty ? 'Unsaved changes' : 'Editing existing SKU'}
          </span>
          <div>
            <button type="button" className="product-edit__danger" onClick={toggleStatus} disabled={statusBusy}>
              {form.active ? 'Deactivate Product' : 'Activate Product'}
            </button>
            <Link to="/admin/products" className="product-edit__cancel">
              Cancel
            </Link>
            <button type="submit" className={`product-edit__save is-${saveState}`} disabled={saveState !== 'idle'}>
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

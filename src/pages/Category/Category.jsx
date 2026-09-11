import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { getCategoriesByStorefront, getCategoryBySlug } from '../../data/categories.js'
import {
  PAGE_SIZE,
  countListingFilters,
  listingParamsToSearch,
  parseListingParams,
  sortOptions,
} from '../../data/shop.js'
import { getProducts } from '../../api/products.js'
import { getStorefront } from '../../data/storefronts.js'
import ShopFilters from '../Shop/ShopFilters.jsx'
import ShopProduct from '../Shop/ShopProduct.jsx'
import ShopSheet from '../Shop/ShopSheet.jsx'
import { products as staticCatalog } from '../../data/products.js'
import '../Shop/Shop.css'
import './Category.css'

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

function FilterIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M2.5 3.5h11M4.5 8h7M6.5 12.5h3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

function SortIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M4 5.5 6.5 3 9 5.5M6.5 3v10M12 10.5 9.5 13 7 10.5M9.5 13V3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function pagerPages(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const pages = [1]
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)

  if (start > 2) pages.push('ellipsis-start')
  for (let n = start; n <= end; n += 1) pages.push(n)
  if (end < total - 1) pages.push('ellipsis-end')
  pages.push(total)
  return pages
}

function ProductSkeleton() {
  return (
    <div className="shop-skel" aria-hidden="true">
      <span className="shop-skel__media" />
      <span className="shop-skel__line shop-skel__line--type" />
      <span className="shop-skel__line shop-skel__line--name" />
      <span className="shop-skel__line shop-skel__line--price" />
    </div>
  )
}

function Category() {
  const { slug } = useParams()
  const category = getCategoryBySlug(slug)
  const house = category ? getStorefront(category.storefront) : null
  const siblings = category ? getCategoriesByStorefront(category.storefront) : []

  const [searchParams, setSearchParams] = useSearchParams()
  const filters = useMemo(() => parseListingParams(searchParams), [searchParams])
  const [queryDraft, setQueryDraft] = useState(filters.q)
  const [sheet, setSheet] = useState(null)
  const [booting, setBooting] = useState(true)
  const mainRef = useRef(null)
  const pageReady = useRef(false)
  const prevSlug = useRef(slug)

  const queryFilters = useMemo(
    () => ({
      ...filters,
      storefront: category?.storefront ?? 'all',
      categoryIds: category ? [category.slug] : ['__none__'],
    }),
    [filters, category],
  )

  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState([])
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, page: 1 })
  const fetchRef = useRef(0)

  useEffect(() => {
    if (!category) {
      setProducts([])
      setPagination({ total: 0, totalPages: 1, page: 1 })
      setLoading(false)
      return
    }

    const id = ++fetchRef.current
    setLoading(true)

    getProducts({
      ...queryFilters,
      page: filters.page || 1,
      limit: PAGE_SIZE,
    })
      .then((res) => {
        if (id !== fetchRef.current) return
        if (res?.data?.length) {
          setProducts(res.data)
          setPagination(res.pagination || { total: res.data.length, totalPages: 1, page: filters.page || 1 })
        } else {
          // Fallback if backend returned empty for this category
          const matchingStatic = staticCatalog.filter((p) => p.category === category.slug)
          if (matchingStatic.length) {
            setProducts(matchingStatic)
            setPagination({ total: matchingStatic.length, totalPages: 1, page: 1 })
          } else {
            setProducts([])
            setPagination({ total: 0, totalPages: 1, page: 1 })
          }
        }
      })
      .catch(() => {
        if (id !== fetchRef.current) return
        const matchingStatic = staticCatalog.filter((p) => p.category === category?.slug)
        if (matchingStatic.length) {
          setProducts(matchingStatic)
          setPagination({ total: matchingStatic.length, totalPages: 1, page: 1 })
        } else {
          setProducts([])
          setPagination({ total: 0, totalPages: 1, page: 1 })
        }
      })
      .finally(() => {
        if (id === fetchRef.current) setLoading(false)
      })
  }, [category, queryFilters, filters.page])

  const totalPages = pagination.totalPages
  const page = pagination.page
  const shown = products
  const rangeStart = pagination.total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const rangeEnd = Math.min(pagination.total, (page - 1) * PAGE_SIZE + products.length)
  const activeCount = countListingFilters(filters)
  const sortLabel = sortOptions.find((option) => option.id === filters.sort)?.label ?? 'Featured'
  const countLabel = `${pagination.total} ${pagination.total === 1 ? 'product' : 'products'}`
  const catalogMeta = house ? `${countLabel} · ${house.kicker}` : countLabel
  const pages = pagerPages(page, totalPages)
  const searchPlaceholder = category
    ? `Search ${category.name.toLowerCase()}…`
    : 'Search rice, pickles, soaps…'
  const allUnavailable = products.length > 0 && products.every((product) => product.stock === 'out-of-stock')
  const showingUnavailable = filters.availability === 'out-of-stock'

  const applyFilters = useCallback(
    (next) => {
      setSearchParams(listingParamsToSearch(next), { replace: true })
    },
    [setSearchParams],
  )

  function handleFilterChange(next) {
    applyFilters({ ...next, q: queryDraft, page: 1 })
  }

  function setPage(nextPage) {
    applyFilters({ ...filters, q: queryDraft, page: nextPage })
  }

  useEffect(() => {
    window.scrollTo(0, 0)
    setSheet(null)

    if (prevSlug.current !== slug) {
      setQueryDraft('')
      setSearchParams(new URLSearchParams(), { replace: true })
      prevSlug.current = slug
      pageReady.current = false
    }
  }, [slug, setSearchParams])

  useEffect(() => {
    setQueryDraft(filters.q)
  }, [filters.q])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (queryDraft.trim() === filters.q) return
      applyFilters({ ...filters, q: queryDraft, page: 1 })
    }, 220)

    return () => window.clearTimeout(timer)
  }, [queryDraft, filters, applyFilters])

  useEffect(() => {
    if (!pageReady.current) {
      pageReady.current = true
      return
    }
    mainRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [page])

  useEffect(() => {
    if (booting || products.length === 0) return
    if (filters.page > totalPages) {
      applyFilters({ ...filters, q: queryDraft, page: totalPages })
    }
  }, [booting, filters, queryDraft, products.length, totalPages, applyFilters])

  function clearFilters() {
    setQueryDraft('')
    applyFilters({
      q: '',
      storefront: 'all',
      categoryIds: [],
      price: 'all',
      availability: 'all',
      sort: filters.sort,
      page: 1,
    })
  }

  const crumbs = (
    <nav className="category__crumbs" aria-label="Breadcrumb">
      <Link to="/">Home</Link>
      <span aria-hidden="true">/</span>
      <Link to="/shop">Shop</Link>
      {house ? (
        <>
          <span aria-hidden="true">/</span>
          <Link to={house.to}>{house.name}</Link>
        </>
      ) : null}
      <span aria-hidden="true">/</span>
      <span aria-current="page">{category?.name ?? 'Category'}</span>
    </nav>
  )

  if (!category) {
    return (
      <section className="shop shop--market category" aria-labelledby="category-heading">
        <span className="shop__grain" aria-hidden="true" />
        <header className="shop__intro">
          <div className="shop__container">
            {crumbs}
            <p className="shop__eyebrow">Shop</p>
            <h1 id="category-heading" className="shop__title">
              This category is on its way.
            </h1>
            <p className="shop__copy">Return to the shop to keep exploring SV Hub.</p>
            <Link to="/shop" className="category__back">
              Back to shop
              <Arrow />
            </Link>
          </div>
        </header>
      </section>
    )
  }

  return (
    <section className="shop shop--market category" aria-labelledby="category-heading">
      <span className="shop__grain" aria-hidden="true" />

      <header className="shop__intro">
        <div className="shop__container">
          {crumbs}
        </div>

        <div className="shop__container shop__intro-grid">
          <div className="shop__intro-copy">
            <p className="shop__eyebrow">{house?.name ?? 'Shop'}</p>
            <h1 id="category-heading" className="shop__title">
              {category.name}
            </h1>
          </div>

          <div className="shop__intro-aside">
            <p className="shop__copy">{category.description}</p>
            <p className="shop__meta">{catalogMeta}</p>
          </div>
        </div>

        <div className="shop__container">
          <nav className="shop__houses category__rail" aria-label="Categories in this house">
            <Link to="/shop" className="shop__house">
              All
            </Link>
            {siblings.map((item) => (
              <Link
                key={item.id}
                to={item.to}
                className={`shop__house${item.slug === category.slug ? ' is-active' : ''}`}
                aria-current={item.slug === category.slug ? 'page' : undefined}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>

        <div className="shop__container">
          <label className="shop__mobile-search" htmlFor="category-mobile-search">
            <span>Search products</span>
            <input
              id="category-mobile-search"
              type="search"
              placeholder={searchPlaceholder}
              value={queryDraft}
              onChange={(event) => setQueryDraft(event.target.value)}
              autoComplete="off"
            />
          </label>
        </div>
      </header>

      <div className="shop__dock" aria-label="Category controls">
        <button
          type="button"
          className="shop__dock-btn"
          aria-haspopup="dialog"
          aria-expanded={sheet === 'filters'}
          onClick={() => setSheet('filters')}
        >
          <FilterIcon />
          Filter{activeCount ? ` · ${activeCount}` : ''}
        </button>
        <button
          type="button"
          className="shop__dock-btn"
          aria-haspopup="dialog"
          aria-expanded={sheet === 'sort'}
          onClick={() => setSheet('sort')}
        >
          <SortIcon />
          Sort
        </button>
        <p className="shop__dock-count" aria-live="polite">
          {pagination.total ? `${rangeStart}–${rangeEnd} of ${pagination.total}` : countLabel}
        </p>
      </div>

      <div className="shop__container shop__layout">
        <aside className="shop__sidebar" aria-label="Product filters">
          <div className="shop__sidebar-head">
            <p className="shop__sidebar-title">Filters</p>
            {activeCount ? (
              <button type="button" className="shop__text-btn" onClick={clearFilters}>
                Clear all
              </button>
            ) : null}
          </div>
          <ShopFilters
            filters={filters}
            searchValue={queryDraft}
            onSearch={setQueryDraft}
            onChange={handleFilterChange}
            idPrefix="category"
            showStorefront={false}
            lockedCategory
            searchPlaceholder={searchPlaceholder}
          />
        </aside>

        <div className="shop__main" ref={mainRef}>
          <div className="shop__toolbar">
            <p className="shop__count" aria-live="polite">
              {pagination.total
                ? `Showing ${rangeStart}–${rangeEnd} of ${pagination.total}`
                : countLabel}
            </p>

            <label className="shop__sort" htmlFor="category-sort">
              <span>Sort by</span>
              <select
                id="category-sort"
                value={filters.sort}
                onChange={(event) => handleFilterChange({ ...filters, sort: event.target.value })}
              >
                {sortOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {loading ? (
            <ul className="shop__grid" aria-busy="true" aria-label="Loading products">
              {Array.from({ length: 9 }, (_, index) => (
                <li key={index}>
                  <ProductSkeleton />
                </li>
              ))}
            </ul>
          ) : products.length === 0 ? (
            <div className="shop__empty">
              <p className="shop__empty-eyebrow">
                {showingUnavailable ? 'Out of stock' : 'No matches'}
              </p>
              <h2>
                {showingUnavailable
                  ? 'Nothing in this category is out of stock.'
                  : `No ${category.name.toLowerCase()} matched those filters.`}
              </h2>
              <p>
                {showingUnavailable
                  ? 'Every listed item is available to add to cart, or try another filter.'
                  : 'Try another search, or clear the filters to see everything in this category.'}
              </p>
              <button type="button" className="shop__empty-btn" onClick={clearFilters}>
                Clear filters
                <Arrow />
              </button>
            </div>
          ) : (
            <>
              {allUnavailable || showingUnavailable ? (
                <p className="category__oos" role="status">
                  {allUnavailable
                    ? 'These items are currently out of stock.'
                    : 'Showing out-of-stock items in this category.'}
                </p>
              ) : null}

              <ul className="shop__grid" key={`${slug}-${searchParams.toString()}`} aria-label={`${category.name} products`}>
                {shown.map((product, index) => (
                  <li key={product.id}>
                    <ShopProduct product={product} index={index} />
                  </li>
                ))}
              </ul>

              <div className="shop__footer">
                <p className="shop__shown">
                  Showing {rangeStart}–{rangeEnd} of {pagination.total}
                </p>
                {totalPages > 1 ? (
                  <nav className="shop__pager" aria-label="Product pages">
                    <button
                      type="button"
                      className="shop__page shop__page--dir"
                      disabled={page <= 1}
                      onClick={() => setPage(page - 1)}
                    >
                      Previous
                    </button>
                    {pages.map((item) =>
                      typeof item === 'string' ? (
                        <span key={item} className="shop__page-gap" aria-hidden="true">
                          …
                        </span>
                      ) : (
                        <button
                          key={item}
                          type="button"
                          className={`shop__page${item === page ? ' is-current' : ''}`}
                          aria-current={item === page ? 'page' : undefined}
                          onClick={() => setPage(item)}
                        >
                          {item}
                        </button>
                      ),
                    )}
                    <button
                      type="button"
                      className="shop__page shop__page--dir"
                      disabled={page >= totalPages}
                      onClick={() => setPage(page + 1)}
                    >
                      Next
                    </button>
                  </nav>
                ) : null}
              </div>
            </>
          )}
        </div>
      </div>

      <ShopSheet
        open={sheet === 'filters'}
        title="Filters"
        labelledBy="category-filter-sheet"
        onClose={() => setSheet(null)}
      >
        <div className="shop__sheet-tools">
          <p className="shop__sheet-meta">{countLabel}</p>
          {activeCount ? (
            <button type="button" className="shop__text-btn" onClick={clearFilters}>
              Clear all
            </button>
          ) : null}
        </div>
        <ShopFilters
          filters={filters}
          searchValue={queryDraft}
          onSearch={setQueryDraft}
          onChange={handleFilterChange}
          idPrefix="category-sheet"
          showStorefront={false}
          lockedCategory
          searchPlaceholder={searchPlaceholder}
        />
      </ShopSheet>

      <ShopSheet
        open={sheet === 'sort'}
        title="Sort"
        labelledBy="category-sort-sheet"
        onClose={() => setSheet(null)}
      >
        <p className="shop__sheet-current">Current · {sortLabel}</p>
        <div className="shop-filters__choices">
          {sortOptions.map((option) => (
            <label
              key={option.id}
              className={`shop-filters__choice shop-filters__choice--row${filters.sort === option.id ? ' is-selected' : ''}`}
            >
              <input
                type="radio"
                name="category-sheet-sort"
                checked={filters.sort === option.id}
                onChange={() => {
                  applyFilters({ ...filters, q: queryDraft, sort: option.id, page: 1 })
                  setSheet(null)
                }}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </ShopSheet>
    </section>
  )
}

export default Category

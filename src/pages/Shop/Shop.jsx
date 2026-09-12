import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { storefronts } from '../../data/storefronts.js'
import {
  PAGE_SIZE,
  countActiveFilters,
  parseShopParams,
  shopIntro,
  shopParamsToSearch,
  sortOptions,
} from '../../data/shop.js'
import { getProducts } from '../../api/products.js'
import ShopFilters from './ShopFilters.jsx'
import ShopProduct from './ShopProduct.jsx'
import ShopSheet from './ShopSheet.jsx'
import './Shop.css'

const HOUSES = [{ id: 'all', label: 'All' }, ...storefronts.map((house) => ({ id: house.slug, label: house.name }))]

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

function splitTitle(title) {
  const comma = title.indexOf(',')
  if (comma === -1) return title

  return (
    <>
      {title.slice(0, comma + 1)}
      <br />
      {title.slice(comma + 1).trim()}
    </>
  )
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

function Shop() {
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = useMemo(() => parseShopParams(searchParams), [searchParams])
  const [queryDraft, setQueryDraft] = useState(filters.q)
  const [sheet, setSheet] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [retryNonce, setRetryNonce] = useState(0)
  const [products, setProducts] = useState([])
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, page: 1 })
  const mainRef = useRef(null)
  const pageReady = useRef(false)
  const fetchRef = useRef(0)

  // Fetch products from backend (auto-retry once for transient Atlas/DNS blips)
  useEffect(() => {
    const id = ++fetchRef.current
    const controller = new AbortController()
    let timedOut = false
    const timeoutId = window.setTimeout(() => {
      timedOut = true
      controller.abort()
    }, 20000)
    setLoading(true)
    setLoadError('')

    async function load(attempt = 1) {
      try {
        const res = await getProducts({ ...filters, limit: PAGE_SIZE, signal: controller.signal })
        if (id !== fetchRef.current) return
        setProducts(res.data || [])
        setPagination(res.pagination || { total: 0, totalPages: 1, page: filters.page || 1 })
        setLoadError('')
      } catch (error) {
        if (id !== fetchRef.current) return
        if (error?.name === 'AbortError' && !timedOut) return

        // One automatic retry for network / 5xx / timeout
        if (attempt < 2 && !timedOut) {
          await new Promise((r) => window.setTimeout(r, 800))
          if (id !== fetchRef.current) return
          return load(attempt + 1)
        }

        setProducts([])
        setPagination({ total: 0, totalPages: 1, page: filters.page || 1 })
        setLoadError(
          timedOut
            ? 'The shop is taking too long to respond. Please try again.'
            : 'We could not load products right now. Please try again.',
        )
      }
    }

    load().finally(() => {
      window.clearTimeout(timeoutId)
      if (id === fetchRef.current) setLoading(false)
    })

    return () => {
      window.clearTimeout(timeoutId)
      controller.abort()
    }
  }, [filters, retryNonce])

  const total = pagination.total
  const totalPages = pagination.totalPages || 1
  const page = filters.page || 1
  const shown = products
  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const rangeEnd = rangeStart + shown.length - 1
  const activeCount = countActiveFilters(filters)
  const sortLabel = sortOptions.find((option) => option.id === filters.sort)?.label ?? 'Featured'
  const countLabel = `${total} ${total === 1 ? 'product' : 'products'}`
  const catalogMeta = `${total} products · ${storefronts.length} houses`
  const pages = pagerPages(page, totalPages)

  const applyFilters = useCallback(
    (next) => {
      setSearchParams(shopParamsToSearch(next), { replace: true })
    },
    [setSearchParams],
  )

  function handleFilterChange(next) {
    applyFilters({ ...next, q: queryDraft, page: 1 })
  }

  function setPage(nextPage) {
    applyFilters({ ...filters, q: queryDraft, page: nextPage })
  }

  function setHouse(storefront) {
    handleFilterChange({
      ...filters,
      storefront,
      categoryIds:
        storefront === 'all'
          ? []
          : filters.categoryIds.filter((id) => {
              const house = storefronts.find((item) => item.slug === storefront)
              return house?.categorySlugs.includes(id)
            }),
    })
  }

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

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

  function clearFilters() {
    setQueryDraft('')
    applyFilters({
      q: '',
      storefront: 'all',
      categoryIds: [],
      price: 'all',
      availability: 'all',
      sort: filters.sort,
    })
  }

  return (
    <section className="shop shop--market" aria-labelledby="shop-heading">
      <span className="shop__grain" aria-hidden="true" />

      <header className="shop__intro">
        <div className="shop__container shop__intro-grid">
          <div className="shop__intro-copy">
            <p className="shop__eyebrow">{shopIntro.eyebrow}</p>
            <h1 id="shop-heading" className="shop__title">
              {splitTitle(shopIntro.title)}
            </h1>
          </div>

          <div className="shop__intro-aside">
            <p className="shop__copy">{shopIntro.copy}</p>
            <p className="shop__meta">{catalogMeta}</p>
          </div>
        </div>

        <div className="shop__container">
          <nav className="shop__houses" aria-label="Shop by house">
            {HOUSES.map((house) => (
              <button
                key={house.id}
                type="button"
                className={`shop__house${filters.storefront === house.id ? ' is-active' : ''}`}
                aria-pressed={filters.storefront === house.id}
                onClick={() => setHouse(house.id)}
              >
                {house.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="shop__container">
          <label className="shop__mobile-search" htmlFor="shop-mobile-search">
            <span>Search products</span>
            <input
              id="shop-mobile-search"
              type="search"
              placeholder="Search rice, pickles, soaps…"
              value={queryDraft}
              onChange={(event) => setQueryDraft(event.target.value)}
              autoComplete="off"
            />
          </label>
        </div>
      </header>

      <div className="shop__dock" aria-label="Shop controls">
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
          {total ? `${rangeStart}–${rangeEnd} of ${total}` : countLabel}
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
            showStorefront={false}
          />
        </aside>

        <div className="shop__main" ref={mainRef}>
          <div className="shop__toolbar">
            <p className="shop__count" aria-live="polite">
              {total
                ? `Showing ${rangeStart}–${rangeEnd} of ${total}`
                : countLabel}
            </p>

            <label className="shop__sort" htmlFor="shop-sort">
              <span>Sort by</span>
              <select
                id="shop-sort"
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
          ) : loadError ? (
            <div className="shop__empty" role="alert">
              <p className="shop__empty-eyebrow">Temporary issue</p>
              <h2>Products could not be loaded.</h2>
              <p>{loadError}</p>
              <button
                type="button"
                className="shop__empty-btn"
                onClick={() => setRetryNonce((n) => n + 1)}
              >
                Try again
                <Arrow />
              </button>
            </div>
          ) : products.length === 0 ? (
            <div className="shop__empty">
              <p className="shop__empty-eyebrow">No matches</p>
              <h2>We couldn&apos;t find what you&apos;re looking for.</h2>
              <p>Try another search, or clear the filters to see everything in the shop.</p>
              <button type="button" className="shop__empty-btn" onClick={clearFilters}>
                Clear filters
                <Arrow />
              </button>
            </div>
          ) : (
            <>
              <ul className="shop__grid" key={searchParams.toString()} aria-label="Products">
                {shown.map((product, index) => (
                  <li key={product.id}>
                    <ShopProduct product={product} index={index} />
                  </li>
                ))}
              </ul>

              <div className="shop__footer">
                <p className="shop__shown">
                  Showing {rangeStart}–{rangeEnd} of {total}
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
        labelledBy="shop-filter-sheet"
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
          idPrefix="shop-sheet"
          showStorefront={false}
        />
      </ShopSheet>

      <ShopSheet
        open={sheet === 'sort'}
        title="Sort"
        labelledBy="shop-sort-sheet"
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
                name="shop-sheet-sort"
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

export default Shop

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Reveal from '../../components/ui/Reveal.jsx'
import { getCategoryBySlug } from '../../data/categories.js'
import {
  PAGE_SIZE,
  availabilityFilters,
  countSearchFilters,
  parseSearchParams,
  priceFilters,
  searchParamsToSearch,
  searchSortOptions,
} from '../../data/shop.js'
import { getProducts } from '../../api/products.js'
import { storefronts } from '../../data/storefronts.js'
import ShopFilters from '../Shop/ShopFilters.jsx'
import ShopProduct from '../Shop/ShopProduct.jsx'
import ShopSheet from '../Shop/ShopSheet.jsx'
import '../Shop/Shop.css'
import './Search.css'

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

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M16.2 16.2 20 20" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
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

function activeChips(filters) {
  const chips = []

  if (filters.storefront !== 'all') {
    const house = storefronts.find((item) => item.slug === filters.storefront)
    if (house) chips.push({ key: 'house', label: house.name })
  }

  filters.categoryIds.forEach((slug) => {
    const category = getCategoryBySlug(slug)
    if (category) chips.push({ key: `cat-${slug}`, label: category.name, slug })
  })

  if (filters.price !== 'all') {
    const price = priceFilters.find((item) => item.id === filters.price)
    if (price) chips.push({ key: 'price', label: price.label })
  }

  if (filters.availability !== 'all') {
    const stock = availabilityFilters.find((item) => item.id === filters.availability)
    if (stock) chips.push({ key: 'stock', label: stock.label })
  }

  return chips
}

function Search() {
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = useMemo(() => parseSearchParams(searchParams), [searchParams])
  const [queryDraft, setQueryDraft] = useState(filters.q)
  const [sheet, setSheet] = useState(null)
  const [visible, setVisible] = useState(PAGE_SIZE)
  const inputRef = useRef(null)

  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const fetchRef = useRef(0)

  useEffect(() => {
    const id = ++fetchRef.current
    setLoading(true)
    getProducts({ ...filters, limit: 100 })
      .then((res) => {
        if (id !== fetchRef.current) return
        setResults(res.data || [])
        setTotalCount(res.pagination?.total ?? res.data?.length ?? 0)
      })
      .catch(() => {
        if (id !== fetchRef.current) return
        setResults([])
        setTotalCount(0)
      })
      .finally(() => {
        if (id === fetchRef.current) setLoading(false)
      })
  }, [filters])

  const shown = results.slice(0, visible)
  const chips = useMemo(() => activeChips(filters), [filters])
  const activeCount = countSearchFilters(filters)
  const queryLabel = filters.q.trim()

  const applyFilters = useCallback(
    (next) => {
      setSearchParams(searchParamsToSearch(next), { replace: true })
    },
    [setSearchParams],
  )

  function handleFilterChange(next) {
    applyFilters({ ...next, q: queryDraft })
  }

  function submitSearch(event) {
    event.preventDefault()
    applyFilters({ ...filters, q: queryDraft })
  }

  function clearFilters() {
    applyFilters({
      q: queryDraft,
      storefront: 'all',
      categoryIds: [],
      price: 'all',
      availability: 'all',
      sort: filters.sort,
    })
  }

  function clearSearch() {
    setQueryDraft('')
    applyFilters({ ...filters, q: '' })
    inputRef.current?.focus()
  }

  function removeChip(chip) {
    if (chip.key === 'house') {
      handleFilterChange({ ...filters, storefront: 'all', categoryIds: [] })
      return
    }
    if (chip.key === 'price') {
      handleFilterChange({ ...filters, price: 'all' })
      return
    }
    if (chip.key === 'stock') {
      handleFilterChange({ ...filters, availability: 'all' })
      return
    }
    if (chip.slug) {
      handleFilterChange({
        ...filters,
        categoryIds: filters.categoryIds.filter((id) => id !== chip.slug),
      })
    }
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
      applyFilters({ ...filters, q: queryDraft })
    }, 220)

    return () => window.clearTimeout(timer)
  }, [queryDraft, filters, applyFilters])

  useEffect(() => {
    setVisible(PAGE_SIZE)
  }, [searchParams])

  const countLabel = loading
    ? 'Searching…'
    : totalCount === 1
      ? '1 matching product'
      : `${totalCount} matching products`
  const foundLabel = loading
    ? 'Searching…'
    : totalCount === 1
      ? '1 product found'
      : `${totalCount} products found`
  const houseLabel =
    filters.storefront === 'all'
      ? `Searching across ${storefronts.length} houses`
      : `Searching in ${storefronts.find((house) => house.slug === filters.storefront)?.name ?? 'SV Hub'}`

  return (
    <section className="search" aria-labelledby="search-heading">
      <div className="search__grain" aria-hidden="true" />

      <header className="search__hero">
        <div className="search__container">
          <Reveal className="search__intro">
            <div className="search__intro-copy">
              <p className="search__eyebrow">Search</p>
              <h1 id="search-heading">Search Results</h1>
              <p className="search__lede">
                Find native rice, thokku, masalas and handmade soaps from both houses.
              </p>
            </div>
            <p className="search__hero-count" aria-live="polite">
              {countLabel}
            </p>
          </Reveal>

          <Reveal className="search__field-wrap" delay={80}>
            <form className="search__bar" role="search" onSubmit={submitSearch}>
              <label className="search__mobile-label" htmlFor="search-query">
                Search products
              </label>
              <span className="search__bar-icon" aria-hidden="true">
                <SearchIcon />
              </span>
              <input
                ref={inputRef}
                id="search-query"
                type="search"
                value={queryDraft}
                placeholder="Search rice, pickles, soaps…"
                autoComplete="off"
                onChange={(event) => setQueryDraft(event.target.value)}
              />
              <button type="submit" className="search__bar-btn">
                Search
                <Arrow />
              </button>
            </form>
            <p className="search__context">
              <span>{foundLabel}</span>
              <span aria-hidden="true">·</span>
              <span>{houseLabel}</span>
            </p>
          </Reveal>
        </div>
      </header>

      <div className="search__dock" aria-label="Search controls">
        <button
          type="button"
          className="search__dock-btn"
          aria-haspopup="dialog"
          aria-expanded={sheet === 'filters'}
          onClick={() => setSheet('filters')}
        >
          <FilterIcon />
          Filter{activeCount ? ` · ${activeCount}` : ''}
        </button>
        <button
          type="button"
          className="search__dock-btn"
          aria-haspopup="dialog"
          aria-expanded={sheet === 'sort'}
          onClick={() => setSheet('sort')}
        >
          <SortIcon />
          Sort
        </button>
        <p className="search__dock-count">{countLabel}</p>
      </div>

      <div className="search__container search__layout">
        <aside className="search__panel" aria-label="Search filters">
          <p className="search__panel-title">Filters</p>
          <ShopFilters
            filters={filters}
            onChange={handleFilterChange}
            showSearch={false}
            idPrefix="search"
          />
        </aside>

        <div className="search__main">
          <div className="search__controls">
            <p className="search__count" aria-live="polite">
              {countLabel}
            </p>
            <label className="search__sort" htmlFor="search-sort">
              <span>Sort</span>
              <span aria-hidden="true">·</span>
              <select
                id="search-sort"
                value={filters.sort}
                onChange={(event) =>
                  applyFilters({ ...filters, q: queryDraft, sort: event.target.value })
                }
              >
                {searchSortOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {chips.length ? (
            <div className="search__chips" aria-label="Active filters">
              <p className="search__chips-label">Filtered by</p>
              <ul>
                {chips.map((chip) => (
                  <li key={chip.key}>
                    <button type="button" onClick={() => removeChip(chip)}>
                      {chip.label}
                      <span aria-hidden="true">×</span>
                      <span className="sr-only">Remove {chip.label} filter</span>
                    </button>
                  </li>
                ))}
              </ul>
              <button type="button" className="search__clear" onClick={clearFilters}>
                Clear all
              </button>
            </div>
          ) : null}

          {loading ? (
            <p className="search__loading" style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--muted)' }} aria-busy="true">
              Searching products…
            </p>
          ) : results.length === 0 ? (
            <div className="search__empty">
              <p className="search__empty-kicker">No matches</p>
              <h2>We couldn’t find what you’re looking for.</h2>
              <p>
                {queryLabel
                  ? `No products match “${queryLabel}”. Try another word, or browse the full shop.`
                  : 'Enter a product name, or browse everything in the shop.'}
              </p>
              <div className="search__empty-actions">
                <button type="button" className="search__empty-btn" onClick={clearSearch}>
                  Clear search
                </button>
                <Link to="/shop" className="search__ghost-btn">
                  Explore all products
                  <Arrow />
                </Link>
              </div>
            </div>
          ) : (
            <>
              <ul className="shop__grid">
                {shown.map((product, index) => (
                  <li key={product.id}>
                    <ShopProduct product={product} index={index} />
                  </li>
                ))}
              </ul>

              <div className="search__more-row">
                <p>
                  Showing {shown.length} of {results.length}
                </p>
                {shown.length < results.length ? (
                  <button type="button" className="search__empty-btn" onClick={() => setVisible((n) => n + PAGE_SIZE)}>
                    Load more
                    <Arrow />
                  </button>
                ) : null}
              </div>
            </>
          )}
        </div>
      </div>

      <ShopSheet
        open={sheet === 'filters'}
        title="Filter"
        labelledBy="search-filter-sheet"
        onClose={() => setSheet(null)}
      >
        <div className="search__sheet-tools">
          {activeCount ? (
            <button type="button" className="search__clear" onClick={clearFilters}>
              Clear all
            </button>
          ) : (
            <span />
          )}
        </div>
        <ShopFilters
          filters={filters}
          onChange={handleFilterChange}
          idPrefix="search-sheet"
          showSearch={false}
        />
      </ShopSheet>

      <ShopSheet
        open={sheet === 'sort'}
        title="Sort"
        labelledBy="search-sort-sheet"
        onClose={() => setSheet(null)}
      >
        <div className="shop-filters__choices">
          {searchSortOptions.map((option) => (
            <label key={option.id} className="shop-filters__choice shop-filters__choice--row">
              <input
                type="radio"
                name="search-sheet-sort"
                checked={filters.sort === option.id}
                onChange={() => {
                  applyFilters({ ...filters, q: queryDraft, sort: option.id })
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

export default Search

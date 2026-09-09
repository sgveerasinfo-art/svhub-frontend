import { useEffect, useState } from 'react'
import { getCategories } from '../../api/categories.js'
import { availabilityFilters, priceFilters } from '../../data/shop.js'
import { storefronts } from '../../data/storefronts.js'

function ShopFilters({
  filters,
  onChange,
  onSearch,
  searchValue = '',
  idPrefix = 'shop',
  showSearch = true,
  showStorefront = true,
  lockedCategory = false,
  searchPlaceholder = 'Search rice, pickles, soaps…',
}) {
  const [categories, setCategories] = useState([])

  useEffect(() => {
    let cancelled = false
    getCategories()
      .then((res) => {
        if (!cancelled && res?.data) {
          setCategories(res.data)
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const visibleCategories = categories
    .filter((category) => filters.storefront === 'all' || category.storefront === filters.storefront)
    .filter((category) => (category.count || 0) > 0 || filters.categoryIds.includes(category.slug))

  function setField(partial) {
    onChange({ ...filters, ...partial })
  }

  function toggleCategory(slug) {
    const selected = filters.categoryIds.includes(slug)
      ? filters.categoryIds.filter((id) => id !== slug)
      : [...filters.categoryIds, slug]
    setField({ categoryIds: selected })
  }

  return (
    <form className="shop-filters" onSubmit={(event) => event.preventDefault()}>
      {showSearch ? (
        <div className="shop-filters__block">
          <label className="shop-filters__label" htmlFor={`${idPrefix}-search`}>
            Search products
          </label>
          <input
            id={`${idPrefix}-search`}
            type="search"
            className="shop-filters__search"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(event) => onSearch(event.target.value)}
            autoComplete="off"
          />
        </div>
      ) : null}

      {showStorefront && !lockedCategory ? (
        <fieldset className="shop-filters__block">
          <legend className="shop-filters__label">Storefront</legend>
          <div className="shop-filters__choices">
            <label className={`shop-filters__choice${filters.storefront === 'all' ? ' is-selected' : ''}`}>
              <input
                type="radio"
                name={`${idPrefix}-house`}
                checked={filters.storefront === 'all'}
                onChange={() => setField({ storefront: 'all', categoryIds: [] })}
              />
              <span>All Houses</span>
            </label>
            {storefronts.map((house) => (
              <label
                key={house.id}
                className={`shop-filters__choice${filters.storefront === house.slug ? ' is-selected' : ''}`}
              >
                <input
                  type="radio"
                  name={`${idPrefix}-house`}
                  checked={filters.storefront === house.slug}
                  onChange={() =>
                    setField({
                      storefront: house.slug,
                      categoryIds: filters.categoryIds.filter((id) => {
                        const match = categories.find((category) => category.slug === id)
                        return match?.storefront === house.slug
                      }),
                    })
                  }
                />
                <span>{house.name}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}

      {!lockedCategory ? (
        <fieldset className="shop-filters__block">
          <legend className="shop-filters__label">Category</legend>
          <div className="shop-filters__choices">
            {visibleCategories.map((category) => (
              <label
                key={category.id || category.slug}
                className={`shop-filters__choice${filters.categoryIds.includes(category.slug) ? ' is-selected' : ''}`}
              >
                <input
                  type="checkbox"
                  name={`${idPrefix}-cat`}
                  checked={filters.categoryIds.includes(category.slug)}
                  onChange={() => toggleCategory(category.slug)}
                />
                <span>{category.name}</span>
                <span className="shop-filters__count">{category.count}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}

      <fieldset className="shop-filters__block">
        <legend className="shop-filters__label">Price</legend>
        <div className="shop-filters__choices">
          {priceFilters.map((option) => (
            <label
              key={option.id}
              className={`shop-filters__choice${filters.price === option.id ? ' is-selected' : ''}`}
            >
              <input
                type="radio"
                name={`${idPrefix}-price`}
                checked={filters.price === option.id}
                onChange={() => setField({ price: option.id })}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="shop-filters__block">
        <legend className="shop-filters__label">Availability</legend>
        <div className="shop-filters__choices">
          {availabilityFilters.map((option) => (
            <label
              key={option.id}
              className={`shop-filters__choice${filters.availability === option.id ? ' is-selected' : ''}`}
            >
              <input
                type="radio"
                name={`${idPrefix}-stock`}
                checked={filters.availability === option.id}
                onChange={() => setField({ availability: option.id })}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
    </form>
  )
}

export default ShopFilters

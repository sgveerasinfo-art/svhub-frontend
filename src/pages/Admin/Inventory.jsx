import { useEffect, useMemo, useState } from 'react'
import { getAdminProducts, updateAdminInventory } from '../../api/adminProducts.js'
import { useAdminUi, usePagedList } from '../../context/AdminUi.jsx'
import { ADMIN_PAGE_SIZE, STOREFRONTS, matchesQuery } from '../../data/admin.js'
import {
  AdminButton,
  DataTable,
  EmptyState,
  FilterBar,
  FormField,
  LoadingState,
  Modal,
  PageHeader,
  Pagination,
  SearchInput,
  SelectFilter,
  StatusBadge,
  StorefrontChip,
  Thumb,
} from '../../components/admin/ui.jsx'

function Inventory() {
  const { toast } = useAdminUi()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshIndex, setRefreshIndex] = useState(0)
  const [query, setQuery] = useState('')
  const [house, setHouse] = useState('all')
  const [stock, setStock] = useState('all')
  const [editing, setEditing] = useState(null)
  const [qty, setQty] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getAdminProducts({ limit: 100 })
      .then((res) => {
        if (cancelled) return
        setProducts(res.data || [])
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [refreshIndex])

  const filtered = useMemo(() => {
    return products
      .filter((product) => matchesQuery(query, product.name, product.sku))
      .filter((product) => (house === 'all' ? true : product.storefront === house))
      .filter((product) => (stock === 'all' ? true : product.stock === stock))
      .sort((a, b) => a.qty - b.qty)
  }, [products, query, house, stock])

  const paged = usePagedList(filtered, ADMIN_PAGE_SIZE, `${query}|${house}|${stock}|${filtered.length}`)

  function openAdjust(product) {
    setEditing(product)
    setQty(String(product.qty))
  }

  async function saveAdjust(event) {
    event.preventDefault()
    const newQty = Math.max(0, parseInt(qty, 10) || 0)
    try {
      await updateAdminInventory(editing.id || editing._id, { qty: newQty })
      setProducts((prev) =>
        prev.map((p) =>
          p.id === editing.id
            ? {
                ...p,
                qty: newQty,
                stock: newQty > 10 ? 'in-stock' : newQty > 0 ? 'low-stock' : 'out-of-stock',
              }
            : p
        )
      )
      toast.success(`Stock updated for ${editing.name}`)
      setEditing(null)
    } catch (err) {
      toast.error(err.message || 'Could not update stock')
    }
  }

  if (loading) return <LoadingState label="Loading inventory" />

  const columns = [
    {
      key: 'product',
      label: 'SKU',
      render: (product) => (
        <div className="admin-product">
          <Thumb src={product.image} name={product.name} />
          <div>
            <strong>{product.name}</strong>
            <span>{product.sku}</span>
          </div>
        </div>
      ),
    },
    { key: 'house', label: 'House', render: (product) => <StorefrontChip id={product.storefront} /> },
    { key: 'qty', label: 'On hand', className: 'is-num', render: (product) => product.qty },
    {
      key: 'status',
      label: 'Status',
      render: (product) => <StatusBadge status={product.stock.replaceAll('-', ' ')} kind="stock" />,
    },
    {
      key: 'actions',
      label: '',
      render: (product) => (
        <AdminButton variant="ghost" size="sm" onClick={() => openAdjust(product)}>
          Adjust
        </AdminButton>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        eyebrow="Warehouse"
        title="Inventory"
        copy="Quantities drive stock badges. 0 is out of stock; 10 or below is low."
      />
      <FilterBar>
        <SearchInput value={query} onChange={setQuery} placeholder="Search SKU" />
        <SelectFilter
          label="House"
          value={house}
          onChange={setHouse}
          options={[{ value: 'all', label: 'All' }, ...STOREFRONTS.map((item) => ({ value: item.id, label: item.label }))]}
        />
        <SelectFilter
          label="Status"
          value={stock}
          onChange={setStock}
          options={[
            { value: 'all', label: 'All' },
            { value: 'in-stock', label: 'In stock' },
            { value: 'low-stock', label: 'Low' },
            { value: 'out-of-stock', label: 'Out' },
          ]}
        />
      </FilterBar>
      <div className="admin-panel">
        <DataTable
          caption="Inventory"
          columns={columns}
          rows={paged.items}
          rowKey={(product) => product.id}
          empty={<EmptyState title="No SKUs match" copy="Clear filters to see the full warehouse list." />}
          renderCard={(product) => (
            <div className="admin-card">
              <div className="admin-card__top">
                <strong>{product.name}</strong>
                <StatusBadge status={product.stock.replaceAll('-', ' ')} kind="stock" />
              </div>
              <p>
                {product.qty} on hand · {product.sku}
              </p>
              <AdminButton variant="ghost" size="sm" onClick={() => openAdjust(product)}>
                Adjust
              </AdminButton>
            </div>
          )}
        />
        <Pagination {...paged} onPage={paged.setPage} />
      </div>
      {editing ? (
        <Modal title={`Adjust ${editing.name}`} onClose={() => setEditing(null)}>
          <form onSubmit={saveAdjust}>
            <p>Current quantity: {editing.qty}</p>
            <FormField label="New quantity" hint="0 = out of stock. 1–10 = low stock.">
              <input type="number" min="0" value={qty} onChange={(event) => setQty(event.target.value)} />
            </FormField>
            <div className="admin-modal__actions">
              <AdminButton variant="ghost" onClick={() => setEditing(null)}>
                Cancel
              </AdminButton>
              <AdminButton type="submit">Update stock</AdminButton>
            </div>
          </form>
        </Modal>
      ) : null}
    </div>
  )
}

export default Inventory

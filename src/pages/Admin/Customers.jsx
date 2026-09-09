import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  getAdminCustomers,
  getAdminCustomer,
  updateAdminCustomer,
} from '../../api/adminCustomers.js'
import { useAdminUi, usePagedList } from '../../context/AdminUi.jsx'
import {
  ADMIN_PAGE_SIZE,
  formatAdminDate,
  formatAdminDateTime,
  matchesQuery,
} from '../../data/admin.js'
import { formatPrice } from '../../utils/money.js'
import { Icon } from '../../components/admin/icons.jsx'
import {
  AdminButton,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  LoadingState,
  Pagination,
  SearchInput,
} from '../../components/admin/ui.jsx'
import './Customers.css'

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { toast } = useAdminUi()
  const [params, setParams] = useSearchParams()

  // State from URL query params
  const searchQuery = params.get('q') || ''
  const statusFilter = params.get('status') || 'all'
  const tierFilter = params.get('tier') || 'all'
  const sortKey = params.get('sort') || 'spent'
  const sortDir = params.get('dir') || 'desc'

  // Selected customer for detail modal
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [confirmDeactivate, setConfirmDeactivate] = useState(null)
  const [notesInput, setNotesInput] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)

  // Update query params helper
  function updateParam(key, value) {
    const next = new URLSearchParams(params)
    if (value && value !== 'all') {
      next.set(key, value)
    } else {
      next.delete(key)
    }
    setParams(next)
  }

  // Handle column header sorting
  function handleSort(key) {
    const next = new URLSearchParams(params)
    if (sortKey === key) {
      next.set('dir', sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      next.set('sort', key)
      next.set('dir', key === 'name' ? 'asc' : 'desc')
    }
    setParams(next)
  }

  // Copy helper with toast
  function copyText(text, label, event) {
    if (event) event.stopPropagation()
    if (!text) return
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`Copied ${label} to clipboard`)
    }).catch(() => {
      toast.info(text)
    })
  }

  const fetchCustomers = useCallback(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    getAdminCustomers({
      q: searchQuery,
      status: statusFilter,
      tier: tierFilter,
      sort: sortKey,
      dir: sortDir,
      limit: 100,
    })
      .then((res) => {
        if (cancelled) return
        setCustomers(res.data || [])
      })
      .catch((err) => {
        if (cancelled) return
        setError(err.message || 'Could not load customer directory.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [searchQuery, statusFilter, tierFilter, sortKey, sortDir])

  useEffect(() => {
    const cleanup = fetchCustomers()
    return cleanup
  }, [fetchCustomers])

  // Process rows with stats, search, filter, and sort
  const allEnrichedCustomers = useMemo(() => {
    if (!customers || !customers.length) return []
    return customers.map((c) => ({
      ...c,
      id: c.id || c._id,
      status: c.status || 'Active',
      orderCount: c.orderCount || 0,
      spent: c.spent || 0,
      lastOrder: c.lastOrder || null,
      lastOrderId: c.lastOrderId || null,
    }))
  }, [customers])

  // Aggregate KPI summary
  const summaryKpis = useMemo(() => {
    const total = allEnrichedCustomers.length
    const active = allEnrichedCustomers.filter((c) => (c.status || '').toUpperCase() !== 'INACTIVE').length
    const totalRevenue = allEnrichedCustomers.reduce((acc, c) => acc + (c.spent || 0), 0)
    const repeatBuyers = allEnrichedCustomers.filter((c) => c.orderCount >= 2).length
    const repeatRate = total ? Math.round((repeatBuyers / total) * 100) : 0
    return { total, active, totalRevenue, repeatRate }
  }, [allEnrichedCustomers])

  // Filter & Sort
  const filteredRows = useMemo(() => {
    return allEnrichedCustomers
      .filter((c) => {
        // Search across name, email, phone, city, state
        if (!matchesQuery(searchQuery, c.name, c.email, c.phone, c.city, c.state)) {
          return false
        }
        // Account Status Filter
        if (statusFilter !== 'all') {
          if (statusFilter.toLowerCase() !== (c.status || 'active').toLowerCase()) {
            return false
          }
        }
        // Tier Filter
        if (tierFilter === 'repeat' && c.orderCount < 2) return false
        if (tierFilter === 'single' && c.orderCount !== 1) return false
        if (tierFilter === 'none' && c.orderCount > 0) return false
        if (tierFilter === 'high' && c.spent < 2000) return false

        return true
      })
      .sort((a, b) => {
        let modifier = sortDir === 'asc' ? 1 : -1
        if (sortKey === 'name') {
          return (a.name || '').localeCompare(b.name || '') * modifier
        }
        if (sortKey === 'joined') {
          return (new Date(a.joined || a.createdAt).getTime() - new Date(b.joined || b.createdAt).getTime()) * modifier
        }
        if (sortKey === 'orders') {
          return (a.orderCount - b.orderCount) * modifier
        }
        if (sortKey === 'spent') {
          return (a.spent - b.spent) * modifier
        }
        return 0
      })
  }, [allEnrichedCustomers, searchQuery, statusFilter, tierFilter, sortKey, sortDir])

  const paged = usePagedList(
    filteredRows,
    ADMIN_PAGE_SIZE,
    `${searchQuery}|${statusFilter}|${tierFilter}|${sortKey}|${sortDir}|${filteredRows.length}`,
  )

  // Orders for selected customer
  const customerOrders = useMemo(() => {
    if (!selectedCustomer) return []
    return selectedCustomer.orders || []
  }, [selectedCustomer])

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || tierFilter !== 'all'

  if (loading) {
    return (
      <div className="admin-customers-page">
        <LoadingState label="Loading customer directory..." lines={8} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="admin-customers-page">
        <ErrorState
          title="Could not load customer directory"
          copy={error}
          onRetry={fetchCustomers}
        />
      </div>
    )
  }

  async function openCustomerDetail(customer) {
    setSelectedCustomer(customer)
    setNotesInput(customer.notes || '')
    try {
      const res = await getAdminCustomer(customer.id || customer._id)
      if (res.data) {
        setSelectedCustomer((prev) => (prev && (prev.id === customer.id || prev._id === customer._id) ? { ...prev, ...res.data } : prev))
        setNotesInput(res.data.notes || '')
      }
    } catch {
      // Keep basic customer data loaded from list if detail fetch fails
    }
  }

  function handleStatusChange(targetStatus) {
    if (!selectedCustomer) return
    if (targetStatus.toLowerCase() === 'inactive') {
      setConfirmDeactivate({ targetStatus, customer: selectedCustomer })
      return
    }
    applyCustomerStatus(targetStatus)
  }

  async function applyCustomerStatus(status) {
    if (!selectedCustomer) return
    const custId = selectedCustomer.id || selectedCustomer._id
    try {
      await updateAdminCustomer(custId, { status })
      setSelectedCustomer((prev) => (prev ? { ...prev, status } : null))
      setCustomers((prev) =>
        prev.map((c) => ((c.id || c._id) === custId ? { ...c, status } : c)),
      )
      toast.success(`Account status for ${selectedCustomer.name} updated to ${status}`)
    } catch (err) {
      toast.error(err.message || 'Could not update account status')
    } finally {
      setConfirmDeactivate(null)
    }
  }

  async function handleSaveNotes(e) {
    e.preventDefault()
    if (!selectedCustomer) return
    const custId = selectedCustomer.id || selectedCustomer._id
    setSavingNotes(true)
    try {
      await updateAdminCustomer(custId, { notes: notesInput })
      setSelectedCustomer((prev) => (prev ? { ...prev, notes: notesInput } : null))
      setCustomers((prev) =>
        prev.map((c) => ((c.id || c._id) === custId ? { ...c, notes: notesInput } : c)),
      )
      toast.success('Customer notes saved')
    } catch (err) {
      toast.error(err.message || 'Could not save customer notes')
    } finally {
      setSavingNotes(false)
    }
  }

  return (
    <div className="admin-customers-page">
      {/* Header */}
      <header className="admin-customers-head">
        <div>
          <p className="admin-pagehead__eyebrow">CRM · Operations Directory</p>
          <h1 className="admin-title">Customers</h1>
          <p className="admin-pagehead__copy">
            Overview of registered buyers, lifetime order volume, contact info, and account access.
          </p>
        </div>
      </header>

      {/* KPI Metric Strip */}
      <section className="admin-customers-metrics" aria-label="Customer overview metrics">
        <div className="admin-cust-metric">
          <span>Total Customers</span>
          <strong>{summaryKpis.total}</strong>
          <em>Registered buyer accounts</em>
        </div>
        <div className="admin-cust-metric">
          <span>Active Accounts</span>
          <strong>{summaryKpis.active}</strong>
          <em>{summaryKpis.total ? Math.round((summaryKpis.active / summaryKpis.total) * 100) : 100}% of directory</em>
        </div>
        <div className="admin-cust-metric">
          <span>Combined Spend</span>
          <strong>{formatPrice(summaryKpis.totalRevenue)}</strong>
          <em>Lifetime order volume</em>
        </div>
        <div className="admin-cust-metric">
          <span>Repeat Rate</span>
          <strong>{summaryKpis.repeatRate}%</strong>
          <em>Buyers with 2+ orders</em>
        </div>
      </section>

      {/* Filter & Search Toolbar */}
      <div className="admin-cust-toolbar">
        <div className="admin-cust-toolbar__left">
          {/* Search */}
          <SearchInput
            value={searchQuery}
            onChange={(val) => updateParam('q', val)}
            placeholder="Search name, email, phone, city..."
            className="admin-cust-search"
          />

          {/* Account Status Filter */}
          <div className="admin-filter-pill-select">
            <label htmlFor="cust-status-filter">Status:</label>
            <select
              id="cust-status-filter"
              value={statusFilter}
              onChange={(e) => updateParam('status', e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="vip">VIP</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Tier Filter */}
          <div className="admin-filter-pill-select">
            <label htmlFor="cust-tier-filter">Tier:</label>
            <select
              id="cust-tier-filter"
              value={tierFilter}
              onChange={(e) => updateParam('tier', e.target.value)}
            >
              <option value="all">All Tiers</option>
              <option value="high">High Value (≥ ₹2,000)</option>
              <option value="repeat">Repeat Buyers (2+)</option>
              <option value="single">Single Order (1)</option>
              <option value="none">No Orders (0)</option>
            </select>
          </div>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              type="button"
              className="admin-filter-reset"
              onClick={() => {
                const next = new URLSearchParams()
                if (sortKey) next.set('sort', sortKey)
                if (sortDir) next.set('dir', sortDir)
                setParams(next)
              }}
            >
              <Icon name="close" size={12} />
              <span>Clear filters</span>
            </button>
          )}
        </div>

        {/* Quick Sort Dropdown */}
        <div className="admin-cust-toolbar__right">
          <div className="admin-filter-pill-select">
            <label htmlFor="cust-sort-select">Sort by:</label>
            <select
              id="cust-sort-select"
              value={`${sortKey}-${sortDir}`}
              onChange={(e) => {
                const [key, dir] = e.target.value.split('-')
                const next = new URLSearchParams(params)
                next.set('sort', key)
                next.set('dir', dir)
                setParams(next)
              }}
            >
              <option value="spent-desc">Total Spent: High to Low</option>
              <option value="spent-asc">Total Spent: Low to High</option>
              <option value="orders-desc">Orders: High to Low</option>
              <option value="joined-desc">Registration: Newest First</option>
              <option value="joined-asc">Registration: Oldest First</option>
              <option value="name-asc">Name: A–Z</option>
              <option value="name-desc">Name: Z–A</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Customers Data Table */}
      <div className="admin-customers-table-card">
        <div className="admin-table-wrap">
          <table className="admin-cust-table">
            <thead>
              <tr>
                <th
                  className="is-sortable"
                  onClick={() => handleSort('name')}
                  title="Sort by customer name"
                >
                  <span className={`admin-th-sort ${sortKey === 'name' ? 'is-active' : ''}`}>
                    <span>Customer Name</span>
                    <span className="admin-th-arrow">{sortKey === 'name' && sortDir === 'asc' ? '▲' : '▼'}</span>
                  </span>
                </th>
                <th>Email</th>
                <th>Phone</th>
                <th
                  className="is-sortable"
                  onClick={() => handleSort('joined')}
                  title="Sort by registration date"
                >
                  <span className={`admin-th-sort ${sortKey === 'joined' ? 'is-active' : ''}`}>
                    <span>Registration Date</span>
                    <span className="admin-th-arrow">{sortKey === 'joined' && sortDir === 'asc' ? '▲' : '▼'}</span>
                  </span>
                </th>
                <th
                  className="is-sortable"
                  style={{ textAlign: 'center' }}
                  onClick={() => handleSort('orders')}
                  title="Sort by order count"
                >
                  <span className={`admin-th-sort ${sortKey === 'orders' ? 'is-active' : ''}`}>
                    <span>Order Count</span>
                    <span className="admin-th-arrow">{sortKey === 'orders' && sortDir === 'asc' ? '▲' : '▼'}</span>
                  </span>
                </th>
                <th
                  className="is-sortable"
                  style={{ textAlign: 'right' }}
                  onClick={() => handleSort('spent')}
                  title="Sort by total spent"
                >
                  <span className={`admin-th-sort ${sortKey === 'spent' ? 'is-active' : ''}`}>
                    <span>Total Spent</span>
                    <span className="admin-th-arrow">{sortKey === 'spent' && sortDir === 'asc' ? '▲' : '▼'}</span>
                  </span>
                </th>
                <th>Account Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.items.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: 0 }}>
                    <EmptyState
                      title="No customers match your criteria"
                      copy="Try adjusting your search query, status, or purchasing tier filter."
                    />
                  </td>
                </tr>
              ) : (
                paged.items.map((cust) => {
                  const initials = cust.name
                    ? cust.name
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase()
                    : 'CU'
                  const isVip = cust.status === 'VIP'

                  return (
                    <tr
                      key={cust.id}
                      className="admin-cust-row"
                      onClick={() => openCustomerDetail(cust)}
                      title="Click to view customer details"
                    >
                      {/* Customer name */}
                      <td>
                        <div className="admin-cust-cell-customer">
                          <div className={`admin-cust-avatar ${isVip ? 'admin-cust-avatar--vip' : ''}`}>
                            {initials}
                          </div>
                          <div className="admin-cust-name-lockup">
                            <strong className="admin-cust-name">{cust.name}</strong>
                            <span className="admin-cust-loc">
                              {cust.city}, {cust.state}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td>
                        <div className="admin-cust-contact-cell">
                          <a
                            href={`mailto:${cust.email}`}
                            className="admin-cust-contact-link"
                            onClick={(e) => e.stopPropagation()}
                            title="Send email"
                          >
                            {cust.email}
                          </a>
                          <button
                            type="button"
                            className="admin-copy-mini"
                            title="Copy email"
                            onClick={(e) => copyText(cust.email, 'email', e)}
                          >
                            <Icon name="copy" size={12} />
                          </button>
                        </div>
                      </td>

                      {/* Phone */}
                      <td>
                        <div className="admin-cust-contact-cell">
                          <a
                            href={`tel:${cust.phone}`}
                            className="admin-cust-contact-link"
                            onClick={(e) => e.stopPropagation()}
                            title="Call phone"
                          >
                            {cust.phone}
                          </a>
                          <button
                            type="button"
                            className="admin-copy-mini"
                            title="Copy phone"
                            onClick={(e) => copyText(cust.phone, 'phone number', e)}
                          >
                            <Icon name="copy" size={12} />
                          </button>
                        </div>
                      </td>

                      {/* Registration date */}
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {formatAdminDate(cust.joined)}
                      </td>

                      {/* Order count */}
                      <td style={{ textAlign: 'center' }}>
                        <span className="admin-order-count-chip">
                          {cust.orderCount} {cust.orderCount === 1 ? 'order' : 'orders'}
                        </span>
                      </td>

                      {/* Total spent */}
                      <td style={{ textAlign: 'right' }} className="is-num">
                        <strong>{formatPrice(cust.spent)}</strong>
                      </td>

                      {/* Account status */}
                      <td>
                        <span
                          className={`admin-badge admin-badge--cust-${(cust.status || 'active').toLowerCase()}`}
                        >
                          <span className="admin-badge__dot" />
                          {cust.status || 'Active'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'right' }}>
                        <AdminButton
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation()
                            openCustomerDetail(cust)
                          }}
                        >
                          View Details
                        </AdminButton>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <Pagination {...paged} onPage={paged.setPage} />
      </div>

      {/* Customer Detail Modal / Slideout */}
      {selectedCustomer && (
        <div className="admin-modal-root" role="presentation">
          <button
            type="button"
            className="admin-modal__backdrop"
            aria-label="Close customer detail modal"
            onClick={() => setSelectedCustomer(null)}
          />
          <div
            className="admin-modal admin-cust-detail-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cust-detail-title"
          >
            {/* Modal Header */}
            <div className="admin-cust-detail-head">
              <div className="admin-cust-detail-profile">
                <div
                  className={`admin-cust-detail-avatar ${
                    selectedCustomer.status === 'VIP' ? 'admin-cust-detail-avatar--vip' : ''
                  }`}
                >
                  {selectedCustomer.name
                    ? selectedCustomer.name
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase()
                    : 'CU'}
                </div>
                <div className="admin-cust-detail-title-block">
                  <h2 id="cust-detail-title">{selectedCustomer.name}</h2>
                  <div className="admin-cust-detail-badges">
                    <span
                      className={`admin-badge admin-badge--cust-${(
                        selectedCustomer.status || 'active'
                      ).toLowerCase()}`}
                    >
                      <span className="admin-badge__dot" />
                      {selectedCustomer.status || 'Active'} Account
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--admin-mute)' }}>
                      ID: {selectedCustomer.id}
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="admin-iconbtn"
                onClick={() => setSelectedCustomer(null)}
                aria-label="Close modal"
              >
                <Icon name="close" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="admin-cust-detail-body">
              {/* Account Status Quick Control */}
              <div className="admin-cust-status-bar">
                <div className="admin-cust-status-bar__left">
                  <span>Account Status:</span>
                  <span
                    className={`admin-badge admin-badge--cust-${(
                      selectedCustomer.status || 'active'
                    ).toLowerCase()}`}
                  >
                    {selectedCustomer.status || 'Active'}
                  </span>
                </div>
                <div className="admin-cust-status-actions">
                  <AdminButton
                    size="sm"
                    variant={selectedCustomer.status === 'Active' ? 'primary' : 'ghost'}
                    onClick={() => handleStatusChange('Active')}
                  >
                    Mark Active
                  </AdminButton>
                  <AdminButton
                    size="sm"
                    variant={selectedCustomer.status === 'VIP' ? 'primary' : 'ghost'}
                    onClick={() => handleStatusChange('VIP')}
                  >
                    Mark VIP
                  </AdminButton>
                  <AdminButton
                    size="sm"
                    variant={selectedCustomer.status === 'Inactive' ? 'danger' : 'ghost'}
                    onClick={() => handleStatusChange('Inactive')}
                  >
                    Deactivate
                  </AdminButton>
                </div>
              </div>

              {/* Lifetime KPI Cards */}
              <div className="admin-cust-detail-kpis">
                <div className="admin-cust-detail-kpi">
                  <span>Total Orders</span>
                  <strong>{selectedCustomer.orderCount}</strong>
                </div>
                <div className="admin-cust-detail-kpi">
                  <span>Total Spent</span>
                  <strong>{formatPrice(selectedCustomer.spent)}</strong>
                </div>
                <div className="admin-cust-detail-kpi">
                  <span>Average Order Value</span>
                  <strong>
                    {formatPrice(
                      selectedCustomer.orderCount ? selectedCustomer.spent / selectedCustomer.orderCount : 0,
                    )}
                  </strong>
                </div>
              </div>

              {/* Basic Information */}
              <div className="admin-cust-section">
                <h3 className="admin-cust-section-title">
                  <Icon name="user" size={15} />
                  <span>Basic Information</span>
                </h3>
                <div className="admin-cust-info-card">
                  <div className="admin-cust-info-item">
                    <span className="admin-cust-info-label">Email Address</span>
                    <div className="admin-cust-info-val">
                      <a href={`mailto:${selectedCustomer.email}`} className="admin-cust-contact-link">
                        {selectedCustomer.email}
                      </a>
                      <button
                        type="button"
                        className="admin-copy-mini"
                        title="Copy email"
                        onClick={() => copyText(selectedCustomer.email, 'email')}
                      >
                        <Icon name="copy" size={12} />
                      </button>
                    </div>
                  </div>

                  <div className="admin-cust-info-item">
                    <span className="admin-cust-info-label">Phone Number</span>
                    <div className="admin-cust-info-val">
                      <a href={`tel:${selectedCustomer.phone}`} className="admin-cust-contact-link">
                        {selectedCustomer.phone}
                      </a>
                      <button
                        type="button"
                        className="admin-copy-mini"
                        title="Copy phone"
                        onClick={() => copyText(selectedCustomer.phone, 'phone number')}
                      >
                        <Icon name="copy" size={12} />
                      </button>
                    </div>
                  </div>

                  <div className="admin-cust-info-item">
                    <span className="admin-cust-info-label">Primary Location</span>
                    <div className="admin-cust-info-val">
                      <span>
                        {selectedCustomer.city}, {selectedCustomer.state}
                      </span>
                    </div>
                  </div>

                  <div className="admin-cust-info-item">
                    <span className="admin-cust-info-label">Registration Date</span>
                    <div className="admin-cust-info-val">
                      <span>{formatAdminDate(selectedCustomer.joined)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order History */}
              <div className="admin-cust-section">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h3 className="admin-cust-section-title">
                    <Icon name="orders" size={15} />
                    <span>Order History ({customerOrders.length})</span>
                  </h3>
                  {customerOrders.length > 0 && (
                    <Link
                      to={`/admin/orders?q=${encodeURIComponent(selectedCustomer.name)}`}
                      className="admin-textlink"
                      style={{ fontSize: 12 }}
                      onClick={() => setSelectedCustomer(null)}
                    >
                      Filter in Orders table →
                    </Link>
                  )}
                </div>

                {customerOrders.length === 0 ? (
                  <EmptyState
                    title="No orders placed yet"
                    copy="This customer has registered an account but hasn't completed an order."
                  />
                ) : (
                  <div className="admin-cust-orders-list">
                    {customerOrders.map((order) => {
                      const itemCount = order.items?.reduce((s, i) => s + (Number(i.quantity) || 1), 0) || 0
                      const itemsPreview = order.items?.map((i) => i.name).slice(0, 2).join(', ')

                      return (
                        <Link
                          key={order.id}
                          to={`/admin/orders/${order.id}`}
                          className="admin-cust-order-row"
                          onClick={() => setSelectedCustomer(null)}
                          title="Open order details"
                        >
                          <div className="admin-cust-order-main">
                            <div className="admin-cust-order-top">
                              <strong>{order.number}</strong>
                              <span style={{ fontSize: 12, color: 'var(--admin-mute)' }}>
                                {formatAdminDateTime(order.date)}
                              </span>
                            </div>
                            <span className="admin-cust-order-items">
                              {itemCount} {itemCount === 1 ? 'item' : 'items'}
                              {itemsPreview ? ` • ${itemsPreview}` : ''}
                            </span>
                          </div>

                          <div className="admin-cust-order-meta">
                            <span className="admin-cust-order-amount">
                              {formatPrice(order.amount)}
                            </span>
                            <span className={`admin-badge admin-badge--order-${(order.status || 'pending').toLowerCase()}`}>
                              {order.status}
                            </span>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Internal Notes */}
              <div className="admin-cust-section">
                <h3 className="admin-cust-section-title">
                  <Icon name="edit" size={15} />
                  <span>Internal Customer Notes</span>
                </h3>
                <form onSubmit={handleSaveNotes} style={{ display: 'grid', gap: 8 }}>
                  <textarea
                    value={notesInput}
                    onChange={(e) => setNotesInput(e.target.value)}
                    placeholder="Add operational notes about preferred delivery times, allergies, or special packaging..."
                    style={{
                      width: '100%',
                      minHeight: 70,
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--admin-line)',
                      background: 'var(--white)',
                      fontFamily: 'inherit',
                      fontSize: 13,
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <AdminButton size="sm" variant="primary" type="submit" disabled={savingNotes}>
                      {savingNotes ? 'Saving…' : 'Save note'}
                    </AdminButton>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Account Deactivation */}
      {confirmDeactivate && (
        <ConfirmDialog
          title={`Deactivate ${confirmDeactivate.customer.name}'s Account?`}
          message="Deactivating this account will restrict customer sign-in and suspend checkout access. You can reactivate it at any time."
          confirmLabel="Deactivate Account"
          danger
          onConfirm={() => applyCustomerStatus('Inactive')}
          onCancel={() => setConfirmDeactivate(null)}
        />
      )}
    </div>
  )
}

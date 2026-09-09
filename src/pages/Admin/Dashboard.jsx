import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getAdminDashboard } from '../../api/adminDashboard.js'
import { formatAdminDate, storefrontLabel } from '../../data/admin.js'
import { formatPrice } from '../../utils/money.js'
import { Icon } from '../../components/admin/icons.jsx'
import {
  ErrorState,
  LoadingState,
  StatusBadge,
  StorefrontChip,
  Thumb,
} from '../../components/admin/ui.jsx'

function SalesChart({ points = [] }) {
  const [hover, setHover] = useState(null)
  const width = 560
  const height = 196
  const pad = { top: 16, right: 12, bottom: 28, left: 12 }
  const innerW = width - pad.left - pad.right
  const innerH = height - pad.top - pad.bottom
  const safePoints = points.length ? points : [{ label: 'Today', total: 0 }]
  const max = Math.max(...safePoints.map((point) => point.total), 1)
  const coords = safePoints.map((point, index) => {
    const x = pad.left + (safePoints.length === 1 ? innerW / 2 : (index / (safePoints.length - 1)) * innerW)
    const y = pad.top + innerH - (point.total / max) * innerH
    return { ...point, x, y }
  })
  const line = coords.map((point) => `${point.x},${point.y}`).join(' ')
  const area = `M ${coords[0].x} ${pad.top + innerH} L ${coords.map((point) => `${point.x} ${point.y}`).join(' L ')} L ${coords[coords.length - 1].x} ${pad.top + innerH} Z`

  return (
    <div className="admin-chart">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Paid revenue over the selected period">
        {[0.25, 0.5, 0.75, 1].map((step) => (
          <line
            key={step}
            x1={pad.left}
            x2={width - pad.right}
            y1={pad.top + innerH * (1 - step)}
            y2={pad.top + innerH * (1 - step)}
            className="admin-chart__grid"
          />
        ))}
        <path d={area} className="admin-chart__area" />
        <polyline points={line} className="admin-chart__line" />
        {coords.map((point, index) => {
          const prev = coords[index - 1]
          const next = coords[index + 1]
          const x1 = prev ? (prev.x + point.x) / 2 : pad.left
          const x2 = next ? (point.x + next.x) / 2 : width - pad.right
          return (
            <g key={point.label}>
              <rect
                x={x1}
                y={pad.top}
                width={Math.max(x2 - x1, 8)}
                height={innerH}
                fill="transparent"
                onMouseEnter={() => setHover(index)}
                onMouseLeave={() => setHover(null)}
              />
              <circle cx={point.x} cy={point.y} r={hover === index ? 4.5 : 3} className="admin-chart__dot" />
              <text x={point.x} y={height - 8} className="admin-chart__axis">
                {point.label}
              </text>
            </g>
          )
        })}
      </svg>
      {hover != null ? (
        <div className="admin-chart__tip" style={{ left: `${(coords[hover].x / width) * 100}%` }}>
          <strong>{formatPrice(coords[hover].total)}</strong>
          <span>{coords[hover].label}</span>
        </div>
      ) : null}
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="admin-dashload" aria-busy="true">
      <span className="sr-only">Loading dashboard</span>
      <div className="admin-skel admin-skel--title" />
      <div className="admin-metricstrip">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="admin-skel admin-skel--metric" />
        ))}
      </div>
      <div className="admin-dashgrid">
        <div className="admin-skel admin-skel--block" />
        <div className="admin-skel admin-skel--block" />
      </div>
    </div>
  )
}

function Dashboard() {
  const navigate = useNavigate()
  const [range, setRange] = useState(7)
  const [tick, setTick] = useState(0)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    getAdminDashboard({ range })
      .then((res) => {
        if (cancelled) return
        setData(res.data)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err.message || 'Could not load admin dashboard data.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [range, tick])

  if (loading && !data) return <DashboardSkeleton />
  if (error && !data) {
    return <ErrorState title="Could not load admin data" copy={error} onRetry={() => setTick((v) => v + 1)} />
  }

  const metricsData = data?.metrics || {}
  const pendingOrders = metricsData.pendingOrders ?? 0
  const lowStock = data?.lowStockProducts || []
  const revenue = metricsData.revenue ?? 0
  const recent = data?.recentOrders || []
  const statusRows = data?.statusRows || []
  const sampled = data?.salesChart || []
  const nutri = data?.nutriRevenue ?? 0
  const care = data?.careRevenue ?? 0
  const topItem = data?.topItem || null
  const lowest = data?.lowestProduct || null
  const topHouse = data?.topHouse || { id: 'nutri-hub', value: 0 }
  const orderTotal = metricsData.totalOrders || 1

  const metrics = [
    { key: 'products', label: 'Total Products', value: metricsData.totalProducts ?? 0, hint: 'Live catalogue', to: '/admin/products', tone: 'calm' },
    { key: 'orders', label: 'Total Orders', value: metricsData.totalOrders ?? 0, hint: 'Across all orders', to: '/admin/orders', tone: 'calm' },
    { key: 'pending', label: 'Pending Orders', value: pendingOrders, hint: 'Awaiting action', to: '/admin/orders?status=Pending', tone: 'amber' },
    { key: 'revenue', label: 'Revenue', value: formatPrice(revenue), hint: 'Paid orders', to: '/admin/orders?payment=Paid', tone: 'lead' },
    { key: 'customers', label: 'Customers', value: metricsData.totalCustomers ?? 0, hint: 'On file', to: '/admin/customers', tone: 'calm' },
    { key: 'stock', label: 'Low Stock', value: lowStock.length, hint: 'Need restock', to: '/admin/products?stock=alert', tone: 'alert' },
  ]

  return (
    <div className="admin-home">
      <header className="admin-pagehead">
        <div>
          <p className="admin-pagehead__eyebrow">Overview</p>
          <h1 className="admin-title">Dashboard</h1>
          <p className="admin-pagehead__copy">A clear view of what is happening across SV Hub today.</p>
        </div>
        <button type="button" className="admin-refresh" onClick={() => setTick((value) => value + 1)}>
          <span>
            Last updated
            <strong>Just now</strong>
          </span>
          <Icon name="refresh" size={15} />
        </button>
      </header>

      <section className="admin-metricstrip" aria-label="Summary metrics">
        {metrics.map((metric) => (
          <Link key={metric.key} to={metric.to} className={`admin-metric admin-metric--${metric.tone}`}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <em>{metric.hint}</em>
          </Link>
        ))}
      </section>

      <section className="admin-dashgrid">
        <article className="admin-surface admin-surface--orders">
          <div className="admin-surface__head">
            <div>
              <p className="admin-surface__kicker">Latest activity</p>
              <h2>Recent Orders</h2>
            </div>
            <Link to="/admin/orders" className="admin-textlink">
              View all
              <Icon name="arrow" size={14} />
            </Link>
          </div>
          {recent.length ? (
            <div className="admin-table-wrap">
              <table className="admin-table admin-table--quiet">
                <caption className="sr-only">Recent orders</caption>
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>House</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th className="admin-table__go">
                      <span className="sr-only">Open</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((order) => (
                    <tr
                      key={order.id}
                      tabIndex={0}
                      onClick={() => navigate(`/admin/orders/${order.id}`)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          navigate(`/admin/orders/${order.id}`)
                        }
                      }}
                    >
                      <td>
                        <Link to={`/admin/orders/${order.id}`} className="admin-table__order">
                          {order.number}
                        </Link>
                        <span className="admin-sub">{formatAdminDate(order.date)}</span>
                      </td>
                      <td>{order.customerName}</td>
                      <td>
                        {order.storefronts?.map((id) => (
                          <StorefrontChip key={id} id={id} />
                        ))}
                      </td>
                      <td className="is-num">{formatPrice(order.amount)}</td>
                      <td>
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="admin-table__go">
                        <Link to={`/admin/orders/${order.id}`} aria-label={`Open ${order.number}`}>
                          <Icon name="arrow" size={14} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="admin-empty">
              <h3>No orders yet.</h3>
              <p>Orders will appear here once customers place them.</p>
            </div>
          )}
        </article>

        <article className="admin-surface">
          <div className="admin-surface__head">
            <div>
              <p className="admin-surface__kicker">Paid revenue</p>
              <h2>Sales Overview</h2>
            </div>
            <div className="admin-range" role="group" aria-label="Sales range">
              {[7, 30, 90].map((days) => (
                <button
                  key={days}
                  type="button"
                  className={range === days ? 'is-active' : ''}
                  onClick={() => setRange(days)}
                >
                  {days} days
                </button>
              ))}
            </div>
          </div>
          <dl className="admin-salesline">
            <div>
              <dt>Nutri-Hub</dt>
              <dd>{formatPrice(nutri)}</dd>
            </div>
            <div>
              <dt>Self-Care</dt>
              <dd>{formatPrice(care)}</dd>
            </div>
          </dl>
          <SalesChart points={sampled} />
        </article>

        <article className="admin-surface">
          <div className="admin-surface__head">
            <div>
              <p className="admin-surface__kicker">{metricsData.totalOrders ?? 0} total orders</p>
              <h2>Order Activity</h2>
            </div>
          </div>
          <ul className="admin-activity">
            {statusRows.map((row) => (
              <li key={row.status}>
                <div className="admin-activity__meta">
                  <span>{row.status}</span>
                  <strong>
                    {row.count}
                    <em>{Math.round((row.count / orderTotal) * 100)}%</em>
                  </strong>
                </div>
                <div className="admin-activity__track" aria-hidden="true">
                  <span
                    className={`admin-activity__fill admin-activity__fill--${row.status.toLowerCase()}`}
                    style={{ width: `${(row.count / orderTotal) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </article>

        <article className="admin-surface">
          <div className="admin-surface__head">
            <div>
              <p className="admin-surface__kicker">From live catalogue</p>
              <h2>Quick Insights</h2>
            </div>
          </div>
          <dl className="admin-insights">
            {topItem ? (
              <div>
                <dt>Most ordered</dt>
                <dd>{topItem[0]}</dd>
                <span>{topItem[1]} units in fulfilled orders</span>
              </div>
            ) : null}
            {lowest ? (
              <div>
                <dt>Lowest stock</dt>
                <dd>{lowest.name}</dd>
                <span>{lowest.qty} on hand</span>
              </div>
            ) : null}
            <div>
              <dt>Top house</dt>
              <dd>{storefrontLabel(topHouse.id)}</dd>
              <span>{formatPrice(topHouse.value)} paid</span>
            </div>
          </dl>
        </article>
      </section>

      <article className="admin-surface admin-surface--stock">
        <div className="admin-surface__head">
          <div>
            <p className="admin-surface__kicker">Inventory attention</p>
            <h2>Low Stock Products</h2>
          </div>
          <Link to="/admin/inventory" className="admin-textlink">
            View inventory
            <Icon name="arrow" size={14} />
          </Link>
        </div>
        {lowStock.length ? (
          <div className="admin-table-wrap">
            <table className="admin-table admin-table--quiet">
              <caption className="sr-only">Low stock products</caption>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>House</th>
                  <th>Stock</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {lowStock.slice(0, 6).map((product) => (
                  <tr
                    key={product.id}
                    tabIndex={0}
                    onClick={() => navigate(`/admin/products?q=${encodeURIComponent(product.name)}`)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        navigate(`/admin/products?q=${encodeURIComponent(product.name)}`)
                      }
                    }}
                  >
                    <td>
                      <div className="admin-product">
                        <Thumb src={product.image} name={product.name} />
                        <div>
                          <Link to={`/admin/products?q=${encodeURIComponent(product.name)}`}>{product.name}</Link>
                          <span>{product.sku}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <StorefrontChip id={product.storefront} />
                    </td>
                    <td>
                      <strong className={`admin-qty${product.qty === 0 ? ' is-out' : ''}`}>{product.qty}</strong>
                    </td>
                    <td>
                      {product.qty === 0 ? (
                        <span className="admin-stockflag">Out of stock</span>
                      ) : (
                        <StatusBadge status="low stock" kind="stock" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="admin-empty">
            <h3>Stock is healthy.</h3>
            <p>All SKUs are above the low-stock threshold.</p>
          </div>
        )}
      </article>
    </div>
  )
}

export default Dashboard

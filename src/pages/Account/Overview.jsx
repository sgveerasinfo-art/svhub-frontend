import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { formatPrice } from '../../utils/money.js'
import { formatOrderDate, padCount } from '../../data/account.js'
import { getOrders } from '../../api/orders.js'
import { getAddresses } from '../../api/addresses.js'
import AccountLoginPrompt from './AccountLoginPrompt.jsx'
import { EmptyState, OrderList, StatusMark } from './OrderList.jsx'

function mapStatus(raw) {
  const map = {
    PENDING_PAYMENT: 'Pending',
    CONFIRMED: 'Confirmed',
    PROCESSING: 'Processing',
    SHIPPED: 'Shipped',
    OUT_FOR_DELIVERY: 'Out for Delivery',
    DELIVERED: 'Delivered',
    CANCELLED: 'Cancelled',
  }
  return map[String(raw || '').toUpperCase()] ?? String(raw ?? 'Pending')
}

function mapPaymentStatus(raw) {
  const map = {
    PENDING: 'Pending',
    PAID: 'Paid',
    SUCCESS: 'Paid',
    FAILED: 'Failed',
    REFUNDED: 'Refunded',
  }
  return map[String(raw || '').toUpperCase()] ?? String(raw ?? 'Pending')
}

function normaliseOrder(order) {
  return {
    id: order.id,
    number: order.orderNumber,
    date: order.createdAt,
    status: mapStatus(order.status),
    paymentStatus: mapPaymentStatus(order.paymentStatus),
    amount: order.totalAmount,
    items: (order.items || []).map((item) => ({
      id: item.productId,
      name: item.productName,
      weight: item.variantLabel || item.weight || '',
      quantity: item.quantity,
      price: item.unitPrice,
      image: item.image || '',
      slug: item.slug || '',
    })),
  }
}

function Overview() {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [addresses, setAddresses] = useState([])

  useEffect(() => {
    if (!user) {
      setOrders([])
      setAddresses([])
      return
    }

    let cancelled = false

    Promise.all([
      getOrders().catch(() => ({ data: [] })),
      getAddresses().catch(() => ({ data: [] })),
    ]).then(([ordersRes, addressesRes]) => {
      if (cancelled) return
      const rawOrders = ordersRes?.data || []
      setOrders(rawOrders.map(normaliseOrder))
      setAddresses(addressesRes?.data || [])
    })

    return () => {
      cancelled = true
    }
  }, [user])

  const latest = orders[0] ?? null
  const recentOrders = orders.slice(0, 4)
  const firstItem = latest?.items?.[0]
  const extra = Math.max((latest?.items?.length || 0) - 1, 0)
  const profileName = user?.name?.trim() || '—'

  return (
    <div className="account-panel">
      {user ? (
        latest ? (
          <section className="account-latest" aria-labelledby="latest-order-heading">
            <p className="account-kicker">Your latest order</p>
            <div className="account-latest__grid">
              <div>
                <h2 id="latest-order-heading">{latest.number}</h2>
                <p className="account-latest__meta">
                  <span>{formatOrderDate(latest.date)}</span>
                  <span>{formatPrice(latest.amount)}</span>
                </p>
                <StatusMark status={latest.status} />
              </div>
              <div className="account-latest__goods">
                {firstItem ? (
                  <div className="account-latest__item">
                    {firstItem.image ? (
                      <img src={firstItem.image} alt="" width="72" height="72" />
                    ) : null}
                    <div>
                      <p>{firstItem.name}</p>
                      {extra ? (
                        <p className="account-latest__more">
                          + {extra} more {extra === 1 ? 'item' : 'items'}
                        </p>
                      ) : null}
                    </div>
                  </div>
                ) : null}
                <Link to={`/account/orders/${latest.id}`} className="account-text-link">
                  View order →
                </Link>
              </div>
            </div>
          </section>
        ) : (
          <EmptyState
            title="No orders yet"
            copy="Your first SV Hub order is waiting to find its way home."
            to="/shop"
            action="Explore products →"
          />
        )
      ) : (
        <AccountLoginPrompt
          title="Log in to see your orders"
          copy="Sign in to track orders, manage addresses and keep your details in one place."
        />
      )}

      <ul className="account-facts">
        <li>
          <p className="account-kicker">Total orders</p>
          <p className="account-facts__value">{padCount(orders.length)}</p>
          <Link to="/account/orders" className="account-text-link">
            View orders →
          </Link>
        </li>
        <li>
          <p className="account-kicker">Saved addresses</p>
          <p className="account-facts__value">{padCount(addresses.length)}</p>
          <Link to="/account/addresses" className="account-text-link">
            Manage addresses →
          </Link>
        </li>
        <li>
          <p className="account-kicker">Profile</p>
          <p className={`account-facts__name${!user ? ' is-blank' : ''}`}>{profileName}</p>
          <Link to="/account/profile" className="account-text-link">
            Edit profile →
          </Link>
        </li>
      </ul>

      {latest ? (
        <section className="account-section" aria-labelledby="recent-orders-heading">
          <div className="account-section__head">
            <h2 id="recent-orders-heading">Recent orders</h2>
            {orders.length > 1 ? (
              <Link to="/account/orders" className="account-text-link">
                View all →
              </Link>
            ) : null}
          </div>
          <OrderList
            orders={recentOrders}
            emptyTitle={user ? 'No orders yet' : 'No orders to show'}
            emptyCopy={
              user
                ? 'Your first SV Hub order is waiting to find its way home.'
                : 'Log in to see orders placed with your account.'
            }
          />
        </section>
      ) : null}
    </div>
  )
}

export default Overview

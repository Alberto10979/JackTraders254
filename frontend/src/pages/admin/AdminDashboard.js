import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiPackage, FiShoppingBag, FiDollarSign, FiAlertCircle, FiArrowRight } from 'react-icons/fi'
import { supabase } from '../../lib/supabase'

const fmt = (n) =>
  new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 0 }).format(n || 0)

export default function AdminDashboard() {
  const [stats, setStats] = useState({ products: 0, orders: 0, revenue: 0, lowStock: 0 })
  const [recentOrders, setRecentOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      const [prodRes, orderRes, lowRes] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('total_amount, status, created_at, customer_name, id').order('created_at', { ascending: false }),
        supabase.from('products').select('id', { count: 'exact', head: true }).lt('stock', 5).gt('stock', 0),
      ])

      const orders = orderRes.data || []
      const revenue = orders
        .filter((o) => o.status === 'delivered' || o.status === 'confirmed')
        .reduce((s, o) => s + (o.total_amount || 0), 0)

      setStats({
        products: prodRes.count || 0,
        orders: orders.length,
        revenue,
        lowStock: lowRes.count || 0,
      })
      setRecentOrders(orders.slice(0, 8))
      setLoading(false)
    }
    fetchStats()
  }, [])

  const STAT_CARDS = [
    { label: 'Total Products', value: stats.products, icon: <FiPackage />, cls: 'blue' },
    { label: 'Total Orders', value: stats.orders, icon: <FiShoppingBag />, cls: 'amber' },
    { label: 'Revenue', value: fmt(stats.revenue), icon: <FiDollarSign />, cls: 'green', isText: true },
    { label: 'Low Stock Items', value: stats.lowStock, icon: <FiAlertCircle />, cls: 'red' },
  ]

  return (
    <div>
      <div className="admin-topbar">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Store overview and quick actions</p>
        </div>
        <div className="admin-topbar-actions">
          <Link to="/admin/products/new" className="btn btn-primary">
            + Add Product
          </Link>
        </div>
      </div>

      <div className="stats-grid">
        {STAT_CARDS.map((s) => (
          <div key={s.label} className="stat-card">
            <div className={`stat-icon ${s.cls}`}>{s.icon}</div>
            <div className="stat-value">{s.isText ? s.value : s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="admin-table-wrap">
        <div className="admin-table-header">
          <span className="admin-table-title">Recent Orders</span>
          <Link to="/admin/orders" className="btn btn-outline" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
            View All <FiArrowRight size={13} />
          </Link>
        </div>
        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : recentOrders.length === 0 ? (
          <div className="empty-state">No orders yet</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((o) => (
                <tr key={o.id}>
                  <td><strong>#{o.id.slice(0, 8).toUpperCase()}</strong></td>
                  <td>{o.customer_name}</td>
                  <td style={{ color: 'var(--success)', fontWeight: 700 }}>{fmt(o.total_amount)}</td>
                  <td><span className={`status-${o.status}`}>{o.status}</span></td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    {new Date(o.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

import React, { useEffect, useState } from 'react'
import { FiEye, FiX } from 'react-icons/fi'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

const fmt = (n) =>
  new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 0 }).format(n)

const STATUS_OPTIONS = ['pending', 'confirmed', 'processing', 'delivered', 'cancelled']

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [selected, setSelected] = useState(null)
  const [orderItems, setOrderItems] = useState([])

  const fetchOrders = async () => {
    setLoading(true)
    let q = supabase.from('orders').select('*').order('created_at', { ascending: false })
    if (filter) q = q.eq('status', filter)
    const { data } = await q
    setOrders(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchOrders() }, [filter])

  const viewOrder = async (order) => {
    setSelected(order)
    const { data } = await supabase.from('order_items').select('*').eq('order_id', order.id)
    setOrderItems(data || [])
  }

  const updateStatus = async (orderId, status) => {
    const { error } = await supabase.from('orders').update({ status }).eq('id', orderId)
    if (error) { toast.error('Failed to update'); return }
    toast.success(`Status updated to ${status}`)
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)))
    if (selected?.id === orderId) setSelected((o) => ({ ...o, status }))
  }

  return (
    <div>
      <div className="admin-topbar">
        <div>
          <h1 className="page-title">Orders</h1>
          <p className="page-subtitle">Manage customer orders</p>
        </div>
        <div className="admin-topbar-actions">
          <select
            className="form-select"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ fontSize: '0.85rem' }}
          >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="admin-table-wrap">
        <div className="admin-table-header">
          <span className="admin-table-title">{orders.length} orders</span>
        </div>

        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : orders.length === 0 ? (
          <div className="empty-state">No orders found</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td><strong>#{o.id.slice(0, 8).toUpperCase()}</strong></td>
                    <td>{o.customer_name}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{o.customer_phone}</td>
                    <td style={{ fontWeight: 700, color: 'var(--success)' }}>{fmt(o.total_amount)}</td>
                    <td>
                      <select
                        className={`status-${o.status}`}
                        value={o.status}
                        onChange={(e) => updateStatus(o.id, e.target.value)}
                        style={{ border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.75rem', background: 'transparent', borderRadius: 999, padding: '2px 8px' }}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                        ))}
                      </select>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {new Date(o.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: '2-digit' })}
                    </td>
                    <td>
                      <button className="action-btn" onClick={() => viewOrder(o)}>
                        <FiEye size={13} /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'white', borderRadius: 8, width: '100%', maxWidth: 560, maxHeight: '90vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <h2 style={{ fontWeight: 700, fontSize: '1rem' }}>
                Order #{selected.id.slice(0, 8).toUpperCase()}
              </h2>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setSelected(null)}>
                <FiX size={20} />
              </button>
            </div>

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: '0.875rem' }}>
                {[
                  ['Customer', selected.customer_name],
                  ['Phone', selected.customer_phone],
                  ['Email', selected.customer_email || '—'],
                  ['Delivery Address', selected.delivery_address],
                  ['Total', fmt(selected.total_amount)],
                  ['Notes', selected.notes || '—'],
                ].map(([label, val]) => (
                  <div key={label}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: 2 }}>{label}</div>
                    <div style={{ fontWeight: 600 }}>{val}</div>
                  </div>
                ))}
              </div>

              <div>
                <div style={{ fontWeight: 700, marginBottom: 10 }}>Update Status</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {STATUS_OPTIONS.map((s) => (
                    <button
                      key={s}
                      className={`action-btn ${selected.status === s ? 'active' : ''}`}
                      style={{ background: selected.status === s ? 'var(--primary)' : 'white', color: selected.status === s ? 'white' : 'var(--text)', borderColor: selected.status === s ? 'var(--primary)' : 'var(--border)' }}
                      onClick={() => updateStatus(selected.id, s)}
                    >
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {orderItems.length > 0 && (
                <div>
                  <div style={{ fontWeight: 700, marginBottom: 10 }}>Items Ordered</div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg)' }}>
                        <th style={{ padding: '8px 10px', textAlign: 'left' }}>Product</th>
                        <th style={{ padding: '8px 10px', textAlign: 'right' }}>Qty</th>
                        <th style={{ padding: '8px 10px', textAlign: 'right' }}>Price</th>
                        <th style={{ padding: '8px 10px', textAlign: 'right' }}>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderItems.map((item) => (
                        <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '8px 10px' }}>{item.product_name}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'right' }}>{item.quantity}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'right' }}>{fmt(item.product_price)}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: 'var(--success)' }}>
                            {fmt(item.product_price * item.quantity)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

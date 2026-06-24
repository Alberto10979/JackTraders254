import React, { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { FiCheckCircle, FiPackage, FiPhone } from 'react-icons/fi'
import { supabase } from '../lib/supabase'

const fmt = (n) =>
  new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 0 }).format(n)

export default function OrderSuccess() {
  const [searchParams] = useSearchParams()
  const orderId = searchParams.get('orderId')
  const [order, setOrder] = useState(null)
  const [items, setItems] = useState([])

  useEffect(() => {
    if (!orderId) return
    supabase.from('orders').select('*').eq('id', orderId).single().then(({ data }) => setOrder(data))
    supabase.from('order_items').select('*').eq('order_id', orderId).then(({ data }) => setItems(data || []))
  }, [orderId])

  return (
    <div style={{ padding: '40px 16px', maxWidth: 600, margin: '0 auto' }}>
      <div className="card" style={{ textAlign: 'center', padding: '40px 28px' }}>
        <div style={{ color: 'var(--success)', fontSize: '3.5rem', marginBottom: 12 }}>
          <FiCheckCircle />
        </div>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: 8 }}>Order Placed!</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>
          Thank you for your order. We'll contact you shortly to confirm delivery details.
        </p>

        {order && (
          <div style={{
            background: 'var(--bg)',
            borderRadius: 'var(--radius)',
            padding: '20px',
            textAlign: 'left',
            marginBottom: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 10
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Order ID</span>
              <strong>#{order.id.slice(0, 8).toUpperCase()}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Name</span>
              <strong>{order.customer_name}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Delivery to</span>
              <strong>{order.delivery_address}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Total Paid</span>
              <strong style={{ color: 'var(--success)' }}>{fmt(order.total_amount)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Status</span>
              <span className="badge badge-accent" style={{ textTransform: 'capitalize' }}>{order.status}</span>
            </div>
          </div>
        )}

        <div style={{
          background: '#fffbeb',
          border: '1.5px solid #fcd34d',
          borderRadius: 'var(--radius)',
          padding: '16px',
          marginBottom: 24,
          display: 'flex',
          gap: 10,
          alignItems: 'flex-start',
          textAlign: 'left'
        }}>
          <FiPhone size={20} style={{ color: '#d97706', flexShrink: 0, marginTop: 2 }} />
          <div>
            <p style={{ fontWeight: 700, fontSize: '0.875rem', color: '#92400e' }}>Payment Pending?</p>
            <p style={{ fontSize: '0.82rem', color: '#92400e', lineHeight: 1.5 }}>
              If you haven't paid yet, send M-Pesa to Till <strong>XXXXXXX</strong> — amount{' '}
              {order && <strong>{fmt(order.total_amount)}</strong>} — reference{' '}
              <strong>#{order?.id.slice(0, 8).toUpperCase()}</strong>.
              Then WhatsApp us the screenshot.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/products" className="btn btn-primary">
            <FiPackage size={16} />
            Continue Shopping
          </Link>
          <a
            href="https://wa.me/254700000000"
            className="btn btn-outline"
            target="_blank"
            rel="noreferrer"
          >
            <FiPhone size={16} />
            WhatsApp Us
          </a>
        </div>
      </div>
    </div>
  )
}

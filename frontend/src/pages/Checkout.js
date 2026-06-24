import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { FiArrowLeft, FiPhone, FiLoader } from 'react-icons/fi'
import { supabase } from '../lib/supabase'
import { useCart } from '../context/CartContext'
import toast from 'react-hot-toast'
import './Checkout.css'

const fmt = (n) =>
  new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 0 }).format(n)

const DELIVERY_FEE = 200

export default function Checkout() {
  const { items, totalPrice, dispatch } = useCart()
  const navigate = useNavigate()
  const [step, setStep] = useState(1) // 1 = form, 2 = mpesa, 3 = waiting
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    notes: '',
  })
  const [mpesaPhone, setMpesaPhone] = useState('')
  const [orderId, setOrderId] = useState(null)
  const [loading, setLoading] = useState(false)

  const grandTotal = totalPrice + DELIVERY_FEE

  const handleFormChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  const handleFormSubmit = (e) => {
    e.preventDefault()
    if (!form.name || !form.phone || !form.address || !form.city) {
      toast.error('Please fill in all required fields')
      return
    }
    setMpesaPhone(form.phone)
    setStep(2)
  }

  const formatPhone = (phone) => {
    let p = phone.replace(/\D/g, '')
    if (p.startsWith('0')) p = '254' + p.slice(1)
    if (p.startsWith('+')) p = p.slice(1)
    if (!p.startsWith('254')) p = '254' + p
    return p
  }

  const handleMpesaPay = async () => {
    if (!mpesaPhone) {
      toast.error('Enter your M-Pesa phone number')
      return
    }
    setLoading(true)

    try {
      // 1. Create order in Supabase
      const { data: order, error: orderErr } = await supabase
        .from('orders')
        .insert({
          customer_name: form.name,
          customer_phone: form.phone,
          customer_email: form.email,
          delivery_address: `${form.address}, ${form.city}`,
          delivery_fee: DELIVERY_FEE,
          total_amount: grandTotal,
          status: 'pending',
          notes: form.notes,
        })
        .select()
        .single()

      if (orderErr) throw orderErr

      // 2. Insert order items
      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_id: item.id,
        product_name: item.name,
        product_price: item.discount_price || item.price,
        quantity: item.quantity,
      }))

      await supabase.from('order_items').insert(orderItems)

      setOrderId(order.id)

      // 3. Initiate STK Push via Supabase Edge Function
      const { data: fnData, error: fnErr } = await supabase.functions.invoke('mpesa-stk-push', {
        body: {
          phone: formatPhone(mpesaPhone),
          amount: grandTotal,
          orderId: order.id,
          reference: `JT-${order.id.slice(0, 8).toUpperCase()}`,
        },
      })

      if (fnErr) {
        // Edge function not deployed — fall back to manual payment instructions
        setStep(3)
        setLoading(false)
        return
      }

      if (fnData?.ResponseCode === '0') {
        setStep(3)
        toast.success('STK Push sent! Check your phone.')
      } else {
        throw new Error(fnData?.errorMessage || 'M-Pesa request failed')
      }
    } catch (err) {
      console.error(err)
      // If edge function not set up yet, still move forward with manual instructions
      setStep(3)
    }
    setLoading(false)
  }

  const handleManualConfirm = async () => {
    if (orderId) {
      navigate(`/order-success?orderId=${orderId}`)
      dispatch({ type: 'CLEAR' })
    }
  }

  if (items.length === 0 && step === 1) {
    return (
      <div className="checkout-page">
        <div className="container">
          <div className="empty-state">
            <p>Your cart is empty.</p>
            <Link to="/products" className="btn btn-primary">Browse Products</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="checkout-page">
      <div className="container">
        <div className="checkout-header">
          <Link to="/products" className="back-link">
            <FiArrowLeft size={16} /> Continue Shopping
          </Link>
          <h1 className="page-title">Checkout</h1>
        </div>

        <div className="checkout-layout">
          {/* Left: Steps */}
          <div className="checkout-form-col">
            {/* Step 1: Details */}
            {step === 1 && (
              <div className="card">
                <h2 className="checkout-step-title">
                  <span className="step-num">1</span>
                  Delivery Information
                </h2>
                <form onSubmit={handleFormSubmit} className="checkout-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Full Name *</label>
                      <input
                        name="name"
                        className="form-input"
                        placeholder="John Doe"
                        value={form.name}
                        onChange={handleFormChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Phone Number *</label>
                      <input
                        name="phone"
                        className="form-input"
                        placeholder="07XX XXX XXX"
                        value={form.phone}
                        onChange={handleFormChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input
                      name="email"
                      type="email"
                      className="form-input"
                      placeholder="john@example.com"
                      value={form.email}
                      onChange={handleFormChange}
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Delivery Address *</label>
                      <input
                        name="address"
                        className="form-input"
                        placeholder="Street, Estate, Building"
                        value={form.address}
                        onChange={handleFormChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">City / Town *</label>
                      <input
                        name="city"
                        className="form-input"
                        placeholder="Nairobi"
                        value={form.city}
                        onChange={handleFormChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Order Notes (optional)</label>
                    <textarea
                      name="notes"
                      className="form-input"
                      rows={3}
                      placeholder="Any special instructions..."
                      value={form.notes}
                      onChange={handleFormChange}
                      style={{ resize: 'vertical' }}
                    />
                  </div>
                  <button type="submit" className="btn btn-primary checkout-next-btn">
                    Continue to Payment
                  </button>
                </form>
              </div>
            )}

            {/* Step 2: M-Pesa */}
            {step === 2 && (
              <div className="card mpesa-card">
                <h2 className="checkout-step-title">
                  <span className="step-num">2</span>
                  Pay with M-Pesa
                </h2>

                <div className="mpesa-logo-row">
                  <div className="mpesa-logo">M-PESA</div>
                  <span className="mpesa-secure">Secure Payment</span>
                </div>

                <p className="mpesa-desc">
                  Enter your M-Pesa number below. You will receive a prompt on your phone to authorize the payment of{' '}
                  <strong>{fmt(grandTotal)}</strong>.
                </p>

                <div className="form-group mpesa-input-group">
                  <label className="form-label">M-Pesa Phone Number</label>
                  <div className="mpesa-input-wrap">
                    <FiPhone size={18} className="mpesa-phone-icon" />
                    <input
                      type="tel"
                      className="form-input mpesa-phone-input"
                      placeholder="07XX XXX XXX"
                      value={mpesaPhone}
                      onChange={(e) => setMpesaPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div className="mpesa-steps">
                  <p className="mpesa-steps-title">How it works:</p>
                  <ol>
                    <li>Enter your Safaricom M-Pesa number above</li>
                    <li>Click "Send STK Push"</li>
                    <li>You'll receive a payment prompt on your phone</li>
                    <li>Enter your M-Pesa PIN to complete payment</li>
                  </ol>
                </div>

                <div className="mpesa-actions">
                  <button
                    className="btn btn-outline"
                    onClick={() => setStep(1)}
                    disabled={loading}
                  >
                    Back
                  </button>
                  <button
                    className="btn btn-accent mpesa-pay-btn"
                    onClick={handleMpesaPay}
                    disabled={loading}
                  >
                    {loading ? (
                      <>Processing...</>
                    ) : (
                      <>Send STK Push — {fmt(grandTotal)}</>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Waiting / Confirmation */}
            {step === 3 && (
              <div className="card waiting-card">
                <div className="waiting-icon">📱</div>
                <h2>Check Your Phone</h2>
                <p>
                  An M-Pesa payment request of <strong>{fmt(grandTotal)}</strong> has been sent to{' '}
                  <strong>{mpesaPhone}</strong>.
                </p>
                <p>Enter your M-Pesa PIN on your phone to complete the payment.</p>

                <div className="manual-payment-box">
                  <p className="manual-title">Alternatively, pay manually:</p>
                  <div className="manual-detail">
                    <span>Till Number:</span>
                    <strong className="till-number">XXXXXXX</strong>
                  </div>
                  <div className="manual-detail">
                    <span>Amount:</span>
                    <strong>{fmt(grandTotal)}</strong>
                  </div>
                  <div className="manual-detail">
                    <span>Reference:</span>
                    <strong>JT-{orderId?.slice(0, 8).toUpperCase()}</strong>
                  </div>
                </div>

                <p className="waiting-note">
                  Once payment is confirmed, click below to view your order.
                </p>
                <button className="btn btn-primary" onClick={handleManualConfirm}>
                  I Have Paid — View My Order
                </button>
              </div>
            )}
          </div>

          {/* Right: Order Summary */}
          <div className="order-summary-col">
            <div className="card order-summary">
              <h2 className="summary-title">Order Summary</h2>
              <ul className="summary-items">
                {items.map((item) => (
                  <li key={item.id} className="summary-item">
                    <div className="summary-item-img">
                      {item.images?.[0] ? (
                        <img src={item.images[0]} alt={item.name} />
                      ) : (
                        <div className="summary-placeholder">{item.name[0]}</div>
                      )}
                      <span className="summary-item-qty">{item.quantity}</span>
                    </div>
                    <div className="summary-item-info">
                      <p className="summary-item-name">{item.name}</p>
                      <p className="summary-item-price">
                        {fmt((item.discount_price || item.price) * item.quantity)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="summary-totals">
                <div className="summary-row">
                  <span>Subtotal</span>
                  <span>{fmt(totalPrice)}</span>
                </div>
                <div className="summary-row">
                  <span>Delivery Fee</span>
                  <span>{fmt(DELIVERY_FEE)}</span>
                </div>
                <div className="summary-row summary-grand">
                  <span>Total</span>
                  <span className="grand-total-amount">{fmt(grandTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

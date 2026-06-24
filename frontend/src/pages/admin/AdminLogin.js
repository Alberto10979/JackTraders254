import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import './Admin.css'

export default function AdminLogin() {
  const { signIn, user, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)

  if (user && isAdmin) {
    navigate('/admin')
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await signIn(form.email, form.password)
    if (error) {
      toast.error(error.message || 'Invalid credentials')
      setLoading(false)
      return
    }
    toast.success('Welcome back!')
    navigate('/admin')
  }

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <div className="admin-login-logo">
          <span className="logo-jack">Jack</span>
          <span className="logo-traders">Traders</span>
        </div>
        <h1 className="admin-login-title">Admin Login</h1>
        <p className="admin-login-sub">Sign in to manage your store</p>

        <form onSubmit={handleSubmit} className="admin-login-form">
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              placeholder="admin@jacktraders.co.ke"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              required
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <a href="/" style={{ display: 'block', textAlign: 'center', marginTop: 16, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          ← Back to Store
        </a>
      </div>
    </div>
  )
}

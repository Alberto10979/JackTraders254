import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiEdit2, FiTrash2, FiPlus, FiStar } from 'react-icons/fi'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

const fmt = (n) =>
  new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 0 }).format(n)

export default function AdminProducts() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const fetchProducts = async () => {
    setLoading(true)
    let q = supabase.from('products').select('*').order('created_at', { ascending: false })
    if (search) q = q.ilike('name', `%${search}%`)
    const { data } = await q
    setProducts(data || [])
    setLoading(false)
  }

  useEffect(() => {
    supabase.from('categories').select('id, name').then(({ data }) => setCategories(data || []))
  }, [])

  useEffect(() => { fetchProducts() }, [search])

  const catName = (id) => categories.find((c) => c.id === id)?.name || '—'

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) { toast.error('Failed to delete product'); return }
    toast.success('Product deleted')
    fetchProducts()
  }

  const toggleFeatured = async (id, current) => {
    await supabase.from('products').update({ featured: !current }).eq('id', id)
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, featured: !current } : p)))
  }

  return (
    <div>
      <div className="admin-topbar">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="page-subtitle">Manage your product catalog</p>
        </div>
        <div className="admin-topbar-actions">
          <Link to="/admin/products/new" className="btn btn-primary">
            <FiPlus size={16} /> Add Product
          </Link>
        </div>
      </div>

      <div className="admin-table-wrap">
        <div className="admin-table-header">
          <span className="admin-table-title">{products.length} products</span>
          <input
            type="search"
            className="admin-search"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : products.length === 0 ? (
          <div className="empty-state">
            <p>No products found</p>
            <Link to="/admin/products/new" className="btn btn-primary">Add your first product</Link>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: 52 }}>IMG</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Featured</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td>
                      {p.images?.[0] ? (
                        <img src={p.images[0]} alt={p.name} className="admin-table-img" />
                      ) : (
                        <div className="admin-table-img-placeholder">{p.name[0]}</div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, maxWidth: 220 }}>{p.name}</div>
                      {p.discount_price && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--danger)' }}>
                          Sale: {fmt(p.discount_price)}
                        </div>
                      )}
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{catName(p.category_id)}</td>
                    <td style={{ fontWeight: 600, color: 'var(--success)' }}>{fmt(p.price)}</td>
                    <td>
                      <span className={
                        p.stock === 0 ? 'badge badge-danger' :
                        p.stock < 5 ? 'badge badge-accent' :
                        'badge badge-success'
                      }>
                        {p.stock === 0 ? 'Out' : p.stock}
                      </span>
                    </td>
                    <td>
                      <button
                        className="action-btn"
                        onClick={() => toggleFeatured(p.id, p.featured)}
                        style={{ color: p.featured ? 'var(--accent)' : 'var(--text-muted)' }}
                        title={p.featured ? 'Remove from featured' : 'Mark as featured'}
                      >
                        <FiStar size={15} fill={p.featured ? 'currentColor' : 'none'} />
                        {p.featured ? 'Featured' : 'Normal'}
                      </button>
                    </td>
                    <td>
                      <div className="action-btns">
                        <Link to={`/admin/products/edit/${p.id}`} className="action-btn">
                          <FiEdit2 size={13} /> Edit
                        </Link>
                        <button
                          className="action-btn danger"
                          onClick={() => handleDelete(p.id, p.name)}
                        >
                          <FiTrash2 size={13} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

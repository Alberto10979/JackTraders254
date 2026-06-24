import React, { useEffect, useState } from 'react'
import { FiPlus, FiEdit2, FiTrash2, FiCheck, FiX } from 'react-icons/fi'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

const slugify = (str) =>
  str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

export default function AdminCategories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [newCat, setNewCat] = useState({ name: '', description: '', image_url: '' })
  const [editCat, setEditCat] = useState({})

  const fetchCategories = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('categories')
      .select('*, products(count)')
      .order('name')
    setCategories(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchCategories() }, [])

  const handleAdd = async () => {
    if (!newCat.name.trim()) { toast.error('Category name is required'); return }
    const { error } = await supabase.from('categories').insert({
      name: newCat.name.trim(),
      description: newCat.description.trim(),
      image_url: newCat.image_url.trim() || null,
      slug: slugify(newCat.name),
    })
    if (error) { toast.error('Failed to add category'); return }
    toast.success('Category added')
    setNewCat({ name: '', description: '', image_url: '' })
    setShowAdd(false)
    fetchCategories()
  }

  const handleEdit = async (id) => {
    const { error } = await supabase.from('categories').update({
      name: editCat.name,
      description: editCat.description,
      image_url: editCat.image_url || null,
      slug: slugify(editCat.name),
    }).eq('id', id)
    if (error) { toast.error('Failed to update'); return }
    toast.success('Category updated')
    setEditingId(null)
    fetchCategories()
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete category "${name}"? Products in this category will be uncategorized.`)) return
    await supabase.from('categories').delete().eq('id', id)
    toast.success('Category deleted')
    fetchCategories()
  }

  return (
    <div>
      <div className="admin-topbar">
        <div>
          <h1 className="page-title">Categories</h1>
          <p className="page-subtitle">Organize your products into categories</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          <FiPlus size={16} /> Add Category
        </button>
      </div>

      {showAdd && (
        <div className="card" style={{ marginBottom: 20, maxWidth: 600 }}>
          <h3 style={{ fontWeight: 700, marginBottom: 16 }}>New Category</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Name *</label>
              <input
                className="form-input"
                placeholder="e.g. Electronics"
                value={newCat.name}
                onChange={(e) => setNewCat((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <input
                className="form-input"
                placeholder="Short description..."
                value={newCat.description}
                onChange={(e) => setNewCat((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Image URL</label>
              <input
                type="url"
                className="form-input"
                placeholder="https://..."
                value={newCat.image_url}
                onChange={(e) => setNewCat((f) => ({ ...f, image_url: e.target.value }))}
              />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-primary" onClick={handleAdd}>Add Category</button>
              <button className="btn btn-outline" onClick={() => { setShowAdd(false); setNewCat({ name: '', description: '', image_url: '' }) }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="admin-table-wrap">
        <div className="admin-table-header">
          <span className="admin-table-title">{categories.length} categories</span>
        </div>
        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : categories.length === 0 ? (
          <div className="empty-state">
            <p>No categories yet</p>
            <button className="btn btn-primary" onClick={() => setShowAdd(true)}>Add first category</button>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Slug</th>
                <th>Products</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id}>
                  <td>
                    {cat.image_url ? (
                      <img src={cat.image_url} alt={cat.name} className="admin-table-img" />
                    ) : (
                      <div className="admin-table-img-placeholder">{cat.name[0]}</div>
                    )}
                  </td>
                  <td>
                    {editingId === cat.id ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <input
                          className="form-input"
                          value={editCat.name}
                          onChange={(e) => setEditCat((f) => ({ ...f, name: e.target.value }))}
                          style={{ fontSize: '0.85rem', padding: '6px 8px' }}
                        />
                        <input
                          className="form-input"
                          value={editCat.image_url}
                          onChange={(e) => setEditCat((f) => ({ ...f, image_url: e.target.value }))}
                          placeholder="Image URL"
                          style={{ fontSize: '0.8rem', padding: '5px 8px' }}
                        />
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontWeight: 600 }}>{cat.name}</div>
                        {cat.description && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{cat.description}</div>
                        )}
                      </div>
                    )}
                  </td>
                  <td>
                    <code style={{ fontSize: '0.78rem', background: 'var(--bg)', padding: '2px 6px', borderRadius: 4 }}>
                      {cat.slug}
                    </code>
                  </td>
                  <td>
                    <span className="badge badge-muted">{cat.products?.[0]?.count ?? 0}</span>
                  </td>
                  <td>
                    {editingId === cat.id ? (
                      <div className="action-btns">
                        <button className="action-btn" onClick={() => handleEdit(cat.id)} style={{ color: 'var(--success)' }}>
                          <FiCheck size={13} /> Save
                        </button>
                        <button className="action-btn" onClick={() => setEditingId(null)}>
                          <FiX size={13} /> Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="action-btns">
                        <button
                          className="action-btn"
                          onClick={() => { setEditingId(cat.id); setEditCat({ name: cat.name, description: cat.description || '', image_url: cat.image_url || '' }) }}
                        >
                          <FiEdit2 size={13} /> Edit
                        </button>
                        <button className="action-btn danger" onClick={() => handleDelete(cat.id, cat.name)}>
                          <FiTrash2 size={13} /> Delete
                        </button>
                      </div>
                    )}
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

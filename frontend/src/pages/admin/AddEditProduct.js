import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { FiPlus, FiTrash2, FiArrowLeft, FiUpload, FiX } from 'react-icons/fi'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

const BUCKET = 'product-images'

const EMPTY = {
  name: '',
  description: '',
  price: '',
  discount_price: '',
  stock: '',
  category_id: '',
  featured: false,
  images: [],
  specifications: {},
}

export default function AddEditProduct() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  const fileInputRef = useRef(null)

  const [form, setForm] = useState(EMPTY)
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [specKey, setSpecKey] = useState('')
  const [specVal, setSpecVal] = useState('')

  useEffect(() => {
    supabase.from('categories').select('id, name').order('name').then(({ data }) => setCategories(data || []))
    if (isEdit) {
      supabase.from('products').select('*').eq('id', id).single().then(({ data }) => {
        if (data) {
          setForm({
            ...data,
            images: data.images || [],
            specifications: data.specifications || {},
          })
        }
      })
    }
  }, [id, isEdit])

  const setField = (field, value) => setForm((f) => ({ ...f, [field]: value }))

  // ── File upload ──────────────────────────────────────────────
  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return
    setUploading(true)

    const uploaded = []
    for (const file of files) {
      const ext = file.name.split('.').pop()
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      })

      if (error) {
        toast.error(`Failed to upload ${file.name}`)
        continue
      }

      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path)
      uploaded.push(urlData.publicUrl)
    }

    if (uploaded.length) {
      setField('images', [...form.images, ...uploaded])
      toast.success(`${uploaded.length} image${uploaded.length > 1 ? 's' : ''} uploaded`)
    }

    setUploading(false)
    e.target.value = ''
  }

  const removeImage = (i) => setField('images', form.images.filter((_, idx) => idx !== i))

  // ── Specs ────────────────────────────────────────────────────
  const addSpec = () => {
    if (!specKey.trim()) return
    setField('specifications', { ...form.specifications, [specKey.trim()]: specVal.trim() })
    setSpecKey('')
    setSpecVal('')
  }

  const removeSpec = (key) => {
    const s = { ...form.specifications }
    delete s[key]
    setField('specifications', s)
  }

  // ── Submit ───────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.price || !form.stock) {
      toast.error('Name, price and stock are required')
      return
    }
    setLoading(true)

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: parseFloat(form.price),
      discount_price: form.discount_price ? parseFloat(form.discount_price) : null,
      stock: parseInt(form.stock),
      category_id: form.category_id || null,
      featured: form.featured,
      images: form.images,
      specifications: form.specifications,
    }

    if (isEdit) {
      const { error } = await supabase.from('products').update(payload).eq('id', id)
      if (error) { toast.error('Failed to update product'); setLoading(false); return }
      toast.success('Product updated!')
    } else {
      const { error } = await supabase.from('products').insert(payload)
      if (error) { toast.error('Failed to add product'); setLoading(false); return }
      toast.success('Product added!')
    }
    navigate('/admin/products')
  }

  return (
    <div>
      <div className="admin-topbar">
        <div>
          <Link
            to="/admin/products"
            style={{ marginBottom: 6, display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.85rem', color: 'var(--text-muted)' }}
          >
            <FiArrowLeft size={15} /> Back to Products
          </Link>
          <h1 className="page-title">{isEdit ? 'Edit Product' : 'Add New Product'}</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="admin-form-card">
        <div className="admin-form">

          {/* Basic info */}
          <div className="form-group">
            <label className="form-label">Product Name *</label>
            <input
              className="form-input"
              placeholder="e.g. Samsung 32-inch LED TV"
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-input"
              rows={4}
              placeholder="Describe the product..."
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
              style={{ resize: 'vertical' }}
            />
          </div>

          <div className="admin-form-row">
            <div className="form-group">
              <label className="form-label">Price (KES) *</label>
              <input
                type="number"
                className="form-input"
                placeholder="0.00"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => setField('price', e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Sale Price (KES)</label>
              <input
                type="number"
                className="form-input"
                placeholder="Leave blank if no discount"
                min="0"
                step="0.01"
                value={form.discount_price}
                onChange={(e) => setField('discount_price', e.target.value)}
              />
            </div>
          </div>

          <div className="admin-form-row">
            <div className="form-group">
              <label className="form-label">Stock Quantity *</label>
              <input
                type="number"
                className="form-input"
                placeholder="0"
                min="0"
                value={form.stock}
                onChange={(e) => setField('stock', e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                className="form-select"
                value={form.category_id}
                onChange={(e) => setField('category_id', e.target.value)}
              >
                <option value="">— Select Category —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="filter-checkbox" style={{ fontSize: '0.875rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => setField('featured', e.target.checked)}
              />
              <strong>Mark as Featured</strong> — will appear on the homepage
            </label>
          </div>

          {/* Images */}
          <div className="form-group">
            <label className="form-label">Product Images</label>

            {/* Upload button */}
            <div
              style={{
                border: '2px dashed var(--border)',
                borderRadius: 'var(--radius)',
                padding: '24px',
                textAlign: 'center',
                cursor: uploading ? 'not-allowed' : 'pointer',
                background: uploading ? 'var(--bg)' : 'white',
                transition: 'border-color 0.2s',
              }}
              onClick={() => !uploading && fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                const dt = e.dataTransfer
                if (dt.files.length) {
                  const synth = { target: { files: dt.files, value: '' } }
                  handleFileChange(synth)
                }
              }}
            >
              <FiUpload size={24} style={{ color: 'var(--text-muted)', marginBottom: 8 }} />
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                {uploading ? 'Uploading...' : 'Click or drag & drop images here'}
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                JPG, PNG, WEBP — multiple files allowed
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
            </div>

            {/* Image previews */}
            {form.images.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 10, marginTop: 12 }}>
                {form.images.map((url, i) => (
                  <div key={i} style={{ position: 'relative', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border)', aspectRatio: '1', background: 'var(--bg)' }}>
                    <img
                      src={url}
                      alt={`product-${i + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => { e.target.style.display = 'none' }}
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      style={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        background: 'rgba(0,0,0,0.6)',
                        border: 'none',
                        borderRadius: '50%',
                        width: 22,
                        height: 22,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: 'white',
                      }}
                    >
                      <FiX size={12} />
                    </button>
                    {i === 0 && (
                      <span style={{
                        position: 'absolute',
                        bottom: 4,
                        left: 4,
                        background: 'var(--accent)',
                        color: 'white',
                        fontSize: '0.6rem',
                        fontWeight: 700,
                        padding: '1px 5px',
                        borderRadius: 3,
                        textTransform: 'uppercase',
                      }}>
                        Main
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6 }}>
              First image is used as the main product photo. Drag &amp; drop to reorder is coming soon.
            </p>
          </div>

          {/* Specs */}
          <div className="form-group">
            <label className="form-label">Specifications (optional)</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input
                className="form-input"
                placeholder="Key (e.g. Brand)"
                value={specKey}
                onChange={(e) => setSpecKey(e.target.value)}
                style={{ flex: 1 }}
              />
              <input
                className="form-input"
                placeholder="Value (e.g. Samsung)"
                value={specVal}
                onChange={(e) => setSpecVal(e.target.value)}
                style={{ flex: 1 }}
              />
              <button type="button" className="btn btn-primary" onClick={addSpec} style={{ padding: '10px 14px' }}>
                <FiPlus size={16} />
              </button>
            </div>
            {Object.entries(form.specifications).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg)', padding: '6px 10px', borderRadius: 4, fontSize: '0.85rem' }}>
                <span style={{ fontWeight: 600, minWidth: 100 }}>{k}</span>
                <span style={{ flex: 1 }}>{v}</span>
                <button type="button" className="action-btn danger" onClick={() => removeSpec(k)}>
                  <FiTrash2 size={12} />
                </button>
              </div>
            ))}
          </div>

          <div className="admin-form-actions">
            <button type="submit" className="btn btn-primary" disabled={loading || uploading}>
              {loading ? 'Saving...' : isEdit ? 'Update Product' : 'Add Product'}
            </button>
            <Link to="/admin/products" className="btn btn-outline">Cancel</Link>
          </div>

        </div>
      </form>
    </div>
  )
}

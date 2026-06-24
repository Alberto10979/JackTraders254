import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { FiShoppingCart, FiArrowLeft, FiPlus, FiMinus, FiShare2, FiCheck } from 'react-icons/fi'
import { supabase } from '../lib/supabase'
import { useCart } from '../context/CartContext'
import ProductCard from '../components/ProductCard'
import toast from 'react-hot-toast'
import './ProductDetail.css'

const fmt = (n) =>
  new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 0 }).format(n)

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { dispatch } = useCart()
  const [product, setProduct] = useState(null)
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeImg, setActiveImg] = useState(0)
  const [qty, setQty] = useState(1)
  const [category, setCategory] = useState(null)

  useEffect(() => {
    setLoading(true)
    supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single()
      .then(async ({ data }) => {
        if (!data) { navigate('/products'); return }
        setProduct(data)
        setActiveImg(0)
        setQty(1)

        if (data.category_id) {
          const { data: cat } = await supabase
            .from('categories')
            .select('id, name, slug')
            .eq('id', data.category_id)
            .single()
          setCategory(cat)

          const { data: rel } = await supabase
            .from('products')
            .select('*')
            .eq('category_id', data.category_id)
            .neq('id', id)
            .limit(4)
          setRelated(rel || [])
        }
        setLoading(false)
      })
  }, [id, navigate])

  if (loading) return <div className="loading-center" style={{ minHeight: 400 }}><div className="spinner" /></div>
  if (!product) return null

  const { name, description, price, discount_price, images, stock, specifications } = product
  const hasDiscount = discount_price && discount_price < price
  const displayPrice = hasDiscount ? discount_price : price
  const pct = hasDiscount ? Math.round(((price - discount_price) / price) * 100) : 0

  const addToCart = () => {
    for (let i = 0; i < qty; i++) {
      dispatch({ type: 'ADD_ITEM', payload: product })
    }
    dispatch({ type: 'OPEN_DRAWER' })
    toast.success(`${name} added to cart`)
  }

  const specs = specifications && typeof specifications === 'object' ? Object.entries(specifications) : []

  return (
    <div className="product-detail">
      <div className="container">
        {/* Breadcrumb */}
        <nav className="breadcrumb">
          <Link to="/">Home</Link>
          <span>/</span>
          <Link to="/products">Products</Link>
          {category && (
            <>
              <span>/</span>
              <Link to={`/products?category=${category.slug}`}>{category.name}</Link>
            </>
          )}
          <span>/</span>
          <span className="breadcrumb-current">{name}</span>
        </nav>

        <div className="detail-layout">
          {/* Images */}
          <div className="detail-images">
            <div className="main-img-wrap">
              {images && images[activeImg] ? (
                <img src={images[activeImg]} alt={name} className="main-img" />
              ) : (
                <div className="main-img-placeholder">
                  <span>{name[0]}</span>
                </div>
              )}
              {hasDiscount && <span className="detail-discount-badge">-{pct}% OFF</span>}
            </div>
            {images && images.length > 1 && (
              <div className="thumbnails">
                {images.map((src, i) => (
                  <button
                    key={i}
                    className={`thumb ${i === activeImg ? 'active' : ''}`}
                    onClick={() => setActiveImg(i)}
                  >
                    <img src={src} alt={`${name} ${i + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="detail-info">
            {category && (
              <Link to={`/products?category=${category.slug}`} className="detail-category-tag">
                {category.name}
              </Link>
            )}
            <h1 className="detail-name">{name}</h1>

            <div className="detail-price-row">
              <span className="detail-price">{fmt(displayPrice)}</span>
              {hasDiscount && (
                <span className="detail-original">{fmt(price)}</span>
              )}
              {hasDiscount && (
                <span className="badge badge-danger">Save {pct}%</span>
              )}
            </div>

            <div className={`detail-stock ${stock === 0 ? 'oos' : stock < 5 ? 'low' : ''}`}>
              {stock === 0 ? (
                <span>Out of Stock</span>
              ) : stock < 5 ? (
                <span><FiCheck size={14} /> Only {stock} left in stock!</span>
              ) : (
                <span><FiCheck size={14} /> In Stock</span>
              )}
            </div>

            {description && (
              <div className="detail-description">
                <p>{description}</p>
              </div>
            )}

            {stock > 0 && (
              <div className="detail-add-row">
                <div className="qty-selector">
                  <button onClick={() => setQty(Math.max(1, qty - 1))}><FiMinus size={14} /></button>
                  <span>{qty}</span>
                  <button onClick={() => setQty(Math.min(stock, qty + 1))}><FiPlus size={14} /></button>
                </div>
                <button className="btn btn-primary add-to-cart-btn" onClick={addToCart}>
                  <FiShoppingCart size={18} />
                  Add to Cart
                </button>
              </div>
            )}

            <div className="detail-meta">
              <div className="detail-meta-row">
                <span className="meta-label">Availability</span>
                <span className={stock > 0 ? 'meta-green' : 'meta-red'}>
                  {stock > 0 ? 'In Stock' : 'Out of Stock'}
                </span>
              </div>
              {category && (
                <div className="detail-meta-row">
                  <span className="meta-label">Category</span>
                  <Link to={`/products?category=${category.slug}`} className="meta-link">
                    {category.name}
                  </Link>
                </div>
              )}
            </div>

            {specs.length > 0 && (
              <div className="detail-specs">
                <h3 className="specs-title">Specifications</h3>
                <table className="specs-table">
                  <tbody>
                    {specs.map(([key, val]) => (
                      <tr key={key}>
                        <td className="spec-key">{key}</td>
                        <td className="spec-val">{val}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <section className="related-section">
            <h2 className="section-title" style={{ marginBottom: 20 }}>Related Products</h2>
            <div className="related-grid">
              {related.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

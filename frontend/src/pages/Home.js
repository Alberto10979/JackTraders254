import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FiArrowRight, FiTruck, FiShield, FiPhone, FiTag } from 'react-icons/fi'
import { supabase } from '../lib/supabase'
import ProductCard from '../components/ProductCard'
import './Home.css'

export default function Home() {
  const [categories, setCategories] = useState([])
  const [featured, setFeatured] = useState([])
  const [latest, setLatest] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchAll = async () => {
      const [catRes, featRes, latestRes] = await Promise.all([
        supabase.from('categories').select('*').order('name').limit(8),
        supabase.from('products').select('*').eq('featured', true).gt('stock', 0).limit(8),
        supabase.from('products').select('*').gt('stock', 0).order('created_at', { ascending: false }).limit(8),
      ])
      setCategories(catRes.data || [])
      setFeatured(featRes.data || [])
      setLatest(latestRes.data || [])
      setLoading(false)
    }
    fetchAll()
  }, [])

  return (
    <div className="home">
      {/* Hero */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-eyebrow">Welcome to JackTraders</div>
          <h1 className="hero-title">
            Quality Products<br />
            <span>Delivered to Your Door</span>
          </h1>
          <p className="hero-sub">
            Shop the best deals across multiple categories. Secure M-Pesa payments. Fast delivery across Kenya.
          </p>
          <div className="hero-actions">
            <button className="btn btn-accent hero-cta" onClick={() => navigate('/products')}>
              Shop Now <FiArrowRight size={18} />
            </button>
            <button className="btn hero-cta-outline" onClick={() => navigate('/products?featured=true')}>
              View Deals
            </button>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-blob" />
          <div className="hero-card hero-card-1">
            <FiTag size={24} />
            <div>
              <div className="hero-card-title">Best Deals</div>
              <div className="hero-card-sub">Updated daily</div>
            </div>
          </div>
          <div className="hero-card hero-card-2">
            <FiTruck size={24} />
            <div>
              <div className="hero-card-title">Fast Delivery</div>
              <div className="hero-card-sub">Across Kenya</div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <section className="trust-bar">
        <div className="container trust-grid">
          {[
            { icon: <FiTruck size={22} />, title: 'Fast Delivery', sub: 'Countrywide shipping' },
            { icon: <FiShield size={22} />, title: 'Secure Payment', sub: 'M-Pesa STK Push' },
            { icon: <FiPhone size={22} />, title: '24/7 Support', sub: 'Call or WhatsApp' },
            { icon: <FiTag size={22} />, title: 'Best Prices', sub: 'Guaranteed quality' },
          ].map((b) => (
            <div key={b.title} className="trust-item">
              <div className="trust-icon">{b.icon}</div>
              <div>
                <div className="trust-title">{b.title}</div>
                <div className="trust-sub">{b.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="home-section">
          <div className="container">
            <div className="section-header">
              <div>
                <h2 className="section-title">Shop by Category</h2>
                <p className="section-sub">Browse all product categories</p>
              </div>
              <Link to="/products" className="section-link">
                View All <FiArrowRight size={15} />
              </Link>
            </div>
            <div className="categories-grid">
              {categories.map((cat) => (
                <Link key={cat.id} to={`/products?category=${cat.slug}`} className="category-card">
                  <div
                    className="category-card-img"
                    style={{ backgroundImage: cat.image_url ? `url(${cat.image_url})` : undefined }}
                  >
                    {!cat.image_url && (
                      <span className="category-initial">{cat.name[0]}</span>
                    )}
                  </div>
                  <div className="category-card-name">{cat.name}</div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      {!loading && featured.length > 0 && (
        <section className="home-section bg-light">
          <div className="container">
            <div className="section-header">
              <div>
                <h2 className="section-title">Featured Products</h2>
                <p className="section-sub">Hand-picked selections just for you</p>
              </div>
              <Link to="/products?featured=true" className="section-link">
                See All <FiArrowRight size={15} />
              </Link>
            </div>
            <div className="products-grid">
              {featured.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* Latest Products */}
      {!loading && latest.length > 0 && (
        <section className="home-section">
          <div className="container">
            <div className="section-header">
              <div>
                <h2 className="section-title">New Arrivals</h2>
                <p className="section-sub">Fresh stock just added</p>
              </div>
              <Link to="/products" className="section-link">
                View All <FiArrowRight size={15} />
              </Link>
            </div>
            <div className="products-grid">
              {latest.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </section>
      )}

      {loading && (
        <div className="loading-center" style={{ minHeight: 300 }}>
          <div className="spinner" />
        </div>
      )}

      {/* CTA Banner */}
      <section className="cta-banner">
        <div className="container cta-inner">
          <div>
            <h2 className="cta-title">Need Help Placing an Order?</h2>
            <p className="cta-sub">Call or WhatsApp us directly and we'll assist you.</p>
          </div>
          <a href="https://wa.me/254712648143" className="btn btn-accent" target="_blank" rel="noreferrer">
            <FiPhone size={16} />
            WhatsApp Us
          </a>
        </div>
      </section>
    </div>
  )
}

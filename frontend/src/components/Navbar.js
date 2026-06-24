import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { FiSearch, FiShoppingCart, FiUser, FiMenu, FiX, FiPhone } from 'react-icons/fi'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import './Navbar.css'

export default function Navbar() {
  const { totalItems, dispatch } = useCart()
  const { user, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('search') || '')
  const [categories, setCategories] = useState([])
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef(null)

  useEffect(() => {
    supabase.from('categories').select('id, name, slug').order('name').then(({ data }) => {
      if (data) setCategories(data)
    })
  }, [])

  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    if (query.trim()) {
      navigate(`/products?search=${encodeURIComponent(query.trim())}`)
      setMobileOpen(false)
    }
  }

  return (
    <header className="navbar-wrapper">
      {/* Top bar */}
      <div className="navbar-topbar">
        <div className="container topbar-inner">
          <span className="topbar-contact">
            <FiPhone size={13} />
            <a href="tel:+254712648143">+254 712 648 143</a>
          </span>
          <span className="topbar-tagline">Quality Products | Fast Delivery Across Kenya</span>
        </div>
      </div>

      {/* Main nav */}
      <nav className="navbar-main">
        <div className="container navbar-inner">
          <Link to="/" className="navbar-logo">
            <span className="logo-jack">Jack</span>
            <span className="logo-traders">Traders</span>
          </Link>

          <form className="navbar-search" onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Search products..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="search-btn">
              <FiSearch size={18} />
            </button>
          </form>

          <div className="navbar-actions">
            {user && (
              <div className="user-menu-wrapper" ref={userMenuRef}>
                <button
                  className="navbar-icon-btn"
                  onClick={() => setUserMenuOpen((v) => !v)}
                  title="Account"
                >
                  <FiUser size={20} />
                  {isAdmin && <span className="admin-dot" />}
                </button>
                {userMenuOpen && (
                  <div className="user-dropdown">
                    <div className="user-dropdown-email">{user.email}</div>
                    {isAdmin && (
                      <Link to="/admin" className="user-dropdown-item" onClick={() => setUserMenuOpen(false)}>
                        Admin Panel
                      </Link>
                    )}
                  </div>
                )}
              </div>
            )}
            {!user && (
              <Link to="/admin/login" className="navbar-icon-btn" title="Admin Login">
                <FiUser size={20} />
              </Link>
            )}

            <button
              className="navbar-icon-btn cart-btn"
              onClick={() => dispatch({ type: 'TOGGLE_DRAWER' })}
              title="Cart"
            >
              <FiShoppingCart size={20} />
              {totalItems > 0 && (
                <span className="cart-count">{totalItems}</span>
              )}
            </button>

            <button
              className="mobile-menu-btn"
              onClick={() => setMobileOpen((v) => !v)}
            >
              {mobileOpen ? <FiX size={22} /> : <FiMenu size={22} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Category bar */}
      <div className="navbar-catbar">
        <div className="container catbar-inner">
          <Link
            to="/products"
            className="catbar-link"
            onClick={() => setMobileOpen(false)}
          >
            All Products
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/products?category=${cat.slug}`}
              className="catbar-link"
              onClick={() => setMobileOpen(false)}
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="mobile-menu">
          <form className="mobile-search" onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Search products..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="search-btn">
              <FiSearch size={18} />
            </button>
          </form>
          <div className="mobile-links">
            <Link to="/products" className="mobile-link" onClick={() => setMobileOpen(false)}>
              All Products
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/products?category=${cat.slug}`}
                className="mobile-link"
                onClick={() => setMobileOpen(false)}
              >
                {cat.name}
              </Link>
            ))}
            {isAdmin && (
              <Link to="/admin" className="mobile-link admin-link" onClick={() => setMobileOpen(false)}>
                Admin Panel
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  )
}

import React, { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FiFilter, FiX, FiChevronDown } from 'react-icons/fi'
import { supabase } from '../lib/supabase'
import ProductCard from '../components/ProductCard'
import './Products.css'

const SORT_OPTIONS = [
  { label: 'Newest First', value: 'created_at:desc' },
  { label: 'Price: Low to High', value: 'price:asc' },
  { label: 'Price: High to Low', value: 'price:desc' },
  { label: 'Name A–Z', value: 'name:asc' },
]

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [filterOpen, setFilterOpen] = useState(false)
  const [maxPrice, setMaxPrice] = useState(100000)

  const search = searchParams.get('search') || ''
  const categorySlug = searchParams.get('category') || ''
  const featured = searchParams.get('featured') === 'true'
  const sort = searchParams.get('sort') || 'created_at:desc'
  const minP = parseInt(searchParams.get('minPrice') || '0')
  const maxP = parseInt(searchParams.get('maxPrice') || '999999')
  const page = parseInt(searchParams.get('page') || '1')
  const PAGE_SIZE = 16

  useEffect(() => {
    supabase.from('categories').select('id, name, slug').order('name').then(({ data }) => {
      setCategories(data || [])
    })
  }, [])

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    const [sortCol, sortDir] = sort.split(':')
    let query = supabase
      .from('products')
      .select('*', { count: 'exact' })
      .order(sortCol, { ascending: sortDir === 'asc' })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

    if (search) query = query.ilike('name', `%${search}%`)
    if (featured) query = query.eq('featured', true)
    if (categorySlug) {
      const { data: cat } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', categorySlug)
        .single()
      if (cat) query = query.eq('category_id', cat.id)
    }
    if (minP > 0) query = query.gte('price', minP)
    if (maxP < 999999) query = query.lte('price', maxP)

    const { data, count } = await query
    setProducts(data || [])
    setTotal(count || 0)
    setLoading(false)
  }, [search, categorySlug, featured, sort, minP, maxP, page])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  const setParam = (key, value) => {
    const p = new URLSearchParams(searchParams)
    if (value) p.set(key, value)
    else p.delete(key)
    p.delete('page')
    setSearchParams(p)
  }

  const clearFilters = () => {
    setSearchParams({})
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const hasFilters = search || categorySlug || featured || minP > 0 || maxP < 999999

  return (
    <div className="products-page">
      <div className="container products-layout">
        {/* Sidebar */}
        <aside className={`filter-sidebar ${filterOpen ? 'open' : ''}`}>
          <div className="sidebar-header">
            <span className="sidebar-title">Filters</span>
            {hasFilters && (
              <button className="clear-filters-btn" onClick={clearFilters}>
                Clear All
              </button>
            )}
            <button className="sidebar-close" onClick={() => setFilterOpen(false)}>
              <FiX size={18} />
            </button>
          </div>

          {/* Category */}
          <div className="filter-group">
            <div className="filter-group-title">Category</div>
            <ul className="filter-list">
              <li>
                <label className="filter-radio">
                  <input
                    type="radio"
                    name="cat"
                    checked={!categorySlug}
                    onChange={() => setParam('category', '')}
                  />
                  All Categories
                </label>
              </li>
              {categories.map((cat) => (
                <li key={cat.id}>
                  <label className="filter-radio">
                    <input
                      type="radio"
                      name="cat"
                      checked={categorySlug === cat.slug}
                      onChange={() => setParam('category', cat.slug)}
                    />
                    {cat.name}
                  </label>
                </li>
              ))}
            </ul>
          </div>

          {/* Price */}
          <div className="filter-group">
            <div className="filter-group-title">Price Range (KES)</div>
            <div className="price-inputs">
              <input
                type="number"
                placeholder="Min"
                className="form-input price-input"
                value={minP || ''}
                onChange={(e) => setParam('minPrice', e.target.value)}
              />
              <span>—</span>
              <input
                type="number"
                placeholder="Max"
                className="form-input price-input"
                value={maxP < 999999 ? maxP : ''}
                onChange={(e) => setParam('maxPrice', e.target.value || '999999')}
              />
            </div>
          </div>

          {/* Featured */}
          <div className="filter-group">
            <label className="filter-checkbox">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setParam('featured', e.target.checked ? 'true' : '')}
              />
              Featured Products Only
            </label>
          </div>
        </aside>

        {/* Main */}
        <main className="products-main">
          {/* Toolbar */}
          <div className="products-toolbar">
            <div className="toolbar-left">
              <button className="mobile-filter-btn" onClick={() => setFilterOpen(true)}>
                <FiFilter size={16} />
                Filters
              </button>
              <span className="products-count">
                {loading ? '...' : `${total} product${total !== 1 ? 's' : ''}`}
                {search && ` for "${search}"`}
                {categorySlug && !search && ` in ${categories.find(c => c.slug === categorySlug)?.name || categorySlug}`}
              </span>
            </div>
            <div className="sort-wrapper">
              <select
                className="form-select sort-select"
                value={sort}
                onChange={(e) => setParam('sort', e.target.value)}
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tags */}
          {hasFilters && (
            <div className="active-filters">
              {search && (
                <span className="filter-tag">
                  Search: "{search}"
                  <button onClick={() => setParam('search', '')}><FiX size={12} /></button>
                </span>
              )}
              {categorySlug && (
                <span className="filter-tag">
                  {categories.find(c => c.slug === categorySlug)?.name || categorySlug}
                  <button onClick={() => setParam('category', '')}><FiX size={12} /></button>
                </span>
              )}
              {featured && (
                <span className="filter-tag">
                  Featured
                  <button onClick={() => setParam('featured', '')}><FiX size={12} /></button>
                </span>
              )}
            </div>
          )}

          {/* Grid */}
          {loading ? (
            <div className="loading-center">
              <div className="spinner" />
            </div>
          ) : products.length === 0 ? (
            <div className="empty-state">
              <FiFilter size={48} />
              <p>No products found</p>
              <button className="btn btn-primary" onClick={clearFilters}>
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="products-grid-main">
              {products.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="page-btn"
                disabled={page === 1}
                onClick={() => setParam('page', String(page - 1))}
              >
                Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                .reduce((acc, p, i, arr) => {
                  if (i > 0 && p - arr[i - 1] > 1) acc.push('...')
                  acc.push(p)
                  return acc
                }, [])
                .map((p, i) =>
                  p === '...' ? (
                    <span key={i} className="page-dots">…</span>
                  ) : (
                    <button
                      key={p}
                      className={`page-btn ${p === page ? 'active' : ''}`}
                      onClick={() => setParam('page', String(p))}
                    >
                      {p}
                    </button>
                  )
                )}
              <button
                className="page-btn"
                disabled={page === totalPages}
                onClick={() => setParam('page', String(page + 1))}
              >
                Next
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

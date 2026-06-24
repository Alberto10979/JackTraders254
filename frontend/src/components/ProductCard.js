import React from 'react'
import { Link } from 'react-router-dom'
import { FiShoppingCart, FiEye } from 'react-icons/fi'
import { useCart } from '../context/CartContext'
import toast from 'react-hot-toast'
import './ProductCard.css'

const fmt = (n) =>
  new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 0 }).format(n)

export default function ProductCard({ product }) {
  const { dispatch } = useCart()
  const { id, name, price, discount_price, images, stock } = product
  const mainImage = images?.[0] || null
  const hasDiscount = discount_price && discount_price < price
  const pct = hasDiscount ? Math.round(((price - discount_price) / price) * 100) : 0
  const outOfStock = stock === 0

  const addToCart = (e) => {
    e.preventDefault()
    if (outOfStock) return
    dispatch({ type: 'ADD_ITEM', payload: product })
    dispatch({ type: 'OPEN_DRAWER' })
    toast.success(`${name} added to cart`)
  }

  return (
    <div className={`product-card ${outOfStock ? 'out-of-stock' : ''}`}>
      <Link to={`/products/${id}`} className="product-card-img-link">
        {hasDiscount && <span className="discount-badge">-{pct}%</span>}
        {outOfStock && <span className="oos-badge">Out of Stock</span>}
        {mainImage ? (
          <img src={mainImage} alt={name} className="product-card-img" loading="lazy" />
        ) : (
          <div className="product-card-placeholder">
            <span>{name[0]}</span>
          </div>
        )}
        <div className="product-card-overlay">
          <FiEye size={18} />
          <span>View Product</span>
        </div>
      </Link>

      <div className="product-card-body">
        <Link to={`/products/${id}`} className="product-card-name">
          {name}
        </Link>
        <div className="product-card-price-row">
          <span className="product-card-price">
            {fmt(hasDiscount ? discount_price : price)}
          </span>
          {hasDiscount && (
            <span className="product-card-original">{fmt(price)}</span>
          )}
        </div>
        <button
          className={`product-card-atc ${outOfStock ? 'disabled' : ''}`}
          onClick={addToCart}
          disabled={outOfStock}
        >
          <FiShoppingCart size={15} />
          {outOfStock ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
    </div>
  )
}

import React from 'react'
import { Link } from 'react-router-dom'
import { FiX, FiTrash2, FiPlus, FiMinus, FiShoppingBag } from 'react-icons/fi'
import { useCart } from '../context/CartContext'
import './CartDrawer.css'

const fmt = (n) =>
  new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 0 }).format(n)

export default function CartDrawer() {
  const { items, isOpen, dispatch, totalPrice, totalItems } = useCart()

  return (
    <>
      {isOpen && (
        <div className="drawer-backdrop" onClick={() => dispatch({ type: 'CLOSE_DRAWER' })} />
      )}
      <div className={`cart-drawer ${isOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <div className="drawer-title">
            <FiShoppingBag size={20} />
            <span>Cart ({totalItems})</span>
          </div>
          <button className="drawer-close" onClick={() => dispatch({ type: 'CLOSE_DRAWER' })}>
            <FiX size={22} />
          </button>
        </div>

        <div className="drawer-body">
          {items.length === 0 ? (
            <div className="drawer-empty">
              <FiShoppingBag size={48} />
              <p>Your cart is empty</p>
              <button
                className="btn btn-primary"
                onClick={() => dispatch({ type: 'CLOSE_DRAWER' })}
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <ul className="drawer-items">
              {items.map((item) => {
                const unitPrice = item.discount_price || item.price
                return (
                  <li key={item.id} className="drawer-item">
                    <div className="drawer-item-img">
                      {item.images?.[0] ? (
                        <img src={item.images[0]} alt={item.name} />
                      ) : (
                        <div className="drawer-img-placeholder">{item.name[0]}</div>
                      )}
                    </div>
                    <div className="drawer-item-info">
                      <p className="drawer-item-name">{item.name}</p>
                      <p className="drawer-item-price">{fmt(unitPrice)}</p>
                      <div className="drawer-qty-row">
                        <div className="qty-control">
                          <button
                            onClick={() =>
                              dispatch({ type: 'UPDATE_QTY', payload: { id: item.id, qty: item.quantity - 1 } })
                            }
                          >
                            <FiMinus size={12} />
                          </button>
                          <span>{item.quantity}</span>
                          <button
                            onClick={() =>
                              dispatch({ type: 'UPDATE_QTY', payload: { id: item.id, qty: item.quantity + 1 } })
                            }
                          >
                            <FiPlus size={12} />
                          </button>
                        </div>
                        <span className="drawer-item-subtotal">{fmt(unitPrice * item.quantity)}</span>
                        <button
                          className="drawer-remove"
                          onClick={() => dispatch({ type: 'REMOVE_ITEM', payload: item.id })}
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="drawer-footer">
            <div className="drawer-total">
              <span>Total</span>
              <span className="drawer-total-price">{fmt(totalPrice)}</span>
            </div>
            <Link
              to="/checkout"
              className="btn btn-accent checkout-btn"
              onClick={() => dispatch({ type: 'CLOSE_DRAWER' })}
            >
              Proceed to Checkout
            </Link>
            <button
              className="clear-cart-btn"
              onClick={() => dispatch({ type: 'CLEAR' })}
            >
              Clear Cart
            </button>
          </div>
        )}
      </div>
    </>
  )
}

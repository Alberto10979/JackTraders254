import React, { createContext, useContext, useReducer, useEffect } from 'react'

const CartContext = createContext()

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.items.find(i => i.id === action.payload.id)
      if (existing) {
        return {
          ...state,
          items: state.items.map(i =>
            i.id === action.payload.id
              ? { ...i, quantity: i.quantity + 1 }
              : i
          ),
        }
      }
      return { ...state, items: [...state.items, { ...action.payload, quantity: 1 }] }
    }
    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter(i => i.id !== action.payload) }
    case 'UPDATE_QTY':
      if (action.payload.qty < 1) {
        return { ...state, items: state.items.filter(i => i.id !== action.payload.id) }
      }
      return {
        ...state,
        items: state.items.map(i =>
          i.id === action.payload.id ? { ...i, quantity: action.payload.qty } : i
        ),
      }
    case 'CLEAR':
      return { ...state, items: [] }
    case 'TOGGLE_DRAWER':
      return { ...state, isOpen: !state.isOpen }
    case 'OPEN_DRAWER':
      return { ...state, isOpen: true }
    case 'CLOSE_DRAWER':
      return { ...state, isOpen: false }
    default:
      return state
  }
}

const loadCart = () => {
  try {
    const saved = localStorage.getItem('jacktraders_cart')
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, {
    items: loadCart(),
    isOpen: false,
  })

  useEffect(() => {
    localStorage.setItem('jacktraders_cart', JSON.stringify(state.items))
  }, [state.items])

  const totalItems = state.items.reduce((s, i) => s + i.quantity, 0)
  const totalPrice = state.items.reduce(
    (s, i) => s + (i.discount_price || i.price) * i.quantity,
    0
  )

  return (
    <CartContext.Provider value={{ ...state, dispatch, totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)

import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { CartProvider } from './context/CartContext'
import { AuthProvider, useAuth } from './context/AuthContext'

import Navbar from './components/Navbar'
import Footer from './components/Footer'
import CartDrawer from './components/CartDrawer'

import Home from './pages/Home'
import Products from './pages/Products'
import ProductDetail from './pages/ProductDetail'
import Checkout from './pages/Checkout'
import OrderSuccess from './pages/OrderSuccess'

import AdminLogin from './pages/admin/AdminLogin'
import AdminLayout from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminProducts from './pages/admin/AdminProducts'
import AddEditProduct from './pages/admin/AddEditProduct'
import AdminCategories from './pages/admin/AdminCategories'
import AdminOrders from './pages/admin/AdminOrders'

import './App.css'

function AdminRoute({ children }) {
  const { user, isAdmin, loading } = useAuth()
  if (loading) return <div className="loading-center"><div className="spinner" /></div>
  if (!user || !isAdmin) return <Navigate to="/admin/login" replace />
  return children
}

function StoreLayout({ children }) {
  return (
    <>
      <Navbar />
      <CartDrawer />
      <main style={{ minHeight: 'calc(100vh - var(--nav-height) - 200px)' }}>
        {children}
      </main>
      <Footer />
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
          <Routes>
            {/* Store */}
            <Route path="/" element={<StoreLayout><Home /></StoreLayout>} />
            <Route path="/products" element={<StoreLayout><Products /></StoreLayout>} />
            <Route path="/products/:id" element={<StoreLayout><ProductDetail /></StoreLayout>} />
            <Route path="/checkout" element={<StoreLayout><Checkout /></StoreLayout>} />
            <Route path="/order-success" element={<StoreLayout><OrderSuccess /></StoreLayout>} />

            {/* Admin */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
              <Route index element={<AdminDashboard />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="products/new" element={<AddEditProduct />} />
              <Route path="products/edit/:id" element={<AddEditProduct />} />
              <Route path="categories" element={<AdminCategories />} />
              <Route path="orders" element={<AdminOrders />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

import React from 'react'
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom'
import {
  FiGrid,
  FiPackage,
  FiTag,
  FiShoppingBag,
  FiLogOut,
  FiExternalLink,
} from 'react-icons/fi'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import './Admin.css'

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: <FiGrid size={17} />, end: true },
  { to: '/admin/products', label: 'Products', icon: <FiPackage size={17} /> },
  { to: '/admin/categories', label: 'Categories', icon: <FiTag size={17} /> },
  { to: '/admin/orders', label: 'Orders', icon: <FiShoppingBag size={17} /> },
]

export default function AdminLayout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    toast.success('Signed out')
    navigate('/admin/login')
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-logo">
          <span className="logo-jack" style={{ color: 'white' }}>Jack</span>
          <span className="logo-traders">Traders</span>
        </div>

        <div className="admin-sidebar-label">Store Management</div>

        {NAV.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            className={({ isActive }) => `admin-nav-link${isActive ? ' active' : ''}`}
          >
            {n.icon}
            {n.label}
          </NavLink>
        ))}

        <div className="admin-sidebar-footer">
          <Link
            to="/"
            target="_blank"
            className="admin-nav-link"
            style={{ padding: '8px 12px', gap: 8 }}
          >
            <FiExternalLink size={15} />
            View Store
          </Link>
          <div className="admin-sidebar-user">{user?.email}</div>
          <button className="admin-sign-out" onClick={handleSignOut}>
            <FiLogOut size={14} />
            Sign Out
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  )
}

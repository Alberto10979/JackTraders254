import React from 'react'
import { Link } from 'react-router-dom'
import { FiPhone, FiMail, FiMapPin } from 'react-icons/fi'
import { FaWhatsapp, FaFacebook, FaInstagram } from 'react-icons/fa'
import './Footer.css'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <div className="footer-logo">
            <span className="logo-jack">Jack</span>
            <span className="logo-traders">Traders</span>
          </div>
          <p className="footer-tagline">
            Your trusted source for quality products. We deliver across Kenya with speed and care.
          </p>
          <div className="footer-social">
            <a href="https://wa.me/254700000000" target="_blank" rel="noreferrer" className="social-btn whatsapp">
              <FaWhatsapp size={18} />
            </a>
            <a href="https://facebook.com" target="_blank" rel="noreferrer" className="social-btn facebook">
              <FaFacebook size={18} />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="social-btn instagram">
              <FaInstagram size={18} />
            </a>
          </div>
        </div>

        <div className="footer-col">
          <h4 className="footer-heading">Quick Links</h4>
          <ul className="footer-links">
            <li><Link to="/">Home</Link></li>
            <li><Link to="/products">All Products</Link></li>
            <li><Link to="/checkout">Checkout</Link></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4 className="footer-heading">Contact Us</h4>
          <ul className="footer-contact-list">
            <li>
              <FiPhone size={14} />
              <a href="tel:+254700000000">+254 700 000 000</a>
            </li>
            <li>
              <FiMail size={14} />
              <a href="mailto:info@jacktraders.co.ke">info@jacktraders.co.ke</a>
            </li>
            <li>
              <FiMapPin size={14} />
              <span>Nairobi, Kenya</span>
            </li>
          </ul>
        </div>

        <div className="footer-col">
          <h4 className="footer-heading">Payment Methods</h4>
          <div className="payment-badges">
            <div className="payment-badge mpesa">M-PESA</div>
            <p className="payment-note">Secure payments via Safaricom M-Pesa STK Push to our till number.</p>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container footer-bottom-inner">
          <span>&copy; {new Date().getFullYear()} JackTraders. All rights reserved.</span>
          <span>Powered by M-Pesa Payments</span>
        </div>
      </div>
    </footer>
  )
}

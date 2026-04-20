"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import SiteLogo from "./SiteLogo";

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const handleCartUpdate = (e: any) => {
      setCartCount(e.detail?.count || 0);
    };
    window.addEventListener('cart-updated', handleCartUpdate);
    const saved = localStorage.getItem('lyka_cart');
    if (saved) {
      try { setCartCount(JSON.parse(saved).length); } catch (e) {}
    }
    return () => window.removeEventListener('cart-updated', handleCartUpdate);
  }, []);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  return (
    <>
      {/* Announcement Bar */}
      <div className="announcement-bar">
        <div className="announcement-content">
          ✦ Free delivery on orders above NPR 5,000 &nbsp;&nbsp;&nbsp; ✦ New arrivals — Shop the latest collection &nbsp;&nbsp;&nbsp; ✦ Premium Women's Fashion in Imadole, Lalitpur &nbsp;&nbsp;&nbsp;
        </div>
      </div>

      <header className={`main-header ${isScrolled ? "scrolled" : ""}`}>
        <div className="container header-content">
          
          {/* Mobile Toggle (Left) */}
          <button
            className={`menu-toggle mobile-only ${isOpen ? "open" : ""}`}
            onClick={toggleMenu}
            aria-label="Toggle Menu"
            style={{ width: "30px", background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", gap: "5px" }}
          >
            <span style={{ width: "24px", height: "2px", background: "#000", transition: "0.3s", transform: isOpen ? "rotate(45deg) translate(5px, 5px)" : "" }}></span>
            <span style={{ width: "24px", height: "2px", background: "#000", transition: "0.3s", opacity: isOpen ? 0 : 1 }}></span>
            <span style={{ width: "24px", height: "2px", background: "#000", transition: "0.3s", transform: isOpen ? "rotate(-45deg) translate(5px, -5px)" : "" }}></span>
          </button>

          {/* Logo (Center) */}
          <div className="logo-container">
            <SiteLogo />
          </div>

          {/* Desktop Nav */}
          <nav className="main-nav desktop-only">
            <a href="/#Clothes">Clothes</a>
            <a href="/#Bags">Bags & Accessories</a>
            <a href="/#Shoes">Shoes</a>
          </nav>

          <div className="desktop-only" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', width: "200px", justifyContent: "flex-end" }}>
            <Link href="/admin" title="Admin Login" style={{ display: 'flex' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            </Link>
            <a href="/#collection" title="Search" style={{ display: 'flex' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </a>
            <a href="/#cart" title="Wishlist" style={{ display: 'flex' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
            </a>
            <a href="/#cart" className="cart-link" style={{ padding: '0.4rem 0.8rem !important' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
              ({cartCount})
            </a>
          </div>

          {/* Mobile Cart / Icons (Right) */}
          <div className="mobile-only" style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "0.8rem" }}>
            <a href="/#collection" title="Search" style={{ display: "flex", alignItems: "center" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </a>
            <a href="/#cart" title="Wishlist" style={{ display: "flex", alignItems: "center" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
            </a>
            <a href="/#cart" style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
              {cartCount > 0 && (
                <span style={{ position: "absolute", top: "-5px", right: "-8px", background: "#000", color: "#fff", fontSize: "0.55rem", width: "14px", height: "14px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", fontWeight: "bold" }}>
                  {cartCount}
                </span>
              )}
            </a>
          </div>

        </div>
      </header>

      {/* Mobile Side Menu */}
      <div className={`side-menu-overlay ${isOpen ? "active" : ""}`} onClick={closeMenu}></div>
      <aside className={`side-menu ${isOpen ? "active" : ""}`}>
        <div className="side-menu-header">
          <SiteLogo />
          <button className="close-menu" onClick={closeMenu}>&times;</button>
        </div>
        <nav className="side-nav">
          <a href="/#Clothes" onClick={closeMenu}>Clothes</a>
          <a href="/#Bags" onClick={closeMenu}>Bags & Accessories</a>
          <a href="/#Shoes" onClick={closeMenu}>Shoes</a>
          <div className="side-nav-footer">
            <a href="/#cart" className="cart-link" onClick={closeMenu}>🛍 Bag ({cartCount})</a>
          </div>
        </nav>
      </aside>
    </>
  );
}

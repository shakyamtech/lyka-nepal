"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import SiteLogo from "./SiteLogo";

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    // Listen for cart updates from other components
    const handleCartUpdate = (e: any) => {
      setCartCount(e.detail?.count || 0);
    };

    window.addEventListener('cart-updated', handleCartUpdate);
    
    // Check localStorage on mount for initial value
    const saved = localStorage.getItem('lyka_cart');
    if (saved) {
      try {
        setCartCount(JSON.parse(saved).length);
      } catch (e) {}
    }

    return () => window.removeEventListener('cart-updated', handleCartUpdate);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  return (
    <>
      <header className={`main-header ${isScrolled ? "scrolled" : ""}`}>
        <div className="container header-content">
          <SiteLogo />
          
          {/* Desktop Nav */}
          <nav className="main-nav desktop-only">
            <Link href="/#Clothes">Clothes</Link>
            <Link href="/#Bags">Bags & Accessories</Link>
            <Link href="/#Shoes">Shoes</Link>
            <Link href="/#cart" className="cart-link">Bag ({cartCount})</Link>
          </nav>

          {/* Mobile Menu Toggle */}
          <button 
            className={`menu-toggle ${isOpen ? "open" : ""}`} 
            onClick={toggleMenu}
            aria-label="Toggle Menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </header>

      {/* Mobile Side Slide Menu */}
      <div className={`side-menu-overlay ${isOpen ? "active" : ""}`} onClick={closeMenu}></div>
      <aside className={`side-menu ${isOpen ? "active" : ""}`}>
        <div className="side-menu-header">
           <SiteLogo />
           <button className="close-menu" onClick={closeMenu}>&times;</button>
        </div>
        <nav className="side-nav">
          <Link href="/#Clothes" onClick={closeMenu}>Clothes</Link>
          <Link href="/#Bags" onClick={closeMenu}>Bags</Link>
          <Link href="/#Shoes" onClick={closeMenu}>Shoes</Link>
          <div className="side-nav-footer">
            <Link href="/#cart" className="cart-link" onClick={closeMenu}>Bag ({cartCount})</Link>
          </div>
        </nav>
      </aside>
    </>
  );
}

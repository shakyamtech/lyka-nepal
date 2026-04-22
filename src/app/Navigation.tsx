"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import SiteLogo from "./SiteLogo";
import { useRef } from "react";

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const [adminUnreadCount, setAdminUnreadCount] = useState(0);
  const playedSoundsRef = useRef<Set<number>>(new Set());
  const lastSoundTimeRef = useRef<number>(0);

  const playSweetDing = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const playNote = (freq: number, startTime: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        osc.connect(gain);
        gain.connect(ctx.destination);
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(1, startTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        osc.start(startTime);
        osc.stop(startTime + duration);
      };
      const now = ctx.currentTime;
      playNote(523.25, now, 0.4); 
      playNote(659.25, now + 0.15, 0.4); 
      playNote(783.99, now + 0.3, 0.6); 
    } catch (e) { }
  };

  const playSadSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const playNote = (freq: number, startTime: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        osc.connect(gain);
        gain.connect(ctx.destination);
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.5, startTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        osc.start(startTime);
        osc.stop(startTime + duration);
      };
      const now = ctx.currentTime;
      playNote(392.00, now, 0.4); 
      playNote(349.23, now + 0.15, 0.4); 
      playNote(261.63, now + 0.3, 0.6); 
    } catch (e) { }
  };


  useEffect(() => {
    const admin = localStorage.getItem('lyka_admin');
    if (!admin) return;

    let lastCheck = Date.now();
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/notifications?since=${lastCheck}`);
        const data = await res.json();
        if (data.length > 0) {
          setAdminUnreadCount(prev => prev + data.length);
          data.forEach((n: any) => {
            const nowTime = Date.now();
            if (!playedSoundsRef.current.has(n.timestamp) && (nowTime - lastSoundTimeRef.current > 1000)) {
              if (n.type === 'PURCHASE') playSweetDing();
              if (n.type === 'REJECT' || n.type === 'RETURN') playSadSound();
              playedSoundsRef.current.add(n.timestamp);
              lastSoundTimeRef.current = nowTime;
            }
          });
          lastCheck = Date.now();
        }
      } catch (e) {}
    }, 5000); // Polling every 5 seconds for the global badge

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setIsMounted(true);
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
    <div className="sticky-nav-wrapper">
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
            <Link href="/?category=Clothes#collection">Clothes</Link>
            <Link href="/?category=Bags%20%26%20Accessories#collection">Bags & Accessories</Link>
            <Link href="/?category=Shoes#collection">Shoes</Link>
          </nav>

          <div className="desktop-only" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', width: "200px", justifyContent: "flex-end" }}>
            <Link href="/admin" title="Admin Login" onClick={() => setAdminUnreadCount(0)} style={{ display: 'flex', position: 'relative' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              {isMounted && adminUnreadCount > 0 && (
                <span style={{ 
                  position: "absolute", top: "-5px", right: "-8px", 
                  background: "#ef4444", color: "#fff", 
                  fontSize: "0.55rem", width: "14px", height: "14px", 
                  display: "flex", alignItems: "center", justifyContent: "center", 
                  borderRadius: "50%", fontWeight: "bold", border: "1px solid #fff",
                  zIndex: 20
                }}>
                  {adminUnreadCount}
                </span>
              )}
            </Link>
            <Link href="/#collection" title="Search" style={{ display: 'flex' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </Link>
            <Link href="/#cart" title="Wishlist" style={{ display: 'flex' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
            </Link>
            <Link href="/#cart" className="cart-link" style={{ padding: '0.4rem 0.8rem !important' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
              ({cartCount})
            </Link>
          </div>

          {/* Mobile Cart / Icons (Right) */}
          <div className="mobile-only" style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "0.8rem" }}>
            <Link href="/admin" title="Admin Login" onClick={() => setAdminUnreadCount(0)} style={{ display: 'flex', position: 'relative' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              {adminUnreadCount > 0 && (
                <span style={{ 
                  position: "absolute", top: "-5px", right: "-8px", 
                  background: "#ef4444", color: "#fff", 
                  fontSize: "0.55rem", width: "12px", height: "12px", 
                  display: "flex", alignItems: "center", justifyContent: "center", 
                  borderRadius: "50%", fontWeight: "bold"
                }}>
                  {adminUnreadCount}
                </span>
              )}
            </Link>
            <Link href="/#collection" title="Search" style={{ display: "flex", alignItems: "center" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </Link>
            <Link href="/#cart" title="Wishlist" style={{ display: "flex", alignItems: "center" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
            </Link>
            <Link href="/#cart" style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
              {cartCount > 0 && (
                <span style={{ position: "absolute", top: "-5px", right: "-8px", background: "#000", color: "#fff", fontSize: "0.55rem", width: "14px", height: "14px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", fontWeight: "bold" }}>
                  {cartCount}
                </span>
              )}
            </Link>
          </div>

        </div>
      </header>
    </div>

      {/* Mobile Side Menu */}
      <div className={`side-menu-overlay ${isOpen ? "active" : ""}`} onClick={closeMenu}></div>
      <aside className={`side-menu ${isOpen ? "active" : ""}`}>
        <div className="side-menu-header">
          <SiteLogo />
          <button className="close-menu" onClick={closeMenu}>&times;</button>
        </div>
        <nav className="side-nav">
          <Link href="/?category=Clothes#collection" onClick={closeMenu}>Clothes</Link>
          <Link href="/?category=Bags%20%26%20Accessories#collection" onClick={closeMenu}>Bags & Accessories</Link>
          <Link href="/?category=Shoes#collection" onClick={closeMenu}>Shoes</Link>
          <div className="side-nav-footer">
            <Link href="/#cart" className="cart-link" onClick={closeMenu}>🛍 Bag ({cartCount})</Link>
          </div>
        </nav>
      </aside>
    </>
  );
}

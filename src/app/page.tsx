"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import "./page.css";

export default function Home() {
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [selectedSizes, setSelectedSizes] = useState<{[key: number]: string}>({});
  
  const sliderRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: -350, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: 350, behavior: 'smooth' });
    }
  };

  // New QR flow states
  const [showQR, setShowQR] = useState(false);
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);

  // Autofill forms
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");

  const [heroBg, setHeroBg] = useState(""); // Dynamic Hero Background

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        setProducts(data);
        setLoading(false);
      });

    // Load cart from localStorage
    const savedCart = localStorage.getItem('lyka_cart');
    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart);
        setCart(parsed);
        // Initial sync for header
        window.dispatchEvent(new CustomEvent('cart-updated', { detail: { count: parsed.length } }));
      } catch (e) {
        console.error("Failed to parse saved cart");
      }
    }

    // Handle hash changes to automatically set the filter when clicking header links
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (['Clothes', 'Bags', 'Shoes'].includes(hash)) {
        setCategoryFilter(hash);
        document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
      }
    };
    
    window.addEventListener('hashchange', handleHashChange);
    // Trigger on initial load as well
    handleHashChange();

    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (baseUrl) {
      setHeroBg(`${baseUrl}/storage/v1/object/public/site-assets/hero-bg.png?v=${Date.now()}`);
    }

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Sync cart to localStorage whenever it changes
  useEffect(() => {
    if (loading) return; // Don't overwrite with empty before load
    localStorage.setItem('lyka_cart', JSON.stringify(cart));
    window.dispatchEvent(new CustomEvent('cart-updated', { detail: { count: cart.length } }));
  }, [cart, loading]);

  const addToCart = (product: any) => {
    // Check if size selection is required
    if (['Clothes', 'Shoes'].includes(product.category) && product.sizes) {
      if (!selectedSizes[product.id]) {
        alert("Please select a size first!");
        // Scroll slightly to the product card if needed
        return;
      }
    }

    const itemToAdd = {
      ...product,
      selectedSize: selectedSizes[product.id] || null
    };

    setCart([...cart, itemToAdd]);
    
    // Silent notification to admin
    fetch('/api/notifications', {
      method: 'POST',
      body: JSON.stringify({ type: 'CART_ADD', message: `Customer added ${product.name} ${itemToAdd.selectedSize ? `(Size: ${itemToAdd.selectedSize})` : ''} to their bag.` })
    }).catch(()=>{});

    // Automatically navigate user down to the billing/payment section
    setTimeout(() => {
      document.getElementById('cart')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const removeFromCart = (index: number) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    
    // Switch view to QR mode instead of hitting API
    setShowQR(true);
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!paymentScreenshot) {
      alert("Please upload your payment screenshot before submitting.");
      return;
    }

    setIsProcessing(true);
    
    const formData = new FormData();
    formData.append('items', JSON.stringify(cart));
    formData.append('total', totalBill.toString());
    formData.append('name', customerName || "LYKA Guest");
    formData.append('email', customerEmail || "guest@lykanepal.com");
    formData.append('phone', customerPhone);
    formData.append('address', customerAddress);
    if (paymentScreenshot) formData.append('screenshot', paymentScreenshot);

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      if (data.success) {
        // Clear cart after successful submission
        setCart([]);
        localStorage.removeItem('lyka_cart');
        
        // Redirect to success page indicating verification is pending
        window.location.href = `/success?orderId=${data.orderId}&total=${totalBill}&status=pending`;
      } else {
        alert("Failed to submit order. Please try again.");
        setIsProcessing(false);
      }
    } catch (err) {
      alert("Network error.");
      setIsProcessing(false);
    }
  };

  const totalBill = cart.reduce((sum, item) => sum + item.price, 0);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "All" || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const ProductCard = ({ product }: { product: any }) => (
    <div className="product-card">
      <div className="product-image" style={{ position: 'relative' }}>
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          style={{ objectFit: 'cover' }}
          priority={false}
        />
        {product.stock === 0 && (
          <div style={{
            position: 'absolute', top: '0.75rem', left: '0.75rem',
            background: '#fff', color: '#111', fontSize: '0.68rem',
            fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase',
            padding: '0.3rem 0.7rem'
          }}>Sold Out</div>
        )}
        {product.stock > 0 && (
          <div className="hover-order-overlay" onClick={() => addToCart(product)}>
            ORDER NOW
          </div>
        )}
      </div>

      <div className="product-info">
        <div>
          <h3>{product.name}</h3>
          <p className="price">Rs.{product.price.toLocaleString()}</p>
          {product.description && (
            <p className="product-description">{product.description}</p>
          )}
        </div>

        {['Clothes', 'Shoes'].includes(product.category) && product.sizes && (
          <div className="size-selector">
            <div className="size-buttons">
              {product.sizes.split(',').filter(Boolean).map((sStr: string) => {
                const parts = sStr.split(':');
                const szName = parts[0].trim();
                const szQty = parts.length > 1 ? Number(parts[1].trim()) : 1;

                return (
                  <button
                    key={szName}
                    disabled={szQty <= 0}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (szQty > 0) {
                        setSelectedSizes(prev => ({ ...prev, [product.id]: szName }));
                      }
                    }}
                    className={`size-btn ${selectedSizes[product.id] === szName ? 'selected' : ''}`}
                    style={{ 
                      opacity: szQty <= 0 ? 0.4 : 1, 
                      cursor: szQty <= 0 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {szName} {szQty <= 0 && <span style={{ fontSize: '0.65rem', display: 'block', color: '#ef4444', fontWeight: 'bold' }}>Sold Out</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Hero */}
      <section
        className="hero"
        style={heroBg ? {
          backgroundImage: `url(${heroBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        } : { background: '#1a1a1a' }}
      >
        <div className="hero-overlay">
          <div className="container">
            <h1>New Arrivals</h1>
            <a href="#catalog" className="hero-cta">Shop now</a>
          </div>
        </div>
      </section>

      {/* Catalog */}
      <section className="catalog container" id="catalog">
        <div className="section-header" style={{ marginBottom: '1rem' }}>
          <h2>New Arrivals</h2>
        </div>
        
        {/* Top Section: New Arrivals Slider */}
        <div style={{ marginBottom: '1rem' }}>
          <div className="slider-wrapper">
            <button className="slider-arrow left" onClick={scrollLeft} aria-label="Scroll left">
              <svg width="40" height="15" viewBox="0 0 32 12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 1 L1 6 L6 11 M1 6 L32 6"/></svg>
            </button>
            <div className="product-grid horizontal-scroll" ref={sliderRef}>
              {products.length === 0 && (
                <p style={{ gridColumn: "1 / -1", textAlign: "center", color: "#999", padding: "4rem 0", fontStyle: "italic" }}>
                  No products found.
                </p>
              )}
              {products.map((product) => <ProductCard key={`slider-${product.id}`} product={product} />)}
            </div>
            <button className="slider-arrow right" onClick={scrollRight} aria-label="Scroll right">
              <svg width="40" height="15" viewBox="0 0 32 12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M26 1 L31 6 L26 11 M31 6 L0 6"/></svg>
            </button>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2.5rem', marginBottom: '4rem' }}>
            <button 
              onClick={() => { document.getElementById('collection')?.scrollIntoView({ behavior: 'smooth' }) }} 
              style={{ padding: '0.8rem 3rem', background: 'transparent', border: '1px solid #111', fontWeight: 'bold', letterSpacing: '0.15em', fontSize: '0.75rem', cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseOver={(e) => { e.currentTarget.style.background = '#111'; e.currentTarget.style.color = '#fff' }}
              onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#111' }}
            >
              VIEW ALL
            </button>
          </div>
        </div>

        {/* Bottom Section: Collection Grid */}
        <div id="collection" style={{ paddingTop: '2rem' }}>
          <div className="section-header" style={{ marginBottom: '2rem' }}>
            <h2>Our Collection</h2>
            <span style={{ fontSize: '0.82rem', color: '#999', fontStyle: 'italic' }}>Clothes · Bags &amp; Accessories · Shoes</span>
          </div>

          <div className="catalog-filters" style={{ marginBottom: '2rem' }}>
            <div className="filter-group">
              {["All", "Clothes", "Bags & Accessories", "Shoes"].map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat === "Bags & Accessories" ? "Bags" : cat)}
                  className={`filter-btn ${categoryFilter === (cat === "Bags & Accessories" ? "Bags" : cat) ? "active" : ""}`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <input
              type="search"
              placeholder="Search products..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="product-grid product-grid-regular">
            {filteredProducts.length === 0 && (
              <p style={{ gridColumn: "1 / -1", textAlign: "center", color: "#999", padding: "4rem 0", fontStyle: "italic" }}>
                No products found.
              </p>
            )}
            {filteredProducts.map((product) => <ProductCard key={`grid-${product.id}`} product={product} />)}
          </div>
        </div>
      </section>

      {/* Cart / Billing */}
      <section className="billing-section container" id="cart">
        <div className="billing-container">
          <h2>Your Bag</h2>
          {cart.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#999', padding: '2rem 0', fontSize: '0.9rem' }}>
              Your bag is empty. Browse our collection above.
            </p>
          ) : (
            <div>
              <ul className="cart-list">
                {cart.map((item, index) => (
                  <li key={index}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <strong style={{ fontSize: '0.92rem' }}>
                        {item.name}
                        {item.selectedSize && (
                          <span style={{ color: '#888', fontWeight: '400', marginLeft: '0.5rem', fontSize: '0.82rem' }}>/ {item.selectedSize}</span>
                        )}
                      </strong>
                      <span style={{ fontSize: '0.85rem', color: '#888', marginTop: '0.2rem' }}>NPR {item.price.toLocaleString()}</span>
                    </div>
                    <button
                      onClick={() => removeFromCart(index)}
                      style={{ background: 'none', border: 'none', color: '#bbb', cursor: 'pointer', fontSize: '1.1rem', padding: '0.4rem', transition: 'color 0.2s' }}
                      onMouseOver={e => (e.currentTarget.style.color = '#111')}
                      onMouseOut={e => (e.currentTarget.style.color = '#bbb')}
                      title="Remove item"
                    >✕</button>
                  </li>
                ))}
              </ul>

              <div className="bill-total">
                <span>Total</span>
                <span>NPR {totalBill.toLocaleString()}</span>
              </div>

              {!showQR ? (
                <form className="checkout-form" onSubmit={handleCheckout}>
                  <input type="text" placeholder="Full Name" value={customerName} onChange={e => setCustomerName(e.target.value)} required />
                  <input type="email" placeholder="Email Address" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} required />
                  <input type="tel" placeholder="Phone Number" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} required />
                  <textarea placeholder="Delivery Address (e.g., Imadole Area)" value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} required></textarea>
                  <button type="submit" className="checkout-btn">Proceed to Payment</button>
                </form>
              ) : (
                <form className="checkout-form" onSubmit={handleFinalSubmit} style={{ marginTop: '2rem' }}>
                  <div style={{ border: '1px solid var(--border)', padding: '1.5rem', background: '#fafafa', marginBottom: '1rem' }}>
                    <p style={{ fontSize: '0.78rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem', color: '#666' }}>
                      Step 2 — Scan &amp; Pay NPR {totalBill.toLocaleString()}
                    </p>
                    <div style={{ margin: '0 auto', width: '220px', height: '220px', position: 'relative' }}>
                      <Image
                        src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/site-assets/qr.png?v=${Date.now()}`}
                        alt="Payment QR Code"
                        fill
                        style={{ objectFit: 'contain' }}
                        unoptimized={true}
                        onError={(e) => {
                          const target = e.target as HTMLElement;
                          target.style.display = 'none';
                          target.parentElement!.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#999;font-size:0.85rem;text-align:center;">QR not uploaded yet.<br/>Check Admin Dashboard.</div>';
                        }}
                      />
                    </div>
                  </div>
                  <label style={{ fontSize: '0.78rem', fontWeight: '600', letterSpacing: '0.05em', textTransform: 'uppercase', color: '#666', marginBottom: '0.4rem', display: 'block' }}>
                    Upload Payment Screenshot:
                  </label>
                  <input type="file" accept="image/*" onChange={e => setPaymentScreenshot(e.target.files?.[0] || null)} required style={{ marginBottom: '1rem' }} />
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button type="button" onClick={() => setShowQR(false)} style={{ flex: 1, padding: '0.9rem', background: 'white', border: '1px solid var(--border)', cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'Inter, sans-serif' }}>← Back</button>
                    <button type="submit" className="checkout-btn" disabled={isProcessing} style={{ flex: 2, margin: 0 }}>
                      {isProcessing ? "Uploading..." : "Submit Payment"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </section>
    </>
  );
}


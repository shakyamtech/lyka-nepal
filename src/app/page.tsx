"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import "./page.css";

export default function Home() {
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  // New QR flow states
  const [showQR, setShowQR] = useState(false);
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);

  // Autofill forms
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");

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
    setCart([...cart, product]);
    
    // Silent notification to admin
    fetch('/api/notifications', {
      method: 'POST',
      body: JSON.stringify({ type: 'CART_ADD', message: `Customer added ${product.name} to their bag.` })
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
    if (paymentScreenshot) formData.append('screenshot', paymentScreenshot);

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      if (data.success) {
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

  return (
    <>
      <section 
        className="hero" 
        style={heroBg ? { 
          backgroundImage: `url(${heroBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed' // Parallax Effect
        } : {}}
      >
        <div className="hero-overlay">
          <div className="container">
            <h1>New Arrivals</h1>
            <p>Discover the finest women's fashion in Imadole.</p>
          </div>
        </div>
      </section>

      <section className="catalog container" id="catalog">
        <div className="catalog-header">
          <h2>Our Collection</h2>
          <p>Clothes, Bags & Accessories, and Shoes carefully curated for you.</p>
        </div>

        {/* Filters and Search */}
        <div className="catalog-filters">
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

        <div className="product-grid">
          {filteredProducts.length === 0 && <p style={{ gridColumn: "1 / -1", textAlign: "center", fontStyle: "italic", color: "var(--text-muted)" }}>No products found matching your search.</p>}
          {filteredProducts.map((product) => (
            <div key={product.id} className="product-card">
              <div className="product-image" style={{ position: 'relative', overflow: 'hidden' }}>
                <Image 
                  src={product.image} 
                  alt={product.name} 
                  fill 
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  style={{ objectFit: 'cover' }}
                  priority={false}
                />
              </div>
              <div className="product-info">
                <div>
                  <span className="category">{product.category}</span>
                  <h3>{product.name}</h3>
                  <p className="price">NPR {product.price}</p>
                </div>
                {product.stock > 0 ? (
                  <button className="add-btn" onClick={() => addToCart(product)}>Add to Bag</button>
                ) : (
                  <button className="add-btn" style={{ background: "#f3f4f6", color: "#9ca3af", cursor: "not-allowed" }} disabled>Coming Back Soon</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="billing-section container" id="cart">
        <div className="billing-container">
          <h2>Make A Bill</h2>
          {cart.length === 0 ? (
            <p className="empty-cart">Your bag is empty. Add items to make a bill.</p>
          ) : (
            <div className="bill-details">
              <ul className="cart-list">
                {cart.map((item, index) => (
                  <li key={index} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <strong>{item.name}</strong>
                      <span style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>NPR {item.price}</span>
                    </div>
                    <button 
                      onClick={() => removeFromCart(index)}
                      style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "1.2rem", padding: "0.5rem" }}
                      title="Remove item"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
              <div className="bill-total">
                <span>Total Amount:</span>
                <span>NPR {totalBill}</span>
              </div>
              {!showQR ? (
                <form className="checkout-form" onSubmit={handleCheckout}>
                  <input type="text" placeholder="Full Name" value={customerName} onChange={e => setCustomerName(e.target.value)} required />
                  <input type="email" placeholder="Email Address" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} required />
                  <input type="tel" placeholder="Phone Number" required />
                  <textarea placeholder="Delivery Address (e.g., Imadole Area)" required></textarea>
                  <button type="submit" className="checkout-btn">
                    Proceed to Payment
                  </button>
                </form>
              ) : (
                <form className="checkout-form complete-payment" onSubmit={handleFinalSubmit} style={{ marginTop: '2rem', padding: '1rem', border: '1px dashed var(--primary)', borderRadius: '8px', background: '#fafafa' }}>
                  <h3 style={{ marginBottom: "1rem", color: "var(--foreground)" }}>Step 2: Pay & Verify</h3>
                  <div style={{ padding: "0", background: "white", margin: "0 auto 1.5rem", width: "fit-content", borderRadius: "12px", border: "1px solid var(--border)", boxShadow: "0 4px 6px rgba(0,0,0,0.05)", overflow: "hidden", position: 'relative', minHeight: '250px', minWidth: '250px' }}>
                    {/* Dynamic QR Graphic */}
                    <div style={{ position: 'relative', width: '250px', height: '250px' }}>
                        <Image 
                          src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/site-assets/qr.png?v=${Date.now()}`} 
                          alt="Store QR Code" 
                          fill
                          style={{ objectFit: 'cover' }}
                          unoptimized={true} // For dynamic storage images
                          onError={(e) => {
                             // Fallback to text if QR isn't uploaded yet
                             const target = e.target as HTMLElement;
                             target.style.display = 'none';
                             target.parentElement!.innerHTML = '<div style="padding: 2rem; text-align: center; color: #6b7280; font-size: 0.9rem;"><strong>NPR ' + totalBill + '</strong><br/><br/>(Please ask Admin to<br/>upload QR code in Dashboard)</div>';
                          }}
                       />
                    </div>
                  </div>
                  
                  <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: "bold" }}>
                    After paying, upload a screenshot of your transaction:
                  </label>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={e => setPaymentScreenshot(e.target.files?.[0] || null)} 
                    required 
                    style={{ marginBottom: "1.5rem" }} 
                  />
                  
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button type="button" onClick={() => setShowQR(false)} style={{ flex: 1, padding: "0.8rem", background: "white", border: "1px solid var(--border)", borderRadius: "4px", cursor: "pointer" }}>
                      ← Back
                    </button>
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

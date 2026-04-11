"use client";

import { useState, useEffect } from "react";
import "./page.css";

export default function Home() {
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  // Autofill forms
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");

  useEffect(() => {
    setCustomerName(localStorage.getItem("customerName") || "");
    setCustomerEmail(localStorage.getItem("customerEmail") || "");
    
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        setProducts(data);
        setLoading(false);
      });
  }, []);

  const addToCart = (product: any) => {
    setCart([...cart, product]);
    
    // Silent notification to admin
    fetch('/api/notifications', {
      method: 'POST',
      body: JSON.stringify({ type: 'CART_ADD', message: `Customer added ${product.name} to their bag.` })
    }).catch(()=>{});
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    // Notify admin of successful intent
    fetch('/api/notifications', {
      method: 'POST',
      body: JSON.stringify({ type: 'PURCHASE', message: `Customer just completed a purchase of NPR ${totalBill}!` })
    }).catch(()=>{});
    
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cart, total: totalBill, name: customerName || "LYKA Guest", email: customerEmail || "guest@lykanepal.com" })
      });
      
      const data = await response.json();
      if (data.success && data.paymentUrl) {
        window.location.href = data.paymentUrl;
      }
    } catch (err) {
      alert("Failed to process payment.");
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
      <section className="hero">
        <div className="container">
          <h1>New Arrivals</h1>
          <p>Discover the finest women's fashion in Imadole.</p>
        </div>
      </section>

      <section className="catalog container" id="clothes">
        <div className="catalog-header">
          <h2>Our Collection</h2>
          <p>Clothes, Bags, and Shoes carefully curated for you.</p>
        </div>

        {/* Filters and Search */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3rem", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {["All", "Clothes", "Bags", "Shoes"].map(cat => (
              <button 
                key={cat} 
                onClick={() => setCategoryFilter(cat)} 
                style={{ 
                  padding: "0.5rem 1.5rem", 
                  borderRadius: "50px", 
                  border: "1px solid var(--border)", 
                  background: categoryFilter === cat ? "var(--foreground)" : "transparent", 
                  color: categoryFilter === cat ? "white" : "var(--foreground)", 
                  cursor: "pointer", 
                  transition: "0.2s",
                  fontWeight: "500"
                }}
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
            style={{ 
              padding: "0.5rem 1.5rem", 
              borderRadius: "50px", 
              border: "1px solid var(--border)", 
              width: "300px",
              fontFamily: "inherit"
            }}
          />
        </div>

        <div className="product-grid">
          {filteredProducts.length === 0 && <p style={{ gridColumn: "1 / -1", textAlign: "center", fontStyle: "italic", color: "var(--text-muted)" }}>No products found matching your search.</p>}
          {filteredProducts.map((product) => (
            <div key={product.id} className="product-card">
              <div className="product-image" style={{ backgroundImage: `url(${product.image})` }}></div>
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
                  <li key={index}>
                    <span>{item.name}</span>
                    <span>NPR {item.price}</span>
                  </li>
                ))}
              </ul>
              <div className="bill-total">
                <span>Total Amount:</span>
                <span>NPR {totalBill}</span>
              </div>
              <form className="checkout-form" onSubmit={handleCheckout}>
                <input type="text" placeholder="Full Name" value={customerName} onChange={e => setCustomerName(e.target.value)} required />
                <input type="email" placeholder="Email Address" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} required />
                <input type="tel" placeholder="Phone Number" required />
                <textarea placeholder="Delivery Address (e.g., Imadole Area)" required></textarea>
                <button type="submit" className="checkout-btn" disabled={isProcessing}>
                  {isProcessing ? "Processing Secure Payment..." : "Pay via Stripe/eSewa"}
                </button>
              </form>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

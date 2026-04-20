"use client";

import { useState, useEffect, useRef } from "react";
import "./admin.css";

function AnalyticsSection({ orders, products }: { orders: any[], products: any[] }) {
  const [filterItemId, setFilterItemId] = useState<string>("ALL");

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const verifiedOrders = orders.filter(o => o.status === 'Verified' || o.status === 'Paid & Verified' || !o.status);

  const calcMetrics = (filteredOrders: any[]) => {
    let revenue = 0;
    let costTotal = 0;

    filteredOrders.forEach(o => {
      // items array is JSON: { id, name, price, cost, ... }
      if (!o.items || !Array.isArray(o.rawItems || o.items)) return;
      const orderItems = o.rawItems || o.items;

      orderItems.forEach((item: any) => {
        // Since o.items might be strings from an old schema map, we rely on rawItems if possible. 
        // We ensure item is an object
        if (typeof item !== 'object') return;

        const selectedProduct = filterItemId !== "ALL" ? products.find(p => p.id?.toString() === filterItemId.toString()) : null;
        
        if (filterItemId !== "ALL") {
          const idMatch = item.id?.toString() === filterItemId.toString();
          const nameMatch = selectedProduct && item.name && selectedProduct.name && 
                            item.name.toString().toLowerCase().trim() === selectedProduct.name.toString().toLowerCase().trim();
          if (!idMatch && !nameMatch) return;
        }

        let itemCost = item.cost;
        if (itemCost === undefined || itemCost === null) {
          const liveProduct = products.find(p => 
            p.id?.toString() === item.id?.toString() || 
            (p.name && item.name && p.name.toString().toLowerCase().trim() === item.name.toString().toLowerCase().trim())
          );
          itemCost = liveProduct?.cost || 0;
        }
        let itemPrice = item.price || 0;

        revenue += Number(itemPrice);
        costTotal += Number(itemCost);
      });
    });

    return {
      revenue,
      profit: revenue - costTotal,
      margin: revenue > 0 ? ((revenue - costTotal) / revenue * 100).toFixed(1) : 0
    };
  };

  const dailyMetrics = calcMetrics(verifiedOrders.filter(o => new Date(o.date) >= startOfDay));
  const monthlyMetrics = calcMetrics(verifiedOrders.filter(o => new Date(o.date) >= startOfMonth));
  const yearlyMetrics = calcMetrics(verifiedOrders.filter(o => new Date(o.date) >= startOfYear));

  return (
    <div style={{ marginBottom: "3rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h2>Analytics & Profit Dashboard</h2>
        <select
          value={filterItemId}
          onChange={e => setFilterItemId(e.target.value)}
          style={{ padding: "0.5rem", borderRadius: "4px", border: "1px solid var(--border)", fontFamily: "inherit" }}
        >
          <option value="ALL">All Products</option>
          {products.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
        {[
          { label: "Today's Sales", metrics: dailyMetrics },
          { label: "This Month", metrics: monthlyMetrics },
          { label: "This Year", metrics: yearlyMetrics },
        ].map((block, idx) => (
          <div key={idx} style={{ background: "white", padding: "1.5rem", borderRadius: "8px", border: "1px solid var(--border)", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <h3 style={{ color: "var(--text-muted)", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "1rem" }}>{block.label}</h3>
            <div style={{ fontSize: "2rem", fontWeight: "bold", color: "var(--primary)", marginBottom: "0.5rem" }}>
              NPR {block.metrics.revenue.toLocaleString()}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #f3f4f6", paddingTop: "0.8rem", marginTop: "0.5rem" }}>
              <div>
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Total Profit</p>
                <p style={{ fontWeight: "600", color: block.metrics.profit >= 0 ? "#16a34a" : "#ef4444" }}>
                  {block.metrics.profit >= 0 ? "+" : ""}NPR {block.metrics.profit.toLocaleString()}
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Margin</p>
                <p style={{ fontWeight: "600", color: "#4f46e5" }}>{block.metrics.margin}%</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Login State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showForgot, setShowForgot] = useState(false);

  // Reset Password State
  const [resetEmail, setResetEmail] = useState("");
  const [resetKey, setResetKey] = useState("");
  const [resetNewPass, setResetNewPass] = useState("");

  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [orderSearchTerm, setOrderSearchTerm] = useState("");

  // New Product Form State
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Clothes");
  const [price, setPrice] = useState("");
  const [cost, setCost] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [stock, setStock] = useState("10");
  const [description, setDescription] = useState("");
  const [sizeQuantities, setSizeQuantities] = useState<{ [key: string]: string }>({});
  const [isVerifying, setIsVerifying] = useState<string | null>(null); // orderId being verified
  const lastSoundTimeRef = useRef<number>(0);

  // New User Form State
  const [newEmail, setNewEmail] = useState("");
  const [newPass, setNewPass] = useState("");
  const [newRole, setNewRole] = useState("user");
  const [newKey, setNewKey] = useState("");

  // Notification State
  const [notifications, setNotifications] = useState<any[]>([]);
  const lastCheckRef = useRef(Date.now());
  const playedSoundsRef = useRef<Set<number>>(new Set());

  // Web Audio Generators
  const playSimpleDing = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) { }
  };

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
      playNote(523.25, now, 0.4); // C
      playNote(659.25, now + 0.15, 0.4); // E
      playNote(783.99, now + 0.3, 0.6); // G
    } catch (e) { }
  };

  // Polling Effect
  useEffect(() => {
    if (!currentUser) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/notifications?since=${lastCheckRef.current}`);
        const data = await res.json();

        if (data.length > 0) {
          lastCheckRef.current = Date.now();
          data.forEach((n: any) => {
            const now = Date.now();
            if (!playedSoundsRef.current.has(n.timestamp) && (now - lastSoundTimeRef.current > 1000)) {
              if (n.type === 'CART_ADD') playSimpleDing();
              if (n.type === 'PURCHASE') playSweetDing();
              playedSoundsRef.current.add(n.timestamp);
              lastSoundTimeRef.current = now;
            }
            setNotifications(prev => [n, ...prev].slice(0, 5));
          });
        }
      } catch (e) { }
    }, 3000);

    return () => clearInterval(interval);
  }, [currentUser]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/auth/login', {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (res.ok && data.success) {
      setCurrentUser(data.user);
      fetchProducts();
      fetchOrders();
      if (data.user.role === 'admin') fetchUsers();
    } else {
      alert("Invalid credentials!");
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/auth/reset', {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: resetEmail, recoveryKey: resetKey, newPassword: resetNewPass })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      alert("Password changed successfully! You can now log in.");
      setShowForgot(false);
      setResetEmail(""); setResetKey(""); setResetNewPass("");
    } else {
      alert("Password reset failed: " + (data.error || "Invalid details."));
    }
  };

  // Content Fetchers
  const fetchProducts = async () => {
    const res = await fetch("/api/products");
    const data = await res.json();
    setProducts(data);
  };
  const fetchOrders = async () => {
    const res = await fetch("/api/orders");
    const data = await res.json();
    if (Array.isArray(data)) setOrders(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  };
  const fetchUsers = async () => {
    const res = await fetch("/api/users");
    const data = await res.json();
    if (Array.isArray(data)) setUsers(data);
  };

  // Handlers
  const handleVerifyOrder = async (orderId: string, action: 'VERIFY' | 'REJECT') => {
    if (!confirm(`Are you sure you want to ${action} this order?`)) return;
    setIsVerifying(orderId);
    try {
      const res = await fetch("/api/orders/verify", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, action })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(`Order ${orderId} has been successfully ${action.toLowerCase()}ed.`);
        fetchOrders(); fetchProducts();
      } else {
        alert("Verification failed: " + (data.error || "Unknown error"));
      }
    } catch (e) {
      alert("Network error while verifying order.");
    } finally {
      setIsVerifying(null);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm(`Are you sure you want to permanently delete order ${orderId}? This history cannot be recovered.`)) return;
    const res = await fetch(`/api/orders?id=${orderId}`, { method: "DELETE" });
    if (res.ok) fetchOrders();
    else alert("Failed to delete order.");
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile) return alert("Please select an image file first.");
    const formData = new FormData();
    formData.append('name', name); formData.append('category', category);
    formData.append('price', price); formData.append('cost', cost);
    formData.append('description', description);

    let sizesStr = "";
    let finalStock = stock;

    if (['Clothes', 'Shoes'].includes(category)) {
      const validSizes = Object.entries(sizeQuantities).filter(([, qty]) => Number(qty) > 0);
      sizesStr = validSizes.map(([sz, qty]) => `${sz}:${qty}`).join(', ');
      finalStock = validSizes.reduce((sum, [, qty]) => sum + Number(qty), 0).toString();
      if (validSizes.length === 0) {
        return alert("Please enter stock for at least one size.");
      }
    }

    formData.append('stock', finalStock);
    formData.append('sizes', sizesStr);
    formData.append('image', imageFile);

    await fetch("/api/products", { method: "POST", body: formData });
    setName(""); setPrice(""); setCost(""); setImageFile(null); setStock("10");
    setDescription(""); setSizeQuantities({});
    fetchProducts();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this product?")) return;
    await fetch(`/api/products?id=${id}`, { method: "DELETE" });
    fetchProducts();
  };

  const handleUpdateStock = async (id: number, currentStock: number) => {
    const newStockStr = prompt(`Update stock for this item. Current stock: ${currentStock}`, currentStock.toString());
    if (newStockStr === null) return; // User cancelled

    const newStock = parseInt(newStockStr);
    if (isNaN(newStock) || newStock < 0) {
      alert("Please enter a valid positive number.");
      return;
    }

    const res = await fetch(`/api/products`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, stock: newStock })
    });

    if (res.ok) {
      fetchProducts();
    } else {
      alert("Failed to update stock.");
    }
  };

  const handleDeleteSubUser = async (id: string) => {
    if (!confirm("Are you sure you want to remove this user?")) return;
    const res = await fetch(`/api/users?id=${id}`, { method: "DELETE" });
    const data = await res.json();
    if (res.ok) fetchUsers();
    else alert(data.error);
  };

  const handleAddSubUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/users', {
      method: 'POST', headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: newEmail, password: newPass, role: newRole, recoveryKey: newKey })
    });
    if (res.ok) {
      alert("User added successfully!");
      setNewEmail(""); setNewPass(""); setNewRole("user"); setNewKey("");
      fetchUsers();
    } else {
      const data = await res.json();
      alert("Failed: " + data.error);
    }
  };

  const handleUploadQR = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('qrImage', file);
    const res = await fetch('/api/admin/qr', { method: 'POST', body: fd });
    if (res.ok) {
      alert("QR Code updated successfully! It is now live on the site.");
    } else {
      alert("Failed to upload QR.");
    }
  };

  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('logoImage', file);
    const res = await fetch('/api/admin/logo', { method: 'POST', body: fd });
    if (res.ok) {
      // Force refresh the page to reflect logo if they just uploaded it, or alert
      alert("Site Logo updated successfully! It is now live on the site.");
    } else {
      alert("Failed to upload the site logo.");
    }
  };

  const handleUploadHero = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('heroImage', file);
    const res = await fetch('/api/admin/hero', { method: 'POST', body: fd });
    if (res.ok) {
      alert("Hero Background updated successfully! Check the storefront to see the parallax effect.");
    } else {
      alert("Failed to upload the background.");
    }
  };

  // Render Login Layout
  if (!currentUser) {
    return (
      <div className="admin-login-container">
        {!showForgot ? (
          <form className="admin-login-form" onSubmit={handleLogin}>
            <h2>Admin Login</h2>
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <button type="submit">Login</button>
            <p style={{ marginTop: "1rem", textAlign: "center", fontSize: "0.9rem" }}>
              <a href="#" onClick={(e) => { e.preventDefault(); setShowForgot(true); }}>Forgot Password?</a>
            </p>
          </form>
        ) : (
          <form className="admin-login-form" onSubmit={handleReset}>
            <h2 style={{ fontSize: "1.5rem" }}>Reset Password</h2>
            <p style={{ fontSize: "0.85rem", color: "#6b7280", marginBottom: "1rem" }}>Provide your specific Recovery Key to reset your password instantly.</p>
            <input type="email" placeholder="Your Email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} required />
            <input type="text" placeholder="Recovery Key" value={resetKey} onChange={(e) => setResetKey(e.target.value)} required />
            <input type="password" placeholder="New Password" value={resetNewPass} onChange={(e) => setResetNewPass(e.target.value)} required />
            <button type="submit">Set New Password</button>
            <p style={{ marginTop: "1rem", textAlign: "center", fontSize: "0.9rem" }}>
              <a href="#" onClick={(e) => { e.preventDefault(); setShowForgot(false); }}>Back to Login</a>
            </p>
          </form>
        )}
      </div>
    );
  }

  // Render Dashboard
  const lowStockItems = products.filter(p => typeof p.stock === 'number' && p.stock < 3);
  const topSellers = [...products].sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0)).slice(0, 3);

  return (
    <div className="admin-dashboard container">
      <h1>LYKA Nepal - Admin Dashboard</h1>
      <p style={{ marginBottom: "2rem" }}>Logged in as <strong>{currentUser.email}</strong> ({currentUser.role})</p>
      <button className="logout-btn" onClick={() => setCurrentUser(null)} style={{ top: "40px" }}>Logout</button>

      {lowStockItems.length > 0 && (
        <div style={{ background: "#fee2e2", border: "2px solid #ef4444", padding: "1.5rem", borderRadius: "8px", marginBottom: "2rem" }}>
          <h2 style={{ color: "#b91c1c", marginBottom: "0.5rem" }}>⚠️ LOW STOCK ALERT</h2>
          <ul style={{ color: "#7f1d1d", marginLeft: "1.5rem" }}>
            {lowStockItems.map(item => (
              <li key={item.id}><strong>{item.name}</strong> has only {item.stock} left in stock!</li>
            ))}
          </ul>
        </div>
      )}

      {/* Analytics Dashboard */}
      <AnalyticsSection orders={orders} products={products} />

      <div style={{ marginBottom: "3rem" }}>
        <h2>Top Selling Items</h2>
        <div style={{ display: "flex", gap: "1rem", marginTop: "1rem", flexWrap: "wrap" }}>
          {topSellers.map((item, index) => (
            <div key={item.id} style={{ background: "white", padding: "1rem", borderRadius: "8px", border: "1px solid var(--border)", flex: "1 1 250px", display: "flex", alignItems: "center" }}>
              <h1 style={{ fontSize: "2.5rem", color: "var(--primary)", marginRight: "1rem" }}>#{index + 1}</h1>
              <div>
                <h4>{item.name}</h4>
                <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>{item.salesCount || 0} units sold</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="admin-grid">
        <section className="add-product-section">
          <h2>Add New Product</h2>
          <form className="add-product-form" onSubmit={handleAddProduct}>
            <input type="text" placeholder="Product Name" value={name} onChange={(e) => setName(e.target.value)} required />
            <select value={category} onChange={(e) => {
              const cat = e.target.value;
              setCategory(cat);
              setSizeQuantities({});
            }} required>
              <option value="Clothes">Clothes</option>
              <option value="Bags">Bags & Accessories</option>
              <option value="Shoes">Shoes</option>
            </select>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <input type="number" placeholder="Sale Price (NPR)" value={price} onChange={(e) => setPrice(e.target.value)} required style={{ flex: 1 }} />
              <input type="number" placeholder="Your Cost (NPR)" value={cost} onChange={(e) => setCost(e.target.value)} required style={{ flex: 1 }} />
            </div>
            <input type="number" placeholder="Total Stock (Limit)" value={stock} onChange={(e) => setStock(e.target.value)} required />
            <textarea placeholder="Product Description..." value={description} onChange={(e) => setDescription(e.target.value)} style={{ padding: "0.8rem", border: "1px solid var(--border)", borderRadius: "4px", minHeight: "80px" }}></textarea>
            {category === 'Clothes' && (
              <div style={{ padding: "0.8rem", border: "1px solid var(--border)", borderRadius: "4px", background: "#f9fafb" }}>
                <p style={{ fontSize: "0.8rem", fontWeight: "bold", marginBottom: "0.5rem" }}>Clothing Inventory (Enter stock per size):</p>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  {['S', 'M', 'L', 'XL', 'XXL'].map(s => (
                    <div key={s} style={{ display: "flex", flexDirection: "column", gap: "0.2rem", width: "60px" }}>
                      <label style={{ fontSize: "0.75rem", fontWeight: "600", textAlign: "center" }}>{s}</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={sizeQuantities[s] || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '') {
                             setSizeQuantities(prev => ({ ...prev, [s]: val }));
                             return;
                          }
                          const newVal = Number(val);
                          const currentTotal = Object.entries(sizeQuantities).reduce((sum, [k, v]) => k === s ? sum : sum + Number(v || 0), 0);
                          const maxAllowed = Number(stock || 0);
                          
                          if (currentTotal + newVal <= maxAllowed) {
                            setSizeQuantities(prev => ({ ...prev, [s]: val }));
                          } else {
                            const remaining = Math.max(0, maxAllowed - currentTotal);
                            setSizeQuantities(prev => ({ ...prev, [s]: remaining.toString() }));
                          }
                        }}
                        style={{ padding: "0.4rem", textAlign: "center" }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
            {category === 'Shoes' && (
              <div style={{ padding: "0.8rem", border: "1px solid var(--border)", borderRadius: "4px", background: "#f9fafb" }}>
                <p style={{ fontSize: "0.8rem", fontWeight: "bold", marginBottom: "0.5rem" }}>Shoe Inventory (Enter stock per size):</p>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  {['36', '37', '38', '39', '40', '41', '42'].map(s => (
                    <div key={s} style={{ display: "flex", flexDirection: "column", gap: "0.2rem", width: "50px" }}>
                      <label style={{ fontSize: "0.75rem", fontWeight: "600", textAlign: "center" }}>{s}</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={sizeQuantities[s] || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '') {
                             setSizeQuantities(prev => ({ ...prev, [s]: val }));
                             return;
                          }
                          const newVal = Number(val);
                          const currentTotal = Object.entries(sizeQuantities).reduce((sum, [k, v]) => k === s ? sum : sum + Number(v || 0), 0);
                          const maxAllowed = Number(stock || 0);
                          
                          if (currentTotal + newVal <= maxAllowed) {
                            setSizeQuantities(prev => ({ ...prev, [s]: val }));
                          } else {
                            const remaining = Math.max(0, maxAllowed - currentTotal);
                            setSizeQuantities(prev => ({ ...prev, [s]: remaining.toString() }));
                          }
                        }}
                        style={{ padding: "0.4rem", textAlign: "center" }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
            <label style={{ fontSize: "0.9rem", marginTop: "0.5rem", fontWeight: "bold" }}>Upload Photo:</label>
            <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} required style={{ border: "none", padding: "0" }} />
            <button type="submit" style={{ marginTop: "1rem" }}>Add Product</button>
          </form>
        </section>

        <section className="manage-products">
          <h2>Manage Inventory</h2>

          {notifications.length > 0 && (
            <div style={{ background: "#e0f2fe", padding: "1rem", borderRadius: "8px", marginBottom: "2rem", border: "1px solid #bae6fd" }}>
              <h3 style={{ fontSize: "1rem", color: "#0369a1", marginBottom: "0.5rem" }}>Live Notifications</h3>
              {notifications.map((n, i) => (
                <div key={i} style={{ fontSize: "0.9rem", padding: "0.5rem 0", borderBottom: i !== notifications.length - 1 ? "1px solid #bae6fd" : "none" }}>
                  <strong>{new Date(n.timestamp).toLocaleTimeString()}:</strong> {n.message}
                </div>
              ))}
            </div>
          )}

          <div className="inventory-list">
            {products.map((p) => (
              <div key={p.id} className="inventory-item">
                <div className="item-thumbnail" style={{ backgroundImage: `url(${p.image})` }}></div>
                <div className="item-details">
                  <h4>{p.name}</h4>
                  <span>NPR {p.price} | {p.category} | Stock: {p.stock}</span>
                  {p.sizes && <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "4px" }}>Sizes: {p.sizes}</p>}
                </div>
                <div>
                  <button className="edit-btn" onClick={() => handleUpdateStock(p.id, p.stock)}>Refill Stock</button>
                  <button className="delete-btn" onClick={() => handleDelete(p.id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Customer Orders */}
      <section className="admin-orders" style={{ marginTop: "3rem", padding: "2rem", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
        <h2>Customer Orders & Payments</h2>
        <p style={{ marginBottom: "1.5rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>Review uploaded payment screenshots and verify orders to deduct inventory stock.</p>

        <div style={{ marginBottom: "2rem", display: "flex", gap: "1rem" }}>
          <input
            type="text"
            placeholder="Search by ID, Name, or Email..."
            value={orderSearchTerm}
            onChange={(e) => setOrderSearchTerm(e.target.value)}
            style={{ flex: 1, padding: "0.8rem", border: "1px solid var(--border)", borderRadius: "8px" }}
          />
          {orderSearchTerm && (
            <button
              onClick={() => setOrderSearchTerm("")}
              style={{ padding: "0.8rem 1.5rem", background: "#e5e7eb", border: "none", borderRadius: "8px", cursor: "pointer" }}
            >
              Clear
            </button>
          )}
        </div>

        {orders.length === 0 ? (
          <p>No orders yet.</p>
        ) : (
          <div className="order-queue">
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {orders
                .filter(order => {
                  const s = orderSearchTerm.toLowerCase();
                  return order.id.toLowerCase().includes(s) ||
                    order.name.toLowerCase().includes(s) ||
                    order.email.toLowerCase().includes(s);
                })
                .map(order => (
                  <div key={order.id} style={{ background: "white", padding: "1.5rem", borderRadius: "8px", border: "1px solid var(--border)", display: "flex", gap: "2rem", flexWrap: "wrap" }}>
                    <div style={{ flex: "1 1 300px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                        <h3 style={{ margin: 0 }}>{order.id}</h3>
                        <span style={{
                          padding: "0.25rem 0.75rem",
                          borderRadius: "50px",
                          fontSize: "0.8rem",
                          fontWeight: "bold",
                          background: order.status === 'Verified' ? '#dcfce7' : order.status === 'Rejected' ? '#fee2e2' : '#fef9c3',
                          color: order.status === 'Verified' ? '#166534' : order.status === 'Rejected' ? '#991b1b' : '#854d0e'
                        }}>
                          {order.status || 'Pending'}
                        </span>
                      </div>
                      <p><strong>Customer:</strong> {order.name} ({order.email})</p>
                      <p><strong>Phone:</strong> <a href={`tel:${order.phone}`} style={{ color: "var(--primary)", fontWeight: "bold" }}>{order.phone || "N/A"}</a></p>
                      <p><strong>Address:</strong> {order.address || "N/A"}</p>
                      <p><strong>Date:</strong> {new Date(order.date).toLocaleString()}</p>
                      <p><strong>Total:</strong> NPR {order.total}</p>

                      <div style={{ marginTop: "1.5rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                        {(!order.status || order.status === 'Pending Verification') && (
                          <>
                            <button
                              disabled={isVerifying === order.id}
                              onClick={() => handleVerifyOrder(order.id, 'VERIFY')}
                              style={{ padding: "0.5rem 1rem", background: "#10b981", color: "white", border: "none", borderRadius: "4px", cursor: isVerifying === order.id ? "not-allowed" : "pointer", fontWeight: "bold", opacity: isVerifying === order.id ? 0.7 : 1 }}
                            >
                              {isVerifying === order.id ? "⌛ Verifying..." : "☑ Verify Payment"}
                            </button>
                            <button
                              disabled={isVerifying === order.id}
                              onClick={() => handleVerifyOrder(order.id, 'REJECT')}
                              style={{ padding: "0.5rem 1rem", background: "#ef4444", color: "white", border: "none", borderRadius: "4px", cursor: isVerifying === order.id ? "not-allowed" : "pointer", fontWeight: "bold", opacity: isVerifying === order.id ? 0.7 : 1 }}
                            >
                              {isVerifying === order.id ? "..." : "✕ Reject"}
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDeleteOrder(order.id)}
                          style={{ padding: "0.5rem 1rem", background: "none", color: "#6b7280", border: "1px solid #e5e7eb", borderRadius: "4px", cursor: "pointer", fontSize: "0.85rem" }}
                        >
                          🗑 Delete Record
                        </button>
                      </div>
                    </div>

                    {order.screenshotUrl && (
                      <div style={{ flex: "0 0 300px", borderLeft: "1px solid var(--border)", paddingLeft: "2rem" }}>
                        <strong>Screenshot:</strong>
                        <a href={order.screenshotUrl} target="_blank" rel="noreferrer" style={{ display: "block", marginTop: "0.5rem" }}>
                          <img src={order.screenshotUrl} alt="Payment" style={{ width: "100%", maxHeight: "200px", objectFit: "contain", border: "1px solid #e5e7eb", borderRadius: "4px" }} />
                        </a>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}
      </section>

      {/* Admin Operations Only */}
      {currentUser.role === 'admin' && (
        <div style={{ display: "flex", gap: "2rem", marginTop: "3rem", flexWrap: "wrap" }}>

          {/* Team Management */}
          <section style={{ flex: "1 1 400px", padding: "2rem", background: "white", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <h2>Staff & User Management</h2>
            <p style={{ marginBottom: "1.5rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>Add new staff users or admins so they can review orders too.</p>

            <form onSubmit={handleAddSubUser} style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "2rem" }}>
              <input type="email" placeholder="New User Email" value={newEmail} onChange={e => setNewEmail(e.target.value)} required style={{ padding: "0.8rem", border: "1px solid var(--border)", borderRadius: "4px" }} />
              <input type="text" placeholder="Temporary Password" value={newPass} onChange={e => setNewPass(e.target.value)} required style={{ padding: "0.8rem", border: "1px solid var(--border)", borderRadius: "4px" }} />
              <input type="text" placeholder="Recovery Key (e.g. Secret123)" value={newKey} onChange={e => setNewKey(e.target.value)} required style={{ padding: "0.8rem", border: "1px solid var(--border)", borderRadius: "4px" }} />
              <select value={newRole} onChange={e => setNewRole(e.target.value)} style={{ padding: "0.8rem", border: "1px solid var(--border)", borderRadius: "4px" }}>
                <option value="user">Staff / User (Can only manage products/orders)</option>
                <option value="admin">Admin (Can manage users & settings too)</option>
              </select>
              <button type="submit" style={{ padding: "0.8rem", background: "var(--foreground)", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>Create User</button>
            </form>

            <div>
              <h3>Active Accounts</h3>
              <ul style={{ listStyle: "none", padding: 0, marginTop: "1rem" }}>
                {users.map(u => (
                  <li key={u.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem", borderBottom: "1px solid var(--border)" }}>
                    <div>
                      <strong>{u.email}</strong> <span style={{ fontSize: "0.8rem", background: "#e5e7eb", padding: "2px 6px", borderRadius: "4px" }}>{u.role}</span>
                      <br />
                      <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Recovery Key: {u.recoveryKey}</span>
                    </div>
                    {u.id !== currentUser.id && (
                      <button onClick={() => handleDeleteSubUser(u.id)} style={{ color: "red", border: "none", background: "none", cursor: "pointer" }}>Remove</button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* QR Settings */}
          <section style={{ flex: "1 1 400px", padding: "2rem", background: "white", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <h2>Payment QR Settings</h2>
            <p style={{ marginBottom: "1rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>Upload the official Payment QR Code image that will be shown to customers at checkout. We recommend uploading an eSewa or FonePay QR.</p>

            <div style={{ border: "2px dashed var(--border)", padding: "2rem", textAlign: "center", borderRadius: "8px" }}>
              <input type="file" accept="image/*" id="qr-upload" style={{ display: "none" }} onChange={handleUploadQR} />
              <label htmlFor="qr-upload" style={{ display: "inline-block", padding: "1rem 2rem", background: "var(--primary)", color: "white", borderRadius: "4px", cursor: "pointer", fontWeight: "bold", marginBottom: "1rem" }}>
                Select QR Image
              </label>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>This will instantly replace the `/qr.png` file on the site.</p>
            </div>
          </section>

          {/* Hero Settings */}
          <section style={{ flex: "1 1 400px", padding: "2rem", background: "white", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <h2>Hero Background (Parallax)</h2>
            <p style={{ marginBottom: "1rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>Upload a high-quality background image for your Storefront's "New Arrivals" section. It will automatically apply a smooth parallax effect.</p>

            <div style={{ border: "2px dashed var(--border)", padding: "2rem", textAlign: "center", borderRadius: "8px" }}>
              <input type="file" accept="image/*" id="hero-upload" style={{ display: "none" }} onChange={handleUploadHero} />
              <label htmlFor="hero-upload" style={{ display: "inline-block", padding: "1rem 2rem", background: "var(--primary)", color: "white", borderRadius: "4px", cursor: "pointer", fontWeight: "bold", marginBottom: "1rem" }}>
                Select Background Image
              </label>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Best results with landscape images (wide).</p>
            </div>
          </section>

        </div>
      )}
    </div>
  );
}

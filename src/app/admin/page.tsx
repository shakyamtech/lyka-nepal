"use client";

import { useState, useEffect, useRef } from "react";
import "./admin.css";

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [products, setProducts] = useState<any[]>([]);
  
  // New Product Form State
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Clothes");
  const [price, setPrice] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [stock, setStock] = useState("10");

  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");

  // Notification State
  const [notifications, setNotifications] = useState<any[]>([]);
  const lastCheckRef = useRef(Date.now());

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
    } catch(e){}
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
    } catch(e){}
  };

  // Polling Effect
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/notifications?since=${lastCheckRef.current}`);
        const data = await res.json();
        
        if (data.length > 0) {
          lastCheckRef.current = Date.now();
          data.forEach((n: any) => {
            if (n.type === 'CART_ADD') playSimpleDing();
            if (n.type === 'PURCHASE') playSweetDing();
            setNotifications(prev => [n, ...prev].slice(0, 5));
          });
        }
      } catch (e) {}
    }, 3000);
    
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/settings');
    const creds = await res.json();

    if (email === creds.email && password === creds.password) {
      setIsAuthenticated(true);
      fetchProducts();
    } else {
      alert("Invalid credentials!");
    }
  };

  const fetchProducts = async () => {
    const res = await fetch("/api/products");
    const data = await res.json();
    setProducts(data);
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile) {
      alert("Please select an image file first.");
      return;
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('category', category);
    formData.append('price', price);
    formData.append('stock', stock);
    formData.append('image', imageFile);
    
    await fetch("/api/products", {
      method: "POST",
      body: formData
    });
    
    // Reset form & Refresh
    setName(""); setPrice(""); setImageFile(null); setStock("10");
    fetchProducts();
  };

  const handleDelete = async (id: number) => {
    await fetch(`/api/products?id=${id}`, { method: "DELETE" });
    fetchProducts();
  };

  if (!isAuthenticated) {
    return (
      <div className="admin-login-container">
        <form className="admin-login-form" onSubmit={handleLogin}>
          <h2>Admin Login</h2>
          <input 
            type="email" 
            placeholder="Email (admin@lyka.com)" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
          />
          <input 
            type="password" 
            placeholder="Password (123456)" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
          <button type="submit">Login</button>
        </form>
      </div>
    );
  }

  const lowStockItems = products.filter(p => typeof p.stock === 'number' && p.stock < 3);
  const topSellers = [...products].sort((a,b) => (b.salesCount || 0) - (a.salesCount || 0)).slice(0, 3);

  return (
    <div className="admin-dashboard container">
      <h1>LYKA Nepal - Admin Dashboard</h1>
      <button className="logout-btn" onClick={() => setIsAuthenticated(false)}>Logout</button>
      
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

      <div style={{ marginBottom: "3rem" }}>
        <h2>Top Selling Items</h2>
        <div style={{ display: "flex", gap: "1rem", marginTop: "1rem", flexWrap: "wrap" }}>
          {topSellers.map((item, index) => (
             <div key={item.id} style={{ background: "white", padding: "1rem", borderRadius: "8px", border: "1px solid var(--border)", flex: "1 1 250px", display: "flex", alignItems: "center" }}>
               <h1 style={{ fontSize: "2.5rem", color: "var(--primary)", marginRight: "1rem" }}>#{index+1}</h1>
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
            <input type="text" placeholder="Product Name (e.g. Red Silk Dress)" value={name} onChange={(e) => setName(e.target.value)} required />
            <select value={category} onChange={(e) => setCategory(e.target.value)} required>
              <option value="Clothes">Clothes</option>
              <option value="Bags">Bags</option>
              <option value="Shoes">Shoes</option>
            </select>
            <input type="number" placeholder="Price (NPR)" value={price} onChange={(e) => setPrice(e.target.value)} required />
            <input type="number" placeholder="Initial Stock" value={stock} onChange={(e) => setStock(e.target.value)} required />
            <label style={{ fontSize: "0.9rem", marginTop: "0.5rem", fontWeight: "bold" }}>Upload Product Photo:</label>
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
                </div>
                <button className="delete-btn" onClick={() => handleDelete(p.id)}>Delete</button>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Account Settings */}
      <section className="admin-settings" style={{ marginTop: "3rem", padding: "2rem", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
        <h2>Account Settings</h2>
        <p style={{ marginBottom: "1rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>Update your Admin Dashboard login credentials here.</p>
        <form onSubmit={async (e) => {
          e.preventDefault();
          await fetch('/api/admin/settings', {
             method: 'POST', body: JSON.stringify({ email: newAdminEmail, password: newAdminPassword })
          });
          alert("Credentials updated successfully!");
          setNewAdminEmail(""); setNewAdminPassword("");
        }} style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
          <input type="email" placeholder="New Admin Email" value={newAdminEmail} onChange={e => setNewAdminEmail(e.target.value)} required style={{ padding: "0.8rem", border: "1px solid var(--border)", borderRadius: "4px" }} />
          <input type="text" placeholder="New Password" value={newAdminPassword} onChange={e => setNewAdminPassword(e.target.value)} required style={{ padding: "0.8rem", border: "1px solid var(--border)", borderRadius: "4px" }} />
          <button type="submit" style={{ padding: "0.8rem 1.5rem", background: "var(--foreground)", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>Update Credentials</button>
        </form>
      </section>

    </div>
  );
}

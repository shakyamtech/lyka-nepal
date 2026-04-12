"use client";

import { useState, useEffect, useRef } from "react";
import "./admin.css";

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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [stock, setStock] = useState("10");
  const [description, setDescription] = useState("");
  const [sizes, setSizes] = useState("");
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
      } catch (e) {}
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
    if(Array.isArray(data)) setOrders(data.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  };
  const fetchUsers = async () => {
    const res = await fetch("/api/users");
    const data = await res.json();
    if(Array.isArray(data)) setUsers(data);
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
    formData.append('price', price); formData.append('stock', stock);
    formData.append('description', description);
    formData.append('sizes', sizes);
    formData.append('image', imageFile);
    await fetch("/api/products", { method: "POST", body: formData });
    setName(""); setPrice(""); setImageFile(null); setStock("10");
    setDescription(""); setSizes("");
    fetchProducts();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this product?")) return;
    await fetch(`/api/products?id=${id}`, { method: "DELETE" });
    fetchProducts();
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
  const topSellers = [...products].sort((a,b) => (b.salesCount || 0) - (a.salesCount || 0)).slice(0, 3);

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
            <input type="text" placeholder="Product Name" value={name} onChange={(e) => setName(e.target.value)} required />
            <select value={category} onChange={(e) => setCategory(e.target.value)} required>
              <option value="Clothes">Clothes</option>
              <option value="Bags">Bags & Accessories</option>
              <option value="Shoes">Shoes</option>
            </select>
            <input type="number" placeholder="Price (NPR)" value={price} onChange={(e) => setPrice(e.target.value)} required />
            <input type="number" placeholder="Stock" value={stock} onChange={(e) => setStock(e.target.value)} required />
            <textarea placeholder="Product Description..." value={description} onChange={(e) => setDescription(e.target.value)} style={{ padding: "0.8rem", border: "1px solid var(--border)", borderRadius: "4px", minHeight: "80px" }}></textarea>
            {['Clothes', 'Shoes'].includes(category) && (
              <input type="text" placeholder="Sizes (e.g. M, L, XL or 38, 40)" value={sizes} onChange={(e) => setSizes(e.target.value)} style={{ padding: "0.8rem", border: "1px solid var(--border)", borderRadius: "4px" }} />
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
                <button className="delete-btn" onClick={() => handleDelete(p.id)}>Delete</button>
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
                      <br/>
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

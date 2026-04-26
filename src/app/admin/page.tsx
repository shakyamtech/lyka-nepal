"use client";

import { useState, useEffect, useRef } from "react";
import NepaliDate from "nepali-date-converter";
import "./admin.css";

function AnalyticsSection({ orders, products, expenses = [], lastSync, isSyncing }: { orders: any[], products: any[], expenses?: any[], lastSync: Date | null, isSyncing: boolean }) {
  const [filterItemId, setFilterItemId] = useState<string>("ALL");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const verifiedOrders = orders.filter(o => o.status === 'Verified' || o.status === 'Paid & Verified' || !o.status);

  const calcMetrics = (filteredOrders: any[], filteredExpenses: any[]) => {
    let revenue = 0;
    let costTotal = 0;

    // 1. Process Online Orders
    filteredOrders.forEach(o => {
      if (!o.items || !Array.isArray(o.rawItems || o.items)) return;
      const orderItems = o.rawItems || o.items;

      orderItems.forEach((item: any) => {
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
        let qty = Number(item.quantity || 1);

        revenue += (Number(itemPrice) * qty);
        costTotal += (Number(itemCost) * qty);
      });
    });

    // 2. Process Offline Sales (from Expenses with category 'Offline Sale')
    const offlineSales = filteredExpenses.filter(e => 
      e.type === 'INCOME' && 
      e.category?.toString().toLowerCase().trim() === 'offline sale'
    );
    offlineSales.forEach(sale => {
      // Check if it matches the filtered product if one is selected
      if (filterItemId !== "ALL") {
        const pidTag = `[PID:${filterItemId}]`;
        if (!sale.description?.includes(pidTag)) return;
      }

      const saleAmount = Number(sale.amount || 0);
      revenue += saleAmount;

      // Extract COGS for offline sale using unified regex
      const pidMatches = Array.from((sale.description || "").matchAll(/\[PID:(.+?)\]/g)) as any[];
      const qtyMatches = Array.from((sale.description || "").matchAll(/\(x(\d+)\)/g)) as any[];
      
      let saleCost = 0;
      if (pidMatches.length > 0) {
        pidMatches.forEach((match: any, index: number) => {
          const pid = match[1];
          const qty = qtyMatches[index] ? Number(qtyMatches[index][1]) : 1;
          const product = products.find(p => p.id?.toString() === pid);
          if (product) saleCost += (Number(product.cost || 0) * qty);
        });
      } else {
        // Fallback for single-item legacy entries
        const productName = sale.description.replace("Offline Sale: ", "").split(" (x")[0];
        const p = products.find(prod => prod.name === productName);
        const qtyMatch = sale.description.match(/\(x(\d+)\)/);
        const qty = qtyMatch ? Number(qtyMatch[1]) : 1;
        saleCost = p ? (Number(p.cost) || 0) * qty : 0;
      }
      costTotal += saleCost;
    });

    // 3. Process Returns (Refund Paid)
    const returns = filteredExpenses.filter(e => e.category === 'Refund Paid');
    returns.forEach(ret => {
      const retAmount = Number(ret.amount || 0);
      revenue -= retAmount;

      const pidMatches = Array.from((ret.description || "").matchAll(/\[PID:(.+?)\]/g)) as any[];
      const qtyMatches = Array.from((ret.description || "").matchAll(/\(x(\d+)\)/g)) as any[];
      
      if (pidMatches.length > 0) {
        pidMatches.forEach((match: any, index: number) => {
          const pid = match[1];
          const qty = qtyMatches[index] ? Number(qtyMatches[index][1]) : 1;
          const product = products.find(p => p.id?.toString() === pid);
          if (product) costTotal -= (Number(product.cost || 0) * qty);
        });
      }
    });

    return {
      revenue,
      profit: revenue - costTotal,
      margin: revenue > 0 ? ((revenue - costTotal) / revenue * 100).toFixed(1) : 0
    };
  };

  const dailyMetrics = calcMetrics(
    verifiedOrders.filter(o => new Date(o.date) >= startOfDay),
    expenses.filter(e => new Date(e.date) >= startOfDay)
  );
  const monthlyMetrics = calcMetrics(
    verifiedOrders.filter(o => new Date(o.date) >= startOfMonth),
    expenses.filter(e => new Date(e.date) >= startOfMonth)
  );
  const yearlyMetrics = calcMetrics(
    verifiedOrders.filter(o => new Date(o.date) >= startOfYear),
    expenses.filter(e => new Date(e.date) >= startOfYear)
  );

  return (
    <div style={{ marginBottom: "3rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <h2 style={{ margin: 0 }}>Analytics & Profit Dashboard</h2>
          {isSyncing && <span className="sync-spinner" style={{ fontSize: '0.8rem', color: '#6366f1' }}>🔄 Syncing...</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          {lastSync && (
            <span style={{ fontSize: '0.7rem', color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Last Updated: {lastSync.toLocaleTimeString()}
            </span>
          )}
          <select
            value={filterItemId}
            onChange={e => setFilterItemId(e.target.value)}
            style={{ padding: "0.5rem", borderRadius: "4px", border: "1px solid var(--admin-border)", fontFamily: "inherit", background: 'var(--admin-card)', color: 'var(--admin-text)' }}
          >
            <option value="ALL">All Products</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
        {[
          { label: "Today's Sales", metrics: dailyMetrics },
          { label: "This Month", metrics: monthlyMetrics },
          { label: "This Year", metrics: yearlyMetrics },
        ].map((block, idx) => (
          <div key={idx} className="theme-card" style={{ background: "var(--admin-card)", padding: "1.5rem", borderRadius: "16px", border: "1px solid var(--admin-border)", boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }}>
            <h3 style={{ color: "var(--admin-text-muted)", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "1rem" }}>{block.label}</h3>
            <div style={{ fontSize: "2.4rem", fontWeight: "900", color: "var(--admin-text)", marginBottom: "0.5rem" }}>
              NPR {block.metrics.revenue.toLocaleString()}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--admin-border)", paddingTop: "1rem", marginTop: "1rem" }}>
              <div>
                <p style={{ fontSize: "0.75rem", color: "var(--admin-text-muted)", textTransform: 'uppercase' }}>Profit</p>
                <p style={{ fontSize: '1.1rem', fontWeight: "800", color: block.metrics.profit >= 0 ? "#10b981" : "#ef4444" }}>
                  {block.metrics.profit >= 0 ? "+" : ""}NPR {block.metrics.profit.toLocaleString()}
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: "0.75rem", color: "var(--admin-text-muted)", textTransform: 'uppercase' }}>Margin</p>
                <p style={{ fontSize: '1.1rem', fontWeight: "800", color: "#6366f1" }}>{block.metrics.margin}%</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminHeader({ currentUser, weather, themeMode, toggleTheme, refreshWeather, isRefreshing }: { currentUser: any, weather: any, themeMode: string, toggleTheme: () => void, refreshWeather: () => void, isRefreshing: boolean }) {
  if (!weather || !currentUser) return null;
  const hour = new Date().getHours();

  const renderWeatherIcon = () => {
    const desc = weather.desc.toLowerCase();
    const isNight = hour >= 18 || hour < 6;
    if (desc.includes('thunder')) return <div className="weather-icon-thunder">⚡</div>;
    if (desc.includes('rain') || desc.includes('drizzle')) return <div className="weather-icon-rain">🌧️</div>;
    if (desc.includes('cloud') || desc.includes('overcast') || desc.includes('fog')) return <div className="weather-icon-cloud">☁️</div>;
    if (desc.includes('snow')) return <div className="weather-icon-cloud">❄️</div>;
    
    if (isNight) return <div className="weather-icon-moon" style={{ fontSize: '2.2rem' }}>🌙</div>;
    return <div className="weather-icon-sun">☀️</div>;
  };

  return (
    <header className="admin-header-flex" style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      marginBottom: '3rem', 
      paddingTop: '1rem',
      width: '100%'
    }}>
      <div style={{ flex: 1 }}>
        <h1 className="greeting-text" style={{ fontSize: '2.2rem', fontWeight: '800', marginBottom: '0.4rem', color: 'var(--admin-text)', margin: 0 }}>
          {hour >= 18 || hour < 6 ? '🌙' : '☀️'} Good {hour < 12 ? 'Morning' : hour < 18 ? 'Afternoon' : 'Evening'}, {currentUser.displayName || currentUser.email.split('@')[0]}!
        </h1>
        <p style={{ color: 'var(--admin-text-muted)', fontSize: '1rem', margin: '0.4rem 0 0 0' }}>Welcome back to your Admin Suite.</p>
      </div>
      
      <div className="weather-card" style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '1.2rem', 
        background: 'var(--admin-card)', 
        padding: '0.8rem 1.5rem', 
        borderRadius: '16px', 
        border: '1px solid var(--admin-border)', 
        boxShadow: '0 8px 25px rgba(0,0,0,0.08)',
        flexShrink: 0,
        position: 'relative'
      }}>
        <button 
          onClick={refreshWeather}
          disabled={isRefreshing}
          style={{
            position: 'absolute',
            top: '-10px',
            right: '-10px',
            background: 'var(--admin-card)',
            border: '1px solid var(--admin-border)',
            borderRadius: '50%',
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: isRefreshing ? 'wait' : 'pointer',
            boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
            zIndex: 10,
            opacity: isRefreshing ? 0.7 : 1
          }}
          title="Refresh Location"
        >
          <svg 
            className={isRefreshing ? "weather-icon-thunder" : ""} 
            width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
          >
            <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
          </svg>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', opacity: isRefreshing ? 0.5 : 1, transition: 'opacity 0.3s' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '45px', fontSize: '2.2rem' }}>
            {isRefreshing ? '📍' : renderWeatherIcon()}
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', lineHeight: 1, color: 'var(--admin-text)' }}>
              {isRefreshing ? '--' : weather.temp}°C
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--admin-text-muted)', textTransform: 'capitalize', marginTop: '4px' }}>
              {isRefreshing ? 'Detecting...' : `${weather.city}, ${weather.desc}`}
            </div>
          </div>
        </div>
        <div style={{ width: '1px', height: '25px', background: 'var(--admin-border)' }}></div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{weather.humidity}%</div>
            <div style={{ fontSize: '0.6rem', color: 'var(--admin-text-muted)', textTransform: 'uppercase' }}>Humidity</div>
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{weather.wind} <span style={{fontSize: '0.6rem'}}>km/h</span></div>
            <div style={{ fontSize: '0.6rem', color: 'var(--admin-text-muted)', textTransform: 'uppercase' }}>Wind</div>
          </div>
        </div>
      </div>
    </header>
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
  const [expenses, setExpenses] = useState<any[]>([]);
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
  const [refillingProduct, setRefillingProduct] = useState<any | null>(null);
  const [refillSizes, setRefillSizes] = useState<{ [key: string]: string }>({});
  const [categories, setCategories] = useState<any[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [topSellersRange, setTopSellersRange] = useState("ALL");
  const [isMounted, setIsMounted] = useState(false);
  const [printingOrders, setPrintingOrders] = useState<any[]>([]);
  const [isVerifying, setIsVerifying] = useState<string | null>(null); // orderId being verified
  const [themeMode, setThemeMode] = useState<"light" | "dark" | "auto">("auto");
  const [effectiveTheme, setEffectiveTheme] = useState<"light" | "dark">("light");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [weather, setWeather] = useState<any>(null);
  const [isWeatherRefreshing, setIsWeatherRefreshing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const updateLocation = () => {
    setIsWeatherRefreshing(true);
    const fetchWeatherData = (lat: number, lon: number, cityName: string) => {
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m`)
        .then(res => res.json())
        .then(data => {
          const cur = data.current;
          const codeMap: any = {
            0: "Clear Sky", 1: "Mainly Clear", 2: "Partly Cloudy", 3: "Overcast",
            45: "Foggy", 48: "Fog", 51: "Drizzle", 61: "Rain", 71: "Snow", 95: "Thunderstorm"
          };
          setWeather({
            temp: Math.round(cur.temperature_2m),
            desc: codeMap[cur.weather_code] || "Clear",
            humidity: cur.relative_humidity_2m,
            wind: Math.round(cur.wind_speed_10m),
            city: cityName
          });
          setIsWeatherRefreshing(false);
        })
        .catch(() => {
          setWeather({ temp: "22", desc: "Clear Sky", humidity: "40", wind: "10", city: "Lalitpur" });
          setIsWeatherRefreshing(false);
        });
    };

    const tryIPDetection = () => {
      fetch('https://ipapi.co/json/')
        .then(res => res.json())
        .then(ipData => {
          if (ipData.latitude && ipData.longitude) {
            fetchWeatherData(ipData.latitude, ipData.longitude, ipData.city || "Local Area");
          } else {
            throw new Error("IP data incomplete");
          }
        })
        .catch(() => {
          // Final fallback
          fetchWeatherData(27.6710, 85.3240, "Lalitpur");
        });
    };

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
            .then(res => res.json())
            .then(geo => {
              const city = geo.address.city || geo.address.town || geo.address.village || geo.address.suburb || "Local Area";
              fetchWeatherData(latitude, longitude, city);
            })
            .catch(() => fetchWeatherData(latitude, longitude, "Local Area"));
        },
        () => tryIPDetection(),
        { timeout: 8000, enableHighAccuracy: true }
      );
    } else {
      tryIPDetection();
    }
  };

  useEffect(() => {
    updateLocation();
    
    // Auto-login from localStorage
    const savedUser = localStorage.getItem('adminUser');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setCurrentUser(parsed);
      fetchProducts();
      fetchOrders();
      fetchExpenses();
      fetchCategories();
      if (parsed.role === 'admin') fetchUsers();
    }
  }, []);

  useEffect(() => {
    const savedMode = localStorage.getItem('adminThemeMode') as "light" | "dark" | "auto";
    if (savedMode) setThemeMode(savedMode);

    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
    
    document.body.classList.add('admin-body');
    return () => {
      document.body.classList.remove('admin-body');
    };
  }, []);

  useEffect(() => {
    if (themeMode === "auto") {
      const hour = new Date().getHours();
      setEffectiveTheme(hour >= 18 || hour < 6 ? "dark" : "light");
    } else {
      setEffectiveTheme(themeMode);
    }
  }, [themeMode]);

  const handlePrintIndividual = (order: any) => {
    setPrintingOrders([order]);
    setTimeout(() => {
      window.print();
      setPrintingOrders([]);
    }, 500);
  };

  const handlePrintAll = () => {
    // Filter currently showing orders that are Verified
    const verifiedOrders = orders.filter(o => o.status === 'Verified');
    if (verifiedOrders.length === 0) {
      alert("No verified orders to print.");
      return;
    }
    setPrintingOrders(verifiedOrders);
    setTimeout(() => {
      window.print();
      setPrintingOrders([]);
    }, 500);
  };

  // New User Form State
  const [newEmail, setNewEmail] = useState("");
  const [newPass, setNewPass] = useState("");
  const [newRole, setNewRole] = useState("user");
  const [newKey, setNewKey] = useState("");
  const [newDisplayName, setNewDisplayName] = useState("");

  // Notification State
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const lastCheckRef = useRef(Date.now());
  const playedSoundsRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (activeTab === 'dashboard' && currentUser) {
      fetchAllData();
    }
  }, [activeTab, currentUser]);

  // Polling Effect
  useEffect(() => {
    setIsMounted(true);
    if (!currentUser) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/notifications?since=${lastCheckRef.current}`);
        const data = await res.json();

        if (data.length > 0) {
          lastCheckRef.current = Date.now();
          data.forEach((n: any) => {
            const now = Date.now();
            playedSoundsRef.current.add(n.timestamp);
            setNotifications(prev => [n, ...prev].slice(0, 5));
            setUnreadCount(prev => prev + 1);
          });
        }
        
        // Refresh dashboard data periodically
        if (activeTab === 'dashboard') {
          fetchAllData();
        }
      } catch (e) { }
    }, 15000); // 15s refresh

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
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }
      setCurrentUser(data.user);
      localStorage.setItem('adminUser', JSON.stringify(data.user));
      fetchProducts();
      fetchOrders();
      fetchExpenses();
      fetchCategories();
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
  const fetchAllData = async () => {
    setIsSyncing(true);
    try {
      await Promise.all([
        fetchProducts(),
        fetchOrders(),
        fetchExpenses(),
        fetchCategories()
      ]);
      setLastSync(new Date());
    } catch (e) {
      console.error("Data sync failed", e);
    } finally {
      setIsSyncing(false);
    }
  };

  const fetchProducts = async () => {
    const res = await fetch(`/api/products?t=${Date.now()}`);
    const data = await res.json();
    setProducts(data);
  };
  const fetchOrders = async () => {
    const res = await fetch(`/api/orders?t=${Date.now()}`);
    const data = await res.json();
    if (Array.isArray(data)) setOrders(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  };
  const fetchUsers = async () => {
    const res = await fetch(`/api/users?t=${Date.now()}`);
    const data = await res.json();
    if (Array.isArray(data)) setUsers(data);
  };
  const fetchCategories = async () => {
    const res = await fetch(`/api/categories?t=${Date.now()}`);
    const data = await res.json();
    if (Array.isArray(data)) setCategories(data);
  };
  const fetchExpenses = async () => {
    const res = await fetch(`/api/expenses?t=${Date.now()}`);
    const data = await res.json();
    if (Array.isArray(data)) setExpenses(data);
  };

  // Handlers
  const handleVerifyOrder = async (orderId: string, action: 'VERIFY' | 'REJECT') => {
    console.log(`Triggering ${action} for ${orderId}`);
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
        
        // Log notification for Reject so staff hears the sad sound
        if (action === 'REJECT') {
          await fetch("/api/notifications", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              timestamp: Date.now(),
              type: 'REJECT',
              message: `Admin rejected order ${orderId}.`
            })
          });
        }
        
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

  const handleUpdateStock = (product: any) => {
    setRefillingProduct(product);
    const sizes: { [key: string]: string } = {};
    if (product.sizes) {
      product.sizes.split(',').forEach((s: string) => {
        const [name, qty] = s.trim().split(':');
        if (name) sizes[name] = qty || "0";
      });
    }
    setRefillSizes(sizes);
  };

  const handleSaveRefill = async () => {
    if (!refillingProduct) return;
    
    let finalSizes = "";
    let finalStock = refillingProduct.stock;

    if (['Clothes', 'Shoes'].includes(refillingProduct.category)) {
      finalSizes = Object.entries(refillSizes).map(([sz, qty]) => `${sz}:${qty}`).join(', ');
      finalStock = Object.values(refillSizes).reduce((sum, qty) => sum + Number(qty || 0), 0);
    } else {
      finalStock = Number(refillingProduct.stock);
    }

    if (Math.abs(Number(finalStock) - Number(refillingProduct.stock)) > 100) {
      if (!window.confirm(`⚠️ Large stock change detected: from ${refillingProduct.stock} to ${finalStock}. Is this correct?`)) return;
    }

    const res = await fetch(`/api/products`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        id: refillingProduct.id, 
        stock: finalStock,
        sizes: finalSizes 
      })
    });

    if (res.ok) {
      setRefillingProduct(null);
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
      body: JSON.stringify({ email: newEmail, password: newPass, role: newRole, recoveryKey: newKey, displayName: newDisplayName })
    });
    if (res.ok) {
      alert("User added successfully!");
      setNewEmail(""); setNewPass(""); setNewRole("user"); setNewKey(""); setNewDisplayName("");
      fetchUsers();
    } else {
      const data = await res.json();
      alert("Failed: " + data.error);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName) return;
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newCategoryName })
    });
    if (res.ok) {
      setNewCategoryName("");
      fetchCategories();
    } else {
      alert("Failed to add category.");
    }
  };

  const handleUpdateMyName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDisplayName) return;
    const res = await fetch('/api/users', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: currentUser.id, displayName: newDisplayName })
    });
    if (res.ok) {
      alert("Name updated successfully!");
      setCurrentUser({ ...currentUser, displayName: newDisplayName });
      setNewDisplayName("");
      fetchUsers();
    } else {
      alert("Failed to update name.");
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!confirm("Delete this category? Products in this category will still exist but won't have a linked category in filters.")) return;
    const res = await fetch(`/api/categories?id=${id}`, { method: 'DELETE' });
    if (res.ok) fetchCategories();
    else alert("Failed to delete category.");
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
    const toggleTheme = () => {
      let next: "light" | "dark" | "auto";
      if (themeMode === "light") next = "dark";
      else if (themeMode === "dark") next = "auto";
      else next = "light";
      setThemeMode(next);
      localStorage.setItem('adminThemeMode', next);
    };

    const themeLabel = themeMode === "light" ? "☀️ Light" : themeMode === "dark" ? "🌙 Dark" : "🕒 Auto";

    return (
      <div className={`admin-login-container ${effectiveTheme}-theme`} style={{ background: 'var(--admin-bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <button 
          onClick={toggleTheme}
          style={{ position: 'absolute', top: '2rem', right: '2rem', padding: '0.6rem 1.2rem', borderRadius: '50px', background: 'var(--admin-card)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)', cursor: 'pointer', zIndex: 10, fontWeight: 'bold' }}
        >
          {themeLabel} Mode
        </button>
        {!showForgot ? (
          <form className="admin-login-form" onSubmit={handleLogin} style={{ background: 'var(--admin-card)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem', display: 'flex', justifyContent: 'center' }}>
              <div style={{ 
                background: "transparent", 
                color: "var(--admin-text)", 
                border: "1px solid var(--admin-border)",
                padding: "0.5rem 1.5rem", 
                fontWeight: "300", 
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                display: "inline-flex",
                justifyContent: "center",
                alignItems: "center"
              }}>
                <span style={{ fontSize: "1.4rem", whiteSpace: "nowrap" }}>LYKA NEPAL</span>
              </div>
            </div>
            <h2 style={{ color: 'var(--admin-text)', fontSize: '1.6rem', fontWeight: '300', letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '0', textAlign: 'center' }}>Welcome</h2>
            <p style={{ textAlign: 'center', color: 'var(--admin-text-muted)', fontSize: '0.9rem', marginTop: '-1rem' }}>Admin Access Panel</p>
            
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ borderRadius: '12px', border: '1px solid var(--admin-border)', background: 'rgba(255,255,255,0.05)' }} />
            <div style={{ position: 'relative' }}>
              <input type={showPass ? "text" : "password"} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ borderRadius: '12px', border: '1px solid var(--admin-border)', background: 'rgba(255,255,255,0.05)', width: '100%' }} />
              <span 
                onClick={() => setShowPass(!showPass)} 
                style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', opacity: 0.6 }}
              >
                {showPass ? "👁️" : "🙈"}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontSize: '0.9rem' }}>
              <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} style={{ width: 'auto', accentColor: '#ff9a9e' }} id="remember" />
              <label htmlFor="remember" style={{ cursor: 'pointer', color: 'var(--admin-text-muted)' }}>Stay logged in</label>
            </div>
            <button type="submit" style={{ background: 'linear-gradient(45deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)', color: 'white', borderRadius: '12px', padding: '1.2rem', fontSize: '1rem', letterSpacing: '1px', textTransform: 'uppercase', boxShadow: '0 10px 20px rgba(255, 154, 158, 0.3)', border: 'none' }}>Login to Suite</button>
            <p style={{ marginTop: "1rem", textAlign: "center", fontSize: "0.9rem" }}>
              <a href="#" onClick={(e) => { e.preventDefault(); setShowForgot(true); }} style={{ color: '#ff9a9e', fontWeight: '500' }}>Forgot Password?</a>
            </p>
          </form>
        ) : (
          <form className="admin-login-form" onSubmit={handleReset} style={{ background: 'var(--admin-card)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}>
            <img src="/logo.png" alt="LYKA" style={{ width: '80px', margin: '0 auto', filter: effectiveTheme === 'dark' ? 'brightness(0) invert(1)' : 'none' }} />
            <h2 style={{ fontSize: "1.5rem", color: 'var(--admin-text)', fontWeight: '300' }}>Reset Password</h2>
            <p style={{ fontSize: "0.85rem", color: "var(--admin-text-muted)", marginBottom: "1rem", textAlign: 'center' }}>Secure key required for instant reset.</p>
            <input type="email" placeholder="Your Email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} required style={{ borderRadius: '12px' }} />
            <input type="text" placeholder="Recovery Key" value={resetKey} onChange={(e) => setResetKey(e.target.value)} required style={{ borderRadius: '12px' }} />
            <input type="password" placeholder="New Password" value={resetNewPass} onChange={(e) => setResetNewPass(e.target.value)} required style={{ borderRadius: '12px' }} />
            <button type="submit" style={{ background: 'linear-gradient(45deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)', color: 'white', borderRadius: '12px' }}>Reset Access</button>
            <p style={{ marginTop: "1rem", textAlign: "center", fontSize: "0.9rem" }}>
              <a href="#" onClick={(e) => { e.preventDefault(); setShowForgot(false); }} style={{ color: '#ff9a9e' }}>Back to Login</a>
            </p>
          </form>
        )}
      </div>
    );
  }

  const toggleTheme = () => {
    let next: "light" | "dark" | "auto";
    if (themeMode === "light") next = "dark";
    else if (themeMode === "dark") next = "auto";
    else next = "light";
    setThemeMode(next);
    localStorage.setItem('adminThemeMode', next);
  };

  const themeLabel = themeMode === "light" ? "☀️ Light" : themeMode === "dark" ? "🌙 Dark" : "🕒 Auto";

  // Render Dashboard
  const lowStockItems = products.filter(p => typeof p.stock === 'number' && p.stock < 3);
  
  const getDynamicTopSellers = () => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const verifiedOrders = orders.filter(o => o.status === 'Verified' || o.status === 'Paid & Verified' || !o.status);
    
    const filteredOrders = verifiedOrders.filter(o => {
      const orderDate = new Date(o.date);
      if (topSellersRange === "TODAY") return orderDate >= startOfToday;
      if (topSellersRange === "MONTH") return orderDate >= startOfMonth;
      return true; // ALL
    });

    const itemCounts: { [key: string]: { id: string, name: string, count: number } } = {};
    
    // 1. Process Online Orders
    filteredOrders.forEach(o => {
      const orderItems = o.rawItems || o.items || [];
      if (Array.isArray(orderItems)) {
        orderItems.forEach((item: any) => {
          const id = item.id?.toString() || item.name;
          if (!itemCounts[id]) {
            itemCounts[id] = { id, name: item.name, count: 0 };
          }
          itemCounts[id].count += Number(item.quantity || 1);
        });
      }
    });

    // 2. Process Offline Sales from Expenses
    const offlineSales = expenses.filter(e => e.category === 'Offline Sale');
    offlineSales.forEach(sale => {
      const saleDate = new Date(sale.date);
      if (topSellersRange === "TODAY" && saleDate < startOfToday) return;
      if (topSellersRange === "MONTH" && saleDate < startOfMonth) return;

      const pidMatches = Array.from((sale.description || "").matchAll(/\[PID:(.+?)\]/g)) as any[];
      const qtyMatches = Array.from((sale.description || "").matchAll(/\(x(\d+)\)/g)) as any[];
      
      if (pidMatches.length > 0) {
        pidMatches.forEach((match: any, index: number) => {
          const pid = match[1];
          const qty = qtyMatches[index] ? Number(qtyMatches[index][1]) : 1;
          const product = products.find(p => p.id?.toString() === pid);
          if (product) {
            const id = product.id?.toString() || product.name;
            if (!itemCounts[id]) {
              itemCounts[id] = { id, name: product.name, count: 0 };
            }
            itemCounts[id].count += qty;
          }
        });
      }
    });

    return Object.values(itemCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  const dynamicTopSellers = getDynamicTopSellers();

  if (!isMounted) return <div style={{ padding: "2rem", textAlign: "center" }}>Loading LYKA Admin Suite...</div>;

  const isSuperAdmin = currentUser.email === 'shakya.mahes@gmail.com';

  return (
    <div className={`admin-layout ${effectiveTheme}-theme`}>
      {/* Sidebar Navigation */}
      <aside className="admin-sidebar no-print">
        <div className="sidebar-logo">LYKA ADMIN</div>
        <nav className="sidebar-nav">
          <button 
            className={`sidebar-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg>
            <span>Dashboard</span>
          </button>
          <button 
            className={`sidebar-item ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
              <span>Orders</span>
            </div>
            {orders.filter(o => !o.status || o.status === 'Pending Verification').length > 0 && (
              <span className="order-badge">
                {orders.filter(o => !o.status || o.status === 'Pending Verification').length}
              </span>
            )}
          </button>
          <button 
            className={`sidebar-item ${activeTab === 'inventory' ? 'active' : ''}`}
            onClick={() => setActiveTab('inventory')}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
              <span>Inventory</span>
            </div>
            {products.length > 0 && (
              <span className="inventory-badge">
                {products.length}
              </span>
            )}
          </button>
          <button 
            className={`sidebar-item ${activeTab === 'categories' ? 'active' : ''}`}
            onClick={() => setActiveTab('categories')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
            <span>Categories</span>
          </button>
          <button 
            className="sidebar-item"
            onClick={() => window.location.href = '/admin/account'}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
            <span>Accounting</span>
          </button>
          <button 
            className={`sidebar-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
            <span>Settings</span>
          </button>
          <div style={{ marginTop: '2rem', padding: '0 1rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem' }}>
            <p style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1rem' }}>Appearance</p>
            <button 
              className="sidebar-item" 
              onClick={toggleTheme}
              style={{ background: 'rgba(255,255,255,0.05)' }}
            >
              {themeMode === 'light' ? (
                <><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg><span>Dark Mode</span></>
              ) : themeMode === 'dark' ? (
                <><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path><circle cx="12" cy="12" r="5"></circle></svg><span>Auto Mode</span></>
              ) : (
                <><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg><span>Light Mode</span></>
              )}
            </button>
          </div>
        </nav>
        <div style={{ marginTop: 'auto', padding: '1rem' }}>
          <button className="logout-btn" onClick={() => setCurrentUser(null)} style={{ width: '100%', marginBottom: 0 }}>Logout</button>
        </div>
      </aside>

      <main className="admin-main-content">
        <AdminHeader 
          currentUser={currentUser} 
          weather={weather} 
          themeMode={themeMode} 
          toggleTheme={toggleTheme} 
          refreshWeather={updateLocation}
          isRefreshing={isWeatherRefreshing}
        />

        <div className="tab-content">
          {activeTab === 'dashboard' && (
            <>
               {notifications.length > 0 && (
                 <div 
                   style={{ 
                     background: 'var(--admin-card)', 
                     padding: "1.5rem", 
                     borderRadius: "12px", 
                     marginBottom: "2.5rem", 
                     border: "1px solid var(--admin-border)", 
                     position: "relative", 
                     cursor: 'pointer',
                     boxShadow: '0 4px 20px rgba(0,0,0,0.05)' 
                   }}
                   onClick={() => setUnreadCount(0)}
                 >
                   <h3 style={{ fontSize: "1.1rem", color: "var(--primary)", marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                     <span style={{ width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%', display: 'inline-block' }}></span>
                     Live Notifications
                   </h3>
                   {notifications.slice(0, 5).map((n, i) => (
                     <div key={i} style={{ fontSize: "0.9rem", padding: "0.8rem 0", borderBottom: i !== Math.min(4, notifications.length - 1) ? "1px solid var(--admin-border)" : "none", color: 'var(--admin-text)' }}>
                       <strong style={{ color: 'var(--admin-text-muted)' }}>{new Date(n.timestamp).toLocaleString('en-US', { hour12: true, timeZone: 'Asia/Kathmandu' })} ({new NepaliDate(new Date(n.timestamp)).format('DD MMMM YYYY')} BS):</strong> {n.message}
                     </div>
                   ))}
                   {notifications.length > 5 && <p style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)', marginTop: '0.8rem' }}>+ {notifications.length - 5} more notifications...</p>}
                 </div>
               )}

              {/* Analytics Dashboard */}
              <AnalyticsSection 
                orders={orders} 
                products={products} 
                expenses={expenses} 
                lastSync={lastSync}
                isSyncing={isSyncing}
              />

              {/* Low Stock Alerts */}
              {lowStockItems.length > 0 && (
                <div style={{ marginBottom: "3rem", background: "rgba(239, 68, 68, 0.05)", padding: "2rem", borderRadius: "16px", border: "1px solid #fca5a5" }}>
                  <h3 style={{ color: "#b91c1c", marginBottom: "1rem", display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    ⚠️ Low Stock Alerts
                    <span style={{ fontSize: '0.8rem', background: '#ef4444', color: 'white', padding: '2px 8px', borderRadius: '50px' }}>{lowStockItems.length} items</span>
                  </h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
                    {lowStockItems.map(p => (
                      <div key={p.id} style={{ background: "var(--admin-card)", padding: "1rem", borderRadius: "8px", border: "1px solid var(--admin-border)", display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <p style={{ fontWeight: "bold", margin: 0, fontSize: '0.9rem' }}>{p.name}</p>
                          <p style={{ fontSize: "0.8rem", color: "#ef4444", fontWeight: 'bold', margin: 0 }}>Only {p.stock} left!</p>
                        </div>
                        <button onClick={() => { setActiveTab('inventory'); handleUpdateStock(p); }} style={{ fontSize: '0.7rem', padding: '0.4rem 0.8rem', background: 'var(--admin-sidebar)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Refill</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ marginBottom: "3rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <h2>Top Selling Items</h2>
                  <select
                    value={topSellersRange}
                    onChange={e => setTopSellersRange(e.target.value)}
                    style={{ padding: "0.5rem", borderRadius: "4px", border: "1px solid var(--border)", fontFamily: "inherit" }}
                  >
                    <option value="ALL">All Time</option>
                    <option value="MONTH">This Month</option>
                    <option value="TODAY">Today</option>
                  </select>
                </div>
                
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.5rem", marginTop: "1rem" }}>
                  {dynamicTopSellers.length === 0 ? (
                    <p style={{ color: "var(--text-muted)", fontStyle: "italic" }}>No sales recorded for this period.</p>
                  ) : (
                    dynamicTopSellers.map((item, index) => (
                      <div key={item.id} className="theme-card" style={{ background: "var(--admin-card)", padding: "1.5rem", borderRadius: "16px", border: "1px solid var(--admin-border)", display: "flex", alignItems: "center", gap: '1.5rem', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                        <div style={{ 
                          fontSize: "1.8rem", 
                          fontWeight: "900", 
                          color: index === 0 ? "#fbbf24" : index === 1 ? "#94a3b8" : index === 2 ? "#b45309" : "var(--admin-text-muted)",
                          width: '40px'
                        }}>
                          #{index + 1}
                        </div>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: "700" }}>{item.name}</h4>
                          <p style={{ margin: "4px 0 0 0", fontSize: "0.85rem", color: "var(--admin-text-muted)" }}>
                            <span style={{ color: '#6366f1', fontWeight: 'bold' }}>{item.count}</span> units sold
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}

          {activeTab === 'inventory' && (
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
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <input type="number" placeholder="Sale Price (NPR)" value={price} onChange={(e) => setPrice(e.target.value)} required style={{ flex: 1 }} />
                    <input type="number" placeholder="Your Cost (NPR)" value={cost} onChange={(e) => setCost(e.target.value)} required style={{ flex: 1 }} />
                  </div>
                  <input type="number" placeholder="Total Stock (Limit)" value={stock} onChange={(e) => setStock(e.target.value)} required />
                  <textarea placeholder="Product Description..." value={description} onChange={(e) => setDescription(e.target.value)} style={{ padding: "0.8rem", border: "1px solid var(--border)", borderRadius: "4px", minHeight: "80px" }}></textarea>
                  {category === 'Clothes' && (
                    <div className="theme-card" style={{ padding: "0.8rem", borderRadius: "4px" }}>
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
                    <div className="theme-card" style={{ padding: "0.8rem", borderRadius: "4px" }}>
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
                <div className="inventory-list">
                  {products.map((p) => (
                    <div key={p.id} className="inventory-item">
                      <div className="item-thumbnail" style={{ backgroundImage: `url(${p.image})` }}></div>
                      <div className="item-details">
                        <h4>{p.name}</h4>
                        <span style={{ fontSize: '0.85rem' }}>NPR {p.price} | {p.category} | Stock: {p.stock}</span>
                        {p.sizes && <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>Sizes: {p.sizes}</p>}
                      </div>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button className="edit-btn" onClick={() => handleUpdateStock(p)}>Refill</button>
                        <button className="delete-btn" onClick={() => handleDelete(p.id)}>X</button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {activeTab === 'categories' && (
            <section className="manage-categories-section" style={{ padding: "2.5rem", borderRadius: "8px", maxWidth: "800px" }}>
              <h2>Manage Product Categories</h2>
              <form className="order-controls" onSubmit={handleAddCategory} style={{ display: "flex", gap: "0.5rem", marginBottom: "2rem" }}>
                <input 
                  type="text" 
                  placeholder="New Category Name (e.g. Perfume)" 
                  value={newCategoryName} 
                  onChange={e => setNewCategoryName(e.target.value)}
                  style={{ flex: 1, padding: "0.8rem", border: "1px solid var(--border)", borderRadius: "8px" }}
                />
                <button type="submit" className="print-all-btn" style={{ padding: "0 2rem", borderRadius: '8px' }}>Add Category</button>
              </form>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
                {categories.map(cat => (
                  <div key={cat.id} className="category-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem", borderRadius: "8px" }}>
                    <span style={{ fontWeight: "700" }}>{cat.name}</span>
                    <button 
                      onClick={() => handleDeleteCategory(cat.id)}
                      style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "0.8rem", fontWeight: 'bold' }}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {activeTab === 'orders' && (
            <section className="admin-orders" style={{ padding: "2rem", background: "white", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
              <h2>Customer Orders & Payments</h2>
              <p style={{ marginBottom: "1.5rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>Review uploaded payment screenshots and verify orders to deduct inventory stock.</p>

              <div className="order-controls" style={{ marginBottom: "2rem", display: "flex", gap: "1rem", alignItems: "center" }}>
                <div style={{ flex: 1, display: "flex", gap: "1rem" }}>
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
                <button 
                  className="print-all-btn"
                  onClick={handlePrintAll}
                  style={{ padding: "0.8rem 1.5rem", background: "#6366f1", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", whiteSpace: "nowrap" }}
                >
                  🖨️ Print All Verified
                </button>
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
                        <div key={order.id} className="theme-card" style={{ background: "var(--admin-card)", padding: "2rem", borderRadius: "20px", border: "1px solid var(--admin-border)", display: "flex", gap: "3rem", flexWrap: "nowrap", width: "100%", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
                          <div style={{ flex: "1 1 300px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                              <h3 style={{ margin: 0 }}>{order.id}</h3>
                              <span className={`status-badge ${
                                order.status === 'Verified' ? 'verified' : 
                                order.status === 'Rejected' ? 'rejected' : 'pending'
                              }`}>
                                {order.status || 'Pending Verification'}
                              </span>
                            </div>
                            <p><strong>Customer:</strong> {order.name} ({order.email})</p>
                            <p><strong>Phone:</strong> <a href={`tel:${order.phone}`} className="admin-phone-link" style={{ fontWeight: "bold", textDecoration: "underline" }}><span style={{ color: "white" }}>{order.phone || "N/A"}</span></a></p>
                            <p><strong>Address:</strong> {order.address || "N/A"}</p>
                            <p><strong>Date:</strong> {new Date(order.date).toLocaleString('en-US', { hour12: true, timeZone: 'Asia/Kathmandu' })} ({new NepaliDate(new Date(order.date)).format('DD MMMM YYYY')} BS)</p>
                            <p><strong>Total:</strong> NPR {order.total}</p>

                            <div style={{ marginTop: "1.5rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                              {order.status === 'Verified' && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handlePrintIndividual(order);
                                  }}
                                  style={{ padding: "0.5rem 1rem", background: "#4f46e5", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}
                                >
                                  🖨️ Print Bill
                                </button>
                              )}
                              {(!order.status || order.status === 'Pending Verification') && (
                                <>
                                  <button
                                    type="button"
                                    disabled={isVerifying === order.id}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleVerifyOrder(order.id, 'VERIFY');
                                    }}
                                    style={{ padding: "0.5rem 1rem", background: "#10b981", color: "white", border: "none", borderRadius: "4px", cursor: isVerifying === order.id ? "not-allowed" : "pointer", fontWeight: "bold", opacity: isVerifying === order.id ? 0.7 : 1 }}
                                  >
                                    {isVerifying === order.id ? "⌛ Verifying..." : "☑ Verify Payment"}
                                  </button>
                                  <button
                                    type="button"
                                    disabled={isVerifying === order.id}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleVerifyOrder(order.id, 'REJECT');
                                    }}
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
                            <div style={{ flex: "0 0 450px", borderLeft: "2px solid var(--admin-border)", paddingLeft: "3rem", display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                              <strong style={{ marginBottom: '1rem', display: 'block', fontSize: '1rem', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--admin-text-muted)' }}>Payment Screenshot</strong>
                              <a href={order.screenshotUrl} target="_blank" rel="noreferrer" style={{ display: "block" }}>
                                <img src={order.screenshotUrl} alt="Payment" style={{ width: "100%", maxHeight: "350px", objectFit: "contain", border: "1px solid var(--admin-border)", borderRadius: "12px", boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                              </a>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {activeTab === 'settings' && (
            <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
              {/* My Profile - Only for Super Admin to edit, others just see info */}
              <section className="theme-card" style={{ flex: "1 1 100%", padding: "2rem", borderRadius: "8px" }}>
                <h2>My Profile</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: '0.9rem' }}>Current Display Name: <strong style={{ color: 'var(--primary)' }}>{currentUser.displayName || "Not Set"}</strong></p>
                    <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.8rem', color: 'var(--admin-text-muted)' }}>Email: {currentUser.email}</p>
                    <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 'bold' }}>Role: {isSuperAdmin ? "Super Admin" : "Administrator"}</p>
                  </div>
                  {isSuperAdmin && (
                    <form onSubmit={handleUpdateMyName} style={{ display: 'flex', gap: '0.5rem', flex: 2 }}>
                      <input 
                        type="text" 
                        placeholder="Update My Name" 
                        value={newDisplayName} 
                        onChange={(e) => setNewDisplayName(e.target.value)} 
                        style={{ flex: 1, padding: '0.8rem', border: '1px solid var(--border)', borderRadius: '8px' }} 
                      />
                      <button type="submit" style={{ padding: '0 1.5rem', borderRadius: '8px', background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer' }}>Save Name</button>
                    </form>
                  )}
                </div>
              </section>

              {/* Theme Settings Box */}
              <section className="theme-card" style={{ flex: "1 1 100%", padding: "2rem", borderRadius: "12px", border: "1px solid var(--admin-border)" }}>
                <h2 style={{ marginBottom: '0.5rem' }}>Interface Theme</h2>
                <p style={{ color: 'var(--admin-text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                  Personalize how your LYKA Admin Suite looks.
                </p>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  {[
                    { mode: 'light', icon: '☀️', label: 'Light' },
                    { mode: 'dark', icon: '🌙', label: 'Dark' },
                    { mode: 'auto', icon: '🕒', label: 'Auto' }
                  ].map((item) => (
                    <button 
                      key={item.mode}
                      onClick={() => {
                        const mode = item.mode as any;
                        setThemeMode(mode);
                        localStorage.setItem('adminThemeMode', mode);
                      }}
                      style={{ 
                        flex: 1, 
                        minWidth: '100px',
                        padding: '1.5rem', 
                        borderRadius: '12px', 
                        border: themeMode === item.mode ? '2px solid #ff9a9e' : '1px solid var(--admin-border)', 
                        background: themeMode === item.mode ? 'rgba(255, 154, 158, 0.05)' : 'var(--admin-card)', 
                        color: 'var(--admin-text)',
                        cursor: 'pointer', 
                        textAlign: 'center',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>{item.icon}</div>
                      <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{item.label}</div>
                    </button>
                  ))}
                </div>
              </section>

              {/* Team Management - All Admins can see, but only Super Admin can set names */}
              <section className="theme-card" style={{ flex: "1 1 400px", padding: "2rem", borderRadius: "8px" }}>
                <h2>Staff & User Management</h2>
                <p style={{ marginBottom: "1.5rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>Add staff accounts to help review orders.</p>
                <form onSubmit={handleAddSubUser} style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "2rem" }}>
                  {isSuperAdmin && (
                    <input type="text" placeholder="Full Name (e.g. Anjali Shakya)" value={newDisplayName} onChange={e => setNewDisplayName(e.target.value)} required style={{ padding: "0.8rem", border: "1px solid var(--border)", borderRadius: "4px" }} />
                  )}
                  <input type="email" placeholder="Email" value={newEmail} onChange={e => setNewEmail(e.target.value)} required style={{ padding: "0.8rem", border: "1px solid var(--border)", borderRadius: "4px" }} />
                  <input type="text" placeholder="Password" value={newPass} onChange={e => setNewPass(e.target.value)} required style={{ padding: "0.8rem", border: "1px solid var(--border)", borderRadius: "4px" }} />
                  <input type="text" placeholder="Recovery Key (Secret word to reset password)" value={newKey} onChange={e => setNewKey(e.target.value)} required style={{ padding: "0.8rem", border: "1px solid var(--border)", borderRadius: "4px" }} />
                  <select value={newRole} onChange={e => setNewRole(e.target.value)} style={{ padding: "0.8rem", border: "1px solid var(--border)", borderRadius: "4px", background: 'var(--admin-card)', color: 'var(--admin-text)' }}>
                    <option value="admin">Administrator (Full Control)</option>
                    <option value="user">Staff (Restricted)</option>
                  </select>
                  <button type="submit" style={{ padding: "0.8rem", background: "var(--foreground)", color: "white", border: "none", borderRadius: "4px" }}>Create User</button>
                </form>
                <div>
                  <h3>Active Accounts</h3>
                  {users
                    .filter(u => u.email !== 'shakya.mahes@gmail.com' || isSuperAdmin)
                    .map(u => (
                    <div key={u.id} style={{ display: "flex", justifyContent: "space-between", padding: "1rem 0", borderBottom: "1px solid var(--border)" }}>
                      <span>
                        <strong style={{ display: 'block' }}>{u.displayName || "No Name Set"}</strong>
                        <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)' }}>{u.email} ({u.role})</span>
                      </span>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {isSuperAdmin && (
                          <button 
                            onClick={() => {
                              const newN = prompt("Enter new name for this user:", u.displayName || "");
                              if (newN !== null) {
                                fetch('/api/users', {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ id: u.id, displayName: newN })
                                }).then(res => {
                                  if (res.ok) fetchUsers();
                                  else alert("Failed to update name");
                                });
                              }
                            }} 
                            style={{ color: "var(--primary)", border: "none", background: "none", cursor: "pointer", fontSize: '0.8rem', fontWeight: 'bold' }}
                          >
                            Edit Name
                          </button>
                        )}
                        {u.id !== currentUser.id && isSuperAdmin && <button onClick={() => handleDeleteSubUser(u.id)} style={{ color: "red", border: "none", background: "none", cursor: "pointer", fontSize: '0.8rem', fontWeight: 'bold' }}>Remove</button>}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
              {/* Branding Assets */}
              <section style={{ flex: "1 1 400px", padding: "2rem", background: "white", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <h2>Site Branding</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem' }}>
                  <div><label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold' }}>Update Logo</label><input type="file" onChange={handleUploadLogo} accept="image/*" /></div>
                  <div><label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold' }}>Update Payment QR</label><input type="file" onChange={handleUploadQR} accept="image/*" /></div>
                  <div><label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold' }}>Update Hero Image</label><input type="file" onChange={handleUploadHero} accept="image/*" /></div>
                </div>
              </section>
            </div>
          )}
        </div>

        <footer style={{ marginTop: '4rem', padding: '2rem 0', textAlign: 'center', borderTop: '1px solid var(--admin-border)', color: 'var(--admin-text-muted)', fontSize: '0.8rem', opacity: 0.6 }}>
          <p>&copy; {new Date().getFullYear()} LYKA Nepal • Boutique Edition</p>
          <p style={{ marginTop: '0.5rem' }}>Premium Women's Fashion Admin</p>
        </footer>
      </main>

      <PrintableBill printingOrders={printingOrders} />

      {/* Refill Stock Modal */}
      {refillingProduct && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'var(--admin-card)', padding: '2.5rem', borderRadius: '16px', maxWidth: '500px', width: '100%', border: '1px solid var(--admin-border)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            <h2 style={{ marginBottom: '0.5rem', color: 'var(--admin-text)' }}>Refill Inventory</h2>
            <p style={{ color: 'var(--admin-text-muted)', marginBottom: '2rem', fontSize: '0.9rem' }}>Update stock levels for <strong>{refillingProduct.name}</strong></p>

            {['Clothes', 'Shoes'].includes(refillingProduct.category) ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                {Object.keys(refillSizes).sort().map(size => (
                  <div key={size} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 'bold', textAlign: 'center', color: 'var(--admin-text-muted)' }}>{size}</label>
                    <input 
                      type="number" 
                      value={refillSizes[size]} 
                      onChange={(e) => setRefillSizes(prev => ({ ...prev, [size]: e.target.value }))}
                      style={{ padding: '0.8rem', textAlign: 'center', background: 'var(--admin-bg)', color: 'var(--admin-text)', border: '1px solid var(--admin-border)', borderRadius: '8px' }}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--admin-text-muted)' }}>General Stock Quantity</label>
                <input 
                  type="number" 
                  value={refillingProduct.stock} 
                  onChange={(e) => setRefillingProduct({ ...refillingProduct, stock: Number(e.target.value) })}
                  style={{ width: '100%', padding: '1rem', background: 'var(--admin-bg)', color: 'var(--admin-text)', border: '1px solid var(--admin-border)', borderRadius: '8px', fontSize: '1.2rem', fontWeight: 'bold' }}
                />
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                onClick={() => setRefillingProduct(null)}
                style={{ flex: 1, padding: '1rem', borderRadius: '8px', background: 'transparent', border: '1px solid var(--admin-border)', color: 'var(--admin-text)', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveRefill}
                style={{ flex: 2, padding: '1rem', borderRadius: '8px', background: 'var(--primary)', border: 'none', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const PrintableBill = ({ printingOrders }: { printingOrders: any[] }) => {
  if (printingOrders.length === 0) return null;
  
  return (
    <div className="printable-bill light-theme" style={{ color: '#000000', background: '#ffffff' }}>
      {printingOrders.map((order) => (
        <div key={order.id} className="bill-page" style={{ color: '#000000', background: '#ffffff', padding: '20px', border: 'none' }}>
          <div className="bill-header" style={{ borderBottom: '2px solid black', paddingBottom: '0.6rem', marginBottom: '1rem', textAlign: 'center' }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: '900', letterSpacing: '0.2em', textTransform: 'uppercase', margin: '0 0 0.1rem 0', color: 'black' }}>LYKA NEPAL</h1>
            <p style={{ color: 'black', margin: 0, fontSize: '0.8rem' }}>Invoice for Order #{order.id}</p>
          </div>
          <div className="bill-section" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', color: 'black', marginBottom: '1rem' }}>
            <div style={{ color: 'black' }}>
              <p style={{ color: 'black', fontWeight: 'bold', marginBottom: '0.2rem', fontSize: '0.8rem' }}>Bill To:</p>
              <p style={{ fontSize: '1rem', fontWeight: 'bold', color: 'black', margin: '0' }}>{order.name}</p>
              <p style={{ color: 'black', margin: '0.1rem 0', fontSize: '0.8rem' }}>{order.address || "No Address Provided"}</p>
              <p style={{ color: 'black', margin: '0.1rem 0', fontSize: '0.8rem' }}>Phone: {order.phone || "N/A"}</p>
              <p style={{ color: 'black', margin: '0.1rem 0', fontSize: '0.8rem' }}>Email: {order.email || "N/A"}</p>
            </div>
            <div style={{ textAlign: 'right', color: 'black' }}>
              <p style={{ color: 'black', fontWeight: 'bold', marginBottom: '0.2rem', fontSize: '0.8rem' }}>Order Reference:</p>
              <p style={{ fontWeight: 'bold', color: 'black', margin: '0', fontSize: '0.9rem' }}>#{order.id}</p>
              <p style={{ color: 'black', fontWeight: 'bold', marginTop: '0.6rem', marginBottom: '0.2rem', fontSize: '0.8rem' }}>Order Date:</p>
              <p style={{ color: 'black', margin: '0', fontSize: '0.8rem' }}>{new Date(order.date).toLocaleString('en-US', { hour12: true, timeZone: 'Asia/Kathmandu' })} ({new NepaliDate(new Date(order.date)).format('DD MMMM YYYY')} BS)</p>
              <p style={{ color: 'black', marginTop: '0.3rem', fontSize: '0.8rem' }}><strong>Status:</strong> {order.status || 'Verified'}</p>
            </div>
          </div>
          <table className="bill-table" style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid black', color: 'black' }}>
            <thead>
              <tr style={{ background: '#f0f0f0' }}>
                <th style={{ border: '1px solid black', padding: '6px', textAlign: 'left', color: 'black', fontSize: '0.75rem' }}>Description</th>
                <th style={{ border: '1px solid black', padding: '6px', textAlign: 'left', color: 'black', fontSize: '0.75rem' }}>Qty</th>
                <th style={{ border: '1px solid black', padding: '6px', textAlign: 'left', color: 'black', fontSize: '0.75rem' }}>Unit Price</th>
                <th style={{ border: '1px solid black', padding: '6px', textAlign: 'left', color: 'black', fontSize: '0.75rem' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {(order.rawItems || order.items || []).map((item: any, i: number) => (
                <tr key={i}>
                  <td style={{ border: '1px solid black', padding: '6px', color: 'black', fontSize: '0.75rem' }}>{item.name}</td>
                  <td style={{ border: '1px solid black', padding: '6px', color: 'black', fontSize: '0.75rem' }}>{item.quantity || 1}</td>
                  <td style={{ border: '1px solid black', padding: '6px', color: 'black', fontSize: '0.75rem' }}>NPR {item.price}</td>
                  <td style={{ border: '1px solid black', padding: '6px', color: 'black', fontSize: '0.75rem' }}>NPR {Number(item.price) * Number(item.quantity || 1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="bill-total" style={{ marginTop: '1rem', paddingTop: '0.8rem', borderTop: '1px solid black' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 'normal', color: '#666', marginBottom: '8px' }}>
              Thank you for choosing LYKA Nepal. We appreciate your business!
            </div>
            <div style={{ fontSize: '0.8rem', color: '#000', textAlign: 'right' }}>
              Total Items: {(order.rawItems || order.items || []).reduce((acc: number, item: any) => acc + (item.quantity || 1), 0)}
            </div>
            <div className="bill-total-amount" style={{ fontSize: '1.3rem', fontWeight: '900', color: 'black', textAlign: 'right', marginTop: '0.2rem' }}>
              GRAND TOTAL: NPR {order.total}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

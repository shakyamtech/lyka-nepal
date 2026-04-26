"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import "./page.css";

// Separate content component to use searchParams
const ProductCard = ({ product, addToCart, selectedSizes, setSelectedSizes, wishlistActiveId, setWishlistActiveId }: any) => {
  const [localPhone, setLocalPhone] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  return (
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
      {product.stock > 0 ? (
        <div className="hover-order-overlay" onClick={() => addToCart(product)}>
          ORDER NOW
        </div>
      ) : (
        <div className="hover-order-overlay" style={{ background: 'rgba(0,0,0,0.8)' }} onClick={() => setWishlistActiveId(product.id)}>
          NOTIFY ME WHEN BACK
        </div>
      )}
    </div>

    {wishlistActiveId === product.id && (
      <div style={{ 
        background: '#f8fafc', 
        padding: '1rem', 
        borderTop: '1px solid #eee',
        animation: 'slideDown 0.3s ease'
      }}>
        <p style={{ fontSize: '0.75rem', fontWeight: '700', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Notify me for {product.name} {selectedSizes[product.id] ? `(Size: ${selectedSizes[product.id]})` : ''}
        </p>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input 
            type="tel" 
            placeholder="Phone Number" 
            value={localPhone}
            onChange={e => setLocalPhone(e.target.value)}
            autoFocus
            style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem', border: '1px solid #ddd', outline: 'none' }}
          />
          <button 
            disabled={isJoining}
            onClick={async () => {
              if (!localPhone) return alert("Phone Number required");
              setIsJoining(true);
              const res = await fetch('/api/wishlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  productId: product.id, 
                  phone: localPhone,
                  size: selectedSizes[product.id] || null
                })
              });
              if (res.ok) {
                alert("You're on the list! We'll notify you.");
                setWishlistActiveId(null);
                setLocalPhone("");
              } else {
                alert("Failed to join wishlist.");
              }
              setIsJoining(false);
            }}
            style={{ background: '#111', color: '#fff', border: 'none', padding: '0.5rem 1rem', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 'bold' }}
          >
            {isJoining ? "..." : "JOIN"}
          </button>
          <button onClick={() => setWishlistActiveId(null)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>×</button>
        </div>
      </div>
    )}

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
                  onClick={(e) => {
                    e.stopPropagation();
                    if (szQty > 0) {
                      setSelectedSizes((prev: any) => ({ ...prev, [product.id]: szName }));
                      setWishlistActiveId(null); // Close wishlist if they select an in-stock size
                    } else {
                      // If sold out size clicked, open wishlist for this size
                      setWishlistActiveId(product.id);
                      setSelectedSizes((prev: any) => ({ ...prev, [product.id]: szName }));
                    }
                  }}
                  className={`size-btn ${selectedSizes[product.id] === szName ? 'selected' : ''}`}
                  style={{ 
                    border: szQty <= 0 ? '1px dashed #ef4444' : undefined,
                    cursor: 'pointer'
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
};

const CategoryScroll = ({ products, category, ...props }: any) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const handleScroll = (dir: 'left' | 'right') => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir === 'left' ? -350 : 350, behavior: 'smooth' });
    }
  };

  return (
    <>
      <button className="slider-arrow left" onClick={() => handleScroll('left')} aria-label="Previous">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><line x1="20" y1="12" x2="4" y2="12"></line><polyline points="10 18 4 12 10 6"></polyline></svg>
      </button>
      <div className="product-grid horizontal-scroll" ref={scrollRef}>
        {products.map((product: any) => <ProductCard key={`slider-${category}-${product.id}`} product={product} {...props} />)}
      </div>
      <button className="slider-arrow right" onClick={() => handleScroll('right')} aria-label="Next">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="12" x2="20" y2="12"></line><polyline points="14 6 20 12 14 18"></polyline></svg>
      </button>
    </>
  );
};

function HomeContent() {
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [selectedSizes, setSelectedSizes] = useState<{[key: number]: string}>({});
  const [showAll, setShowAll] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  
  const searchParams = useSearchParams();
  
  useEffect(() => {
    let category = searchParams.get('category');
    // Normalize "Bags & Accessories" to match the internal "Bags" filter
    if (category === "Bags & Accessories") category = "Bags";
    setCategoryFilter(category || "All");
  }, [searchParams]);
  
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

  useEffect(() => {
    fetch("/api/categories")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setCategories(data);
      });
  }, []);

  // New QR flow states
  const [showQR, setShowQR] = useState(false);
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);

  // Autofill forms
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");

  const [heroBg, setHeroBg] = useState(""); // Dynamic Hero Background
  const [wishlistActiveId, setWishlistActiveId] = useState<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const initAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioCtxRef.current;
  };

  const playBlip = () => {
    try {
      const ctx = initAudio();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch (e) {}
  };

  const playSweetDing = () => {
    try {
      const ctx = initAudio();
      const playNote = (freq: number, startTime: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        osc.connect(gain);
        gain.connect(ctx.destination);
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.4, startTime + 0.05);
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
        document.getElementById('collection')?.scrollIntoView({ behavior: 'smooth' });
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
    playBlip();
    
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
        
        // Redirect to success page (the "Sweet Ding" is now played on that page load)
        setTimeout(() => {
          window.location.href = `/success?orderId=${data.orderId}&total=${totalBill}&status=pending`;
        }, 100);
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

  const filteredProducts = products
    .filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === "All" || p.category === categoryFilter;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0));

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
        {product.stock > 0 ? (
          <div className="hover-order-overlay" onClick={() => addToCart(product)}>
            ORDER NOW
          </div>
        ) : (
          <div className="hover-order-overlay" style={{ background: 'rgba(0,0,0,0.8)' }} onClick={() => setWishlistActiveId(product.id)}>
            NOTIFY ME WHEN BACK
          </div>
        )}
      </div>

      {wishlistActiveId === product.id && (
        <div style={{ 
          background: '#f8fafc', 
          padding: '1rem', 
          borderTop: '1px solid #eee',
          animation: 'slideDown 0.3s ease'
        }}>
          <p style={{ fontSize: '0.75rem', fontWeight: '700', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Notify me for {product.name} {selectedSizes[product.id] ? `(Size: ${selectedSizes[product.id]})` : ''}
          </p>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input 
              type="tel" 
              placeholder="Phone Number" 
              value={wishlistPhone}
              onChange={e => setWishlistPhone(e.target.value)}
              style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem', border: '1px solid #ddd', outline: 'none' }}
            />
            <button 
              disabled={isJoiningWishlist}
              onClick={async () => {
                if (!wishlistPhone) return alert("Phone Number required");
                setIsJoiningWishlist(true);
                const res = await fetch('/api/wishlist', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                    productId: product.id, 
                    phone: wishlistPhone,
                    size: selectedSizes[product.id] || null
                  })
                });
                if (res.ok) {
                  alert("You're on the list! We'll notify you.");
                  setWishlistActiveId(null);
                  setWishlistPhone("");
                } else {
                  alert("Failed to join wishlist.");
                }
                setIsJoiningWishlist(false);
              }}
              style={{ background: '#111', color: '#fff', border: 'none', padding: '0.5rem 1rem', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 'bold' }}
            >
              {isJoiningWishlist ? "..." : "JOIN"}
            </button>
            <button onClick={() => setWishlistActiveId(null)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>×</button>
          </div>
        </div>
      )}

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
                    onClick={(e) => {
                      e.stopPropagation();
                      if (szQty > 0) {
                        setSelectedSizes(prev => ({ ...prev, [product.id]: szName }));
                        setWishlistActiveId(null); // Close wishlist if they select an in-stock size
                      } else {
                        // If sold out size clicked, open wishlist for this size
                        setWishlistActiveId(product.id);
                        setSelectedSizes(prev => ({ ...prev, [product.id]: szName }));
                      }
                    }}
                    className={`size-btn ${selectedSizes[product.id] === szName ? 'selected' : ''}`}
                    style={{ 
                      border: szQty <= 0 ? '1px dashed #ef4444' : undefined,
                      cursor: 'pointer'
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

  const CategoryScroll = ({ products, category }: { products: any[], category: string }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const handleScroll = (dir: 'left' | 'right') => {
      if (scrollRef.current) {
        scrollRef.current.scrollBy({ left: dir === 'left' ? -350 : 350, behavior: 'smooth' });
      }
    };

    return (
      <>
        <button className="slider-arrow left" onClick={() => handleScroll('left')} aria-label="Previous">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><line x1="20" y1="12" x2="4" y2="12"></line><polyline points="10 18 4 12 10 6"></polyline></svg>
        </button>
        <div className="product-grid horizontal-scroll" ref={scrollRef}>
          {products.map((product) => <ProductCard key={`slider-${category}-${product.id}`} product={product} />)}
        </div>
        <button className="slider-arrow right" onClick={() => handleScroll('right')} aria-label="Next">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="12" x2="20" y2="12"></line><polyline points="14 6 20 12 14 18"></polyline></svg>
        </button>
      </>
    );
  };

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
            <button className="slider-arrow left" onClick={scrollLeft} aria-label="Previous">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><line x1="20" y1="12" x2="4" y2="12"></line><polyline points="10 18 4 12 10 6"></polyline></svg>
            </button>
            <div className="product-grid horizontal-scroll" ref={sliderRef}>
              {products.length === 0 && (
                <p style={{ gridColumn: "1 / -1", textAlign: "center", color: "#999", padding: "4rem 0", fontStyle: "italic" }}>
                  No products found.
                </p>
              )}
              {products.map((product) => (
                <ProductCard 
                  key={`slider-${product.id}`} 
                  product={product} 
                  addToCart={addToCart}
                  selectedSizes={selectedSizes}
                  setSelectedSizes={setSelectedSizes}
                  wishlistActiveId={wishlistActiveId}
                  setWishlistActiveId={setWishlistActiveId}
                  wishlistPhone={wishlistPhone}
                  setWishlistPhone={setWishlistPhone}
                  isJoiningWishlist={isJoiningWishlist}
                  setIsJoiningWishlist={setIsJoiningWishlist}
                />
              ))}
            </div>
            <button className="slider-arrow right" onClick={scrollRight} aria-label="Next">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="12" x2="20" y2="12"></line><polyline points="14 6 20 12 14 18"></polyline></svg>
            </button>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2.5rem', marginBottom: '4rem' }}>
            <button 
              onClick={() => { document.getElementById('collection')?.scrollIntoView({ behavior: 'smooth' }) }} 
              className="view-all-btn"
            >
              VIEW ALL
            </button>
          </div>
        </div>

        {/* Bottom Section: Collection Grid */}
        <div id="collection" style={{ paddingTop: '2rem' }}>
          <div className="section-header" style={{ marginBottom: '2rem' }}>
            <h2>Our Collection</h2>
            <span style={{ fontSize: '0.82rem', color: '#999', fontStyle: 'italic' }}>
              {categories.map(c => c.name).join(' · ')}
            </span>
          </div>

          <div className="catalog-filters" style={{ marginBottom: '2rem' }}>
            <div className="filter-group">
              {["All", ...categories.map(c => c.name)].map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`filter-btn ${categoryFilter === cat ? "active" : ""}`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <label htmlFor="product-search" className="visually-hidden">Search products</label>
            <input
              id="product-search"
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
            {filteredProducts.slice(0, showAll ? undefined : 12).map((product) => (
              <ProductCard 
                key={`grid-${product.id}`} 
                product={product} 
                addToCart={addToCart}
                selectedSizes={selectedSizes}
                setSelectedSizes={setSelectedSizes}
                wishlistActiveId={wishlistActiveId}
                setWishlistActiveId={setWishlistActiveId}
                wishlistPhone={wishlistPhone}
                setWishlistPhone={setWishlistPhone}
                isJoiningWishlist={isJoiningWishlist}
                setIsJoiningWishlist={setIsJoiningWishlist}
              />
            ))}
          </div>

          {!showAll && filteredProducts.length > 12 && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '3.5rem', marginBottom: '2rem' }}>
              <button 
                onClick={() => setShowAll(true)} 
                className="view-all-btn"
              >
                VIEW ALL
              </button>
            </div>
          )}
        </div>

        {/* Individual Category Sliders */}
        <div className="container" style={{ marginTop: '2rem' }}>
          {categories.map((item) => {
            const catProducts = products.filter(p => p.category === item.name);
            if (catProducts.length === 0) return null;
            
            return (
              <div key={item.name} style={{ marginTop: '5rem', marginBottom: '4rem' }}>
                <div className="section-header" style={{ marginBottom: '1.5rem' }}>
                  <h2>{item.name}</h2>
                </div>
                <div className="slider-wrapper">
                  <CategoryScroll 
                    products={catProducts} 
                    category={item.name} 
                    addToCart={addToCart}
                    selectedSizes={selectedSizes}
                    setSelectedSizes={setSelectedSizes}
                    wishlistActiveId={wishlistActiveId}
                    setWishlistActiveId={setWishlistActiveId}
                    wishlistPhone={wishlistPhone}
                    setWishlistPhone={setWishlistPhone}
                    isJoiningWishlist={isJoiningWishlist}
                    setIsJoiningWishlist={setIsJoiningWishlist}
                  />
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '3rem' }}>
                  <Link 
                    href={`/?category=${encodeURIComponent(item.name)}#collection`}
                    className="view-all-btn"
                  >
                    VIEW ALL
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Promotional Sale Banners */}
        <div className="promo-section">
          {/* Left Promo: Season Sale */}
          <div className="promo-banner" style={{ backgroundImage: "url('/promo-season-sale.png')" }}>
            <span className="promo-side-text left">30%</span>
            <div className="promo-content">
              <h3>SALE</h3>
              <p>#END OF SEASON</p>
              <a href="/#Clothes" className="promo-btn">VIEW</a>
            </div>
          </div>

          {/* Right Promo: Premium Knitwear */}
          <div className="promo-banner" style={{ backgroundImage: "url('/promo-half-price.png')" }}>
            <span className="promo-side-text right">50%</span>
            <div className="promo-content">
              <h3>NEW</h3>
              <p>#PREMIUM KNITWEAR</p>
              <a href="/#Shoes" className="promo-btn">VIEW</a>
            </div>
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
                  <label htmlFor="cust-name" className="visually-hidden">Full Name</label>
                  <input id="cust-name" type="text" placeholder="Full Name" value={customerName} onChange={e => setCustomerName(e.target.value)} required />
                  <label htmlFor="cust-email" className="visually-hidden">Email Address</label>
                  <input id="cust-email" type="email" placeholder="Email Address" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} required />
                  <label htmlFor="cust-phone" className="visually-hidden">Phone Number</label>
                  <input id="cust-phone" type="tel" placeholder="Phone Number" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} required />
                  <label htmlFor="cust-address" className="visually-hidden">Delivery Address</label>
                  <textarea id="cust-address" placeholder="Delivery Address (e.g., Imadole Area)" value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} required></textarea>
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
                  <label htmlFor="screenshot-upload" style={{ fontSize: '0.78rem', fontWeight: '600', letterSpacing: '0.05em', textTransform: 'uppercase', color: '#666', marginBottom: '0.4rem', display: 'block' }}>
                    Upload Payment Screenshot:
                  </label>
                  <input id="screenshot-upload" type="file" accept="image/*" onChange={e => setPaymentScreenshot(e.target.files?.[0] || null)} required style={{ marginBottom: '1rem' }} />
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

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <div className="features-grid">
            <Link href="/payment-methods" className="feature-item" style={{ textDecoration: 'none', cursor: 'pointer' }}>
              <div className="feature-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="23"></line></svg>
              </div>
              <h3>PAYMENT</h3>
              <p>We accept all Mobile Banking, eSewa, and Khalti for your convenience.</p>
            </Link>
            <Link href="/request-return" className="feature-item" style={{ textDecoration: 'none', cursor: 'pointer' }}>
              <div className="feature-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
              </div>
              <h3>RETURN</h3>
              <p>Return your order easily with just one click.</p>
            </Link>
            <Link href="/shipping" className="feature-item" style={{ textDecoration: 'none', cursor: 'pointer' }}>
              <div className="feature-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
              </div>
              <h3>DELIVERY</h3>
              <p>Delivery available for any location; domestic or international.</p>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="loading">Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}


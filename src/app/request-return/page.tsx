"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function RequestReturnPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [productId, setProductId] = useState("");
  const [qty, setQty] = useState("1");
  const [reason, setReason] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/products").then(r => r.json()).then(setProducts);
  }, []);

  const selectedProduct = products.find(p => p.id.toString() === productId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: name,
          customer_phone: phone,
          product_name: selectedProduct?.name || productId,
          product_id: productId,
          quantity: Number(qty),
          reason
        })
      });
      if (!res.ok) throw new Error("Failed to submit");
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#fafafa", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <div style={{ background: "white", width: "100%", maxWidth: "560px", padding: "3rem", border: "1px solid #e0e0e0" }}>
        <Link href="/" style={{ fontSize: "0.8rem", color: "#999", textDecoration: "none", letterSpacing: "0.1em" }}>← BACK TO STORE</Link>
        <h1 style={{ fontSize: "1.8rem", fontWeight: "800", margin: "1.5rem 0 0.5rem", letterSpacing: "0.05em" }}>REQUEST A RETURN</h1>
        <p style={{ color: "#666", fontSize: "0.9rem", marginBottom: "2rem", lineHeight: 1.6 }}>
          Fill in your details below and we will review your return request within 1–2 business days.
          You will be contacted on your phone number once approved.
        </p>

        {submitted ? (
          <div style={{ textAlign: "center", padding: "2rem 0" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✅</div>
            <h2 style={{ fontWeight: "bold", marginBottom: "0.5rem" }}>Request Submitted!</h2>
            <p style={{ color: "#666", fontSize: "0.9rem", lineHeight: 1.6 }}>
              We have received your return request. Our team will contact you on <strong>{phone}</strong> within 1–2 business days.
            </p>
            <Link href="/">
              <button style={{ marginTop: "2rem", padding: "0.8rem 2rem", background: "#111", color: "white", border: "none", fontWeight: "bold", cursor: "pointer", letterSpacing: "0.1em" }}>
                BACK TO STORE
              </button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
            <div>
              <label style={{ display: "block", fontWeight: "600", fontSize: "0.8rem", letterSpacing: "0.1em", marginBottom: "0.4rem" }}>FULL NAME *</label>
              <input
                type="text" required value={name} onChange={e => setName(e.target.value)}
                placeholder="Your name as used when ordering"
                style={{ width: "100%", padding: "0.8rem", border: "1px solid #ccc", fontSize: "0.95rem", boxSizing: "border-box" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontWeight: "600", fontSize: "0.8rem", letterSpacing: "0.1em", marginBottom: "0.4rem" }}>PHONE NUMBER *</label>
              <input
                type="tel" required value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="Your phone number used when ordering"
                style={{ width: "100%", padding: "0.8rem", border: "1px solid #ccc", fontSize: "0.95rem", boxSizing: "border-box" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontWeight: "600", fontSize: "0.8rem", letterSpacing: "0.1em", marginBottom: "0.4rem" }}>PRODUCT TO RETURN *</label>
              <select
                required value={productId} onChange={e => setProductId(e.target.value)}
                style={{ width: "100%", padding: "0.8rem", border: "1px solid #ccc", fontSize: "0.95rem" }}
              >
                <option value="">— Select the item you want to return —</option>
                {products.map(p => (
                  <option key={p.id} value={p.id.toString()}>{p.name} — Rs. {p.price?.toLocaleString()}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontWeight: "600", fontSize: "0.8rem", letterSpacing: "0.1em", marginBottom: "0.4rem" }}>QUANTITY</label>
              <input
                type="number" min="1" value={qty} onChange={e => setQty(e.target.value)}
                style={{ width: "100%", padding: "0.8rem", border: "1px solid #ccc", fontSize: "0.95rem", boxSizing: "border-box" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontWeight: "600", fontSize: "0.8rem", letterSpacing: "0.1em", marginBottom: "0.4rem" }}>REASON FOR RETURN</label>
              <select
                value={reason} onChange={e => setReason(e.target.value)}
                style={{ width: "100%", padding: "0.8rem", border: "1px solid #ccc", fontSize: "0.95rem" }}
              >
                <option value="">— Select a reason —</option>
                <option value="Wrong size">Wrong size</option>
                <option value="Defective / damaged item">Defective / damaged item</option>
                <option value="Wrong item received">Wrong item received</option>
                <option value="Changed my mind">Changed my mind</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {error && <p style={{ color: "red", fontSize: "0.85rem" }}>{error}</p>}

            <button
              type="submit" disabled={loading}
              style={{ padding: "1rem", background: loading ? "#ccc" : "#111", color: "white", border: "none", fontWeight: "bold", fontSize: "0.9rem", cursor: loading ? "not-allowed" : "pointer", letterSpacing: "0.15em", marginTop: "0.5rem" }}
            >
              {loading ? "SUBMITTING..." : "SUBMIT RETURN REQUEST"}
            </button>

            <p style={{ fontSize: "0.78rem", color: "#999", textAlign: "center", lineHeight: 1.5 }}>
              Returns are subject to our return policy. Items must be unused and returned within 7 days of delivery.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

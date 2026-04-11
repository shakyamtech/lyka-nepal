"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Profile() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [orders, setOrders] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const cName = localStorage.getItem("customerName");
    const cEmail = localStorage.getItem("customerEmail");
    if (!cEmail) {
      router.push("/login");
      return;
    }
    setName(cName || "");
    setEmail(cEmail);

    fetch(`/api/orders?email=${cEmail}`)
      .then(res => res.json())
      .then(data => setOrders(data));
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("customerName");
    localStorage.removeItem("customerEmail");
    router.push("/");
  };

  return (
    <div style={{ maxWidth: "800px", margin: "5rem auto", padding: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3rem", borderBottom: "1px solid var(--border)", paddingBottom: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "2.5rem" }}>My Profile</h1>
          <p style={{ color: "var(--text-muted)" }}>Welcome back, {name}</p>
        </div>
        <button onClick={handleLogout} style={{ padding: "0.5rem 1.5rem", border: "1px solid var(--border)", borderRadius: "40px", cursor: "pointer" }}>Logout</button>
      </div>

      <h2>Order History</h2>
      {orders.length === 0 ? (
        <p style={{ color: "var(--text-muted)", marginTop: "1rem" }}>You haven't placed any orders yet.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1rem" }}>
          {orders.map(o => (
            <div key={o.id} style={{ border: "1px solid var(--border)", padding: "1.5rem", borderRadius: "8px", background: "white" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
                <span><strong>Order #{o.id}</strong></span>
                <span style={{ color: "var(--text-muted)" }}>{new Date(o.date).toLocaleDateString()}</span>
              </div>
              <p style={{ color: "var(--text-muted)", marginBottom: "0.5rem" }}>{o.items.join(", ")}</p>
              <h3 style={{ color: "var(--primary)" }}>Total: NPR {o.total}</h3>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const action = isRegistering ? "REGISTER" : "LOGIN";
    
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, name, email, password })
    });
    
    const data = await res.json();
    
    if (res.ok) {
      localStorage.setItem("customerName", data.user.name);
      localStorage.setItem("customerEmail", data.user.email);
      router.push("/profile");
    } else {
      alert(data.error);
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "10rem auto", padding: "2rem", border: "1px solid var(--border)", borderRadius: "8px", background: "white" }}>
      <h2 style={{ marginBottom: "1.5rem", textAlign: "center" }}>{isRegistering ? "Sign Up" : "Customer Login"}</h2>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {isRegistering && <input type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} required style={{ padding: "0.8rem", border: "1px solid var(--border)", borderRadius: "4px" }} />}
        <input type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} required style={{ padding: "0.8rem", border: "1px solid var(--border)", borderRadius: "4px" }} />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required style={{ padding: "0.8rem", border: "1px solid var(--border)", borderRadius: "4px" }} />
        <button type="submit" style={{ padding: "1rem", background: "var(--foreground)", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>{isRegistering ? "Create Account" : "Login"}</button>
      </form>
      <p style={{ textAlign: "center", marginTop: "1rem", cursor: "pointer", color: "var(--text-muted)" }} onClick={() => setIsRegistering(!isRegistering)}>
        {isRegistering ? "Already have an account? Login." : "Don't have an account? Sign up."}
      </p>
    </div>
  );
}

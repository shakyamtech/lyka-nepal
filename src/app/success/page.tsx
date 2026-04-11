"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import "../globals.css";

function ReceiptContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const total = searchParams.get("total");

  return (
    <div className="container receipt-container" style={{ textAlign: "center", padding: "5rem 2rem", minHeight: "80vh" }}>
      <h1 className="no-print" style={{ fontSize: "3rem", color: "#16a34a", marginBottom: "1rem" }}>Payment Successful!</h1>
      <h1 className="only-print" style={{ display: "none", fontSize: "2rem", marginBottom: "1rem" }}>LYKA Nepal Receipt</h1>
      <p style={{ fontSize: "1.2rem", marginBottom: "2rem" }}>
        Thank you for your purchase. Please keep this receipt for your records.
      </p>
      
      <div className="receipt-box" style={{ background: "#f9fafb", border: "1px solid #e2e8f0", padding: "2rem", borderRadius: "8px", display: "inline-block", textAlign: "left", marginBottom: "3rem", minWidth: "350px" }}>
        <h3 style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: "1rem", marginBottom: "1rem" }}>Order summary</h3>
        <p><strong>Order ID:</strong> {orderId || "TEST-ORDER-123"}</p>
        <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
        <p><strong>Total Paid:</strong> NPR {total || "0"}</p>
        <p><strong>Status:</strong> Paid</p>
        <br/>
        <p style={{ fontSize: "0.85rem", color: "#666", borderTop: "1px solid #e2e8f0", paddingTop: "1rem" }}>LYKA Nepal - Imadole, Lalitpur<br/>shop@lykanepal.com | +977 1234567890</p>
      </div>

      <br />
      <div className="no-print" style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
        <button onClick={() => window.print()} style={{ padding: "1rem 2rem", background: "var(--foreground)", color: "white", borderRadius: "4px", fontWeight: "bold", border: "none", cursor: "pointer" }}>
          Download Receipt (PDF)
        </button>
        <Link href="/" style={{ padding: "1rem 2rem", background: "var(--primary)", color: "white", borderRadius: "4px", fontWeight: "bold" }}>
          Return to Shop
        </Link>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: "center", padding: "10rem" }}>Loading receipt...</div>}>
      <ReceiptContent />
    </Suspense>
  );
}

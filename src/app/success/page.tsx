"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect } from "react";
import "../globals.css";

function ReceiptContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const total = searchParams.get("total");
  const isPending = searchParams.get("status") === "pending";

  const [dateStr, setDateStr] = useState("");
  const [liveStatus, setLiveStatus] = useState<string | null>(null);

  useEffect(() => {
    setDateStr(new Date().toLocaleDateString());
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPending && liveStatus !== 'Verified' && liveStatus !== 'Rejected' && orderId) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/orders/check?id=${orderId}`);
          if (res.ok) {
            const data = await res.json();
            if (data.status === 'Verified' || data.status === 'Rejected') {
              setLiveStatus(data.status);
            }
          }
        } catch (e) {}
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isPending, liveStatus, orderId]);

  let displayStatus = liveStatus;
  if (!displayStatus) {
    displayStatus = isPending ? "Pending Verification" : "Verified";
  }

  return (
    <div className="container receipt-container" style={{ textAlign: "center", padding: "5rem 2rem", minHeight: "80vh" }}>
      {displayStatus === 'Rejected' ? (
        <>
          <h1 className="no-print" style={{ fontSize: "3rem", color: "#ef4444", marginBottom: "1rem" }}>
            Payment Rejected
          </h1>
          <p style={{ fontSize: "1.2rem", marginBottom: "2rem", color: "#ef4444" }}>
            Unfortunately, we could not verify your payment screenshot. Your order has not been completed. Please contact customer support.
          </p>
        </>
      ) : (
        <>
          <h1 className="no-print" style={{ fontSize: "2.5rem", color: "#16a34a", marginBottom: "1rem" }}>
            {displayStatus === 'Pending Verification' ? "Order Received!" : "Payment Successful!"}
          </h1>
          <p style={{ fontSize: "1.1rem", marginBottom: "2rem", color: "var(--text-muted)" }}>
            {displayStatus === 'Pending Verification' 
              ? "Your payment is currently being reviewed by our team. Please wait."
              : "Thank you for trusting us! We will call you quickly to confirm shipping details."}
          </p>
        </>
      )}

      <h1 className="only-print" style={{ display: "none", fontSize: "2rem", marginBottom: "1rem" }}>LYKA Nepal Receipt</h1>
      
      <div className="receipt-box" style={{ background: "#f9fafb", border: "1px solid #e2e8f0", padding: "2rem", borderRadius: "8px", display: "inline-block", textAlign: "left", marginBottom: "3rem", minWidth: "350px" }}>
        <h3 style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: "1rem", marginBottom: "1rem" }}>Order summary</h3>
        <p><strong>Order ID:</strong> {orderId || "TEST-ORDER-123"}</p>
        <p><strong>Date:</strong> {dateStr}</p>
        <p><strong>Total:</strong> NPR {total || "0"}</p>
        <p><strong>Status:</strong> <span style={{ color: displayStatus === 'Rejected' ? '#ef4444' : displayStatus === 'Verified' ? '#16a34a' : '#b45309', fontWeight: 'bold' }}>{displayStatus === 'Verified' ? "Paid & Verified" : displayStatus}</span></p>
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

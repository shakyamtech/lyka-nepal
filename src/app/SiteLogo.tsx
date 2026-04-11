"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function SiteLogo() {
  const [imageError, setImageError] = useState(false);
  const [logoUrl, setLogoUrl] = useState("/logo.png"); // Default to local public/logo.png

  useEffect(() => {
    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (baseUrl) {
      // We try the Supabase one first, fallback happens via onError
      setLogoUrl(`${baseUrl}/storage/v1/object/public/site-assets/logo.png?v=${Date.now()}`);
    }
  }, []);

  return (
    <Link href="/" className="logo" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
      {!imageError ? (
        <img 
          src={logoUrl} 
          alt="LYKA Nepal" 
          style={{ maxHeight: "40px", width: "auto", objectFit: "contain" }}
          onError={(e) => {
            if (logoUrl !== "/logo.png") {
              // If the Supabase one failed, try the local one
              setLogoUrl("/logo.png");
            } else {
              // If local one also fails, show text
              setImageError(true);
            }
          }}
        />
      ) : (
        <span style={{ fontSize: "1.8rem", fontWeight: "800", letterSpacing: "0.1em" }}>
            LYKA <span style={{ color: "var(--primary)", fontWeight: "300" }}>Nepal</span>
        </span>
      )}
    </Link>
  );
}

"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";

export default function SiteLogo() {
  const [imageError, setImageError] = useState(false);
  const [logoUrl, setLogoUrl] = useState(""); 
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (baseUrl) {
      setLogoUrl(`${baseUrl}/storage/v1/object/public/site-assets/logo.png?v=${Date.now()}`);
    } else {
      setLogoUrl("/logo.png");
    }
    setIsReady(true);
  }, []);

  if (!isReady) return <span style={{ fontSize: "1.8rem", fontWeight: "800" }}>LYKA</span>;

  return (
    <Link href="/" className="logo" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
      {!imageError ? (
        <div style={{ position: 'relative', height: '40px', width: '120px', border: '1px solid #000', padding: '0.2rem' }}>
          <Image 
            src={logoUrl || "/logo.png"} 
            alt="LYKA Nepal" 
            fill
            style={{ objectFit: 'contain', objectPosition: 'center' }}
            unoptimized={true} 
            onError={() => {
              if (logoUrl && !logoUrl.includes("/logo.png")) {
                setLogoUrl("/logo.png");
              } else {
                setImageError(true);
              }
            }}
          />
        </div>
      ) : (
        <div style={{ 
          background: "transparent", 
          color: "#000", 
          border: "1px solid #000",
          padding: "0.3rem 0.6rem", 
          fontWeight: "400", 
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          display: "flex",
          justifyContent: "center",
          alignItems: "center"
        }}>
          <span className="desktop-logo-text" style={{ fontSize: "1.2rem", whiteSpace: "nowrap" }}>LYKA NEPAL</span>
          <span className="mobile-logo-text" style={{ fontSize: "0.9rem", whiteSpace: "nowrap" }}>LYKA NEPAL</span>
        </div>
      )}
    </Link>
  );
}

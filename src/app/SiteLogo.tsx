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
        <div style={{ position: 'relative', height: '40px', width: '120px' }}>
          <Image 
            src={logoUrl || "/logo.png"} 
            alt="LYKA Nepal" 
            fill
            style={{ objectFit: 'contain', objectPosition: 'left' }}
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
        <span style={{ fontSize: "1.8rem", fontWeight: "800", letterSpacing: "0.1em" }}>
            LYKA <span style={{ color: "var(--primary)", fontWeight: "300" }}>Nepal</span>
        </span>
      )}
    </Link>
  );
}

"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function ProfileNav() {
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    // Check every second to keep nav in sync without Redux/Context overhead
    const interval = setInterval(() => {
      setHasProfile(!!localStorage.getItem("customerEmail"));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Link href={hasProfile ? "/profile" : "/login"} style={{ color: "var(--foreground)", textDecoration: "none", fontWeight: "bold" }}>
      {hasProfile ? "My Profile" : "Login"}
    </Link>
  );
}

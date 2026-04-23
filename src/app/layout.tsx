import type { Metadata } from "next";
import Link from "next/link";
import SiteLogo from "./SiteLogo";
import Navigation from "./Navigation";
import FloatingContact from "./FloatingContact";
import "./globals.css";


export const metadata: Metadata = {
  title: "LYKA Nepal | Premium Women's Clothing, Bags & Accessories & Shoes in Imadole",
  description: "Shop the latest trends in women's fashion at LYKA Nepal. Discover our premium collection of clothes, bags, and shoes located in Imadole.",
  keywords: "LYKA Nepal, women clothing, bags, shoes, fashion, Imadole, Kathmandu fashion, online shopping Nepal",
  openGraph: {
    title: "LYKA Nepal | Premier Fashion Destination",
    description: "Your go-to store in Imadole for beautifully crafted women's clothing, elegant bags, and premium shoes.",
    url: "https://lyka-nepal.example.com",
    siteName: "LYKA Nepal",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630 }],
    locale: "en_NP",
    type: "website",
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/logo.png",
  },
};

import ClientLayout from "@/components/ClientLayout";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "ClothingStore",
              "name": "LYKA Nepal",
              "image": "https://lyka-nepal.example.com/logo.png",
              "@id": "https://lyka-nepal.example.com",
              "url": "https://lyka-nepal.example.com",
              "telephone": "+9771234567890",
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "Imadole",
                "addressLocality": "Lalitpur",
                "postalCode": "44700",
                "addressCountry": "NP"
              },
              "openingHoursSpecification": {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": [
                  "Monday",
                  "Tuesday",
                  "Wednesday",
                  "Thursday",
                  "Friday",
                  "Saturday",
                  "Sunday"
                ],
                "opens": "10:00",
                "closes": "20:00"
              }
            })
          }}
        />
      </head>
      <body>
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}

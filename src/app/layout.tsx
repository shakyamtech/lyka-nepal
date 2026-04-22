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
        <Navigation />
        <main>{children}</main>
        <FloatingContact />
        <footer className="main-footer">
          <div className="container">
            <div className="footer-branding">
              <div className="footer-logo-wrap">
                <SiteLogo />
              </div>
              <p style={{ marginTop: '1.5rem' }}>
                Premium Women&apos;s Fashion.<br />
                Curated styles for the modern woman.
              </p>
            </div>
            <div>
              <h3>Visit Us</h3>
              <address>
                Imadole, Patan<br />
                Lalitpur, Nepal<br />
                Open 10am – 8pm daily
              </address>
            </div>
            <div>
              <h3>Contact</h3>
              <p><a href="mailto:shop@lykanepal.com" style={{ color: '#aaa' }}>shop@lykanepal.com</a></p>
              <p><a href="tel:+9779762850637" style={{ color: '#aaa' }}>+977 9762850637</a></p>
            </div>
            <div>
              <h3>Shop</h3>
              <p><Link href="/?category=Clothes#collection" style={{ color: '#aaa', display: 'block', marginBottom: '0.4rem', textDecoration: 'none' }}>Clothes</Link></p>
              <p><Link href="/?category=Bags%20%26%20Accessories#collection" style={{ color: '#aaa', display: 'block', marginBottom: '0.4rem', textDecoration: 'none' }}>Bags &amp; Accessories</Link></p>
              <p><Link href="/?category=Shoes#collection" style={{ color: '#aaa', display: 'block', marginBottom: '0.4rem', textDecoration: 'none' }}>Shoes</Link></p>
            </div>
            <div className="footer-customer-care">
              <h3>Customer Care</h3>
              <p style={{ color: '#aaa', marginBottom: '1rem', lineHeight: '1.4' }}>
                We prioritize customer care, and we are here to help YOU.
              </p>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', marginBottom: '1.5rem' }}>
                <a href="https://www.facebook.com/lykanepal" target="_blank" rel="noopener noreferrer" style={{ color: '#fff' }} aria-label="Facebook">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                </a>
                <a href="https://www.instagram.com/lykanepal/" target="_blank" rel="noopener noreferrer" style={{ color: '#fff' }} aria-label="Instagram">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                </a>
                <a href="https://www.tiktok.com/@lyka.nepal" target="_blank" rel="noopener noreferrer" style={{ color: '#fff' }} aria-label="TikTok">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"></path></svg>
                </a>
                <a href="https://www.youtube.com/@lykanepal" target="_blank" rel="noopener noreferrer" style={{ color: '#fff' }} aria-label="YouTube">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon></svg>
                </a>
              </div>
              <p><Link href="/request-return" style={{ color: '#aaa', display: 'block', marginBottom: '0.4rem', textDecoration: 'none' }}>Returns &amp; Exchanges</Link></p>
              <p><Link href="/shipping" style={{ color: '#aaa', display: 'block', marginBottom: '0.4rem', textDecoration: 'none' }}>Shipping Information</Link></p>
              <p><Link href="/size-guide" style={{ color: '#aaa', display: 'block', marginBottom: '0.4rem', textDecoration: 'none' }}>Size Guide</Link></p>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; {new Date().getFullYear()} LYKA Nepal. All rights reserved.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}

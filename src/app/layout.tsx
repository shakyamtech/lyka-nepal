import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LYKA Nepal | Premium Women's Clothing, Bags & Shoes in Imadole",
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <header className="main-header">
          <div className="container">
            <div className="logo">LYKA <span>Nepal</span></div>
            <nav className="main-nav">
              <a href="#clothes">Clothes</a>
              <a href="#bags">Bags</a>
              <a href="#shoes">Shoes</a>
              <a href="#cart" className="cart-link">Cart (0)</a>
            </nav>
          </div>
        </header>
        <main>{children}</main>
        <footer className="main-footer">
          <div className="container">
            <div>
              <h3>LYKA Nepal</h3>
              <p>Premium Women's Fashion.</p>
            </div>
            <div>
              <h3>Visit Us</h3>
              <address>
                Imadole,<br />
                Patan, Lalitpur<br />
                Nepal
              </address>
            </div>
            <div>
              <h3>Contact</h3>
              <p>Email: shop@lykanepal.com</p>
              <p>Phone: +977 1234567890</p>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; {new Date().getFullYear()} LYKA Nepal. All rights reserved. SEO Optimized.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}

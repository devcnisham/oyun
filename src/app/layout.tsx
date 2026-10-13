import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import { headers } from "next/headers";
import ConsentManager from "@/components/consent/ConsentManager";
import NavTracker from "@/components/NavTracker";
import BottomNav from "@/components/BottomNav";
import AuthProvider from "@/components/AuthProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "OYUN | Book Sports Turfs & Courts in Mangalore Online",
    template: "%s | OYUN",
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: ["turf booking Mangalore", "football turf Mangalore", "box cricket Mangalore", "badminton court Mangalore", "pickleball Mangalore", "book turf near me", "sports court booking"],
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: SITE_NAME,
    url: "/",
    title: "OYUN | Book Sports Turfs & Courts in Mangalore Online",
    description: SITE_DESCRIPTION,
  },
  twitter: { card: "summary_large_image" },
  appleWebApp: { capable: true, title: SITE_NAME, statusBarStyle: "default" },
  formatDetection: { telephone: false },
  ...(process.env.GOOGLE_SITE_VERIFICATION ? { verification: { google: process.env.GOOGLE_SITE_VERIFICATION } } : {}),
};

// Phones: draw under the notch and colour the browser bar like the app
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#d31027",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Opt into dynamic rendering so the per-request CSP nonce from proxy is applied to scripts
  await headers();
  return (
    <html lang="en-IN" className={inter.variable}>
      <head />
      <body>
        <AuthProvider>
        {children}
        <BottomNav />
        <ConsentManager />
        <NavTracker />
        </AuthProvider>
      </body>
    </html>
  );
}

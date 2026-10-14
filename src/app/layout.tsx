import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import ConsentManager from "@/components/consent/ConsentManager";
import NavTracker from "@/components/NavTracker";
import BottomNav from "@/components/BottomNav";
import AuthProvider from "@/components/AuthProvider";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

// Inter's Latin-Extended file is 85 KB and the only reason a page asks for it is the rupee sign (U+20B9).
// This is that one glyph cut from the same Inter file (1 KB), listed ahead of Inter so the big file is never fetched.
const rupee = localFont({
  src: "./fonts/inter-rupee.woff2",
  weight: "100 900",
  variable: "--font-rupee",
  display: "swap",
  adjustFontFallback: false,
  declarations: [{ prop: "unicode-range", value: "U+20B9" }],
});

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-IN" className={`${rupee.variable} ${inter.variable}`}>
      <body>
        <AuthProvider>
        {children}
        <BottomNav />
        <ConsentManager />
        <NavTracker />
        <ServiceWorkerRegister />
        </AuthProvider>
      </body>
    </html>
  );
}

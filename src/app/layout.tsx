import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";


export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "OYUN | Book Football Turfs in Mangalore Online",
    template: "%s | OYUN",
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: ["football turf Mangalore", "turf booking", "book turf near me", "5-a-side turf", "7-a-side football", "box cricket Mangalore", "sports arena booking"],
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: SITE_NAME,
    url: "/",
    title: "OYUN | Book Football Turfs in Mangalore Online",
    description: SITE_DESCRIPTION,
  },
  twitter: { card: "summary_large_image" },
  appleWebApp: { capable: true, title: SITE_NAME, statusBarStyle: "default" },
  icons: {
    icon: [{ url: "/oyun-icon-64.png", sizes: "64x64", type: "image/png" }],
    apple: [{ url: "/oyun-icon-192.png", sizes: "192x192", type: "image/png" }],
  },
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
    <html lang="en-IN">
      <body>
        {children}
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import "./globals.css";


export const metadata: Metadata = {
  title: "OYUN — Premium Turf Booking Platform",
  description:
    "Discover and book premium football turfs near you. Find the perfect pitch, choose your time slot, and play. Starting in Mangalore and expanding soon.",
  keywords: "football turf booking, turf rental, slot arena, book football pitch, sports arena",
  openGraph: {
    title: "OYUN — Premium Turf Booking Platform",
    description: "Book premium football turfs instantly. Real-time availability and easy bookings.",
    type: "website",
    locale: "en_IN",
  },
  applicationName: "OYUN",
  appleWebApp: { capable: true, title: "OYUN", statusBarStyle: "default" },
  icons: {
    icon: [{ url: "/oyun-icon-64.png", sizes: "64x64", type: "image/png" }],
    apple: [{ url: "/oyun-icon-192.png", sizes: "192x192", type: "image/png" }],
  },
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
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";
import MobileBottomBar from "@/components/MobileBottomBar";


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
        <MobileBottomBar />
      </body>
    </html>
  );
}

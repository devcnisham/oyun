import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { connection } from "next/server";
import { getSiteContent } from "@/lib/queries";

export default async function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await connection(); // announcement can change at any time
  const site = getSiteContent();
  return (
    <>
      {site.announcementActive && site.announcement && (
        <div
          role="status"
          className="noPrint"
          style={{ background: "#111", color: "#fff", textAlign: "center", fontSize: 14, fontWeight: 600, padding: "10px 16px" }}
        >
          {site.announcement}
        </div>
      )}
      <Navbar />
      <main>{children}</main>
      <Footer />
    </>
  );
}

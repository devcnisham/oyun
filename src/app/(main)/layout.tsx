import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FloatingSearch from "@/components/FloatingSearch";
import { connection } from "next/server";
import { getSettings, getSiteContent, listAreas, listPublicTurfs } from "@/lib/queries";

export default async function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await connection(); // announcement can change at any time
  const site = await getSiteContent();
  const settings = await getSettings();
  const areas = listAreas(await listPublicTurfs());
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
      <Navbar areas={areas} />
      <main className="appMain">{children}</main>
      <Footer areas={areas} supportEmail={settings.supportEmail} />
      <FloatingSearch areas={areas} />
    </>
  );
}

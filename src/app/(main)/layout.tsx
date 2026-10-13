import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getSettings, getSiteContent, listAreas, listPublicTurfs } from "@/lib/queries";

export const revalidate = 60;

export default async function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
      <Navbar />
      <main className="appMain">{children}</main>
      <Footer areas={areas} supportEmail={settings.supportEmail} />
    </>
  );
}

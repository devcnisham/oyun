import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getSettings, getSiteContent } from "@/lib/queries";

export default async function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const site = await getSiteContent();
  const settings = await getSettings();
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
      <Footer supportEmail={settings.supportEmail} />
    </>
  );
}

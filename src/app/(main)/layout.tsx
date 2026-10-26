import Breadcrumbs from '@/modules/web/frontend/Breadcrumbs';
import breadcrumbStyles from '@/modules/web/frontend/Breadcrumbs.module.css';
import { GUIDES } from '@/modules/web/lib/guides-content';
import Navbar from "@/modules/web/frontend/Navbar";
import AppBar from "@/modules/web/frontend/AppBar";
import Footer from "@/modules/web/frontend/Footer";
import { getSettings, getSiteContent } from "@/modules/web/database/queries";

export default async function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const site = await getSiteContent();
  const settings = await getSettings();
  return (
    <div className="playerRoot">
      {site.announcementActive && site.announcement && (
        <div
          role="status"
          className="noPrint"
          style={{ background: "var(--bg-inverse)", color: "#fff", textAlign: "center", fontSize: 14, fontWeight: 600, padding: "10px 16px" }}
        >
          {site.announcement}
        </div>
      )}
      <a href="#main" className="skipLink">Skip to main content</a>
      <Navbar />
      <AppBar />
      <main id="main" tabIndex={-1} className="appMain"><Breadcrumbs guideCategories={Object.fromEntries(GUIDES.map(g => [g.slug, g.category]))} /><div className={breadcrumbStyles.content}>{children}</div></main>
      <Footer supportEmail={settings.supportEmail} />
    </div>
  );
}

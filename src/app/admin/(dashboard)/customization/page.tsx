import Image from 'next/image';
import Link from 'next/link';
import ActionForm from '@/components/dash/ActionForm';
import { PageHeader, dash } from '@/components/dash/ui';
import { deletePromoCard, savePromoCard, saveSiteContent } from '@/lib/admin-actions';
import { getDb } from '@/lib/store';

export default async function AdminCustomization() {
  const site = (await getDb()).site;

  return (
    <div className={dash.page}>
      <PageHeader title="Homepage content" desc="Change what visitors see on the public site. Changes go live immediately.">
        <Link href="/" target="_blank" className={`${dash.btn} ${dash.btnSecondary}`}>Open homepage</Link>
      </PageHeader>

      <div className={dash.card}>
        <div className={dash.cardHeader}><h2 className={dash.cardTitle}>Hero & announcement</h2></div>
        <ActionForm action={saveSiteContent}>
          <label className={dash.field}>
            <span className={dash.label}>Hero headline</span>
            <input name="heroTitle" defaultValue={site.heroTitle} required maxLength={120} className={dash.input} />
          </label>
          <label className={dash.field}>
            <span className={dash.label}>Announcement bar text</span>
            <input name="announcement" defaultValue={site.announcement} maxLength={160} className={dash.input} />
          </label>
          <label className={dash.check}><input type="checkbox" name="announcementActive" defaultChecked={site.announcementActive} /> Show the announcement bar on every public page</label>
          <div className={dash.actions}><button className={dash.btn}>Save</button></div>
        </ActionForm>
      </div>

      <div className={dash.card}>
        <div className={dash.cardHeader}>
          <div>
            <h2 className={dash.cardTitle}>Promo carousel</h2>
            <p className={dash.cardDesc}>Images: a file in /public (e.g. /turfs/turf_2.jpg) or an images.unsplash.com link.</p>
          </div>
        </div>
        <div className={dash.list}>
          {site.promos.map((p) => (
            <div key={p.id} className={dash.listItem} style={{ flexWrap: 'wrap' }}>
              <Image src={p.image} alt="" width={96} height={60} className={dash.imageThumb} style={{ width: 96, height: 60 }} unoptimized={!p.image.startsWith('/') && !p.image.startsWith('https://images.unsplash.com/')} />
              <ActionForm action={savePromoCard} inline>
                <input type="hidden" name="promoId" value={p.id} />
                <input name="title" defaultValue={p.title} required className={dash.input} style={{ width: 180 }} aria-label="Title" />
                <input name="subtitle" defaultValue={p.subtitle} required className={dash.input} style={{ width: 260 }} aria-label="Subtitle" />
                <input name="image" defaultValue={p.image} required className={dash.input} style={{ width: 220 }} aria-label="Image link" />
                <button className={`${dash.btn} ${dash.btnSecondary} ${dash.btnSm}`}>Save</button>
              </ActionForm>
              <ActionForm action={deletePromoCard} inline confirm="Remove this promo card?">
                <input type="hidden" name="promoId" value={p.id} />
                <button className={`${dash.btn} ${dash.btnDanger} ${dash.btnSm}`}>Remove</button>
              </ActionForm>
            </div>
          ))}
        </div>

        <h3 className={dash.cardTitle} style={{ margin: '20px 0 12px' }}>Add a card</h3>
        <ActionForm action={savePromoCard} resetOnSuccess>
          <div className={dash.formGrid}>
            <label className={dash.field}>
              <span className={dash.label}>Title</span>
              <input name="title" required maxLength={60} className={dash.input} />
            </label>
            <label className={dash.field}>
              <span className={dash.label}>Subtitle</span>
              <input name="subtitle" required maxLength={120} className={dash.input} />
            </label>
            <label className={dash.field}>
              <span className={dash.label}>Image link</span>
              <input name="image" required defaultValue="/turfs/turf_1.jpg" className={dash.input} />
            </label>
          </div>
          <div className={dash.actions}><button className={dash.btn}>Add card</button></div>
        </ActionForm>
      </div>
    </div>
  );
}

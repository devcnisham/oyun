import Image from 'next/image';
import Link from 'next/link';
import ActionForm from '@/modules/shared/frontend/dash/ActionForm';
import { PageHeader, dash } from '@/modules/shared/frontend/dash/ui';
import { deletePromoCard, deleteSponsorAd, savePromoCard, saveSiteContent, saveSponsorAd } from '@/modules/admin/backend/admin-actions';
import { MAX_SPONSOR_ADS } from '@/modules/shared/lib/validation/site-content';
import { getDb } from '@/modules/shared/database/store';
import styles from './customization.module.css';

export default async function AdminCustomization() {
  const site = (await getDb()).site;

  return (
    <div className={dash.page}>
      <PageHeader title="Homepage content" desc="Change what visitors see on the public site. Changes go live immediately.">
        <Link href="/" className={`${dash.btn} ${dash.btnSecondary}`}>Open homepage</Link>
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
            <p className={dash.cardDesc}>Images: a file in /public (e.g. /venues/turf_2.jpg) or an images.unsplash.com link.</p>
          </div>
        </div>
        <div className={styles.cards}>
          {site.promos.map((p) => (
            <div key={p.id} className={styles.card}>
              <div className={styles.preview}>
                <Image src={p.image} alt="" fill sizes="320px" unoptimized={!p.image.startsWith('/') && !p.image.startsWith('https://images.unsplash.com/')} />
                <div className={styles.previewShade}>
                  <span className={styles.previewTitle}>{p.title}</span>
                </div>
              </div>
              <div className={styles.body}>
                <ActionForm action={savePromoCard}>
                  <input type="hidden" name="promoId" value={p.id} />
                  <div className={styles.fields}>
                    <label><span>Title</span><input name="title" defaultValue={p.title} required maxLength={60} className={dash.input} /></label>
                    <label><span>Subtitle</span><input name="subtitle" defaultValue={p.subtitle} required maxLength={120} className={dash.input} /></label>
                    <label><span>Image link</span><input name="image" defaultValue={p.image} required className={dash.input} /></label>
                  </div>
                  <div className={styles.footer}>
                    <button className={`${dash.btn} ${dash.btnSecondary} ${dash.btnSm}`}>Save changes</button>
                  </div>
                </ActionForm>
                <ActionForm action={deletePromoCard} inline confirm="Remove this promo card?">
                  <input type="hidden" name="promoId" value={p.id} />
                  <button className={`${dash.btn} ${dash.btnDanger} ${dash.btnSm}`}>Remove</button>
                </ActionForm>
              </div>
            </div>
          ))}
        </div>

        <h3 className={styles.sectionTitle}>Add a card</h3>
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
      <div className={dash.card}>
        <div className={dash.cardHeader}>
          <div>
            <h2 className={dash.cardTitle}>Sponsor ads</h2>
            <p className={dash.cardDesc}>
              The scrolling ad strip on the desktop home page. Only add sponsors who have actually agreed to advertise; the strip is
              hidden while this list is empty. Each card is labelled &ldquo;Sponsored&rdquo;. Up to {MAX_SPONSOR_ADS} ads. Link (optional): an
              https:// address or a path on this site.
            </p>
          </div>
        </div>
        {site.ads.length === 0 ? (
          <p className={dash.empty}>No sponsor ads. The strip is hidden on the home page.</p>
        ) : (
          <div className={styles.cards}>
            {site.ads.map((a) => (
              <div key={a.id} className={styles.card}>
                <div className={styles.preview}>
                  <Image src={a.image} alt="" fill sizes="320px" unoptimized={!a.image.startsWith('/') && !a.image.startsWith('https://images.unsplash.com/')} />
                  <div className={styles.previewShade}>
                    <span className={styles.previewBrand}>{a.brand} · Sponsored</span>
                    <span className={styles.previewTitle}>{a.title}</span>
                  </div>
                </div>
                <div className={styles.body}>
                  <ActionForm action={saveSponsorAd}>
                    <input type="hidden" name="adId" value={a.id} />
                    <div className={styles.fields}>
                      <div className={styles.row2}>
                        <label><span>Sponsor name</span><input name="brand" defaultValue={a.brand} required maxLength={40} className={dash.input} /></label>
                        <label><span>Headline</span><input name="title" defaultValue={a.title} required maxLength={60} className={dash.input} /></label>
                      </div>
                      <label><span>Text</span><input name="subtitle" defaultValue={a.subtitle} required maxLength={120} className={dash.input} /></label>
                      <label><span>Image link</span><input name="image" defaultValue={a.image} required className={dash.input} /></label>
                      <label><span>Link (optional)</span><input name="link" defaultValue={a.link} placeholder="https://… or /path" className={dash.input} /></label>
                    </div>
                    <div className={styles.footer}>
                      <button className={`${dash.btn} ${dash.btnSecondary} ${dash.btnSm}`}>Save changes</button>
                    </div>
                  </ActionForm>
                  <ActionForm action={deleteSponsorAd} inline confirm="Remove this ad?">
                    <input type="hidden" name="adId" value={a.id} />
                    <button className={`${dash.btn} ${dash.btnDanger} ${dash.btnSm}`}>Remove</button>
                  </ActionForm>
                </div>
              </div>
            ))}
          </div>
        )}

        {site.ads.length < MAX_SPONSOR_ADS && (
          <>
            <h3 className={styles.sectionTitle}>Add an ad</h3>
            <ActionForm action={saveSponsorAd} resetOnSuccess>
              <div className={dash.formGrid}>
                <label className={dash.field}>
                  <span className={dash.label}>Sponsor name</span>
                  <input name="brand" required maxLength={40} className={dash.input} />
                </label>
                <label className={dash.field}>
                  <span className={dash.label}>Headline</span>
                  <input name="title" required maxLength={60} className={dash.input} />
                </label>
                <label className={dash.field}>
                  <span className={dash.label}>Text</span>
                  <input name="subtitle" required maxLength={120} className={dash.input} />
                </label>
                <label className={dash.field}>
                  <span className={dash.label}>Image link</span>
                  <input name="image" required placeholder="/turfs/turf_1.jpg" className={dash.input} />
                </label>
                <label className={dash.field}>
                  <span className={dash.label}>Link (optional)</span>
                  <input name="link" placeholder="https://…" className={dash.input} />
                </label>
              </div>
              <div className={dash.actions}><button className={dash.btn}>Add ad</button></div>
            </ActionForm>
          </>
        )}
      </div>
    </div>
  );
}

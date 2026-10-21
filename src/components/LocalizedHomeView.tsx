import Link from 'next/link';
import JsonLd from '@/components/JsonLd';
import { LOCALIZED, type LocalizedCode } from '@/lib/localized-home';
import { listAreas, listPublicTurfs } from '@/lib/queries';
import { breadcrumbSchema, faqSchema } from '@/lib/schema';
import { isIndexableTurf } from '@/lib/seo';
import { areaSlug } from '@/lib/site';
import styles from '../app/(main)/turfs/[area]/page.module.css';

export default async function LocalizedHomeView({ code }: { code: LocalizedCode }) {
  const c = LOCALIZED[code];
  const turfs = (await listPublicTurfs()).filter(isIndexableTurf);
  const areas = listAreas(turfs).filter((a) => a !== 'Mangalore');

  return (
    <div className={`container ${styles.page}`} lang={c.htmlLang}>
      <JsonLd data={[breadcrumbSchema([{ name: 'OYUN', path: '/' }, { name: c.h1, path: `/${code}` }]), faqSchema(c.faqs)]} />
      <h1 className={styles.title}>{c.h1}</h1>
      <p className={styles.lead}>{c.lead}</p>
      <p>
        <Link href="/arenas" className={styles.areaLink} lang="en">{c.cta}</Link>
      </p>

      <section aria-labelledby="steps-heading">
        <h2 id="steps-heading" className={styles.h2}>{c.stepsHeading}</h2>
        <ol>
          {c.steps.map((s) => (
            <li key={s.title}>
              <strong>{s.title}.</strong> {s.text}
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="sports-heading">
        <h2 id="sports-heading" className={styles.h2}>{c.sportsHeading}</h2>
        <div className={styles.areas}>
          {c.sports.map((s) => (
            <Link key={s.slug} href={`/sports/${s.slug}`} className={styles.areaLink}>{s.label}</Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="areas-heading">
        <h2 id="areas-heading" className={styles.h2}>{c.areasHeading}</h2>
        <div className={styles.areas}>
          {areas.map((a) => (
            <Link key={a} href={`/turfs/${areaSlug(a)}`} className={styles.areaLink} lang="en">{a}</Link>
          ))}
        </div>
        <p>{c.englishNote}</p>
      </section>

      <section aria-labelledby="faq-heading">
        <h2 id="faq-heading" className={styles.h2}>{c.faqHeading}</h2>
        {c.faqs.map((f) => (
          <div key={f.q}>
            <h3>{f.q}</h3>
            <p>{f.a}</p>
          </div>
        ))}
      </section>
    </div>
  );
}

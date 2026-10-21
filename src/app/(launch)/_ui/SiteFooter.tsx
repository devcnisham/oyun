import Link from 'next/link';
import { SITE_CITY } from '@/lib/site';
import BrandMark from '@/components/BrandMark';
import { BROWSE_URL, HELP_URL } from './links';
import styles from './site.module.css';

export default function SiteFooter({ supportEmail }: { supportEmail: string }) {
  return (
    <footer className={styles.footer}>
      <div className={styles.footWrap}>
        <div className={styles.footGrid}>
          <div className={styles.footBrand}>
            <span className={styles.footName}><BrandMark size={32} />OYUN</span>
            <p>Venue booking for {SITE_CITY}. See what is open, hold the hours you want, and walk in with a ticket.</p>
          </div>
          <nav className={styles.footCol} aria-label="Explore">
            <h2>Explore</h2>
            <ul>
              <li><a href={BROWSE_URL}>Browse &amp; book</a></li>
              <li><Link href="/#sports">Sports</Link></li>
              <li><Link href="/#how">How it works</Link></li>
              <li><Link href="/countdown">Launch countdown</Link></li>
            </ul>
          </nav>
          <nav className={styles.footCol} aria-label="For venue owners">
            <h2>For venue owners</h2>
            <ul>
              <li><Link href="/#owners">List your venue</Link></li>
              <li><a href="https://partner.oyun.co.in/partner/login">Partner login</a></li>
              <li><a href={`mailto:${supportEmail}`}>Contact us</a></li>
            </ul>
          </nav>
          <nav className={styles.footCol} aria-label="Help and legal">
            <h2>Help</h2>
            <ul>
              <li><a href={HELP_URL}>Guides and FAQs</a></li>
              <li><Link href="/about">About</Link></li>
              <li><Link href="/privacy">Privacy</Link></li>
              <li><Link href="/terms">Terms</Link></li>
            </ul>
          </nav>
        </div>
        <div className={styles.footBase}>
          <span>© {new Date().getFullYear()} OYUN. Made in {SITE_CITY}.</span>
          <a href={`mailto:${supportEmail}`} style={{ color: 'inherit' }}>{supportEmail}</a>
        </div>
      </div>
    </footer>
  );
}

import Link from 'next/link';
import { SOCIAL_LINKS } from '@/modules/web/lib/site';
import CookieSettingsLink from '@/modules/web/frontend/consent/CookieSettingsLink';
import styles from '@/modules/web/frontend/Footer.module.css';

export default function Footer({ supportEmail }: { supportEmail: string }) {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.top}>
          {/* Brand */}
          <div className={styles.brand}>
            <div className={styles.logoRow}>
              <svg width="48" height="48" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.12))' }}>
                <circle cx="20" cy="20" r="18" fill="url(#footerShieldGrad)"/>
                <path d="M 12 12 L 18 22 L 27 16 L 31 19" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                <circle cx="32" cy="12" r="2.5" fill="white"/>
                <path d="M 14 28 Q 22 32 30 24" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" fill="none"/>
                <path d="M 10 23 Q 16 26 22 21" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
                <defs>
                  <linearGradient id="footerShieldGrad" x1="4" y1="2" x2="36" y2="38" gradientUnits="userSpaceOnUse">
                    <stop style={{ stopColor: 'var(--logo-from)' }}/>
                    <stop offset="1" style={{ stopColor: 'var(--logo-to)' }}/>
                  </linearGradient>
                </defs>
              </svg>
              <div>
                <div className={`${styles.logoName} brand-wordmark`}>OYUN</div>
                <div className={styles.logoTag}>PLAY BEYOND.</div>
              </div>
            </div>
            <p className={styles.brandDesc}>
              Discover and book turfs and courts near you: football, box cricket, badminton and pickleball. Play more, stress less.
            </p>
            {(SOCIAL_LINKS.instagram || SOCIAL_LINKS.whatsapp) && (
            <div className={styles.socialRow}>
              {SOCIAL_LINKS.instagram && (
              <a href={SOCIAL_LINKS.instagram} className={styles.social} aria-label="Instagram" id="footer-instagram" target="_blank" rel="noopener noreferrer">
                <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
              )}
              {SOCIAL_LINKS.whatsapp && (
              <a href={SOCIAL_LINKS.whatsapp} className={styles.social} aria-label="WhatsApp" id="footer-whatsapp" target="_blank" rel="noopener noreferrer">
                <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </a>
              )}
            </div>
            )}
          </div>

          {/* Links */}
          <nav className={styles.linksGrid} aria-label="Footer">
            <div className={styles.linkGroup}>
              <p className={styles.linkGroupTitle}>Book</p>
              <ul className={styles.linkList}>
                <li><Link href="/arenas">All turfs</Link></li>
                <li><Link href="/areas">Turfs by area</Link></li>
                <li><Link href="/sports/football">Football turfs</Link></li>
                <li><Link href="/sports/box-cricket">Box cricket</Link></li>
                <li><Link href="/sports/badminton">Badminton courts</Link></li>
                <li><Link href="/sports/pickleball">Pickleball courts</Link></li>
                <li><Link href="/matches">Find players & matches</Link></li>
                <li><Link href="/tournaments">Tournaments</Link></li>
                <li><Link href="/bookings">My bookings</Link></li>
                <li><Link href="/faq">How booking works</Link></li>
              </ul>
            </div>
            <div className={styles.linkGroup}>
              <p className={styles.linkGroupTitle}>Guides &amp; Highlights</p>
              <ul className={styles.linkList}>
                <li><Link href="/blog">Blog</Link></li>
                <li><Link href="/news">News &amp; events</Link></li>
                <li><Link href="/about">About us</Link></li>
                <li><Link href="/guides">Sports guides &amp; rules</Link></li>
                <li><Link href="/guides/pickleball-mangalore-venues">Pickleball in Mangalore</Link></li>
                <li><Link href="/guides/padel-in-mangalore">Padel court guide</Link></li>
                <li><Link href="/curated/night-turfs-mangalore">Night turfs (after 12 AM)</Link></li>
                <li><Link href="/curated/monsoon-covered-turfs-mangalore">Monsoon covered turfs</Link></li>
              </ul>
            </div>
            <div className={styles.linkGroup}>
              <p className={styles.linkGroupTitle}>Turf owners</p>
              <ul className={styles.linkList}>
                <li><Link href="/list-turf">List your turf</Link></li>
                <li><Link href="/partner">Partner dashboard</Link></li>
                <li><Link href="/admin">Admin dashboard</Link></li>
              </ul>
            </div>
            <div className={styles.linkGroup}>
              <p className={styles.linkGroupTitle}>Support</p>
              <ul className={styles.linkList}>
                <li><a href={`mailto:${supportEmail}`}>Contact us</a></li>
                <li><Link href="/faq">FAQ</Link></li>
                <li><Link href="/privacy">Privacy policy</Link></li>
                <li><Link href="/terms">Terms &amp; conditions</Link></li>
                <li><CookieSettingsLink className={styles.linkButton} /></li>
              </ul>
            </div>
          </nav>
        </div>

        <div className={styles.watermark} aria-hidden="true">OYUN</div>
        <div className={styles.bottom}>
          <p className={styles.copyright}>© {new Date().getFullYear()} OYUN</p>
          <p className={styles.copyright}>All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

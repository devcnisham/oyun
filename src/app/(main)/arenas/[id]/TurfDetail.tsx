import Image from 'next/image';
import { canOptimize } from '@/lib/images';
import type { Offer, PublicTurf, Slot } from '@/lib/types';
import type { PublicReview } from '@/lib/reviews';
import Stars from '@/components/Stars';
import FavouriteButton from '@/components/FavouriteButton';
import BookingFlow, { type BookingFlowProps } from './BookingFlow';
import { shortHour } from '@/lib/format';
import ShareButton from './ShareButton';
import MapEmbed from './MapEmbed';
import styles from './page.module.css';
import BackButton from '@/components/BackButton';
import { primarySport, sportInfo } from '@/lib/sports';
import { getWeatherAlert } from '@/lib/weather';

interface TurfDetailProps {
  turf: PublicTurf;
  dates: BookingFlowProps['dates'];
  initialDate: string;
  initialSlots: Slot[];
  offers: Offer[];
  bookable: boolean;
  rewards: BookingFlowProps['rewards'];
  initialReferral: string;
  reviews: PublicReview[];
}


export default function TurfDetail({ turf, dates, initialDate, initialSlots, offers, bookable, rewards, initialReferral, reviews }: TurfDetailProps) {
  const imageSrc = turf.images[0];

  return (
    <div className={styles.page}>
      {/* Mobile Image Header */}
      <div className={styles.imageHeader}>
        <Image src={imageSrc} alt={turf.name} fill preload sizes="100vw" className={styles.mainImage} unoptimized={!canOptimize(imageSrc)} />

        <div className={styles.topNav}>
          <BackButton fallback="/arenas" className={styles.iconBtn}>←</BackButton>
          <div className={styles.midBadge}>{turf.isVerified ? 'Verified Turf' : 'Premium Turf'}</div>
          <div className={styles.topNavRight}>
            <FavouriteButton turfId={turf.id} turfName={turf.name} className={styles.iconBtn} />
            <ShareButton title={turf.name} className={styles.iconBtn} />
          </div>
        </div>

        <div className={styles.imageCounter}>📸 1/{turf.images.length}</div>
      </div>

      <div className={`container ${styles.content} ${styles.layout}`}>
        {/* Left column (top on mobile): turf name and highlights */}
        <div className={styles.info}>
        <span className={styles.typeBadge}>
          <span aria-hidden>{primarySport(turf).icon}</span> {primarySport(turf).label} · {turf.size} · {turf.surface}
        </span>
        {/* Name, badge and address on the left; hours and map link on the right */}
        <div className={styles.titleRow}>
          <div className={styles.titleMain}>
            <h1 className={styles.title}>
              {turf.name}{' '}
              <span className={styles.ratingBadge}>{turf.reviewCount > 0 ? `★ ${turf.rating}` : 'New'}</span>
            </h1>
            <p className={styles.addressBlock}>{turf.location}</p>
          </div>
          <div className={styles.titleSide}>
            <span className={styles.hours}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
              </svg>
              {turf.openTime} – {turf.closeTime}
            </span>
            <a href={`https://maps.google.com/?q=${encodeURIComponent(`${turf.name} ${turf.location}`)}`} target="_blank" rel="noreferrer" className={styles.mapLink}>View on map</a>
          </div>
        </div>

        {(turf.isVerified || turf.reviewCount > 0) && (
          <ul className={styles.facts}>
            {turf.isVerified && <li><span aria-hidden>✓</span>Verified by OYUN</li>}
            {turf.reviewCount > 0 && (
              <li><a href="#reviews" className={styles.ratingText}>{turf.reviewCount} rating{turf.reviewCount === 1 ? '' : 's'}</a></li>
            )}
          </ul>
        )}

        {(() => {
          const alert = getWeatherAlert(turf);
          return alert.active ? (
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, padding: '10px 14px', margin: '14px 0', fontSize: 13, color: '#1e40af', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20 }} aria-hidden>🌧️</span>
              <div>
                <strong>{alert.title}</strong>
                <p style={{ margin: '2px 0 0', color: '#1e3a8a', fontSize: 12 }}>{alert.description}</p>
              </div>
            </div>
          ) : null;
        })()}


        {offers.length > 0 && (
          <div className={styles.offerStrip}>
            {offers.map((o) => (
              <div key={o.id} className={styles.offerChip}>
                🏷️ <strong>{o.title}</strong> · {o.percentOff}% off{' '}
                {o.type === 'first_time' ? 'your first booking' : `${shortHour(o.startHour)}–${shortHour(o.endHour)}`}
              </div>
            ))}
          </div>
        )}
        </div>

        {/* Right column: booking panel, sticky on desktop */}
        <aside className={styles.bookingPanel}>
        <h2 className={styles.panelTitle}>Book a slot</h2>
        {!bookable ? (
          <div className={styles.notice}>This turf is under maintenance and not taking bookings right now.</div>
        ) : (
          <BookingFlow
            turf={turf}
            dates={dates}
            initialDate={initialDate}
            initialSlots={initialSlots}
            rewards={rewards}
            initialReferral={initialReferral}
          />
        )}
        </aside>

        {/* Left column (bottom on mobile): location, about, amenities, reviews */}
        <div className={styles.more}>
        <div className={styles.mapSection}>
          <h2>Location</h2>
          <div className={styles.mapContainer}>
            <MapEmbed name={turf.name} location={turf.location} />
          </div>
        </div>

        <hr className={styles.divider} />

        <div className={styles.detailsSection}>
          <h2>About {turf.name}</h2>
          <p className={styles.description}>{turf.description}</p>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Sports</span>
              <span className={styles.infoValue}>{turf.sports.map((s) => `${sportInfo(s).icon} ${sportInfo(s).label}`).join(', ')}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Format</span>
              <span className={styles.infoValue}>{turf.size}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Contact</span>
              <span className={styles.infoValue}>{turf.phone ? <a href={`tel:${turf.phone.replace(/\s/g, '')}`}>{turf.ownerName} ({turf.phone})</a> : turf.ownerName}</span>
            </div>
          </div>
        </div>

        <hr className={styles.divider} />

        <div className={styles.amenitiesSection}>
          <h2>Amenities</h2>
          <div className={styles.amenitiesGrid}>
            {turf.amenities.map((a) => (
              <span key={a} className={styles.amenityTag}>✓ {a}</span>
            ))}
          </div>
        </div>

        <hr className={styles.divider} />

        <div className={styles.reviewsSection} id="reviews">
          <h2>Player reviews</h2>
          {reviews.length === 0 ? (
            <p className={styles.reviewEmpty}>No reviews yet. Players can rate {turf.name} from their booking after they play.</p>
          ) : (
            <>
              <div className={styles.reviewSummary}>
                <b>{turf.rating.toFixed(1)}</b>
                <div>
                  <Stars value={turf.rating} size={18} />
                  <span>{turf.reviewCount} rating{turf.reviewCount === 1 ? '' : 's'} from players who booked on OYUN</span>
                </div>
              </div>
              <ul className={styles.reviewList}>
                {reviews.map((r) => (
                  <li key={r.bookingId}>
                    <div className={styles.reviewHead}>
                      <b>{r.name}</b>
                      <Stars value={r.rating} size={14} />
                      <time dateTime={r.createdAt}>
                        {new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })}
                      </time>
                    </div>
                    {r.comment && <p>{r.comment}</p>}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        </div>
        <div className={styles.bottomSpacer} />
      </div>

    </div>
  );
}

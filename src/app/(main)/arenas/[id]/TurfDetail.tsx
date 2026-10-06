import Image from 'next/image';
import { canOptimize } from '@/lib/images';
import type { AddOn, Offer, Slot, Turf } from '@/lib/types';
import BookingFlow, { type BookingFlowProps } from './BookingFlow';
import ShareButton from './ShareButton';
import styles from './page.module.css';
import BackButton from '@/components/BackButton';

interface TurfDetailProps {
  turf: Turf;
  dates: BookingFlowProps['dates'];
  initialDate: string;
  initialSlots: Slot[];
  addOns: AddOn[];
  offers: Offer[];
  advancePercent: number;
  bookable: boolean;
  rewards: BookingFlowProps['rewards'];
  initialReferral: string;
}

const hourLabel = (h: number) => `${h % 12 === 0 ? 12 : h % 12} ${h < 12 || h === 24 ? 'AM' : 'PM'}`;

export default function TurfDetail({ turf, dates, initialDate, initialSlots, addOns, offers, advancePercent, bookable, rewards, initialReferral }: TurfDetailProps) {
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
            <ShareButton title={turf.name} className={styles.iconBtn} />
          </div>
        </div>

        <div className={styles.imageCounter}>📸 1/{turf.images.length}</div>
      </div>

      <div className={`container ${styles.content} ${styles.layout}`}>
        {/* Left column (top on mobile): turf name and highlights */}
        <div className={styles.info}>
        <span className={styles.typeBadge}>{turf.size} · {turf.surface}</span>
        <h1 className={styles.title}>{turf.name}</h1>

        <div className={styles.ratingRow}>
          {turf.reviewCount > 0 ? (
            <>
              <span className={styles.ratingBadge}>★ {turf.rating}</span>
              <span className={styles.ratingText}>({turf.reviewCount} ratings)</span>
            </>
          ) : (
            <span className={styles.ratingBadge}>New</span>
          )}
        </div>

        <div className={styles.addressBlock}>
          <p>{turf.location}</p>
          <a href={`https://maps.google.com/?q=${encodeURIComponent(`${turf.name} ${turf.location}`)}`} target="_blank" rel="noreferrer" className={styles.mapLink}>View on map</a>
        </div>

        {offers.length > 0 && (
          <div className={styles.offerStrip}>
            {offers.map((o) => (
              <div key={o.id} className={styles.offerChip}>
                🏷️ <strong>{o.title}</strong> · {o.percentOff}% off{' '}
                {o.type === 'first_time' ? 'your first booking' : `${hourLabel(o.startHour)}–${hourLabel(o.endHour)}`}
              </div>
            ))}
          </div>
        )}

        <hr className={styles.divider} />

        <div className={styles.whyBook}>
          <h2>Why book this turf?</h2>
          <div className={styles.perk}>
            <span className={styles.perkIcon}>🏟️</span>
            <div><h3 className={styles.perkTitle}>{turf.surface}</h3></div>
          </div>
          {turf.isVerified && (
            <div className={styles.perk}>
              <span className={styles.perkIcon}>✓</span>
              <div><h3 className={styles.perkTitle}>Inspected and verified by OYUN</h3></div>
            </div>
          )}
          <div className={styles.perk}>
            <span className={styles.perkIcon}>💡</span>
            <div><h3 className={styles.perkTitle}>Open {turf.openTime} – {turf.closeTime}</h3></div>
          </div>
        </div>

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
            addOns={addOns}
            advancePercent={advancePercent}
            rewards={rewards}
            initialReferral={initialReferral}
          />
        )}
        </aside>

        {/* Left column (bottom on mobile): full details */}
        <div className={styles.more}>
        <div className={styles.detailsSection}>
          <h2>About {turf.name}</h2>
          <p className={styles.description}>{turf.description}</p>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Sports</span>
              <span className={styles.infoValue}>{turf.sports.join(', ')}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Format</span>
              <span className={styles.infoValue}>{turf.size}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Contact</span>
              <span className={styles.infoValue}>{turf.ownerName} ({turf.phone})</span>
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

        <div className={styles.mapSection}>
          <h2>Location</h2>
          <div className={styles.mapContainer}>
            <iframe
              title={`${turf.name} on map`}
              src={`https://www.google.com/maps?q=${encodeURIComponent(turf.name + ' ' + turf.location)}&output=embed`}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen={false}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </div>

        </div>
        <div className={styles.bottomSpacer} />
      </div>

    </div>
  );
}

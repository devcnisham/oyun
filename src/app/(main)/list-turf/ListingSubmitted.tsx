import styles from './page.module.css';

interface ListingSubmittedProps {
  ownerName: string;
  turfName: string;
  ownerPhone: string;
  refId: string;
  onAnother: () => void;
}

/** Confirmation shown after a turf application is sent. */
export default function ListingSubmitted({ ownerName, turfName, ownerPhone, refId, onAnother }: ListingSubmittedProps) {
  return (
    <div className={styles.page}>
      <div className={styles.successPage}>
        <div className={styles.successIcon}>🎉</div>
        <h1 className={styles.successTitle}>Application Submitted!</h1>
        <p className={styles.successDesc}>
          Thank you, <strong>{ownerName}</strong>! We&apos;ve received your listing for <strong>{turfName}</strong>.
          Our team will review it and get back to you at <strong>{ownerPhone}</strong> within 24–48 hours.
        </p>
        <div className={styles.successRef}>Reference: SA-{refId}</div>
        <div className={styles.successPerks}>
          <div className={styles.successPerk}>✓ Listing review in 24 hrs</div>
          <div className={styles.successPerk}>✓ Free listing during beta</div>
          <div className={styles.successPerk}>✓ Verified badge on approval</div>
        </div>
        <button className="btn btn--primary btn--lg" onClick={onAnother}>
          Submit Another Turf
        </button>
      </div>
    </div>
  );
}

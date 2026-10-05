import { AMENITY_OPTIONS } from '@/lib/action-utils';
import type { Turf } from '@/lib/types';
import styles from './dash.module.css';

// Inputs parsed by parseTurfProfile() — shared by the partner and admin turf editors
export default function TurfProfileFields({ turf }: { turf: Turf }) {
  return (
    <>
      <div className={styles.formGrid}>
        <label className={styles.field}>
          <span className={styles.label}>Turf name</span>
          <input name="name" defaultValue={turf.name} required maxLength={80} className={styles.input} />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Area</span>
          <input name="area" defaultValue={turf.area} required maxLength={60} className={styles.input} />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Base price per hour (₹)</span>
          <input name="pricePerHour" type="number" min={100} max={20000} defaultValue={turf.pricePerHour} required className={styles.input} />
        </label>
      </div>
      <label className={styles.field}>
        <span className={styles.label}>Full address</span>
        <input name="location" defaultValue={turf.location} required maxLength={160} className={styles.input} />
      </label>
      <div className={styles.formGrid}>
        <label className={styles.field}>
          <span className={styles.label}>Contact name</span>
          <input name="ownerName" defaultValue={turf.ownerName} required className={styles.input} />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Contact phone</span>
          <input name="phone" defaultValue={turf.phone} required className={styles.input} />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Opens</span>
          <input name="openTime" type="time" step={3600} defaultValue={turf.openTime} required className={styles.input} />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Closes</span>
          <input name="closeTime" type="time" step={3600} defaultValue={turf.closeTime} required className={styles.input} />
        </label>
      </div>
      <div className={styles.formGrid}>
        <label className={styles.field}>
          <span className={styles.label}>Size</span>
          <input name="size" defaultValue={turf.size} required className={styles.input} />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Surface</span>
          <input name="surface" defaultValue={turf.surface} required className={styles.input} />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Formats (comma separated)</span>
          <input name="formats" defaultValue={turf.formats.join(', ')} className={styles.input} />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Sports (comma separated)</span>
          <input name="sports" defaultValue={turf.sports.join(', ')} className={styles.input} />
        </label>
      </div>
      <label className={styles.field}>
        <span className={styles.label}>Description</span>
        <textarea name="description" defaultValue={turf.description} required maxLength={1000} className={styles.textarea} />
      </label>
      <label className={styles.field}>
        <span className={styles.label}>Photos — one link per line (/turfs/turf_1.jpg or https://…)</span>
        <textarea name="images" defaultValue={turf.images.join('\n')} required className={styles.textarea} />
      </label>
      <div className={styles.field}>
        <span className={styles.label}>Amenities</span>
        <div className={styles.checkGrid}>
          {AMENITY_OPTIONS.map((a) => (
            <label key={a} className={styles.check}>
              <input type="checkbox" name="amenities" value={a} defaultChecked={turf.amenities.includes(a)} /> {a}
            </label>
          ))}
        </div>
      </div>
    </>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { submitApplication } from '@/modules/web/backend/booking-actions';
import { STEP_FIELDS, validateApplication, type FieldErrors } from '@/modules/web/lib/validation/application';
import BackButton from '@/modules/web/frontend/BackButton';
import ListingSubmitted from '@/modules/web/frontend/main/list-turf/ListingSubmitted';
import { amenitiesOptions, EMPTY_FORM, mangaloreAreas, perks, sizes, surfaces, type ListingForm } from '@/modules/web/frontend/main/list-turf/listing-options';
import styles from './page.module.css';

export default function ListTurfPage() {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [refId, setRefId] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [startedAt] = useState(() => Date.now());
  const [website, setWebsite] = useState('');
  const [formData, setFormData] = useState<ListingForm>(EMPTY_FORM);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name as keyof FieldErrors]) setErrors({ ...errors, [e.target.name]: undefined });
  };

  // Mark invalid inputs for screen readers and styling, then focus the first one
  const showErrors = (found: FieldErrors) => {
    setErrors(found);
    const form = document.getElementById('list-form');
    form?.querySelectorAll('[aria-invalid]').forEach((el) => el.removeAttribute('aria-invalid'));
    const names = Object.keys(found);
    names.forEach((n) => form?.querySelector(`[name="${n}"]`)?.setAttribute('aria-invalid', 'true'));
    (form?.querySelector(`[name="${names[0]}"]`) as HTMLElement | null)?.focus();
  };

  const nextStep = () => {
    const found = validateApplication({ ...formData }, [step]);
    if (Object.keys(found).length) return showErrors(found);
    setErrors({});
    setStep(step + 1);
  };

  const toggleAmenity = (a: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    const found = validateApplication({ ...formData });
    if (Object.keys(found).length) {
      const firstStep = [1, 2, 3, 4].find((n) => STEP_FIELDS[n].some((f) => found[f])) ?? step;
      setStep(firstStep);
      queueMicrotask(() => showErrors(found));
      return;
    }
    setSubmitting(true);
    const res = await submitApplication({ ...formData, amenities: selectedAmenities, website, startedAt });
    setSubmitting(false);
    if (res.fieldErrors) showErrors(res.fieldErrors);
    if (res.id) {
      setRefId(res.id);
      setSubmitted(true);
    } else {
      setSubmitError(res.error ?? 'Could not submit your listing. Please try again.');
    }
  };

  const steps = ['Your Info', 'Turf Details', 'Pricing', 'Finish'];

  if (submitted) {
    return (
      <ListingSubmitted
        form={formData}
        refId={refId}
        onAnother={() => {
          setSubmitted(false);
          setStep(1);
          setFormData(EMPTY_FORM);
          setSelectedAmenities([]);
        }}
      />
    );
  }

  return (
    <div className={styles.page}>
      {/* Landing Page Content */}
      <div className={styles.landingPage}>
        <motion.div 
          className={styles.heroSection}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="container">
            <BackButton />
            <h1 className={styles.heroTitle}>Partner with OYUN</h1>
            <p className={styles.heroSubtitle}>Join Mangalore&apos;s fastest growing turf booking network. Free to list, zero commission during beta.</p>
            <button className="btn btn--primary btn--lg" onClick={() => { document.getElementById('list-form')?.scrollIntoView({ behavior: 'smooth' }); }}>List Your Property Now</button>
          </div>
        </motion.div>
        
        <div className={`container ${styles.perksGrid}`}>
          <motion.h2 
            className={styles.sectionTitle}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
          >
            Why list on OYUN?
          </motion.h2>
          <div className={styles.perksCards}>
            {perks.map((p, index) => (
              <motion.div 
                key={p.title} 
                className={styles.perkCardLarge}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
              >
                 <div className={styles.perkIconLarge}>{p.icon}</div>
                 <h3>{p.title}</h3>
                 <p>{p.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div 
          className={`container ${styles.statsSection}`}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className={styles.statBannerLarge}>
             <div><p className={styles.statValue}>2,000+</p><p>Active Bookers</p></div>
             <div><p className={styles.statValue}>₹0</p><p>Listing Cost</p></div>
             <div><p className={styles.statValue}>24h</p><p>Approval Time</p></div>
          </div>
        </motion.div>
      </div>

      <div id="list-form" style={{ scrollMarginTop: '80px' }}>
        <div className={styles.header}>
        <div className="container">
          <div className={styles.headerInner}>
            <div>
              <p className="section-label">For Turf Owners</p>
              <h2 className={styles.pageTitle}>List Your Turf on OYUN</h2>
              <p className={styles.pageDesc}>
                Join Mangalore&apos;s growing turf booking network. Free to list, free to earn.
              </p>
              <p className={styles.pageDesc}>
                Already a partner? <Link href="/partner/login">Log in here</Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className={`container ${styles.body}`}>
        {/* Left: Perks */}
        <aside className={styles.sidebar}>
          <div className={styles.perksCard}>
            <h3 className={styles.perksTitle}>Benefits for partners</h3>
            <div className={styles.perksList}>
              {perks.map((p) => (
                <div key={p.title} className={styles.perkItem}>
                  <div className={styles.perkIcon}>{p.icon}</div>
                  <div>
                    <div className={styles.perkTitle}>{p.title}</div>
                    <div className={styles.perkDesc}>{p.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className={styles.statsBanner}>
            <div className={styles.statBannerItem}>
              <div className={styles.statBannerValue}>2,000+</div>
              <div className={styles.statBannerLabel}>Active Bookers</div>
            </div>
            <div className={styles.statBannerDivider} />
            <div className={styles.statBannerItem}>
              <div className={styles.statBannerValue}>₹0</div>
              <div className={styles.statBannerLabel}>Listing Cost</div>
            </div>
          </div>
        </aside>

        {/* Right: Form */}
        <div className={styles.formWrap}>
          {/* Step indicator */}
          <div className={styles.stepper}>
            {steps.map((s, i) => (
              <div key={s} className={`${styles.stepItem} ${i + 1 === step ? styles.stepActive : ''} ${i + 1 < step ? styles.stepDone : ''}`}>
                <div className={styles.stepDot}>
                  {i + 1 < step ? '✓' : i + 1}
                </div>
                <div className={styles.stepLabel}>{s}</div>
                {i < steps.length - 1 && <div className={`${styles.stepLine} ${i + 1 < step ? styles.stepLineDone : ''}`} />}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className={styles.form} noValidate>
            {/* Step 1: Owner Info */}
            {step === 1 && (
              <div className={`${styles.stepContent} animate-fadeInUp`}>
                <h2 className={styles.stepTitle}>Owner Information</h2>
                <p className={styles.stepDesc}>Tell us about yourself so we can reach you after reviewing your listing.</p>

                <div className={styles.fieldGroup}>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="ownerName">Full Name *</label>
                    <input
                      id="ownerName"
                      name="ownerName"
                      type="text"
                      required
                      placeholder="e.g. Rohan Shetty"
                      className={styles.input}
                      value={formData.ownerName}
                      onChange={handleChange}
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="ownerPhone">Mobile Number *</label>
                    <input
                      id="ownerPhone"
                      name="ownerPhone"
                      type="tel"
                      required
                      inputMode="numeric"
                      autoComplete="tel"
                      placeholder="+91 98765 43210"
                      className={styles.input}
                      value={formData.ownerPhone}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="ownerEmail">Email Address * <span className={styles.hint}>(your partner login)</span></label>
                  <input
                    id="ownerEmail"
                    name="ownerEmail"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@example.com"
                    className={styles.input}
                    value={formData.ownerEmail}
                    onChange={handleChange}
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="whatsapp">WhatsApp Number (for notifications)</label>
                  <input
                    id="whatsapp"
                    name="whatsapp"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    placeholder="Same as mobile or different"
                    className={styles.input}
                    value={formData.whatsapp}
                    onChange={handleChange}
                  />
                </div>
              </div>
            )}

            {/* Step 2: Turf Details */}
            {step === 2 && (
              <div className={`${styles.stepContent} animate-fadeInUp`}>
                <h2 className={styles.stepTitle}>Turf Details</h2>
                <p className={styles.stepDesc}>Describe your facility so players can make an informed choice.</p>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="turfName">Turf Name *</label>
                  <input id="turfName" name="turfName" type="text" required placeholder="e.g. Arena Central" className={styles.input} value={formData.turfName} onChange={handleChange} />
                </div>

                <div className={styles.fieldGroup}>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="area">Area / Locality *</label>
                    <select id="area" name="area" required className={styles.select} value={formData.area} onChange={handleChange}>
                      <option value="">Select area</option>
                      {mangaloreAreas.map((a) => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="size">Turf Format *</label>
                    <select id="size" name="size" required className={styles.select} value={formData.size} onChange={handleChange}>
                      <option value="">Select size</option>
                      {sizes.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="address">Full Address *</label>
                  <input id="address" name="address" type="text" required placeholder="Street, landmark, area, city" className={styles.input} value={formData.address} onChange={handleChange} />
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="surface">Surface Type *</label>
                  <select id="surface" name="surface" required className={styles.select} value={formData.surface} onChange={handleChange}>
                    <option value="">Select surface</option>
                    {surfaces.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div className={styles.fieldGroup}>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="openTime">Opening Time *</label>
                    <input id="openTime" name="openTime" type="time" required className={styles.input} value={formData.openTime} onChange={handleChange} />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="closeTime">Closing Time *</label>
                    <input id="closeTime" name="closeTime" type="time" required className={styles.input} value={formData.closeTime} onChange={handleChange} />
                  </div>
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Amenities</label>
                  <div className={styles.amenitiesGrid}>
                    {amenitiesOptions.map((a) => (
                      <button
                        key={a}
                        type="button"
                        id={`amenity-${a.replace(/\s/g,'-').toLowerCase()}`}
                        className={`${styles.amenityToggle} ${selectedAmenities.includes(a) ? styles.amenityToggleActive : ''}`}
                        onClick={() => toggleAmenity(a)}
                      >
                        {selectedAmenities.includes(a) ? '✓ ' : ''}{a}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Pricing */}
            {step === 3 && (
              <div className={`${styles.stepContent} animate-fadeInUp`}>
                <h2 className={styles.stepTitle}>Pricing</h2>
                <p className={styles.stepDesc}>Set your hourly rates. You can always update these later from your dashboard.</p>

                <div className={styles.pricingCards}>
                  <div className={styles.pricingCard}>
                    <div className={styles.pricingCardIcon}>☀️</div>
                    <div className={styles.field}>
                      <label className={styles.label} htmlFor="weekdayPrice">Weekday Rate (₹/hr) *</label>
                      <div className={styles.priceInputWrap}>
                        <span className={styles.pricePrefix}>₹</span>
                        <input id="weekdayPrice" name="weekdayPrice" type="number" required min="100" placeholder="700" className={`${styles.input} ${styles.priceInput}`} value={formData.weekdayPrice} onChange={handleChange} />
                      </div>
                      <p className={styles.fieldHint}>Monday – Friday, daytime</p>
                    </div>
                  </div>
                  <div className={styles.pricingCard}>
                    <div className={styles.pricingCardIcon}>🌆</div>
                    <div className={styles.field}>
                      <label className={styles.label} htmlFor="eveningPrice">Evening Rate (₹/hr) *</label>
                      <div className={styles.priceInputWrap}>
                        <span className={styles.pricePrefix}>₹</span>
                        <input id="eveningPrice" name="eveningPrice" type="number" required min="100" placeholder="1000" className={`${styles.input} ${styles.priceInput}`} value={formData.eveningPrice} onChange={handleChange} />
                      </div>
                      <p className={styles.fieldHint}>5 PM – closing (peak hours)</p>
                    </div>
                  </div>
                  <div className={styles.pricingCard}>
                    <div className={styles.pricingCardIcon}>🎯</div>
                    <div className={styles.field}>
                      <label className={styles.label} htmlFor="weekendPrice">Weekend Rate (₹/hr) *</label>
                      <div className={styles.priceInputWrap}>
                        <span className={styles.pricePrefix}>₹</span>
                        <input id="weekendPrice" name="weekendPrice" type="number" required min="100" placeholder="1200" className={`${styles.input} ${styles.priceInput}`} value={formData.weekendPrice} onChange={handleChange} />
                      </div>
                      <p className={styles.fieldHint}>Saturday & Sunday</p>
                    </div>
                  </div>
                </div>

                <div className={styles.pricingNote}>
                  💡 Tip: Turfs with peak-hour pricing typically earn 35% more per month than flat-rate turfs.
                </div>
              </div>
            )}

            {/* Step 4: Description */}
            {step === 4 && (
              <div className={`${styles.stepContent} animate-fadeInUp`}>
                <h2 className={styles.stepTitle}>Final Details</h2>
                <p className={styles.stepDesc}>Add a short description of your turf for players to read before booking.</p>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="description">Turf Description *</label>
                  <textarea
                    id="description"
                    name="description"
                    required
                    rows={5}
                    placeholder="Describe your turf — the quality of the pitch, unique features, surroundings, facilities..."
                    className={styles.textarea}
                    value={formData.description}
                    onChange={handleChange}
                  />
                  <p className={styles.fieldHint}>{formData.description.length} / 300 characters</p>
                </div>

                {/* Review summary */}
                <div className={styles.reviewCard}>
                  <h3 className={styles.reviewTitle}>Review Your Listing</h3>
                  <div className={styles.reviewGrid}>
                    <div className={styles.reviewItem}><span className={styles.reviewLabel}>Name</span><span className={styles.reviewValue}>{formData.turfName || '—'}</span></div>
                    <div className={styles.reviewItem}><span className={styles.reviewLabel}>Area</span><span className={styles.reviewValue}>{formData.area || '—'}</span></div>
                    <div className={styles.reviewItem}><span className={styles.reviewLabel}>Format</span><span className={styles.reviewValue}>{formData.size || '—'}</span></div>
                    <div className={styles.reviewItem}><span className={styles.reviewLabel}>Surface</span><span className={styles.reviewValue}>{formData.surface || '—'}</span></div>
                    <div className={styles.reviewItem}><span className={styles.reviewLabel}>Weekday</span><span className={styles.reviewValue}>{formData.weekdayPrice ? `₹${formData.weekdayPrice}/hr` : '—'}</span></div>
                    <div className={styles.reviewItem}><span className={styles.reviewLabel}>Weekend</span><span className={styles.reviewValue}>{formData.weekendPrice ? `₹${formData.weekendPrice}/hr` : '—'}</span></div>
                    <div className={styles.reviewItem}><span className={styles.reviewLabel}>Hours</span><span className={styles.reviewValue}>{formData.openTime} – {formData.closeTime}</span></div>
                    <div className={styles.reviewItem}><span className={styles.reviewLabel}>Amenities</span><span className={styles.reviewValue}>{selectedAmenities.length > 0 ? selectedAmenities.slice(0,3).join(', ') + (selectedAmenities.length > 3 ? ` +${selectedAmenities.length - 3}` : '') : '—'}</span></div>
                  </div>
                </div>
              </div>
            )}

            {submitError && (
              <p role="alert" style={{ color: 'var(--err)', background: 'var(--err-bg)', border: '1px solid var(--err-border)', padding: '10px 12px', borderRadius: 8, fontSize: 14 }}>
                {submitError}
              </p>
            )}

            {Object.values(errors).some(Boolean) && (
              <div className={styles.errorSummary} role="alert">
                <strong>Please check these fields:</strong>
                <ul>
                  {Object.values(errors).filter(Boolean).map((m) => <li key={m}>{m}</li>)}
                </ul>
              </div>
            )}

            {/* Spam trap: hidden from people and screen readers */}
            <div className={styles.trap} aria-hidden="true">
              <label htmlFor="website">Website</label>
              <input id="website" name="website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
            </div>

            {/* Navigation */}
            <div className={styles.stepNav}>
              {step > 1 && (
                <button type="button" className="btn btn--ghost" onClick={() => setStep(step - 1)} id="form-prev">
                  ← Previous
                </button>
              )}
              {step < 4 ? (
                <button type="button" className={`btn btn--primary ${styles.nextBtn}`} onClick={nextStep} id="form-next">
                  Continue →
                </button>
              ) : (
                <button type="submit" className={`btn btn--primary ${styles.nextBtn}`} id="form-submit" disabled={submitting}>
                  {submitting ? 'Submitting…' : '🚀 Submit Listing'}
                </button>
              )}
            </div>
          </form>
          </div>
        </div>
      </div>
    </div>
  );
}

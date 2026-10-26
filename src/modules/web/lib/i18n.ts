export type Locale = 'en' | 'kn' | 'hi' | 'tcy';

export interface LocaleInfo {
  code: Locale;
  label: string;
  nativeName: string;
  englishName: string;
}

export const LOCALES: readonly LocaleInfo[] = [
  { code: 'en', label: 'English', nativeName: 'English', englishName: 'English' },
  { code: 'kn', label: 'Kannada (ಕನ್ನಡ)', nativeName: 'ಕನ್ನಡ', englishName: 'Kannada' },
  { code: 'hi', label: 'Hindi (हिन्दी)', nativeName: 'हिन्दी', englishName: 'Hindi' },
  { code: 'tcy', label: 'Tulu (ತುಳು)', nativeName: 'ತುಳು', englishName: 'Tulu' },
] as const;

export const DEFAULT_LOCALE: Locale = 'en';
export const LOCALE_STORAGE_KEY = 'oyun_locale';
export const LOCALE_COOKIE_KEY = 'oyun_lang';
export const LOCALE_EVENT = 'oyun:locale';

export type TranslationKey =
  | 'tagline'
  | 'nav_mangalore'
  | 'nav_list_turf'
  | 'nav_start_earning'
  | 'nav_my_bookings'
  | 'nav_sign_in'
  | 'nav_hi'
  | 'account_section'
  | 'profile_title'
  | 'profile_desc'
  | 'bookings_title'
  | 'bookings_desc'
  | 'saved_title'
  | 'saved_desc'
  | 'preferences_section'
  | 'cookies_title'
  | 'cookies_desc'
  | 'notifications_title'
  | 'notifications_desc'
  | 'language_title'
  | 'language_desc'
  | 'help_section'
  | 'help_title'
  | 'help_desc'
  | 'privacy_title'
  | 'privacy_desc'
  | 'terms_title'
  | 'terms_desc'
  | 'email_support_title'
  | 'dpdp_section'
  | 'about_footer'
  | 'book_again'
  | 'book_now'
  | 'reschedule'
  | 'cancel_booking'
  | 'weather_advisory'
  | 'pay_at_venue'
  | 'advance_payment'
  | 'status_confirmed'
  | 'status_cancelled'
  | 'time_today'
  | 'time_tomorrow'
  | 'time_morning'
  | 'time_afternoon'
  | 'time_evening'
  | 'time_night';

export const TRANSLATIONS: Record<Locale, Record<TranslationKey, string>> = {
  en: {
    tagline: 'Book · Play · Repeat',
    nav_mangalore: 'Mangalore',
    nav_list_turf: 'List your turf',
    nav_start_earning: 'Start earning today',
    nav_my_bookings: 'My bookings',
    nav_sign_in: 'Sign in',
    nav_hi: 'Hi',
    account_section: 'Account',
    profile_title: 'Profile',
    profile_desc: 'Your name, phone number and sign-in',
    bookings_title: 'My bookings',
    bookings_desc: 'Tickets, receipts and cancellations',
    saved_title: 'Saved turfs',
    saved_desc: 'Turfs you have hearted',
    preferences_section: 'Preferences',
    cookies_title: 'Cookie settings',
    cookies_desc: 'Choose whether analytics cookies are allowed',
    notifications_title: 'Notifications',
    notifications_desc: 'Booking confirmations and reminders are not available yet',
    language_title: 'Language',
    language_desc: 'Choose your interface language',
    help_section: 'Help and legal',
    help_title: 'Help center',
    help_desc: 'Contact support and common questions',
    privacy_title: 'Privacy policy',
    privacy_desc: 'What we keep and why',
    terms_title: 'Terms & conditions',
    terms_desc: 'Bookings, payments and cancellations',
    email_support_title: 'Email support',
    dpdp_section: 'Your Data & DPDP Rights',
    about_footer: 'OYUN · Sports turfs and courts in Mangalore',
    book_again: 'Book again in one tap',
    book_now: 'Book Now',
    reschedule: 'Reschedule',
    cancel_booking: 'Cancel booking',
    weather_advisory: 'Weather advisory',
    pay_at_venue: 'Pay at venue',
    advance_payment: 'Advance payment',
    status_confirmed: 'Confirmed',
    status_cancelled: 'Cancelled',
    time_today: 'Today',
    time_tomorrow: 'Tomorrow',
    time_morning: 'Morning',
    time_afternoon: 'Afternoon',
    time_evening: 'Evening',
    time_night: 'Night',
  },
  kn: {
    tagline: 'ಬುಕ್ ಮಾಡಿ · ಆಟವಾಡಿ · ಪುನರಾವರ್ತಿಸಿ',
    nav_mangalore: 'ಮಂಗಳೂರು',
    nav_list_turf: 'ನಿಮ್ಮ ಟರ್ಫ್ ಪಟ್ಟಿ ಮಾಡಿ',
    nav_start_earning: 'ಇಂದೇ ಗಳಿಸಲು ಪ್ರಾರಂಭಿಸಿ',
    nav_my_bookings: 'ನನ್ನ ಬುಕಿಂಗ್‌ಗಳು',
    nav_sign_in: 'ಸೈನ್ ಇನ್',
    nav_hi: 'ನಮಸ್ಕಾರ',
    account_section: 'ಖಾತೆ',
    profile_title: 'ಪ್ರೊಫೈಲ್',
    profile_desc: 'ನಿಮ್ಮ ಹೆಸರು, ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ಮತ್ತು ಖಾತೆ',
    bookings_title: 'ನನ್ನ ಬುಕಿಂಗ್‌ಗಳು',
    bookings_desc: 'ಟಿಕೆಟ್‌ಗಳು, ರಸೀದಿಗಳು ಮತ್ತು ರದ್ದತಿ',
    saved_title: 'ಉಳಿಸಿದ ಟರ್ಫ್‌ಗಳು',
    saved_desc: 'ನೀವು ಇಷ್ಟಪಟ್ಟ ಟರ್ಫ್‌ಗಳು',
    preferences_section: 'ಆದ್ಯತೆಗಳು',
    cookies_title: 'ಕುಕಿ ಸೆಟ್ಟಿಂಗ್‌ಗಳು',
    cookies_desc: 'ವಿಶ್ಲೇಷಣಾತ್ಮಕ ಕುಕಿಗಳನ್ನು ನಿರ್ವಹಿಸಿ',
    notifications_title: 'ಅಧಿಸೂಚನೆಗಳು',
    notifications_desc: 'ಬುಕಿಂಗ್ ದೃಢೀಕರಣಗಳು ಮತ್ತು ಜ್ಞಾಪನೆಗಳು ಶೀಘ್ರದಲ್ಲೇ ಲಭ್ಯ',
    language_title: 'ಭಾಷೆ',
    language_desc: 'ನಿಮ್ಮ ಆಯ್ಕೆಯ ಭಾಷೆಯನ್ನು ಆರಿಸಿ',
    help_section: 'ಸಹಾಯ ಮತ್ತು ನಿಯಮಗಳು',
    help_title: 'ಸಹಾಯ ಕೇಂದ್ರ',
    help_desc: 'ಬೆಂಬಲ ಮತ್ತು ಸಾಮಾನ್ಯ ಪ್ರಶ್ನೆಗಳು',
    privacy_title: 'ಗೌಪ್ಯತಾ ನೀತಿ',
    privacy_desc: 'ನಾವು ಸಂಗ್ರಹಿಸುವ ಮಾಹಿತಿ ಮತ್ತು ವಿವರಗಳು',
    terms_title: 'ನಿಯಮಗಳು ಮತ್ತು ಷರತ್ತುಗಳು',
    terms_desc: 'ಬುಕಿಂಗ್‌ಗಳು, ಪಾವತಿಗಳು ಮತ್ತು ರದ್ದತಿ ನಿಯಮಗಳು',
    email_support_title: 'ಇಮೇಲ್ ಬೆಂಬಲ',
    dpdp_section: 'ನಿಮ್ಮ ಡೇಟಾ ಮತ್ತು DPDP ಹಕ್ಕುಗಳು',
    about_footer: 'OYUN · ಮಂಗಳೂರಿನ ಕ್ರೀಡಾ ಟರ್ಫ್‌ಗಳು ಮತ್ತು ಮೈದಾನಗಳು',
    book_again: 'ಒಂದೇ ಕ್ಲಿಕ್‌ನಲ್ಲಿ ಮತ್ತೆ ಬುಕ್ ಮಾಡಿ',
    book_now: 'ಈಗಲೇ ಬುಕ್ ಮಾಡಿ',
    reschedule: 'ಮರುಹೊಂದಿಸಿ',
    cancel_booking: 'ಬುಕಿಂಗ್ ರದ್ದುಗೊಳಿಸಿ',
    weather_advisory: 'ಹವಾಮಾನ ಎಚ್ಚರಿಕೆ',
    pay_at_venue: 'ಸ್ಥಳದಲ್ಲೇ ಪಾವತಿಸಿ',
    advance_payment: 'ಮುಂಗಡ ಪಾವತಿ',
    status_confirmed: 'ದೃಢೀಕರಿಸಲಾಗಿದೆ',
    status_cancelled: 'ರದ್ದುಗೊಳಿಸಲಾಗಿದೆ',
    time_today: 'ಇಂದು',
    time_tomorrow: 'ನಾಳೆ',
    time_morning: 'ಬೆಳಿಗ್ಗೆ',
    time_afternoon: 'ಮಧ್ಯಾಹ್ನ',
    time_evening: 'ಸಂಜೆ',
    time_night: 'ರಾತ್ರಿ',
  },
  hi: {
    tagline: 'बुक करें · खेलें · दोहराएं',
    nav_mangalore: 'मंगलौर',
    nav_list_turf: 'अपना टर्फ जोड़ें',
    nav_start_earning: 'आज ही कमाई शुरू करें',
    nav_my_bookings: 'मेरी बुकिंग्स',
    nav_sign_in: 'साइन इन',
    nav_hi: 'नमस्ते',
    account_section: 'खाता',
    profile_title: 'प्रोफ़ाइल',
    profile_desc: 'आपका नाम, फोन नंबर और साइन-इन',
    bookings_title: 'मेरी बुकिंग्स',
    bookings_desc: 'टिकट, रसीदें और रद्दीकरण',
    saved_title: 'सहेजे गए टर्फ',
    saved_desc: 'पसंदीदा टर्फ सूची',
    preferences_section: 'प्राथमिकताएं',
    cookies_title: 'कुकी सेटिंग्स',
    cookies_desc: 'एनालिटिक्स कुकीज़ प्रबंधित करें',
    notifications_title: 'सूचनाएं',
    notifications_desc: 'बुकिंग पुष्टिकरण और रिमाइंडर जल्द उपलब्ध होंगे',
    language_title: 'भाषा',
    language_desc: 'अपनी इंटरफ़ेस भाषा चुनें',
    help_section: 'सहायता और नियम',
    help_title: 'सहायता केंद्र',
    help_desc: 'सहायता और अक्सर पूछे जाने वाले प्रश्न',
    privacy_title: 'गोपनीयता नीति',
    privacy_desc: 'हम क्या डेटा रखते हैं और क्यों',
    terms_title: 'नियम एवं शर्तें',
    terms_desc: 'बुकिंग, भुगतान और रद्दीकरण नियम',
    email_support_title: 'ईमेल सहायता',
    dpdp_section: 'आपका डेटा और DPDP अधिकार',
    about_footer: 'OYUN · मंगलौर में स्पोर्ट्स टर्फ और कोर्ट्स',
    book_again: 'एक टैप में दोबारा बुक करें',
    book_now: 'अभी बुक करें',
    reschedule: 'पुनर्निर्धारित करें',
    cancel_booking: 'बुकिंग रद्द करें',
    weather_advisory: 'मौसम चेतावनी',
    pay_at_venue: 'स्थान पर भुगतान करें',
    advance_payment: 'अग्रिम भुगतान',
    status_confirmed: 'पुष्टि हुई',
    status_cancelled: 'रद्द',
    time_today: 'आज',
    time_tomorrow: 'कल',
    time_morning: 'सुबह',
    time_afternoon: 'दोपहर',
    time_evening: 'शाम',
    time_night: 'रात',
  },
  tcy: {
    tagline: 'ಬುಕ್ ಮಲ್ಪುಲೆ · ಗೊಬ್ಬುಲೆ · ಪಿರ ಮಲ್ಪುಲೆ',
    nav_mangalore: 'ಕುಡ್ಲ',
    nav_list_turf: 'ಈರೆನ ಟರ್ಫ್ ಲಿಸ್ಟ್ ಮಲ್ಪುಲೆ',
    nav_start_earning: 'ಇನಿಡ್ದೇ ಸಂಪಾದನೆ ಸುರು ಮಲ್ಪುಲೆ',
    nav_my_bookings: 'ಎನ್ನ ಬುಕಿಂಗ್‌ಲು',
    nav_sign_in: 'ಸೈನ್ ಇನ್',
    nav_hi: 'ಸೊಲ್ಮೆಲು',
    account_section: 'ಖಾತೆ',
    profile_title: 'ಪ್ರೊಫೈಲ್',
    profile_desc: 'ಈರೆನ ಪುದರ್, ಮೊಬೈಲ್ ನಂಬರ್ ಬುಕ್ಕ ಖಾತೆ',
    bookings_title: 'ಎನ್ನ ಬುಕಿಂಗ್‌ಲು',
    bookings_desc: 'ಟಿಕೆಟ್‌ಲು, ಬಿಲ್‌ಲು ಬುಕ್ಕ ರದ್ದತಿ',
    saved_title: 'ಒರಿತಿನ ಟರ್ಫ್‌ಲು',
    saved_desc: 'ಈರ್ ಇಷ್ಟ ಪಟ್ಟಿನ ಟರ್ಫ್‌ಲು',
    preferences_section: 'ಆದ್ಯತೆಲು',
    cookies_title: 'ಕುಕಿ ಸೆಟ್ಟಿಂಗ್ಸ್',
    cookies_desc: 'ವಿಶ್ಲೇಷಣೆ ಕುಕಿಲೆನ್ ಬದಲ್ ಮಲ್ಪುಲೆ',
    notifications_title: 'ಮಾಹಿತಿಲು',
    notifications_desc: 'ಬುಕಿಂಗ್ ಮಾಹಿತಿಲು ಬುಕ್ಕ ನೆನಪುಲು ಬೇಗನೆ ತಿಕ್ಕುಂಡು',
    language_title: 'ಬಾಸೆ',
    language_desc: 'ಈರೆನ ಬಾಸೆನ್ ಆಜಿಲೆ',
    help_section: 'ಸಹಾಯ ಬುಕ್ಕ ನಿಯಮೊಲು',
    help_title: 'ಸಹಾಯ ಕೇಂದ್ರ',
    help_desc: 'ಸಹಾಯ ಬುಕ್ಕ ಸಾಮಾನ್ಯ ಪ್ರಶ್ನೆಲು',
    privacy_title: 'ಗೌಪ್ಯತೆ ನೀತಿ',
    privacy_desc: 'ನಾವು ಒರಿಪುನ ಮಾಹಿತಿ ಬುಕ್ಕ ಕಾರಣೊಲು',
    terms_title: 'ನಿಯಮೊಲು ಬುಕ್ಕ ಒಪ್ಪಂದೊಲು',
    terms_desc: 'ಬುಕಿಂಗ್, ದುಡ್ಡು ಪಾವತಿ ಬುಕ್ಕ ಕ್ಯಾನ್ಸಲ್ ನಿಯಮೊಲು',
    email_support_title: 'ಇಮೇಲ್ ಸಹಾಯ',
    dpdp_section: 'ಈರೆನ ಡೇಟಾ ಬುಕ್ಕ DPDP ಹಕ್ಕುಲು',
    about_footer: 'OYUN · ಕುಡ್ಲದ ಕ್ರೀಡಾ ಟರ್ಫ್‌ಲು ಬುಕ್ಕ ಮೈದಾನೊಲು',
    book_again: 'ಒಂಜೇ ಒತ್ತುಡು ಪಿರ ಬುಕ್ ಮಲ್ಪುಲೆ',
    book_now: 'ಇತ್ತೆನೇ ಬುಕ್ ಮಲ್ಪುಲೆ',
    reschedule: 'ಪಿರ ಬದಲ್ ಮಲ್ಪುಲೆ',
    cancel_booking: 'ಬುಕಿಂಗ್ ಕ್ಯಾನ್ಸಲ್ ಮಲ್ಪುಲೆ',
    weather_advisory: 'ಬರ್ಸ/ವಾತಾವರಣ ಎಚ್ಚರಿಕೆ',
    pay_at_venue: 'ಟರ್ಫ್‌ಡೇ ದುಡ್ಡು ಕೊರ್ಲೆ',
    advance_payment: 'ಅಡ್ವಾನ್ಸ್ ಪಾವತಿ',
    status_confirmed: 'ಖಚಿತ ಆತ್ಂಡ್',
    status_cancelled: 'ಕ್ಯಾನ್ಸಲ್ ಆತ್ಂಡ್',
    time_today: 'ಇನಿ',
    time_tomorrow: 'ಎಲ್ಲೆ',
    time_morning: 'ಕಾಂಡೆ',
    time_afternoon: 'ಮಧ್ಯಾಹ್ನ',
    time_evening: 'ಬಯ್ಯಗ್',
    time_night: 'ರಾತ್ರೆ',
  },
};

export function isValidLocale(val: unknown): val is Locale {
  return typeof val === 'string' && (val === 'en' || val === 'kn' || val === 'hi' || val === 'tcy');
}

export function getStoredLocale(): Locale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;
  try {
    const raw = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (isValidLocale(raw)) return raw;
  } catch {}
  return DEFAULT_LOCALE;
}

export function setStoredLocale(locale: Locale): void {
  if (!isValidLocale(locale)) return;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, locale);
      // Also persist cookie for 1 year (SameSite=Lax)
      document.cookie = `${LOCALE_COOKIE_KEY}=${locale}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {}
    window.dispatchEvent(new CustomEvent(LOCALE_EVENT, { detail: { locale } }));
  }
}

export function t(key: TranslationKey, locale?: Locale): string {
  const activeLocale = locale && isValidLocale(locale) ? locale : (typeof window !== 'undefined' ? getStoredLocale() : DEFAULT_LOCALE);
  const dict = TRANSLATIONS[activeLocale] || TRANSLATIONS[DEFAULT_LOCALE];
  return dict[key] ?? TRANSLATIONS[DEFAULT_LOCALE][key] ?? key;
}

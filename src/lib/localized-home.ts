// Kannada and Hindi landing pages for people searching in their own language. Short on purpose: they explain the
// service and send readers to the English venue pages. Wording is drafted and needs a native-speaker review before
// the pages are opened to search engines (see LOCALIZED_PAGES_INDEXED).

export type LocalizedCode = 'kn' | 'hi';

export interface LocalizedHome {
  code: LocalizedCode;
  htmlLang: string; // BCP 47, e.g. kn-IN
  title: string;
  description: string;
  h1: string;
  lead: string;
  cta: string;
  stepsHeading: string;
  steps: { title: string; text: string }[];
  sportsHeading: string;
  sports: { label: string; slug: string }[];
  areasHeading: string;
  faqHeading: string;
  faqs: { q: string; a: string }[];
  englishNote: string;
}

// The pages are noindex and left out of the sitemap and hreflang until this is "true" (set after native review)
export const localizedPagesIndexed = () => process.env.LOCALIZED_PAGES_INDEXED === 'true';

export const LOCALIZED: Record<LocalizedCode, LocalizedHome> = {
  kn: {
    code: 'kn',
    htmlLang: 'kn-IN',
    title: 'ಮಂಗಳೂರಿನಲ್ಲಿ ಫುಟ್‌ಬಾಲ್, ಬಾಕ್ಸ್ ಕ್ರಿಕೆಟ್, ಬ್ಯಾಡ್ಮಿಂಟನ್ ಟರ್ಫ್ ಬುಕ್ ಮಾಡಿ',
    description: 'ಮಂಗಳೂರಿನ ಟರ್ಫ್ ಮತ್ತು ಕೋರ್ಟ್‌ಗಳಲ್ಲಿ ಲೈವ್ ಖಾಲಿ ಸ್ಲಾಟ್‌ಗಳನ್ನು ನೋಡಿ ಮತ್ತು ಆನ್‌ಲೈನ್‌ನಲ್ಲಿ ಬುಕ್ ಮಾಡಿ. ಫುಟ್‌ಬಾಲ್, ಬಾಕ್ಸ್ ಕ್ರಿಕೆಟ್, ಬ್ಯಾಡ್ಮಿಂಟನ್ ಮತ್ತು ಪಿಕಲ್‌ಬಾಲ್.',
    h1: 'ಮಂಗಳೂರಿನಲ್ಲಿ ಟರ್ಫ್ ಬುಕ್ ಮಾಡಿ',
    lead: 'ಮಂಗಳೂರಿನ ಟರ್ಫ್ ಮತ್ತು ಕೋರ್ಟ್‌ಗಳಲ್ಲಿ ಲೈವ್ ಸ್ಲಾಟ್‌ಗಳನ್ನು ನೋಡಿ, ನಿಮ್ಮ ಸಮಯವನ್ನು ಆರಿಸಿ ಮತ್ತು ಟಿಕೆಟ್‌ನೊಂದಿಗೆ ಆಟಕ್ಕೆ ಬನ್ನಿ. ಫೋನ್ ಕರೆ ಬೇಕಿಲ್ಲ.',
    cta: 'ಟರ್ಫ್‌ಗಳನ್ನು ನೋಡಿ ಮತ್ತು ಬುಕ್ ಮಾಡಿ',
    stepsHeading: 'ಬುಕ್ ಮಾಡುವುದು ಹೇಗೆ',
    steps: [
      { title: 'ಸಮಯ ಆರಿಸಿ', text: 'ನಿಮ್ಮ ಇಷ್ಟದ ಟರ್ಫ್, ದಿನ ಮತ್ತು ಗಂಟೆಗಳನ್ನು ಆರಿಸಿ. ಖಾಲಿ ಸ್ಲಾಟ್‌ಗಳು ಲೈವ್ ಆಗಿ ಕಾಣುತ್ತವೆ.' },
      { title: '8 ನಿಮಿಷ ಹಿಡಿದಿಡಿ', text: 'ನೀವು ಪಾವತಿ ಮಾಡುವಾಗ ನಿಮ್ಮ ಸ್ಲಾಟ್ 8 ನಿಮಿಷ ನಿಮಗಾಗಿ ಹಿಡಿದಿರುತ್ತದೆ.' },
      { title: 'ಟಿಕೆಟ್‌ನೊಂದಿಗೆ ಬನ್ನಿ', text: 'ಗಂಟೆಗೆ ₹150 ಮುಂಗಡ ಕೊಡಿ. ಉಳಿದ ಹಣವನ್ನು ಟರ್ಫ್‌ನಲ್ಲಿ ನಗದು ಅಥವಾ UPI ಮೂಲಕ ಕೊಡಿ.' },
    ],
    sportsHeading: 'ಆಟಗಳು',
    sports: [
      { label: 'ಫುಟ್‌ಬಾಲ್ ಟರ್ಫ್', slug: 'football' },
      { label: 'ಬಾಕ್ಸ್ ಕ್ರಿಕೆಟ್', slug: 'box-cricket' },
      { label: 'ಬ್ಯಾಡ್ಮಿಂಟನ್ ಕೋರ್ಟ್', slug: 'badminton' },
      { label: 'ಪಿಕಲ್‌ಬಾಲ್ ಕೋರ್ಟ್', slug: 'pickleball' },
    ],
    areasHeading: 'ಪ್ರದೇಶಗಳ ಪ್ರಕಾರ ಟರ್ಫ್‌ಗಳು',
    faqHeading: 'ಸಾಮಾನ್ಯ ಪ್ರಶ್ನೆಗಳು',
    faqs: [
      { q: 'ಟರ್ಫ್ ಬುಕ್ ಮಾಡಲು ಎಷ್ಟು ಮುಂಗಡ ಕೊಡಬೇಕು?', a: 'ಗಂಟೆಗೆ ₹150 ಮುಂಗಡ. ಉಳಿದ ಮೊತ್ತವನ್ನು ಟರ್ಫ್‌ನಲ್ಲಿ ನಗದು ಅಥವಾ UPI ಮೂಲಕ ಕೊಡಿ.' },
      { q: 'ಬುಕಿಂಗ್ ರದ್ದುಪಡಿಸಬಹುದೇ?', a: 'ಹೌದು. ಸ್ಲಾಟ್ ಆರಂಭವಾಗುವ 2 ಗಂಟೆ ಮೊದಲಿನವರೆಗೆ ನಿಮ್ಮ ಟಿಕೆಟ್‌ನಿಂದ ರದ್ದುಪಡಿಸಬಹುದು. ಹಣ ನಿಮ್ಮ OYUN ವಾಲೆಟ್‌ಗೆ ಬರುತ್ತದೆ.' },
      { q: 'ಮಳೆ ಬಂದರೆ ಏನಾಗುತ್ತದೆ?', a: 'ತೆರೆದ ಟರ್ಫ್‌ಗಳಲ್ಲಿ ಮಳೆಯಿಂದ ಆಟ ನಡೆಯದಿದ್ದರೆ ಅಥವಾ ನೀರು ನಿಂತಿದ್ದರೆ, ಮಾನ್ಸೂನ್ ರೇನ್ ಗ್ಯಾರಂಟಿ ಅಡಿಯಲ್ಲಿ 100% ಹಣ ನಿಮ್ಮ ವಾಲೆಟ್‌ಗೆ ಮರಳುತ್ತದೆ.' },
    ],
    englishNote: 'ಟರ್ಫ್ ವಿವರಗಳು ಮತ್ತು ಬುಕಿಂಗ್ ಪುಟಗಳು ಸದ್ಯಕ್ಕೆ ಇಂಗ್ಲಿಷ್‌ನಲ್ಲಿವೆ.',
  },
  hi: {
    code: 'hi',
    htmlLang: 'hi-IN',
    title: 'मंगलुरु (मैंगलोर) में फुटबॉल, बॉक्स क्रिकेट, बैडमिंटन टर्फ बुक करें',
    description: 'मंगलुरु (मैंगलोर) के टर्फ और कोर्ट में लाइव खाली स्लॉट देखें और ऑनलाइन बुक करें। फुटबॉल, बॉक्स क्रिकेट, बैडमिंटन और पिकलबॉल।',
    h1: 'मंगलुरु में टर्फ बुक करें',
    lead: 'मंगलुरु के टर्फ और कोर्ट में लाइव खाली स्लॉट देखें, अपना समय चुनें और टिकट लेकर खेलने आएँ। फ़ोन कॉल की ज़रूरत नहीं।',
    cta: 'टर्फ देखें और बुक करें',
    stepsHeading: 'बुकिंग कैसे करें',
    steps: [
      { title: 'समय चुनें', text: 'अपना पसंदीदा टर्फ, दिन और घंटे चुनें। खाली स्लॉट लाइव दिखते हैं।' },
      { title: '8 मिनट के लिए रोकें', text: 'भुगतान करते समय आपका स्लॉट 8 मिनट तक आपके लिए रुका रहता है।' },
      { title: 'टिकट के साथ आएँ', text: 'प्रति घंटे ₹150 एडवांस दें। बाकी रकम टर्फ पर नकद या UPI से दें।' },
    ],
    sportsHeading: 'खेल',
    sports: [
      { label: 'फुटबॉल टर्फ', slug: 'football' },
      { label: 'बॉक्स क्रिकेट', slug: 'box-cricket' },
      { label: 'बैडमिंटन कोर्ट', slug: 'badminton' },
      { label: 'पिकलबॉल कोर्ट', slug: 'pickleball' },
    ],
    areasHeading: 'इलाके के हिसाब से टर्फ',
    faqHeading: 'अक्सर पूछे जाने वाले सवाल',
    faqs: [
      { q: 'टर्फ बुक करने के लिए कितना एडवांस देना होता है?', a: 'प्रति घंटे ₹150 एडवांस। बाकी रकम टर्फ पर नकद या UPI से दें।' },
      { q: 'क्या बुकिंग रद्द की जा सकती है?', a: 'हाँ। स्लॉट शुरू होने से 2 घंटे पहले तक अपने टिकट से रद्द कर सकते हैं। पैसे आपके OYUN वॉलेट में लौटते हैं।' },
      { q: 'बारिश हो जाए तो क्या होगा?', a: 'खुले टर्फ पर बारिश से खेल न हो पाए या पानी भरा हो, तो मॉनसून रेन गारंटी के तहत 100% रकम आपके वॉलेट में लौट आती है।' },
    ],
    englishNote: 'टर्फ की जानकारी और बुकिंग पेज फिलहाल अंग्रेज़ी में हैं।',
  },
};

export interface GuideArticle {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  category: string;
  readTime: string;
  publishedAt: string;
  excerpt: string;
  coverImage: string;
  sections: {
    heading: string;
    paragraphs: string[];
    keyTakeaway?: string;
  }[];
  relatedSportSlug: string;
  faqs: { q: string; a: string }[];
}

export const GUIDES: GuideArticle[] = [
  {
    slug: 'pickleball-mangalore-venues',
    title: 'Where to Play Pickleball in Mangalore: Courts, Rules & Hourly Rates',
    metaTitle: 'Where to Play Pickleball in Mangalore | Courts, Rules & Prices',
    metaDescription: 'Complete guide to pickleball in Mangalore. Discover courts at Bharath Mall & Bikarnakatte, equipment rentals, beginner batches, and court booking tips.',
    category: 'Racket Sports',
    readTime: '4 min read',
    publishedAt: '2026-02-15',
    excerpt: 'Pickleball is sweeping across Mangalore as the city’s fastest-growing recreational sport. Here is everything you need to know about where to play, court rentals, and beginner rules.',
    coverImage: 'https://images.unsplash.com/photo-1693142517898-2f986215e412?q=80&w=1200&auto=format&fit=crop',
    relatedSportSlug: 'pickleball',
    sections: [
      {
        heading: '1. The Explosive Rise of Pickleball in Kudla',
        paragraphs: [
          'Over the past year, Mangalore has seen an unprecedented surge in pickleball enthusiasm. Combining elements of tennis, badminton, and ping-pong, pickleball is easy to pick up within minutes, has low joint impact, and offers exceptional social energy.',
          'Whether you are a university student in Deralakatte, an IT professional looking for an evening unwind, or a senior player seeking active fitness, the sport caters to all age groups and skill levels.',
        ],
        keyTakeaway: 'Pickleball has an exceptionally gentle learning curve — most first-timers sustain 10+ shot rallies within their first 15 minutes.',
      },
      {
        heading: '2. Top Venues to Play Pickleball in Mangalore',
        paragraphs: [
          '**OneLve Pickleball (Bharath Mall, 6th Floor, Bejai/Lalbagh):** Mangalore’s premier dedicated indoor pickleball destination. Featuring weatherproof indoor courts right in the heart of the city, OneLve provides relief from both coastal summer heat and monsoon downpours.',
          '**The Courtyard (Bikarnakatte):** A well-known community sports venue featuring dedicated outdoor pickleball surfaces, regular weekend mixers, and beginner-friendly evening coaching sessions.',
        ],
        keyTakeaway: 'Always choose indoor or covered courts during the Mangalore monsoon (June to September) to ensure zero weather cancellations.',
      },
      {
        heading: '3. Do You Need to Buy Gear Before Playing?',
        paragraphs: [
          'No! You do not need to invest ₹3,000–₹8,000 in a graphite paddle right away. All major pickleball venues in Mangalore offer complimentary paddle rentals or provide them for a nominal fee of ₹30–₹50 per session, along with perforated wiffle balls.',
          'All you need to bring is standard athletic wear and flat-soled court shoes with good lateral grip.',
        ],
      },
      {
        heading: '4. Essential Rules Every Beginner Should Know',
        paragraphs: [
          '**The Underhand Serve:** Serves must be delivered underhand with paddle contact below waist level, hit diagonally crosscourt into the opponent’s service box.',
          '**The Two-Bounce Rule:** After the serve, the receiving team must let the ball bounce once, and the serving team must also let the return bounce once before any volleys are permitted.',
          '**The Kitchen (Non-Volley Zone):** The 7-foot area on either side of the net is the "Kitchen". Players cannot hit the ball out of the air while standing inside this zone, preventing overpowering smash volleys.',
        ],
      },
      {
        heading: '5. Hourly Rates and Booking Tips',
        paragraphs: [
          'Court rates in Mangalore range from ₹400/hr during weekday morning off-peak hours up to ₹800–₹1,000/hr for peak weekend evening slots. Split between four players in a doubles match, this works out to an affordable ₹100–₹250 per person per hour.',
          'Slots between 6:00 PM and 9:00 PM book out quickly on Friday and Saturday evenings; reserve at least 24 hours in advance on OYUN.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Can beginners play pickleball at OneLve Bharath Mall without prior experience?',
        a: 'Yes, OneLve welcomes first-time players and often has court marshals on hand to explain basic scoring and rules.',
      },
      {
        q: 'What shoes are best for playing pickleball on indoor synthetic courts?',
        a: 'Wear court shoes, tennis shoes, or non-marking badminton shoes. Avoid running shoes with thick, spongey soles that can cause ankle rolls during rapid lateral side-shuffles.',
      },
    ],
  },
  {
    slug: 'padel-in-mangalore',
    title: 'Padel Tennis in Mangalore: Upcoming Courts, Rules & How It Compares to Pickleball',
    metaTitle: 'Padel in Mangalore | Court Developments, Rules & Equipment',
    metaDescription: 'Everything you need to know about padel tennis in Mangalore. Explore court developments, glass-wall rules, racket specs, and upcoming tournaments.',
    category: 'Racket Sports',
    readTime: '5 min read',
    publishedAt: '2026-02-18',
    excerpt: 'Padel is the fastest-growing racket sport on the planet. Here is the full breakdown of how padel works, when courts are arriving in Mangalore, and how it differs from pickleball.',
    coverImage: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?q=80&w=1200&auto=format&fit=crop',
    relatedSportSlug: 'padel',
    sections: [
      {
        heading: '1. What is Padel Tennis?',
        paragraphs: [
          'Padel is an energetic racket sport that originated in Mexico and took Spain, Europe, and Latin America by storm. It is played exclusively in doubles (2 vs 2) inside an enclosed court enclosed by tempered glass walls and heavy-duty steel mesh.',
          'What makes padel uniquely addictive is that the ball can be played off the glass walls after bouncing, similar to squash. This creates dynamic, prolonged rallies where pure brute force is replaced by strategic angles, patience, and lobs.',
        ],
        keyTakeaway: 'The glass walls keep the ball in play far longer than tennis, resulting in exhilarating 20-to-30 shot exchanges even among intermediate players.',
      },
      {
        heading: '2. Padel vs Pickleball: What is the Real Difference?',
        paragraphs: [
          'While both sports are accessible alternatives to tennis, they offer distinct experiences:',
          '• **Court Enclosure:** Padel courts have 10-meter glass walls that are actively part of play; pickleball is played on an open, flat badminton-sized court with no surrounding walls.',
          '• **The Ball:** Padel uses pressurized felt tennis-like balls with slightly reduced rebound; pickleball uses perforated hard plastic wiffle balls.',
          '• **Rackets:** Padel uses thick, solid composite rackets with drilled air holes; pickleball uses thinner, solid rectangular paddles.',
          '• **Strategy:** Padel requires three-dimensional spatial awareness to anticipate rebounds off back and side glass walls; pickleball focuses heavily on precise dinking at the kitchen line.',
        ],
      },
      {
        heading: '3. Current Status of Padel Courts in Mangalore',
        paragraphs: [
          'Dedicated padel court infrastructure requires specialized tempered glass engineering and turnkey structural construction. While traditional tennis and badminton have long held root in Mangalore, composite multi-sport venues and private academies across coastal Karnataka are currently commissioning the city’s inaugural padel arenas.',
          'OYUN is partnering with regional sports developers to ensure that the moment the first padel court opens its doors in Kudla, players can check live availability and book slots instantly online.',
        ],
      },
      {
        heading: '4. How Can Tennis and Badminton Players Transition?',
        paragraphs: [
          'If you already play tennis or squash, you will feel at home on a padel court within two sessions. Volleys, overhead bandeias, and drop shots carry over directly.',
          'Badminton players will appreciate the lightning-fast reflexes at the net, though they must adjust to waiting for the ball to bounce off the back wall rather than lunging forward too aggressively.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Can padel be played 1-on-1 (singles)?',
        a: 'Standard regulation padel courts are strictly designed for 2v2 doubles. Although specialized singles courts exist globally, over 95% of matches worldwide are played in doubles.',
      },
      {
        q: 'How can I get notified when padel slots go live in Mangalore?',
        a: 'Visit the /sports/padel page on OYUN and bookmark it or check back regularly to receive opening tournament announcements and early-bird discounts.',
      },
    ],
  },
  {
    slug: 'box-cricket-rules-pricing-mangalore',
    title: 'Box Cricket in Mangalore: Rules, Hourly Turf Prices & Tournament Guide',
    metaTitle: 'Box Cricket in Mangalore | Turf Rates, Rules & Night Matches',
    metaDescription: 'Master box cricket in Mangalore. Explore hourly turf prices, tournament rules, tennis ball types, and top venues with net enclosures.',
    category: 'Cricket',
    readTime: '4 min read',
    publishedAt: '2026-02-10',
    excerpt: 'Box cricket on artificial turf is the undisputed king of weekend group sports in Mangalore. Here is your definitive guide to rules, pricing, and organizing tournaments.',
    coverImage: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=1200&auto=format&fit=crop',
    relatedSportSlug: 'box-cricket',
    sections: [
      {
        heading: '1. Why Box Cricket Rules Mangalore Weekends',
        paragraphs: [
          'In a coastal city passionate about cricket, finding large natural grounds can be challenging. Artificial turf box cricket solved this problem, offering floodlit, fully netted rectangular pitches where 12 to 16 players can enjoy fast-paced 6-to-8 over matches regardless of the weather.',
          'From college groups in Deralakatte to corporate teams in Bejai and Kodialbail, box cricket is Mangalore’s favorite after-hours competition.',
        ],
      },
      {
        heading: '2. Standard Turf Rules in Mangalore',
        paragraphs: [
          '• **Direct Over the Net = OUT:** Hitting the ball directly out of the netted roof or beyond the boundary netting is declared out. Batsmen must focus on timing, ground strokes, and carroming off the side nets.',
          '• **Net Scoring Zones:** Specific net sections indicate runs (1, 2, or 4 runs depending on marked boundary lines).',
          '• **Bowling Rules:** Most leagues permit only overarm bowling with no chucking (bent elbow). Underarm bowling is reserved for recreational or children’s matches.',
          '• **One Tip, One Hand Catch:** Many recreational groups adopt the classic gully cricket rule: if the ball rebounds off the net or turf, catching it with one hand counts as out.',
        ],
        keyTakeaway: 'Always confirm the exact boundary rules with the opposing captain and turf manager before tossing the coin.',
      },
      {
        heading: '3. Hourly Rates Breakdown Across Mangalore',
        paragraphs: [
          'Turf pricing varies based on pitch size and time of day:',
          '• **Weekday Morning (6 AM – 4 PM):** ₹600 – ₹800 per hour (Budget-friendly for students).',
          '• **Weekday Evening (5 PM – 11 PM):** ₹900 – ₹1,200 per hour (Standard peak rate).',
          '• **Weekend Night Slots (7 PM – 2 AM):** ₹1,100 – ₹1,500 per hour (High demand, advance booking essential).',
        ],
      },
    ],
    faqs: [
      {
        q: 'Do box cricket turfs provide bats and balls?',
        a: 'Yes, standard turf bookings on OYUN include 2 to 3 tennis bats and multiple heavy/soft tennis balls free of charge.',
      },
      {
        q: 'Can we book multiple turfs side-by-side for corporate leagues?',
        a: 'Yes, venues like Mangala Magnus and Global Sports Arena feature expansive multi-pitch setups ideal for simultaneous group tournaments.',
      },
    ],
  },
  {
    slug: 'turf-football-rules-shoes',
    title: 'Turf Football Shoe Guide & Rules in Mangalore: Studs vs Turf Shoes',
    metaTitle: 'Turf Football Shoe Guide & Rules in Mangalore | Studs vs Turf Shoes',
    metaDescription: 'Can you wear studs on Mangalore football turfs? Complete footwear guide, 5v5 vs 7v7 dimensions, and artificial grass preservation tips.',
    category: 'Football',
    readTime: '4 min read',
    publishedAt: '2026-02-05',
    excerpt: 'Are studs allowed on artificial football turfs in Mangalore? Avoid ankle injuries and denied entry with this definitive football footwear and turf guide.',
    coverImage: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=1200&auto=format&fit=crop',
    relatedSportSlug: 'football',
    sections: [
      {
        heading: '1. The Golden Rule: Are Studs Allowed on Artificial Turfs?',
        paragraphs: [
          'The short answer: **Hard plastic Firm Ground (FG) or metal Soft Ground (SG) studs are STRICTLY BANNED on almost all commercial turfs in Mangalore.**',
          'Wearing long FG/SG studs on artificial grass is dangerous for two reasons: First, long studs do not penetrate rubber-infill turf cleanly, locking your foot during rapid turns and creating a severe risk of ACL knee tears and ankle sprains. Second, sharp studs slice and ruin the expensive imported artificial turf fibers.',
        ],
        keyTakeaway: 'Turf managers will inspect your footwear at check-in. Anyone wearing FG/SG studs will be asked to play in socks or flat sneakers.',
      },
      {
        heading: '2. The Best Footwear for Mangalore Turfs',
        paragraphs: [
          '• **Turf Shoes (TF - Highly Recommended):** These feature dozens of small, low-profile rubber nubs. They provide the perfect balance of grip, rotational mobility, and shock absorption on both dry and monsoon-damp artificial grass.',
          '• **Artificial Grass Cleats (AG):** Cleats with short, hollow conical plastic studs designed specifically for 3G/4G turf pitches.',
          '• **Flat Sole Court Shoes / Futsal Shoes (IC):** Acceptable on short-pile turf, though traction decreases slightly during heavy rains.',
        ],
      },
      {
        heading: '3. 5-a-Side vs 7-a-Side Pitches in Kudla',
        paragraphs: [
          'Most urban turfs in Mangalore (e.g. City Arena, The Futsal Dugout) are optimized for high-intensity **5-a-side futsal** (approx. 90x60 feet).',
          'Larger multi-sport arenas (like Mangala Magnus in Neermarga or Greens Field in Ullal) provide full **7-a-side configurations** (approx. 130x85 feet), offering more space for long passes, tactical crossing, and set-piece headers.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Can I play football barefoot on artificial turf in Mangalore?',
        a: 'While some players prefer barefoot play, black rubber infill can become hot under afternoon sun and cause friction blisters. Flat sneakers or TF shoes are strongly advised.',
      },
      {
        q: 'Do football turfs in Mangalore supply bibs and match balls?',
        a: 'Yes, match footballs and colored team bibs are included in your hourly reservation on OYUN.',
      },
    ],
  },
];

export function getGuide(slug: string): GuideArticle | null {
  return GUIDES.find((g) => g.slug === slug) ?? null;
}

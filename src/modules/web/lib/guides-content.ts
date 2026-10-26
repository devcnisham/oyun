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
  {
    slug: 'how-to-book-a-turf-in-mangalore',
    title: 'How to Book a Turf in Mangalore Online: Slots, Advance and Cancellation',
    metaTitle: 'How to Book a Turf in Mangalore Online | Step-by-Step Guide',
    metaDescription: 'Book a football or box cricket turf in Mangalore without phone calls. How live slots, the 8-minute hold, the ₹150 advance per hour and free cancellation work on OYUN.',
    category: 'Booking Basics',
    readTime: '3 min read',
    publishedAt: '2026-10-21',
    excerpt: 'Booking a turf used to mean calling three venues and waiting for a reply. Here is how online booking works in Mangalore, from picking a slot to walking in with your ticket.',
    coverImage: '/turfs/turf_0.jpg',
    relatedSportSlug: 'football',
    sections: [
      {
        heading: '1. Pick a venue, a day and your hours',
        paragraphs: [
          'Start from the list of turfs and courts in Mangalore and filter by sport, area or price. Each venue page shows hour-by-hour availability for the coming days, so you can see what is open before you commit to anything.',
          'You can book several hours in one go. If the venue allows it you can also book a half pitch instead of the full turf.',
        ],
        keyTakeaway: 'Check the live slot picker first. If an hour is shown as open, it is open: nobody has to confirm it by phone.',
      },
      {
        heading: '2. Your hours are held for 8 minutes',
        paragraphs: [
          'When you choose your hours they are held for you for 8 minutes while you sign in and confirm. During that time nobody else can book them. If you do not finish, the hold ends and the hours become open again.',
        ],
      },
      {
        heading: '3. Pay a small advance, the rest at the venue',
        paragraphs: [
          'A flat advance of ₹150 per hour secures your booking. You pay the balance at the venue by cash or UPI. Hourly prices on OYUN include floodlights and pitch maintenance, so there is no extra lighting charge at the gate.',
        ],
        keyTakeaway: 'Three hours means a ₹450 advance, and the remaining amount is paid at the turf.',
      },
      {
        heading: '4. Walk in with your ticket',
        paragraphs: [
          'After booking you get a ticket with a QR code. Show it at the venue to check in. The ticket also holds your invoice and a calendar file so the game lands in your phone calendar.',
        ],
      },
      {
        heading: '5. Cancelling and rain',
        paragraphs: [
          'You can cancel from your ticket up to 2 hours before the slot starts, and the refund goes to your OYUN wallet. For open-air turfs, the Monsoon Rain Guarantee gives a full wallet refund if the match is rained out or the turf is waterlogged.',
        ],
      },
    ],
    faqs: [
      { q: 'Do I need to call the turf to confirm my booking?', a: 'No. Open slots on OYUN are live, and your booking is confirmed once you complete it. Your ticket is the confirmation.' },
      { q: 'How much is the advance for a turf booking in Mangalore?', a: 'The advance is a flat ₹150 per hour. You pay the rest at the venue by cash or UPI.' },
      { q: 'Can I cancel a turf booking?', a: 'Yes, from your ticket up to 2 hours before the slot starts. The refund goes to your OYUN wallet.' },
    ],
  },
  {
    slug: 'badminton-courts-mangalore',
    title: 'Badminton Courts in Mangalore: Where to Play, Prices and Court Basics',
    metaTitle: 'Badminton Courts in Mangalore | Indoor Court Booking & Prices',
    metaDescription: 'Where to play badminton in Mangalore: indoor wooden courts in Bejai, a court at Prime Sports Arena in Ullal, hourly prices from ₹400 and how to book online.',
    category: 'Racket Sports',
    readTime: '3 min read',
    publishedAt: '2026-10-21',
    excerpt: 'Indoor wooden courts, air conditioning and a pro shop: a quick guide to booking a badminton court in Mangalore, with the listed hourly prices.',
    coverImage: '/turfs/turf_3.jpg',
    relatedSportSlug: 'badminton',
    sections: [
      {
        heading: '1. Venues listed on OYUN',
        paragraphs: [
          '**Smash Court Badminton (Bejai):** indoor wooden courts with air conditioning, changing rooms and a pro shop, listed from ₹400 per hour. Open from 5:00 AM to 10:00 PM.',
          '**Prime Sports Arena (Ullal):** a multi-sport venue that offers badminton alongside football, listed from ₹700 per hour for the venue. Open from 6:00 AM to 10:00 PM.',
        ],
        keyTakeaway: 'Prices and hours are as listed on each venue page. Check the live slot picker for today’s availability.',
      },
      {
        heading: '2. Why indoor wooden courts matter',
        paragraphs: [
          'Wooden floors give better grip and are kinder on knees and ankles than concrete. Indoor courts also remove wind from the game, which matters because a shuttlecock is easily pushed off line outdoors.',
          'In Mangalore’s monsoon, indoor courts are also the safest way to avoid a cancelled evening.',
        ],
      },
      {
        heading: '3. Court basics',
        paragraphs: [
          'A doubles badminton court is 13.4 m long and 6.1 m wide. The net is 1.55 m high at the posts. Singles use the same length but a narrower width.',
          'Bring non-marking indoor shoes. Many venues ask for them to protect the floor.',
        ],
      },
      {
        heading: '4. Booking tips',
        paragraphs: [
          'Early-morning and late-evening hours are usually the busiest for working players, so look at weekday evenings a few days ahead. Booking online holds your hours for 8 minutes while you check out, and you pay a small advance with the balance at the venue.',
        ],
      },
    ],
    faqs: [
      { q: 'How much does a badminton court cost per hour in Mangalore?', a: 'On OYUN, badminton courts are listed from ₹400 per hour. Each venue page shows its current price.' },
      { q: 'Are there indoor badminton courts in Mangalore?', a: 'Yes. Smash Court Badminton in Bejai has indoor wooden courts with air conditioning.' },
      { q: 'Can I book a badminton court online?', a: 'Yes. Pick a venue, choose your hours, and confirm. Your hours are held for 8 minutes while you check out.' },
    ],
  },
  {
    slug: 'playing-sports-in-mangalore-monsoon',
    title: 'Playing Sports in the Mangalore Monsoon: Covered Courts, Rain Refunds and Tips',
    metaTitle: 'Sports in the Mangalore Monsoon | Covered Turfs & Rain Refund',
    metaDescription: 'How to keep your game on during the Mangalore monsoon: indoor and covered venues, what the Monsoon Rain Guarantee refunds, and tips for playing safely in the rain.',
    category: 'Planning',
    readTime: '3 min read',
    publishedAt: '2026-10-21',
    excerpt: 'Mangalore gets heavy rain every year. Here is how to keep your booking useful: choose covered venues, know the refund rule and play safely when the pitch is wet.',
    coverImage: '/turfs/turf_4.jpg',
    relatedSportSlug: 'football',
    sections: [
      {
        heading: '1. Prefer covered or indoor venues in the rainy months',
        paragraphs: [
          'Indoor courts such as the wooden badminton courts in Bejai and the indoor pickleball courts stay playable in heavy rain. Open-air turfs can be waterlogged after a downpour even if it has stopped raining.',
        ],
        keyTakeaway: 'See the list of covered turfs on OYUN for venues that keep playing through the monsoon.',
      },
      {
        heading: '2. What the Monsoon Rain Guarantee does',
        paragraphs: [
          'For open-air outdoor turfs, if a match is rained out or the turf is waterlogged, you get a 100% refund to your OYUN wallet, even right up until your scheduled slot time.',
        ],
      },
      {
        heading: '3. Playing safely on a wet pitch',
        paragraphs: [
          'Wet artificial grass is slippery. Wear studs or turf shoes with good grip and warm up longer than usual. Avoid playing during lightning: leave the pitch and shelter indoors.',
          'Bring a towel and a change of clothes. Many venues have changing rooms, which you can check on the venue page.',
        ],
      },
      {
        heading: '4. Plan a backup',
        paragraphs: [
          'If you organise a regular team game, book one covered or indoor option as a backup. You can cancel from your ticket up to 2 hours before the slot, with the refund going to your wallet.',
        ],
      },
    ],
    faqs: [
      { q: 'What happens if it rains on my booking?', a: 'For open-air outdoor turfs, the Monsoon Rain Guarantee gives a 100% refund to your OYUN wallet if the match is rained out or the turf is waterlogged.' },
      { q: 'Which venues are safe to play in heavy rain?', a: 'Indoor and covered venues, such as indoor badminton and pickleball courts. See the covered turfs list for football and box cricket options.' },
      { q: 'Can I cancel if the forecast looks bad?', a: 'Yes, from your ticket up to 2 hours before the slot starts. The refund goes to your wallet.' },
    ],
  },
  {
    slug: 'football-5-a-side-vs-7-a-side-mangalore',
    title: '5-a-Side vs 7-a-Side Football in Mangalore: Which Turf Size to Book',
    metaTitle: '5-a-Side vs 7-a-Side Football Turfs in Mangalore | Which to Book',
    metaDescription: 'Choosing a football turf size in Mangalore: how 5-a-side and 7-a-side games differ, how many players to bring, and how to split the hourly price.',
    category: 'Football',
    readTime: '3 min read',
    publishedAt: '2026-10-21',
    excerpt: 'A small pitch means more touches and quick play; a bigger one needs more players and stamina. Here is how to pick the right turf size for your group.',
    coverImage: '/turfs/turf_5.jpg',
    relatedSportSlug: 'football',
    sections: [
      {
        heading: '1. The difference in one line',
        paragraphs: [
          'A 5-a-side game has five players per team and is fast, close and technical. A 7-a-side game has seven per team on a larger pitch and leaves more room for passing and positions.',
        ],
        keyTakeaway: 'Bring 10 to 12 players for a 5-a-side game, and 14 to 18 for 7-a-side so you can rotate.',
      },
      {
        heading: '2. How to choose',
        paragraphs: [
          'If your group is under 12 people, a smaller pitch keeps everyone involved. For bigger groups, pick a larger turf, and check the venue page for its size, surface and whether the pitch can be split into halves.',
          'Some venues list a half pitch that you can book separately, which can suit a smaller group at a lower price.',
        ],
      },
      {
        heading: '3. Prices and splitting the cost',
        paragraphs: [
          'Football turfs on OYUN are priced per hour for the whole pitch, listed from around ₹600 to ₹1,200 depending on the venue and time. Divide the hourly price by the number of players: for example a ₹900 hour with 12 players is ₹75 each.',
          'Booking is a ₹150 advance per hour, with the balance paid at the venue by cash or UPI.',
        ],
      },
      {
        heading: '4. What to bring',
        paragraphs: [
          'Turf shoes or studs suited to artificial grass, shin guards, water and a spare shirt. Many venues provide bibs and offer equipment rental; check the amenities on the venue page.',
        ],
      },
    ],
    faqs: [
      { q: 'How many players are needed for a turf football game?', a: 'A 5-a-side game needs 10 players, and a 7-a-side game needs 14. Bring a few extra to rotate.' },
      { q: 'How much does a football turf cost in Mangalore?', a: 'Hourly prices on OYUN range from about ₹600 to ₹1,200 for the whole pitch, depending on the venue and time.' },
      { q: 'Can I book half of a turf?', a: 'Some venues split the pitch into two halves that are booked separately. Check the venue page.' },
    ],
  },
];

export function getGuide(slug: string): GuideArticle | null {
  return GUIDES.find((g) => g.slug === slug) ?? null;
}

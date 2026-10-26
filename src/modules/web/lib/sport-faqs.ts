export interface SportFaq {
  q: string;
  a: string;
}

export const SPORT_FAQS: Record<string, SportFaq[]> = {
  football: [
    {
      q: 'Are football studs allowed on artificial turfs in Mangalore?',
      a: 'Most turfs in Mangalore require flat-sole turf shoes or rubber studs (TF/AG). Hard plastic or metal studs (FG/SG) are strictly prohibited to prevent damaging the artificial grass and reduce injury risk.',
    },
    {
      q: 'Which football turfs in Mangalore are open for late-night matches?',
      a: 'Venues in Bejai, Kadri, Pandeshwar, and Neermarga feature high-intensity LED floodlights with night slots running past midnight. You can check live availability and book night slots directly on Slot Arena.',
    },
    {
      q: 'Do football turfs in Mangalore provide balls and bibs?',
      a: 'Yes, standard turf bookings include match-ready footballs and two sets of colored bibs for teams. You only need to bring your sports attire and appropriate footwear.',
    },
    {
      q: 'Can we play football during the Mangalore monsoon season?',
      a: 'Yes, top venues feature rapid sub-surface drainage systems or full overhead netting and roofs to keep games running smoothly even during heavy coastal monsoon showers.',
    },
  ],
  'box-cricket': [
    {
      q: 'What is the hourly rate for box cricket turfs in Mangalore?',
      a: 'Box cricket rates in Mangalore range from ₹600 to ₹1,200 per hour depending on time slot. Weekday daytime slots offer the lowest rates, while weekend night slots (7 PM to midnight) are peak hours.',
    },
    {
      q: 'Are cricket bats and tennis balls provided at the turf?',
      a: 'Yes, all box cricket venues provide standard lightweight tennis cricket bats and balls (soft or hard tennis) complimentary with your slot booking.',
    },
    {
      q: 'Can we host corporate tournaments or league matches on Mangalore turfs?',
      a: 'Yes. Venues with spectator seating, dugouts, and dedicated parking can be booked for multi-hour blocks or weekend tournament packages through Slot Arena.',
    },
    {
      q: 'What are the standard rules for box cricket on turf?',
      a: 'Box cricket is typically played 6v6 or 8v8. Runs are scored by hitting perimeter nets, direct hits over the boundary net count as out, and overarm bowling is standard with strict line rules.',
    },
  ],
  badminton: [
    {
      q: 'Which badminton courts in Mangalore offer wooden vs synthetic flooring?',
      a: 'Mangalore features Brazilian teak wood courts (such as Mangala Magnus) and BWF-standard synthetic mat courts (such as Urwa Indoor Stadium). Synthetic mats provide superior grip and shock absorption, while teak wood delivers classic natural bounce.',
    },
    {
      q: 'Are non-marking shoes mandatory on Mangalore badminton courts?',
      a: 'Yes, all indoor badminton courts in Mangalore strictly require clean non-marking gum sole shoes to prevent marks and maintain court traction. Many venues offer shoe and racquet rentals at the reception.',
    },
    {
      q: 'Can I book single hourly slots without a monthly membership?',
      a: 'Yes! On Slot Arena you can book flexible single hourly slots whenever you want without lock-in subscriptions. Early morning (6 AM – 9 AM) and evening slots can be reserved online.',
    },
    {
      q: 'Are there badminton coaching classes available in Mangalore?',
      a: 'Yes, leading indoor academies across Urwa, Neermarga, and Bejai conduct structured coaching batches for kids and adults, along with regular recreational open court play.',
    },
  ],
  pickleball: [
    {
      q: 'Where can I play pickleball in Mangalore?',
      a: 'Prominent pickleball venues in Mangalore include OneLve Pickleball (indoor on the 6th floor of Bharath Mall, Bejai) and The Courtyard (Bikarnakatte), alongside composite multi-sport venues in the city.',
    },
    {
      q: 'Do I need to own a paddle to play pickleball?',
      a: 'No! Pickleball venues in Mangalore offer paddle and ball rentals with every court reservation, so beginners and casual groups can jump into a match immediately without buying gear.',
    },
    {
      q: 'Is pickleball beginner friendly?',
      a: 'Extremely friendly. Most players learn the rules in 10 minutes. The underhand serve and non-volley zone ("kitchen") lead to accessible rallies that are fun for players of all ages and fitness levels.',
    },
    {
      q: 'What shoes should I wear for indoor pickleball?',
      a: 'Wear court shoes, tennis shoes, or non-marking badminton shoes with good lateral stability. Avoid running shoes with thick treads to protect your ankles on quick sideways moves.',
    },
  ],
  padel: [
    {
      q: 'Is there a padel tennis court currently open in Mangalore?',
      a: 'Mangalore’s first dedicated padel courts with glass enclosures are currently under development. Slot Arena partners with venue developers across coastal Karnataka to bring you real-time bookings as soon as courts launch.',
    },
    {
      q: 'How is padel different from pickleball and tennis?',
      a: 'Padel is played inside an enclosed glass court where the ball can bounce off the walls (like squash) using solid stringless rackets. Pickleball is played on an open badminton-sized court with perforated plastic balls.',
    },
    {
      q: 'Can tennis players easily learn padel?',
      a: 'Yes, tennis players adapt rapidly to padel because overhead smashes, volleys, and net play translate smoothly. The glass rebound mechanic adds an exciting strategic element.',
    },
    {
      q: 'How can I get notified when padel courts launch in Mangalore?',
      a: 'Check this page on Slot Arena regularly or sign up for launch alerts to receive early-bird slot access, tournament invitations, and discounted opening rates.',
    },
  ],
};

export function getSportFaqs(sportSlug: string): SportFaq[] {
  return SPORT_FAQS[sportSlug] ?? [
    {
      q: `How do I book a court on Slot Arena in Mangalore?`,
      a: `Select your preferred venue, pick an open date and time slot, and confirm your booking instantly online. You will receive an immediate confirmation code.`,
    },
    {
      q: `What is the cancellation policy for bookings?`,
      a: `Cancellations made within the allowable venue window receive an instant refund or wallet credit in accordance with the venue's cancellation policy.`,
    },
  ];
}

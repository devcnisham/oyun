// Static choices and starting values for the turf listing form.

export const amenitiesOptions = [
  'Changing Rooms', 'Parking', 'Floodlights', 'Drinking Water',
  'Restrooms', 'Café', 'AC Lobby', 'First Aid', 'WiFi',
];
export const sizes = ['3-a-side', '5-a-side', '6-a-side', '7-a-side', '11-a-side'];
export const surfaces = ['Artificial Grass', 'FIFA Certified Grass', 'FIFA Pro Artificial Grass', 'Synthetic Turf', 'Natural Grass'];
export const mangaloreAreas = ['Kodialbail', 'Kankanady', 'Bejai', 'Hampankatta', 'Kadri', 'Falnir', 'Mangaladevi', 'Attavar', 'Bunder', 'Urwa', 'Other'];

export const EMPTY_FORM = {
  // Step 1 - Owner
  ownerName: '',
  ownerPhone: '',
  ownerEmail: '',
  // Step 2 - Turf
  turfName: '',
  area: '',
  address: '',
  sport: 'Football',
  size: '',
  surface: '',
  openTime: '06:00',
  closeTime: '22:00',
  // Step 3 - Pricing
  weekdayPrice: '',
  weekendPrice: '',
  eveningPrice: '',
  // Step 4 - Extra
  description: '',
  whatsapp: '',
};

export type ListingForm = typeof EMPTY_FORM;

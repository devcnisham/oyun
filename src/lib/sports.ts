// The sports people can filter turfs by. `value` is what turfs list in `sports` and what /arenas?sport= expects.
export const SPORTS = [
  { value: 'Football', label: 'Football', image: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=600&auto=format&fit=crop' },
  { value: 'Box Cricket', label: 'Box Cricket', image: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=600&auto=format&fit=crop' },
  { value: 'Badminton', label: 'Badminton', image: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=600&auto=format&fit=crop' },
  { value: 'Pickleball', label: 'Pickleball', image: 'https://images.unsplash.com/photo-1693142517898-2f986215e412?q=80&w=600&auto=format&fit=crop' },
] as const;

export const sportHref = (value: string) => `/arenas?sport=${encodeURIComponent(value)}`;

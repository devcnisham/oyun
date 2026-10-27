type Action = 'invoice' | 'directions' | 'book' | 'calendar' | 'share' | 'week' | 'split' | 'download';
const paths: Record<Action, string> = {
  download: 'M12 3v12m-4-4 4 4 4-4M4 16v5h16v-5',
  invoice: 'M6 3h12v18l-3-2-3 2-3-2-3 2V3ZM9 7h6M9 11h6M9 15h3',
  directions: 'm12 3 9 9-9 9-9-9 9-9ZM8 14v-3h7m-3-3 3 3-3 3',
  book: 'M5 5h14v16H5zM8 3v4m8-4v4M5 10h14m-7 3v5m-2.5-2.5h5',
  calendar: 'M5 5h14v16H5zM8 3v4m8-4v4M5 10h14m-10 5 2 2 4-4',
  share: 'M21 11a9 9 0 0 1-9 9H3l2-5a9 9 0 1 1 16-4ZM9 7c-2 2 3 7 5 7l2-2-2-1-1 1-3-3 1-1-1-2-1 1Z',
  week: 'M4 7h13l-3-3m3 3-3 3M20 17H7l3 3m-3-3 3-3',
  split: 'M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8-1a2.5 2.5 0 1 0 0-5M3 21v-3a6 6 0 0 1 12 0v3m3-8a5 5 0 0 1 3 5v3',
};
export default function BookingActionIcon({ action }: { action: Action }) {
  return <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[action]} /></svg>;
}

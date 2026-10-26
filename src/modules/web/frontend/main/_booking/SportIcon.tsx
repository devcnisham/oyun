export default function SportIcon({ sport }: { sport: string }) {
  return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {sport === 'Football' ? <><circle cx="12" cy="12" r="9"/><path d="m12 7 4.8 3.5-1.8 5.6H9l-1.8-5.6L12 7Zm0 0V3m4.8 7.5 3.6-1.2M15 16.1l2.3 3.1M9 16.1l-2.3 3.1M7.2 10.5 3.6 9.3"/></> :
      sport === 'Box Cricket' ? <><path d="m13 3 5 5-9 10-5-5 9-10Zm-6 13-4 5m14-15 4-4"/><circle cx="19" cy="18" r="2.5"/></> :
      sport === 'Badminton' ? <><ellipse cx="9" cy="8" rx="5" ry="6" transform="rotate(-35 9 8)"/><path d="m12 13 7 8m-3-5 4 4M5 6l8 5M7 3l6 5"/></> :
      <><rect x="5" y="2" width="13" height="14" rx="5"/><path d="M10 16v5h4v-5"/><circle cx="9" cy="7" r=".5"/><circle cx="14" cy="7" r=".5"/><circle cx="11.5" cy="11" r=".5"/></>}
  </svg>;
}

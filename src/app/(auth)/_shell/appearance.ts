// Make Clerk's forms match OYUN: brand red, rounded inputs, no extra card chrome (the page is the card)
export const clerkAppearance = {
  variables: {
    colorPrimary: '#d31027',
    colorText: '#222222',
    colorTextSecondary: '#626262',
    borderRadius: '12px',
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: '15px',
  },
  elements: {
    rootBox: { width: '100%' },
    cardBox: { width: '100%', boxShadow: 'none', border: 'none' },
    card: { boxShadow: 'none', border: 'none', padding: 0, background: 'transparent' },
    header: { display: 'none' }, // the page already has the title
    formButtonPrimary: { fontWeight: 800, fontSize: '15px', padding: '12px', textTransform: 'none' },
    footer: { display: 'none' }, // the page has its own sign-in/sign-up links
  },
};

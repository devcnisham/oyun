# OYUN booking home redesign — approved design

## Goal
Replace the current stretched app feed with a deliberately designed, responsive booking home. A visitor should be able to search, compare a venue and open its booking page immediately.

## References and direction
- User's card screenshot: generous image areas, rounded white venue cards, clear availability, price and Book now actions; three colourful off-peak offer cards below.
- https://two26.studio/about: bold, tightly spaced display typography, confident spacing, pill controls and restrained motion. Translate that visual confidence into OYUN's identity.
- Recommended: a light booking marketplace with a compact typographic hero and prominent search. This balances the studio reference with quick venue discovery.
- Alternative: a full-screen expressive studio hero. Stronger branding but pushes the booking controls and venues down.
- Alternative: a dense results-first directory. Fast comparison but loses the spacious card treatment requested in the screenshot.

## Visual system
- Keep OYUN's actual logo and Baloo 2 wordmark.
- Use existing Inter for UI/body and bold, tightly tracked display headings; no new font download is required.
- Brand colours: deep red #9e0a0a and #4a0000; booking action #d31027; text #222222; white #ffffff and light surface #f3f5f7.
- Use existing status colours: gold for featured labels, green for availability, blue for off-peak information.
- A 1440px maximum content width, 32px desktop gutters, 16px phone gutters and consistent section spacing.
- Card corners approximately 28–32px and pill buttons echo the supplied reference. Shadows stay subtle.
- Signature: a large, compact “Find your next game.” title beside the location context, immediately followed by the booking search. The first venue row remains close to the top of the page.

## Page order
1. Clean navigation: OYUN, Browse turfs, Offers, My bookings, account and List your turf.
2. Compact heading and search: venue/area query, sport, date, and Search turfs. Search submits existing supported filters to `/arenas`.
3. Sport shortcuts, with text labels and accessible active states.
4. Featured turfs: four cards on wide screens, two on tablets, one readable card per row on phones. Include real venue photo, featured label when true, rating only when backed by reviews, availability, venue name, area, starting hourly price and Book now.
5. Morning and afternoon deals: three cards on wide screens, stacked on phones. Use real active happy-hour offers and their applicable time ranges. Show the offer percentage and actual booking conditions. Display calculated monetary savings only when the existing pricing rules support that figure.
6. Sponsored ads: in-page sponsor cards using configured `site.ads`, each clearly labelled Sponsored and linked to its configured destination. No blocking promotional modal on the redesigned home.
7. More venues and a restrained owner call-to-action, followed by the existing useful footer links.

## Content rules
- The screenshot is a visual reference; its names, ratings, prices, distances and discounts are not production data.
- Featured status does not prove sponsorship. Only explicit sponsor ads receive Sponsored labels.
- Do not invent distances or availability, or turn ordinary first-booking offers into morning/afternoon deals.
- If there are no featured venues, show actual available venues under “Explore turfs”.
- If there are no valid off-peak deals, show an honest empty state with a browse action; do not invent discount cards.
- If no sponsors are configured, omit the paid-ad section from the public page.

## Implementation scope
- New focused home components: booking search, venue card, deal card and sponsor section, with a dedicated responsive stylesheet.
- Fetch and prepare public venue, offer and sponsor data on the server. Keep only interactive search/filter controls client-side.
- Apply the new home to both `/` and the existing `/m` compatibility route.
- Update shared navigation only where required for this design; preserve working venue selection, authentication, booking, cancellation and payment behaviour.
- This first redesign covers the home and shared navigation. Results, venue-detail and checkout screens continue to work through existing routes and can receive the same visual treatment in a subsequent pass.
- Preserve metadata and structured data. Do not change route structure or expose private fields.
- The previously observed production canonical-domain configuration issue remains a separately identified issue, not a claim of a passing canonical check.

## Verification and release
- Check desktop, tablet and phone layouts visually, including empty-data states and narrow widths.
- Verify search filters reach results, venue cards open booking pages, deals lead to the correct venue and sponsor links use the configured URL.
- Verify keyboard navigation, focus visibility, contrast and reduced-motion behaviour.
- Run relevant browser booking regressions, type checking and linting; inspect metadata, sitemap, robots and response status.
- Present the finished local preview for visual review before the redesigned home replaces production.

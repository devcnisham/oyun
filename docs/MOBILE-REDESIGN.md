# Mobile redesign (22 Oct 2026)

Brief: redesign the whole player-facing site for phones, in the app-like style of a dark, photo-led delivery home screen (location bar, category cards, big offer banner, horizontal collections), with dark and light themes that follow the phone setting.

Scope: everything a player sees (`(main)`, `(auth)`, bottom bar, sheets and dialogs). Owner and admin dashboards are out of scope for this pass and stay light.

## Design
- **Theme:** semantic tokens in `globals.css`. Light is today's palette. Dark applies on `html:has(.playerRoot)` under `prefers-color-scheme: dark` (and `data-theme="dark"` for a future toggle), so portalled sheets and dialogs follow it. Only player pages carry `.playerRoot`, so the dashboards are untouched. Print is forced light.
- **Colour:** one red accent. Red as a button background keeps `#d31027`; red as text uses `--accent-text` (`#ff6b7c` in dark) so it keeps 4.5:1. Status colours (open, held, error, info) are tokens with dark variants.
- **Type:** Inter for text, tabular numbers for prices and times.
- **Layout:** 16 px gutters, 44 px minimum targets, bottom bar with a raised search button, sticky location bar, cards with photos, horizontal scrollers with snap.
- **Motion:** short fades and presses only; everything respects reduced motion.

## Phases (one pull request each)
| # | Phase | Done when |
|---|---|---|
| 0 | Theme foundation: tokens, dark/light, player root, hard-coded colours moved to tokens | every player page readable in both themes, axe clean |
| 1 | Home: location bar, sport cards, search, offers banner, collections; bottom bar | 375 and 390 px screenshots in both themes |
| 2 | Venue list and search sheet | |
| 3 | Venue page, slot picker, checkout, sign-in sheets | booking e2e passes |
| 4 | Tickets, bookings, profile, saved, settings | |
| 5 | Content and form pages: help, FAQ, guides, about, legal, list-turf, offers, events | |
| 6 | QA: axe in both themes, Lighthouse, screenshots, reduced motion | all gates green |

Rules: no invented numbers, no stock-looking illustrations, no emoji as icons, photos only from our own files.

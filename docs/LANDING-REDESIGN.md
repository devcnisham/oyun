# Landing redesign: plan

Status: built 21 Oct 2026 (phases 0 to 7 done; phase 8 checks run: Lighthouse mobile about 89 to 90 performance, 100 accessibility, best practices and SEO; axe passes on desktop and phone; unit tests, lint, types, knip and dup clean).

Follow-ups not done: real WebGL (decided against for the performance budget), a custom cursor, and a loading intro.

## 1. What is wrong with the current page (honest critique)
It is clean, but it reads as generated. The tells:
- **Template rhythm.** Every section is eyebrow, big heading, grid of identical rounded cards. Nothing breaks the pattern.
- **Icon-in-a-box tiles** and a symmetrical bento: the most common AI layout.
- **No photography.** The product is about places and people, and the page shows none. Three real photos sit unused in `public/turfs`, including a lane-side turf between shops, which is exactly the Mangalore story.
- **Flat depth.** One soft glow and a 2D illustration. No scale contrast, no camera, no sense of a place.
- **Safe motion.** Fade-up on everything. No signature interaction.
- **Generic copy** ("Everything around the booking, handled.").
- **Numbered 01/02/03 cards** used as decoration.

## 2. Concept: "Floodlight night"
The page is a match under floodlights, seen from the stand. The camera moves as you scroll: it starts above the pitch, drops to the lines, and ends on the scoreboard. Dark, warm, photographic, with brand red used like a floodlight gel, not a colour fill. The product's real object (the slot board) is the hero of every scene.

Signature moment: the hero is a real 3D pitch (CSS 3D, perspective) with floodlight beams; the slot board floats above it and responds to the pointer. Scrolling pulls the camera down the pitch into the story.

## 3. Design system
- **Colour:** ink `#0b0708`, night `#150e10`, brand red `#d31027` (floodlight gel), pitch green `#1f8a55` only for "open", line white `#f4f1ec`, warm floodlight `#ffd9a0` for light.
- **Type:** Barlow Condensed (display, huge, uppercase, tight), Barlow (text), Baloo 2 wordmark only inside the logo. Fluid scale up to ~14vw for hero and closing type.
- **Space and layout:** break the grid on purpose: full-bleed photo bands, offset columns, overlapping elements, one oversized type line per section.
- **Motion tokens:** expo-out `cubic-bezier(.16,1,.3,1)`; reveals 600 to 900 ms; micro-interactions 150 to 250 ms; only `transform` and `opacity`.
- **Imagery:** the three real photos, graded (duotone and grain), masked into shapes; never stock-looking gradients.

## 4. Technology decisions
- **3D:** CSS 3D transforms (perspective, `rotateX/Y`, `translateZ`) plus pointer and scroll driven custom properties. No three.js: it adds 150 KB+ and a WebGL context, which would break the Lighthouse and mobile budget. Real WebGL can be a later opt-in.
- **Scroll and pointer:** a small in-house hook writes CSS variables (`--p`, `--mx`, `--my`) inside `requestAnimationFrame`; elements are paused when off-screen (IntersectionObserver). No animation library.
- **Budget:** landing JS under about 40 KB gzipped on top of the app shell; Lighthouse mobile performance stays 90 or more, accessibility 100; CLS 0.
- **Accessibility:** full reduced-motion path (static, finished state), visible focus, text never inside images, controls 44 px, no motion that is the only carrier of meaning.
- **Fallbacks:** if `perspective` or `mask` fail, the layout stays readable flat.

## 5. Sections and phases (built in this order)
| # | Phase | What | Done when |
|---|---|---|---|
| 0 | Foundation | tokens, `useScrollProgress`, `usePointer`, text-split mask reveal, magnetic button, photo component with grade, intro | hooks tested, no layout shift |
| 1 | Header and hero | 3D pitch scene, floodlights, floating slot board with pointer tilt, giant headline with mask reveal, magnetic CTAs, scroll cue | hero runs at 60 fps, LCP under 3 s |
| 2 | Place ribbon | oversized marquee of real Mangalore areas and the four sports | smooth, pauses on hover |
| 3 | Sports gallery | horizontal pinned gallery with real photos, 3D tilt cards, custom "drag" cursor on desktop | works with keyboard and touch |
| 4 | Story | pinned scroll story: pick, hold, play; the 3D pitch changes with each step; live 8:00 hold ring | steps readable without motion |
| 5 | Player features | asymmetric editorial layout with three micro-demos: hold timer ring, 3D flip ticket, cancel switch | no icon-box tiles |
| 6 | Owners | tilted 3D dashboard device, calendar that fills as you scroll, counters | reads cleanly on phones |
| 7 | FAQ, final CTA, footer | giant spotlight-reactive type, refined accordion, oversized footer wordmark | |
| 8 | Polish and proof | copy pass, intro, cursor, performance and accessibility pass, mobile pass, Lighthouse, axe e2e | all gates green |

## 6. Copy direction
Short, specific, local. Real areas (Kodialbail, Kankanady, Bejai, Ullal), real sports, no invented numbers or testimonials. Illustrations are labelled.

## 7. Risks
- 3D and many animated layers can hurt mobile performance: cap layers, pause off-screen, lower effects on small or low-power screens.
- Heavy pinned scroll can feel hijacked: keep native scroll, never trap it.
- The three photos repeat across turfs; the landing uses them as brand imagery, not as specific venues.


## Update 21 Oct 2026: the 3D version was too much
The floodlit 3D pitch, slot board, court line art, tilt cards, marquee, mock demos and giant wordmark read as cheap and childish. The landing was rebuilt to be restrained: three real photographs, Instrument Serif headlines with Inter text, hairline rules instead of cards, square-cornered buttons, one deep-red accent, and only gentle fades. No illustration, 3D or decorative gradients. Header and footer say "venue" instead of "turf".

## v4 (21 Oct 2026): "the board", rebuilt from scratch
Why a fourth pass: the 3D, photo and editorial versions were all rejected. v4 drops decoration and makes the product's own object the design: the hour board.

- **Hero.** A working sample board (sport tabs, open and booked hours, pick, hold with a live 8:00 countdown ring), labelled as a sample. It teaches the product in five seconds, and it is the one motion on the page that carries meaning.
- **Look.** Dark ink hero with a faint 56px grid (the board's own grid), light body, one red close. Sora (display, numbers) and Inter (text). Cards use 20px radius, controls 12px. Red only for the main action and the closing band; green only for "Open", always with a text label.
- **Sections.** Hero, three steps drawn as the three states of one booking (pick, hold, play), venue areas from live data, owners with a sample partner calendar, FAQ, closing.
- **Rules kept.** No photos, 3D, emoji, invented numbers or venues. Reduced motion shows everything at once. Passes axe on desktop and phone, Lighthouse mobile 93 / 100 / 100 / 100, no horizontal scroll at 375px.

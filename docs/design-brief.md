# Samuel Campbell — Personal Site Design Spec

Status: design spec for an 18-round build. Vanilla HTML/CSS/JS, no build step, Google Fonts allowed.
Data source: `assets/resume-data.js` (`window.RESUME`). **Nothing in this spec authorizes hard-coding resume text.** Every name, role, date, bullet, tag and link must be read from `RESUME` at runtime (the only literal copy allowed is UI chrome such as button labels, section labels, and the empty-state/no-JS fallback described below).

Existing modes (`/terminal/`, `/gitlog/`, `/desktop/`) stay as they are and become "alternate routes" reachable from the new main page and from the switcher. Do not redesign them.

---

## 0. Ground rules for the engineer

- **Where it lives:** the primary direction becomes the new `/index.html` (the "current best"). The current concept-picker content moves into a section of the new page ("Other routes up") and optionally keeps a copy at `/modes/` so old links still work. Add the main page as a 4th entry ("Home"/"The Wall") in `assets/switcher.js` only if it does not crowd the pill at 390px.
- **Files:** `index.html`, `assets/wall.css`, `assets/wall.js`. Keep shared helpers in `assets/` so alternate directions in later rounds can reuse the data-derivation code (`assets/derive.js`: date parsing, cumulative skills, years of experience).
- **Derived data (compute, never type):**
  - `chrono = RESUME.jobs.slice().reverse()` (data is newest-first).
  - Year parsing: `start`/`end` are strings like `"Aug 2025"`, `"2019"`, `"Present"`. Parse the 4-digit year; month if present (default Jan for start, Dec for end); `"Present"` = today.
  - `firstYear` = min start year; `yearsCoding` = currentYear − firstYear (show as "15+ years" style, computed).
  - Cumulative skill set: walk `chrono`, union each job's `tags` (case-insensitive). Each job's "new holds" = tags not seen before. Curve height at job *i* = size of the union after job *i*.
  - Overlapping jobs (Clemson 2011–2015 and Unitrends 2011–2013 summers) are both real; place nodes by start date and offset vertically if they collide.
  - `job.returning === true` gets the "re-tie" detail (see 1.6).
  - `job.highlight` (`{label, from, to}`) gets the "send" badge (see 1.6).
- **Progressive enhancement:** the server-delivered HTML contains a `<noscript>` block and an empty, semantic skeleton (`<h1 id="name">`, `<ol id="jobs">`, etc.). JS fills it. Without JS the page shows a short note plus the email and GitHub link inside `<noscript>` (this is the one allowed literal duplication, and it should be kept minimal: name, email, GitHub).

---

## 1. PRIMARY DIRECTION — "The Learning Curve"

### 1.1 Concept

Samuel says he loves *climbing learning curves*, so the homepage takes him literally: his career is a climbing route drawn as a bold, hand-set curve across a sunlit topo map. Every job is a **hold** on the wall, sized and colored by how many new skills it added; the route climbs from a 2011 Unitrends internship at the bottom-left up to "Present: AgFirst, round two" at the top-right. The visitor grabs a small chalk-white **climber token** and drags it up the route. As it passes each hold, a big "route card" beside the wall swaps to that job, and the skills first learned there pop off the hold as colored chips and stick onto a growing **chalk bag** (the skills inventory). It is playful enough for developers to fiddle with for a minute, and it puts the answer to "who is this and what does he do now" in the largest type on the screen before anyone touches anything. The look is printed-guidebook meets climbing gym: warm chalk paper, contour lines, saturated hold colors, chunky type. No dark mode default, no gradients-on-black, no glassmorphism.

### 1.2 Why it fits Samuel specifically

- **His own words:** the `tagline` ("I love climbing learning curves…") is the thesis, shown verbatim (from data) as the route's name in the guidebook header.
- **The curve is real data:** the vertical axis is cumulative distinct skills from `tags`, so the shape is honest. COBOL at Southeastern Freight, C++/PostgreSQL at xGrok, Angular at mindAmp, Drupal/HubSpot/Twig at AgFirst each show as visible steps up.
- **The return to AgFirst** (`returning: true`) is an unusual, positive story that most templates would hide. Climbing has a word for coming back to a route you know: the route draws a small loop back toward the earlier AgFirst hold and re-ties in, marked with a figure-eight knot glyph and the label "Round two" (label is UI chrome; the company name comes from data).
- **MARCO's homepage speed (failing → 99%)** is his best quantified win; it becomes a "send" badge on that hold (from `highlight`), and it doubles as a promise: this page itself must load fast (guardrails, section 4).
- **Lexington, SC / Lake Murray:** the topo contours in the background are an abstract lake-and-hills pattern (generated, not a real map), a quiet local nod. No literal map or landmark imagery.
- **Clemson NOC / CLI disaster-recovery tool:** the developer-facing easter eggs (backlog) lean on these (a hidden "belay check" diagnostic overlay, a `?` keyboard cheat sheet styled like a CLI help screen).

### 1.3 Signature first-screen interaction: "Climb the route"

Visible above the fold at 1280×800 and at 390×844 without scrolling.

**Default state (no interaction yet):**
1. Page loads with the route already drawn (no blocking intro). The climber token sits on the **top** hold (current job), so the route card already shows the current role. A recruiter who never touches anything still sees: name, title, current company, location, email button.
2. After 1.2s idle, a one-time hint animates: the token dips a few px down the route and back, with a small label "Drag me down the route" (desktop) or "Slide to climb" (touch). The hint stops forever once the user interacts (store a flag in `sessionStorage`).

**Pointer (mouse/pen) on desktop:**
1. Visitor presses on the token (or anywhere on the route path, which jumps the token to the nearest point) and drags.
2. The token is constrained to the route path: project the pointer onto the SVG path (precompute ~400 sampled points with `getPointAtLength` once; find nearest by distance). The token follows with a slight spring (CSS transform, ≤120ms lag).
3. As the token passes within a hold's capture radius, that hold "lights" (scales 1.0 → 1.15, color goes from 60% tint to full saturation), the route card crossfades to that job, and the hold's new skills fly as chips from the hold to the chalk bag (FLIP animation, 250–350ms, staggered 40ms). Moving back down removes them in reverse (chips fly back), so the bag always equals "skills known at this point in time".
4. Release: the token snaps to the nearest hold (200ms ease-out). Card stays on that job.
5. Reaching the top hold plays a small "summit" moment: a puff of chalk dust (8–12 small CSS-animated circles, 600ms) and the card shows the current role with a "You topped out — say hi" contact button highlighted.

**Touch (≈390px phone):**
- The route is drawn as a vertical-ish S-curve on mobile (see layout), so the natural gesture is a thumb **vertical** drag. To avoid hijacking page scroll, only the route column has `touch-action: none`; the column is ≤ 44% of viewport width on the left, so the rest of the screen scrolls normally.
- Additionally, a horizontal **scrub rail** sits directly under the route card (full width, 48px tall, holds shown as dots). Dragging a thumb along it moves the token along the route. This is the primary touch control (thumb-friendly, no scroll conflict: rail uses `touch-action: pan-y`).
- Tap on any hold = jump to it.
- Haptics: if `navigator.vibrate` exists, a 10ms tick when a hold lights (never on iOS-less devices that lack it; never repeated faster than every 80ms).

**Keyboard:**
- The token is a focusable element with `role="slider"`, `aria-valuemin=0`, `aria-valuemax=jobs.length-1`, `aria-valuenow`, `aria-valuetext="2017–2019, Principal Software Developer at mindAmp"` (built from data).
- Up/Right = next hold (climb), Down/Left = previous, Home = first job, End = current job, PageUp/PageDown = ±3.
- Focus ring: 3px solid ink outline + 3px offset, plus the token's chalk halo grows.
- An `aria-live="polite"` region announces the card change (role, company, years) — debounced to only the resting hold, not every hold passed during a drag.

**Reduced motion (`prefers-reduced-motion: reduce`):**
- No spring, no chip flights, no chalk puff, no idle hint animation. Token moves instantly to holds; chips appear/disappear in place with an opacity change ≤ 100ms or none. The contour background is static (it is static by default; only the subtle parallax described in 1.5 is disabled).
- The interaction itself still works fully.

**No JS / failure:** `<noscript>` contact block; if `RESUME` fails to load, show a plain "Résumé data didn't load" message plus the alt-mode links. Never a blank page.

### 1.4 Information architecture (recruiter in < 30 seconds)

Order of the single page (one scrollable document, sections with stable `id`s for deep links):

1. **Guidebook header bar** (sticky, 56px desktop / 52px mobile): name (left, from data), and on the right two always-visible actions: **Email** (`mailto:` from data) and **Résumé** (scrolls to `#route-description`, a plain-text full résumé). On mobile the bar holds name + an envelope icon button labelled "Email Samuel" (44×44 min target) + a "Menu" button for the rest.
2. **Hero / The Wall** (`#wall`): the interactive route + the route card + chalk bag. The route card's default content IS the recruiter summary: current role, company, start date ("since Aug 2025", from data), location, `summary` sentence, and a one-line stat strip computed from data: `15+ yrs · 8 roles · 40+ skills` (numbers derived).
3. **Route description** (`#route-description`): the full experience list as normal readable HTML (`<ol>` of `<article>`s): role, company, dates, location, bullets, tags. This is the scannable/printable/ATS-friendly view. Each article has the hold color as a left stripe and a "Show on wall" button that scrolls up and moves the token there.
4. **Rack** (`#skills`): all skills grouped by `RESUME.skills` categories, rendered as hold-shaped chips. Clicking a skill highlights on the wall every hold whose job uses that tag (and dims the rest); clicking again clears. Also a text label "Used at: mindAmp, xGrok" (derived) under the selected skill.
5. **Other routes up** (`#modes`): the three existing modes as cards (reuse the mini-previews concept from the current landing page, restyled to this palette).
6. **Summit register** (`#register`): the version timeline (see 1.8).
7. **Footer**: email, GitHub, location, "Print résumé" (a `@media print` stylesheet that prints only header + route description + rack).

Recruiter fast path: name/title/current company/email are visible in the first screen with zero interaction; one tap on "Résumé" lands on the readable list; skills are one more scroll. Contact is one tap from anywhere (sticky header).

### 1.5 Visual identity

**Palette** (light, warm, vibrant; all text pairs pass WCAG AA at the sizes used):

| Token | Hex | Use |
|---|---|---|
| `--chalk` | `#FFF7E8` | page background (warm chalk paper) |
| `--chalk-2` | `#F6E9CF` | panels, route card background |
| `--contour` | `#EAD9B6` | topo contour lines (decorative) |
| `--ink` | `#1C1838` | text, route line, outlines (deep indigo-black, not pure black) |
| `--ink-soft` | `#5B5577` | secondary text (AA on `--chalk`) |
| `--vermilion` | `#FF4A1C` | primary accent, current-job hold, CTA |
| `--sun` | `#FFBE0B` | holds, summit chalk, highlight badge |
| `--lake` | `#00A6A6` | holds, links on hover, Lake Murray nod |
| `--violet` | `#7A4DFF` | holds, focus accents |
| `--bubblegum` | `#FF5FA2` | holds, easter eggs |
| `--moss` | `#3BAA5C` | holds |
| `--sky` | `#CDEBFF` | sky band behind the top of the wall |

Hold colors cycle in data order through vermilion, sun, lake, violet, bubblegum, moss; current job is always vermilion. Text on colored chips uses `--ink` (all six pass AA for ink-on-color at 14px bold except violet: use `#FFF7E8` text on violet).

**Type** (Google Fonts, one request, `display=swap`, preconnect, only the weights listed):
- Display: **Bricolage Grotesque** 700/800, opsz axis. Name at `clamp(44px, 9vw, 112px)`, tight tracking −0.03em.
- Body/UI: **Instrument Sans** 400/600, 17px/1.55 desktop, 16px/1.5 mobile.
- Data/labels (years, grades, hold numbers, register entries): **Martian Mono** 400/600 at 12–13px, uppercase with +0.06em tracking.
- Fallbacks: `system-ui` for sans, `ui-monospace` for mono. Use `size-adjust`d fallback `@font-face` (or at least matching line-heights) to avoid layout shift on swap.

**Texture and motion language:**
- **Topo contours:** an inline SVG of 10–14 concentric, noise-wobbled closed paths generated once in JS from a fixed seed (or pre-baked into the HTML as one SVG), stroked `--contour` at 1.5px. Static. On desktop pointer move, it may parallax by max 6px (off under reduced motion).
- **Chalk grain:** a tiny (≤ 2KB) SVG `feTurbulence` noise overlay at 6% opacity on `--chalk` areas. Disabled if it costs > 2ms per frame (test on scroll).
- **Route line:** 6px `--ink` stroke with round caps, plus a dashed 2px "rope" line offset 8px beside it, `stroke-dasharray` 2 10. Optional: the rope draws itself on first load (600ms) unless reduced motion.
- **Holds:** irregular blob shapes (5 hand-made SVG path variants, chosen by index), with a 3px ink outline and an offset hard shadow (`4px 4px 0 var(--ink)` equivalent in SVG). Size scales with "new skills at this job" (min 28px, max 64px).
- **Motion rules:** springs only on the token; everything else ease-out 150–350ms. Nothing loops forever except the token's subtle "breathing" halo (2.4s, 3% scale), which is off under reduced motion.

**Distinctive details (build these, they are the personality):**
1. **Grade stickers:** each job card has a climbing-grade-style tag computed from data, e.g. `V3` = number of new skills at that job (V0 when none). A tooltip/caption explains: "Grade = new skills picked up on this pitch." Honest and nerdy.
2. **The re-tie knot:** for `returning` jobs the route draws a short loop back toward the earlier same-company hold, with a figure-eight knot icon and the label "Round two". Clicking the knot toggles a split view comparing the two stints' tags (what's new the second time around).
3. **The send badge:** for jobs with `highlight`, a round sun-colored badge on the hold reading `{from} → {to}` (e.g. "failing → 99%") with the `label` on hover/focus. On the summit register and in the footer, a small live "This page: NN ms to interactive" readout (measured with `performance` APIs) reinforces the speed story.
4. **Chalk bag counter:** the bag shows `N skills` and fills (an SVG chalk level rises) as the token climbs.

### 1.6 Layout

**Desktop (≥ 960px), first screen 1280×800:**

```
+--------------------------------------------------------------------------------+
| SAMUEL CAMPBELL                                [Résumé]  [Email Samuel ->]     |  sticky header 56px
+--------------------------------------------------------------------------------+
|  ~~ topo contours ~~                             sky band                       |
|                                                                                 |
|  Samuel                                                   (o) <- current hold   |
|  Campbell              ROUTE CARD                       _/  "Round two" knot    |
|  Full Stack Web Dev    +--------------------------+   _/                         |
|  Lexington, SC         | V2   AUG 2025 — PRESENT  |  (o)  send badge            |
|                        | Full Stack Web Developer | /    "failing -> 99%"      |
|  "I love climbing      | AgFirst Farm Credit Bank |(o)                          |
|   learning curves..."  | summary sentence...      |  \_                         |
|                        | [Email] [Full résumé]    |    (o)  ...                 |
|  15+ yrs · 8 roles ·   +--------------------------+  _/                         |
|  40+ skills            CHALK BAG [PHP][JS][Drupal]..(o)                         |
|                                                   (o) 2011 start                |
+--------------------------------------------------------------------------------+
```

Grid: 12 columns, max-width 1320px. Left column (cols 1–4): name block + tagline + stat strip. Middle (cols 5–8): route card + chalk bag under it. Right (cols 9–12): the wall SVG, height `min(78vh, 680px)`, route from bottom-left of that column to top-right. The route SVG uses a `viewBox` and `preserveAspectRatio="xMidYMid meet"`.

**Mobile (≈ 390px):**

```
+------------------------------------+
| SAMUEL CAMPBELL        [✉] [Menu]  |  52px sticky
+------------------------------------+
| Samuel Campbell                    |  display 44px
| Full Stack Web Developer           |
| Lexington, SC                      |
+-------------+----------------------+
|   (o) top   |  ROUTE CARD          |
|   |         |  V2 · AUG 2025—NOW   |
|  (o)        |  Full Stack Web Dev  |
|   \         |  AgFirst Farm ...    |
|   (o)       |  summary (2 lines,   |
|   /         |  clamp)              |
|  (o)        |                      |
| route col   |                      |
| 40% width   |                      |
+-------------+----------------------+
| SCRUB RAIL  o--o--o--o--o--o--o--● |  48px, full width
+------------------------------------+
| CHALK BAG [PHP][JS][Drupal] +12    |  one row, horizontally scrollable
+------------------------------------+
| [ Email Samuel ]  [ Full résumé ]  |  44px buttons
+------------------------------------+
```

The whole block above fits in 844px tall. Route card has a fixed height (avoid layout shift when content swaps; clamp bullet text to 3 lines on mobile, full in "Route description"). Text never below 15px on mobile except mono labels (12px minimum, uppercase).

### 1.7 Accessibility and performance notes specific to this direction

- The SVG wall is `aria-hidden="true"` except the slider token. All content in the wall is duplicated in real HTML (route card + route description), so screen readers never depend on the SVG.
- Color is never the only signal: holds also carry a number (job order) and the selected one gets a thick ink ring.
- Budget: HTML+CSS+JS for the main page ≤ 60KB uncompressed (excluding fonts); no images other than inline SVG; LCP element is the name text; CLS 0; no long tasks > 50ms on load on a mid phone.

### 1.8 The version timeline: "Summit Register"

Climbers sign a **summit register** (a logbook in a tin at the top). Every published version of the site is an entry.

- **Entry point:** a small tin-can icon in the header labelled "Register" (desktop shows label; mobile puts it in Menu), plus the full section `#register` near the bottom.
- **Register UI:** a horizontal strip styled like a ruled logbook page. Each entry = a version: `v14 · 2026-12-03 · "Added skill filter to the rack"` in Martian Mono, newest on the right, with a tiny thumbnail of the route shape for that version if available (optional). Current version has a vermilion "YOU ARE HERE / SUMMIT" tag.
- **Opening a past snapshot:** selecting an entry loads that snapshot (recommended: static copies at `/register/vNN/`, listed in a `register.json` or a `window.REGISTER` array; engineer's choice) in the same tab. A persistent ribbon is injected at the top of every snapshot: `Viewing v07 (2026-11-28) · [Return to summit ↑]`. One click/tap (or `Esc`/`Alt+0`) returns to the current version. The ribbon is ≥ 44px tall and is the only thing that is guaranteed to be identical across all snapshots.
- **Altimeter metaphor:** the strip doubles as a horizontal "altitude" axis, so older versions sit lower/left and the current one sits at the top-right, echoing the wall. Keyboard: the register is a `role="listbox"` or simple list of links; arrow keys move between entries.
- **Never** let a snapshot trap the visitor: snapshots open in the same tab with a working Back button, and the return ribbon always links to `/`.

---

## 2. ALTERNATIVE DIRECTIONS (for later cycles)

### 2B. "Patch Bay" — the career switchboard

**Concept.** A full-width front panel of a network/audio patch bay (nod to Clemson's Network Operations Center, RabbitMQ/REST messaging, and middleware work at xGrok and mindAmp). The top row of jacks is labelled with skill categories and skills (from `RESUME.skills`); the bottom row is jobs. Visitors physically **plug cables**: drag from a skill jack to a job jack, and if that job used that skill the cable lights up and the LED readout prints the relevant bullet; if not, the cable droops and the jack blinks "no carrier". A "Route all" switch auto-patches every true connection, producing a satisfying spaghetti of lit cables that is, in fact, an accurate skills-by-job matrix. Layout is a horizontal hardware panel (desktop) that becomes a vertical rack unit stack on mobile, where you tap a skill then tap a job instead of dragging. Navigation is by "rack units" (1U = one section) with screw-head anchors.

**Signature interaction.** Drag a cable (SVG cubic Bézier with gravity sag, physics-lite) from any skill jack to any job jack; matching pairs light and print the bullet on a segmented LED display. Touch: tap-tap pairing. Keyboard: Tab to a jack, Enter to pick up a cable, arrows to move between target jacks, Enter to plug. Reduced motion: cables appear straight and lit without sag animation.

**Palette/type.** Brushed aluminum `#D9DCE1`, panel `#2B2F36`, screen-printed labels `#F4F1E8`, LED green `#39FF88`, LED amber `#FFB000`, cable colors `#FF3B5C`, `#2EC4FF`, `#FFD23F`, `#9B5DE5`. Type: **Chakra Petch** 600 (panel labels), **Red Hat Mono** (LED/readouts), **Red Hat Text** (body).

### 2C. "Pull a Print" — risograph zine

**Concept.** Editorial and tactile instead of technical: the résumé is a hand-bound, two-ink risograph zine (a nod to MARCO Promos and promotional printing, and to his UX/heatmap work). The layout is a horizontal run of spreads you page through (scroll-snap, swipe on mobile, arrow keys on desktop); each spread is one era of the career, with oversized type, misregistered ink layers, halftone dots, and stickers. Overprint colors combine to make the third color (multiply blend). Instead of a nav bar there's a folded "contents" tab that sticks out from the right edge.

**Signature interaction.** The first screen is a blank sheet with a **squeegee**. Drag it across (or press and hold the "Pull" button / Space) and the cover prints in two passes: pass one lays fluorescent pink (name, title), pass two lays blue (current role, contact) — with a little intentional misregistration you can then "fix" by dragging the blue layer into alignment (it snaps with a satisfying thunk). Touch: thumb drag the squeegee horizontally. Keyboard: Space/Enter pulls. Reduced motion: the cover is already printed; the squeegee becomes a "Print another copy" button that just swaps the misregistration offset.

**Palette/type.** Paper `#F7F2E7`, Fluorescent Pink `#FF48B0`, Medium Blue `#3255A4`, overprint violet (pink×blue via `mix-blend-mode: multiply`), Yellow `#FFE800` for stickers, ink `#1A1A1A`. Type: **Gloock** (display serif), **Hanken Grotesk** (body), **DM Mono** (captions).

---

## 3. EXPERIMENT BACKLOG (ordered roughly foundational → ambitious)

Each item is phrased as an observable, testable payoff. Rounds may combine items.

1. **Data-driven skeleton:** Changing any job title in `resume-data.js` and reloading changes the hero card, route description and wall labels with no other edits (grep shows no résumé strings in HTML/CSS/JS besides the `<noscript>` contact).
2. **30-second recruiter test:** At 1280×800 and 390×844, with zero interaction, the first screen shows name, current title, current company, location, and a working email button.
3. **Readable résumé section:** A visitor can tap "Full résumé" and read every job's role, company, dates and bullets as plain HTML; printing the page (Ctrl+P) yields a clean 1–2 page résumé without the wall or switcher.
4. **Honest curve:** The wall's hold heights match cumulative distinct tags; adding a new tag to the current job visibly raises the top hold on reload.
5. **Climb by drag:** A desktop user can drag the token from bottom to top and see the route card change at each hold, ending on the current job.
6. **Climb by thumb:** A phone user can drag one thumb along the scrub rail to preview each job without the page scrolling, and can still scroll the page by swiping elsewhere.
7. **Climb by keyboard:** A keyboard-only user can Tab to the token and use arrow/Home/End to visit every job; a screen reader announces "role at company, years" once per resting hold.
8. **Reduced-motion parity:** With `prefers-reduced-motion: reduce`, every interaction still works, and no element animates transform for more than 100ms.
9. **Zero layout shift:** Lighthouse/`PerformanceObserver` reports CLS = 0 on load and while switching jobs (route card has fixed dimensions; fonts use metric-matched fallbacks).
10. **Chalk bag inventory:** As the token climbs, skill chips fly from each hold into the bag; climbing back down removes them, so the bag count always equals skills known at that point.
11. **Skill spotlight:** Clicking "Angular" in the rack dims every hold except the jobs that used Angular and shows "Used at: mindAmp" beneath it; Esc clears.
12. **Round two knot:** Clicking the re-tie knot on the returning AgFirst job shows a side-by-side of 2019–2022 vs 2025–present tags, highlighting what's new.
13. **Send badge + live speed readout:** The MARCO hold shows "failing → 99%", and the footer shows this page's own measured time-to-interactive in ms.
14. **Summit register v1:** A visitor can open the register, pick any past version, browse it, and return to the current site with one click/tap on the "Return to summit" ribbon (or Esc).
15. **Register scrubbing:** On desktop, hovering/arrowing through register entries shows a small preview (thumbnail or route-shape sparkline) before opening; on phone, a horizontal swipe through entries works with snap points.
16. **Deep links:** `/#job=xgrok` loads with the token on xGrok and the card showing it; `/#skill=COBOL` loads with COBOL spotlighted. Sharing a link reproduces the state.
17. **Alt routes integration:** The three existing modes appear as "Other routes up" cards in the new palette, and the switcher on those pages has a way back to the wall (home).
18. **Help overlay easter egg:** Pressing `?` shows a CLI-style help card (`climb --help`) listing all keyboard shortcuts; it's dismissible with Esc and traps focus correctly.
19. **Belay check (developer easter egg):** Typing `belay` anywhere (not in an input) toggles a diagnostic overlay showing the sampled path points, capture radii, and FPS, as a wink to devs and to his NOC/diagnostics background.
20. **Topo generator:** Reloading the page produces the same contours (seeded), but clicking the small "re-survey" control in the footer generates a new seeded topo, and the URL updates with `?topo=seed` so the look can be shared.
21. **Free climb mode:** A toggle lets developers drag the token *off* the route; it falls with simple gravity back to the last hold (disabled under reduced motion), with a "whipper!" caption.
22. **Contact as a summit:** Topping out shows the contact CTA; clicking "Copy email" copies the address and shows a confirmation toast, with `mailto` as fallback.
23. **Offline-friendly:** After one visit, the page (and register index) loads offline via a tiny service worker, with a visible "you're offline, cached copy" note.
24. **Alternate direction trial (2B or 2C) as a register entry:** A later round ships Patch Bay or Pull a Print as the main page, and the register lets visitors flip between that version and the Learning Curve in one action each way, both reading the same `RESUME`.

---

## 4. GUARDRAILS

### Must never regress

- **Contact in one tap/click** from any scroll position on any page of the main site (sticky header email), at 390px and desktop.
- **First screen answers who/what/where now** without interaction, JS-rendered from `RESUME` within 1s on a mid phone over 4G.
- **No résumé text hard-coded** outside `resume-data.js` (except the minimal `<noscript>` contact).
- **Readable at 390px:** no horizontal page scroll; body text ≥ 15px; tap targets ≥ 44×44px; line length ≤ 75ch on desktop.
- **Contrast:** WCAG AA for all text, including text on hold colors and in the register ribbon.
- **CLS = 0**, LCP < 2.0s (mobile, throttled), main-page JS+CSS ≤ 60KB uncompressed, no frameworks, no build step, ≤ 1 Google Fonts request.
- **Keyboard and touch parity:** anything you can do with a mouse you can do with keyboard and with a thumb.
- **prefers-reduced-motion** honored on every new animation (add a test checklist item each round).
- **Version timeline escape hatch:** from any snapshot, one action returns to the current version.
- **Existing modes keep working** (`/terminal/`, `/gitlog/`, `/desktop/`, switcher, Alt+1/2/3 shortcuts).
- **Privacy:** never add phone number or street address (the data file intentionally omits them).

### Avoid

- The stock "developer portfolio": dark background + neon gradient + glass cards + typing-effect hero + skill progress bars with percentages. (Skill bars with made-up percentages are specifically banned; the curve uses only real counts.)
- Generic templates or layouts recognizable from popular portfolio themes.
- Real brand imagery: no climbing-gym brand logos, no real topographic map tiles, no copied company logos for employers (company names as text only), no recognizable characters/mascots, no imitation of OS or product UIs beyond generic forms.
- Scroll-jacking the whole page, autoplaying sound, intro loaders that block content, or cursor replacements that hide the system cursor.
- Gimmicks that block reading: the interactive wall must never be the *only* way to reach any piece of content.
- Over-claiming: no invented metrics, testimonials or job details; TODO placeholders in the data should render as-is, not be embellished.

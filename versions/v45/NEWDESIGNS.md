# NEWDESIGNS — The Cockpit Redesign

Design spec for replacing the home page (`/`) and re-theming its companion pages. This is a spec, not code.

**Owner's brief:** "Completely redesign this. I do not like climbing, I like specifically learning new technologies. Make a website that looks like a cockpit from MechWarrior, implemented in the most interactive and fun way possible."

**Translation:** the visitor sits in the pilot seat of a big walking machine. The machine is Samuel's skill set, and the career is its **upgrade history**: every job installed new systems. The theme is *learning new technology*, shown as installing, calibrating and bringing systems online. Every climbing word (wall, route, belay, summit, chalk, crux, pitch, holds, "Auto-belay", "Summit Register") is removed from the UI, code names, CSS classes, hash keys and the docs.

**Genre, not IP.** Everything here is original: the machine's name, its maker, the callsign scheme, the HUD layout and the art. Nothing is taken from any existing franchise (see Guardrails §4.1).

---

## 0. Data contract (applies to every direction)

All text and numbers come from `window.RESUME` (`assets/resume-data.js`) and `window.DERIVED` (`assets/derive.js`). Nothing about the résumé is typed into HTML or JS. The only hand-typed text is UI chrome ("THROTTLE", "SYSTEMS", "HAIL").

| Cockpit element | Source |
|---|---|
| Pilot plate: name, title, location | `RESUME.name`, `.title`, `.location` |
| Callsign | `RESUME.handle`, upper-cased: `DOOG` |
| Current assignment | `DERIVED.current` (role, company, `_span`); `returning: true` drives the "re-commissioned" badge |
| Service years | `DERIVED.firstYear`, `DERIVED.yearsIn` |
| Systems online (total) | `DERIVED.skillCount` |
| Deployments | `DERIVED.roleCount` |
| Install events per job | `DERIVED.chrono[i]._new` (systems first installed in that job) |
| Systems online at a point in time | `DERIVED.chrono[i]._cum`, `._known` |
| Throttle range | `DERIVED.firstYear` → `DERIVED.nowT`; job notches at each `_t0` |
| Target lock ("where used") | `DERIVED.usedAt(skill)` |
| System bays (grouping) | `Object.keys(RESUME.skills)` → bays: Languages, Frontend, CMS & Platforms, Data & Messaging, Tools & Process |
| Tune gauge | `job.highlight` (`label`, `from`, `to`); render the real values only, e.g. "failing → 99%" |
| Mission log entries | `job.bullets` |

Rule: a gauge with no real number behind it is a decoration, so it gets no numeric label (see §4.5).

Data caveat: the current AgFirst entry still has `TODO` tags and a placeholder bullet. The UI renders whatever the data says; the README should keep reminding the owner to fill it in. The design must look fine with one bullet.

---

## 1. Primary direction — **PILOT SEAT: Frame AUTODIDACT**

### 1.1 Concept

You load into the cockpit of **AUTODIDACT**, a self-teaching walking frame built by the invented **Congaree Heavy Works** (named for the river near Columbia, SC). The canopy glass looks out on a dusk horizon drawn as low SVG ridgelines. In front of you are three multi-function displays (MFDs), a status brow with warning lamps, and a big **throttle** on the right. The throttle does not move the machine forward in space. It moves it forward **in time**: from the year its first systems were fitted (`firstYear`) to today. As you push it, each deployment (job) arrives as a **refit**. The machine pauses, the console prints `INSTALLING: PostgreSQL… C++… OK`, new contacts light up on the sensor scope, and the frame schematic gains lit hardpoints. At full throttle all systems are online. The message is that this machine was never finished; it keeps installing new things, and that is the point.

**Callsign scheme (original):** `<HANDLE>-<frame code>-<bay>`, e.g. `DOOG / AX-1 / BAY 3`. Frame code `AX` = "AutodidaX". Deployments are called **SORTIES** and are numbered from data order (`SORTIE 01` = earliest `chrono` entry).

### 1.2 Why it fits Samuel (from real résumé facts)

- **Learning as installation.** `derive.js` already computes `_new` (first time each technology appears) and `_cum` (running total). That is literally an install log. The site's central mechanic is his career's real shape, not a metaphor stuck on top.
- **Clemson NOC (2011–2015) = sensor package.** Watching networks was his first instrument job, so the **sensor/radar MFD** is "installed" in that sortie. The scope literally comes online during his NOC years.
- **Unitrends intern (summers 2011–2013) = first comms link.** A JavaScript plug-in that pulled data through APIs. JavaScript and REST APIs are the first two systems installed.
- **Southeastern Freight (COBOL) = legacy firmware.** Shown as a **firmware ROM** module, rendered in a slightly older display style (chunky monospace, green-phosphor tint) inside an otherwise modern cockpit. Tooltip: "legacy firmware: still in service."
- **xGrok: reverse-engineering the JET database layout = sensor decoding.** Its sortie plays a short **decode** effect: scrambled hex resolves into the bullet text. This is the "signal intelligence" refit (C++, PostgreSQL, JSON).
- **mindAmp: CLI disaster-recovery tool = emergency systems.** This sortie installs the **ejection / recovery** subsystem. One of the warning lamps is labelled RECOVERY from here on, and clicking it opens that bullet.
- **MARCO Promos: homepage speed from failing to 99% = engine tuning.** The only sortie with a **TUNE gauge**. Its needle sweeps from a red band labelled with `highlight.from` ("failing") to a green band labelled with `highlight.to` ("99%"). The gauge shows the real data strings, not made-up RPM.
- **AgFirst, round two (`returning: true`) = re-commissioned frame.** The final notch shows a **hangar refit** moment: the frame schematic flashes back to its 2019–2022 AgFirst loadout, then everything learned at MARCO since (.NET, Bootstrap, Analytics…) installs on top. Badge: `RE-COMMISSIONED · SAME HANGAR, NEW SYSTEMS`. It turns "he went back" into a strength: he came back carrying more.
- **Tagline.** `RESUME.tagline` currently says "climbing learning curves". The cockpit shows it as the pilot's quote, but the owner should edit the data to something like "I love learning new languages and technologies." Flag this in the README; do not rewrite data in code.

### 1.3 Signature first-screen interaction: **THE THROTTLE REFIT**

Visible on the first screen, no scroll, at every width. The cockpit is fully readable before anyone touches it (§1.5). The interaction adds to that; it never gates it.

**State on arrival (after the ≤1.2 s boot, §1.7):** throttle at **0% = `firstYear`**. Scope is dark except a faint sweep, the schematic is unlit, and the console reads `FRAME AX-1 · COLD START · PUSH THROTTLE TO INSTALL SYSTEMS`. A pulsing chevron sits beside the throttle handle. A clearly labelled **"Skip to full systems ▸▸"** button sits next to it.

Recruiter-friendly default: if the visitor does nothing for 6 s, or arrives with `#full` (or any deep link), the cockpit **auto-advances to full throttle** in about 2 s and shows everything. Reduced-motion users get the end state instantly. You can never get stuck on an empty cockpit.

**Pointer (desktop):**
1. Grab the throttle handle (cursor `grab`), or click anywhere on the throttle track.
2. Drag up. The year readout above the handle rolls (`2011 → 2012 …`). Notches on the track mark each sortie start (`_t0`), and the handle gives a small magnetic snap at each one.
3. Crossing a notch fires that sortie's **refit**: the console prints `SORTIE 04 · xGrok · Software Developer · 2016–2017` and then `INSTALLING: PHP ▮▮▮ OK`, one line per `_new` item. Each new skill appears as a **contact** on the sensor scope, at an angle set by its bay. The schematic lights the hardpoint for that bay. The SYSTEMS ONLINE counter ticks to `_cum`.
4. Dragging **down** rewinds cleanly: contacts fade, the counter goes down, and nothing animates in a way that looks like damage.
5. Release snaps to the nearest sortie, and the center MFD shows that sortie's **mission card** (role, company, dates, bullets).
6. Mouse wheel over the throttle steps one sortie per notch.

**Touch (390 px phone):** the throttle becomes a **horizontal slider** across the bottom of the canopy (thumb-height, 48 px handle, 44 px minimum hit area). Swipe it left/right; it snaps per sortie with a short `navigator.vibrate(8)` tick where supported (off when sound/haptics is off; see §1.8). A swipe on the mission card also steps sorties. No vertical gesture is captured, so page scroll keeps working.

**Keyboard:** the throttle is a real `role="slider"` with `aria-valuemin/max/now` and `aria-valuetext="2016, Sortie 4 of 8: Software Developer at xGrok, 4 systems installed"`.
- `↑/→` next sortie, `↓/←` previous, `PageUp/PageDown` ±3 years, `Home` cold start, `End` full systems.
- Global: `T` focuses the throttle; `1–8` jump to sortie N; `F` = full systems; `/` focuses the skill search (target lock); `P` = print view; `?` opens the key map; `M` toggles sound.
- Every refit is announced once through a polite live region: "Sortie 4, xGrok. Installed PHP, PostgreSQL, C++, JSON. 9 systems online." No per-character console spam goes to screen readers; the console stays `aria-hidden` and the live region carries one summary.

**Reduced motion (`prefers-reduced-motion: reduce`):** no boot animation, no sweep rotation, no typing effect, no needle sweep. The throttle still works and states change instantly, with a 150 ms opacity fade at most. Arrival state = **full systems** (the end state). The decode effect for xGrok shows the plain text straight away.

### 1.4 Cockpit layout

**Desktop (≥1100 px): one viewport, no page scroll needed for the essentials.**

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ STATUS BROW  ● SENSORS  ● COMMS  ● FIRMWARE  ● RECOVERY  ● TUNE   [♪ OFF] [?]  │
│  PILOT  SAMUEL CAMPBELL · Full Stack Web Developer · Lexington, SC   [HAIL ✉]   │
├──────────────────────────────────────────────────────────────────────────────┤
│          ╲   canopy glass: dusk horizon (SVG ridgelines), faint reticle  ╱     │
│ ┌────────────────┐  ┌──────────────────────────────┐  ┌────────────────┐ ┌──┐│
│ │ MFD-L          │  │ MFD-C  MISSION CARD          │  │ MFD-R  SENSORS │ │▲ ││
│ │ ASSIGNMENT     │  │ SORTIE 08 · RE-COMMISSIONED  │  │   .  ·  ◇      │ │█ ││
│ │ Full Stack Web │  │ Full Stack Web Developer     │  │ ·  (sweep) ◇ · │ │█ ││
│ │ Dev · AgFirst  │  │ AgFirst Farm Credit Bank     │  │  ◇    +    ·   │ │▓ ││THROTTLE
│ │ Aug 2025–now   │  │ Aug 2025 – Present           │  │   ·  ◇   ·     │ │▓ ││ (years)
│ │ ─────────────  │  │ • bullet…                    │  │ [ lock: ____ ] │ │░ ││
│ │ SERVICE  15 yr │  │ • bullet…                    │  │ bays legend    │ │░ ││
│ │ SYSTEMS  NN    │  │ [frame schematic, hardpoints]│  │                │ │▼ ││
│ │ SORTIES  8     │  │                              │  │                │ │2025│
│ └────────────────┘  └──────────────────────────────┘  └────────────────┘ └──┘│
├──────────────────────────────────────────────────────────────────────────────┤
│ CONSOLE > SORTIE 08 · INSTALLING: SQL ▮▮▮ OK · ALL SYSTEMS NOMINAL            │
│ AUX BAYS: [Maintenance Port] [Flight Recorder] [Crew Deck OS] [Service Log]  │
│           [Plain résumé / Print]                         [Skip to full ▸▸]   │
└──────────────────────────────────────────────────────────────────────────────┘
```

(`SYSTEMS NN`, `15 yr` and `8` are placeholders for `skillCount`, `yearsIn` and `roleCount`.)

**Tablet (700–1099 px):** MFD-L and MFD-R stack in a column to the left of MFD-C; throttle stays on the right edge.

**Phone (390 px), single column, natural scroll:**

```
┌─────────────────────────────┐
│ ● ● ● ● ●        [♪] [HAIL]│  ← sticky brow (48px): lamps + one-tap contact
├─────────────────────────────┤
│ PILOT · DOOG / AX-1         │
│ SAMUEL CAMPBELL             │
│ Full Stack Web Developer    │
│ AgFirst Farm Credit Bank    │
│ Aug 2025 – Present · ↺ RE-C │
│ 15 yr · NN systems · 8 sort.│
├─────────────────────────────┤
│  SENSORS (square scope)     │
│   ·  ◇   ·  +  ◇  ·         │
│  [ lock a system… ]         │
├─────────────────────────────┤
│ 2011 ━━━━━━━━━━━━●━━ 2025   │  ← horizontal throttle, 48px handle
│ ‹ SORTIE 04 / 08 ›          │
├─────────────────────────────┤
│ MISSION CARD (swipeable)    │
│ Software Developer · xGrok  │
│ • bullets…                  │
│ INSTALLED: PHP · PostgreSQL │
├─────────────────────────────┤
│ SYSTEM BAYS (full list)     │
│ AUX BAYS · Service Log      │
│ Plain résumé / Print        │
└─────────────────────────────┘
```

On phones the first screen (top ~700 px) shows pilot plate, scope and throttle. The signature interaction is in reach of a thumb without scrolling.

### 1.5 Information architecture (recruiter in under 30 s)

1. **0–3 s, no interaction:** the **pilot plate** in the brow shows name, title and location, and **HAIL** (email) is next to it. MFD-L shows the **current assignment** (role, company, dates, re-commissioned badge) and three honest counters: years of service, systems, sorties. This is all real HTML text in the initial render, so it works with JS slow or failing (a `<noscript>` plate repeats it, as today).
2. **3–15 s:** the sensor scope plus the **System Bays** list (MFD-R footer on desktop, a section on phone) show every skill grouped by `RESUME.skills` category, as plain text chips. Recruiters can scan it like a skills section. The scope is decoration over that list, not a replacement for it.
3. **15–30 s:** the mission card and throttle step through every job. **"Plain résumé"** in the bottom bar opens the print view (§3 item 9), which is a conventional one-column résumé.
4. **Contact is always one tap:** HAIL is in the sticky brow at every width and opens a small panel with `mailto:` (prefilled subject), "copy email", and GitHub. On phones the brow is sticky, so HAIL never scrolls away.
5. Deep links stay supported and get renamed: `#sortie=xgrok` (job `id`), `#lock=PHP` (skill), `#full`. Old `#job=` and `#skill=` keep working as aliases so shared links don't break.

### 1.6 Visual identity

**Mood:** a well-kept working machine at dusk. Matte gunmetal bezels, warm amber readouts, cool cyan sensors, and a few lamps. It should feel like dense instruments, not a neon nightclub.

**Palette (dark, the default; cockpits are dark):**

| Token | Hex | Use | Contrast on `--hull` |
|---|---|---|---|
| `--hull` | `#0D1316` | page / canopy frame background | — |
| `--panel` | `#151E23` | MFD faces | — |
| `--bezel` | `#26333B` | bezels, dividers, throttle track | decorative |
| `--bezel-hi` | `#3A4A54` | bevel highlight edge | decorative |
| `--text` | `#E4ECEF` | body copy, mission bullets | ~15:1 |
| `--text-dim` | `#93A6B0` | labels, captions (min 12 px) | ~7.5:1 |
| `--amber` | `#FFB547` | primary readouts, throttle, counters, focus ring | ~10:1 |
| `--cyan` | `#62D3E3` | sensor contacts, links, lock reticle | ~10:1 |
| `--online` | `#7EE08C` | "OK", installed, lamps on | ~11:1 |
| `--warn` | `#FF6B5E` | warning lamps, TUNE "failing" band (always paired with text) | ~6:1 |
| `--firmware` | `#B6E36A` | COBOL legacy-firmware module only | ~12:1 |
| `--glass` | `rgba(98,211,227,.05)` | canopy tint overlay | decorative |

Also a **light "hangar day" theme** (respects `prefers-color-scheme`, has a toggle; replaces the old night toggle): `--hull #E9EEF0`, `--panel #FFFFFF`, `--text #10181C`, `--amber #9A5A00`, `--cyan #00707F`, `--online #1F7A33`, `--warn #B3261E`. All of these are AA on white.

**Type (Google Fonts, 3 families, `display=swap`, subset latin, preload only the display weight):**
- **Chakra Petch** 600/700 for HUD labels, the pilot name and counters. Squared-off and technical, an original typeface with no franchise link.
- **IBM Plex Sans** 400/600 for all body copy and bullets. Readability first.
- **IBM Plex Mono** 400/500 for the console, years, the throttle readout and `INSTALLING:` lines.
- Use `size-adjust`/`ascent-override` fallbacks for each family so swapping fonts causes zero layout shift.

**Glass / scanline / glow rules (restraint):**
- **Glow only on numerals and lamps,** never on running text. Max `text-shadow: 0 0 6px color-mix(in srgb, var(--amber) 45%, transparent)`. Body text has no glow at all.
- **Scanlines** only on MFD faces, as a `repeating-linear-gradient` at ≤4% opacity, 3 px period. Never over the mission card text area (that panel gets a solid `--panel`). Turned off by the high-contrast toggle and `prefers-contrast: more`.
- **Canopy glass:** one subtle diagonal reflection gradient (≤6% white) on the canopy band only, plus a CSS-drawn frame strut. No full-screen overlays on top of text.
- **Bezels:** 1 px `--bezel-hi` top edge, 1 px darker bottom edge, 6 px corner chamfers using `clip-path`. Corner screw heads are tiny SVG circles on desktop only.
- **Lamps:** small rounded rectangles with a text label *inside or next to* them. Colour is never the only signal.
- **Motion budget:** at most one continuously animated element on screen at a time (the scope sweep, about 4 s per rotation, paused when the tab is hidden or the scope is off-screen).

### 1.7 Fun details (distinctive)

1. **Cold-start boot (≤1.2 s, skippable, never blocking).** The brow lamps test in sequence, the MFDs flicker on one by one, and the console prints `CONGAREE HEAVY WORKS · FRAME AX-1 "AUTODIDACT" · PILOT DOOG · HANDSHAKE OK`. All content is already in the DOM underneath, so the boot is an overlay of masks and transitions with no layout. Any key, click or tap skips it. It runs once per session (`sessionStorage`); after that you get a 200 ms warm start.
2. **Target lock (where a skill was used).** Type in the lock field, or click a contact or bay chip. A reticle closes on the contact (four corner brackets converge). The throttle track lights a segment for every sortie in `usedAt(skill)`, and the mission card offers "Used in 3 sorties ›" to step through them. Deep link `#lock=PHP`.
3. **Decode sortie (xGrok).** On entering it, the bullets resolve from scrambled hex to text in about 600 ms (letters only, so width stays the same and nothing reflows). A nod to the JET reverse-engineering work.
4. **TUNE gauge (MARCO).** An analog dial whose needle sweeps from the red band "failing" to the green band "99%", using `highlight.from/to` from the data. The engine note rises with it if sound is on. That sortie's lamp on the brow is labelled TUNE.
5. **Overdrive / heat easter egg.** Slam the throttle top-to-bottom three times in 2 s, or type `overdrive`. A HEAT bar fills, lamps flash, and the console shows `COOLANT FLUSH: try learning something new` before everything cools down. The bar is labelled `HEAT (just for fun)` and has no numbers (§4.5). Respects reduced motion (static lamp state, no flash).
6. **Re-commission moment.** At sortie 8 the schematic briefly shows the 2019–2022 AgFirst outline as a ghost, then the frame re-docks with the MARCO-era systems glowing in `--online`. Caption: `RE-COMMISSIONED: SAME HANGAR · +N SYSTEMS SINCE LAST TOUR` (N = `_cum` difference, computed).

### 1.8 Sound policy

- **Off by default. Always.** A visible `♪ OFF` toggle sits in the brow (with `aria-pressed`), and `M` toggles it. The setting is remembered in `localStorage`.
- Pure **WebAudio synthesis** (oscillators and envelopes, no audio files, about 2 KB of code). The `AudioContext` is created only on the first user gesture after sound is turned on.
- Sounds: notch tick (short square blip), install chirp (two-note rise per `_new` item, throttled to ≤6/s), lock tone, TUNE dial whoosh, boot hum (only if sound was already on from a previous visit, and only after a gesture).
- Master gain about −18 dB, no sound longer than 400 ms, no loops. Muted when the tab is hidden.
- Haptics (`navigator.vibrate`) follow the same toggle.

### 1.9 Where the version log and alternate rooms live

- **Version history `/timeline/` is renamed "SERVICE LOG"** (subtitle: "every refit of this site"). Its entries are re-labelled as **refits** (`REFIT v07 · <title> · <verdict>`), and milestone (`featured`) versions are marked `★ COMMISSIONED`. It keeps live previews, side-by-side compare and one-click restore, re-skinned as a maintenance clipboard / MFD page using the same tokens. Reached from the cockpit's bottom bar ("Service Log") and from `?`.
- **Snapshot bar** (`timeline/version-bar.js`) on archived versions is re-skinned as a slim **"ARCHIVED FRAME"** strip: `ARCHIVED REFIT v03 · <title> · ‹ prev milestone · next › · RETURN TO ACTIVE FRAME`. Its behaviour is unchanged (iframe/`embed=1` exemption, manifest-driven).
- **Alternate rooms = auxiliary bays**, linked from the cockpit's bottom bar and from the shared `assets/switcher.js`:
  - `/terminal/` → **Maintenance Port** (the direct shell into the frame)
  - `/gitlog/` → **Flight Recorder** (the black box: every change on record)
  - `/desktop/` → **Crew Deck OS** (the off-duty computer; DoogOS can keep its own name inside)
- **`switcher.js` restyle:** the floating bar becomes a dark bezel strip using the cockpit tokens. "← The wall" becomes **"← Cockpit"**, and the "register" link becomes **"Service Log"**. Keep `Alt+1/2/3`, `aria-current`, print hiding and the 560 px collapse. The rooms keep their own internal art direction; only the wayfinding bar adopts the cockpit look, so they read as bays of the same machine.
- `sw.js`: bump the cache version and add/remove asset names (`wall.css/js` → `cockpit.css/js`).

---

## 2. Alternative directions

### 2.A — **HANGAR REFIT** (side-on gantry view, scroll is the crane)

You're not in the seat; you're on the **catwalk of a refit hangar** looking at the frame side-on as a large line-art SVG. Vertical scroll moves a **gantry crane** down a column of numbered **refit bays**, one per job, oldest at the top. At each bay the crane lowers modules (the job's `_new` skills, as labelled crates) onto the frame's hardpoints, and the frame visibly grows more complex, from a bare chassis in 2011 to fully kitted today. The pilot plate and HAIL sit on a sticky **work-order clipboard** at the top. Navigation is a scroll story with sticky bay headings and a bay index ("jump to BAY 05 · xGrok").
**Signature interaction: Loadout drag.** On the first screen the current loadout is shown. A crate rack lists every system; dragging (or keyboard: select, then `Enter` on a hardpoint) a crate onto the frame highlights every bay where that system was installed and used, and the crane scrolls to the first one. On touch, tap crate → tap hardpoint. Reduced motion: the crane jumps instead of travelling.
**Palette/type:** concrete `#1B1D1F`, steel `#2C3236`, hazard yellow `#F5C518` (stripes and focus only), work-light white `#F2F2EE`, oxide red `#D9553F`, safety teal `#3FB8AF`. Type: **Saira Condensed** 600 (stencil-ish bay numbers) + **Inter** body + **JetBrains Mono** labels.

### 2.B — **SENSOR SCOPE** (one giant radar; everything is a contact)

The whole first screen is a **full-height circular sensor scope** seen through a narrow canopy slit, with the pilot plate and HAIL on a strip above. The scope's rings are **years** (center = `firstYear`, outer ring = now). Jobs are **large contacts** placed on the ring of their start year; skills are **small contacts** at the ring of the first year they were installed (from `_new`), arranged by bay into sectors. Navigation is spatial: you hop from contact to contact. A side readout panel shows whichever contact is locked.
**Signature interaction: Active ping.** Click or tap anywhere on the scope to send a ping ripple from that point. Contacts it passes light up and briefly show labels, and the nearest contact is locked and its details shown. Keyboard: `Tab` / arrow keys cycle contacts in time order, `Space` pings from the current lock. A **ring scrubber** (a radial slider, also exposed as a normal linear `role="slider"`) filters "show only what was online by year X". Reduced motion: the ping is an instant highlight with no ripple. An adjacent plain list (`<ol>` of jobs, `<ul>` of bays) mirrors the scope for screen readers and recruiters.
**Palette/type:** deep sea-glass `#06110F`, scope face `#0B1C19`, contact ice-blue `#8BE9FF`, ring lines `#1F4A42`, lock magenta `#FF7AD9` (lock reticle only), text `#DDF5EF`. Type: **Oxanium** 600 for readouts + **Atkinson Hyperlegible** body (chosen deliberately for legibility on a dark, busy screen) + **Space Mono** for coordinates.

---

## 3. Experiment backlog

Ordered foundational → ambitious. Each item is phrased as an observable payoff so it can be checked in a browser or a Playwright test (`tools/tests/`).

**Foundations**
1. **Static plate first.** With JS disabled, `/` shows name, title, location, current role, email and GitHub as real text, styled as the pilot plate. *Pass: noscript/JS-off screenshot shows all six.*
2. **Data-only render.** Changing a job's `company` in `resume-data.js` changes the mission card, console line, aria-valuetext and print view with no other edits. *Pass: grep finds no résumé strings in `cockpit.js` / `index.html` beyond og/noscript.*
3. **Zero layout shift.** Boot, font swap, refits and decode keep CLS at **0.00** (fixed MFD sizes, `size-adjust` fallbacks, transform/opacity animation only). *Pass: Lighthouse/PerformanceObserver CLS = 0 across a full throttle sweep.*
4. **Throttle as a real slider.** `Home`, `End`, arrows and `PageUp/Down` move it, and a screen reader hears "2016, Sortie 4 of 8: Software Developer at xGrok, 4 systems installed". *Pass: axe clean; aria-valuetext matches DERIVED.*
5. **Never-empty cockpit.** No input for 6 s → full systems shown; `#full` or any deep link → full systems straight away; reduced motion → full systems at load. *Pass: test each of the three entry paths.*
6. **One-tap HAIL.** HAIL is visible at 390 px and 1440 px at every scroll position and opens mailto / copy email / GitHub. *Pass: element in viewport after scrolling to bottom on phone.*
7. **Contrast audit.** Every text/background pair in both themes is ≥4.5:1 (≥3:1 for 18 px+ bold counters). *Pass: automated token contrast script plus axe.*
8. **Focus is visible on everything.** 2 px amber ring plus 2 px offset, never removed, visible on glass and on the throttle. *Pass: tab through the page; every stop is visible in screenshots.*
9. **Printable résumé.** `P` or "Plain résumé" gives a one-column, black-on-white, two-page-max résumé (no cockpit chrome, no glow, URLs printed after links). *Pass: print-emulation PDF snapshot.*
10. **Climbing purge.** No visible text, class name, hash key, file name or doc line uses wall/route/belay/summit/chalk/crux/pitch/hold. *Pass: case-insensitive grep across `/`, `assets/`, `timeline/`, README returns zero UI hits (data `tagline` flagged to owner).*
11. **Legacy hash aliases.** `#job=xgrok` and `#skill=PHP` still land on the right sortie / lock and rewrite to `#sortie=` / `#lock=`. *Pass: navigation test.*

**Core fun**
12. **Cold-start boot.** First visit: lamp test → MFDs on → handshake line in ≤1.2 s. Any key skips it, and it does not replay within the session. *Pass: timing assertion; sessionStorage flag.*
13. **Refit cascade.** Crossing a sortie notch prints one `INSTALLING: X ▮▮▮ OK` line per `_new` item, adds that many contacts and sets the counter to `_cum`. *Pass: contact count == `_cum` at each notch.*
14. **Clean rewind.** Dragging the throttle down removes contacts in reverse order and never leaves stray lit hardpoints. *Pass: state at notch k is identical whether reached going up or going down.*
15. **Target lock.** Typing "php" in the lock field (fuzzy, case-insensitive) locks the PHP contact and lights the throttle segments for exactly `usedAt('PHP')`. *Pass: segment count == usedAt length.*
16. **Phone throttle.** At 390 px the horizontal throttle snaps per sortie on swipe, never hijacks vertical scroll, and has a ≥44 px hit area. *Pass: touch-emulation test plus scroll position unchanged on vertical drag.*
17. **Mission-card swipe and keys.** On the mission card, swipe left/right on touch or `1–8` on keyboard jumps sorties, and the URL updates to `#sortie=<id>`. *Pass: URL and card text match.*
18. **TUNE gauge.** At the MARCO sortie, the dial labels read exactly `highlight.from` and `highlight.to` and the needle ends in the green band. Under reduced motion it renders already at rest. *Pass: label text equals data.*
19. **Legacy firmware module.** The COBOL install renders in the `--firmware` phosphor style with the "legacy firmware: still in service" note. *Pass: visual snapshot.*
20. **Decode sortie.** At xGrok the bullets resolve from scrambled characters to final text in ≤600 ms, the box size never changes, and screen readers get only the final text. *Pass: bounding box constant; live region text equals data.*
21. **Re-commission moment.** At the final sortie the ghost 2019–2022 loadout appears, then the badge shows `+N SYSTEMS SINCE LAST TOUR`, with N computed from `_cum`. *Pass: N == `_cum[last] − _cum[agfirst-senior]`.*
22. **Sound toggle.** Sound starts OFF. Turning it on and pushing the throttle gives blips with no network requests for audio files, and the choice persists across reloads. *Pass: no `AudioContext` before opt-in; localStorage key set.*
23. **Key map overlay.** `?` opens a modal listing every shortcut, with a focus trap and `Esc` to close, styled as a laminated pilot reference card. *Pass: axe on open dialog.*

**Ambitious**
24. **Overdrive easter egg.** Three fast full throttle slams, or typing `overdrive`, triggers the HEAT event with the "just for fun" label and cools down in ≤3 s. *Pass: triggered state appears, then clears.*
25. **Gamepad support.** With a controller connected (Gamepad API), the left stick Y-axis moves the throttle, D-pad steps sorties, `A` locks the nearest contact, `B` clears the lock, `Start` shows full systems. A small "CONTROLLER LINKED" lamp lights up. *Pass: manual test plus polyfilled gamepad events.*
26. **Achievements (local only).** Toasts such as "First Refit", "Full Systems", "Decoder" (visited xGrok), "Legacy Certified" (locked COBOL), "Tuned" (watched the TUNE sweep), "Overdrive" and "Pilot's Reference" (opened `?`). Stored in localStorage and listed on a PILOT RECORD panel. They never gate content. *Pass: each unlocks once; content identical with none unlocked.*
27. **Loadout screen.** An optional full-screen view of the frame schematic with every bay and its systems, each labelled with the sortie it arrived in. Hover/focus a system to see its sortie trail. *Pass: every skill in `RESUME.skills` appears exactly once.*
28. **Mission briefing per job.** Pressing `Enter` on a sortie opens a "briefing" layout (objective = role, theatre = company + location, intel = bullets, systems fitted = `_new`), shareable at `#sortie=<id>&brief`. *Pass: deep link opens the briefing.*
29. **Canopy parallax.** On desktop with a fine pointer only, the horizon ridgelines shift ±6 px with pointer position (transform only, off with reduced motion). *Pass: no CLS; disabled under reduced motion.*
30. **Hangar day theme.** The light theme switches with the system preference or the toggle, all tokens stay AA, and the scope reads as a printed radar plot. *Pass: contrast script in both themes.*
31. **Service Log re-skin.** `/timeline/` shows refits as maintenance entries with `★ COMMISSIONED` milestones, and compare/restore still work. *Pass: existing timeline tests pass with the new labels.*
32. **Archived Frame strip.** Every `/versions/vNN/` shows the re-skinned strip with prev/next milestone and "Return to active frame". *Pass: link targets match manifest.*
33. **Performance budget.** Home page ≤90 KB transferred excluding fonts, ≤3 font files, LCP < 1.5 s on mid-tier mobile (4G), no images except og.png meta. *Pass: Lighthouse perf ≥95 on mobile.*
34. **Offline cockpit.** After one visit the cockpit, rooms and Service Log load offline, and the console shows `LINK: OFFLINE · RUNNING ON LOCAL CACHE`. *Pass: SW offline test.*
35. **OG card refresh.** `tools/og-card.html` renders a cockpit-styled share card (pilot plate plus a lit scope) at 1200×630 from data. *Pass: regenerated `assets/og.png` matches the new style.*
36. **Comms-channel mode (stretch).** A "radio" toggle turns the console into a read-aloud-style transcript of the career (text only; optional `speechSynthesis` only after an explicit click). *Pass: off by default; works without speech support.*

---

## 4. Guardrails

### 4.1 IP: never
- No MechWarrior, BattleTech or related names, trademarks or terms of art (e.g. "BattleMech", "OmniMech"), no machine/model names, factions, houses, clans, units, planets, insignia, logos or slogans from any franchise.
- No recreation of any specific game's HUD layout, bezel art, colour scheme signature, sounds or boot text. Our layout (three MFDs + status brow + time-throttle on the right) is designed from the generic genre vocabulary.
- No fonts made to imitate a franchise's logotype; use only the Google Fonts named above.
- All names are original: **AUTODIDACT**, **Congaree Heavy Works**, **AX-1**, **SORTIE**, **Service Log**, **Maintenance Port**, **Flight Recorder**, **Crew Deck OS**. Do not mention the source game anywhere on the site, including comments, meta tags and alt text.

### 4.2 Content must never be gated by play
- Name, title, current role, contact, skills and every job's text are readable without touching the throttle, with JS off, under reduced motion and in print.
- Easter eggs and achievements unlock flavour only, never information.

### 4.3 Readability over glow
- No glow, blur or scanlines on running text. No text over animated backgrounds. Minimum body size 16 px (15 px on phones only for chips). Label min 12 px.
- AA contrast in both themes is a release blocker. Status is never shown by colour alone; every lamp has a word.

### 4.4 Motion and sound
- `prefers-reduced-motion` fully respected (see §1.3). No flashing faster than 3 Hz, ever (overdrive lamps pulse at ≤2 Hz).
- **No autoplay sound.** Sound is off by default, has a visible toggle, is created only after a gesture, and has no loops.
- Boot ≤1.2 s, skippable, once per session, and must never delay LCP: content renders underneath.

### 4.5 Honest numbers only
- Every number shown comes from `RESUME`/`DERIVED`: years, system count, sortie count, `_cum`, the MARCO "failing → 99%" highlight.
- No invented "skill levels", percentages, proficiency bars, armour %, "power 87%" or fake telemetry next to skills or jobs. Decorative gauges (HEAT, sweep) carry no numerals and are labelled as decoration where they could be mistaken for data.

### 4.6 Must not regress
- Zero layout shift; fast load (§3 item 33); no large raster assets (SVG/CSS art only).
- Works at 390 px touch, desktop pointer, and keyboard-only, with visible focus and no traps (except modals, which trap and release properly).
- One-tap HAIL always visible; printable résumé; `<noscript>` plate; og/meta tags.
- Deep links (`#sortie`, `#lock`, plus legacy `#job`, `#skill`), the alternate rooms (`/terminal/`, `/gitlog/`, `/desktop/`), `switcher.js` wayfinding with `Alt+1/2/3`, the Service Log (`/timeline/`) with previews/compare/restore, the snapshot bar on `/versions/vNN/`, offline support via `sw.js`, and the Playwright suite in `tools/tests/` (updated for new names, not deleted).
- Single source of truth: résumé text lives only in `assets/resume-data.js`.

### 4.7 Avoid
- Full-screen intro movies, splash gates or "click to enter".
- Canvas-only rendering of content (the scope may draw on canvas or SVG, but every contact has a DOM/text equivalent).
- Military-flavoured violence: no weapons firing, explosions, kill counts or "enemy" framing. Contacts are systems, locks are lookups, and sorties are deployments to build things. The fantasy is a machine that **learns**, not one that destroys.
- Gamer jargon that hides meaning from recruiters: every themed label has the plain word next to it or in its accessible name (e.g. "SORTIE 04 · Job 4 of 8", "SYSTEMS · Skills").

---

# Direction 3: TEXT RAIN (owner-requested, replaces the cockpit)

**Owner brief (2026-11-22):** pure text, influenced by falling-code sci-fi. All text comes in from the top and drops into place, ushered by a little army of mini cursor drones (think drone swarms in mecha sci-fi) moving the text around the screen.

## IP and taste rules
Genre inspiration only: no film quotes, logos, character names, the film's exact glyph set, or recreated title sequences. Glyphs come from an original mix of digits, Latin capitals, punctuation and box-drawing characters. Drones are original cursor glyphs (`▸ ▮ ◂ ▴`), not any franchise's unit designs or names.

## Core mechanics
1. **Everything is real text.** The page is a monospace document rendered from `resume-data.js`. The DOM holds the final text from the first frame (screen readers, search, copy and print all work), and the visual effect is painted on a canvas overlay that hides the DOM text only until each word lands. CLS stays 0 because the layout never moves.
2. **Rain entrance.** Each word starts above the viewport and falls into its exact position (measured with `Range.getClientRects`), its characters flickering through random glyphs until they lock. Priority: name, then title/current role, then Hail (email), then the rest. Sections below the fold rain in when scrolled into view.
3. **Drone escort.** A swarm of cursor drones lives in a hive (top-right). Each falling word is escorted by a drone that dives with it, hovers as it locks, then zips back to the hive. Drones never block text and are purely decorative (`aria-hidden`).
4. **Never in the way.** Any key, click or tap lands everything instantly. `prefers-reduced-motion` shows text immediately with no drones. Repeat visits in the same session use a 400 ms quick rain.

## Fun / interactivity backlog (for this run)
- **Pointer swarm:** drones flock toward the pointer; click a word and the swarm lifts it, scrambles it and drops it back.
- **Type to find:** with nothing focused, typing builds a query that rains into a search line. Matching words glow and drones swarm them; Esc clears; `#find=php` deep link.
- **Channel switching:** keys/links jump between sections. Old text falls off the bottom, new text rains in.
- **Command line:** `:` opens a prompt (help, jobs, skills, hail, rain, theme…). Answers rain in.
- **Idle formation:** after inactivity the drones assemble into the owner's initials or handle, scatter on input.
- **Replay / rewind:** a control that sends all text back up the screen and re-rains it.
- **Phosphor themes:** green (default), amber, ice, paper (light). All AA, all text-only.
- **Ambient rain:** a faint background rain of glyph columns that parts around the pointer (off under reduced motion, pauses offscreen).
- **Skill constellation in text:** a skills section where drones carry each skill word to sit beside the jobs that used it.
- **Opt-in sound:** soft keyclick ticks as words lock (off by default).
- **Text-only Service Log + rooms bar** in the same rain style.
- **Mobile:** tap to re-rain a word; drones scaled for touch; performance budget for low-end phones.

## Guardrails
Recruiter essentials (name, title, current role, company, email) are readable within 1.5 s with zero interaction, and instantly on any input. AA contrast in every theme. No content behind gameplay. The canvas animation runs only while something is moving, and pauses when the tab is hidden. Everything still prints as a clean résumé.

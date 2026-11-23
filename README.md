# etis-good

Personal bio / résumé site for **Samuel Campbell**, Full Stack Web Developer.
Live: https://etis-good.samueldcampbell.workers.dev

## What's here

| Path | What it is |
|---|---|
| `/` | **Text Rain**: a pure-text résumé. Every word falls from the top of the screen and locks into place, escorted by a swarm of little ▸ cursor drones. The drones then work for you: they carry whole jobs around when you sort, tow search results into a list, bring the roles that used a skill to the top, repaint the page in a new phosphor colour, and carry your copied email into their hive. |
| `/timeline/` | **Changelog**: every version of the site, with milestones, live previews, compare-with-current, and a one-tap way back. |
| `/versions/vNN/` | Working snapshots of each version, including experiments that lost. |
| `/terminal/`, `/gitlog/`, `/desktop/` | Three older alternate "rooms" (a shell, a git-log career graph, a retro desktop). |

### Things to try on the home page

- **Just start typing** to search anything (`#find=php` links work too). Then **[ gather ]** to have the swarm bring every matching line to you.
- **Click any word** and a squad lifts it, scrambles it and drops it back.
- **Tap the swarm** (bottom right) for its orders: replay the rain, form up and spell the handle, carry the jobs newest / oldest / most learned, rebuild the page as a board, change phosphor (green / amber / ice / paper).
- **Click a skill** in Systems to have the roles that used it carried to the top of Experience.
- **[ copy ]** next to the email copies it, and the drones carry it home.
- Keys: `1`–`4` jump between sections · `0` replay · `9` phosphor · `?` all keys.
- **Tractor mode** (swarm menu, key `8`, or a link ending in `#tractor`): the drones become tractors and the text itself becomes grass. The tractors till the page in serpentine rows and every letter grows out of the soil (seed → shoot → rise → unfurl). Click any grass to send a tractor to mow it away. The toolbox (bottom left) has ✂ mow all, ↺ reseed, ☂ rain (the grass drinks it and grows taller), ◎ drive (steer your own tractor with arrows/WASD or by dragging; space swaps mower and tiller), ♪ sound (off by default) and ↩ back to text. The mode is remembered, so the next visit loads straight into a field being tilled.
- Leave it idle and the swarm spells out the handle. Background rain parts around your pointer.

Respects `prefers-reduced-motion` (no rain or drones; every feature still works), keyboard-only use, phones, and print.

## Editing content

Edit **`assets/resume-data.js`** only; every page renders from it.
Open items: the current AgFirst role still has a placeholder bullet and a `TODO` on its tags, and the `tagline` still mentions "climbing learning curves".
After changing the data, regenerate the share image: open `tools/og-card.html` in a browser at 1200×630 and save a screenshot as `assets/og.png`. If the name or title changed, also update the `og:` meta tags and `<noscript>` line in `index.html`. Those are the only places résumé text is typed by hand.

## How it's built

Plain static HTML/CSS/JS. No build step, no dependencies.

```
index.html            home page (Text Rain)
assets/resume-data.js single source of truth
assets/derive.js      computed facts (years, roles, skills new at each job, where each skill was used)
assets/rain.css|js    home page: layout, text rain engine, drone swarm, carry engine, find, themes
assets/switcher.js    small wayfinding bar (links to the changelog and rooms)
sw.js                 offline support (network-first, cache fallback)
timeline/             Changelog + the bar injected into snapshots
versions/             snapshots + manifest.js (the version history)
iteration-state.json  iteration loop state and the next-round brief
NEWDESIGNS.md         design directions (cockpit spec, Text Rain spec + backlog)
tools/loop.py         snapshot / restore helpers
tools/og-card.html    share-card generator
tools/tests/          regression suite (Playwright)
```

How the page loads: the whole page starts as one big field of tall grass (a CSS stand-in covers it from the first paint, then a canvas takes over). After a moment a fleet of tractors (6 on desktop, 4 on phones) rolls in and mows it in serpentine rows: the rows on screen first, then on down the rest of the page, U-turning at the edges and throwing clippings. The site appears in the cut strips. Skip with the button, Esc or any key; with reduced motion the page simply appears. The swarm-intro library (`assets/swarm-intro.js`, MIT, Swarnadeep Roy) is still in the repo but no longer runs on load.

How the grass works: each word is redrawn on the canvas as *sod*. Its letterforms are rasterised once into an offscreen canvas and filled with a fibrous grass texture, and blades are rooted on the letters' top edges, found by scanning the glyph mask. Headings also get a soil edge and shadow (cut turf). Growth, sway, wind gusts, bending around the pointer, mowing stripes and clippings are all drawn per frame from that cached data; the real text stays in the DOM, invisible (`-webkit-text-fill-color: transparent`), so search, copy and screen readers still work. When nothing is moving the field drops to 30 fps and then stops after 10 s idle.

How the text rain works: the real text is in the DOM from the first frame (so layout never shifts and screen readers, search and copy/paste work), hidden with transparent colour until its words land. A canvas on top paints the falling glyphs at exactly the positions measured from the live text. The same measure → change the DOM → measure again → fly every word between the two positions engine powers sorting, the board view, gather and dispatch.


## Running locally

```bash
python -m http.server 8765        # then open http://localhost:8765
```

## The iteration loop

The site is improved in rounds: each round runs one experiment, tests it, and either keeps it or rejects it, and every evaluated version is snapshotted.

- `iteration-state.json` holds `last_completed_version`, `strongest_version`, `target_version`, the settings (`ROUNDS_PER_CYCLE`, `CYCLES_PER_RUN`), owner feedback, cycle reviews, and the brief for the next round.
- `python3 tools/loop.py snapshot N` saves the current site as `versions/vNN/`; `restore N` rolls the root back to it.
- `python3 tools/tests/record.py round.json` snapshots, appends to `versions/manifest.js` and advances the state (the counter last).
- Regression suite: start the local server, then `python3 tools/tests/check.py <tag> "" tools/tests/a_r44.py` (desktop, phone, and reduced-motion runs; reports errors, CLS and overflow). `python3 tools/tests/verify.py` checks every featured snapshot's defining interaction. Requires Python Playwright plus Chromium.

## Deploying

Static files at the repo root. Push to `main`.

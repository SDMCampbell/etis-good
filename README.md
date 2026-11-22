# etis-good

Personal bio / résumé site for **Samuel Campbell**, Full Stack Web Developer.
Live: https://etis-good.samueldcampbell.workers.dev

## What's here

| Path | What it is |
|---|---|
| `/` | **The Learning Curve**: the career as a climbing route (height = cumulative distinct skills). Drag the token, swipe the curve on a phone, use arrow keys, or press **Auto-belay** to watch it climb. Skills are filters (`#skill=PHP`), jobs are deep-linkable (`#job=xgrok`). Night mode, offline support, printable résumé. |
| `/terminal/`, `/gitlog/`, `/desktop/` | Three alternate "rooms": an interactive shell, a git-log career graph, and a retro desktop. |
| `/timeline/` | **Summit Register**: every version of the site, with live previews, side-by-side compare, and a one-click way back. |
| `/versions/vNN/` | Working snapshots of each version (including experiments that lost). |

Keyboard: press `?` on the home page for all shortcuts. Type `belay` for a diagnostics overlay.

## Editing content

Edit **`assets/resume-data.js`** only; every page renders from it.
Two `TODO`s remain on the current AgFirst role (real highlights and tags).
After changing the data, regenerate the share image: open `tools/og-card.html` in a browser at 1200×630 and save a screenshot as `assets/og.png`. Then also update the name/title in the `og:` meta tags in `index.html` if they changed. Those tags and the `<noscript>` line are the only places résumé text is typed by hand.

## How it's built

Plain static HTML/CSS/JS. No build step, no dependencies.

```
index.html            home page (The Learning Curve)
assets/resume-data.js single source of truth
assets/derive.js      computed facts (cumulative skills, years, usage)
assets/wall.css|js    home page
assets/switcher.js    wayfinding bar used by the three rooms
sw.js                 offline support (network-first, cache fallback)
timeline/             Summit Register + the bar injected into snapshots
versions/             snapshots + manifest.js (the version history)
iteration-state.json  iteration loop state and the next-round brief
docs/design-brief.md  the designer's spec (directions, backlog, guardrails)
tools/loop.py         snapshot / restore helpers
tools/tests/          regression suite (Playwright)
```

## Running locally

```bash
python -m http.server 8765        # then open http://localhost:8765
```

## The iteration loop

The site is improved in rounds: each round runs one experiment, tests it, and either keeps it or rejects it, and every evaluated version is snapshotted.

- `iteration-state.json` holds `last_completed_version`, `strongest_version`, `target_version`, the settings (`ROUNDS_PER_CYCLE`, `CYCLES_PER_RUN`), cycle reviews, and the brief for the next round.
- `python3 tools/loop.py snapshot N` saves the current site as `versions/vNN/`; `restore N` rolls the root back to it.
- `python3 tools/tests/record.py round.json` snapshots, appends to `versions/manifest.js` and advances the state (the counter last).
- Regression suite: start the local server, then `python3 tools/tests/check.py <tag> "" tools/tests/a_r3.py` (desktop, phone, and reduced-motion runs; reports errors, CLS and overflow). `python3 tools/tests/verify.py` checks every featured snapshot's defining interaction. Requires Python Playwright plus a Chrome path (edit `executable_path` if yours differs).

## Deploying

Static files at the repo root. Push to `main`.

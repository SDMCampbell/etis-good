# etis-good

Personal bio / résumé site for **Samuel Campbell**, Full Stack Web Developer.
Live: https://etis-good.samueldcampbell.workers.dev

Stripped back to the bare minimum as a starting point for a new idea.

```
index.html               the page, and the single call to the swarm library
assets/resume-data.js    the content (edit here only)
assets/content.js        renders the content into plain HTML
assets/matrix.js         the scrolling glyph background
assets/swarm-intro.js    swarm-intro (MIT, Swarnadeep Roy), compiled unmodified from its src/index.ts
assets/samurai.js        the "samurai" mode
assets/site.css          styles
assets/og.png            share image
sw.js                    removes the old site's service worker for returning visitors
```

## Modes

Each mode is a different way of using the swarm library. Pick one with the switch at the top right (remembered) or a link ending in `#mode=NAME`.

- **normal**: swarm-intro's default. The cursors gather round the `doog` badge, then build every element.
- **samurai** (`#mode=samurai`): every cursor is a stick-figure samurai with a sheathed sword. When one reaches an element it draws, dashes diagonally across it leaving a glowing blade trail, and the content appears in the cut with a flash. It's still swarm-intro underneath; `samurai.js` restyles its cursors and selection boxes (rules in `site.css`) and watches its DOM to draw and sheathe the swords.

**Swarm size**: the slider next to the mode switch sets how many cursors there are (1–80, remembered). swarm-intro fixes its cursor count when it starts and can't add cursors to a running build, so moving the slider tears down the current swarm and rebuilds the page with the new count straight away.

To add a mode: add its name to `MODES` in `index.html`, a button in the `.modes` nav, and its setup in the script below.

Everything from earlier versions (the text rain, drones, tractor mode, the version history and the alternate rooms) is still in the git history.

Run locally: `python -m http.server 8765`, then open http://localhost:8765.

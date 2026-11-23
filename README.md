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
- **samurai** (`#mode=samurai`): every cursor is an animated stick-figure samurai with a sheathed sword. Each one is posed every frame from how it's actually moving: a ready stance when standing still, a ninja sprint (pitched forward, arms swept straight back) when moving sideways, levitating upright with arms eased out when moving up, and a controlled crouched descent with a hand on the hilt when moving down. When one reaches an element it draws, dashes diagonally across it leaving a glowing blade trail, and the content appears in the cut with a flash. It's still swarm-intro underneath; `samurai.js` restyles its cursors and selection boxes (rules in `site.css`) and watches its DOM to draw and sheathe the swords.

**Swarm size**: the slider next to the mode switch sets how many cursors there are (1–30, remembered; more than that is just clutter). swarm-intro fixes its cursor count when it starts and can't add cursors to a running build, so moving the slider tears down the current swarm and rebuilds the page with the new count straight away.

In samurai mode the figures also collide: overlapping samurai shove each other apart, and two that run into each other fast clash, with a spark and both knocked back. swarm-intro still decides every cursor's real route, so this is done with a small offset on each figure that springs back to its cursor; a samurai mid-cut holds its line.

To add a mode: add its name to `MODES` in `index.html`, a button in the `.modes` nav, and its setup in the script below.

Everything from earlier versions (the text rain, drones, tractor mode, the version history and the alternate rooms) is still in the git history.

Run locally: `python -m http.server 8765`, then open http://localhost:8765.

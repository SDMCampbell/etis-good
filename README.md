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
assets/site.css          styles
assets/og.png            share image
sw.js                    removes the old site's service worker for returning visitors
```

Right now the swarm library runs in its default form: the cursors gather round the `doog` badge, then build every element of the résumé. To try a new way of showing the content, change the `swarmIntro(...)` call at the bottom of `index.html`. Its options are documented in the swarm-intro README.

Everything from earlier versions (the text rain, drones, tractor mode, the version history and the alternate rooms) is still in the git history.

Run locally: `python -m http.server 8765`, then open http://localhost:8765.

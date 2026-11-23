# etis-good

Personal bio / résumé site for **Samuel Campbell**, Full Stack Web Developer.
Live: https://etis-good.samueldcampbell.workers.dev

Stripped back to the bare minimum as a starting point for a new idea.

```
index.html               the page, and the single call to the swarm library
assets/resume-data.js    the content (edit here only)
assets/content.js        renders the content into plain HTML
assets/matrix.js         the animated background (one scene per mode)
assets/swarm-intro.js    swarm-intro (MIT, Swarnadeep Roy), compiled from its src/index.ts, with a small local patch (see below)
assets/samurai.js        the "samurai" mode
assets/robot.js          the "robot" mode
assets/site.css          styles
assets/og.png            share image
sw.js                    removes the old site's service worker for returning visitors
```

## Modes

Each mode is a different way of using the swarm library. Pick one with the switch at the top right (remembered) or a link ending in `#mode=NAME`.

- **normal**: swarm-intro's default. The cursors gather round the `doog` badge, then build every element.
- **samurai** (`#mode=samurai`): every cursor is an animated stick-figure samurai with a sheathed sword. Each one is posed every frame from how it's actually moving: a ready stance when standing still, a ninja sprint (pitched forward, arms swept straight back) when moving sideways, levitating upright with arms eased out when moving up, and a controlled crouched descent with a hand on the hilt when moving down. When one reaches an element it draws, dashes diagonally across it leaving a glowing blade trail, and the content appears in the cut with a flash. It's still swarm-intro underneath; `samurai.js` restyles its cursors and selection boxes (rules in `site.css`) and watches its DOM to draw and sheathe the swords.

**Swarm size**: the slider next to the mode switch sets how many cursors there are (1–30, remembered; more than that is just clutter). swarm-intro fixes its cursor count when it starts and can't add cursors to a running build, so moving the slider tears down the current swarm and rebuilds the page with the new count straight away.

- **robot** (`#mode=robot`): every cursor is an animated stick-figure robot in a jet-powered suit (an original design): a solid helmet with a visor slit, an armoured chest and a thruster pack. Hovering on boot jets when still, boosting along upright with its boosters angled back when moving sideways, rising upright with palm and boot jets firing down, and dropping in a powered crouch with the jets braking. To build an element it braces, aims a palm and fires a beam into a glowing energy frame until the element blasts into existence.

- **wizard** (`#mode=wizard`): every cursor is an animated stick-figure wizard (an original design): a tall pointed hat, a short beard, a long robe with a wavy floating hem, and a wooden staff topped with a glowing orb, all in an arcane violet. Wizards never walk; they float. Hovering upright when still, gliding with a forward lean when moving sideways (robe and hat tip streaming out behind), levitating with arms spread when rising, and a slow, controlled descent with the robe billowing up. To build an element it rears back with its free hand raised and points the staff, sending a crackling bolt into a glowing rune frame; the element appears in a violet flash with a scatter of sparkles.

**When there's nothing to build**, the swarm now stays on screen (Esc or Skip dismisses it) and each mode idles its own way:
**normal** circles the mouse pointer in two rings turning opposite ways (or the middle of the screen when the pointer isn't on it);
**samurai** walk to a neat line down the right side of the screen and wait poised in a low iaijutsu stance, katana sheathed at the hip with one hand on the hilt, ready to draw;
**robot** wander the screen as before;
**wizard** drift into an evenly spaced horizontal line across the screen (halfway up, or level with the mouse pointer while it's on the page) and float there cross-legged in meditation, staff hovering beside them, while a wave rolls endlessly along the line. This needed a small patch to `swarm-intro.js`, marked "etis-good patch": an `idle` option that
says where an idle cursor goes, and a `persist` option that keeps the swarm after the page is built.

**Click to rebuild**: while the swarm is on screen, clicking a piece of the page (anything but a link or control) sends the nearest free worker to take it apart: the build in reverse, starting from its bottom-right corner and dragging back to the top-left, with typed text deleted from the end (normal) or the element cut away (samurai, who turn and cut back up-left) blasted away (robot) or blasted apart by a bolt of magic (wizard). After a short pause a different worker builds it again the usual way. This is another patch to `swarm-intro.js`: `swarmIntro()` now also returns `rework(el)`.

Each mode has its own background, all moving the same way (drifting down, fainter behind the text; they don't react to the mouse): **normal** is the matrix glyph rain, **samurai** is cherry blossom petals tumbling down from a sakura branch in the top-left corner, **robot** is deep space, a twinkling starfield with faint, distant asteroids drifting through it, and **wizard** is an arcane night sky, with glowing motes of gold and violet light drifting and swaying down among slowly falling twinkles.

In samurai, robot and wizard modes the figures also collide: overlapping samurai shove each other apart, and two that run into each other fast clash, with a spark and both knocked back. swarm-intro still decides every cursor's real route, so this is done with a small offset on each figure that springs back to its cursor; a figure that's mid-cut or firing holds its line.

To add a mode: add its name to `MODES` in `index.html`, a button in the `.modes` nav, and its setup in the script below.

Everything from earlier versions (the text rain, drones, tractor mode, the version history and the alternate rooms) is still in the git history.

Run locally: `python -m http.server 8765`, then open http://localhost:8765.

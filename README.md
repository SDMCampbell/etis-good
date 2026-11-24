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
- **samurai** (`#mode=samurai`): every cursor is an animated stick-figure samurai with a sheathed sword. Each one is posed every frame from how it's actually moving: a ready stance when standing still, a ninja sprint (pitched forward, arms swept straight back) when moving sideways, levitating upright with arms eased out when moving up, and a controlled crouched descent with a hand on the hilt when moving down. When one reaches an element it builds it with an iaijutsu strike: it sinks into the low iai-goshi crouch at the top-left corner as its thumb breaks the scabbard's seal, vanishes through the element leaving a thin hairline cut along its diagonal, reappears at the bottom-right corner low with the blade out and sheathes it slowly as it rises, and at the click the cut flares and the content appears (the library's `buildPause` / `revealPause` options give it the time). Taking an element apart after a click is still a reverse slash. It's still swarm-intro underneath; `samurai.js` restyles its cursors and selection boxes (rules in `site.css`) and watches its DOM to draw and sheathe the swords.

**Swarm size**: the slider next to the mode switch sets how many cursors there are (1–30, remembered; more than that is just clutter). swarm-intro fixes its cursor count when it starts and can't add cursors to a running build, so moving the slider tears down the current swarm and rebuilds the page with the new count straight away.

- **robot** (`#mode=robot`): every cursor is an animated stick-figure robot in a jet-powered suit (an original design): a solid helmet with a visor slit, an armoured chest and a thruster pack. Hovering on boot jets when still, boosting along upright with its boosters angled back when moving sideways, rising upright with palm and boot jets firing down, and dropping in a powered crouch with the jets braking. To build an element it braces, aims a palm and fires a beam into a glowing energy frame until the element blasts into existence.

- **wizard** (`#mode=wizard`): every cursor is an animated stick-figure wizard (an original design): a tall pointed hat, a short beard, a long robe with a wavy floating hem, and a wooden staff topped with a glowing orb, all in an arcane violet. Wizards never walk; they float. Hovering upright when still, gliding with a forward lean when moving sideways (robe and hat tip streaming out behind), levitating with arms spread when rising, and a slow, controlled descent with the robe billowing up. To build an element it rears back with its free hand raised and points the staff, sending a crackling bolt into a glowing rune frame; the element appears in a violet flash with a scatter of sparkles.

- **ninja** (`#mode=ninja`): every cursor is an animated stick-figure ninja (an original design): a masked head with a glinting eye slit, a red headband whose tails stream out behind, and a short sword slung across the back. A low ready crouch when still, a deep-leaning sprint (leaving fading afterimages at speed) when moving sideways, a tucked somersault when rising, and a drop with arms up and out when falling. To build an element it crouches and throws shuriken into the selection box one after another, and the element lands with a sharp little shake.

**When there's nothing to build**, the swarm now stays on screen (Esc or Skip dismisses it) and each mode idles its own way:
**normal** circles the mouse pointer in two rings turning opposite ways (or the middle of the screen when the pointer isn't on it);
**samurai** walk to a neat line down the right side of the screen and wait poised in a low iaijutsu stance, katana sheathed at the hip with one hand on the hilt, ready to draw. If the mouse pointer comes near, one strikes, staged after real iai and anime's "invisible cut": it sinks into iai-goshi (the low crouch) as its thumb breaks the scabbard's seal, a sliver of blade gleaming, and holds, coiled; then it's gone, leaving only a thin, still hairline across the pointer; it reappears low with the blade out and sheathes it slowly as it rises; and only at the click does the cut flare and fall apart (several in range take turns);
**robot** wander the screen, and any robot the mouse pointer comes near stops, turns and fires bursts of its laser at it;
**wizard** drift into an evenly spaced horizontal line across the screen (halfway up, or level with the mouse pointer while it's on the page) and float there cross-legged in meditation, staff hovering beside them, while a wave rolls endlessly along the line;
**ninja** vanish in a puff of smoke and lurk at the edges of the screen, almost invisible but for their eyes: flat against a side wall with their backs to it, gripping it behind them, or crouched along the bottom. Every few seconds, or the moment the mouse pointer comes near, they vanish again and turn up somewhere else, away from the pointer. This needed a small patch to `swarm-intro.js`, marked "etis-good patch": an `idle` option that
says where an idle cursor goes, and a `persist` option that keeps the swarm after the page is built.

**Click to rebuild**: while the swarm is on screen, clicking a piece of the page (anything but a link or control) sends the nearest free worker to take it apart: the build in reverse, starting from its bottom-right corner and dragging back to the top-left, with typed text deleted from the end (normal) or the element cut away (samurai, who turn and cut back up-left) blasted away (robot) or blasted apart by a bolt of magic (wizard) or knocked apart by shuriken (ninja). After a short pause a different worker builds it again the usual way. This is another patch to `swarm-intro.js`: `swarmIntro()` now also returns `rework(el)`. The **type** toggle next to the swarm slider (remembered) switches every mode to typing all of the text in, character by character, long multi-line blocks included (and deleting it backwards on a click). Underneath, a `type` option controls this: the figure modes turn it off (they show text whole), and text that wraps onto more than one line is always faded in rather than typed, because typing it sent the cursor zigzagging back through the middle of the block.

**Fight** (the toggle next to "type", remembered): the swarm splits into two teams, marked `data-team` on each cursor. Half of it, rounded down, attacks (drawn in red): attackers never build, but whenever they're rested they pick an element on screen and tear it down (the build in reverse). The rest, including the odd one, defend: they build the page, rush any attacker whose teardown has started (catching it in time cancels the attack, restores the element with a flash, and knocks the attacker back, stunned for a few seconds), and rebuild whatever the attackers did manage to tear down. It's roughly balanced: defenders stop around a third of the attacks, and usually only one or two elements are down at any moment. Clicking still works mid-fight. This is another patch to `swarm-intro.js` (the `fight` option).

**Reduced motion**: a visitor whose device is set to reduce motion first sees a full-screen notice and nothing else, with two choices: *play it anyway* (the full animated page) or *show it without animation* (the page, still, with a one-line reminder at the top that keeps the way back to the animation). The choice is remembered.

**What each one is doing**: every cursor, in every mode, carries its current state as `data-state` on its element (and `state` on the library's agent): `intro` (swarming the logo at the start), `moving` (on its way to a job), `building`, `unbuilding` (taking an element apart after a click), `idle`, or a more specific idle activity (`zapping` for a robot firing at the pointer, `striking` for a samurai's iaijutsu at it). In a fight there are also `attacking` (an attacker on its way to tear something down), `defending` (a defender chasing an attacker) and `stunned`. In the figure modes, `data-pose` also says how the figure is drawn at that moment, e.g. `run`, `slash`, `meditate`, `blast`, `cast`, `lurk` or `wall`.

Each mode has its own background, all moving the same way (drifting down, fainter behind the text; they don't react to the mouse): **normal** is the matrix glyph rain, **samurai** is cherry blossom petals tumbling down from a sakura branch in the top-left corner, **robot** is deep space, a twinkling starfield with faint, distant asteroids drifting through it, and **wizard** is an arcane night sky, with glowing motes of gold and violet light drifting and swaying down among slowly falling twinkles, and **ninja** is a moonlit night in the rain, thin streaks slanting down past a pale moon.

In samurai, robot, wizard and ninja modes the figures also collide: overlapping samurai shove each other apart, and two that run into each other fast clash, with a spark and both knocked back. swarm-intro still decides every cursor's real route, so this is done with a small offset on each figure that springs back to its cursor; a figure that's mid-cut or firing holds its line.

To add a mode: add its name to `MODES` in `index.html`, a button in the `.modes` nav, and its setup in the script below.

Everything from earlier versions (the text rain, drones, tractor mode, the version history and the alternate rooms) is still in the git history.

Run locally: `python -m http.server 8765`, then open http://localhost:8765.

## Swarm Wars (`/fight_game`)

A separate page with no résumé content (`fight_game.html`), linked from the right of the "fight" toggle. It runs swarm-intro and all four figure modes at once: two swarms fight over a field of glowing code panels, each panel a swarm target.

- **The field**: a 24 x 12 grid of about 120 panels. Each side has a fortress that starts built in its colour (corner towers, brick walls with a gate facing the middle, a keep in the centre); between them is a mirrored no-man's-land of empty panels.
- **Spawning**: one row of buttons per side (up to 18 a side); units march in from their own edge. **Auto battle** keeps both sides spawning (mostly fighters, a few sentinels and warders, the losing side a bit faster). **Reset** starts over.
- **Roles** (the `traits` option; lives show as pips under each unit):
  - **cursor**, swarmer (2 lives, fast): grabs empty panels first; defends nearby.
  - **samurai**, duelist (4 lives, hits for 2): hunts enemy units, raiders first, and duels them with its iaijutsu; defends from far away.
  - **robot**, sentinel (5 lives, slow): plants itself on one of its fortress panels (keep, then towers, then walls). That panel can't be torn down while it stands, and it lasers any enemy that comes close. To take the panel, an enemy has to beat it in a duel.
  - **wizard**, warder (2 lives): holds a spot in its fortress and casts a ward circle; every one of its team's panels inside is shielded the same way.
  - **ninja**, raider (2 lives, very fast): ignores the middle and goes for the enemy's keep and towers; dodges half of all interceptions and duels with a smoke blink.
- **Everyone** also rushes enemies on their way to tear down their team's panels (a clash costs the raider lives equal to the defender's hits), tears down enemy panels with their mode's teardown, and builds empty panels with their mode's build. Shielded panels are outlined with a ◆. At 0 lives a unit is deleted in a burst of glyphs.
- **Winning a round**: take the enemy keep. A keep is sealed (double outline) while its side holds at least two of its four towers, and fortress pieces are armoured: a tower takes 2 teardowns, a keep 4 (pips in the corner; cracks show the damage). When a keep falls, the loser's units are deleted one by one and its panels glitch and collapse; the winner's swarm flies into formation and spells out **GREEN WINS** / **RED WINS** across the field (its survivors, topped up with extra cursors in its colour); then both fortresses rise again from the keeps outwards and the next round starts. The header keeps the round score. In auto battle, rounds run about 30-60 seconds.
- **How it fits together**: the library's `add({team, kind})` spawns a unit at any time; each mode script can be scoped to its own kind (`samuraiMode({ scoped: true })`, keyed on the cursor's `data-kind`), and every mode rule in `site.css` has a per-unit twin keyed on `data-kind` / `data-side`, so all the figures share one page in team colours.

## Swarm Music (`/music`)

A music visualizer played by the swarm (`music.html`), linked as "music →" in the top bar.

- **Sound sources**: a built-in demo beat (a 16-bar loop synthesised in the page with Web Audio, so there's nothing to download or license), your own audio file (drag it anywhere onto the page, or use "choose a file"; it's played locally and never uploaded), or the microphone (analysed but not played back). Sound only starts after a click, as browsers require.
- **The fast layer**: 24 frequency bands (40 Hz to 14 kHz, low to high from left to right) by 10 levels, lit every frame straight from an `AnalyserNode`. Green is bass, gold is mids, cyan is highs.
- **The swarm layer**: 16 units as puppets (the library's `puppet` option and `order(agent, el)`). A beat is a third of the spectrum jumping above its own recent average; on each one, a few free units fly to the hottest columns there and build a bright note with their mode's build animation, which then fades. Between strikes they hold a formation: a ring that kicks outward with the bass, or "surfing" the tops of the columns (it switches every 16 kicks). In silence they spread out and rest in their idle poses. The swarm can be a mix or all one kind.

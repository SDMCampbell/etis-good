/*
 * Version history shown on /timeline/ and in the bar on every snapshot.
 * One entry per evaluated round. featured marks the turning points.
 * verdict: baseline | kept | rejected | merged (partly folded into a later version)
 */
window.VERSIONS = {
  "current": 52,
  "list": [
    {
      "v": 0,
      "date": "2026-11-22",
      "title": "Three concepts",
      "verdict": "baseline",
      "featured": true,
      "note": "Where it started: a landing page that links three takes on one resume: a terminal, a git log and a retro desktop.",
      "why": "Baseline. All three read from one data file, so later versions can remix the content freely.",
      "try": "Open the terminal and type grep drupal."
    },
    {
      "v": 1,
      "title": "The Learning Curve",
      "verdict": "kept",
      "featured": true,
      "note": "The front door became an experience: the career drawn as a climbing route, height = cumulative distinct skills. Drag the token (or thumb the rail, or use arrow keys) and a route card swaps job by job while a chalk bag fills with skills.",
      "why": "v0 asked visitors to pick a concept before learning anything. v1 shows name, current role, company, location and an Email button with zero interaction, and the signature interaction is on the first screen.",
      "try": "Drag the white token down the route. On a phone, slide along the rail under the card.",
      "date": "2026-11-22"
    },
    {
      "v": 2,
      "title": "Skills you can watch pile up",
      "verdict": "kept",
      "featured": true,
      "note": "Skills now fly off each hold into the chalk bag as you climb, and fly back when you descend. The bag's chalk level rises with them. Reaching the top fires a chalk puff and offers Email / Copy address.",
      "why": "In v1 the bag silently re-rendered, so the main idea (skills accumulate over a career) was easy to miss. Counts are verified exact at every hold.",
      "try": "Press Home on the token, then hold the up arrow and watch the chips land.",
      "date": "2026-11-22"
    },
    {
      "v": 3,
      "title": "Spotlight a skill, share the view",
      "verdict": "kept",
      "featured": true,
      "note": "Every skill chip (in the chalk bag and the rack) is now a filter: it dims the holds and résumé entries that didn't use it, says where it was used, and moves the token there. #skill=Drupal and #job=xgrok links reopen the same view.",
      "why": "Recruiters search by skill. v2 could show what was learned when, but not answer 'where did he use X?'. Now that takes one click, and the answer can be shared as a link.",
      "try": "Click Drupal in the chalk bag, then press Esc. Or open the site with #skill=COBOL at the end of the address.",
      "date": "2026-11-22"
    },
    {
      "v": 4,
      "title": "Patch Bay (alternate direction)",
      "verdict": "rejected",
      "featured": true,
      "note": "A completely different front door: a network patch panel. Drag a cable from a skill jack to a job jack; true pairs light up and the LED prints the matching bullet, wrong ones droop with NO CARRIER. Route all patches every real connection.",
      "why": "Tested whether a matching game beats climbing. It's tactile and the LED copy is fun, but it lost: the career's chronology and 'round two' story vanish, on phones the interaction falls below the fold, Route all becomes unreadable spaghetti, and fonts caused heavy layout shift (CLS 0.66).",
      "try": "Drag the PHP cable to mindAmp, then try COBOL into AgFirst. Hit Route all.",
      "date": "2026-11-22"
    },
    {
      "v": 5,
      "title": "Round two & the 99% send",
      "verdict": "kept",
      "featured": true,
      "note": "The wall now tells Samuel's two best stories: a dashed re-tie loop with a figure-eight knot links his two AgFirst stints (tap it to compare the skills from each), and a sun badge on the MARCO hold shows the homepage speed going from failing to 99%. The footer reports how fast this page itself became interactive.",
      "why": "Up to v4 the wall could have been anyone's timeline. These details come straight from the data (returning flag, highlight field) and make it specific. Also fixed the hero's layout shift (CLS 0.10 → 0) by keeping grid columns fixed and animating the chalk level with transforms.",
      "try": "Tap the ∞ knot near the top of the route. On desktop, click the yellow 99% badge.",
      "date": "2026-11-22"
    },
    {
      "v": 6,
      "title": "Scrub the register",
      "verdict": "kept",
      "featured": true,
      "note": "The version history moved onto the home page as an altitude strip. Drag across it (or use arrow keys, or tap on a phone) and a live, scaled preview of that version loads beside its note, with Open and Current best buttons.",
      "why": "Before, the register was a list of links on a separate page; you had to open a version blind. Now the site's evolution is part of the experience and every version can be previewed before opening. Previews load lazily and only after the scrub rests, so the page stays fast.",
      "try": "Scroll to Summit register and drag along the strip of bars.",
      "date": "2026-11-22"
    },
    {
      "v": 7,
      "title": "Pull a Print (alternate direction)",
      "verdict": "rejected",
      "featured": true,
      "note": "An editorial take: a two-ink risograph zine. Drag the squeegee (or press Space) to print the blue ink on the cover, nudge the misregistered layer back into place, then page through one spread per job: big year, role, bullets, sticker tags.",
      "why": "Tested whether a page-turning format reads better than an interactive wall. Each spread is lovely and easy to read, but it failed the core guardrail: current role and company are printed in the second ink, so recruiters don't see them until they pull. It also lost the skill spotlight and on-page history.",
      "try": "Drag the squeegee across the cover, then drag the blue layer until it snaps. Use ← → to flip pages.",
      "date": "2026-11-22"
    },
    {
      "v": 8,
      "title": "Phone-first: the curve on its side",
      "verdict": "kept",
      "featured": true,
      "note": "On phones the route now lies on its side as a full-width left-to-right learning curve (time across, skills up). Swipe it horizontally with one thumb to scrub; vertical swipes still scroll the page. The card grows to show every bullet, and the separate slider rail is gone.",
      "why": "v6 on a phone was a squeezed desktop grid: a narrow route column, clipped bullets and a separate rail to learn. Most shared links open on phones, so the phone layout got its own geometry built from the same data.",
      "try": "On a phone, swipe sideways along the curve. Then scroll down normally; the card won't budge.",
      "date": "2026-11-22"
    },
    {
      "v": 9,
      "title": "Pitches, borrowed from the zine",
      "verdict": "kept",
      "featured": false,
      "note": "The résumé section now uses the zine's pacing: one pitch per row with a huge outlined year, role and company on the left, bullets and clickable skill tags on the right. A sticky mini-route in the margin lights up the pitch you're reading and jumps on click. Printing gives a clean two-page résumé.",
      "why": "The old stack of bordered boxes was a chore to read. The losing v7 zine proved one-job-at-a-time pacing reads well, so that idea was carried into the winner. Print was verified by generating a PDF (7 → 2 pages).",
      "try": "Scroll through Route description and watch the margin route follow you. Press Ctrl+P.",
      "date": "2026-11-22"
    },
    {
      "v": 10,
      "title": "climb --help & belay check",
      "verdict": "kept",
      "featured": false,
      "note": "A developer layer: press ? (or the ? button) for a CLI-style 'climb --help' card listing every shortcut and deep link. Type belay anywhere to toggle a diagnostics overlay: the route's sampled points, each hold's capture zone, and a live FPS/position readout.",
      "why": "Keyboard shortcuts were scattered and undiscoverable, and developers had nothing to find beyond the wall. Both layers stay out of the recruiter path; the help uses a native modal dialog for focus trapping.",
      "try": "Press ? on a keyboard. Then close it and type belay.",
      "date": "2026-11-22"
    },
    {
      "v": 11,
      "title": "Pitch bar navigation",
      "verdict": "kept",
      "featured": true,
      "note": "Navigation became part of the page: phones get a bottom pitch bar (Wall · Résumé · Rack · Register · Contact) that lights the section you're in and jumps in one tap; desktop's header now indexes Résumé · Rack · Routes · Register with the current one underlined.",
      "why": "On a phone the Rack and Register were thousands of pixels down with no way to jump. Building it exposed a real bug present since v8: the hidden 'Slide to climb' label poked past the right edge on phones, silently widening the layout viewport so fixed bars slid partly off-screen. Fixed with overflow clipping.",
      "try": "On a phone, tap Rack in the bottom bar, then Wall.",
      "date": "2026-11-22"
    },
    {
      "v": 12,
      "title": "Compare any version with the summit",
      "verdict": "kept",
      "featured": false,
      "note": "The Summit Register page caught up with the home scrubber: drag along the altimeter to scrub, press [ and ] to hop between milestones, and tick 'Compare with current best' to see the selected version live beside today's site.",
      "why": "Version notes say what changed, but seeing two live versions side by side makes the change obvious. Previews load only once scrubbing rests.",
      "try": "Open the register, pick Patch Bay, tick Compare with current best.",
      "date": "2026-11-22"
    },
    {
      "v": 13,
      "title": "Night climb",
      "verdict": "kept",
      "featured": true,
      "note": "A second visual style: indigo night sky with faint stars and contours, glowing holds, and the cards kept as paper, like a lit guidebook. It follows your system's dark mode, flips with the ☾ button, and remembers your choice. On desktop a headlamp follows your pointer across the route.",
      "why": "The warm paper look was the only mode, and dark-mode visitors got a bright page at night. Night keeps the identity (same holds, same paper cards) while changing the mood. Text contrast measured 9.8–15.8:1.",
      "try": "Click ☾ in the header, then move your mouse over the route.",
      "date": "2026-11-22"
    },
    {
      "v": 14,
      "title": "Auto-belay (watch it climb)",
      "verdict": "kept",
      "featured": true,
      "note": "A hands-off way in: press Auto-belay and the token climbs from 2011 to now by itself, pausing on each pitch with a caption of what that job added ('2019 · AgFirst · +5 skills: Drupal, Twig…'). Pause and resume anytime; touching the wall yourself takes over. It never autoplays.",
      "why": "The wall rewarded people who poke at it. Passive visitors (or someone screen-sharing in an interview) saw a static card. The captions also surface each job's skill delta, which the drag alone doesn't say out loud.",
      "try": "Press Auto-belay at the top of the route and watch for ~25 seconds.",
      "date": "2026-11-22"
    },
    {
      "v": 15,
      "title": "Works offline",
      "verdict": "kept",
      "featured": false,
      "note": "After one visit, the site and its register load with no network at all, with a small 'you're offline' note. A tiny service worker caches the shell; everything is fetched fresh when online so a new deploy is never mixed with stale scripts.",
      "why": "The site tells a performance story (MARCO's homepage from failing to 99%), so it should practice one. Offline revisit verified by reloading with the network cut. Honest budget note: the home page's own HTML+CSS+JS is ~88KB uncompressed (~26KB gzipped), over the designer's 60KB uncompressed budget.",
      "try": "Visit once, turn on airplane mode, and reload.",
      "date": "2026-11-22"
    },
    {
      "v": 16,
      "title": "Weight diet (regression-tested)",
      "verdict": "kept",
      "featured": false,
      "note": "Housekeeping with proof: removed the v1 slider rail (hidden at every width since v8), folded the superseded phone rules into their final form, and re-ran every earlier interaction test (climb, chips, spotlight, knot, register scrub, phone swipe, help/belay, pitch bar, night, auto-belay, offline). All pass, CLS 0.",
      "why": "The page's own code had grown past the 60KB budget. Answering 'how much is cruft?' honestly: about 4% (88KB to 86381 bytes). The rest is real features, mostly the wall's JavaScript.",
      "try": "Nothing new to try. That's the point: everything still works with less code.",
      "date": "2026-11-22"
    },
    {
      "v": 17,
      "title": "One site, many rooms",
      "verdict": "kept",
      "featured": false,
      "note": "The terminal, git log and DoogOS modes now share a wayfinding bar in the Learning Curve style: a bold '← The wall' link home, the three modes (Alt+1/2/3 still work), and a Register link. It picks up your day/night choice.",
      "why": "Someone landing on /terminal/ from a shared link saw v0's dark pill with a tiny ⌂ and had little reason to think a main site existed. Now every room has an obvious door back, in the same visual language.",
      "try": "Open /terminal/ and use the bar at the bottom to get back to the wall.",
      "date": "2026-11-22"
    },
    {
      "v": 18,
      "title": "Share card",
      "verdict": "kept",
      "featured": true,
      "note": "Pasting the link into Slack, LinkedIn or a text now unfurls a branded card: name, current role, and the route art, rendered from the site's own data (tools/og-card.html). Also fixed the top hold's year label, which the token used to cover at rest.",
      "why": "For a résumé site the share preview is often the real first screen, and it was blank. Meta tags can't run JavaScript, so name and title appear there as text; everything else stays data-driven.",
      "try": "Paste the site URL into a chat app and look at the preview.",
      "date": "2026-11-22"
    },
    {
      "v": 19,
      "title": "Cockpit: Frame AUTODIDACT",
      "verdict": "kept",
      "featured": true,
      "note": "Complete redesign as an original walking-machine cockpit. The throttle moves through years, not distance: push it and each job arrives as a refit. The console prints INSTALLING: PHP · PostgreSQL … OK, new systems light up as contacts on the sensor scope, hardpoints light on the frame schematic, and the counters tick up. The pilot plate, current assignment and Hail (contact) are readable before you touch anything.",
      "why": "Samuel rejected the climbing metaphor: what he loves is learning new technologies. The cockpit makes 'each job installs new tech' the core mechanic, straight from the data (_new, _cum). Never an empty cockpit: 6 s with no input, a deep link, or reduced motion brings all systems online.",
      "try": "Drag the throttle on the right from the bottom up (on a phone, slide it sideways). Or focus it and press End.",
      "date": "2026-11-22"
    },
    {
      "v": 20,
      "title": "Target lock + cold start",
      "verdict": "kept",
      "featured": true,
      "note": "Type a system into LOCK (or click a contact, or any chip in the plain résumé): a reticle closes on it, the throttle lights every sortie that used it, and the legend lists them as jump buttons. #lock=Drupal links straight to it (old #skill= links still work). First visit per session, the cockpit powers up in about a second: lamp test, MFDs flicker on. Any key or tap skips it.",
      "why": "The cockpit lost v3's 'where did he use X?' answer, the most useful recruiter query. Scope labels also collided, so now only the current sortie's systems and the locked one are labelled.",
      "try": "Press / and type drup, then Enter. Press Esc to clear.",
      "date": "2026-11-22"
    },
    {
      "v": 21,
      "title": "Sensor Scope (alternate direction)",
      "verdict": "rejected",
      "featured": true,
      "note": "A completely different cockpit layout: one giant radar where the rings are years (centre 2011, edge today), jobs are big contacts on their start-year ring and each technology is a small contact where it was first installed. Tap anywhere to send a ping; the ripple lights contacts as it passes and locks the nearest. A slider filters to 'what was online by year X'.",
      "why": "Tested whether one spatial map beats the throttle and four panels. The ping is genuinely fun, but it lost: on phones only the name shows on the first screen (no role or company), the early-career contacts pile up at the centre, sector labels clip at the edge, and the 'each job installs new tech' story is much weaker than the throttle's install cascade.",
      "try": "Tap anywhere on the radar. Drag the 'Online by' slider back to 2014.",
      "date": "2026-11-22"
    },
    {
      "v": 22,
      "title": "Story refits",
      "verdict": "kept",
      "featured": true,
      "note": "Four sorties now get their own moment. COBOL flashes in as green-phosphor LEGACY FIRMWARE, still in service. xGrok's bullets decode from scrambled hex into text, a nod to reverse-engineering a database format. MARCO shows a TUNE gauge whose needle swings from the data's 'failing' to '99%'. Returning to AgFirst ghosts the old loadout on the frame, then re-docks with +N systems. Plus: tap empty space on the scope to send a ping that locks the nearest system.",
      "why": "Every sortie looked alike apart from its text, so the résumé's most distinctive facts slipped by. Each set piece is triggered by data (a legacy tag, a 'reverse-engineer' bullet, the highlight field, the returning flag), not hard-coded copy. The ping was borrowed from the rejected v21.",
      "try": "Press 3, then 4, then 7, then 8 on the keyboard to jump between those sorties.",
      "date": "2026-11-22"
    },
    {
      "v": 23,
      "title": "Sound, reference card, overdrive",
      "verdict": "kept",
      "featured": true,
      "note": "The cockpit can make noise, but only if you ask: the ♪ toggle (or M) turns on synthesized blips for notch ticks, install chirps, lock tones and the tune whoosh, and nothing audio-related exists until you opt in. Press ? for a laminated pilot reference card with every shortcut. And typing overdrive (or slamming the throttle end to end three times) overheats the frame: lamps flash red, a HEAT (just for fun) bar fills, then a coolant flush suggests learning something new.",
      "why": "The cockpit was silent and its shortcuts were invisible. Fun for developers, invisible to anyone who doesn't go looking: sound is off by default and remembered, the egg never blocks content.",
      "try": "Press ? for the card. Then type overdrive.",
      "date": "2026-11-22"
    },
    {
      "v": 24,
      "title": "Service Log & archived frames",
      "verdict": "kept",
      "featured": false,
      "note": "The rest of the site now lives in the cockpit too. The version history is the SERVICE LOG (every refit, ★ for commissioned milestones), archived versions carry an ARCHIVED FRAME strip with one-click 'Return to active frame', and the rooms' wayfinding bar is a cockpit bezel: ← Cockpit, the three rooms, Service Log.",
      "why": "Outside the home page the old climbing words and colours survived, so the redesign felt half-done. A grep for climbing terms across the live UI now finds only code comments.",
      "try": "Open the Service Log, pick any refit, open it, and hit Return to active frame.",
      "date": "2026-11-22"
    },
    {
      "v": 25,
      "title": "Hangar Refit (alternate direction)",
      "verdict": "rejected",
      "featured": true,
      "note": "A scroll-story take: you stand on the catwalk of a refit hangar. A work-order clipboard holds the name, role and Hail; each job is a numbered refit bay down the page, and as each bay scrolls into view its new systems drop onto the frame's line-art chassis as yellow crates. A crate rack lights every bay that used a system.",
      "why": "Tested whether plain scrolling beats the throttle. It reads well and needs nothing to learn, but it lost: it isn't a cockpit (the brief), it's passive (no throttle, lock links, sound or story set pieces), and on phones the sticky work order plus frame eat almost half the screen.",
      "try": "Scroll down the bays and watch crates land on the frame. On desktop, pick Drupal in the crate rack.",
      "date": "2026-11-22"
    },
    {
      "v": 26,
      "title": "Mission briefings + crate frame",
      "verdict": "kept",
      "featured": true,
      "note": "Any sortie can open as a full mission briefing (Briefing ▸ on the card, or Enter on the throttle): objective, theatre, intel and systems fitted, with previous/next and a shareable link (#sortie=xgrok&brief). On phones you can swipe the mission card left or right to step through sorties. The frame schematic now holds one crate per technology, filling green as you throttle up (the newest glow amber).",
      "why": "The mission card was dense and couldn't be shared on its own; phones had no natural way to step sorties; and six hardpoints didn't show accumulation. The crate idea came from the rejected v25 Hangar Refit.",
      "try": "Push the throttle to any sortie and press Enter (or tap Briefing ▸). On a phone, swipe the mission card.",
      "date": "2026-11-22"
    },
    {
      "v": 27,
      "title": "Pilot record (achievements)",
      "verdict": "kept",
      "featured": false,
      "note": "Exploring the cockpit now earns small, local-only achievements: First refit, Full systems, Decoder, Legacy certified, Tuned, Locked on, Briefed, Pilot's reference and Overdrive. A toast appears once for each, and the ★ Pilot record panel (brow on desktop, bottom bar on phones) lists what's earned and hints at what's left.",
      "why": "The set pieces, lock, briefings and easter egg were easy to miss and gave no acknowledgement. Achievements reward exploring without gating anything: the site is identical with zero earned, the autopilot earns nothing, and it's all stored only in the visitor's browser.",
      "try": "Push the throttle up one notch, then open ★ Pilot record.",
      "date": "2026-11-22"
    },
    {
      "v": 28,
      "title": "Controller linked",
      "verdict": "kept",
      "featured": false,
      "note": "Plug in a game controller and fly the cockpit: left stick or triggers drive the throttle, D-pad steps sorties, A opens the briefing, X locks the current sortie's first new system, B backs out, Start brings all systems online. A CONTROLLER LINKED lamp lights in the brow. Nothing polls until a controller announces itself.",
      "why": "Sim fans reach for a controller. It costs nothing for everyone else: no polling loop runs unless the browser reports a connected gamepad.",
      "try": "Connect a controller, press any button, then push the left stick up.",
      "date": "2026-11-22"
    },
    {
      "v": 29,
      "title": "Loadout screen",
      "verdict": "kept",
      "featured": false,
      "note": "Press L (or Loadout in the bottom bar) for the whole stack on one screen: every bay as a panel, every system with where it first arrived and how often it was used ('PHP · S04 · xGrok 2016 · used in 4'). Pick one to close the loadout and lock it on the sensors.",
      "why": "Systems were scattered across the scope, the frame and the plain résumé. Technical readers asking 'what's his full stack?' now get it in one view with provenance. Verified every skill in the data appears exactly once (35).",
      "try": "Press L, then pick COBOL.",
      "date": "2026-11-22"
    },
    {
      "v": 30,
      "title": "Hangar day",
      "verdict": "kept",
      "featured": true,
      "note": "A daylight cockpit: white MFDs, deep-cyan sensors, amber-brown readouts and a pale sky behind the canopy. It follows your system's light/dark setting, flips with the ☀/☾ button and remembers your choice. An automated audit checked every visible text element in both themes against WCAG AA: zero failures.",
      "why": "The cockpit was dark-only, so light-mode visitors and anyone reading in daylight got no choice. Also fixed a regression the new buttons caused: the pilot's name could be clipped at 1280px; now the lamps and subtitle give way first.",
      "try": "Click ☀ in the brow.",
      "date": "2026-11-22"
    },
    {
      "v": 31,
      "title": "Text Rain + drone escort",
      "verdict": "kept",
      "featured": true,
      "note": "The cockpit is gone: the site is now pure monospace text. On arrival every word rains down from above the screen, flickering through random glyphs until it locks into its exact place, while a swarm of tiny ▸ cursor drones swoops from a hive in the corner to escort each line down, then streaks home. Sections below the fold rain in when you scroll to them. Any key or click lands everything instantly.",
      "why": "Samuel asked for a pure-text site where all the text falls from the top into place, ushered by a drone swarm. The page text is real and laid out from the first frame (screen readers, copy, search and print all work); the rain is painted on a canvas overlay that hides each block only until its words land, so layout never shifts.",
      "try": "Reload and watch the name drop in. Then scroll down to Experience.",
      "date": "2026-11-22"
    },
    {
      "v": 32,
      "title": "The swarm comes alive",
      "verdict": "kept",
      "featured": true,
      "note": "After the rain, the drones don't just sleep. They flock loosely around your pointer; click any word and a squad of three dives in, lifts it, scrambles it through glyphs and drops it back into place; leave the page alone for 12 seconds and the whole swarm (reinforcements fly out of the hive) assembles into DOOG, scattering the moment you move.",
      "why": "The drone swarm was the most fun thing on the page but only appeared during the entrance. Now visitors can play with the text after it lands. All of it is decorative: the real text never changes, links still work normally, and reduced motion turns it off.",
      "try": "Move your mouse around, click a word, then leave the page alone for 12 seconds.",
      "date": "2026-11-22"
    },
    {
      "v": 33,
      "title": "Résumé REPL (alternate direction)",
      "verdict": "rejected",
      "featured": true,
      "note": "A conversational take: the home page is one prompt. whoami and jobs answer themselves on arrival; after that you type (or tap a suggestion) commands like find php, job xgrok or hail, and each answer rains into the scrollback.",
      "why": "Tested whether talking to the résumé beats a raining document. It works and the essentials show without typing, but it lost: job details hide behind commands, the big rain spectacle shrinks to small answers, the swarm has nothing to play with, typing is clumsy on phones, and it duplicates the existing Terminal room.",
      "try": "Tap find php, then type job mindamp.",
      "date": "2026-11-22"
    },
    {
      "v": 34,
      "title": "Type to find (swarm-assisted)",
      "verdict": "kept",
      "featured": true,
      "note": "Just start typing anywhere and a find line drops in under the header: every match on the page glows and the drone swarm splits up, one drone hovering over each match (reinforcements launch from the hive if needed). Enter jumps match to match, Esc clears. Phones get a [ find ] button. Links like #find=cobol open straight into a search.",
      "why": "The rejected REPL proved 'where did he use X?' is the most useful question, but commands were the wrong way to ask it. Now the whole document can be interrogated without leaving it. Matches are wrapped inline and unwrapped afterwards; the text is verified identical. Works under reduced motion too (no drones).",
      "try": "Type drupal. Press Enter a few times, then Esc.",
      "date": "2026-11-22"
    },
    {
      "v": 35,
      "title": "Channel switching",
      "verdict": "kept",
      "featured": false,
      "note": "Press 1–4 (or use the [1]home [2]exp [3]sys [4]contact index in the header) to jump between sections. The destination re-rains as you land, escorted by the swarm, and the index tracks where you are. ? opens a plain-text key map.",
      "why": "From the hero there was no quick way to reach Experience, Systems or Contact, and moving around had no rain moment. Digits no longer start a search (letters do), so the number keys are free for channels.",
      "try": "Press 3, then 1. Press ? for the key list.",
      "date": "2026-11-22"
    },
    {
      "v": 36,
      "title": "Cheap enough to keep",
      "verdict": "kept",
      "featured": false,
      "note": "A performance and accessibility pass. The animation loop now stops completely when nothing is moving (idle drones settle in the hive instead of orbiting forever: 240 → 0 frame requests per 4 idle seconds). Phones get a bottom section bar (1 home · 2 exp · 3 sys · 4 hail). All 86 visible text elements pass AA contrast; tab order runs index → find → hail → links.",
      "why": "The spectacle has to be cheap to keep: an always-running loop drains phone batteries. Measured with 4× CPU throttling: p95 frame 17 ms; one ~240 ms hitch (≈60 ms unthrottled) when several large sections are measured at once.",
      "try": "On a phone, use the bottom bar. On desktop, let the page sit: nothing keeps running.",
      "date": "2026-11-22"
    },
    {
      "v": 37,
      "title": "Drone carry",
      "verdict": "kept",
      "featured": true,
      "note": "The swarm now physically moves text. Experience has sort controls (newest · oldest · most learned): pick one and a squad of four drones latches onto each job's heading, lifts the whole block, swings it out across the page and sets it down in its new slot, job after job. The real list is reordered underneath, so what lands is the true order.",
      "why": "Samuel asked twice for drones that move the text around the screen, not just escort it. The carry engine measures every word before and after a DOM change and flies each one between the two positions, so it can animate any rearrangement.",
      "try": "Scroll to Experience and click oldest, then most learned.",
      "date": "2026-11-22"
    },
    {
      "v": 38,
      "title": "Swarm Board",
      "verdict": "kept",
      "featured": true,
      "note": "A second way to read the page: switch view to board and the swarm takes the document apart, carrying the identity, each job and the systems list into cards on a grid. Arrange the cards by timeline, by company or by most learned, or drag one onto another and a squad ferries it to that slot.",
      "why": "Cycle rule: try a substantially different direction. The board turns the résumé from a page you scroll into a table the drones rearrange, and drag-and-drop lets the visitor give the swarm orders.",
      "try": "On desktop, click view: board at top right, then by company, then drag any job card onto the first card.",
      "date": "2026-11-22"
    },
    {
      "v": 39,
      "title": "Recall",
      "verdict": "kept",
      "featured": false,
      "note": "A [ replay ] control (key 0) sends the swarm to haul every visible word back up off the top of the screen, bottom lines first, then rains the page down again with drones escorting each line.",
      "why": "The signature entrance only happened once per visit. Now visitors can rerun it on demand, and the lift-off is a new swarm move.",
      "try": "Press 0, or click [ replay ] in the header.",
      "date": "2026-11-22"
    },
    {
      "v": 40,
      "title": "Gather",
      "verdict": "kept",
      "featured": true,
      "note": "Type to search, then hit [ gather ]: the swarm pulls a copy of every matching line out of the page (rising from below if it's off-screen) and tows it into a stacked list under the find bar. Click any gathered line to jump to its source.",
      "why": "Find only highlighted matches in place, so you had to scroll to see them all. Now the drones bring the matches to you, which also answers the owner's 'drones moving text around the screen' brief.",
      "try": "Type php, then click [ gather ], then click a gathered line.",
      "date": "2026-11-22"
    },
    {
      "v": 41,
      "title": "Phosphor repaint",
      "verdict": "kept",
      "featured": true,
      "note": "Four colour schemes: green, amber, ice and paper (key 9 or the [ green ] button). Changing scheme is a swarm event: a line of drones sweeps down the screen and the new colours follow right behind it. The choice is remembered and applied before first paint, so there's no flash on the next visit.",
      "why": "The page had one fixed look and the drones were always green. Themes give visitors a choice, and the sweep makes changing colours another thing the swarm does.",
      "try": "Press 9 a few times, or click the colour name in the header.",
      "date": "2026-11-22"
    },
    {
      "v": 42,
      "title": "Dispatch",
      "verdict": "kept",
      "featured": false,
      "note": "Every skill in Systems is now a button. Click one (PHP, say) and the swarm carries the roles that used it to the top of Experience and tags each with '◆ used PHP here'. A note reports how many roles, and 'clear' sends everything back to newest-first.",
      "why": "It answers 'where did he use this?' in one click, and gives the carry engine a job that is about the content itself rather than just showing off.",
      "try": "Scroll to Systems and click PHP, then Drupal, then clear.",
      "date": "2026-11-22"
    },
    {
      "v": 43,
      "title": "Text changelog",
      "verdict": "kept",
      "featured": true,
      "note": "The version history now lives in the same text world as the site. The old cockpit-styled Service Log is now a monospace changelog: a bar strip with ★ milestones and the current version glowing, [kept]/[rejected] tags, live previews and compare-with-current, and log rows that drop into place. The bar shown on every archived version is a terminal strip with ◀ ▶ milestone steps and a one-tap [ back to current ↩ ]. The changelog follows the chosen phosphor colour scheme.",
      "why": "Jumping to the history used to leave the text world for a cockpit skin from an abandoned direction. Now the whole site is one place, and every timeline feature still works.",
      "try": "Open the changelog from the bottom-right link, press [ to jump between milestones, then open an archived version and tap back to current.",
      "date": "2026-11-22"
    },
    {
      "v": 44,
      "title": "Hive orders",
      "verdict": "kept",
      "featured": true,
      "note": "The swarm's resting hive (bottom right) is now a button. Tap it and the drones' order menu opens: replay the rain, form up and spell the handle, carry the jobs newest / oldest / most learned, rebuild as board or doc, change phosphor, all keys. The header is back to name, channels, find and hail. Every order now works on phones, by keyboard (arrow keys move, Esc closes and returns focus) and with reduced motion (motion-only orders are hidden).",
      "why": "The cycle review flagged a header full of bracketed controls and toys hidden behind hotkeys. Putting the orders on the swarm itself makes them easy to find and fits the idea that you are commanding the drones.",
      "try": "Click the swarm at bottom right, then choose 'form up', then 'carry jobs: oldest first'.",
      "date": "2026-11-22"
    },
    {
      "v": 45,
      "title": "Ambient rain",
      "verdict": "kept",
      "featured": true,
      "note": "Faint columns of glyphs now drift down behind the text all the time. They part around your pointer like water, drones flying through push them aside, and they're quieter behind the reading column so body text stays clear. The ambient rain follows the phosphor colour, is off in the paper theme and with reduced motion, and pauses after 20 s with no input or when the tab is hidden.",
      "why": "Between swarm actions the page was flat black, so the rain only existed while something was landing. Now the page feels alive at rest, and the contrast audit still passes.",
      "try": "Move the pointer slowly across the empty side margins and watch the columns part.",
      "date": "2026-11-22"
    },
    {
      "v": 46,
      "title": "Hail relay",
      "verdict": "kept",
      "featured": false,
      "note": "A [ copy ] button sits beside the email in the hero and in contact. It copies the address, and a squad of drones breaks the address into chunks and carries them off into the hive, where a '> copied' readout confirms it. With reduced motion you just get the readout. If copying fails, the readout says to long-press the address instead.",
      "why": "Getting in touch is the most important action on the page, and a bare mailto link often opens nothing useful. Copying is reliable, and the relay makes it memorable.",
      "try": "Click [ copy ] next to the email address at the top.",
      "date": "2026-11-22"
    },
    {
      "v": 47,
      "title": "Ship-shape",
      "verdict": "kept",
      "featured": false,
      "note": "Housekeeping so the site presents itself correctly. There's a new text-rain social card (og.png), so shared links show the current design: the name over faint glyph rain, the current role, a row of drones. The changelog page gets its own share tags. The README is rewritten for Text Rain, with a 'things to try' list, how the rain and carry engine work, the open content TODOs and the old files that can be deleted. The service-worker cache is bumped so returning visitors pick up the new assets. The regression tests are now portable (paths are relative to the repo).",
      "why": "Links still unfurled with the climbing-era card and the README described a design that no longer exists.",
      "try": "Paste the site link into Slack or iMessage after deploying to see the new card.",
      "date": "2026-11-22"
    },
    {
      "v": 48,
      "title": "Final polish",
      "verdict": "kept",
      "featured": false,
      "note": "A regression pass over every interaction from this run on desktop, phone and reduced motion: keyboard order, channels, find and gather, dispatch then sort, hive replay and phosphor, copy relay, contrast audit and print. Fixes from the pass: sort buttons now show no active sort while a skill dispatch is showing, and choosing a sort clears the dispatch; print gets a clean black-on-white palette and hides the hive, menus, toasts, copy and sort controls, and the hint.",
      "why": "Seventeen rounds of new interactions needed checking together before the run ends.",
      "try": "Click a skill in Systems, then choose a sort; or print the page.",
      "date": "2026-11-22"
    },
    {
      "v": 49,
      "title": "Swarm build",
      "verdict": "kept",
      "featured": true,
      "note": "The entrance now works the way swarm-intro does, rebuilt in our own code. On a fresh visit the drones huddle round a [ doog ] badge in the middle of the screen, then break off. Each drone claims an element, flies to its top-left corner and drags a dashed selection box to the bottom-right with a live 'W × H' size label, and that element's words then fall into the box. Sections further down build as you scroll to them; fast scrolling calls in extra drones (up to 56) and speeds up the build. Skip, Esc or any key finishes instantly; reduced motion shows the page with no animation.",
      "why": "Samuel asked for the swarm to use swarm-intro or our own version of it. Neither machine can download the package (GitHub and npm are blocked), so this is an independent implementation built on our falling-text engine. The README credits the original (MIT).",
      "try": "Open the site in a new tab (the full build plays once per session), then scroll fast.",
      "date": "2026-11-22"
    },
    {
      "v": 50,
      "title": "Motion switch",
      "verdict": "kept",
      "featured": true,
      "note": "Visitors whose device is set to reduce motion (on Windows: Animation effects turned off) used to get a completely still page, with no rain, drones or build. That's what Samuel saw. They now get a line under the summary saying animation is paused because of that setting, with [ play the swarm anyway ], and the choice is remembered. The hive menu has a 'motion' switch so anyone can turn the swarm on or off.",
      "why": "Samuel reported seeing no animation at all. Checked in his own browser: the page reports prefers-reduced-motion: reduce, so the site had deliberately switched every effect off. All our tests ran with motion allowed, so they never showed what he sees.",
      "try": "With reduced motion on, click [ play the swarm anyway ]; or open the swarm menu and choose 'motion'.",
      "date": "2026-11-22"
    },
    {
      "v": 51,
      "title": "Built by swarm-intro",
      "verdict": "kept",
      "featured": true,
      "note": "Every page load is now built by the real swarm-intro library (vendored unmodified as assets/swarm-intro.js). Cursors fly in and circle the 'doog' badge, then each one drags a selection box with a live size label over an element and types its text in. Sections further down build as you scroll to them, and fast scrolling calls in more cursors. When it's done, the site's own ▸ drones take over for sorting, gather, dispatch and the rest. The page is hidden from first paint until the intro starts, so there's no flash of finished text.",
      "why": "Samuel added the library to the project folder and asked for all text to be built with it from the moment the page loads.",
      "try": "Load the page (every load plays it), then scroll down while it's building.",
      "date": "2026-11-22"
    },
    {
      "v": 52,
      "title": "Tractor mode",
      "verdict": "kept",
      "featured": true,
      "note": "Swarm menu → 'tractor mode 🚜' (or key 8, or a link ending in #tractor). Every drone becomes a tractor and every line of text turns into grass. The tractors fan out and drive along each line, and the grass grows up right behind them. Grass sways, tractors kick up dust and turn to face the way they're driving. Lines further down are planted as you scroll to them. Click or tap any patch of grass and a tractor mows it, uncovering that line's text; [ mow everything ] sends the whole fleet; [ back to text ] returns to normal.",
      "why": "Samuel asked for a tractor mode where the swarm becomes tractors and all the text becomes grass they grow.",
      "try": "Press 8, watch the field get planted, then click your name to mow it.",
      "date": "2026-11-22"
    }
  ]
};

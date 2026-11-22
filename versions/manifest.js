/*
 * Version history shown on /timeline/ and in the bar on every snapshot.
 * One entry per evaluated round. featured marks the turning points.
 * verdict: baseline | kept | rejected | merged (partly folded into a later version)
 */
window.VERSIONS = {
  "current": 18,
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
    }
  ]
};

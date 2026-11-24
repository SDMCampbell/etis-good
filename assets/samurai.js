// Samurai mode: swarm-intro still moves the cursors and builds the page; this file turns each cursor into an
// animated stick-figure samurai and adds the sword moments the library has no hook for.
//
// Every frame each samurai's real on-screen velocity is read from the library's CSS transition, and its
// skeleton is posed to match how it is moving:
//   standing still  -> ready stance, hand on the hilt, breathing
//   moving sideways -> a ninja sprint: pitched far forward, arms swept straight back, legs striding with distance covered
//   moving up       -> levitating: upright, legs hanging, arms eased out, faint lift lines under the feet
//   moving down     -> a controlled descent in a crouched ready stance, hand on the hilt
//   building        -> an iaijutsu strike: crouches at the element's top-left corner, vanishes through it leaving a
//                      hairline cut, reappears at the bottom-right corner sheathing, and at the click the cut flares
//                      and the element appears. (Taking one apart after a click is a reverse slash instead.)
//   nothing to do   -> lines up down the right side of the screen, poised in a low iaijutsu stance: one hand on the
//                      hilt, the other on the scabbard, sword sheathed and ready to draw. If the mouse pointer comes near,
//                      it strikes: a flash as it draws, it vanishes into a cut straight across the pointer, then
//                      reappears poised in its place a moment later.
(function () {
  var SVGNS = "http://www.w3.org/2000/svg";
  // running is a full sprint: torso pitched far forward, both arms swept straight back
  var RUN = { lean: .95, aF: -1.3, eF: -.1, aB: -1.5, eB: -.08 };
  // joint angles: 0 = straight down, positive = forward (the way the samurai faces)
  var POSES = {
    idle: { lean: .05, tF: .22, kF: -.12, tB: -.22, kB: .08, aF: .7, eF: 1.3, aB: .15, eB: .3 },
    // rising: upright and still, legs hanging together with the toes down, arms eased slightly out from the body
    up:   { lean: 0, tF: .1, kF: -.18, tB: -.05, kB: -.12, aF: .5, eF: .2, aB: -.5, eB: -.2 },
    // dropping: a controlled descent in a crouched ready stance, hand on the hilt, the other arm out for balance
    down: { lean: .18, tF: .9, kF: -1.55, tB: -.3, kB: -.85, aF: .75, eF: 1.25, aB: -.75, eB: .35 },
    // iaijutsu ready: low wide stance, leaning in, drawing hand on the hilt, the other gripping the scabbard at the hip
    iai: { lean: .26, tF: .85, kF: -.95, tB: -.7, kB: .3, aF: .55, eF: 1.3, aB: .05, eB: 1.45 },   // building: the strike, from the same stance
    meditate: { lean: .26, tF: .85, kF: -.95, tB: -.7, kB: .3, aF: .55, eF: 1.3, aB: .05, eB: 1.45 },
    slash: { lean: .45, tF: 1.0, kF: -.6, tB: -.85, kB: .15, aF: 1.45, eF: .05, aB: 1.35, eB: .1 }
  };
  function dir(p, a, l) { return [p[0] + Math.sin(a) * l, p[1] + Math.cos(a) * l]; }
  // two-bone IK: the elbow for an arm from shoulder s to hand h (segment lengths a, b), bending outward/down
  function ik(s, h, a, b, side) {
    var dx = h[0] - s[0], dy = h[1] - s[1], d = Math.min(a + b - .01, Math.hypot(dx, dy)) || .01;
    var x = (a * a - b * b + d * d) / (2 * d), y = Math.sqrt(Math.max(0, a * a - x * x)), ux = dx / Math.hypot(dx, dy), uy = dy / Math.hypot(dx, dy);
    return [s[0] + ux * x - uy * y * side, s[1] + uy * x + ux * y * side];
  }
  // The iaijutsu strike at the pointer, after real iai and anime's "invisible cut" (ms from the start):
  //   0-crouch   sink into iai-goshi, the low crouch, while the thumb breaks the scabbard's seal (koiguchi no kirikata):
  //              the sword pushes forward, a sliver of blade gleams, the drawing elbow drives forward
  //   crouch-draw  hold, coiled
  //   draw-back  gone: the draw (nukitsuke) is too fast to see; a thin, still cut line hangs across the pointer
  //   back-zan   back in place, low, blade out (zanshin)
  //   zan-sheathed  noto: the blade slides home slowly as the samurai rises back to its poised stance
  //   sheathed   the click; only now does the cut across the pointer flare and fall apart
  var IAI = { crouch: 240, draw: 330, back: 640, zan: 740, sheathed: 1220 };
  var IAIGOSHI = { lean: .5, tF: 1.2, kF: -.45, tB: -.85, kB: -.3, aF: .55, eF: 1.3, aB: .05, eB: 1.45 };
  function smooth(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }
  // how far into the crouch (0-1), and how far the blade is out of the scabbard, t ms into a strike
  function crouchAt(t) { return t < IAI.crouch ? smooth(t / IAI.crouch) : t < IAI.zan ? 1 : t < IAI.sheathed ? 1 - smooth((t - IAI.zan) / (IAI.sheathed - IAI.zan)) : 0; }
  function bladeOutAt(t) {
    if (t < IAI.crouch) return 2.6 * smooth(t / IAI.crouch);                                  // the seal breaks
    if (t < IAI.draw) return 2.6 + 1.4 * (t - IAI.crouch) / (IAI.draw - IAI.crouch);          // coiled, creeping out
    if (t < IAI.back) return 0;                                                                // (gone)
    if (t < IAI.zan) return 7;
    if (t < IAI.sheathed) return 7 * (1 - smooth((t - IAI.zan) / (IAI.sheathed - IAI.zan)));  // slowly home
    return 0;
  }
  function lerp(cur, tgt, k) { for (var key in tgt) cur[key] += (tgt[key] - cur[key]) * k; }

  function makeSprite(cursor) {
    var svg = document.createElementNS(SVGNS, "svg");
    svg.setAttribute("class", "sam"); svg.setAttribute("viewBox", "-26 -40 52 46"); svg.setAttribute("aria-hidden", "true");
    var g = document.createElementNS(SVGNS, "g");
    function el(tag, attrs) { var e = document.createElementNS(SVGNS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); g.appendChild(e); return e; }
    var parts = {
      saya: el("path", { "stroke-width": 2, opacity: .85 }),                   // the scabbard
      body: el("path", { "stroke-width": 2.2 }),                   // torso, legs, arms
      blade: el("path", { "stroke-width": 1.5 }),
      head: el("circle", { r: 3.4, "stroke-width": 2 }),
      knot: el("path", { "stroke-width": 1.6 }),                   // topknot
      aura: el("path", { "stroke-width": 1, opacity: .45 }),       // faint lift lines under the feet when rising
      gleam: el("path", { "stroke-width": 1.3, class: "gleam" })   // bare blade showing at the scabbard mouth (iaijutsu draw / sheathing)
    };
    svg.appendChild(g); cursor.appendChild(svg);
    return { g: g, p: parts, pose: JSON.parse(JSON.stringify(POSES.idle)), phase: 0, face: 1, x: null, y: null, vx: 0, vy: 0, slashT: 0, state: "idle", ox: 0, oy: 0, ovx: 0, ovy: 0, recoil: 0, lastClash: 0 };
  }

  function render(s, now) {
    var P = s.pose, st = s.state, run = st === "run", drop = 0;
    // mid-strike, blend the poised stance into the low iai-goshi crouch
    if ((st === "meditate" || st === "iai") && s.iaiT && now - s.iaiT < IAI.sheathed) {
      var cr = crouchAt(now - s.iaiT), B = {};
      for (var key in P) B[key] = P[key] + ((IAIGOSHI[key] !== undefined ? IAIGOSHI[key] : P[key]) - P[key]) * cr;
      P = B; drop = 3.2 * cr;
    }
    // a running stride is driven by the distance covered, so faster samurai take quicker steps
    if (run) {
      var ph = s.phase, sw = Math.sin(ph);
      P.tF = .25 + sw * 1.0; P.kF = -(1 + Math.cos(ph)) * .8; P.tB = .25 - sw * 1.0; P.kB = -(1 - Math.cos(ph)) * .8;
    }
    var bob = st === "meditate" || st === "iai" ? -3.2 + Math.sin(now / 1100) * .3 : run ? Math.abs(Math.cos(s.phase)) * 1.4 + 1.5 : st === "idle" ? Math.sin(now / 420) * .5 : st === "up" ? -2 + Math.sin(now / 260) * 1 : st === "down" ? 3 : 0;
    var hip = [0, -14 - bob + drop];
    var neck = dir(hip, Math.PI - P.lean, 11);          // lean > 0 tips the torso forward
    var kF = dir(hip, P.tF, 7), fF = dir(kF, P.tF + P.kF, 7.2), kB = dir(hip, P.tB, 7), fB = dir(kB, P.tB + P.kB, 7.2);
    var shoulder = dir(neck, P.lean, 1), eF = dir(shoulder, P.aF, 5.5), hF = dir(eF, P.aF + P.eF, 5.5), eB = dir(shoulder, P.aB, 5.5), hB = dir(eB, P.aB + P.eB, 5.5);
    function seg() { return "M" + [].map.call(arguments, function (q) { return q[0].toFixed(1) + " " + q[1].toFixed(1); }).join(" L"); }
    s.p.body.setAttribute("d", seg(hip, neck) + seg(hip, kF, fF) + seg(hip, kB, fB) + seg(shoulder, eF, hF) + seg(shoulder, eB, hB));
    var head = dir(neck, Math.PI - P.lean, 4.2);
    s.p.head.setAttribute("cx", head[0].toFixed(1)); s.p.head.setAttribute("cy", head[1].toFixed(1));
    s.p.knot.setAttribute("d", seg(dir(head, Math.PI - P.lean + .6, 3.2), dir(head, Math.PI - P.lean + 1.3, 6)));
    // scabbard sits on the hip, angled back; the hilt pokes forward to where the hand rests
    var sHip = [hip[0] + 1, hip[1] - 1], sTip = dir(sHip, -1.05 - P.lean * .55, 12), hilt = dir(sHip, 2.1, 4);
    if (st === "meditate" || st === "iai") {
      // sheathed katana at the hip, hilt forward and a little up, scabbard running back past the hip: the
      // drawing hand is on the hilt, the other hand grips the scabbard mouth. Both arms reach their grips by IK.
      var sa = Math.PI - 1.2 - P.lean * .3;                           // sword direction: forward, ~20° above level
      var sd = [Math.sin(sa), Math.cos(sa)], guard = [hip[0] + 4.5, hip[1] - 2.5], tail = [guard[0] - sd[0] * 19, guard[1] - sd[1] * 19];
      // A strike at the pointer (s.iaiT): first the draw begins, the elbow pushing forward and the hilt coming a few px out
      // of the scabbard so a sliver of blade gleams at its mouth; then the samurai is gone (see below); then it's back with
      // the blade part-way out, sliding it home.
      var t = s.iaiT ? now - s.iaiT : 1e9, out = bladeOutAt(t);
      var hilt = [guard[0] + sd[0] * out, guard[1] + sd[1] * out];      // where the guard (tsuba) is now
      var grip = [hilt[0] + sd[0] * 2.6, hilt[1] + sd[1] * 2.6], mouth = [guard[0] - sd[0] * 2.4, guard[1] - sd[1] * 2.4];
      var eGrip = ik(shoulder, grip, 5.5, 5.5, 1), eMouth = ik(shoulder, mouth, 5.5, 5.5, 1);
      if (out > 0) { var push = Math.min(out, 4) * .8; eGrip = [eGrip[0] + sd[0] * push, eGrip[1] + sd[1] * push - push * .3]; }   // the elbow drives forward
      s.p.body.setAttribute("d", seg(hip, neck) + seg(hip, kF, fF) + seg(hip, kB, fB) + seg(shoulder, eGrip, grip) + seg(shoulder, eMouth, mouth));
      s.p.saya.setAttribute("d", seg(guard, tail) + seg([hilt[0] - sd[1] * 1.8, hilt[1] + sd[0] * 1.8], [hilt[0] + sd[1] * 1.8, hilt[1] - sd[0] * 1.8]));
      s.p.blade.setAttribute("d", seg(hilt, [hilt[0] + sd[0] * 4, hilt[1] + sd[1] * 4]));     // the grip, ahead of the guard (tsuba)
      var g = out > .2 ? seg(guard, hilt) : "";
      if (t >= IAI.sheathed && t < IAI.sheathed + 120) {                 // home: a last glint at the scabbard mouth
        var r = 2.2 * (1 - (t - IAI.sheathed) / 120); g = seg([guard[0] - r, guard[1]], [guard[0] + r, guard[1]]) + seg([guard[0], guard[1] - r], [guard[0], guard[1] + r]);
      }
      s.p.gleam.setAttribute("d", g);
    } else if (st === "slash") {
      s.p.gleam.setAttribute("d", "");
      // the draw: the blade sweeps from over the shoulder down through the cut in the first ~220 ms
      var k = Math.min(1, (now - s.slashT) / 220), a = -2.4 + k * 3.7;
      s.p.saya.setAttribute("d", seg(sHip, sTip));
      s.p.blade.setAttribute("d", seg(hF, dir(hF, a, 17)));
    } else {
      s.p.gleam.setAttribute("d", "");
      s.p.saya.setAttribute("d", seg(hilt, sHip, sTip));
      s.p.blade.setAttribute("d", "");
    }
    if (st === "up") {
      var t = (now / 300) % 1, l = 4 + t * 5;
      s.p.aura.setAttribute("d", seg([fF[0] - 2, fF[1] + 2 + t * 4], [fF[0] - 2, fF[1] + 2 + t * 4 + l]) + seg([fB[0] + 2, fB[1] + 4 + ((t + .5) % 1) * 4], [fB[0] + 2, fB[1] + 4 + ((t + .5) % 1) * 4 + l]));
      s.p.aura.setAttribute("opacity", (.5 * (1 - t)).toFixed(2));
    } else s.p.aura.setAttribute("d", "");
    // mid-strike the samurai is gone: it's in the cut across the pointer
    var gone = s.iaiT && now - s.iaiT > IAI.draw && now - s.iaiT < IAI.back;
    if (gone !== s.hidden) { s.hidden = gone; s.g.setAttribute("opacity", gone ? 0 : 1); }
    s.g.setAttribute("transform", "translate(" + s.ox.toFixed(1) + " " + s.oy.toFixed(1) + ") scale(" + s.face + " 1)");
  }

  window.samuraiMode = function () {
    var root = document.documentElement; root.classList.add("samurai");
    var sprites = new Map(), raf = 0, last = performance.now();
    function posOf(c) {
      var m = getComputedStyle(c).transform, v = /matrix\(([^)]+)\)/.exec(m);
      if (!v) return null; v = v[1].split(","); return [+v[4], +v[5]];
    }
    function tick(now) {
      raf = 0;
      var dt = Math.max(1, now - last); last = now;
      document.querySelectorAll(".swarm-intro-cursor").forEach(function (c) {
        var s = sprites.get(c); if (!s) { s = makeSprite(c); sprites.set(c, s); }
        var p = posOf(c); if (!p) return;
        if (s.x !== null) {
          var vx = (p[0] - s.x) / dt, vy = (p[1] - s.y) / dt;
          s.vx += (vx - s.vx) * .35; s.vy += (vy - s.vy) * .35;               // smoothed px per ms
          s.phase += Math.abs(p[0] - s.x) * .22 + Math.abs(p[1] - s.y) * .08;
        }
        s.x = p[0]; s.y = p[1];
        var speed = Math.hypot(s.vx, s.vy), prev = s.state;
        // an iaijutsu strike at the pointer (started by the idle behaviour, which sets data-iai): vanish, cut, reappear
        if (c.dataset.iai && c.dataset.iai !== s.iaiSeen) { s.iaiSeen = c.dataset.iai; s.iaiT = now; iai(s, +c.dataset.ix, +c.dataset.iy); }
        // building with a strike: the library's build steps ("aim" at the corner, "drag" through, "reveal") drive it
        var stp = c.dataset.step || "";
        if (stp !== s.step) {
          var was = s.step; s.step = stp;
          if (stp === "aim") s.iaiT = now;                                  // crouch and break the seal
          if (stp === "drag" && c._iaiBox) s.cutLine = buildCut(c._iaiBox, "iai-line", 1600);
          if (stp === "reveal") s.iaiT = now - IAI.back;                    // back, low, then sheathing
          if (!stp && was === "reveal" && s.lastBox) { if (s.cutLine) s.cutLine.remove(); buildCut(s.lastBox, "iai-cut"); }   // the click
        }
        if (c._iaiBox) s.lastBox = c._iaiBox;
        if (stp === "drag") s.iaiT = now - IAI.draw - 1;                   // gone for however long the dash takes
        if (c.classList.contains("slash")) s.state = "slash";
        else if (stp && c._iaiBox) s.state = "iai";
        else if (speed < .04 && c.dataset.rest && now - c.dataset.rest < 500) s.state = "meditate";
        else if (speed < .04) s.state = "idle";
        else if (Math.abs(s.vx) >= Math.abs(s.vy) * .7) s.state = "run";
        else s.state = s.vy < 0 ? "up" : "down";
        if (c.dataset.pose !== s.state) c.dataset.pose = s.state;   // how the figure is posed right now (data-state says what it's doing)
        if (s.state === "slash" && prev !== "slash") s.slashT = now;
        if (s.state !== "slash" && Math.abs(s.vx) > .03) s.face = s.vx > 0 ? 1 : -1;
        if (s.state === "slash") s.face = c.classList.contains("rev") ? -1 : 1;   // cuts run to the bottom-right; un-cuts back to the top-left
        if (s.state === "meditate") s.face = -1;                            // facing in towards the page
        if (s.state === "iai") s.face = 1;                                  // the strike runs to the bottom-right
        if (s.state === "run") lerp(s.pose, RUN, .3);
        else lerp(s.pose, POSES[s.state], s.state === "slash" ? .45 : .22);
        if (now < s.recoil) { s.pose.lean += (-.45 - s.pose.lean) * .5; s.pose.aB += (-1.2 - s.pose.aB) * .5; }   // knocked back by a clash
      });
      collide(now, dt, document.querySelector(".swarm-intro-world"));
      sprites.forEach(function (s, c) { if (!c.isConnected) sprites.delete(c); else render(s, now); });
      if (document.querySelector(".swarm-intro-cursor")) raf = requestAnimationFrame(tick);
    }
    // collisions: swarm-intro decides where every cursor goes, so the samurai can't change their real routes.
    // Instead each figure carries a small offset from its cursor: overlapping figures are shoved apart, a fast
    // meeting is a clash (a spark, and both are knocked back), and the offset springs back to zero afterwards.
    var R = 15;
    function collide(now, dt, world) {
      var list = []; sprites.forEach(function (s) { if (s.x !== null) list.push(s); });
      for (var i = 0; i < list.length; i++) for (var j = i + 1; j < list.length; j++) {
        var a = list[i], b = list[j];
        var dx = (b.x + b.ox) - (a.x + a.ox), dy = (b.y + b.oy) - (a.y + a.oy), d = Math.hypot(dx, dy);
        if (d >= R * 2 || d < .01) { if (d < .01) { a.ox -= .5; b.ox += .5; } continue; }
        var nx = dx / d, ny = dy / d, push = (R * 2 - d) / 2;
        var aFixed = a.state === "slash" || a.state === "iai", bFixed = b.state === "slash" || b.state === "iai";      // a samurai mid-cut holds its line
        if (!aFixed) { a.ox -= nx * push * (bFixed ? 2 : 1); a.oy -= ny * push * (bFixed ? 2 : 1); }
        if (!bFixed) { b.ox += nx * push * (aFixed ? 2 : 1); b.oy += ny * push * (aFixed ? 2 : 1); }
        var closing = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;               // how fast they're running into each other
        if (closing > .4 && now - a.lastClash > 1100 && now - b.lastClash > 1100) {
          a.lastClash = b.lastClash = now;
          var kick = Math.min(4, closing * 6);
          if (!aFixed) { a.ovx -= nx * kick; a.ovy -= ny * kick; a.recoil = now + 220; }
          if (!bFixed) { b.ovx += nx * kick; b.ovy += ny * kick; b.recoil = now + 220; }
          if (world) spark(world, a.x + a.ox + dx / 2, a.y + a.oy + dy / 2 - 22);
        }
      }
      var k = Math.min(1, dt / 16);
      list.forEach(function (s) {                                            // knockback drifts, then springs home
        s.ox += s.ovx * k; s.oy += s.ovy * k; s.ovx *= Math.pow(.82, k); s.ovy *= Math.pow(.82, k);
        s.ox -= s.ox * .06 * k; s.oy -= s.oy * .06 * k;
        if (s.state === "slash" || s.state === "iai") { s.ox *= .6; s.oy *= .6; }
      });
    }
    function spark(world, x, y) {
      var e = document.createElement("div"); e.className = "sam-clash";
      e.style.left = x + "px"; e.style.top = y + "px";
      e.innerHTML = '<svg viewBox="-10 -10 20 20"><path d="M0 -9 L0 -3 M0 3 L0 9 M-9 0 L-3 0 M3 0 L9 0 M-6 -6 L-2.5 -2.5 M2.5 2.5 L6 6 M6 -6 L2.5 -2.5 M-2.5 2.5 L-6 6"/></svg>';
      world.appendChild(e); setTimeout(function () { e.remove(); }, 380);
    }
    // The strike: a glint where the samurai stands as it draws, a faint streak along its path, and a bright cut straight
    // through the pointer, angled along the line of the attack; the figure is hidden until it reappears (see render)
    function iai(s, x, y) {
      var w = document.querySelector(".swarm-intro-world"); if (!w) return;
      var sx = s.x + s.ox, sy = s.y + s.oy - 18, dx = x - sx, dy = y - sy, len = Math.hypot(dx, dy) || 1, ang = Math.atan2(dy, dx) * 180 / Math.PI;
      function fx(cls, cx, cy, width, angle, delay, hold) {
        var e = document.createElement("div"); e.className = cls;
        e.style.left = cx + "px"; e.style.top = cy + "px"; if (width) e.style.width = width + "px";
        if (angle !== undefined) e.style.setProperty("--a", angle + "deg");
        if (delay) e.style.animationDelay = delay + "ms";
        if (hold) e.style.animationDuration = hold + "ms";
        w.appendChild(e); setTimeout(function () { e.remove(); }, 800 + (delay || 0) + (hold || 0));
      }
      var cutA = ang + (Math.random() < .5 ? 24 : -24);                  // the cut runs slightly across the line of attack
      fx("iai-glint", sx, sy + 3, 0, undefined, IAI.draw - 20);          // the vanishing draw
      fx("iai-path", sx + dx / 2, sy + dy / 2, len, ang, IAI.draw);      // the dash
      fx("iai-line", x, y, 150, cutA, IAI.draw + 30, IAI.sheathed - IAI.draw);   // a hairline, hanging still until...
      fx("iai-cut", x, y, 150, cutA, IAI.sheathed);                      // ...the click: the cut flares and falls apart
    }

    // a cut across an element being built, along the box's diagonal (the samurai's path from corner to corner)
    function buildCut(box, cls, hold) {
      var w = document.querySelector(".swarm-intro-world"); if (!w) return null;
      var l = parseFloat(box.style.left), t = parseFloat(box.style.top), bw = +box.dataset.w || 0, bh = +box.dataset.h || 0;
      var e = document.createElement("div"); e.className = cls;
      e.style.left = (l + bw / 2) + "px"; e.style.top = (t + bh / 2) + "px"; e.style.width = (Math.hypot(bw, bh) + 24) + "px";
      e.style.setProperty("--a", Math.atan2(bh, bw) * 180 / Math.PI + "deg");
      if (hold) e.style.animationDuration = hold + "ms";
      w.appendChild(e); setTimeout(function () { e.remove(); }, (hold || 0) + 700);
      return e;
    }

    function wake() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); } }

    // the library moves a cursor on before our observer runs, so remember where each one has just been sent
    var trail = new Map();
    function note(c, tf) { var m = /translate\(([-\d.]+)px,\s*([-\d.]+)px\)/.exec(tf || ""); if (!m) return; var a = trail.get(c) || []; a.push([+m[1], +m[2]]); if (a.length > 4) a.shift(); trail.set(c, a); }
    function cursorAt(x, y) {
      var best = null, bd = 3;
      trail.forEach(function (pts, c) { pts.forEach(function (p) { var d = Math.hypot(p[0] - x, p[1] - y); if (d < bd) { bd = d; best = c; } }); });
      return best;
    }
    function cut(el) {
      if (!el.animate) return;
      el.animate([
        { filter: "brightness(2.6) drop-shadow(0 0 6px #C8F7C5)", transform: "translate(-3px, 1px)" },
        { filter: "brightness(1)", transform: "translate(1px, 0)" },
        { filter: "none", transform: "none" }
      ], { duration: 320, easing: "cubic-bezier(.2,.9,.3,1)" });
    }
    new MutationObserver(function (list) {
      list.forEach(function (m) {
        if (m.type === "attributes" && m.attributeName === "style" && m.target.classList.contains("swarm-intro-cursor")) { note(m.target, m.oldValue); note(m.target, m.target.style.transform); }
      });
      list.forEach(function (m) {
        if (m.type === "childList") {
          m.addedNodes.forEach(function (n) {
            if (n.nodeType !== 1) return;
            if (n.classList.contains("swarm-intro-cursor")) wake();
            if (n.classList.contains("swarm-intro-box")) {
              // the box opens where its cursor was standing: that samurai draws and cuts
              var c = n._cursor || cursorAt(parseFloat(n.style.left), parseFloat(n.style.top));
              // taking an element apart is a reverse slash; building is the strike (driven by data-step, above)
              if (c && n.classList.contains("is-unbuild")) { c.classList.add("slash", "rev"); n._samurai = c; }
              else if (c) { c._iaiBox = n; n._samurai = c; }
            }
          });
          m.removedNodes.forEach(function (n) { if (n.nodeType === 1 && n.classList && n.classList.contains("swarm-intro-cursor")) trail.delete(n); });
        } else if (m.attributeName === "class") {
          var t = m.target;
          if (t.classList.contains("swarm-intro-box") && t.classList.contains("is-done") && t._samurai) { t._samurai.classList.remove("slash", "rev"); if (t._samurai._iaiBox === t) t._samurai._iaiBox = null; t._samurai = null; }   // sword back in its sheath
        } else if (m.attributeName === "data-swarm-intro-pending" && !m.target.hasAttribute("data-swarm-intro-pending")) cut(m.target);
      });
    }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeOldValue: true, attributeFilter: ["class", "style", "data-swarm-intro-pending"] });
    wake();
  };
})();

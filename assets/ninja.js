// Ninja mode: swarm-intro still moves the cursors and builds the page; this file turns each cursor into an
// animated stick-figure ninja (an original design: a masked head with a glinting eye slit, a red headband whose
// tails stream out behind, and a short sword slung across the back) who throws shuriken to pin each element into place.
//
// Each frame a ninja's real on-screen velocity picks its pose:
//   still           -> a low ready crouch
//   moving sideways -> a deep-leaning sprint, arms pumping; at speed it leaves fading afterimages behind it
//   moving up       -> a tucked somersault, spinning as it rises
//   moving down     -> a drop, legs ready for the landing, arms up and out, headband tails streaming up
//   building        -> a crouched throwing stance, snapping shuriken into the selection box one after another
//   idle            -> vanishes in a puff of smoke and lurks at the edge of the screen, almost invisible but for its eyes:
//                      flat against a side wall with its back to it, gripping the wall behind, or crouched along the bottom.
//                      If the pointer comes near, it vanishes again at once.
// Overlapping ninjas shove apart; a fast meeting knocks both back with a spark.
(function () {
  var SVGNS = "http://www.w3.org/2000/svg", TAU = Math.PI * 2, K = .7;    // K: ninjas are drawn at 70% of the other figures' size
  // joint angles: 0 = straight down, positive = forward (the way the ninja faces)
  var POSES = {
    idle:  { lean: .25, tF: .55, kF: -.9, tB: -.35, kB: -.5, aF: .9, eF: .9, aB: -.4, eB: .6 },
    run:   { lean: .62, tF: 0, kF: -.5, tB: 0, kB: -.5, aF: 0, eF: 1.2, aB: 0, eB: 1.2 },          // legs and arms driven by the stride
    up:    { lean: .1, tF: 1.7, kF: -2.5, tB: 1.4, kB: -2.4, aF: 1.4, eF: 1.3, aB: 1.1, eB: 1.5 },   // tucked for the flip
    down:  { lean: .12, tF: .35, kF: -.3, tB: -.3, kB: -.05, aF: 2.0, eF: .25, aB: -2.0, eB: -.25 },
    throw: { lean: .3, tF: .75, kF: -1.0, tB: -.6, kB: -.25, aF: 1.6, eF: 0, aB: 1.1, eB: 1.6 },
    lurk:  { lean: .5, tF: 1.05, kF: -2.1, tB: .25, kB: -1.7, aF: .7, eF: 1.5, aB: -.15, eB: .9 },
    wall:  { lean: -.12, tF: .08, kF: -.05, tB: .5, kB: -2.2, aF: -1.25, eF: -.2, aB: -2.1, eB: .35 }   // back to the wall, hands gripping it behind, one foot up against it
  };
  function dir(p, a, l) { return [p[0] + Math.sin(a) * l, p[1] + Math.cos(a) * l]; }
  function add(p, v, k) { return [p[0] + v[0] * k, p[1] + v[1] * k]; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function lerp(cur, tgt, k) { for (var key in tgt) cur[key] += (tgt[key] - cur[key]) * k; }
  function f1(q) { return q[0].toFixed(1) + " " + q[1].toFixed(1); }
  function seg() { return "M" + [].map.call(arguments, f1).join(" L"); }
  var STAR = '<svg viewBox="-6 -6 12 12"><path d="M0 -5.5 L1.3 -1.3 L5.5 0 L1.3 1.3 L0 5.5 L-1.3 1.3 L-5.5 0 L-1.3 -1.3 Z"/><circle r="1.1"/></svg>';

  function makeSprite(cursor) {
    var svg = document.createElementNS(SVGNS, "svg");
    svg.setAttribute("class", "ninja"); svg.setAttribute("viewBox", "-26 -40 52 46"); svg.setAttribute("aria-hidden", "true");
    var g = document.createElementNS(SVGNS, "g"), shade = document.createElementNS(SVGNS, "g");
    g.appendChild(shade);
    function el(tag, attrs, parent) { var e = document.createElementNS(SVGNS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); (parent || shade).appendChild(e); return e; }
    var parts = {
      tails: el("path", { class: "band", "stroke-width": 1.5 }),    // headband tails
      sword: el("path", { "stroke-width": 1.8 }),                   // short sword slung across the back
      body: el("path", { "stroke-width": 2.4 }),
      head: el("circle", { r: 3.3, class: "mask" }),
      band: el("path", { class: "band", "stroke-width": 1.3 }),
      eye: el("path", { class: "eye", "stroke-width": 1.1 }, g)     // outside the shade group: still glints while lurking
    };
    svg.appendChild(g); cursor.appendChild(svg);
    return { svg: svg, g: g, shade: shade, p: parts, pose: JSON.parse(JSON.stringify(POSES.idle)), face: 1, x: null, y: null, vx: 0, vy: 0,
      state: "idle", phase: 0, spin: 0, ox: 0, oy: 0, ovx: 0, ovy: 0, recoil: 0, lastClash: 0, throwT: 0, ghostT: 0, hand: [0, -20], fade: 1 };
  }

  function render(s, now) {
    var P = s.pose, st = s.state;
    var up = [Math.sin(P.lean), -Math.cos(P.lean)], fwd = [Math.cos(P.lean), Math.sin(P.lean)];
    // the legs first, from a hip at the origin, so the whole figure can be set down with its lowest foot on the ground
    var o = [0, 0], kF = dir(o, P.tF, 6.5), fF = dir(kF, P.tF + P.kF, 6.5), kB = dir(o, P.tB, 6.5), fB = dir(kB, P.tB + P.kB, 6.5);
    var lift = st === "up" ? 12 : st === "down" ? 5 : st === "run" ? Math.abs(Math.sin(s.phase)) * 1.5 : 0;
    var dy = -Math.max(fF[1], fB[1], 1) - lift;
    function at(q) { return [q[0], q[1] + dy]; }
    var hip = at(o); kF = at(kF); fF = at(fF); kB = at(kB); fB = at(fB);
    var neck = add(hip, up, 10), sh = add(neck, up, -1.2), head = add(neck, up, 3.6);
    if (st === "throw" && s.target) {
      // the throwing arm snaps from cocked-back to pointing at the target with every shuriken
      var aim = Math.atan2(s.target[0] - sh[0], s.target[1] - sh[1]), k = clamp((now - s.throwT) / 110, 0, 1);
      P.aF = aim - (1 - k) * 1.9; P.eF = (1 - k) * 1.2;
    }
    var eF = dir(sh, P.aF, 5.3), hF = dir(eF, P.aF + P.eF, 5.3), eB = dir(sh, P.aB, 5.3), hB = dir(eB, P.aB + P.eB, 5.3);
    s.hand = hF;
    s.p.body.setAttribute("d", seg(hip, neck) + seg(hip, kF, fF) + seg(hip, kB, fB) + seg(sh, eF, hF) + seg(sh, eB, hB));
    s.p.head.setAttribute("cx", head[0].toFixed(1)); s.p.head.setAttribute("cy", head[1].toFixed(1));
    var eyeC = add(add(head, up, .5), fwd, 1.2);
    s.p.eye.setAttribute("d", seg(add(eyeC, fwd, -.9), add(eyeC, fwd, 2.1)));
    // headband around the brow, knotted at the back; its tails stream away from the direction of travel
    var brow = add(head, up, 1.6), knot = add(brow, fwd, -3.1);
    s.p.band.setAttribute("d", seg(add(brow, fwd, 3.2), knot));
    var speed = Math.hypot(s.vx, s.vy), L = 6 + Math.min(9, speed * 12);
    var tvx = -s.vx * s.face * 12 - 4, tvy = -s.vy * 12 + 2.5, tl = Math.hypot(tvx, tvy) || 1;
    var td = [tvx / tl, tvy / tl], tn = [-td[1], td[0]], w = Math.sin(now / 90) * (1 + Math.min(2, speed * 3));
    var t1 = add(add(knot, td, L), tn, w), t2 = add(add(knot, td, L * .8), tn, -w + 2.2);
    s.p.tails.setAttribute("d", "M" + f1(knot) + " Q" + f1(add(add(knot, td, L * .5), tn, -w * .6)) + " " + f1(t1) +
      " M" + f1(knot) + " Q" + f1(add(add(knot, td, L * .45), tn, w * .6 + 1)) + " " + f1(t2));
    // the short sword: slung diagonally across the back, hilt up behind the shoulder
    var sw0 = add(add(hip, fwd, 1.5), up, 1.5), sw1 = add(add(neck, fwd, -5.5), up, 3.5), sd = [sw1[0] - sw0[0], sw1[1] - sw0[1]], sl = Math.hypot(sd[0], sd[1]) || 1;
    var guard = add(sw0, sd, .72), gn = [-sd[1] / sl, sd[0] / sl];
    s.p.sword.setAttribute("d", seg(sw0, sw1) + seg(add(guard, gn, 1.6), add(guard, gn, -1.6)));
    // lurking: the figure all but disappears into the dark; only the eyes are left
    s.fade += ((st === "lurk" || st === "wall" ? .16 : 1) - s.fade) * .08;
    s.shade.setAttribute("opacity", s.fade.toFixed(2));
    // the flip: spin forward around the middle of the body while rising, and settle upright otherwise
    var c = add(hip, up, 3);
    s.g.setAttribute("transform", "translate(" + s.ox.toFixed(1) + " " + s.oy.toFixed(1) + ") scale(" + (s.face * K).toFixed(2) + " " + K + ") rotate(" + (s.spin * 180 / Math.PI).toFixed(1) + " " + f1(c) + ")");
  }

  // opts.scoped: animate only cursors with data-kind="ninja" (the Swarm Wars page runs every mode at once);
  // otherwise this is the page's one mode and every cursor is a ninja
  window.ninjaMode = function (opts) {
    var SEL = opts && opts.scoped ? '.swarm-intro-cursor[data-kind="ninja"]' : null;
    function mine(c) { return !SEL || !!(c && c.matches && c.matches(SEL)); }
    var root = document.documentElement; if (!SEL) root.classList.add("ninja");
    var sprites = new Map(), raf = 0, last = performance.now();
    function posOf(c) {
      var v = /matrix\(([^)]+)\)/.exec(getComputedStyle(c).transform);
      if (!v) return null; v = v[1].split(","); return [+v[4], +v[5]];
    }
    function world() { return document.querySelector(".swarm-intro-world"); }
    function tick(now) {
      raf = 0;
      var dt = Math.max(1, now - last); last = now;
      document.querySelectorAll(SEL || ".swarm-intro-cursor").forEach(function (c) {
        var s = sprites.get(c); if (!s) { s = makeSprite(c); sprites.set(c, s); }
        var p = posOf(c); if (!p) return;
        if (s.x !== null) {
          var jump = Math.hypot(p[0] - s.x, p[1] - s.y);
          if (jump > 70 && dt < 120) { smoke(s.x + s.ox, s.y + s.oy); smoke(p[0], p[1]); s.vx = s.vy = 0; s.x = p[0]; s.y = p[1]; }   // vanished and reappeared
          var vx = (p[0] - s.x) / dt, vy = (p[1] - s.y) / dt;
          s.vx += (vx - s.vx) * .35; s.vy += (vy - s.vy) * .35;
          s.phase += Math.abs(p[0] - s.x) * .2 + Math.abs(p[1] - s.y) * .06;
        }
        s.x = p[0]; s.y = p[1];
        var speed = Math.hypot(s.vx, s.vy), prev = s.state;
        // a zap (set by a page: data-zap, aimed at data-zx / data-zy): one shuriken thrown at that point
        var zapping = !c._box && c.dataset.zap && now - c.dataset.zap < 260;
        if (c._box || zapping) s.state = "throw";
        else if (speed < .05 && c.dataset.rest && now - c.dataset.rest < 500) s.state = c.dataset.wall ? "wall" : "lurk";
        else if (speed < .04) s.state = "idle";
        else if (Math.abs(s.vx) >= Math.abs(s.vy) * .7) s.state = "run";
        else s.state = s.vy < 0 ? "up" : "down";
        if (c.dataset.pose !== s.state) c.dataset.pose = s.state;   // how the figure is posed right now (data-state says what it's doing)
        if (s.state === "throw" && !c._box) {
          var zx = +c.dataset.zx, zy = +c.dataset.zy;
          s.face = zx >= s.x ? 1 : -1;
          s.target = [(zx - s.x - s.ox) * s.face / K, (zy - s.y - s.oy) / K];
          if (c.dataset.zap !== s.zapSeen) {
            s.zapSeen = c.dataset.zap; s.throwT = now;
            throwStar([s.x + s.ox + s.hand[0] * s.face * K, s.y + s.oy + s.hand[1] * K], [zx, zy]);
          }
        } else if (s.state === "throw") {
          var b = c._box, bl = parseFloat(b.style.left), bt = parseFloat(b.style.top), bw = parseFloat(b.style.width) || 0, bh = parseFloat(b.style.height) || 0;
          s.face = bl + bw / 2 >= s.x ? 1 : -1;
          s.target = [(bl + bw / 2 - s.x - s.ox) * s.face / K, (bt + bh / 2 - s.y - s.oy) / K];      // in the sprite's own (flipped, scaled) frame
          if (prev !== "throw" || now - s.throwT > 170) {            // another shuriken, into the open part of the box
            s.throwT = now;
            var from = [s.x + s.ox + s.hand[0] * s.face * K, s.y + s.oy + s.hand[1] * K];
            throwStar(from, [bl + bw * (.35 + Math.random() * .65), bt + bh * Math.random()]);
          }
        } else {
          s.target = null;
          if (s.state === "lurk" || s.state === "wall") s.face = c.dataset.face ? +c.dataset.face : s.face;
          else if (Math.abs(s.vx) > .03) s.face = s.vx > 0 ? 1 : -1;
        }
        lerp(s.pose, POSES[s.state], s.state === "throw" ? .45 : .22);
        if (s.state === "run") {                                    // the stride: legs scissor, arms pump against them
          var ph = s.phase, cyc = { tF: .15 + Math.sin(ph), kF: -.25 - 1.2 * Math.max(0, Math.cos(ph)), tB: .15 - Math.sin(ph), kB: -.25 - 1.2 * Math.max(0, -Math.cos(ph)), aF: -Math.sin(ph) * .9, aB: Math.sin(ph) * .9 };
          lerp(s.pose, cyc, .5);
          if (speed > .45 && now - s.ghostT > 55) { s.ghostT = now; ghost(s); }
        }
        if (s.state === "up") s.spin += dt * .016;                  // about one somersault every 400 ms
        else { s.spin %= TAU; s.spin += ((s.spin > Math.PI ? TAU : 0) - s.spin) * .25; if (Math.abs(s.spin) < .01 || Math.abs(s.spin - TAU) < .01) s.spin = 0; }
        if (now < s.recoil) { s.pose.lean += (-.4 - s.pose.lean) * .5; }
      });
      collide(now, dt, world());
      sprites.forEach(function (s, c) { if (!c.isConnected) sprites.delete(c); else render(s, now); });
      if (document.querySelector(SEL || ".swarm-intro-cursor")) raf = requestAnimationFrame(tick);
    }
    function wake() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); } }

    // effects, all added to swarm-intro's world layer so they scroll with the page
    function throwStar(from, to) {
      var w = world(); if (!w) return;
      var e = document.createElement("div"); e.className = "nj-star"; e.innerHTML = STAR;
      e.style.left = from[0] + "px"; e.style.top = from[1] + "px"; w.appendChild(e);
      var dx = to[0] - from[0], dy = to[1] - from[1];
      e.animate([{ transform: "translate(0,0) rotate(0deg)" }, { transform: "translate(" + dx + "px," + dy + "px) rotate(900deg)" }],
        { duration: 160 + Math.min(140, Math.hypot(dx, dy) * .25), easing: "cubic-bezier(.3,.6,.4,1)", fill: "forwards" })
        .finished.then(function () { e.classList.add("stuck"); setTimeout(function () { e.remove(); }, 450); }, function () { e.remove(); });
    }
    function smoke(x, y) {
      var w = world(); if (!w) return;
      var e = document.createElement("div"); e.className = "nj-smoke"; e.style.left = x + "px"; e.style.top = (y - 10) + "px";
      e.innerHTML = "<i></i><i></i><i></i><i></i><i></i>"; w.appendChild(e);
      setTimeout(function () { e.remove(); }, 650);
    }
    function ghost(s) {
      var w = world(); if (!w) return;
      var e = document.createElement("div"); e.className = "nj-ghost"; e.style.left = s.x + "px"; e.style.top = s.y + "px"; e.dataset.kind = "ninja"; if (s.svg.parentNode && s.svg.parentNode.dataset.side) e.dataset.side = s.svg.parentNode.dataset.side;
      var copy = s.svg.cloneNode(true); copy.querySelector("g").setAttribute("transform", s.g.getAttribute("transform"));
      e.appendChild(copy); w.appendChild(e);
      setTimeout(function () { e.remove(); }, 300);
    }

    // collisions (as in the other modes): a springy offset from the cursor, since swarm-intro owns the real routes
    var R = 10;
    function collide(now, dt, w) {
      var list = []; sprites.forEach(function (s) { if (s.x !== null) list.push(s); });
      for (var i = 0; i < list.length; i++) for (var j = i + 1; j < list.length; j++) {
        var a = list[i], b = list[j];
        var dx = (b.x + b.ox) - (a.x + a.ox), dy = (b.y + b.oy) - (a.y + a.oy), d = Math.hypot(dx, dy);
        if (d >= R * 2 || d < .01) { if (d < .01) { a.ox -= .5; b.ox += .5; } continue; }
        var nx = dx / d, ny = dy / d, push = (R * 2 - d) / 2;
        var aFixed = a.state === "throw", bFixed = b.state === "throw";
        if (!aFixed) { a.ox -= nx * push * (bFixed ? 2 : 1); a.oy -= ny * push * (bFixed ? 2 : 1); }
        if (!bFixed) { b.ox += nx * push * (aFixed ? 2 : 1); b.oy += ny * push * (aFixed ? 2 : 1); }
        var closing = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
        if (closing > .4 && now - a.lastClash > 1100 && now - b.lastClash > 1100) {
          a.lastClash = b.lastClash = now;
          var kick = Math.min(4, closing * 6);
          if (!aFixed) { a.ovx -= nx * kick; a.ovy -= ny * kick; a.recoil = now + 220; }
          if (!bFixed) { b.ovx += nx * kick; b.ovy += ny * kick; b.recoil = now + 220; }
          if (w) spark(w, a.x + a.ox + dx / 2, a.y + a.oy + dy / 2 - 14);
        }
      }
      var k = Math.min(1, dt / 16);
      list.forEach(function (s) {
        s.ox += s.ovx * k; s.oy += s.ovy * k; s.ovx *= Math.pow(.82, k); s.ovy *= Math.pow(.82, k);
        s.ox -= s.ox * .06 * k; s.oy -= s.oy * .06 * k;
        if (s.state === "throw") { s.ox *= .6; s.oy *= .6; }
      });
    }
    function spark(w, x, y) {
      var e = document.createElement("div"); e.className = "sam-clash";
      e.style.left = x + "px"; e.style.top = y + "px";
      e.innerHTML = '<svg viewBox="-10 -10 20 20"><path d="M0 -9 L0 -3 M0 3 L0 9 M-9 0 L-3 0 M3 0 L9 0 M-6 -6 L-2.5 -2.5 M2.5 2.5 L6 6 M6 -6 L2.5 -2.5 M-2.5 2.5 L-6 6"/></svg>';
      w.appendChild(e); setTimeout(function () { e.remove(); }, 380);
    }
    // pinned in place: the element lands with a sharp little shake
    function thunk(el) {
      if (!el.animate) return;
      el.animate([
        { filter: "brightness(2.2)", transform: "translate(3px, 0)" },
        { filter: "brightness(1.4)", transform: "translate(-2px, 0)" },
        { filter: "brightness(1.1)", transform: "translate(1px, 0)" },
        { filter: "none", transform: "none" }
      ], { duration: 260, easing: "linear" });
    }

    // which ninja is building which element: the library names the box's cursor (or it opens where one has just been sent)
    var trail = new Map();
    function note(c, tf) { var m = /translate\(([-\d.]+)px,\s*([-\d.]+)px\)/.exec(tf || ""); if (!m) return; var a = trail.get(c) || []; a.push([+m[1], +m[2]]); if (a.length > 4) a.shift(); trail.set(c, a); }
    function cursorAt(x, y) {
      var best = null, bd = 3;
      trail.forEach(function (pts, c) { pts.forEach(function (p) { var d = Math.hypot(p[0] - x, p[1] - y); if (d < bd) { bd = d; best = c; } }); });
      return best;
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
              var c = n._cursor || cursorAt(parseFloat(n.style.left), parseFloat(n.style.top));
              if (!mine(c)) c = null;
              if (c) { c._box = n; n._ninja = c; }
            }
          });
          m.removedNodes.forEach(function (n) { if (n.nodeType === 1 && n.classList && n.classList.contains("swarm-intro-cursor")) trail.delete(n); });
        } else if (m.attributeName === "class") {
          var t = m.target;
          if (t.classList.contains("swarm-intro-box") && t.classList.contains("is-done") && t._ninja) { t._ninja._box = null; t._ninja = null; }
        } else if (m.attributeName === "data-swarm-intro-pending" && !m.target.hasAttribute("data-swarm-intro-pending") && (!SEL || mine(m.target._by))) thunk(m.target);
      });
    }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeOldValue: true, attributeFilter: ["class", "style", "data-swarm-intro-pending"] });
    wake();
  };
})();

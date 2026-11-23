// Robot mode: swarm-intro still moves the cursors and builds the page; this file turns each cursor into an
// animated stick-figure robot in a jet-powered suit (an original design) that blasts each element into existence.
//
// Each frame a robot's real on-screen velocity picks its pose:
//   hovering        -> standing on boot jets just off the ground, a slow bob
//   moving sideways -> boosting: stays upright with a slight forward lean, boot and back boosters angled back to push it along
//   moving up       -> rising: upright, arms down and slightly out, palm and boot jets firing downward
//   moving down     -> a powered descent: knees bent, boot jets braking, arms out for balance
//   building        -> braces, aims a palm at the element and fires a beam until it's built
// Overlapping robots shove apart; a fast meeting knocks both back with a spark.
(function () {
  var SVGNS = "http://www.w3.org/2000/svg";
  // joint angles: 0 = straight down, positive = forward (the way the robot faces)
  var POSES = {
    idle:  { lean: 0, tF: .14, kF: -.15, tB: -.14, kB: -.1, aF: .35, eF: .45, aB: -.25, eB: .3 },
    fly:   { lean: .28, tF: -.12, kF: .25, tB: -.42, kB: .2, aF: -.35, eF: .25, aB: -.55, eB: .2 },
    up:    { lean: 0, tF: .05, kF: 0, tB: -.05, kB: 0, aF: .4, eF: -.1, aB: -.4, eB: .1 },
    down:  { lean: .06, tF: .6, kF: -1.0, tB: -.25, kB: -.55, aF: .75, eF: .3, aB: -.65, eB: -.2 },
    blast: { lean: -.12, tF: .5, kF: -.3, tB: -.6, kB: .2, aF: 1.5, eF: 0, aB: .9, eB: 1.2 }
  };
  function dir(p, a, l) { return [p[0] + Math.sin(a) * l, p[1] + Math.cos(a) * l]; }
  function add(p, v, k) { return [p[0] + v[0] * k, p[1] + v[1] * k]; }
  function lerp(cur, tgt, k) { for (var key in tgt) cur[key] += (tgt[key] - cur[key]) * k; }
  function seg() { return "M" + [].map.call(arguments, function (q) { return q[0].toFixed(1) + " " + q[1].toFixed(1); }).join(" L"); }

  function makeSprite(cursor) {
    var svg = document.createElementNS(SVGNS, "svg");
    svg.setAttribute("class", "robot"); svg.setAttribute("viewBox", "-26 -40 52 46"); svg.setAttribute("aria-hidden", "true");
    var g = document.createElementNS(SVGNS, "g");
    function el(tag, attrs) { var e = document.createElementNS(SVGNS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); g.appendChild(e); return e; }
    var parts = {
      flame: el("path", { class: "jet" }),                         // all jet flames, one path
      beam: el("path", { class: "beam" }),
      pack: el("path", { "stroke-width": 3.2 }),                   // thruster pack on the back
      body: el("path", { "stroke-width": 2.4 }),                   // limbs
      chest: el("path", { "stroke-width": 1.6, class: "plate" }),
      head: el("path", { "stroke-width": 1.6, class: "plate" }),
      visor: el("path", { "stroke-width": 1.3, class: "slit" }),
      core: el("circle", { r: 0, class: "beam" })                  // muzzle flash / impact
    };
    svg.appendChild(g); cursor.appendChild(svg);
    return { g: g, p: parts, pose: JSON.parse(JSON.stringify(POSES.idle)), face: 1, x: null, y: null, vx: 0, vy: 0,
      state: "idle", ox: 0, oy: 0, ovx: 0, ovy: 0, recoil: 0, lastClash: 0, blastT: 0 };
  }

  // a flickering jet flame from point p, pointing along angle a
  function flame(p, a, len, w) {
    len *= .75 + Math.random() * .5;
    var tip = dir(p, a, len), l = dir(p, a + Math.PI / 2, w / 2), r = dir(p, a - Math.PI / 2, w / 2), mid = dir(p, a, len * .45);
    return "M" + l[0].toFixed(1) + " " + l[1].toFixed(1) + " Q" + dir(mid, a + Math.PI / 2, w * .35).map(function (v) { return v.toFixed(1); }).join(" ") + " " + tip[0].toFixed(1) + " " + tip[1].toFixed(1) +
      " Q" + dir(mid, a - Math.PI / 2, w * .35).map(function (v) { return v.toFixed(1); }).join(" ") + " " + r[0].toFixed(1) + " " + r[1].toFixed(1) + " Z";
  }

  function render(s, now) {
    var P = s.pose, st = s.state;
    var hover = st === "idle" ? 4 + Math.sin(now / 380) * 1.2 : st === "up" ? 5 : st === "down" ? 3 : st === "fly" ? 5 : 0;
    var hip = [0, -14 - hover];
    var up = [Math.sin(P.lean), -Math.cos(P.lean)], fwd = [Math.cos(P.lean), Math.sin(P.lean)];
    var neck = add(hip, up, 11);
    var kF = dir(hip, P.tF, 7), fF = dir(kF, P.tF + P.kF, 7), kB = dir(hip, P.tB, 7), fB = dir(kB, P.tB + P.kB, 7);
    var sh = add(neck, up, -1.5);
    // aiming: while blasting, the front arm points straight at the element being built
    if (st === "blast" && s.target) {
      var aim = Math.atan2(s.target[0] - sh[0], s.target[1] - sh[1]);
      P.aF = aim; P.eF = 0;
    }
    var eF = dir(sh, P.aF, 5.5), hF = dir(eF, P.aF + P.eF, 5.5), eB = dir(sh, P.aB, 5.5), hB = dir(eB, P.aB + P.eB, 5.5);
    s.p.body.setAttribute("d", seg(hip, kF, fF) + seg(hip, kB, fB) + seg(sh, eF, hF) + seg(sh, eB, hB));
    // armour: a tapered chest plate, a squared helmet with a visor slit, a thruster pack on the back
    s.p.chest.setAttribute("d", seg(add(neck, fwd, 4), add(neck, fwd, -4), add(hip, fwd, -2.2), add(hip, fwd, 2.2)) + " Z");
    var hc = add(neck, up, 4.2), hu = [up[0] * 2.9, up[1] * 2.9], hf = [fwd[0] * 3.1, fwd[1] * 3.1];
    s.p.head.setAttribute("d", seg(add(add(hc, hu, 1), hf, 1), add(add(hc, hu, 1), hf, -1), add(add(hc, hu, -1), hf, -1), add(add(hc, hu, -1), hf, 1)) + " Z");
    s.p.visor.setAttribute("d", seg(add(add(hc, up, .5), fwd, .2), add(add(hc, up, .5), fwd, 2.4)));
    var packTop = add(add(neck, fwd, -5), up, -1.5), packBot = add(add(neck, fwd, -5), up, -7);
    s.p.pack.setAttribute("d", seg(packTop, packBot));
    // jets: boots always fire (hover/brake/lift/thrust); the pack and palms join in by state
    var f = "", shinF = P.tF + P.kF, shinB = P.tB + P.kB;
    var bootLen = st === "fly" ? 10 : st === "up" ? 11 : st === "down" ? 6 : 4, bootW = st === "fly" || st === "up" ? 3.4 : 2.6;
    if (st === "fly") { f += flame(fF, -.75, bootLen, bootW) + flame(fB, -.8, bootLen, bootW); }       // boosters angled back to drive it forward
    else if (st !== "blast") { f += flame(fF, shinF, bootLen, bootW) + flame(fB, shinB, bootLen, bootW); }
    else f += flame(fF, shinF, 3, 2.2) + flame(fB, shinB, 3, 2.2);
    if (st === "fly") f += flame(packBot, -.95, 13, 4) + flame(hB, -1.0, 5, 2);
    if (st === "up") f += flame(hF, 0, 6, 2.2) + flame(hB, 0, 6, 2.2);
    s.p.flame.setAttribute("d", f);
    // the beam: from the palm to the middle of the element, with a flare at both ends
    if (st === "blast" && s.target) {
      var k = Math.min(1, (now - s.blastT) / 90), end = add(hF, [s.target[0] - hF[0], s.target[1] - hF[1]], k);
      var jit = function () { return (Math.random() - .5) * 1.4; };
      s.p.beam.setAttribute("d", seg(hF, [end[0] + jit(), end[1] + jit()]));
      s.p.core.setAttribute("cx", end[0].toFixed(1)); s.p.core.setAttribute("cy", end[1].toFixed(1)); s.p.core.setAttribute("r", (3 + Math.random() * 3).toFixed(1));
    } else { s.p.beam.setAttribute("d", ""); s.p.core.setAttribute("r", 0); }
    s.g.setAttribute("transform", "translate(" + s.ox.toFixed(1) + " " + s.oy.toFixed(1) + ") scale(" + s.face + " 1)");
  }

  window.robotMode = function () {
    var root = document.documentElement; root.classList.add("robot");
    var sprites = new Map(), raf = 0, last = performance.now();
    function posOf(c) {
      var v = /matrix\(([^)]+)\)/.exec(getComputedStyle(c).transform);
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
          s.vx += (vx - s.vx) * .35; s.vy += (vy - s.vy) * .35;
        }
        s.x = p[0]; s.y = p[1];
        var speed = Math.hypot(s.vx, s.vy), prev = s.state;
        if (c._box) s.state = "blast";
        else if (speed < .04) s.state = "idle";
        else if (Math.abs(s.vx) >= Math.abs(s.vy) * .7) s.state = "fly";
        else s.state = s.vy < 0 ? "up" : "down";
        if (s.state === "blast") {
          if (prev !== "blast") s.blastT = now;
          var b = c._box, bx = parseFloat(b.style.left) + (parseFloat(b.style.width) || 0) / 2, by = parseFloat(b.style.top) + (parseFloat(b.style.height) || 0) / 2;
          s.face = bx >= s.x ? 1 : -1;
          s.target = [(bx - s.x - s.ox) * s.face, by - s.y - s.oy];          // in the sprite's own (flipped) frame
        } else { s.target = null; if (Math.abs(s.vx) > .03) s.face = s.vx > 0 ? 1 : -1; }
        lerp(s.pose, POSES[s.state], s.state === "blast" ? .45 : .2);
        if (now < s.recoil) { s.pose.lean += (-.5 - s.pose.lean) * .5; }   // knocked back by a collision
      });
      collide(now, dt, document.querySelector(".swarm-intro-world"));
      sprites.forEach(function (s, c) { if (!c.isConnected) sprites.delete(c); else render(s, now); });
      if (document.querySelector(".swarm-intro-cursor")) raf = requestAnimationFrame(tick);
    }
    function wake() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); } }

    // collisions (as in samurai mode): figures carry a springy offset from their cursor, since swarm-intro owns
    // the real routes. Overlaps shove apart; a fast meeting knocks both back with a spark.
    var R = 15;
    function collide(now, dt, world) {
      var list = []; sprites.forEach(function (s) { if (s.x !== null) list.push(s); });
      for (var i = 0; i < list.length; i++) for (var j = i + 1; j < list.length; j++) {
        var a = list[i], b = list[j];
        var dx = (b.x + b.ox) - (a.x + a.ox), dy = (b.y + b.oy) - (a.y + a.oy), d = Math.hypot(dx, dy);
        if (d >= R * 2 || d < .01) { if (d < .01) { a.ox -= .5; b.ox += .5; } continue; }
        var nx = dx / d, ny = dy / d, push = (R * 2 - d) / 2;
        var aFixed = a.state === "blast", bFixed = b.state === "blast";      // a robot that's firing holds its ground
        if (!aFixed) { a.ox -= nx * push * (bFixed ? 2 : 1); a.oy -= ny * push * (bFixed ? 2 : 1); }
        if (!bFixed) { b.ox += nx * push * (aFixed ? 2 : 1); b.oy += ny * push * (aFixed ? 2 : 1); }
        var closing = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
        if (closing > .4 && now - a.lastClash > 1100 && now - b.lastClash > 1100) {
          a.lastClash = b.lastClash = now;
          var kick = Math.min(4, closing * 6);
          if (!aFixed) { a.ovx -= nx * kick; a.ovy -= ny * kick; a.recoil = now + 220; }
          if (!bFixed) { b.ovx += nx * kick; b.ovy += ny * kick; b.recoil = now + 220; }
          if (world) spark(world, a.x + a.ox + dx / 2, a.y + a.oy + dy / 2 - 22);
        }
      }
      var k = Math.min(1, dt / 16);
      list.forEach(function (s) {
        s.ox += s.ovx * k; s.oy += s.ovy * k; s.ovx *= Math.pow(.82, k); s.ovy *= Math.pow(.82, k);
        s.ox -= s.ox * .06 * k; s.oy -= s.oy * .06 * k;
        if (s.state === "blast") { s.ox *= .6; s.oy *= .6; }
      });
    }
    function spark(world, x, y) {
      var e = document.createElement("div"); e.className = "sam-clash";
      e.style.left = x + "px"; e.style.top = y + "px";
      e.innerHTML = '<svg viewBox="-10 -10 20 20"><path d="M0 -9 L0 -3 M0 3 L0 9 M-9 0 L-3 0 M3 0 L9 0 M-6 -6 L-2.5 -2.5 M2.5 2.5 L6 6 M6 -6 L2.5 -2.5 M-2.5 2.5 L-6 6"/></svg>';
      world.appendChild(e); setTimeout(function () { e.remove(); }, 380);
    }

    // which robot is building which element: the library opens a box where its cursor has just been sent
    var trail = new Map();
    function note(c, tf) { var m = /translate\(([-\d.]+)px,\s*([-\d.]+)px\)/.exec(tf || ""); if (!m) return; var a = trail.get(c) || []; a.push([+m[1], +m[2]]); if (a.length > 4) a.shift(); trail.set(c, a); }
    function cursorAt(x, y) {
      var best = null, bd = 3;
      trail.forEach(function (pts, c) { pts.forEach(function (p) { var d = Math.hypot(p[0] - x, p[1] - y); if (d < bd) { bd = d; best = c; } }); });
      return best;
    }
    function blasted(el) {
      if (!el.animate) return;
      el.animate([
        { filter: "brightness(3) blur(1.5px)", transform: "scale(1.02) translate(2px, -1px)" },
        { filter: "brightness(1.4)", transform: "scale(.995) translate(-1px, 1px)" },
        { filter: "none", transform: "none" }
      ], { duration: 360, easing: "cubic-bezier(.2,.9,.3,1)" });
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
              if (c) { c._box = n; n._robot = c; }
            }
          });
          m.removedNodes.forEach(function (n) { if (n.nodeType === 1 && n.classList && n.classList.contains("swarm-intro-cursor")) trail.delete(n); });
        } else if (m.attributeName === "class") {
          var t = m.target;
          if (t.classList.contains("swarm-intro-box") && t.classList.contains("is-done") && t._robot) { t._robot._box = null; t._robot = null; }
        } else if (m.attributeName === "data-swarm-intro-pending" && !m.target.hasAttribute("data-swarm-intro-pending")) blasted(m.target);
      });
    }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeOldValue: true, attributeFilter: ["class", "style", "data-swarm-intro-pending"] });
    wake();
  };
})();

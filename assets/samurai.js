// Samurai mode: swarm-intro still moves the cursors and builds the page; this file turns each cursor into an
// animated stick-figure samurai and adds the sword moments the library has no hook for.
//
// Every frame each samurai's real on-screen velocity is read from the library's CSS transition, and its
// skeleton is posed to match how it is moving:
//   standing still  -> ready stance, hand on the hilt, breathing
//   moving sideways -> a ninja sprint: pitched far forward, arms swept straight back, legs striding with distance covered
//   moving up       -> levitating: upright, legs hanging, arms eased out, faint lift lines under the feet
//   moving down     -> a controlled descent in a crouched ready stance, hand on the hilt
//   building        -> draws the sword and slashes across the element; sheathes it again when done
//   nothing to do   -> lines up down the right side of the screen and sits in meditation, sword laid in front
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
    // meditation: kneeling seated on the heels, back straight, hands resting on the thighs
    meditate: { lean: 0, tF: 1.5, kF: -3.05, tB: 1.42, kB: -2.98, aF: .35, eF: 1.15, aB: .25, eB: 1.2 },
    slash: { lean: .45, tF: 1.0, kF: -.6, tB: -.85, kB: .15, aF: 1.45, eF: .05, aB: 1.35, eB: .1 }
  };
  function dir(p, a, l) { return [p[0] + Math.sin(a) * l, p[1] + Math.cos(a) * l]; }
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
      aura: el("path", { "stroke-width": 1, opacity: .45 })        // faint lift lines under the feet when rising
    };
    svg.appendChild(g); cursor.appendChild(svg);
    return { g: g, p: parts, pose: JSON.parse(JSON.stringify(POSES.idle)), phase: 0, face: 1, x: null, y: null, vx: 0, vy: 0, slashT: 0, state: "idle", ox: 0, oy: 0, ovx: 0, ovy: 0, recoil: 0, lastClash: 0 };
  }

  function render(s, now) {
    var P = s.pose, st = s.state, run = st === "run";
    // a running stride is driven by the distance covered, so faster samurai take quicker steps
    if (run) {
      var ph = s.phase, sw = Math.sin(ph);
      P.tF = .25 + sw * 1.0; P.kF = -(1 + Math.cos(ph)) * .8; P.tB = .25 - sw * 1.0; P.kB = -(1 - Math.cos(ph)) * .8;
    }
    var bob = st === "meditate" ? -8.6 + Math.sin(now / 900) * .35 : run ? Math.abs(Math.cos(s.phase)) * 1.4 + 1.5 : st === "idle" ? Math.sin(now / 420) * .5 : st === "up" ? -2 + Math.sin(now / 260) * 1 : st === "down" ? 3 : 0;
    var hip = [0, -14 - bob];
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
    if (st === "meditate") {
      // sword laid on the ground in front, hilt to the right hand
      s.p.saya.setAttribute("d", seg([4, -.8], [17, -.8]));
      s.p.blade.setAttribute("d", seg([1.5, -.8], [4, -.8]));
    } else if (st === "slash") {
      // the draw: the blade sweeps from over the shoulder down through the cut in the first ~220 ms
      var k = Math.min(1, (now - s.slashT) / 220), a = -2.4 + k * 3.7;
      s.p.saya.setAttribute("d", seg(sHip, sTip));
      s.p.blade.setAttribute("d", seg(hF, dir(hF, a, 17)));
    } else {
      s.p.saya.setAttribute("d", seg(hilt, sHip, sTip));
      s.p.blade.setAttribute("d", "");
    }
    if (st === "up") {
      var t = (now / 300) % 1, l = 4 + t * 5;
      s.p.aura.setAttribute("d", seg([fF[0] - 2, fF[1] + 2 + t * 4], [fF[0] - 2, fF[1] + 2 + t * 4 + l]) + seg([fB[0] + 2, fB[1] + 4 + ((t + .5) % 1) * 4], [fB[0] + 2, fB[1] + 4 + ((t + .5) % 1) * 4 + l]));
      s.p.aura.setAttribute("opacity", (.5 * (1 - t)).toFixed(2));
    } else s.p.aura.setAttribute("d", "");
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
        if (c.classList.contains("slash")) s.state = "slash";
        else if (speed < .04 && c.dataset.rest && now - c.dataset.rest < 500) s.state = "meditate";
        else if (speed < .04) s.state = "idle";
        else if (Math.abs(s.vx) >= Math.abs(s.vy) * .7) s.state = "run";
        else s.state = s.vy < 0 ? "up" : "down";
        if (s.state === "slash" && prev !== "slash") s.slashT = now;
        if (s.state !== "slash" && Math.abs(s.vx) > .03) s.face = s.vx > 0 ? 1 : -1;
        if (s.state === "slash") s.face = 1;                                // the cut always runs to the bottom-right
        if (s.state === "meditate") s.face = -1;                            // facing in towards the page
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
        var aFixed = a.state === "slash", bFixed = b.state === "slash";      // a samurai mid-cut holds its line
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
        if (s.state === "slash") { s.ox *= .6; s.oy *= .6; }
      });
    }
    function spark(world, x, y) {
      var e = document.createElement("div"); e.className = "sam-clash";
      e.style.left = x + "px"; e.style.top = y + "px";
      e.innerHTML = '<svg viewBox="-10 -10 20 20"><path d="M0 -9 L0 -3 M0 3 L0 9 M-9 0 L-3 0 M3 0 L9 0 M-6 -6 L-2.5 -2.5 M2.5 2.5 L6 6 M6 -6 L2.5 -2.5 M-2.5 2.5 L-6 6"/></svg>';
      world.appendChild(e); setTimeout(function () { e.remove(); }, 380);
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
              var c = cursorAt(parseFloat(n.style.left), parseFloat(n.style.top));
              if (c) { c.classList.add("slash"); n._samurai = c; }
            }
          });
          m.removedNodes.forEach(function (n) { if (n.nodeType === 1 && n.classList && n.classList.contains("swarm-intro-cursor")) trail.delete(n); });
        } else if (m.attributeName === "class") {
          var t = m.target;
          if (t.classList.contains("swarm-intro-box") && t.classList.contains("is-done") && t._samurai) { t._samurai.classList.remove("slash"); t._samurai = null; }   // sword back in its sheath
        } else if (m.attributeName === "data-swarm-intro-pending" && !m.target.hasAttribute("data-swarm-intro-pending")) cut(m.target);
      });
    }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeOldValue: true, attributeFilter: ["class", "style", "data-swarm-intro-pending"] });
    wake();
  };
})();

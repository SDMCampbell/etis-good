// Wizard mode: swarm-intro still moves the cursors and builds the page; this file turns each cursor into an
// animated stick-figure wizard (an original design: pointed hat, short beard, a long robe with a floating hem, and a
// wooden staff topped with a glowing orb) who conjures each element into existence with a crackling bolt of magic.
//
// Wizards never walk; they float. Each frame a wizard's real on-screen velocity picks its pose:
//   still           -> hovering upright, staff held at its side, a slow bob
//   moving sideways -> gliding: leaning into it, staff angled forward, robe and hat tip streaming out behind
//   moving up       -> levitating: arms spread, staff upright, robe hanging straight down
//   moving down     -> a slow, controlled descent: arms out a little, the robe billowing up
//   building        -> rears back with the free hand raised and points the staff: a bolt from the orb into a rune frame
//   idle            -> drifts to a spot, then floats cross-legged in meditation with the staff hovering beside it
// Overlapping wizards shove apart; a fast meeting knocks both back with a spark.
(function () {
  var SVGNS = "http://www.w3.org/2000/svg";
  // joint angles: 0 = straight down, positive = forward (the way the wizard faces)
  var POSES = {
    idle:     { lean: 0, aF: .55, eF: .55, aB: -.25, eB: .25 },
    glide:    { lean: .38, aF: 1.15, eF: .1, aB: -.9, eB: .2 },
    up:       { lean: -.02, aF: 1.35, eF: -.2, aB: -1.35, eB: .2 },
    down:     { lean: .05, aF: .85, eF: .35, aB: -.85, eB: -.35 },
    cast:     { lean: -.14, aF: 1.5, eF: 0, aB: -2.5, eB: .35 },
    meditate: { lean: 0, aF: .7, eF: .95, aB: -.7, eB: -.95 }
  };
  function dir(p, a, l) { return [p[0] + Math.sin(a) * l, p[1] + Math.cos(a) * l]; }
  function add(p, v, k) { return [p[0] + v[0] * k, p[1] + v[1] * k]; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function lerp(cur, tgt, k) { for (var key in tgt) cur[key] += (tgt[key] - cur[key]) * k; }
  function f1(q) { return q[0].toFixed(1) + " " + q[1].toFixed(1); }
  function seg() { return "M" + [].map.call(arguments, f1).join(" L"); }

  function makeSprite(cursor) {
    var svg = document.createElementNS(SVGNS, "svg");
    svg.setAttribute("class", "wizard"); svg.setAttribute("viewBox", "-26 -40 52 46"); svg.setAttribute("aria-hidden", "true");
    var g = document.createElementNS(SVGNS, "g");
    function el(tag, attrs) { var e = document.createElementNS(SVGNS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); g.appendChild(e); return e; }
    var parts = {
      bolt: el("path", { class: "bolt" }),
      staff: el("path", { "stroke-width": 1.7, class: "staff" }),
      robe: el("path", { "stroke-width": 1.4, class: "robe" }),
      body: el("path", { "stroke-width": 2.2 }),                   // arms (and folded legs when meditating)
      head: el("circle", { r: 3, "stroke-width": 1.8 }),
      beard: el("path", { "stroke-width": 1, class: "hat" }),
      hat: el("path", { "stroke-width": 1.2, class: "hat" }),
      orb: el("circle", { r: 2.3, class: "orb" }),
      flare: el("circle", { r: 0, class: "orb" })                  // where the bolt lands
    };
    svg.appendChild(g); cursor.appendChild(svg);
    return { g: g, p: parts, pose: JSON.parse(JSON.stringify(POSES.idle)), face: 1, x: null, y: null, vx: 0, vy: 0,
      state: "idle", ox: 0, oy: 0, ovx: 0, ovy: 0, recoil: 0, lastClash: 0, castT: 0, seed: Math.random() * 10 };
  }

  function render(s, now) {
    var P = s.pose, st = s.state, t = now + s.seed * 1000;
    var hover = st === "meditate" ? 8 + Math.sin(t / 800) * 1.4 : st === "cast" ? 5 : 5 + Math.sin(t / 420) * 1.1;
    var hip = [0, -11 - hover];
    var up = [Math.sin(P.lean), -Math.cos(P.lean)], fwd = [Math.cos(P.lean), Math.sin(P.lean)];
    var neck = add(hip, up, 11), sh = add(neck, up, -1.5), head = add(neck, up, 3.8);
    // the robe hem and the hat tip stream away from the direction of travel (in the sprite's own, flipped, frame)
    var tx = clamp(-s.vx * s.face * 10, -6, 6), ty = clamp(-s.vy * 10, -6, 6);
    if (st === "cast" && s.target) { P.aF = Math.atan2(s.target[0] - sh[0], s.target[1] - sh[1]); P.eF = 0; }
    var eF = dir(sh, P.aF, 5.5), hF = dir(eF, P.aF + P.eF, 5.5), eB = dir(sh, P.aB, 5.5), hB = dir(eB, P.aB + P.eB, 5.5);
    var body = seg(sh, eF, hF) + seg(sh, eB, hB);

    // robe: shoulders to a wavy hem. Meditating, it pools around the folded legs instead.
    var robe, hemC, hw;
    if (st === "meditate") {
      hemC = add(hip, up, -2.5); hw = 8.5;
      var kF = [hip[0] + 7, hip[1] + 2], kB = [hip[0] - 7, hip[1] + 2];
      body += seg(hip, kF, [hip[0] - 2.5, hip[1] + 3.6]) + seg(hip, kB, [hip[0] + 2.5, hip[1] + 3.6]);   // legs crossed
    } else { hemC = add(add(hip, up, -10), [tx, ty], 1); hw = 6.2 + Math.abs(ty) * .2; }
    var hemF = add(hemC, fwd, hw), hemB = add(hemC, fwd, -hw), n = 4, hem = "";
    for (var i = 1; i <= n; i++) {
      var a = add(hemF, [hemB[0] - hemF[0], hemB[1] - hemF[1]], i / n), wv = Math.sin(t / 140 + i * 1.9) * (st === "meditate" ? .5 : 1.3);
      hem += " L" + f1([a[0], a[1] + (i % 2 ? 1.6 : 0) + wv]);
    }
    robe = "M" + f1(add(sh, fwd, 2.3)) + " L" + f1(hemF) + hem + " L" + f1(add(sh, fwd, -2.3)) + " Z";
    s.p.robe.setAttribute("d", robe);
    s.p.body.setAttribute("d", body);

    // head, beard, and a tall pointed hat whose tip bends back with speed
    s.p.head.setAttribute("cx", head[0].toFixed(1)); s.p.head.setAttribute("cy", head[1].toFixed(1));
    var chin = add(head, up, -2.4);
    s.p.beard.setAttribute("d", "M" + f1(add(chin, fwd, -.6)) + " L" + f1(add(add(chin, up, -5.5), fwd, 1.8 + tx * .15)) + " L" + f1(add(chin, fwd, 2.9)) + " Z");
    var brim = add(head, up, 2.2), bend = clamp(tx * .5, -3.5, 3.5) - 1.5;
    var tip = add(add(add(brim, up, 10), fwd, bend), [0, 0], 1), mid = add(add(brim, up, 5), fwd, bend * .25);
    s.p.hat.setAttribute("d", seg(add(brim, fwd, -6), add(brim, fwd, 5.5)) +
      " M" + f1(add(brim, fwd, 2.9)) + " Q" + f1(add(mid, fwd, 1.4)) + " " + f1(tip) + " Q" + f1(add(mid, fwd, -1.8)) + " " + f1(add(brim, fwd, -3.1)) + " Z");

    // the staff: in the hand, upright or angled with the pose; pointed at the element while casting.
    // Meditating, it floats upright beside the wizard.
    var sd, grip = hF;
    if (st === "meditate") { grip = [hip[0] + 11, hip[1] - 3 + Math.sin(t / 650) * 1.2]; sd = [0, -1]; }
    else if (st === "cast" && s.target) { var dx = s.target[0] - hF[0], dy = s.target[1] - hF[1], dl = Math.hypot(dx, dy) || 1; sd = [dx / dl, dy / dl]; }
    else if (st === "glide") sd = [.62, -.78];
    else sd = [.14, -.99];
    var top = add(grip, sd, 13), foot = add(grip, sd, -9);
    s.p.staff.setAttribute("d", seg(foot, top));
    var pulse = st === "cast" ? 3 + Math.random() * 1.2 : 2.1 + Math.sin(t / 300) * .35;
    s.p.orb.setAttribute("cx", top[0].toFixed(1)); s.p.orb.setAttribute("cy", top[1].toFixed(1)); s.p.orb.setAttribute("r", pulse.toFixed(1));

    // the bolt: a crackling zigzag from the orb to the middle of the element, flaring where it lands
    if (st === "cast" && s.target) {
      var k = Math.min(1, (now - s.castT) / 120), end = add(top, [s.target[0] - top[0], s.target[1] - top[1]], k);
      var bx = end[0] - top[0], by = end[1] - top[1], bl = Math.hypot(bx, by) || 1, px = -by / bl, py = bx / bl, d = "M" + f1(top), m = Math.max(3, Math.round(bl / 9));
      for (var j = 1; j < m; j++) { var j2 = (Math.random() - .5) * 5; d += " L" + f1([top[0] + bx * j / m + px * j2, top[1] + by * j / m + py * j2]); }
      s.p.bolt.setAttribute("d", d + " L" + f1(end));
      s.p.flare.setAttribute("cx", end[0].toFixed(1)); s.p.flare.setAttribute("cy", end[1].toFixed(1)); s.p.flare.setAttribute("r", (2.5 + Math.random() * 3).toFixed(1));
    } else { s.p.bolt.setAttribute("d", ""); s.p.flare.setAttribute("r", 0); }
    s.g.setAttribute("transform", "translate(" + s.ox.toFixed(1) + " " + s.oy.toFixed(1) + ") scale(" + s.face + " 1)");
  }

  window.wizardMode = function () {
    var root = document.documentElement; root.classList.add("wizard");
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
          s.vx += (vx - s.vx) * .3; s.vy += (vy - s.vy) * .3;
        }
        s.x = p[0]; s.y = p[1];
        var speed = Math.hypot(s.vx, s.vy), prev = s.state;
        if (c._box) s.state = "cast";
        else if (speed < .04 && c.dataset.rest && now - c.dataset.rest < 500) s.state = "meditate";
        else if (speed < .04) s.state = "idle";
        else if (Math.abs(s.vx) >= Math.abs(s.vy) * .7) s.state = "glide";
        else s.state = s.vy < 0 ? "up" : "down";
        if (s.state === "cast") {
          if (prev !== "cast") s.castT = now;
          var b = c._box, bx = parseFloat(b.style.left) + (parseFloat(b.style.width) || 0) / 2, by = parseFloat(b.style.top) + (parseFloat(b.style.height) || 0) / 2;
          s.face = bx >= s.x ? 1 : -1;
          s.target = [(bx - s.x - s.ox) * s.face, by - s.y - s.oy];          // in the sprite's own (flipped) frame
        } else { s.target = null; if (Math.abs(s.vx) > .03) s.face = s.vx > 0 ? 1 : -1; }
        lerp(s.pose, POSES[s.state], s.state === "cast" ? .4 : .16);           // wizards move a little more gently
        if (now < s.recoil) { s.pose.lean += (-.5 - s.pose.lean) * .5; }
      });
      collide(now, dt, document.querySelector(".swarm-intro-world"));
      sprites.forEach(function (s, c) { if (!c.isConnected) sprites.delete(c); else render(s, now); });
      if (document.querySelector(".swarm-intro-cursor")) raf = requestAnimationFrame(tick);
    }
    function wake() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); } }

    // collisions (as in the other modes): a springy offset from the cursor, since swarm-intro owns the real routes
    var R = 15;
    function collide(now, dt, world) {
      var list = []; sprites.forEach(function (s) { if (s.x !== null) list.push(s); });
      for (var i = 0; i < list.length; i++) for (var j = i + 1; j < list.length; j++) {
        var a = list[i], b = list[j];
        var dx = (b.x + b.ox) - (a.x + a.ox), dy = (b.y + b.oy) - (a.y + a.oy), d = Math.hypot(dx, dy);
        if (d >= R * 2 || d < .01) { if (d < .01) { a.ox -= .5; b.ox += .5; } continue; }
        var nx = dx / d, ny = dy / d, push = (R * 2 - d) / 2;
        var aFixed = a.state === "cast", bFixed = b.state === "cast";        // a wizard mid-spell holds its ground
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
        if (s.state === "cast") { s.ox *= .6; s.oy *= .6; }
      });
    }
    function spark(world, x, y) {
      var e = document.createElement("div"); e.className = "sam-clash";
      e.style.left = x + "px"; e.style.top = y + "px";
      e.innerHTML = '<svg viewBox="-10 -10 20 20"><path d="M0 -9 L0 -3 M0 3 L0 9 M-9 0 L-3 0 M3 0 L9 0 M-6 -6 L-2.5 -2.5 M2.5 2.5 L6 6 M6 -6 L2.5 -2.5 M-2.5 2.5 L-6 6"/></svg>';
      world.appendChild(e); setTimeout(function () { e.remove(); }, 380);
    }
    // a conjured element: a flash of light and a scatter of twinkling sparkles across it
    function conjured(el) {
      if (!el.animate) return;
      el.animate([
        { filter: "brightness(2.4) blur(2px) drop-shadow(0 0 8px #B48CFF)", transform: "scale(1.015)" },
        { filter: "brightness(1.3) drop-shadow(0 0 4px #B48CFF)", transform: "scale(1)" },
        { filter: "none", transform: "none" }
      ], { duration: 480, easing: "cubic-bezier(.2,.9,.3,1)" });
      var world = document.querySelector(".swarm-intro-world"); if (!world) return;
      var r = el.getBoundingClientRect(), n = Math.min(10, 3 + Math.round(r.width * r.height / 4000));
      for (var i = 0; i < n; i++) {
        var e = document.createElement("div"); e.className = "wz-spark";
        e.style.left = (r.left + scrollX + Math.random() * r.width) + "px"; e.style.top = (r.top + scrollY + Math.random() * r.height) + "px";
        e.style.animationDelay = (Math.random() * 220 | 0) + "ms";
        world.appendChild(e); setTimeout(function (x) { x.remove(); }.bind(null, e), 900);
      }
    }

    // which wizard is building which element: the library names the box's cursor (or it opens where one has just been sent)
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
              if (c) { c._box = n; n._wizard = c; }
            }
          });
          m.removedNodes.forEach(function (n) { if (n.nodeType === 1 && n.classList && n.classList.contains("swarm-intro-cursor")) trail.delete(n); });
        } else if (m.attributeName === "class") {
          var t = m.target;
          if (t.classList.contains("swarm-intro-box") && t.classList.contains("is-done") && t._wizard) { t._wizard._box = null; t._wizard = null; }
        } else if (m.attributeName === "data-swarm-intro-pending" && !m.target.hasAttribute("data-swarm-intro-pending")) conjured(m.target);
      });
    }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeOldValue: true, attributeFilter: ["class", "style", "data-swarm-intro-pending"] });
    wake();
  };
})();

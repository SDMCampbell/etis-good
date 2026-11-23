(function () {
  "use strict";
  var R = window.RESUME, D = window.DERIVED;
  var $ = function (id) { return document.getElementById(id); };
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  var manifestScript = document.querySelector('script[src$="versions/manifest.js"]');
  var INFRA = manifestScript ? new URL("../", manifestScript.src) : new URL("./", location.href);
  // The OS "reduce motion" setting (Windows: Settings > Accessibility > Visual effects > Animation effects off) turns the
  // animation off by default. A visitor can still opt in for this site; the choice is remembered.
  var osReduce = matchMedia("(prefers-reduced-motion: reduce)").matches, motionPref = null;
  try { motionPref = localStorage.getItem("motion"); } catch (e) {}
  var reduce = motionPref === "on" ? false : motionPref === "off" ? true : osReduce;
  document.documentElement.classList.toggle("still", reduce);
  var small = matchMedia("(max-width: 600px)").matches;

  // ---------- 1. the document: real text, rendered from data ----------
  var mail = "mailto:" + R.email;
  $("topName").textContent = R.name.toUpperCase();
  $("hail").href = mail;
  $("stamp").textContent = D.roleCount + " roles · " + D.yearsIn + "+ yrs · " + D.skillCount + " systems";
  $("name").textContent = R.name.toUpperCase();
  $("title").textContent = R.title + " · " + R.location;
  var c = D.current;
  $("now").innerHTML = "&gt; now: " + esc(c.role) + " @ " + esc(c.company) + " (" + esc(c._span) + ")" + (c.returning ? " · round two" : "");
  $("links").innerHTML = '&gt; hail: <a href="' + esc(mail) + '" class="em">' + esc(R.email) + '</a> <button type="button" class="copy" data-copy>[ copy ]</button> · <a href="' + esc(R.github) + '">github</a>';
  $("summary").textContent = "// " + R.summary + " " + R.tagline;
  $("jobs").innerHTML = R.jobs.map(function (j) {
    return '<li class="job" id="job-' + esc(j.id) + '"><div class="head">[' + Math.floor(j._t0) + "] " + esc(j.role) + "</div>" +
      '<div class="meta">@ ' + esc(j.company) + (j.location ? " · " + esc(j.location) : "") + " · " + esc(j._span) + (j.returning ? " · round two" : "") + "</div><ul>" +
      j.bullets.map(function (b) { return "<li>" + esc(b) + "</li>"; }).join("") + "</ul>" +
      (j.highlight ? '<div class="meta">* ' + esc(j.highlight.label.toLowerCase()) + ": " + esc(j.highlight.from) + " → " + esc(j.highlight.to) + "</div>" : "") +
      '<div class="tags">stack: ' + j.tags.map(esc).join(", ") + (j._new.length ? " · new here: " + j._new.map(esc).join(", ") : "") + "</div></li>";
  }).join("");
  $("systems").innerHTML = Object.keys(R.skills).map(function (g) {
    return '<p class="sys"><b>' + esc(g) + "</b> " + R.skills[g].map(function (k) { return '<button type="button" class="skill" data-skill="' + esc(k) + '">' + esc(k) + "</button>"; }).join(", ") + "</p>";
  }).join("");
  $("contactLines").innerHTML = '&gt; email  <a href="' + esc(mail) + '" class="em">' + esc(R.email) + '</a> <button type="button" class="copy" data-copy>[ copy ]</button><br>&gt; github <a href="' + esc(R.github) + '">' + esc(R.github.replace(/^https?:\/\//, "")) + "</a><br>&gt; base   " + esc(R.location);
  document.querySelectorAll('a[href="timeline/"]').forEach(function (a) { a.href = new URL("timeline/", INFRA).href; });

  // reduced motion: no rain, no drones; the text is simply there (find still works)

  // ---------- 2. the rain engine ----------
  var canvas = $("rain"), ctx = canvas.getContext("2d"), dpr = 1, W = 0, H = 0;
  var GLYPHS = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789<>/=+*#%$&{}[]~^│┼├┤─";
  var quick = false; try { quick = sessionStorage.getItem("rained") === "1"; sessionStorage.setItem("rained", "1"); } catch (e) {}
  // ---------- phosphor themes: canvas ink follows the CSS tokens ----------
  var INK = {};
  function readInk() {
    var cs = getComputedStyle(document.documentElement), acc = cs.getPropertyValue("--accent").trim(), hi = cs.getPropertyValue("--hi").trim();
    var n = parseInt(acc.slice(1), 16);
    INK = { acc: acc, hi: hi, rgb: [(n >> 16) & 255, (n >> 8) & 255, n & 255].join(",") };
  }
  var THEMES = ["green", "amber", "ice", "paper"];
  try { var th0 = localStorage.getItem("phosphor"); if (th0 && th0 !== "green" && THEMES.indexOf(th0) > -1) document.documentElement.dataset.theme = th0; } catch (e) {}
  readInk();
  var blocks = [].slice.call(document.querySelectorAll("[data-rain]"));
  var words = [], active = [], drones = [], raf = 0, done = false;
  function size() {
    dpr = Math.min(2, window.devicePixelRatio || 1); W = innerWidth; H = innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function measure(block) {
    var out = [], tw = document.createTreeWalker(block, NodeFilter.SHOW_TEXT), node, re = /\S+/g, m;
    var sx = scrollX, sy = scrollY, fixed = getComputedStyle(block).position === "sticky";
    while ((node = tw.nextNode())) {
      if (!node.textContent.trim()) continue;
      var el = node.parentElement, cs = getComputedStyle(el);
      var font = cs.fontWeight + " " + cs.fontSize + " " + cs.fontFamily, color = cs.color;
      re.lastIndex = 0;
      while ((m = re.exec(node.textContent))) {
        var rg = document.createRange(); rg.setStart(node, m.index); rg.setEnd(node, m.index + m[0].length);
        var rects = rg.getClientRects(); if (!rects.length) continue;
        var r = rects[0];
        out.push({ t: m[0], x: r.left + sx, y: r.top + (fixed ? 0 : sy), w: r.width, h: r.height, font: font, color: color, fixed: fixed, block: block });
      }
    }
    return out;
  }
  function hive() { return { x: W - 36, y: H - 82 }; }
  function makeDrones(n) {
    var h = hive();
    for (var i = 0; i < n; i++) drones.push({ x: h.x + (Math.random() - .5) * 40, y: h.y + (Math.random() - .5) * 30, state: "idle", word: null, t0: 0, from: null, trail: [], seed: Math.random() * 10 });
  }
  // ---------- swarm build (our own take on the "cursor swarm rebuilds the page" intro, cf. swarm-intro, MIT) ----------
  // Before a block's text drops in, a cursor drone claims each element in it: it flies to the element's top-left corner,
  // drags a selection box out to the bottom-right with a live "W × H" readout, and the element's words then rain into the box.
  var TARGETS = ".who, .chan a, .top-act button, #stamp, h1, #title, #now, #links, #summary, .hint, h2, .sorts, .job, .sys, #contactLines, #contact p";
  var surveys = [], speed = 1, MAXD = small ? 28 : 56;
  function grabDrone(near) {
    var d = drones.filter(function (x) { return x.state === "idle" || x.state === "hold"; }).sort(function (a, b) { return Math.hypot(a.x - near.x, a.y - near.y) - Math.hypot(b.x - near.x, b.y - near.y); })[0];
    if (!d && drones.length < MAXD) { var h = hive(); d = { x: h.x, y: h.y, state: "idle", trail: [], seed: Math.random() * 10, extra: true }; drones.push(d); }
    return d;
  }
  function planSurveys(block, t0, priority) {
    var sx = scrollX, sy = scrollY, fixed = getComputedStyle(block).position === "sticky", out = [], k = 0;
    [].forEach.call(block.querySelectorAll(TARGETS), function (el) {
      if (el.closest("[hidden]")) return;
      var r = el.getBoundingClientRect(); if (r.width < 4 || r.height < 4) return;
      var sv = { block: block, x: r.left + sx, y: r.top + (fixed ? 0 : sy), w: r.width, h: r.height, fixed: fixed,
        start: t0 + k * (priority ? 70 : 45) / speed, fly: 260 / speed, drag: 330 / speed, drone: null, fade: 0 };
      sv.lock = sv.start + sv.fly + sv.drag;
      out.push(sv); k++;
    });
    return out;
  }
  function updateSurveys(now, sx, sy) {
    drones.forEach(function (d) { if (d.state === "hold" && now > d.holdUntil) d.state = "idle"; });
    ctx.save(); ctx.font = "10px 'JetBrains Mono', monospace"; ctx.textBaseline = "bottom";
    for (var i = surveys.length - 1; i >= 0; i--) {
      var v = surveys[i], oy = v.fixed ? 0 : sy, x0 = v.x - sx, y0 = v.y - oy;
      if (now < v.start) continue;
      if (!v.drone && !v.gave) { v.drone = grabDrone({ x: x0, y: y0 }); v.gave = true; if (v.drone) { v.drone.state = "survey"; v.from = { x: v.drone.x, y: v.drone.y }; } }
      var d = v.drone, t = now - v.start, bw, bh;
      if (t < v.fly) {                                     // fly to the corner
        var q = t / v.fly; q = 1 - Math.pow(1 - q, 3);
        if (d) { d.x = v.from.x + (x0 - 4 - v.from.x) * q; d.y = v.from.y + (y0 - v.from.y) * q; }
        continue;
      }
      var g = Math.min(1, (t - v.fly) / v.drag); g = g < .5 ? 2 * g * g : 1 - Math.pow(-2 * g + 2, 2) / 2;
      bw = v.w * g; bh = v.h * g;
      if (d && g < 1) { d.x = x0 + bw - 4; d.y = y0 + bh; }
      if (d && g >= 1 && d.state === "survey") { d.state = "idle"; v.drone = null; }   // hand the drone back: it may escort the words
      var landed = v.block._left <= 0 && !v.block.classList.contains("veiled");
      if (landed && !v.fade) v.fade = now;
      var alpha = v.fade ? 1 - (now - v.fade) / 350 : 1;
      if (alpha <= 0) { surveys.splice(i, 1); continue; }
      ctx.globalAlpha = Math.max(0, alpha);
      ctx.setLineDash([4, 3]); ctx.lineWidth = 1; ctx.strokeStyle = "rgba(" + INK.rgb + ",.75)"; ctx.fillStyle = "rgba(" + INK.rgb + ",.06)";
      ctx.fillRect(x0 - 2, y0 - 1, bw + 4, bh + 2); ctx.strokeRect(x0 - 2.5, y0 - 1.5, bw + 5, bh + 3);
      var lbl = Math.round(bw) + " × " + Math.round(bh), lw = ctx.measureText(lbl).width + 8, ly = y0 - 3 < 14 ? y0 + bh + 15 : y0 - 3;
      ctx.setLineDash([]); ctx.fillStyle = INK.acc; ctx.fillRect(x0 - 3, ly - 13, lw, 13);
      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--bg"); ctx.fillText(lbl, x0 + 1, ly - 1);
    }
    ctx.restore(); ctx.globalAlpha = 1;
  }
  // schedule a block: elements get surveyed, then each word falls from above the viewport into its exact spot
  function rainBlock(block, t0, priority) {
    if (block._rained) return; block._rained = true;
    var list = measure(block); block._left = list.length;
    if (!list.length) { block.classList.remove("veiled"); return; }
    var svs = quick ? [] : planSurveys(block, t0, priority);
    surveys = surveys.concat(svs);
    var step = (quick ? 2 : priority ? 16 : 6) / speed, dur0 = (quick ? 380 : 650) / speed;
    var lineY = null, perBox = svs.map(function () { return 0; }), lastLock = svs.length ? svs[svs.length - 1].lock : t0;
    list.forEach(function (w, i) {
      var cx = w.x + w.w / 2, cy = w.y + w.h / 2, bi = -1;
      for (var j = 0; j < svs.length; j++) { var v = svs[j]; if (cx >= v.x - 2 && cx <= v.x + v.w + 2 && cy >= v.y - 2 && cy <= v.y + v.h + 2) { bi = j; } }
      w.start = bi > -1 ? svs[bi].lock - 120 + (perBox[bi]++) * step : (svs.length ? lastLock : t0 + i * step);
      w.dur = dur0 + Math.random() * (quick ? 120 : 300) / speed;
      w.drop = (quick ? 60 : 110) + Math.random() * (quick ? 120 : 300);
      w.glyphs = w.t.split("");
      w.lock = w.t.split("").map(function (_, k) { return .62 + .38 * (k / Math.max(1, w.t.length)) * Math.random(); });
      // one drone escorts the first word of each line
      if (lineY === null || Math.abs(w.y - lineY) > 4) { lineY = w.y; w.leader = true; }
      active.push(w); words.push(w);
    });
    if (!raf) raf = requestAnimationFrame(frame);
  }
  // gather: on a fresh visit the swarm first huddles round a badge in the middle of the screen, then breaks off to build
  var gather = null;
  function startGather(ms) {
    var cx = W / 2, cy = H / 2;
    gather = { until: performance.now() + ms, t0: performance.now(), cx: cx, cy: cy };
    drones.forEach(function (d, i) { var a = i / drones.length * Math.PI * 2, rr = 46 + (i % 3) * 12; d.state = "form"; d.fx = cx + Math.cos(a) * rr * 1.6; d.fy = cy + Math.sin(a) * rr; d.x = cx + (Math.random() - .5) * W * .6; d.y = cy + (Math.random() - .5) * H * .6; });
  }
  function drawGather(now) {
    if (!gather) return;
    if (now > gather.until) { drones.forEach(function (d) { if (d.state === "form" && !formation) { d.state = "hold"; d.holdUntil = now + 1200; } }); gather = null; return; }
    var a = Math.min(1, (now - gather.t0) / 250, (gather.until - now) / 200);
    ctx.save(); ctx.globalAlpha = Math.max(0, a); ctx.font = "700 18px 'JetBrains Mono', monospace"; ctx.textBaseline = "middle"; ctx.textAlign = "center";
    var lbl = "[ " + (R.handle || "swarm") + " ]";
    ctx.fillStyle = INK.acc; ctx.shadowColor = INK.acc; ctx.shadowBlur = 12; ctx.fillText(lbl, gather.cx, gather.cy); ctx.restore();
  }
  // fast scrolling calls up more drones and speeds up the build
  var lastSY = scrollY, lastST = performance.now();
  addEventListener("scroll", function () {
    var now = performance.now(), v = Math.abs(scrollY - lastSY) / Math.max(1, now - lastST) * 1000; lastSY = scrollY; lastST = now;
    speed = v > 2500 ? 1.8 : v > 1200 ? 1.35 : 1;
  }, { passive: true });
  function landBlock(b) { b.classList.remove("veiled"); }
  function frame(now) {
    raf = 0;
    ctx.clearRect(0, 0, W, H);
    var sy = scrollY, sx = scrollX, h = hive();
    drawGather(now);
    updateSurveys(now, sx, sy);
    // falling words
    for (var i = active.length - 1; i >= 0; i--) {
      var w = active[i], t = (now - w.start) / w.dur;
      if (t < 0) continue;
      if (t >= 1) {
        active.splice(i, 1);
        if (--w.block._left <= 0) landBlock(w.block);
        else { ctx.font = w.font; ctx.fillStyle = w.color; ctx.textBaseline = "middle"; drawWord(w, w.y, 1, sx, sy); }
        if (w.drone) { w.drone.state = "return"; w.drone.t0 = now; w.drone.from = { x: w.drone.x, y: w.drone.y }; w.drone.word = null; w.drone = null; }
        continue;
      }
      if (w.leader && !w.drone) {
        var d = drones.filter(function (x) { return x.state === "idle"; })[0];
        if (d) { d.state = "escort"; d.word = w; w.drone = d; }
      }
      var e = t * t;                                     // gravity: accelerate into place
      var startY = (w.fixed ? 0 : sy) - w.drop - 20;
      var y = startY + (w.y - startY) * e;
      ctx.font = w.font; ctx.textBaseline = "middle";
      drawWord(w, y, t, sx, sy, now);
      if (w.drone) {                                     // drones swoop in from wherever they are, then ride the word down
        var tx = w.x - sx - 16, ty = y - (w.fixed ? 0 : sy) + w.h / 2, dr = w.drone;
        dr.x += (tx - dr.x) * 0.28; dr.y += (ty - dr.y) * 0.28;
        dr.x += Math.sin(now / 70 + dr.seed) * 0.8;
      }
    }
    // landed-but-not-revealed words keep drawing until their block reveals
    for (var k = 0; k < words.length; k++) {
      var lw = words[k];
      if (lw.block._left > 0 && active.indexOf(lw) < 0 && now - lw.start > lw.dur) { ctx.font = lw.font; ctx.fillStyle = lw.color; ctx.textBaseline = "middle"; drawWord(lw, lw.y, 1, sx, sy); }
    }
    // drones
    var moving = false;
    updateScrambles(now, sx, sy);
    if (typeof updateCarries === "function") updateCarries(now, sx, sy);
    updateLifts(now, sx, sy);
    updateSweeps(now);
    if (typeof hoverDrones === "function") hoverDrones(sx, sy);
    var pActive = done && pointer.on && now - pointer.t < 2500;
    drones.forEach(function (d, i) {
      var tx, ty, ease = 0.08;
      if (d.state === "return") {
        var k2 = Math.min(1, (now - d.t0) / 520), q = 1 - Math.pow(1 - k2, 3);
        d.x = d.from.x + (h.x - d.from.x) * q + Math.sin(k2 * Math.PI) * -40; d.y = d.from.y + (h.y - d.from.y) * q;
        if (k2 >= 1) d.state = "idle";
        moving = true;
      } else if (d.state === "form") { tx = d.fx; ty = d.fy; ease = 0.12; }
      else if (d.state === "squad") { tx = d.tx; ty = d.ty; ease = 0.3; }
      else if (d.state === "hover") { tx = d.tx; ty = d.ty; ease = 0.18; moving = true; }
      else if (d.state === "idle") {
        var a = now / 900 + d.seed;
        if (pActive) { var rr = 22 + (i % 6) * 7; tx = pointer.x + Math.cos(a * 1.7 + i) * rr; ty = pointer.y + Math.sin(a * 1.3 + i) * rr; ease = 0.06 + (i % 5) * 0.01; }
        else { tx = h.x + Math.cos(d.seed * 3.1) * 18; ty = h.y + Math.sin(d.seed * 2.3) * 12; }   // settle in the hive: lets the loop stop
      }
      if (tx !== undefined) {
        var dx = tx - d.x, dy = ty - d.y;
        d.x += dx * ease; d.y += dy * ease;
        if (Math.abs(dx) + Math.abs(dy) > 0.6 || pActive) moving = true;
      }
      if (d.state !== "idle") moving = true;
      d.trail.push([d.x, d.y]); if (d.trail.length > 7) d.trail.shift();
      drawDrone(d);
    });
    drones = drones.filter(function (d) { return !(d.extra && d.state === "idle"); });
    if (drones.some(function (d) { return d.state === "hover"; })) moving = true;
    if (formation) moving = true;
    if (active.length || moving || gather || surveys.length || scrambles.length || carries.length || lifts.length || ferries.length || sweeps.length || words.some(function (x) { return x.block._left > 0; })) raf = requestAnimationFrame(frame);
    else finish();
  }
  function drawWord(w, y, t, sx, sy, now) {
    var cw = w.w / w.t.length, oy = w.fixed ? 0 : sy;
    for (var i = 0; i < w.t.length; i++) {
      var locked = t >= w.lock[i];
      var ch = locked ? w.t[i] : (now && Math.random() < .35 ? (w.glyphs[i] = GLYPHS[(Math.random() * GLYPHS.length) | 0]) : w.glyphs[i]);
      ctx.fillStyle = locked ? w.color : (i === 0 ? INK.hi : INK.acc);
      ctx.fillText(ch, w.x - sx + i * cw, y - oy + w.h / 2);
    }
  }
  function drawDrone(d) {
    ctx.textBaseline = "middle"; ctx.font = "700 14px 'JetBrains Mono', monospace";
    for (var i = 0; i < d.trail.length - 1; i++) { ctx.fillStyle = "rgba(" + INK.rgb + "," + (0.08 * (i + 1)) + ")"; ctx.fillText("▮", d.trail[i][0], d.trail[i][1]); }
    ctx.fillStyle = d.state === "idle" ? "rgba(" + INK.rgb + ",.55)" : INK.acc;
    ctx.shadowColor = INK.acc; ctx.shadowBlur = d.state === "idle" ? 0 : 8;
    ctx.fillText("▸", d.x, d.y); ctx.shadowBlur = 0;
  }
  function finish() {
    ctx.clearRect(0, 0, W, H);
    var pending = blocks.filter(function (b) { return !b._rained; });
    if (!pending.length) { done = true; $("skip").hidden = true; }
  }
  function skipAll() {
    if (done) return;
    done = true; cancelAnimationFrame(raf); raf = 0; active = []; surveys = []; gather = null;
    drones.forEach(function (d) { if (d.state === "survey" || d.state === "hold" || (d.state === "form" && !formation)) d.state = "idle"; });
    blocks.forEach(function (b) { b._rained = true; b._left = 0; b.classList.remove("veiled"); });
    ctx.clearRect(0, 0, W, H); $("skip").hidden = true; kick();
    if (io) io.disconnect();
  }

  // ---------- recall: the swarm hauls every visible word back up off the screen, then rains it down again ----------
  var lifts = [], recalling = false;
  var ferries = [];
  function updateFerries(now) {
    for (var i = ferries.length - 1; i >= 0; i--) {
      var f = ferries[i], t = (now - f.start) / f.dur;
      if (t < 0) continue;
      if (t >= 1) { ferries.splice(i, 1); f.el.classList.remove("lifted"); if (f.drone) { f.drone.state = "return"; f.drone.t0 = now; f.drone.from = { x: f.drone.x, y: f.drone.y }; } continue; }
      var e = t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2, x = f.x0 + (f.x1 - f.x0) * e, y = f.y0 + (f.y1 - f.y0) * e - Math.sin(t * Math.PI) * 60;
      ctx.font = f.font; ctx.fillStyle = f.color; ctx.textBaseline = "middle"; ctx.fillText(f.text, x, y);
      if (f.drone) { f.drone.x = x - 14; f.drone.y = y; }
    }
  }
  function updateLifts(now, sx, sy) {
    updateFerries(now);
    for (var i = lifts.length - 1; i >= 0; i--) {
      var w = lifts[i], t = (now - w.start) / w.dur;
      if (t < 0) { ctx.font = w.font; ctx.fillStyle = w.color; ctx.textBaseline = "middle"; drawWord(w, w.y, 1, sx, sy); continue; }
      if (t >= 1) { lifts.splice(i, 1); if (w.drone) { w.drone.state = "return"; w.drone.t0 = now; w.drone.from = { x: w.drone.x, y: w.drone.y }; w.drone = null; } continue; }
      var e = t * t, top = (w.fixed ? 0 : sy) - 60, y = w.y + (top - w.y) * e;
      ctx.font = w.font; ctx.fillStyle = w.color; ctx.textBaseline = "middle"; drawWord(w, y, 1, sx, sy);
      if (w.drone) { var dr = w.drone; dr.x += (w.x - sx - 16 - dr.x) * .3; dr.y += (y - (w.fixed ? 0 : sy) + w.h / 2 - dr.y) * .3; }
    }
  }
  function recall() {
    if (reduce || recalling) return;
    skipAll(); closeFind && closeFind();
    var vis = blocks.filter(function (b) { var r = b.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; });
    if (!vis.length) return;
    recalling = true;
    var now = performance.now(), last = 0;
    vis.forEach(function (b) {
      var list = measure(b).filter(function (w) { var vy = w.y - (w.fixed ? 0 : scrollY); return vy > -40 && vy < innerHeight + 40; });
      b.classList.add("veiled");
      var lineY = null;
      // bottom lines leave first, so the page empties upward like it is being reeled in
      list.forEach(function (w) {
        var vy = w.y - (w.fixed ? 0 : scrollY);
        w.glyphs = w.t.split(""); w.lock = w.glyphs.map(function () { return 0; });
        w.start = now + (innerHeight - vy) * .55 + Math.random() * 120; w.dur = 520 + Math.random() * 200;
        last = Math.max(last, w.start + w.dur);
        if (lineY === null || Math.abs(w.y - lineY) > 4) { lineY = w.y; var d = drones.filter(function (x) { return x.state === "idle"; })[0]; if (d) { d.state = "escort"; w.drone = d; } }
        lifts.push(w);
      });
    });
    kick();
    setTimeout(function () {
      done = false; $("skip").hidden = false;
      vis.forEach(function (b, i) { b._rained = false; rainBlock(b, performance.now() + i * 160, b.classList.contains("hero") || b.matches(".top")); });
      recalling = false; kick();
      var wait = setInterval(function () { if (!active.length && !words.some(function (x) { return x.block._left > 0; })) { clearInterval(wait); done = true; $("skip").hidden = true; } }, 200);
    }, last - now + 150);
  }
  // ---------- swarm toys (after the rain): pointer flock, click-to-scramble, idle formation ----------
  var pointer = { x: 0, y: 0, on: false, t: 0 }, scrambles = [], formation = false, idleT = null;
  function kick() { if (!raf) raf = requestAnimationFrame(frame); }
  if (matchMedia("(pointer: fine)").matches) {
    addEventListener("pointermove", function (e) { pointer.x = e.clientX; pointer.y = e.clientY; pointer.on = true; pointer.t = performance.now(); if (done) kick(); });
    document.addEventListener("pointerleave", function () { pointer.on = false; });
  }
  function wordAt(x, y) {
    var r = document.caretRangeFromPoint ? document.caretRangeFromPoint(x, y) : null;
    if (!r && document.caretPositionFromPoint) { var cp = document.caretPositionFromPoint(x, y); if (cp) { r = document.createRange(); r.setStart(cp.offsetNode, cp.offset); } }
    if (!r || r.startContainer.nodeType !== 3) return null;
    var node = r.startContainer, txt = node.textContent, a = r.startOffset, b = a;
    while (a > 0 && /\S/.test(txt[a - 1])) a--;
    while (b < txt.length && /\S/.test(txt[b])) b++;
    if (a === b) return null;
    var rg = document.createRange(); rg.setStart(node, a); rg.setEnd(node, b);
    var rect = rg.getBoundingClientRect();
    if (x < rect.left - 2 || x > rect.right + 2 || y < rect.top - 2 || y > rect.bottom + 2) return null;
    return rg;
  }
  function scramble(rg) {
    if (reduce || scrambles.length > 6) return;
    var span = document.createElement("span"); span.className = "lifted";
    try { rg.surroundContents(span); } catch (e) { return; }
    var rect = span.getBoundingClientRect(), cs = getComputedStyle(span);
    var job = { span: span, t: span.textContent, x: rect.left + scrollX, y: rect.top + scrollY, w: rect.width, h: rect.height, font: fnt, color: col, start: performance.now(), glyphs: span.textContent.split(""), squad: [] };
    drones.filter(function (d) { return d.state === "idle"; }).slice(0, 3).forEach(function (d) { d.state = "squad"; job.squad.push(d); });
    scrambles.push(job); kick();
  }
  function updateScrambles(now, sx, sy) {
    for (var i = scrambles.length - 1; i >= 0; i--) {
      var j = scrambles[i], t = now - j.start, lift = 0, scr = false;
      if (t < 220) lift = 0;                                   // squad arrives
      else if (t < 700) { lift = -Math.min(1, (t - 220) / 180) * 26; scr = true; }   // lift + scramble
      else if (t < 1050) { var k = (t - 700) / 350; lift = -26 * (1 - k * k); scr = k < .7; }   // drop back with gravity
      else {
        var parent = j.span.parentNode; if (parent) { while (j.span.firstChild) parent.insertBefore(j.span.firstChild, j.span); parent.removeChild(j.span); parent.normalize(); }
        j.squad.forEach(function (d) { d.state = "return"; d.t0 = now; d.from = { x: d.x, y: d.y }; });
        scrambles.splice(i, 1); continue;
      }
      var cw = j.w / j.t.length, y = j.y - sy + lift;
      ctx.font = j.font; ctx.textBaseline = "middle";
      for (var c = 0; c < j.t.length; c++) {
        var ch = scr ? (Math.random() < .4 ? (j.glyphs[c] = GLYPHS[(Math.random() * GLYPHS.length) | 0]) : j.glyphs[c]) : j.t[c];
        ctx.fillStyle = scr ? INK.acc : j.color; ctx.fillText(ch, j.x - sx + c * cw, y + j.h / 2);
      }
      j.squad.forEach(function (d, n) { d.tx = j.x - sx + (n + .5) * (j.w / Math.max(1, j.squad.length)); d.ty = y - 8; });
    }
  }
  addEventListener("click", function (e) {
    if (!done || e.defaultPrevented) return;
    if (e.target.closest("a, button, input, textarea, select, label, summary, dialog")) return;
    var rg = wordAt(e.clientX, e.clientY); if (rg) scramble(rg);
  });
  // idle: the swarm spells the owner's handle, scattering on any input
  function formationPoints(text) {
    var off = document.createElement("canvas"), fs = small ? 46 : 84, oc = off.getContext("2d");
    oc.font = "700 " + fs + "px 'JetBrains Mono', monospace";
    var tw = Math.ceil(oc.measureText(text).width); off.width = tw + 4; off.height = fs + 8;
    oc.font = "700 " + fs + "px 'JetBrains Mono', monospace"; oc.textBaseline = "top"; oc.fillStyle = "#fff"; oc.fillText(text, 2, 2);
    var data = oc.getImageData(0, 0, off.width, off.height).data, pts = [], step = small ? 6 : 9;
    for (var y = 0; y < off.height; y += step) for (var x = 0; x < off.width; x += step) if (data[(y * off.width + x) * 4 + 3] > 140) pts.push([x, y]);
    var ox = small ? (W - off.width) / 2 : W - off.width - 60, oy = small ? 70 : Math.max(80, H * 0.16);
    return pts.map(function (p) { return [p[0] + ox, p[1] + oy]; });
  }
  function startFormation() {
    if (reduce || !done || document.hidden || formation) return;
    var pts = formationPoints(String(R.handle || "").toUpperCase()); if (!pts.length) return;
    formation = true;
    var h0 = hive();
    while (drones.length < pts.length) drones.push({ x: h0.x, y: h0.y, state: "idle", trail: [], seed: Math.random() * 10, extra: true });
    pts.forEach(function (p, i) { var d = drones[i]; d.state = "form"; d.fx = p[0]; d.fy = p[1]; });
    kick();
  }
  function scatter() {
    if (!formation) return; formation = false;
    var now = performance.now();
    drones.forEach(function (d) { if (d.state === "form") { d.state = "return"; d.t0 = now; d.from = { x: d.x, y: d.y }; } });
    kick();
  }
  var holdForm = 0;
  function poke() { if (performance.now() < holdForm) return; clearTimeout(idleT); scatter(); idleT = setTimeout(startFormation, 12000); }
  ["pointermove", "keydown", "scroll", "touchstart", "wheel"].forEach(function (ev) { addEventListener(ev, poke, { passive: true }); });
  poke();

  // ---------- drone carry: the swarm physically moves blocks of text to new places ----------
  var carries = [];
  function wordsOf(el) {
    var out2 = [], tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), n, re = /\S+/g, m;
    while ((n = tw.nextNode())) {
      var cs = getComputedStyle(n.parentElement), font = cs.fontWeight + " " + cs.fontSize + " " + cs.fontFamily;
      re.lastIndex = 0;
      while ((m = re.exec(n.textContent))) {
        var rg = document.createRange(); rg.setStart(n, m.index); rg.setEnd(n, m.index + m[0].length);
        var r = rg.getClientRects()[0]; if (r) out2.push({ t: m[0], x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height, font: font, color: cs.color });
      }
    }
    return out2;
  }
  // carry(items, mutate): measure each item's words, change the DOM, measure again, then fly every word old→new
  function carry(items, mutate, done2) {
    var before = items.map(wordsOf);
    mutate();
    if (reduce) { if (done2) done2(); return; }
    var after = items.map(wordsOf), now = performance.now(), job = { words: [], items: items, left: 0, done: done2 };
    items.forEach(function (it, k) {
      it.classList.add("veiled");
      // a squad of four drones rides the block's heading words and carries the whole block as one unit
      var squad = drones.filter(function (d) { return d.state === "idle"; }).slice(0, 4);
      var h0 = hive(); while (squad.length < 4) { var d0 = { x: h0.x, y: h0.y, state: "idle", trail: [], seed: Math.random() * 10, extra: true }; drones.push(d0); squad.push(d0); }
      squad.forEach(function (d) { d.state = "squad"; });
      var b0 = before[k][0] || after[k][0], a0 = after[k][0], start = now + k * 120;
      var dur = 820 + Math.min(600, Math.abs((a0 ? a0.y : 0) - (b0 ? b0.y : 0)) * .3);
      after[k].forEach(function (a, i) {
        var b = before[k][i] || a;
        job.words.push({ item: it, t: a.t, x0: b.x, y0: b.y, x1: a.x, y1: a.y, w: a.w, h: a.h, font: a.font, color: a.color, start: start, dur: dur, rider: i < 4 ? squad[i] : null, side: k % 2 ? 1 : -1 });
      });
      it._squad = squad; job.left++;
    });
    carries.push(job); kick();
  }
  function updateCarries(now, sx, sy) {
    for (var c = carries.length - 1; c >= 0; c--) {
      var job = carries[c], alive = false;
      job.words.forEach(function (w) {
        var t = Math.max(0, Math.min(1, (now - w.start) / w.dur));
        if (t < 1) alive = true;
        var e = t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;       // ease in-out: lift, cruise, set down
        var arc = Math.sin(t * Math.PI) * (50 + Math.abs(w.y1 - w.y0) * .1);   // blocks swing out sideways (alternating) while they travel
        var x = w.x0 + (w.x1 - w.x0) * e + arc * w.side, y = w.y0 + (w.y1 - w.y0) * e;
        ctx.font = w.font; ctx.textBaseline = "middle"; ctx.fillStyle = t < 1 ? INK.hi : w.color;
        ctx.fillText(w.t, x - sx, y - sy + w.h / 2);
        if (w.rider) { w.rider.tx = x - sx + w.w / 2 - 4; w.rider.ty = y - sy - 6; }
      });
      if (!alive) {
        job.items.forEach(function (it) { it.classList.remove("veiled"); (it._squad || []).forEach(function (d) { d.state = "return"; d.t0 = now; d.from = { x: d.x, y: d.y }; }); });
        carries.splice(c, 1); if (job.done) job.done();
      }
    }
  }
  // sort controls on Experience
  var jobsEl = $("jobs");
  var order0 = [].slice.call(jobsEl.children);
  var SORTS = {
    newest: function (a, b) { return order0.indexOf(a) - order0.indexOf(b); },
    oldest: function (a, b) { return order0.indexOf(b) - order0.indexOf(a); },
    learned: function (a, b) { return jobOf(b)._new.length - jobOf(a)._new.length || order0.indexOf(a) - order0.indexOf(b); }
  };
  function jobOf(li) { var id = li.id.replace(/^job-/, ""); return R.jobs.filter(function (j) { return j.id === id; })[0]; }
  document.querySelectorAll("[data-sort]").forEach(function (b) {
    b.addEventListener("click", function () {
      skipAll();
      var key = b.dataset.sort; clearDispatch();
      document.querySelectorAll("[data-sort]").forEach(function (x) { x.setAttribute("aria-pressed", x === b); });
      var items = [].slice.call(jobsEl.children);
      carry(items, function () { items.slice().sort(SORTS[key]).forEach(function (li) { jobsEl.appendChild(li); }); });
    });
  });

  // ---------- dispatch: click a skill, the swarm brings the roles that used it to the top ----------
  var dNote = $("dispatchNote");
  function clearDispatch() { [].forEach.call(jobsEl.children, function (li) { li.classList.remove("used"); var u = li.querySelector(".uses"); if (u) u.remove(); }); document.querySelectorAll(".skill.on").forEach(function (x) { x.classList.remove("on"); x.removeAttribute("aria-pressed"); }); dNote.hidden = true; }
  function dispatch(btn) {
    skipAll();
    var skill = btn.dataset.skill, used = D.usedAt(skill).map(function (j) { return "job-" + j.id; });
    clearDispatch();
    btn.classList.add("on"); btn.setAttribute("aria-pressed", "true");
    document.querySelectorAll("[data-sort]").forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
    dNote.hidden = false;
    dNote.innerHTML = used.length ? "&gt; " + esc(skill) + ": used at " + used.length + " role" + (used.length > 1 ? "s" : "") + ' · <button type="button" id="dispatchX">clear</button>'
      : "&gt; " + esc(skill) + ': not tagged on a role yet · <button type="button" id="dispatchX">clear</button>';
    $("dispatchX").addEventListener("click", function () { var items = [].slice.call(jobsEl.children); clearDispatch(); document.querySelectorAll("[data-sort]").forEach(function (x) { x.setAttribute("aria-pressed", x.dataset.sort === "newest"); }); carry(items, function () { items.slice().sort(SORTS.newest).forEach(function (li) { jobsEl.appendChild(li); }); }); });
    $("exp-h").scrollIntoView({ block: "start" });
    if (!used.length) return;
    var items = [].slice.call(jobsEl.children);
    requestAnimationFrame(function () {
      carry(items, function () {
        items.forEach(function (li) { if (used.indexOf(li.id) > -1) { li.classList.add("used"); var u = document.createElement("div"); u.className = "uses"; u.textContent = "◆ used " + skill + " here"; li.insertBefore(u, li.children[1] || null); } });
        items.slice().sort(function (a, b) { return (used.indexOf(b.id) > -1) - (used.indexOf(a.id) > -1) || order0.indexOf(a) - order0.indexOf(b); }).forEach(function (li) { jobsEl.appendChild(li); });
      });
    });
  }
  $("systems").addEventListener("click", function (e) { var b = e.target.closest(".skill"); if (b) dispatch(b); });

  // ---------- swarm board: the résumé as cards the swarm arranges ----------
  var docEl = $("doc"), arrange = $("arrange");
  function cards() { return [document.querySelector(".hero")].concat([].slice.call(jobsEl.children)).concat([$("sys-h").parentElement, $("contact")]); }
  function setView(v) {
    skipAll();
    document.querySelectorAll("[data-view]").forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.view === v); });
    arrange.hidden = v !== "board";
    carry(cards(), function () { document.body.classList.toggle("board", v === "board"); });
  }
  document.querySelectorAll("[data-view]").forEach(function (b) { b.addEventListener("click", function () { setView(b.dataset.view); }); });
  var ARR = {
    time: SORTS.newest,
    company: function (a, b) { var ca = jobOf(a).company, cb = jobOf(b).company; return ca === cb ? order0.indexOf(a) - order0.indexOf(b) : ca.localeCompare(cb); },
    learned: SORTS.learned
  };
  document.querySelectorAll("[data-arr]").forEach(function (b) {
    b.addEventListener("click", function () {
      document.querySelectorAll("[data-arr]").forEach(function (x) { x.setAttribute("aria-pressed", x === b); });
      var items = [].slice.call(jobsEl.children);
      carry(items, function () { items.slice().sort(ARR[b.dataset.arr]).forEach(function (li) { jobsEl.appendChild(li); }); });
    });
  });
  // drag a job card: on drop, a squad ferries it to the slot under the pointer
  var dragLi = null;
  jobsEl.addEventListener("pointerdown", function (e) {
    if (!document.body.classList.contains("board") || e.target.closest("a, button")) return;
    dragLi = e.target.closest(".job"); if (dragLi) { dragLi.classList.add("grab"); e.preventDefault(); }
  });
  addEventListener("pointerup", function (e) {
    if (!dragLi) return;
    var li = dragLi; dragLi = null; li.classList.remove("grab");
    var target = document.elementFromPoint(e.clientX, e.clientY), over = target && target.closest(".job");
    if (!over || over === li) return;
    var items = [].slice.call(jobsEl.children);
    carry(items, function () { var r2 = over.getBoundingClientRect(); jobsEl.insertBefore(li, e.clientY > r2.top + r2.height / 2 || e.clientX > r2.left + r2.width / 2 ? over.nextSibling : over); });
  });

  // ---------- type to find: matches glow, the swarm hovers over them ----------
  var findBar = $("find"), findIn = $("findIn"), findN = $("findN"), hits = [], hitI = -1;
  function clearGather() { gatherEl.hidden = true; gatherEl.innerHTML = ""; }
  function clearHits() {
    clearGather();
    hits.forEach(function (m) { var p2 = m.parentNode; if (!p2) return; p2.replaceChild(document.createTextNode(m.textContent), m); p2.normalize(); });
    hits = []; hitI = -1;
    drones.forEach(function (d) { if (d.state === "hover") { d.state = "return"; d.t0 = performance.now(); d.from = { x: d.x, y: d.y }; } });
  }
  function find(q) {
    clearHits();
    q = (q || "").trim().toLowerCase();
    if (q.length < 2) { findN.textContent = q ? "keep typing…" : ""; setFindHash(""); kick(); return; }
    var root = $("doc"), tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), nodes = [], n;
    while ((n = tw.nextNode())) if (n.textContent.toLowerCase().indexOf(q) > -1 && !n.parentElement.closest(".hint")) nodes.push(n);
    nodes.forEach(function (node) {
      var txt = node.textContent, low = txt.toLowerCase(), i = low.indexOf(q), cur = node;
      while (i > -1) {
        var after = cur.splitText(i), rest = after.splitText(q.length), mk = document.createElement("mark");
        mk.className = "hit"; after.parentNode.replaceChild(mk, after); mk.appendChild(after); hits.push(mk);
        cur = rest; low = cur.textContent.toLowerCase(); i = low.indexOf(q);
      }
    });
    findN.textContent = hits.length ? hits.length + " match" + (hits.length > 1 ? "es" : "") + " · enter = next" : "no matches";
    gatherBtn.hidden = hits.length < 2;
    // dispatch the swarm: one drone per match (reinforcements launch if needed)
    var h0 = hive(), need = Math.min(hits.length, 40);
    while (!reduce && drones.filter(function (d) { return d.state === "idle" || d.state === "hover"; }).length < need) drones.push({ x: h0.x, y: h0.y, state: "idle", trail: [], seed: Math.random() * 10, extra: true });
    var free = drones.filter(function (d) { return d.state === "idle"; });
    hits.slice(0, need).forEach(function (m, k) { var d = free[k]; if (!d) return; d.state = "hover"; d.mark = m; });
    setFindHash(q); kick();
  }
  // gather: the swarm copies every matching line into a stack under the find bar
  var gatherEl = $("gather"), gatherBtn = $("gatherBtn");
  function lineOf(m) { return m.closest("li, p, h1, h2, .job-h, .job-m, dd, dt, div") || m.parentElement; }
  function gather() {
    if (!hits.length) return;
    clearGather(); gatherEl.hidden = false;
    var seen = [], now = performance.now(), h0 = hive();
    hits.forEach(function (m) {
      var line = lineOf(m); if (seen.indexOf(line) > -1 || seen.length >= 12) return; seen.push(line);
      var full = line.textContent.replace(/\s+/g, " ").trim(), q = findIn.value.trim().toLowerCase(), at = full.toLowerCase().indexOf(q);
      var a = Math.max(0, at - 30), text = (a ? "…" : "") + full.slice(a, a + 80) + (a + 80 < full.length ? "…" : "");
      var li = document.createElement("li"), b = document.createElement("button");
      b.type = "button"; b.textContent = text; b.addEventListener("click", function () { hits.forEach(function (x) { x.classList.remove("cur"); }); m.classList.add("cur"); hitI = hits.indexOf(m); m.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" }); });
      li.appendChild(b); gatherEl.appendChild(li); li._src = m;
    });
    if (reduce) return;
    [].forEach.call(gatherEl.children, function (li, k) {
      var r0 = li._src.getBoundingClientRect(), b = li.firstChild, r1 = b.getBoundingClientRect(), cs = getComputedStyle(b);
      var vis0 = r0.bottom > 0 && r0.top < innerHeight, col = cs.color, fnt = cs.fontWeight + " " + cs.fontSize + " " + cs.fontFamily, pl = parseFloat(cs.paddingLeft);
      b.classList.add("lifted");
      var d = { x: h0.x, y: h0.y, state: "ferry", trail: [], seed: Math.random() * 10, extra: true }; drones.push(d);
      ferries.push({ el: b, text: b.textContent, font: fnt, color: col,
        x0: vis0 ? r0.left : r1.left, y0: vis0 ? r0.top + r0.height / 2 : innerHeight + 30, x1: r1.left + pl, y1: r1.top + r1.height / 2,
        start: now + k * 110, dur: 700 + (vis0 ? 0 : 200), drone: d });
    });
    kick();
  }
  gatherBtn.addEventListener("click", gather);
  function nextHit() {
    if (!hits.length) return;
    if (hitI > -1 && hits[hitI]) hits[hitI].classList.remove("cur");
    hitI = (hitI + 1) % hits.length; hits[hitI].classList.add("cur");
    hits[hitI].scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
  }
  function setFindHash(q) { try { history.replaceState(null, "", location.pathname + location.search + (q ? "#find=" + encodeURIComponent(q) : "")); } catch (e) {} }
  function openFind(focusInput) { findBar.hidden = false; if (focusInput) findIn.focus(); }
  function closeFind() { findIn.value = ""; find(""); findBar.hidden = true; }
  findIn.addEventListener("input", function () { find(findIn.value); });
  findIn.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); nextHit(); } else if (e.key === "Escape") { closeFind(); findIn.blur(); } });
  $("findX").addEventListener("click", closeFind);
  $("findBtn").addEventListener("click", function () { if (findBar.hidden) openFind(true); else closeFind(); });
  addEventListener("keydown", function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey || /input|textarea|select/i.test(e.target.tagName)) return;
    if (e.key.length === 1 && (/[a-z.#+\/-]/i.test(e.key) || (!findBar.hidden && /\d/.test(e.key))) && e.key !== "?") { openFind(true); findIn.value += e.key; find(findIn.value); e.preventDefault(); }
    else if (e.key === "Escape" && !findBar.hidden) closeFind();
  });
  function hoverDrones(sx, sy) {
    drones.forEach(function (d) {
      if (d.state !== "hover" || !d.mark) return;
      var r2 = d.mark.getBoundingClientRect();
      d.tx = r2.left + r2.width / 2 + Math.sin(performance.now() / 300 + d.seed) * 4; d.ty = r2.top - 8;
    });
  }

  // phosphor repaint: a line of drones sweeps down the screen and the new colours follow behind it
  var phBtn = $("phosphor");
  function curTheme() { return document.documentElement.dataset.theme || "green"; }
  function labelPh() { if (phBtn) phBtn.innerHTML = "phosphor: " + curTheme() + " <kbd>9</kbd>"; }
  function applyTheme(t) {
    if (t === "green") delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = t;
    try { localStorage.setItem("phosphor", t); } catch (e) {}
    readInk(); labelPh(); if (window.__wakeAmbient) window.__wakeAmbient();
    var mc = document.querySelector('meta[name="theme-color"]'); if (mc) mc.content = getComputedStyle(document.documentElement).getPropertyValue("--bg").trim();
  }
  function sweep() {
    var n = Math.min(drones.length, small ? 10 : 18), row = drones.filter(function (d) { return d.state === "idle"; }).slice(0, n), t0 = performance.now();
    row.forEach(function (d, k) { d.state = "sweep"; d.sx = (k + .5) * W / row.length; });
    sweeps.push({ t0: t0, row: row });
    kick();
  }
  var sweeps = [];
  function updateSweeps(now) {
    for (var i = sweeps.length - 1; i >= 0; i--) {
      var s = sweeps[i], t = Math.min(1, (now - s.t0) / 900), e = t;
      s.row.forEach(function (d, k) { d.x = d.sx + Math.sin(now / 90 + k) * 3; d.y = e * H - 6; });
      if (t >= 1) { sweeps.splice(i, 1); s.row.forEach(function (d) { d.state = "return"; d.t0 = now; d.from = { x: d.x, y: d.y }; }); }
    }
  }
  function nextTheme() {
    var t = THEMES[(THEMES.indexOf(curTheme()) + 1) % THEMES.length];
    if (reduce || !document.startViewTransition) { applyTheme(t); return; }
    skipAll();
    var vt = document.startViewTransition(function () { applyTheme(t); });
    vt.ready.then(sweep, function () {});
  }
  if (phBtn) { labelPh(); phBtn.addEventListener("click", nextTheme); }

  // ---------- ambient rain: faint glyph columns behind the text that part around the pointer ----------
  (function ambient() {
    var cv = $("amb"); if (!cv || reduce) { if (cv) cv.remove(); return; }
    var c2 = cv.getContext("2d"), cols = [], CW = 22, last = 0, lastPoke = performance.now(), on = false, dpr = Math.min(2, devicePixelRatio || 1), AW, AH, DL = 0, DR = 0;
    function size() {
      AW = innerWidth; AH = innerHeight; cv.width = AW * dpr; cv.height = AH * dpr; c2.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.ceil(AW / CW); cols = []; var dr = $("doc").getBoundingClientRect(); DL = dr.left + 10; DR = dr.right - 10;
      for (var i = 0; i < n; i++) cols.push({ y: Math.random() * AH, v: 40 + Math.random() * 90, len: 6 + (Math.random() * 14 | 0), g: [], a: .05 + Math.random() * .07 });
    }
    function glyph() { return GLYPHS[(Math.random() * GLYPHS.length) | 0]; }
    function tick(now) {
      on = false;
      if (document.hidden || document.documentElement.dataset.theme === "paper" || now - lastPoke > 20000) { c2.clearRect(0, 0, AW, AH); return; }
      on = true; requestAnimationFrame(tick);
      if (now - last < 50) return;                       // ~20 fps is plenty for background drizzle
      var dt = Math.min(.1, (now - last) / 1000); last = now;
      c2.clearRect(0, 0, AW, AH);
      c2.font = "14px 'JetBrains Mono', monospace"; c2.textBaseline = "top";
      var px = pointer.on && now - pointer.t < 3000 ? pointer.x : -999, py = pointer.y;
      for (var i = 0; i < cols.length; i++) {
        var col = cols[i]; col.y += col.v * dt;
        if (col.y - col.len * 18 > AH) { col.y = -Math.random() * 200; col.v = 40 + Math.random() * 90; }
        if (Math.random() < .3) col.g[(Math.random() * col.len) | 0] = glyph();
        var x0 = i * CW + 4;
        for (var k = 0; k < col.len; k++) {
          var y = col.y - k * 18; if (y < -18 || y > AH) continue;
          var x = x0, dx = x - px, dy = y - py, d2 = dx * dx + dy * dy;
          if (d2 < 9000) x += (dx >= 0 ? 1 : -1) * (95 - Math.sqrt(d2)) * .6;      // part around the pointer
          for (var j = 0; j < drones.length; j += 3) { var dd = drones[j]; if (dd.state !== "idle" && Math.abs(dd.x - x) < 26 && Math.abs(dd.y - y) < 26) x += dd.x < x ? 14 : -14; }
          var al = k === 0 ? col.a * 2.2 : col.a * (1 - k / col.len); if (x > DL && x < DR) al *= .4;     // quieter behind the reading column
          c2.fillStyle = "rgba(" + INK.rgb + "," + al + ")";
          c2.fillText(col.g[k] || (col.g[k] = glyph()), x, y);
        }
      }
    }
    function wake() { lastPoke = performance.now(); if (!on) { last = 0; requestAnimationFrame(tick); } }
    size(); addEventListener("resize", size);
    ["pointermove", "keydown", "scroll", "touchstart", "wheel"].forEach(function (ev) { addEventListener(ev, wake, { passive: true }); });
    document.addEventListener("visibilitychange", wake);
    window.__wakeAmbient = wake;
    wake();
  })();

  // ---------- hail relay: copy the email; a squad carries the address into the hive ----------
  var toast = document.createElement("p"); toast.className = "relay-toast"; toast.setAttribute("role", "status"); toast.hidden = true; document.body.appendChild(toast);
  function say(msg) { toast.textContent = msg; toast.hidden = false; clearTimeout(say.t); say.t = setTimeout(function () { toast.hidden = true; }, 2600); }
  function copyText(t) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(t);
    return new Promise(function (res, rej) { var ta = document.createElement("textarea"); ta.value = t; ta.style.position = "fixed"; ta.style.opacity = "0"; document.body.appendChild(ta); ta.select(); try { document.execCommand("copy") ? res() : rej(); } catch (e) { rej(e); } ta.remove(); });
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-copy]"); if (!b) return;
    var a = b.previousElementSibling, addr = R.email;
    copyText(addr).then(function () {
      b.textContent = "[ copied ]"; setTimeout(function () { b.textContent = "[ copy ]"; }, 2600);
      if (reduce) { say("> " + addr + " copied to clipboard"); return; }
      skipAll();
      var r0 = a.getBoundingClientRect(), cs = getComputedStyle(a), h0 = hive(), now = performance.now();
      // the address breaks into a few chunks; each chunk gets its own drone
      var parts = addr.match(/.{1,6}/g), cw = r0.width / addr.length;
      parts.forEach(function (p, k) {
        var d = { x: h0.x, y: h0.y, state: "ferry", trail: [], seed: Math.random() * 10, extra: true }; drones.push(d);
        ferries.push({ el: b, text: p, font: cs.fontWeight + " " + cs.fontSize + " " + cs.fontFamily, color: INK.acc,
          x0: r0.left + k * 6 * cw, y0: r0.top + r0.height / 2, x1: h0.x - 10 + (k % 3) * 4, y1: h0.y, start: now + k * 90, dur: 760, drone: d });
      });
      kick();
      setTimeout(function () { say("> copied: " + addr); }, 760 + parts.length * 90);
    }, function () { say("> couldn't copy. long-press the address instead"); });
  });

  // ---------- motion switch: lets visitors whose system reduces motion turn the swarm on (and anyone turn it off) ----------
  function setMotion(on) { try { localStorage.setItem("motion", on ? "on" : "off"); sessionStorage.removeItem("rained"); } catch (e) {} location.reload(); }
  var mNote = $("motionNote");
  if (mNote && reduce) {
    mNote.hidden = false;
    mNote.innerHTML = osReduce && motionPref !== "off" ? '// animation is paused because your device is set to reduce motion · <button type="button" id="motionOn">[ play the swarm anyway ]</button>'
      : '// animation is off · <button type="button" id="motionOn">[ turn it back on ]</button>';
    $("motionOn").addEventListener("click", function () { setMotion(true); });
  }
  var mBtn = document.querySelector('[data-order="motion"]');
  if (mBtn) mBtn.innerHTML = reduce ? "motion: off · turn on" : "motion: on · turn off";

  // ---------- hive menu: every swarm order in one place (reachable on phones too) ----------
  var hiveBtn = $("hiveBtn"), menu = $("swarmMenu");
  if (reduce) menu.querySelectorAll('[data-order="replay"], [data-order="form"]').forEach(function (b) { b.hidden = true; });
  function setMenu(open) {
    menu.hidden = !open; hiveBtn.setAttribute("aria-expanded", open);
    if (open) { var f = menu.querySelector("button:not([hidden])"); if (f) f.focus(); }
  }
  hiveBtn.addEventListener("click", function () { setMenu(menu.hidden); });
  document.addEventListener("click", function (e) { if (!menu.hidden && !menu.contains(e.target) && e.target !== hiveBtn && !hiveBtn.contains(e.target)) setMenu(false); });
  menu.addEventListener("keydown", function (e) {
    var bs = [].slice.call(menu.querySelectorAll("button")).filter(function (b) { return !b.hidden && b.offsetParent; }), i = bs.indexOf(document.activeElement);
    if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); setMenu(false); hiveBtn.focus(); }
    else if (e.key === "ArrowDown") { e.preventDefault(); bs[(i + 1) % bs.length].focus(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); bs[(i - 1 + bs.length) % bs.length].focus(); }
  });
  menu.addEventListener("click", function (e) {
    var b = e.target.closest("[data-order]"); if (!b) return;
    var o = b.dataset.order;
    if (o !== "phosphor") setMenu(false);
    if (o === "replay") recall();
    else if (o === "form") { skipAll(); holdForm = performance.now() + 2500; scatter(); startFormation(); }
    else if (o === "board") setView(document.body.classList.contains("board") ? "doc" : "board");
    else if (o === "phosphor") nextTheme();
    else if (o === "keys") keys.showModal();
    else if (o === "motion") setMotion(reduce);
    else { var sb = document.querySelector('[data-sort="' + o + '"]'); $("exp-h").scrollIntoView({ block: "start" }); requestAnimationFrame(function () { sb.click(); }); }
  });

  // ---------- channels: jump between sections; the destination re-rains as you arrive ----------
  var chans = [].slice.call(document.querySelectorAll("[data-ch]"));
  function sectionFor(n) { return n === 1 ? document.querySelector(".hero") : n === 2 ? $("exp-h").parentElement : n === 3 ? $("sys-h").parentElement : $("contact"); }
  function channel(n) {
    var sec = sectionFor(n); if (!sec) return;
    skipAll();
    sec.scrollIntoView({ block: "start" });
    if (reduce) return;
    requestAnimationFrame(function () {
      sec._rained = false; sec.classList.add("veiled");
      quick = true; rainBlock(sec, performance.now(), false); quick = false;
      kick();
    });
  }
  chans.forEach(function (a) { a.addEventListener("click", function (e) { e.preventDefault(); channel(+a.dataset.ch); }); });
  var keys = $("keys");
  $("keysBody").textContent = [
    "KEYS", "",
    "  1-4        jump to home / experience / systems / contact",
    "  a-z        start typing to find anything on the page",
    "  enter      next match        esc   clear the find",
    "  click      any word: the swarm lifts and re-drops it",
    "  0          replay: the swarm reels the page up and rains it again",
    "  9          phosphor: green / amber / ice / paper",
    "  hive       tap the swarm (bottom right) for every order",
    "  ?          this list", "",
    "LINKS", "",
    "  #find=php  open with a search already running",
    "",
    "Leave the page idle for a moment and the swarm signs its name."
  ].join("\n");
  $("keysX").addEventListener("click", function () { keys.close(); });
  addEventListener("keydown", function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey || /input|textarea|select/i.test(e.target.tagName)) return;
    if (/^[1-4]$/.test(e.key) && findBar.hidden) { e.preventDefault(); channel(+e.key); }
    if (e.key === "0" && findBar.hidden) { e.preventDefault(); recall(); }
    if (e.key === "9" && findBar.hidden) { e.preventDefault(); nextTheme(); }
    if (e.key === "Escape" && !menu.hidden) { setMenu(false); hiveBtn.focus(); }
    else if (e.key === "?") { e.preventDefault(); skipAll(); if (keys.showModal && !keys.open) keys.showModal(); }
  });
  if ("IntersectionObserver" in window) {
    var chio = new IntersectionObserver(function () {
      var cur = 1; [2, 3, 4].forEach(function (n) { var s2 = sectionFor(n); if (s2 && s2.getBoundingClientRect().top < innerHeight * .4) cur = n; });
      chans.forEach(function (a) { a.classList.toggle("on", +a.dataset.ch === cur); });
    }, { threshold: [0, .5, 1] });
    [1, 2, 3, 4].forEach(function (n) { var s2 = sectionFor(n); if (s2) chio.observe(s2); });
  }

  // ---------- 3. go: veil, then rain the hero first and the rest as it scrolls into view ----------
  size();
  if (reduce) { done = true; $("skip").hidden = true; canvas.style.display = "none"; }
  else { blocks.forEach(function (b) { b.classList.add("veiled"); }); makeDrones(small ? 16 : 24); }
  var io = null;
  var ready = document.fonts && document.fonts.ready ? Promise.race([document.fonts.ready, new Promise(function (r) { setTimeout(r, 900); })]) : Promise.resolve();
  ready.then(function () {
    if (done || reduce) return;
    var GATHER = quick ? 0 : 650;
    if (GATHER) { startGather(GATHER); kick(); }
    var t = performance.now() + 80 + GATHER;
    var hero = blocks.filter(function (b) { return b.dataset.priority; });
    hero.forEach(function (b) { rainBlock(b, t, true); });
    blocks.filter(function (b) { return b.classList.contains("top"); }).forEach(function (b) { rainBlock(b, t + 200, true); });
    if ("IntersectionObserver" in window) {
      io = new IntersectionObserver(function (en) {
        en.forEach(function (x) { if (x.isIntersecting && !x.target._rained) rainBlock(x.target, performance.now(), false); });
      }, { rootMargin: "0px 0px -10% 0px" });
      blocks.forEach(function (b) { if (!b._rained) io.observe(b); });
    } else skipAll();
  });
  function findFromHash() {
    var fm = decodeURIComponent(location.hash).match(/^#find=(.+)$/);
    if (fm && fm[1] !== findIn.value) { skipAll(); setTimeout(function () { openFind(false); findIn.value = fm[1]; find(fm[1]); if (hits[0]) nextHit(); }, 50); }
  }
  findFromHash(); addEventListener("hashchange", findFromHash);
  $("skip").addEventListener("click", skipAll);
  addEventListener("keydown", function (e) { if (!e.metaKey && !e.ctrlKey) skipAll(); });
  addEventListener("click", function (e) { if (e.target.id !== "skip") skipAll(); }, true);
  addEventListener("resize", function () { size(); skipAll(); });
  document.addEventListener("visibilitychange", function () { if (document.hidden) skipAll(); });
})();

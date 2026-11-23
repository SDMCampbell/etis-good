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
  function hive() { return { x: W - 44, y: H - 92 }; }
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
    // tractor mode: when nothing is growing, driving or flying, the lawn only sways, so 30 fps is plenty
    if (tractor && !reduce && !active.length && !fieldBusy(now) && now - lastFieldDraw < 32) { raf = requestAnimationFrame(frame); return; }
    lastFieldDraw = now;
    ctx.clearRect(0, 0, W, H);
    var sy = scrollY, sx = scrollX, h = hive();
    drawGather(now);
    if (tractor) drawField(now, sx, sy);
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
    var pActive = done && !tractor && pointer.on && now - pointer.t < 2500;
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
    if ((tractor && (driver || !reduce && (fieldBusy(now) || now - lastInput < 10000))) || active.length || moving || gather || surveys.length || scrambles.length || carries.length || lifts.length || ferries.length || sweeps.length || words.some(function (x) { return x.block._left > 0; })) raf = requestAnimationFrame(frame);
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
    if (tractor) return drawTractor(d);
    ctx.textBaseline = "middle"; ctx.font = "700 14px 'JetBrains Mono', monospace";
    for (var i = 0; i < d.trail.length - 1; i++) { ctx.fillStyle = "rgba(" + INK.rgb + "," + (0.08 * (i + 1)) + ")"; ctx.fillText("▮", d.trail[i][0], d.trail[i][1]); }
    ctx.fillStyle = d.state === "idle" ? "rgba(" + INK.rgb + ",.55)" : INK.acc;
    ctx.shadowColor = INK.acc; ctx.shadowBlur = d.state === "idle" ? 0 : 8;
    ctx.fillText("▸", d.x, d.y); ctx.shadowBlur = 0;
  }
  function finish() {
    if (!tractor) ctx.clearRect(0, 0, W, H);   // in tractor mode with reduced motion the grass is drawn once and has to stay
    var pending = blocks.filter(function (b) { return !b._rained; });
    if (!pending.length) { done = true; $("skip").hidden = true; }
  }
  function skipAll() {
    if (intro) { var it = intro; intro = null; it.skip(); }
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
    if (!done || e.defaultPrevented || tractor) return;
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
  function poke() { if (performance.now() < holdForm) return; clearTimeout(idleT); scatter(); idleT = setTimeout(function () { if (!tractor) startFormation(); }, 12000); }
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
      if (document.hidden || document.documentElement.dataset.theme === "paper" || document.documentElement.classList.contains("tractor") || now - lastPoke > 20000) { c2.clearRect(0, 0, AW, AH); return; }
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

  // ---------- tractor mode: the swarm turns into tractors and the text itself becomes grass ----------
  // Every word is re-drawn as sod: its letterforms are filled with a grass texture and blades sprout from the letters'
  // top edges. Tractors till each line (soil first), then the letters rise out of the ground and grow. Clicking grass
  // sends a tractor to mow it: the letters are cut away, leaving clippings and stubble.
  // The real text stays in the page, invisible (screen readers, find and copy still work).
  var tractor = false, field = [], tractorBar = $("tractorBar"), clips = [];
  var MOWABLE = "p, li, h1, h2, h3, a, button, .who, .sys, dd, dt, label, #stamp";
  var fieldBusyUntil = 0, lastInput = performance.now(), lastFieldDraw = 0;
  function fieldBusy(now) { return !!driver || now < fieldBusyUntil || growQ.length > 0 || clips.length > 0 || field.some(function (l) { return l.drone; }); }
  ["pointermove", "keydown", "scroll", "touchstart", "wheel"].forEach(function (ev) { addEventListener(ev, function () { lastInput = performance.now(); if (tractor && !reduce && !raf) kick(); }, { passive: true }); });
  var GROW = 1700, DPR = Math.min(2, devicePixelRatio || 1);
  var BLADE = ["#2e7a2f", "#3b8f37", "#4aa443", "#5bb84f", "#73c95e", "#8fd86f"];
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function buildField() {
    field = []; clips = [];
    blocks.forEach(function (b) {
      var line = null;
      measure(b).forEach(function (w) {
        if (!line || Math.abs(w.y - line.y) > 4 || w.block !== line.block) {
          line = { block: b, y: w.y, h: w.h, x0: w.x, x1: w.x + w.w, fixed: w.fixed, words: [], state: "raw", drone: null, mode: null };
          field.push(line);
        }
        w.ct = w.t.split("").map(function () { return reduce ? -1e9 : null; });   // when each letter was tilled
        w.mt = w.t.split("").map(function () { return null; });                  // when each letter was mowed
        w.cw = w.w / w.t.length;
        w.gj = w.t.split("").map(function () { return rnd(0, 380); });       // letters don't all grow in lockstep
        w.gs = w.t.split("").map(function () { return rnd(.8, 1.25); });
        line.words.push(w); line.x1 = Math.max(line.x1, w.x + w.w);
      });
    });
    field.forEach(function (ln) { ln.words.forEach(function (w) { w.mowEl = elAtWord(w); }); });
  }
  function elAtWord(w) {
    var vx = w.x - scrollX + w.w / 2, vy = w.y - (w.fixed ? 0 : scrollY) + w.h / 2;
    if (vy < 0 || vy > innerHeight || vx < 0 || vx > innerWidth) return undefined;   // off screen: work it out later
    var hit = document.elementsFromPoint(vx, vy).filter(function (n) { return n !== canvas && n.id !== "amb"; })[0];
    return (hit && hit.closest(MOWABLE)) || null;
  }
  // sod: the word's letters filled with grass, plus the blades that grow from their top edges (built once per word)
  function sodOf(w) {
    if (w.sod) return w.sod;
    var top = Math.ceil(w.h * .75), pad = 2, cw = w.cw, Wc = Math.ceil(w.w) + pad * 2, Hc = Math.ceil(w.h) + top + 2;
    var c = document.createElement("canvas"); c.width = Wc * DPR; c.height = Hc * DPR;
    var g = c.getContext("2d"); g.scale(DPR, DPR); g.font = w.font; g.textBaseline = "middle"; g.fillStyle = "#000";
    var midY = top + w.h / 2;
    for (var i = 0; i < w.t.length; i++) g.fillText(w.t[i], pad + i * cw, midY);
    var md = g.getImageData(0, 0, c.width, c.height).data, cwid = c.width;
    function on(px, py) { return px >= 0 && py >= 0 && px < cwid && py < c.height && md[(py * cwid + px) * 4 + 3] > 110; }
    // fill the letters: dark roots, bright tips, and a fibrous texture of tiny strokes
    g.globalCompositeOperation = "source-in";
    var gr = g.createLinearGradient(0, top, 0, top + w.h); gr.addColorStop(0, "#b4ee8c"); gr.addColorStop(.55, "#68c457"); gr.addColorStop(1, "#347d33");
    g.fillStyle = gr; g.fillRect(0, 0, Wc, Hc);
    g.globalCompositeOperation = "source-atop"; g.lineWidth = .7;
    for (var k = 0, n = Wc * Hc / 5; k < n; k++) {
      var x = Math.random() * Wc, y = Math.random() * Hc;
      g.strokeStyle = Math.random() < .5 ? "rgba(20,70,25,.45)" : "rgba(190,245,150,.35)";
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + rnd(-.8, .8), y - rnd(1.5, 4)); g.stroke();
    }
    // blades root on the letters' top edges (every second pixel column, all edges: tops of arches, bars and dots)
    var tufts = [], base = top + w.h * .82;
    var small = w.h < 20, stepX = small ? 3 : 2, lenK = small ? .55 : 1;
    for (var xs = 0; xs < Wc; xs += stepX) {
      var px = Math.round(xs * DPR);
      for (var py = 1; py < c.height; py++) {
        if (on(px, py) && !on(px, py - 1)) {
          var ry = py / DPR; if (ry > base - 1) continue;
          var ci = Math.max(0, Math.min(w.t.length - 1, Math.floor((xs - pad) / cw)));
          if (small && Math.random() < .35) continue;
          tufts.push({ x: xs, y: ry + .8, ci: ci, L: w.h * rnd(.22, .55) * lenK, lean: rnd(-.35, .35), wd: rnd(1, 2.1),
            col: BLADE[(Math.random() * BLADE.length) | 0], delay: rnd(.2, .6), ph: rnd(0, 6.3), curl: rnd(.6, 1.4) * (Math.random() < .5 ? -1 : 1), back: Math.random() < .4 });
        }
      }
    }
    // turf edge: the same letterforms in soil colours, stacked underneath to give each letter thickness
    var so = document.createElement("canvas"); so.width = c.width; so.height = c.height;
    var sg = so.getContext("2d"); sg.drawImage(c, 0, 0); sg.globalCompositeOperation = "source-in";
    var sgr = sg.createLinearGradient(0, 0, 0, so.height); sgr.addColorStop(0, "#6b4626"); sgr.addColorStop(1, "#3a2412");
    sg.fillStyle = sgr; sg.fillRect(0, 0, so.width, so.height);
    var sh = document.createElement("canvas"); sh.width = c.width; sh.height = c.height;
    var hg = sh.getContext("2d"); hg.drawImage(c, 0, 0); hg.globalCompositeOperation = "source-in"; hg.fillStyle = "rgba(0,0,0,.55)"; hg.fillRect(0, 0, sh.width, sh.height);
    w.sod = { c: c, soil: so, shadow: sh, top: top, pad: pad, Wc: Wc, Hc: Hc, base: base, tufts: tufts, depth: w.h >= 20 ? Math.max(2, Math.min(7, w.h * .16)) : 0 };   // small text stays flat so it stays readable
    return w.sod;
  }
  function easeOutBack(t) { var c1 = 1.5; return 1 + (c1 + 1) * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); }
  var lush = 1, storm = 0, drops = [], stormUntil = 0;
  function gust(x, now) { var v = Math.sin(now * (.0007 + storm * .0006) - x * .006); return v > 0 ? v * v * v * (.28 + storm * .35) : 0; }
  // a blade: tapered leaf, darker edge, light midrib; it unrolls from a curl as it grows (unfurl 0 → 1)
  function drawLeaf(rx, ry, l, lean, wd, col, unfurl, curl, back) {
    var bend = lean + curl * (1 - unfurl) * .9;                       // still-curled blades hook over
    var tx = rx + l * bend, ty = ry - l * Math.max(.25, 1 - .45 * bend * bend);
    var mx = rx + (tx - rx) * .25, my = ry - l * .6;
    ctx.globalAlpha = back ? .72 : .95;
    ctx.fillStyle = back ? "#245f27" : (lush > 1.15 && col !== "#2e7a2f" ? "#3fa83c" : col); ctx.beginPath();
    ctx.moveTo(rx - wd / 2, ry);
    ctx.quadraticCurveTo(mx - wd * .35, my, tx, ty);
    ctx.quadraticCurveTo(mx + wd * .45, my + l * .04, rx + wd / 2, ry);
    ctx.fill();
    if (!back && l > 5) {                                            // midrib catches the light
      ctx.strokeStyle = "rgba(210,255,170,.45)"; ctx.lineWidth = .5; ctx.beginPath();
      ctx.moveTo(rx, ry - 1); ctx.quadraticCurveTo(mx, my, rx + (tx - rx) * .85, ry + (ty - ry) * .85); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  // a fresh shoot breaking the soil: a small hooked sprout that straightens as it rises
  function drawShoot(x, y, k, side) {
    var h = 2 + k * 7, hook = (1 - k) * 3 * side;
    ctx.strokeStyle = "rgba(150,215,100," + (.6 + k * .4) + ")"; ctx.lineWidth = 1.2; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + hook * .2, y - h * .7, x + hook, y - h); ctx.stroke();
  }
  function letterG(w, i, now) { return (now - w.ct[i] - 150 - w.gj[i]) / (GROW * w.gs[i]); }   // 0 → 1 growth of one letter
  function drawTufts(w, sod, dx, anchor, now, backPass) {
    for (var k = 0; k < sod.tufts.length; k++) {
      var t = sod.tufts[k], ci = t.ci;
      if (t.back !== backPass || w.ct[ci] === null || w.mt[ci] !== null) continue;
      var g = letterG(w, ci, now); if (g <= t.delay) continue;
      var q = Math.min(1, (g - t.delay) / (1 - t.delay)), qe = 1 - Math.pow(1 - q, 3);
      var gb2 = easeOutBack(Math.max(0, Math.min(1, (g - .22) / .5)));
      var rx = dx + t.x, ry = anchor - (sod.base - t.y) * gb2, l = t.L * qe * (backPass ? .85 : 1) * lush;
      var sway = reduce ? 0 : (Math.sin(now * .0017 + t.ph) * .1 + gust(rx, now)) * qe;
      drawLeaf(rx, ry, l, t.lean + sway, t.wd, t.col, Math.min(1, q * 1.3), t.curl, backPass);
    }
  }
  function drawWordGrass(w, sx, oy, now) {
    var sod = sodOf(w), dx = w.x - sx - sod.pad, dTop = w.y - oy - sod.top, anchor = dTop + sod.base, cw = w.cw, i;
    // soil: a tilled furrow under every letter the tractor has passed, darkest just after tilling
    for (i = 0; i < w.t.length; i++) {
      if (w.ct[i] === null || w.mt[i] !== null) continue;
      var age = now - w.ct[i], sa = age < 300 ? age / 300 : Math.max(.18, 1 - (age - 300) / 2500);
      ctx.fillStyle = "rgba(92,62,34," + (.85 * sa) + ")"; ctx.fillRect(dx + sod.pad + i * cw - .5, anchor - 1, cw + 1, 3.5);
      ctx.fillStyle = "rgba(50,32,16," + (.8 * sa) + ")"; ctx.fillRect(dx + sod.pad + i * cw + (i * 7 % 5), anchor, 1.5, 1.5);
    }
    drawTufts(w, sod, dx, anchor, now, true);                       // back blades, behind the letters
    for (i = 0; i < w.t.length; i++) {
      if (w.ct[i] === null) continue;
      var sxp = sod.pad + i * cw, lx = dx + sxp;
      if (w.mt[i] !== null) {                                       // mowed: a freshly cut, striped strip of lawn
        var age2 = now - w.mt[i], fa = Math.min(1, age2 / 250), band = Math.max(3, w.h * .16);
        var stripe = Math.floor((w.x + i * cw) / 14) % 2;
        ctx.fillStyle = stripe ? "rgba(84,150,62," + .85 * fa + ")" : "rgba(64,124,48," + .85 * fa + ")";
        ctx.fillRect(lx - .3, anchor - band + 1, cw + .6, band);
        var ma = 1 - age2 / 1800;
        if (ma > 0) { ctx.fillStyle = "rgba(190,215,110," + ma * .8 + ")"; for (var s2 = 0; s2 < 3; s2++) ctx.fillRect(lx + s2 * cw / 3 + 1, anchor - band - 1, 1, 2.5); }
        continue;
      }
      var g = letterG(w, i, now);
      if (g <= 0) continue;
      if (g < .12) {                                               // seed swelling in the furrow
        ctx.fillStyle = "rgba(200,180,110,.9)"; var r0 = .6 + g / .12 * 1.1;
        ctx.beginPath(); ctx.arc(lx + cw / 2, anchor + .5, r0, 0, 6.3); ctx.fill(); continue;
      }
      if (g < .3) {                                                // shoots break the soil and straighten
        var k2 = (g - .12) / .18;
        drawShoot(lx + cw * .35, anchor, k2, -1); if (cw > 6) drawShoot(lx + cw * .7, anchor, k2 * .8, 1);
        if (g < .22) continue;
      }
      var gb = easeOutBack(Math.min(1, (g - .22) / .5));         // the letter rises out of the ground
      if (gb <= 0) continue;
      var h = sod.Hc * gb, y0 = anchor - sod.base * gb;
      ctx.globalAlpha = Math.min(1, (g - .22) / .15);
      var dep = sod.depth * Math.min(1, gb), srcX = sxp * DPR, srcW = cw * DPR, srcH = sod.Hc * DPR;
      if (dep) ctx.drawImage(sod.shadow, srcX, 0, srcW, srcH, lx + dep * .9 + 1.5, y0 + dep + 2, cw, h);       // soft shadow on the page
      for (var d2 = Math.ceil(dep); d2 >= 1; d2--) ctx.drawImage(sod.soil, srcX, 0, srcW, srcH, lx + d2 * .5, y0 + d2, cw, h);   // the turf's soil edge
      ctx.drawImage(sod.c, sxp * DPR, 0, cw * DPR, sod.Hc * DPR, lx, y0, cw, h);
      ctx.globalAlpha = 1;
    }
    drawTufts(w, sod, dx, anchor, now, false);                      // front blades
  }
  function drawField(now, sx, sy) {
    var topH = document.querySelector(".top").getBoundingClientRect().bottom;
    for (var i = 0; i < field.length; i++) {
      var ln = field[i], oy = ln.fixed ? 0 : sy, vy = ln.y - oy;
      if (vy > H + 40 || vy + ln.h < -40) continue;
      if (!ln.fixed && vy < topH) continue;                               // don't draw over the sticky header
      if (ln.state === "raw" && vy < H - 20 && vy > -ln.h) queueLine(ln, "till");
      for (var j = 0; j < ln.words.length; j++) {
        var w = ln.words[j];
        if (w.mowEl === undefined) w.mowEl = elAtWord(w);
        drawWordGrass(w, sx, oy, now);
      }
    }
    updateClips(now);
    updateWeather(now);
    updateDriver(now);
    updateTractors(now, sx, sy);
  }
  // weather: a short shower; drops streak down and splash, and the grass drinks it (longer, greener blades)
  function updateWeather(now) {
    var raining = now < stormUntil;
    storm += ((raining ? 1 : 0) - storm) * .03;
    if (raining) { lush = Math.min(1.45, lush + .0012); fieldBusyUntil = Math.max(fieldBusyUntil, now + 100); for (var n = 0; n < 6; n++) drops.push({ x: Math.random() * (W + 200) - 100, y: -20, v: rnd(700, 1000), t: now, gy: rnd(H * .2, H) }); }
    ctx.strokeStyle = "rgba(170,200,230,.45)"; ctx.lineWidth = 1;
    for (var i = drops.length - 1; i >= 0; i--) {
      var d = drops[i], dt = Math.min(.05, (now - d.t) / 1000); d.t = now;
      if (d.splash) { var a = (now - d.splash) / 300; if (a >= 1) { drops.splice(i, 1); continue; } ctx.strokeStyle = "rgba(170,200,230," + (.5 * (1 - a)) + ")"; ctx.beginPath(); ctx.ellipse(d.x, d.gy, 1 + a * 5, .6 + a * 1.6, 0, 0, 6.3); ctx.stroke(); ctx.strokeStyle = "rgba(170,200,230,.45)"; continue; }
      d.y += d.v * dt; d.x += d.v * dt * .12 * (1 + storm);
      if (d.y >= d.gy) { d.splash = now; continue; }
      ctx.beginPath(); ctx.moveTo(d.x, d.y); ctx.lineTo(d.x - 2, d.y - 12); ctx.stroke();
    }
  }
  function rainShower() {
    if (reduce) { lush = Math.min(1.45, lush + .25); frame(performance.now()); return; }
    stormUntil = performance.now() + 6000; kick();
  }
  function updateClips(now) {
    for (var i = clips.length - 1; i >= 0; i--) {
      var c = clips[i], dt = Math.min(.05, (now - c.t) / 1000); c.t = now;
      if (!c.down) { c.vy += 900 * dt; c.x += c.vx * dt; c.y += c.vy * dt; c.r += c.vr * dt; if (c.vy > 0 && c.y >= c.gy) { c.y = c.gy; c.down = true; c.life = 5; } }
      c.life -= dt;
      if (c.life <= 0) { clips.splice(i, 1); continue; }
      if (c.sy0 !== scrollY) { c.y -= scrollY - c.sy0; c.gy -= scrollY - c.sy0; c.sy0 = scrollY; }
      ctx.save(); ctx.translate(c.x - (c.down ? 0 : 0), c.y); ctx.rotate(c.r); ctx.globalAlpha = Math.min(1, c.life * (c.down ? .4 : 2)); ctx.fillStyle = c.col; ctx.fillRect(-2, -.6, 4, 1.2); ctx.restore();
    }
  }
  var growQ = [];
  function queueLine(ln, mode) { ln.state = "queued"; ln.mode = mode; growQ.push(ln); }
  function freeTractor(near) {
    return drones.filter(function (d) { return d.state === "idle"; }).sort(function (a, b) { return Math.hypot(a.x - near.x, a.y - near.y) - Math.hypot(b.x - near.x, b.y - near.y); })[0];
  }
  function passChars(ln, docX, now) {
    var back = ln.dir === -1;
    ln.words.forEach(function (w) {
      for (var i = 0; i < w.t.length; i++) {
        var cx = w.x + i * w.cw + w.cw / 2;
        if (back ? cx < docX : cx > docX) continue;                       // not reached yet (works in both directions)
        if (ln.mode === "till" && w.ct[i] === null) { w.ct[i] = now; fieldBusyUntil = Math.max(fieldBusyUntil, now + 150 + 380 + GROW * 1.25 + 100); }
        if (ln.mode === "mow" && w.ct[i] !== null && w.mt[i] === null) {
          w.mt[i] = now;
          if (clips.length < 500) for (var k = 0; k < 3; k++) clips.push({ x: cx - scrollX, y: w.y - (w.fixed ? 0 : scrollY) + w.h * .4, gy: w.y - (w.fixed ? 0 : scrollY) + w.h * .82 - rnd(0, Math.max(3, w.h * .16)), sy0: scrollY, vx: rnd(40, 160) * -(ln.dir || 1), vy: rnd(-260, -90), r: rnd(0, 6), vr: rnd(-12, 12), life: rnd(.6, 1.1), t: now, col: BLADE[(Math.random() * BLADE.length) | 0] });
        }
      }
    });
  }
  // fieldwork: a capped fleet works the page in serpentine rows; a tractor that finishes a line U-turns into the
  // nearest waiting line and drives it the other way
  var MAXTILL = small ? 4 : 7;
  function updateTractors(now, sx, sy) {
    growQ.sort(function (a, b) { return (a.mode === "mow" ? -1e6 : 0) + a.y - ((b.mode === "mow" ? -1e6 : 0) + b.y); });
    var tilling = field.filter(function (l) { return l.drone && l.mode === "till"; }).length;
    for (var qi = 0; qi < growQ.length; qi++) {
      var ln = growQ[qi];
      if (ln.mode === "till" && tilling >= MAXTILL) continue;
      var vy0 = ln.y - (ln.fixed ? 0 : sy), d = freeTractor({ x: ln.x0 - sx, y: vy0 });
      if (!d) break;
      growQ.splice(qi--, 1); if (ln.mode === "till") tilling++;
      ln.drone = d; d.state = "tractor"; d.job = ln.mode; d.size = Math.max(.9, Math.min(2.4, ln.h / 20)); ln.t0 = now; ln.from = { x: d.x, y: d.y }; ln.state = "driving";
      // start from whichever end of the line is closer, so neighbouring rows are driven back and forth
      ln.dir = Math.abs(d.x - (ln.x1 - sx)) < Math.abs(d.x - (ln.x0 - sx)) ? -1 : 1;
    }
    field.forEach(function (ln) {
      if (!ln.drone) return;
      var d = ln.drone, oy = ln.fixed ? 0 : sy, sz = Math.max(.9, Math.min(2.4, ln.h / 20)), row = ln.y - oy + ln.h * .82 - 5 * sz, t = now - ln.t0;
      var len = ln.x1 - ln.x0 + 40, startX = (ln.dir === 1 ? ln.x0 - 16 : ln.x1 + 16) - sx;
      var dist = Math.hypot(startX - ln.from.x, row - ln.from.y), FLY = Math.max(260, Math.min(700, dist * 1.1));
      if (t < FLY) {
        var q = t / FLY; q = q < .5 ? 2 * q * q : 1 - Math.pow(-2 * q + 2, 2) / 2;
        // a short hop between neighbouring rows becomes a U-turn that swings out past the line end
        var cx = dist < 160 ? startX - ln.dir * 46 : (startX + ln.from.x) / 2, cy = (row + ln.from.y) / 2;
        d.x = (1 - q) * (1 - q) * ln.from.x + 2 * (1 - q) * q * cx + q * q * startX;
        d.y = (1 - q) * (1 - q) * ln.from.y + 2 * (1 - q) * q * cy + q * q * row;
        return;
      }
      var dur = Math.max(500, len / (ln.mode === "mow" ? .7 : .85)), p = Math.min(1, (t - FLY) / dur);
      var x = ln.dir === 1 ? ln.x0 - 16 + len * p : ln.x1 + 16 - len * p;
      passChars(ln, x + 6 * ln.dir, now);
      d.x = x - sx; d.y = row + Math.sin(now / 45) * .8;
      if (p >= 1) {
        d.state = "idle"; d.job = null; d.size = 1; ln.drone = null; ln.state = ln.mode === "mow" ? "mowed" : "grown";
        if (ln.onDone) { var f = ln.onDone; ln.onDone = null; f(); }
      }
    });
  }
  // a little drawn tractor: cab, hood, big rear wheel and small front wheel that turn as it drives, an exhaust that
  // puffs, and a tiller (tilling) or a spinning mower deck (mowing) depending on its job
  function drawTractor(d) {
    var now = performance.now(), dx = d.x - (d.lx === undefined ? d.x : d.lx); d.lx = d.x;
    if (Math.abs(dx) > .3) d.dir = dx > 0 ? 1 : -1;
    d.wheel = (d.wheel || 0) + dx / 6;
    d.puffs = d.puffs || [];
    var moving = Math.abs(dx) > .2 || d.state === "tractor";
    if (!reduce && d.state === "tractor" && (!d.lastPuff || now - d.lastPuff > 320)) { d.lastPuff = now; d.puffs.push({ x: d.x + (d.dir === 1 ? 2 : -2), y: d.y - 13, t: now }); }
    for (var i = d.puffs.length - 1; i >= 0; i--) {                    // exhaust puffs drift up and fade
      var p = d.puffs[i], a = (now - p.t) / 900; if (a >= 1) { d.puffs.splice(i, 1); continue; }
      ctx.fillStyle = "rgba(170,170,160," + (.3 * (1 - a)) + ")"; ctx.beginPath(); ctx.arc(p.x - (d.dir || 1) * a * 6, p.y - a * 14, 1.5 + a * 3, 0, 6.3); ctx.fill();
    }
    var sc = d.state === "idle" ? .8 : (d.size || 1);
    ctx.save(); ctx.translate(d.x, d.y); ctx.scale((d.dir === -1 ? -1 : 1) * sc, sc);
    ctx.globalAlpha = d.state === "idle" ? .8 : 1;
    if (d.job === "till") {                                           // tiller dragging behind, kicking up soil
      ctx.fillStyle = "#5c3b1e"; ctx.fillRect(-19, -1, 6, 6);
      ctx.fillStyle = "#8a5a2b"; for (var k = 0; k < 3; k++) ctx.fillRect(-21 - Math.random() * 4, 1 + Math.random() * 4, 1.5, 1.5);
    }
    if (d.job === "mow") {                                            // mower deck under the front, blades whirring
      ctx.fillStyle = "#6d6d6d"; ctx.fillRect(2, 3, 13, 3.5);
      ctx.strokeStyle = "rgba(230,230,230,.7)"; ctx.lineWidth = .8; var sp = now / 30;
      ctx.beginPath(); ctx.moveTo(8.5 + Math.cos(sp) * 4, 4.7 + Math.sin(sp) * 1); ctx.lineTo(8.5 - Math.cos(sp) * 4, 4.7 - Math.sin(sp) * 1); ctx.stroke();
    }
    ctx.fillStyle = "#b8322a"; ctx.fillRect(-6, -6, 13, 6);           // hood
    ctx.fillStyle = "#d9473c"; ctx.fillRect(-6, -6, 13, 1.5);
    ctx.fillStyle = "#2b2b2b"; ctx.fillRect(4, -11, 1.6, 5);          // exhaust stack
    ctx.strokeStyle = "#b8322a"; ctx.lineWidth = 1.4; ctx.strokeRect(-11, -14, 6, 8);   // cab frame
    ctx.fillStyle = "rgba(160,210,235,.55)"; ctx.fillRect(-10.3, -13.3, 4.6, 6.6);
    ctx.fillStyle = "#b8322a"; ctx.fillRect(-12, -15, 8, 1.6);        // roof
    function wheel(cx, cy, r) {
      ctx.fillStyle = "#1c1c1c"; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.3); ctx.fill();
      ctx.fillStyle = "#e0b23a"; ctx.beginPath(); ctx.arc(cx, cy, r * .5, 0, 6.3); ctx.fill();
      ctx.strokeStyle = "#1c1c1c"; ctx.lineWidth = .9;
      for (var s3 = 0; s3 < 3; s3++) { var an = d.wheel + s3 * 2.09; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(an) * r * .5, cy + Math.sin(an) * r * .5); ctx.stroke(); }
    }
    wheel(-8, 1, 6.2); wheel(6, 3, 3.6);
    ctx.restore(); ctx.globalAlpha = 1;
  }
  function mow(el) {
    var lines = field.filter(function (ln) { return ln.state !== "mowed" && ln.words.some(function (w) { return w.mowEl === el; }); });
    if (!lines.length || el.classList.contains("mowing")) return;
    el.classList.add("mowing");
    var left = lines.length;
    lines.forEach(function (ln) {
      growQ = growQ.filter(function (x) { return x !== ln; });
      if (ln.drone) { ln.drone.state = "idle"; ln.drone = null; }
      ln.words.forEach(function (w) { for (var i = 0; i < w.t.length; i++) if (w.ct[i] === null) w.ct[i] = -1e9; });   // can't mow what hasn't grown yet
      ln.onDone = function () { if (--left <= 0) { el.classList.remove("mowing"); el.classList.add("mowed"); } };
      if (reduce || !drones.length) { var nw = performance.now(); ln.mode = "mow"; passChars(ln, 1e9, nw); ln.state = "mowed"; ln.onDone(); return; }
      queueLine(ln, "mow");
    });
    kick();
  }
  function setTractor(on, quiet) {
    if (on === tractor) return;
    skipAll();
    tractor = on;
    document.documentElement.classList.toggle("tractor", on);
    tractorBar.hidden = !on;
    var tb = document.querySelector('[data-order="tractor"]'); if (tb) tb.innerHTML = on ? "tractor mode: on · back to text <kbd>8</kbd>" : "tractor mode 🚜 <kbd>8</kbd>";
    document.querySelectorAll(".mowed, .mowing").forEach(function (x) { x.classList.remove("mowed", "mowing"); });
    growQ = [];
    drones.forEach(function (d) { if (d.state === "tractor") d.state = "idle"; });
    lush = 1; storm = 0; drops = []; stormUntil = 0; if (typeof stopDrive === "function") stopDrive();
    if (on) { canvas.style.display = ""; canvas.style.visibility = ""; buildField(); }
    else { field = []; clips = []; if (reduce) canvas.style.display = "none"; }
    try { localStorage.setItem("tractor", on ? "on" : "off"); } catch (e) {}
    try { if (!quiet) history.replaceState(null, "", on ? "#tractor" : location.pathname + location.search); } catch (e) {}
    kick(); if (reduce) frame(performance.now());
  }
  // click a patch of grass and a tractor comes to mow it
  document.addEventListener("click", function (e) {
    if (tractor && driver && !e.target.closest("#tractorBar, #swarmMenu, #hiveBtn, .top, dialog")) { e.preventDefault(); e.stopPropagation(); return; }   // clicks steer while driving
    if (!tractor || e.target.closest("#tractorBar, #swarmMenu, #hiveBtn, .swarm-intro-layer, #find, dialog")) return;
    if (!e.target.closest(".top, .doc, .pbar")) return;
    var el = e.target.closest(MOWABLE); if (!el) return;
    e.preventDefault(); e.stopPropagation();
    if (!el.classList.contains("mowed")) mow(el);
  }, true);
  document.addEventListener("click", function (e) {
    if (!tractor) return;
    var hitD = drones.filter(function (d) { return Math.abs(d.x - e.clientX) < 14 && Math.abs(d.y - 4 - e.clientY) < 14; })[0];
    if (!hitD) return;
    e.preventDefault(); e.stopPropagation();
    var best = null, bd = 1e9;                                       // nearest standing grass on screen
    field.forEach(function (ln) {
      if (ln.state !== "grown") return;
      var vy = ln.y - (ln.fixed ? 0 : scrollY); if (vy < 0 || vy > innerHeight) return;
      ln.words.forEach(function (w) { if (!w.mowEl || w.mowEl.classList.contains("mowed")) return; var dd = Math.hypot(w.x - scrollX - e.clientX, vy - e.clientY); if (dd < bd) { bd = dd; best = w.mowEl; } });
    });
    if (best) mow(best);
  }, true);
  $("tractorX").addEventListener("click", function () { setTractor(false); });
  $("tractorRain").addEventListener("click", rainShower);

  // ---------- drive it yourself: arrow keys / WASD, or hold and drag; space swaps mower ↔ tiller ----------
  var driver = null, keysDown = {}, driveBtn = $("tractorDrive"), driveHint = $("driveHint");
  function startDrive() {
    if (driver) { stopDrive(); return; }
    driver = { x: innerWidth / 2, y: innerHeight * .6, state: "driven", job: "mow", trail: [], seed: 1, size: 1.6, vx: 0, vy: 0, dir: 1, extra: true };
    drones.push(driver);
    document.documentElement.classList.add("driving");
    driveBtn.innerHTML = "[ park ]"; driveHint.hidden = false; labelDrive();
    lastInput = performance.now(); kick();
  }
  function stopDrive() {
    if (!driver) return;
    var i = drones.indexOf(driver); if (i > -1) drones.splice(i, 1);
    driver = null; keysDown = {}; dragTo = null;
    document.documentElement.classList.remove("driving");
    driveBtn.innerHTML = "[ drive ]"; driveHint.hidden = true;
  }
  function labelDrive() { driveHint.textContent = (driver.job === "mow" ? "mower down" : "tiller down") + " · arrows/WASD or drag to steer · space: " + (driver.job === "mow" ? "tiller" : "mower") + " · esc: park"; }
  var dragTo = null;
  addEventListener("keydown", function (e) {
    if (!driver) return;
    var k = e.key.toLowerCase();
    if (["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d", " ", "escape"].indexOf(k) < 0) return;
    e.preventDefault(); e.stopImmediatePropagation();
    if (k === "escape") { stopDrive(); return; }
    if (k === " ") { driver.job = driver.job === "mow" ? "till" : "mow"; labelDrive(); return; }
    keysDown[k] = true; lastInput = performance.now(); kick();
  }, true);
  addEventListener("keyup", function (e) { delete keysDown[e.key.toLowerCase()]; }, true);
  document.addEventListener("pointerdown", function (e) {
    if (!driver || e.target.closest("#tractorBar, #swarmMenu, #hiveBtn, .top, dialog")) return;
    dragTo = { x: e.clientX, y: e.clientY, id: e.pointerId }; e.preventDefault(); kick();
  }, true);
  addEventListener("pointermove", function (e) { if (dragTo && e.pointerId === dragTo.id) { dragTo.x = e.clientX; dragTo.y = e.clientY; } });
  addEventListener("pointerup", function () { dragTo = null; });
  function updateDriver(now) {
    if (!driver) return;
    var ax = 0, ay = 0, K = keysDown;
    if (K.arrowleft || K.a) ax -= 1; if (K.arrowright || K.d) ax += 1; if (K.arrowup || K.w) ay -= 1; if (K.arrowdown || K.s) ay += 1;
    if (dragTo) { var ddx = dragTo.x - driver.x, ddy = dragTo.y - driver.y, dl = Math.hypot(ddx, ddy); if (dl > 6) { ax = ddx / dl; ay = ddy / dl; } }
    driver.vx = driver.vx * .86 + ax * 1.1; driver.vy = driver.vy * .86 + ay * 1.1;
    driver.x = Math.max(12, Math.min(innerWidth - 12, driver.x + driver.vx));
    driver.y = Math.max(60, Math.min(innerHeight - 20, driver.y + driver.vy));
    if (driver.y > innerHeight - 70 && driver.vy > 0) scrollBy(0, driver.vy * 1.2);   // drive off the edge and the page scrolls
    if (driver.y < 110 && driver.vy < 0) scrollBy(0, driver.vy * 1.2);
    if (Math.abs(driver.vx) + Math.abs(driver.vy) > .3) { lastInput = now; fieldBusyUntil = Math.max(fieldBusyUntil, now + 200); }
    // cut (or re-till) every letter under the deck
    var r = 16, sy2 = scrollY, sx2 = scrollX;
    field.forEach(function (ln) {
      var vy = ln.y - (ln.fixed ? 0 : sy2) + ln.h * .6;
      if (Math.abs(vy - driver.y) > Math.max(r, ln.h * .6)) return;
      ln.words.forEach(function (w) {
        if (w.x - sx2 > driver.x + r || w.x - sx2 + w.w < driver.x - r) return;
        for (var i = 0; i < w.t.length; i++) {
          var cx = w.x - sx2 + i * w.cw + w.cw / 2; if (Math.abs(cx - driver.x) > r) continue;
          if (driver.job === "mow" && w.ct[i] !== null && w.mt[i] === null) {
            w.mt[i] = now;
            if (clips.length < 500) for (var k = 0; k < 3; k++) clips.push({ x: cx, y: vy - w.h * .2, gy: vy + w.h * .2 - rnd(0, 4), sy0: scrollY, vx: rnd(-120, 120) - driver.vx * 30, vy: rnd(-240, -90), r: rnd(0, 6), vr: rnd(-12, 12), life: rnd(.6, 1.1), t: now, col: BLADE[(Math.random() * BLADE.length) | 0] });
          } else if (driver.job === "till" && (w.mt[i] !== null || w.ct[i] === null)) {
            w.mt[i] = null; w.ct[i] = now; fieldBusyUntil = Math.max(fieldBusyUntil, now + 150 + 380 + GROW * 1.25 + 100);
          }
        }
      });
    });
  }
  driveBtn.addEventListener("click", startDrive);
  $("tractorSeed").addEventListener("click", function () {               // re-till every mowed line and grow it back
    field.forEach(function (ln) {
      var hit = false;
      ln.words.forEach(function (w) { for (var i = 0; i < w.t.length; i++) if (w.mt[i] !== null) { w.mt[i] = null; w.ct[i] = null; hit = true; } });
      if (hit && !ln.drone) { ln.state = "raw"; if (reduce) ln.words.forEach(function (w) { w.ct = w.ct.map(function (v) { return v === null ? -1e9 : v; }); }); }
    });
    document.querySelectorAll(".mowed, .mowing").forEach(function (x) { x.classList.remove("mowed", "mowing"); });
    kick(); if (reduce) frame(performance.now());
  });
  $("tractorMowAll").addEventListener("click", function () {
    var els = []; field.forEach(function (ln) { ln.words.forEach(function (w) { if (w.mowEl && els.indexOf(w.mowEl) < 0) els.push(w.mowEl); }); });
    els.forEach(mow);
  });
  window.__dbg = function () { var c = {}; drones.forEach(function (d) { c[d.state] = (c[d.state] || 0) + 1; }); return { drones: c, q: growQ.length, driving: field.filter(function (l) { return l.drone; }).length, states: field.reduce(function (a, l) { a[l.state] = (a[l.state] || 0) + 1; return a; }, {}), sample: drones.slice(0, 4).map(function (d) { return [Math.round(d.x), Math.round(d.y), d.state]; }) }; };
  var tReb = 0;
  var tW = innerWidth;
  addEventListener("resize", function () {
    if (!tractor || innerWidth === tW) return;           // phones fire height-only resizes as the address bar moves
    tW = innerWidth; clearTimeout(tReb);
    tReb = setTimeout(function () {                      // re-flowed text: rebuild the field fully grown where it was grown
      drones.forEach(function (d) { if (d.state === "tractor") d.state = "idle"; }); growQ = [];
      buildField(); field.forEach(function (ln) { ln.state = "grown"; ln.words.forEach(function (w) { w.ct = w.ct.map(function () { return -1e9; }); }); });
      document.querySelectorAll(".mowed, .mowing").forEach(function (x) { x.classList.remove("mowed", "mowing"); });
    }, 200);
  });
  addEventListener("scroll", function () { if (tractor && reduce) frame(performance.now()); }, { passive: true });

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
    else if (o === "tractor") setTractor(!tractor);
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
    "  8          tractor mode: the swarm grows the text as grass",
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
    if (e.key === "8" && findBar.hidden) { e.preventDefault(); setTractor(!tractor); }
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
  // The page is built by swarm-intro (assets/swarm-intro.js): cursors gather round the handle badge, then drag a
  // selection box over every element and type its text in. Our own drones take over once it finishes.
  var intro = null;
  var wantTractor = false;
  try { wantTractor = localStorage.getItem("tractor") === "on" || location.hash === "#tractor"; } catch (e) {}
  ready.then(function () {
    if (wantTractor) { finishIntro(); setTractor(true, true); return; }   // tractor mode remembered: the tractors till the page instead
    if (done || reduce) return;
    blocks.forEach(function (b) { b._rained = true; b._left = 0; b.classList.remove("veiled"); });
    if (!window.swarmIntro) { finishIntro(); return; }
    $("skip").hidden = true; canvas.style.visibility = "hidden";
    var bg = getComputedStyle(document.documentElement).getPropertyValue("--bg").trim();
    intro = window.swarmIntro({
      targets: "h1,h2,h3,p,span,a,button,li,label,kbd,dt,dd",
      logo: R.handle || "doog",
      color: INK.acc, background: bg,
      cursors: small ? 10 : 18, maxCursors: small ? 16 : 30,
      skipButton: "skip ▸▸  esc",
      respectReducedMotion: false,          // our motion switch already decided (see `reduce` above)
      onComplete: finishIntro
    });
  });
  function finishIntro() {
    var pre = document.getElementById("swarm-intro-preload"); if (pre) pre.remove(); document.documentElement.removeAttribute("data-swarm-intro");
    blocks.forEach(function (b) { b._rained = true; b._left = 0; b.classList.remove("veiled"); });
    intro = null; canvas.style.visibility = ""; done = true; $("skip").hidden = true;
    try { sessionStorage.setItem("rained", "1"); } catch (e) {}
    kick();
  }
  function findFromHash() {
    var fm = decodeURIComponent(location.hash).match(/^#find=(.+)$/);
    if (fm && fm[1] !== findIn.value) { skipAll(); setTimeout(function () { openFind(false); findIn.value = fm[1]; find(fm[1]); if (hits[0]) nextHit(); }, 50); }
  }
  findFromHash(); addEventListener("hashchange", findFromHash);
  $("skip").addEventListener("click", skipAll);
  addEventListener("keydown", function (e) { if (!e.metaKey && !e.ctrlKey) skipAll(); });
  addEventListener("click", function (e) { if (e.target.id !== "skip") skipAll(); }, true);
  var lastW = innerWidth;
  addEventListener("resize", function () { size(); if (innerWidth !== lastW) { lastW = innerWidth; skipAll(); } });   // phones fire height-only resizes as the address bar moves
  document.addEventListener("visibilitychange", function () { if (document.hidden) skipAll(); });
})();

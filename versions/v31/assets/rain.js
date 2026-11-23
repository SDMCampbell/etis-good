(function () {
  "use strict";
  var R = window.RESUME, D = window.DERIVED;
  var $ = function (id) { return document.getElementById(id); };
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  var manifestScript = document.querySelector('script[src$="versions/manifest.js"]');
  var INFRA = manifestScript ? new URL("../", manifestScript.src) : new URL("./", location.href);
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
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
  $("links").innerHTML = '&gt; hail: <a href="' + esc(mail) + '">' + esc(R.email) + '</a> · <a href="' + esc(R.github) + '">github</a>';
  $("summary").textContent = "// " + R.summary + " " + R.tagline;
  $("jobs").innerHTML = R.jobs.map(function (j) {
    return '<li class="job" id="job-' + esc(j.id) + '"><div class="head">[' + Math.floor(j._t0) + "] " + esc(j.role) + "</div>" +
      '<div class="meta">@ ' + esc(j.company) + (j.location ? " · " + esc(j.location) : "") + " · " + esc(j._span) + (j.returning ? " · round two" : "") + "</div><ul>" +
      j.bullets.map(function (b) { return "<li>" + esc(b) + "</li>"; }).join("") + "</ul>" +
      (j.highlight ? '<div class="meta">* ' + esc(j.highlight.label.toLowerCase()) + ": " + esc(j.highlight.from) + " → " + esc(j.highlight.to) + "</div>" : "") +
      '<div class="tags">stack: ' + j.tags.map(esc).join(", ") + (j._new.length ? " · new here: " + j._new.map(esc).join(", ") : "") + "</div></li>";
  }).join("");
  $("systems").innerHTML = Object.keys(R.skills).map(function (g) {
    return '<p class="sys"><b>' + esc(g) + "</b> " + R.skills[g].map(esc).join(", ") + "</p>";
  }).join("");
  $("contactLines").innerHTML = '&gt; email  <a href="' + esc(mail) + '">' + esc(R.email) + '</a><br>&gt; github <a href="' + esc(R.github) + '">' + esc(R.github.replace(/^https?:\/\//, "")) + "</a><br>&gt; base   " + esc(R.location);
  document.querySelectorAll('a[href="timeline/"]').forEach(function (a) { a.href = new URL("timeline/", INFRA).href; });

  if (reduce) { $("skip").hidden = true; return; }   // reduced motion: the text is simply there

  // ---------- 2. the rain engine ----------
  var canvas = $("rain"), ctx = canvas.getContext("2d"), dpr = 1, W = 0, H = 0;
  var GLYPHS = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789<>/=+*#%$&{}[]~^│┼├┤─";
  var quick = false; try { quick = sessionStorage.getItem("rained") === "1"; sessionStorage.setItem("rained", "1"); } catch (e) {}
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
  function hive() { return { x: W - 30, y: 70 }; }
  function makeDrones(n) {
    var h = hive();
    for (var i = 0; i < n; i++) drones.push({ x: h.x + (Math.random() - .5) * 40, y: h.y + (Math.random() - .5) * 30, state: "idle", word: null, t0: 0, from: null, trail: [], seed: Math.random() * 10 });
  }
  // schedule a block: each word falls from above the viewport into its exact spot
  function rainBlock(block, t0, priority) {
    if (block._rained) return; block._rained = true;
    var list = measure(block); block._left = list.length;
    if (!list.length) { block.classList.remove("veiled"); return; }
    var step = quick ? 2 : priority ? 22 : 7, dur0 = quick ? 380 : 700;
    var lineY = null, lineStart = 0;
    list.forEach(function (w, i) {
      w.start = t0 + i * step;
      w.dur = dur0 + Math.random() * (quick ? 120 : 380);
      w.drop = (quick ? 60 : 120) + Math.random() * (quick ? 120 : 360);
      w.glyphs = w.t.split("");
      w.lock = w.t.split("").map(function (_, k) { return .62 + .38 * (k / Math.max(1, w.t.length)) * Math.random(); });
      // one drone escorts the first word of each line
      if (lineY === null || Math.abs(w.y - lineY) > 4) { lineY = w.y; w.leader = true; }
      active.push(w); words.push(w);
    });
    if (!raf) raf = requestAnimationFrame(frame);
  }
  function landBlock(b) { b.classList.remove("veiled"); }
  function frame(now) {
    raf = 0;
    ctx.clearRect(0, 0, W, H);
    var sy = scrollY, sx = scrollX, h = hive();
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
    drones.forEach(function (d) {
      if (d.state === "return") {
        var k2 = Math.min(1, (now - d.t0) / 520), q = 1 - Math.pow(1 - k2, 3);
        d.x = d.from.x + (h.x - d.from.x) * q + Math.sin(k2 * Math.PI) * -40; d.y = d.from.y + (h.y - d.from.y) * q;
        if (k2 >= 1) d.state = "idle";
      }
      if (d.state === "idle") { var a = now / 900 + d.seed; d.x += (h.x + Math.cos(a) * 18 - d.x) * 0.08; d.y += (h.y + Math.sin(a * 1.3) * 12 - d.y) * 0.08; }
      else moving = true;
      d.trail.push([d.x, d.y]); if (d.trail.length > 7) d.trail.shift();
      drawDrone(d);
    });
    if (active.length || moving || words.some(function (x) { return x.block._left > 0; })) raf = requestAnimationFrame(frame);
    else finish();
  }
  function drawWord(w, y, t, sx, sy, now) {
    var cw = w.w / w.t.length, oy = w.fixed ? 0 : sy;
    for (var i = 0; i < w.t.length; i++) {
      var locked = t >= w.lock[i];
      var ch = locked ? w.t[i] : (now && Math.random() < .35 ? (w.glyphs[i] = GLYPHS[(Math.random() * GLYPHS.length) | 0]) : w.glyphs[i]);
      ctx.fillStyle = locked ? w.color : (i === 0 ? "#EAFFE7" : "#39FF7A");
      ctx.fillText(ch, w.x - sx + i * cw, y - oy + w.h / 2);
    }
  }
  function drawDrone(d) {
    ctx.textBaseline = "middle"; ctx.font = "700 14px 'JetBrains Mono', monospace";
    for (var i = 0; i < d.trail.length - 1; i++) { ctx.fillStyle = "rgba(57,255,122," + (0.08 * (i + 1)) + ")"; ctx.fillText("▮", d.trail[i][0], d.trail[i][1]); }
    ctx.fillStyle = d.state === "idle" ? "rgba(57,255,122,.55)" : "#39FF7A";
    ctx.shadowColor = "#39FF7A"; ctx.shadowBlur = d.state === "idle" ? 0 : 8;
    ctx.fillText("▸", d.x, d.y); ctx.shadowBlur = 0;
  }
  function finish() {
    ctx.clearRect(0, 0, W, H);
    var pending = blocks.filter(function (b) { return !b._rained; });
    if (!pending.length) { done = true; $("skip").hidden = true; canvas.style.display = "none"; }
  }
  function skipAll() {
    if (done) return;
    done = true; cancelAnimationFrame(raf); raf = 0; active = [];
    blocks.forEach(function (b) { b._rained = true; b._left = 0; b.classList.remove("veiled"); });
    ctx.clearRect(0, 0, W, H); canvas.style.display = "none"; $("skip").hidden = true;
    if (io) io.disconnect();
  }

  // ---------- 3. go: veil, then rain the hero first and the rest as it scrolls into view ----------
  size();
  blocks.forEach(function (b) { b.classList.add("veiled"); });
  makeDrones(small ? 12 : 24);
  var io = null;
  var ready = document.fonts && document.fonts.ready ? Promise.race([document.fonts.ready, new Promise(function (r) { setTimeout(r, 900); })]) : Promise.resolve();
  ready.then(function () {
    if (done) return;
    var t = performance.now() + 80;
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
  $("skip").addEventListener("click", skipAll);
  addEventListener("keydown", function (e) { if (!e.metaKey && !e.ctrlKey) skipAll(); });
  addEventListener("click", function (e) { if (e.target.id !== "skip") skipAll(); }, true);
  addEventListener("resize", function () { size(); skipAll(); });
  document.addEventListener("visibilitychange", function () { if (document.hidden) skipAll(); });
})();

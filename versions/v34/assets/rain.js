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

  // reduced motion: no rain, no drones; the text is simply there (find still works)

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
  function hive() { return { x: W - 34, y: H - 70 }; }
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
    updateScrambles(now, sx, sy);
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
        else { tx = h.x + Math.cos(a) * 18; ty = h.y + Math.sin(a * 1.3) * 12; }
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
    if (active.length || moving || scrambles.length || words.some(function (x) { return x.block._left > 0; })) raf = requestAnimationFrame(frame);
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
    if (!pending.length) { done = true; $("skip").hidden = true; }
  }
  function skipAll() {
    if (done) return;
    done = true; cancelAnimationFrame(raf); raf = 0; active = [];
    blocks.forEach(function (b) { b._rained = true; b._left = 0; b.classList.remove("veiled"); });
    ctx.clearRect(0, 0, W, H); $("skip").hidden = true; kick();
    if (io) io.disconnect();
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
    var job = { span: span, t: span.textContent, x: rect.left + scrollX, y: rect.top + scrollY, w: rect.width, h: rect.height, font: cs.fontWeight + " " + cs.fontSize + " " + cs.fontFamily, color: cs.color, start: performance.now(), glyphs: span.textContent.split(""), squad: [] };
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
        ctx.fillStyle = scr ? "#39FF7A" : j.color; ctx.fillText(ch, j.x - sx + c * cw, y + j.h / 2);
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
  function poke() { clearTimeout(idleT); scatter(); idleT = setTimeout(startFormation, 12000); }
  ["pointermove", "keydown", "scroll", "touchstart", "wheel"].forEach(function (ev) { addEventListener(ev, poke, { passive: true }); });
  poke();

  // ---------- type to find: matches glow, the swarm hovers over them ----------
  var findBar = $("find"), findIn = $("findIn"), findN = $("findN"), hits = [], hitI = -1;
  function clearHits() {
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
    // dispatch the swarm: one drone per match (reinforcements launch if needed)
    var h0 = hive(), need = Math.min(hits.length, 40);
    while (!reduce && drones.filter(function (d) { return d.state === "idle" || d.state === "hover"; }).length < need) drones.push({ x: h0.x, y: h0.y, state: "idle", trail: [], seed: Math.random() * 10, extra: true });
    var free = drones.filter(function (d) { return d.state === "idle"; });
    hits.slice(0, need).forEach(function (m, k) { var d = free[k]; if (!d) return; d.state = "hover"; d.mark = m; });
    setFindHash(q); kick();
  }
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
    if (e.key.length === 1 && /[\w.#+\/-]/.test(e.key)) { openFind(true); findIn.value += e.key; find(findIn.value); e.preventDefault(); }
    else if (e.key === "Escape" && !findBar.hidden) closeFind();
  });
  function hoverDrones(sx, sy) {
    drones.forEach(function (d) {
      if (d.state !== "hover" || !d.mark) return;
      var r2 = d.mark.getBoundingClientRect();
      d.tx = r2.left + r2.width / 2 + Math.sin(performance.now() / 300 + d.seed) * 4; d.ty = r2.top - 8;
    });
  }

  // ---------- 3. go: veil, then rain the hero first and the rest as it scrolls into view ----------
  size();
  if (reduce) { done = true; $("skip").hidden = true; canvas.style.display = "none"; }
  else { blocks.forEach(function (b) { b.classList.add("veiled"); }); makeDrones(small ? 12 : 24); }
  var io = null;
  var ready = document.fonts && document.fonts.ready ? Promise.race([document.fonts.ready, new Promise(function (r) { setTimeout(r, 900); })]) : Promise.resolve();
  ready.then(function () {
    if (done || reduce) return;
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

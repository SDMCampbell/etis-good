(function () {
  "use strict";
  var R = window.RESUME, D = window.DERIVED;
  var $ = function (id) { return document.getElementById(id); };
  var reduce = matchMedia("(prefers-reduced-motion: reduce)");
  var phone = matchMedia("(max-width: 700px)");
  var COLORS = ["#FF4A1C", "#FFBE0B", "#00A6A6", "#7A4DFF", "#FF5FA2", "#3BAA5C"];
  var LIGHT_TEXT = { "#7A4DFF": 1 };
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  // infrastructure (register, manifest) lives at the real site root, even inside archived snapshots
  var manifestScript = document.querySelector('script[src$="versions/manifest.js"]');
  var INFRA = manifestScript ? new URL("../", manifestScript.src) : new URL("./", location.href);

  var jobs = D.chrono;                       // oldest -> newest
  var N = jobs.length;
  jobs.forEach(function (j) { j._color = COLORS[(R.jobs.indexOf(j)) % COLORS.length]; });
  var mail = "mailto:" + R.email;

  // ---------- static text ----------
  $("barName").textContent = R.name;
  $("kicker").textContent = "Route: " + R.tagline.replace(/\.$/, "");
  $("name").innerHTML = esc(R.name).replace(" ", "<br>");
  $("role").innerHTML = "<span>" + esc(R.title) + "</span> at " + esc(D.current.company) + " · " + esc(R.location);
  $("tagline").textContent = R.summary;
  $("stats").innerHTML = "<span><b>" + D.yearsIn + "+</b> yrs</span><span><b>" + D.roleCount + "</b> roles</span><span><b>" + D.skillCount + "</b> skills</span>";
  ["barEmail", "ctaEmail"].forEach(function (id) { $(id).href = mail; });

  // ---------- topo background (seeded, generated once) ----------
  (function topo() {
    var seed = 7, rnd = function () { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    var W = 1600, H = 1000, out = "";
    [[1150, 260], [300, 820]].forEach(function (c, k) {
      for (var ring = 1; ring <= 7; ring++) {
        var r = ring * (k ? 70 : 85), pts = [], n = 28, ph = rnd() * 6;
        for (var i = 0; i < n; i++) {
          var a = i / n * Math.PI * 2, w = 1 + 0.12 * Math.sin(a * 3 + ph) + 0.06 * Math.sin(a * 5 + ring);
          pts.push([c[0] + Math.cos(a) * r * w * 1.35, c[1] + Math.sin(a) * r * w]);
        }
        out += '<path d="' + smooth(pts, true) + '"/>';
      }
    });
    var svg = $("topo"); svg.setAttribute("viewBox", "0 0 " + W + " " + H); svg.setAttribute("preserveAspectRatio", "xMidYMid slice"); svg.innerHTML = out;
  })();

  // Catmull-Rom -> cubic Bezier
  function smooth(p, closed) {
    var d = "M" + p[0][0].toFixed(1) + " " + p[0][1].toFixed(1), n = p.length;
    var get = function (i) { return closed ? p[(i + n) % n] : p[Math.max(0, Math.min(n - 1, i))]; };
    for (var i = 0; i < (closed ? n : n - 1); i++) {
      var p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2);
      d += " C" + (p1[0] + (p2[0] - p0[0]) / 6).toFixed(1) + " " + (p1[1] + (p2[1] - p0[1]) / 6).toFixed(1) + " " +
        (p2[0] - (p3[0] - p1[0]) / 6).toFixed(1) + " " + (p2[1] - (p3[1] - p1[1]) / 6).toFixed(1) + " " + p2[0].toFixed(1) + " " + p2[1].toFixed(1);
    }
    return d + (closed ? "Z" : "");
  }

  // ---------- route geometry ----------
  var svg = $("routeSvg"), route = $("route"), token = $("token");
  var maxCum = jobs[N - 1]._cum;
  var pts = jobs.map(function (j, i) {
    var t = (j._t0 - D.firstYear) / Math.max(1, D.nowT - D.firstYear);
    var y = 560 - (j._cum / maxCum) * 500;                         // height = cumulative distinct skills
    var x = 80 + t * 140 + (i % 2 ? 1 : -1) * 46;                   // time drifts right, holds alternate sides
    return [Math.max(36, Math.min(264, x)), y];
  });
  // keep holds at least 44 units apart vertically (top holds share most skills and would overlap)
  for (var k = pts.length - 2; k >= 0; k--) if (pts[k][1] - pts[k + 1][1] < 44) pts[k][1] = pts[k + 1][1] + 44;
  var lowest = pts[0][1];
  if (lowest > 565) { var sc = 505 / (lowest - pts[pts.length - 1][1]); pts.forEach(function (p) { p[1] = 60 + (p[1] - pts[pts.length - 1][1]) * sc; }); }
  var startPt = [pts[0][0] - 30, 590];
  var routePts = [startPt].concat(pts);
  var d = smooth(routePts, false);
  var g = "";
  g += '<path class="rope" d="' + d + '" transform="translate(9 3)"/>';
  g += '<path class="line" id="routeLine" d="' + d + '"/>';
  g += '<path class="climbed" id="climbed" d="' + d + '"/>';
  jobs.forEach(function (j, i) {
    var r = 12 + Math.min(10, j._new.length * 2.2), p = pts[i];
    var blob = [], seed = i * 31 + 5;
    for (var k = 0; k < 7; k++) { seed = (seed * 9301 + 49297) % 233280; var a = k / 7 * Math.PI * 2, rr = r * (0.82 + (seed / 233280) * 0.34); blob.push([p[0] + Math.cos(a) * rr, p[1] + Math.sin(a) * rr]); }
    var bd = smooth(blob, true);
    var left = p[0] > 150;
    g += '<g class="hold" data-i="' + i + '">' +
      '<path class="shadow" d="' + bd + '" transform="translate(3 3)"/>' +
      '<path class="shape" d="' + bd + '" fill="' + j._color + '"/>' +
      '<circle class="ring" cx="' + p[0] + '" cy="' + p[1] + '" r="' + (r + 7) + '" fill="none" stroke="none"/>' +
      '<text x="' + (p[0] + (left ? -(r + 8) : r + 8)) + '" y="' + (p[1] + 4) + '" text-anchor="' + (left ? "end" : "start") + '">' + Math.floor(j._t0) + "</text></g>";
  });
  svg.innerHTML = g;
  var line = $("routeLine"), climbed = $("climbed");
  var L = line.getTotalLength(), S = 400, samples = [];
  for (var s = 0; s < S; s++) { var q = line.getPointAtLength(L * s / (S - 1)); samples.push([q.x, q.y]); }
  var holdS = pts.map(function (p) {
    var best = 0, bd2 = Infinity;
    samples.forEach(function (q, k) { var dd = (q[0] - p[0]) * (q[0] - p[0]) + (q[1] - p[1]) * (q[1] - p[1]); if (dd < bd2) { bd2 = dd; best = k; } });
    return best;
  });
  climbed.style.strokeDasharray = L + " " + L;

  // ---------- state ----------
  var pos = holdS[N - 1], shown = pos, active = -1, raf = 0, dragging = false;
  function nearestHold(sIdx) {
    var b = 0; holdS.forEach(function (h, i) { if (Math.abs(h - sIdx) < Math.abs(holdS[b] - sIdx)) b = i; }); return b;
  }
  function svgToPx(p) {
    var m = svg.getScreenCTM(), r = route.getBoundingClientRect();
    if (!m) return [0, 0];
    return [m.a * p[0] + m.c * p[1] + m.e - r.left, m.b * p[0] + m.d * p[1] + m.f - r.top];
  }
  function draw() {
    var q = samples[Math.round(shown)], px = svgToPx(q);
    token.style.transform = "translate(" + px[0].toFixed(1) + "px," + px[1].toFixed(1) + "px)";
    climbed.style.strokeDashoffset = L - L * Math.round(shown) / (S - 1);
    hint.style.left = px[0] + "px"; hint.style.top = px[1] + "px";
  }
  function animate() {
    raf = 0;
    if (reduce.matches) shown = pos; else shown += (pos - shown) * 0.35;
    if (Math.abs(pos - shown) < 0.5) shown = pos;
    draw();
    if (shown !== pos) raf = requestAnimationFrame(animate);
  }
  function setPos(sIdx, opts) {
    pos = Math.max(0, Math.min(S - 1, sIdx));
    if (!raf) raf = requestAnimationFrame(animate);
    var h = nearestHold(pos);
    if (h !== active) select(h);
    rail.value = pos; drawRail();
    if (opts && opts.announce) announce();
  }
  function goHold(i, announceIt) { setPos(holdS[i], { announce: announceIt }); }

  // ---------- card + bag ----------
  var card = $("card"), chips = $("chips"), live = $("live");
  function select(i) {
    active = i;
    var j = jobs[i], isNow = /present/i.test(j.end);
    svg.querySelectorAll(".hold").forEach(function (h) { h.classList.toggle("on", +h.dataset.i === i); });
    card.innerHTML =
      '<div class="meta"><span class="grade' + (LIGHT_TEXT[j._color] ? " light" : "") + '" style="--c:' + j._color + '" title="Grade = new skills picked up on this pitch">V' + j._new.length + '</span>' +
      '<span class="mono">' + esc(j._span) + "</span></div>" +
      (isNow ? '<span class="now mono grade" style="--c:#FFF7E8">Now</span>' : "") +
      "<h3>" + esc(j.role) + '</h3><p class="co">' + esc(j.company) + (j.location ? " · " + esc(j.location) : "") + "</p>" +
      "<ul>" + j.bullets.map(function (b) { return "<li>" + esc(b) + "</li>"; }).join("") + "</ul>";
    if (!reduce.matches) { card.classList.remove("swap"); void card.offsetWidth; card.classList.add("swap"); }
    var newSet = {}; j._new.forEach(function (t) { newSet[t.toLowerCase()] = 1; });
    var known = [];
    jobs.slice(0, i + 1).forEach(function (jj) { jj._new.forEach(function (t) { known.push(t); }); });
    chips.innerHTML = known.slice().reverse().map(function (t) { return '<span class="chip' + (newSet[t.toLowerCase()] ? " new" : "") + '">' + esc(t) + "</span>"; }).join("");
    $("bagCount").textContent = known.length + " skills";
    token.setAttribute("aria-valuenow", i);
    token.setAttribute("aria-valuetext", j._span + ", " + j.role + " at " + j.company);
    if (navigator.vibrate && dragging) { try { navigator.vibrate(10); } catch (e) {} }
  }
  var annT;
  function announce() {
    clearTimeout(annT);
    annT = setTimeout(function () { var j = jobs[active]; live.textContent = j.role + " at " + j.company + ", " + j._span; }, 350);
  }

  // ---------- pointer: drag token / tap route ----------
  function sampleFromEvent(e) {
    var m = svg.getScreenCTM(); if (!m) return pos;
    var inv = m.inverse(), x = inv.a * e.clientX + inv.c * e.clientY + inv.e, y = inv.b * e.clientX + inv.d * e.clientY + inv.f;
    var best = 0, bd2 = Infinity;
    for (var k = 0; k < S; k++) { var dx = samples[k][0] - x, dy = samples[k][1] - y, dd = dx * dx + dy * dy; if (dd < bd2) { bd2 = dd; best = k; } }
    return best;
  }
  function startDrag(e) {
    if (e.button > 0) return;
    dragging = true; dismissHint();
    token.classList.add("drag");
    token.setPointerCapture(e.pointerId);
    setPos(sampleFromEvent(e));
    e.preventDefault();
  }
  token.addEventListener("pointerdown", startDrag);
  token.addEventListener("pointermove", function (e) { if (dragging) setPos(sampleFromEvent(e)); });
  function endDrag() { if (!dragging) return; dragging = false; token.classList.remove("drag"); goHold(active, true); }
  token.addEventListener("pointerup", endDrag);
  token.addEventListener("pointercancel", endDrag);
  // pressing on the route (desktop) grabs the token there; tapping a hold jumps to it
  route.addEventListener("pointerdown", function (e) {
    if (e.target === token) return;
    var h = e.target.closest && e.target.closest(".hold");
    if (h) { dismissHint(); goHold(+h.dataset.i, true); return; }
    if (!phone.matches && e.pointerType === "mouse") { startDrag(e); }
  });

  // ---------- keyboard ----------
  token.setAttribute("aria-valuemin", 0);
  token.setAttribute("aria-valuemax", N - 1);
  token.addEventListener("keydown", function (e) {
    var i = active, k = e.key;
    if (k === "ArrowUp" || k === "ArrowRight") i++;
    else if (k === "ArrowDown" || k === "ArrowLeft") i--;
    else if (k === "Home") i = 0;
    else if (k === "End") i = N - 1;
    else if (k === "PageUp") i += 3;
    else if (k === "PageDown") i -= 3;
    else return;
    e.preventDefault(); dismissHint();
    goHold(Math.max(0, Math.min(N - 1, i)), true);
  });

  // ---------- phone scrub rail ----------
  var rail = $("rail"), railDots = $("railDots");
  railDots.innerHTML = holdS.map(function (h, i) { return '<i style="left:' + (h / (S - 1) * 100) + '%"></i>'; }).join("") + '<span class="knob"></span>';
  var knob = railDots.querySelector(".knob");
  function drawRail() {
    knob.style.left = (pos / (S - 1) * 100) + "%";
    railDots.querySelectorAll("i").forEach(function (dot, i) { dot.classList.toggle("on", i === active); });
  }
  rail.addEventListener("input", function () { dragging = true; dismissHint(); setPos(+rail.value); });
  rail.addEventListener("change", function () { dragging = false; goHold(active, true); });

  // ---------- hint ----------
  var hint = $("hint"), hintTimer;
  var hintSeen = false;
  try { hintSeen = sessionStorage.getItem("climbHint") === "1"; } catch (e) {}
  function dismissHint() {
    clearTimeout(hintTimer); hint.classList.remove("show");
    try { sessionStorage.setItem("climbHint", "1"); } catch (e) {}
    hintSeen = true;
  }
  if (!hintSeen) hintTimer = setTimeout(function () {
    hint.textContent = phone.matches ? "Slide to climb ↓" : "Drag me down the route";
    hint.classList.add("show");
    if (!reduce.matches) { setPos(holdS[N - 1] - 18); setTimeout(function () { if (!hintSeen) setPos(holdS[N - 1]); }, 500); }
  }, 1200);

  // ---------- route description ----------
  $("jobs").innerHTML = R.jobs.map(function (j) {
    return '<li class="job" style="--c:' + j._color + '"><header><h3>' + esc(j.role) + '</h3><span class="when">' + esc(j._span) + "</span></header>" +
      '<p class="co">' + esc(j.company) + (j.location ? " · " + esc(j.location) : "") + "</p><ul>" +
      j.bullets.map(function (b) { return "<li>" + esc(b) + "</li>"; }).join("") + '</ul><div class="tags">' +
      j.tags.map(function (t) { return '<span class="chip">' + esc(t) + "</span>"; }).join("") +
      '<button class="show" type="button" data-job="' + j._i + '">Show on wall ↑</button></div></li>';
  }).join("");
  $("jobs").addEventListener("click", function (e) {
    var b = e.target.closest("[data-job]"); if (!b) return;
    $("wall").scrollIntoView({ behavior: reduce.matches ? "auto" : "smooth" });
    goHold(+b.dataset.job, true); token.focus({ preventScroll: true });
  });

  // ---------- rack ----------
  $("rack").innerHTML = Object.keys(R.skills).map(function (grp) {
    return '<div class="rack-group"><h3>' + esc(grp) + '</h3><div class="chips">' + R.skills[grp].map(function (s) {
      var n = D.usedAt(s).length;
      return '<span class="chip">' + esc(s) + (n ? "<sup>×" + n + "</sup>" : "") + "</span>";
    }).join("") + "</div></div>";
  }).join("");

  // ---------- register teaser ----------
  var V = window.VERSIONS;
  if (V) {
    $("reg").innerHTML = V.list.slice().sort(function (a, b) { return b.v - a.v; }).slice(0, 8).map(function (e) {
      var href = e.v === V.current ? INFRA.href : new URL("versions/v" + String(e.v).padStart(2, "0") + "/", INFRA).href;
      return '<li><a href="' + href + '"' + (e.v === V.current ? ' class="here" aria-current="page"' : "") + '><span class="v">v' + e.v + (e.v === V.current ? " · summit" : "") + '</span><span class="t">' + esc(e.title) + "</span></a></li>";
    }).join("");
  }
  document.querySelectorAll('a[href="timeline/"]').forEach(function (a) { a.href = new URL("timeline/", INFRA).href; });

  // ---------- footer ----------
  $("footLinks").innerHTML = '<a class="btn btn-hot" href="' + esc(mail) + '">' + esc(R.email) + '</a><a class="btn" href="' + esc(R.github) + '" target="_blank" rel="noopener">GitHub</a><span class="btn" style="box-shadow:none;border-style:dashed">' + esc(R.location) + "</span>";

  // ---------- go ----------
  goHold(N - 1);
  shown = pos; draw();
  addEventListener("resize", function () { draw(); });
  if (document.fonts) document.fonts.ready.then(draw);
})();

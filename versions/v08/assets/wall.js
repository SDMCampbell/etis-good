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
  var retie = jobs.map(function (j, i) {
    if (!j.returning) return null;
    for (var k = i - 1; k >= 0; k--) if (jobs[k].company === j.company) return { from: i, to: k };
    return null;
  }).filter(Boolean)[0];
  var pts, knotPt = null, line, climbed, L, S = 400, samples, holdS, horizontal = false;

  // Desktop: a tall climbing route (bottom-left to top-right).
  // Phone: the same data laid on its side, a left-to-right learning curve you scrub with a thumb.
  function vertPoints() {
    var P = jobs.map(function (j, i) {
      var t = (j._t0 - D.firstYear) / Math.max(1, D.nowT - D.firstYear);
      var y = 560 - (j._cum / maxCum) * 500;                       // height = cumulative distinct skills
      var x = 80 + t * 140 + (i % 2 ? 1 : -1) * 46;                 // time drifts right, holds alternate sides
      return [Math.max(36, Math.min(264, x)), y];
    });
    for (var k = P.length - 2; k >= 0; k--) if (P[k][1] - P[k + 1][1] < 44) P[k][1] = P[k + 1][1] + 44;
    if (P[0][1] > 565) { var top = P[P.length - 1][1], sc = 505 / (P[0][1] - top); P.forEach(function (p) { p[1] = 60 + (p[1] - top) * sc; }); }
    return P;
  }
  function horizPoints() {
    var P = jobs.map(function (j, i) {
      var t = (j._t0 - D.firstYear) / Math.max(1, D.nowT - D.firstYear);
      return [40 + t * 520, 190 - (j._cum / maxCum) * 150];
    });
    for (var k = 1; k < P.length; k++) if (P[k][0] - P[k - 1][0] < 58) P[k][0] = P[k - 1][0] + 58;   // keep thumb-sized gaps
    var right = P[P.length - 1][0]; if (right > 572) { var sc = 532 / (right - 40); P.forEach(function (p) { p[0] = 40 + (p[0] - 40) * sc; }); }
    return P;
  }
  function buildGeometry() {
    horizontal = phone.matches;
    pts = horizontal ? horizPoints() : vertPoints();
    svg.setAttribute("viewBox", horizontal ? "0 0 600 230" : "0 0 300 600");
    var startPt = horizontal ? [8, 214] : [pts[0][0] - 30, 590];
    var d = smooth([startPt].concat(pts), false);
    var g = '<path class="rope" d="' + d + '" transform="translate(' + (horizontal ? "3 9" : "9 3") + ')"/>' +
      '<path class="line" id="routeLine" d="' + d + '"/><path class="climbed" id="climbed" d="' + d + '"/>';
    jobs.forEach(function (j, i) {
      var r = 12 + Math.min(10, j._new.length * 2.2), p = pts[i];
      var blob = [], seed = i * 31 + 5;
      for (var k = 0; k < 7; k++) { seed = (seed * 9301 + 49297) % 233280; var an = k / 7 * Math.PI * 2, rr = r * (0.82 + (seed / 233280) * 0.34); blob.push([p[0] + Math.cos(an) * rr, p[1] + Math.sin(an) * rr]); }
      var bd = smooth(blob, true), left = p[0] > 150;
      var tx = horizontal ? p[0] : p[0] + (left ? -(r + 8) : r + 8), ty = horizontal ? p[1] + r + 16 : p[1] + 4;
      g += '<g class="hold" data-i="' + i + '"><path class="shadow" d="' + bd + '" transform="translate(3 3)"/>' +
        '<path class="shape" d="' + bd + '" fill="' + j._color + '"/>' +
        '<circle class="ring" cx="' + p[0] + '" cy="' + p[1] + '" r="' + (r + 7) + '" fill="none" stroke="none"/>' +
        '<circle class="hit" cx="' + p[0] + '" cy="' + p[1] + '" r="' + Math.max(r + 6, 24) + '" fill="transparent"/>' +
        '<text x="' + tx + '" y="' + ty + '" text-anchor="' + (horizontal ? "middle" : left ? "end" : "start") + '">' + Math.floor(j._t0) + "</text></g>";
    });
    if (retie) {
      var a = pts[retie.from], b = pts[retie.to];
      if (horizontal) {
        var apex = Math.min(a[1], b[1]) - 26;
        knotPt = [(a[0] + b[0]) / 2, Math.max(16, apex)];
        g = '<path class="retie" d="M' + a[0] + " " + a[1] + " C" + a[0] + " " + (apex - 10) + " " + b[0] + " " + (apex - 10) + " " + b[0] + " " + b[1] + '"/>' + g;
      } else {
        var bulge = Math.min(260, Math.max(a[0], b[0]) + 70);
        knotPt = [bulge - 14, a[1] + (b[1] - a[1]) * 0.62];
        g = '<path class="retie" d="M' + a[0] + " " + a[1] + " C" + bulge + " " + a[1] + " " + (bulge + 20) + " " + b[1] + " " + b[0] + " " + b[1] + '"/>' + g;
      }
    }
    svg.innerHTML = g;
    line = $("routeLine"); climbed = $("climbed");
    L = line.getTotalLength(); samples = [];
    for (var s2 = 0; s2 < S; s2++) { var q = line.getPointAtLength(L * s2 / (S - 1)); samples.push([q.x, q.y]); }
    holdS = pts.map(function (p) {
      var best = 0, bd2 = Infinity;
      samples.forEach(function (q, k) { var dd = (q[0] - p[0]) * (q[0] - p[0]) + (q[1] - p[1]) * (q[1] - p[1]); if (dd < bd2) { bd2 = dd; best = k; } });
      return best;
    });
    climbed.style.strokeDasharray = L + " " + L;
  }
  buildGeometry();

  var knotBtn = null, knotLbl = null, sendBtn = null, sendJob = -1;
  if (retie) {
    knotBtn = document.createElement("button");
    knotBtn.type = "button"; knotBtn.className = "knot"; knotBtn.setAttribute("aria-expanded", "false");
    knotBtn.setAttribute("aria-label", "Round two: compare Samuel's two stints at " + jobs[retie.from].company);
    knotBtn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 12c-4-5-9-3-8 1s6 4 8-1 6-6 8-2-4 7-8 2" fill="none" stroke="#1C1838" stroke-width="2.6" stroke-linecap="round"/></svg>';
    knotLbl = document.createElement("span"); knotLbl.className = "knot-lbl"; knotLbl.textContent = "Round two";
    route.appendChild(knotBtn); route.appendChild(knotLbl);
  }
  jobs.forEach(function (j, i) { if (j.highlight && sendJob < 0) sendJob = i; });
  if (sendJob > -1) {
    var hl = jobs[sendJob].highlight;
    sendBtn = document.createElement("button");
    sendBtn.type = "button"; sendBtn.className = "send";
    sendBtn.setAttribute("aria-label", hl.label + ": " + hl.from + " to " + hl.to + " at " + jobs[sendJob].company);
    sendBtn.title = hl.label;
    sendBtn.innerHTML = '<span>' + esc(hl.from) + ' →</span><b>' + esc(hl.to) + "</b>";
    route.appendChild(sendBtn);
  }
  function placeStory() {
    if (knotBtn) { var kp = svgToPx(knotPt); knotBtn.style.left = knotLbl.style.left = kp[0] + "px"; knotBtn.style.top = knotLbl.style.top = kp[1] + "px"; }
    if (sendBtn) { var sp = svgToPx([pts[sendJob][0] - 44, pts[sendJob][1] - 26]); sendBtn.style.left = sp[0] + "px"; sendBtn.style.top = sp[1] + "px"; }
  }

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
    hint.style.transform = "translate(calc(" + px[0].toFixed(1) + "px - 50%)," + px[1].toFixed(1) + "px)";
    placeStory();
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
    if (opts && opts.announce) { announce(); if (typeof shareHold === "function") shareHold(); }
  }
  function goHold(i, announceIt) { setPos(holdS[i], { announce: announceIt }); }

  // ---------- card + bag ----------
  var card = $("card"), chips = $("chips"), live = $("live"), bag = $("bag"), level = $("bagLevel");
  var totalNew = jobs.reduce(function (n, j) { return n + j._new.length; }, 0);
  var bagJobs = -1;           // index of the highest job whose skills are in the bag
  var interacted = false;
  function holdCenter(i) { var p = svgToPx(pts[i]), r = route.getBoundingClientRect(); return [p[0] + r.left, p[1] + r.top]; }
  function chipEl(t, i) { var c = document.createElement("button"); c.type = "button"; c.className = "chip"; c.dataset.skill = t; c.title = "Spotlight " + t + " on the wall"; c.dataset.j = i; c.textContent = t; c.style.setProperty("--c", jobs[i]._color); return c; }
  function fly(el, from, to, done) {
    var clone = el.cloneNode(true); clone.classList.add("flying");
    clone.style.left = from[0] + "px"; clone.style.top = from[1] + "px";
    document.body.appendChild(clone);
    var dx = to[0] - from[0], dy = to[1] - from[1];
    var a = clone.animate([
      { transform: "translate(-50%,-50%) scale(.4) rotate(-12deg)", opacity: 0 },
      { transform: "translate(calc(-50% + " + dx * .5 + "px), calc(-50% + " + (dy * .5 - 60) + "px)) scale(1.1) rotate(6deg)", opacity: 1, offset: .45 },
      { transform: "translate(calc(-50% + " + dx + "px), calc(-50% + " + dy + "px)) scale(1)", opacity: 1 }
    ], { duration: 520, easing: "cubic-bezier(.3,.7,.3,1)" });
    a.onfinish = function () { clone.remove(); if (done) done(); };
  }
  function syncBag(target, animate) {
    var anim = animate && !reduce.matches, delay = 0;
    while (bagJobs < target) {                       // climbing: new skills leave their hold and land in the bag
      bagJobs++;
      var jj = bagJobs;
      jobs[jj]._new.forEach(function (t) {
        var c = chipEl(t, jj); chips.insertBefore(c, chips.firstChild);
        if (anim) {
          c.style.visibility = "hidden";
          (function (c, jj, d) { setTimeout(function () {
            var r = c.getBoundingClientRect();
            fly(c, holdCenter(jj), [r.left + r.width / 2, r.top + r.height / 2], function () { c.style.visibility = ""; c.classList.add("land"); });
          }, d); })(c, jj, delay);
          delay += 45;
        }
      });
    }
    while (bagJobs > target) {                       // descending: they fly back to the wall
      var gone = chips.querySelectorAll('[data-j="' + bagJobs + '"]'), jx = bagJobs;
      gone.forEach(function (c) {
        if (anim) { var r = c.getBoundingClientRect(); if (r.width) fly(c, [r.left + r.width / 2, r.top + r.height / 2], holdCenter(jx)); }
        c.remove();
      });
      bagJobs--;
    }
    chips.querySelectorAll(".chip").forEach(function (c) { c.classList.toggle("new", +c.dataset.j === target); });
    var known = chips.children.length;
    $("bagCount").textContent = known + " skills";
    level.style.transform = "scaleY(" + (known / totalNew).toFixed(3) + ")";
  }
  function select(i) {
    var prev = active;
    if (typeof comparing !== "undefined" && comparing) { comparing = false; if (knotBtn) knotBtn.setAttribute("aria-expanded", "false"); }
    active = i;
    var j = jobs[i], isNow = i === N - 1;
    svg.querySelectorAll(".hold").forEach(function (h) { h.classList.toggle("on", +h.dataset.i === i); });
    card.innerHTML =
      '<div class="meta"><span class="grade' + (LIGHT_TEXT[j._color] ? " light" : "") + '" style="--c:' + j._color + '" title="Grade = new skills picked up on this pitch">V' + j._new.length + '</span>' +
      '<span class="mono">' + esc(j._span) + "</span>" + (j.highlight ? '<span class="send-tag" title="' + esc(j.highlight.label) + '">' + esc(j.highlight.from) + " → " + esc(j.highlight.to) + "</span>" : "") + "</div>" +
      (/present/i.test(j.end) ? '<span class="now mono grade" style="--c:#FFF7E8">Now</span>' : "") +
      "<h3>" + esc(j.role) + '</h3><p class="co">' + esc(j.company) + (j.location ? " · " + esc(j.location) : "") + "</p>" +
      "<ul>" + j.bullets.map(function (b) { return "<li>" + esc(b) + "</li>"; }).join("") + "</ul>" +
      (isNow ? '<div class="summit"><span class="mono">' + (interacted ? "You topped out. Say hi?" : "Summit · hiring? say hi") + '</span><span class="summit-btns"><a class="btn btn-hot" href="' + esc(mail) + '">Email</a><button class="btn" type="button" data-copy>Copy address</button></span></div>' : "");
    if (!reduce.matches) { card.classList.remove("swap"); void card.offsetWidth; card.classList.add("swap"); }
    syncBag(i, prev !== -1);
    if (isNow && interacted && prev !== -1 && prev !== i) puff();
    token.setAttribute("aria-valuenow", i);
    token.setAttribute("aria-valuetext", j._span + ", " + j.role + " at " + j.company);
    if (navigator.vibrate && dragging) { try { navigator.vibrate(10); } catch (e) {} }
  }
  function puff() {
    if (reduce.matches) return;
    var c = holdCenter(N - 1);
    for (var k = 0; k < 10; k++) {
      var dot = document.createElement("i"); dot.className = "puff";
      dot.style.left = c[0] + "px"; dot.style.top = c[1] + "px";
      document.body.appendChild(dot);
      var a = k / 10 * Math.PI * 2, dist = 30 + (k % 3) * 14;
      dot.animate([{ transform: "translate(-50%,-50%) scale(1)", opacity: .9 }, { transform: "translate(calc(-50% + " + Math.cos(a) * dist + "px), calc(-50% + " + Math.sin(a) * dist + "px)) scale(.3)", opacity: 0 }], { duration: 650, easing: "ease-out" }).onfinish = (function (d) { return function () { d.remove(); }; })(dot);
    }
  }
  card.addEventListener("click", function (e) {
    var b = e.target.closest("[data-copy]"); if (!b) return;
    var ok = function () { b.textContent = "Copied ✓"; setTimeout(function () { b.textContent = "Copy address"; }, 1800); };
    if (navigator.clipboard) navigator.clipboard.writeText(R.email).then(ok, function () { b.textContent = R.email; });
    else b.textContent = R.email;
  });
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
    dragging = true; interacted = true; dismissHint();
    token.classList.add("drag");
    token.setPointerCapture(e.pointerId);
    setPos(sampleFromEvent(e));
    e.preventDefault();
  }
  token.addEventListener("pointerdown", startDrag);
  token.addEventListener("pointermove", function (e) { if (dragging) setPos(sampleFromEvent(e)); });
  function endDrag() { if (!dragging) return; dragging = false; token.classList.remove("drag"); goHold(active, true); }
  function shareHold() { if (!spot && interacted) setHash(active === N - 1 ? "" : "job=" + jobs[active].id); }
  token.addEventListener("pointerup", endDrag);
  token.addEventListener("pointercancel", endDrag);
  // pressing on the route (desktop) grabs the token there; tapping a hold jumps to it
  route.addEventListener("pointerdown", function (e) {
    if (e.target === token || (e.target.closest && e.target.closest(".knot, .send"))) return;
    var h = e.target.closest && e.target.closest(".hold");
    if (h) { dismissHint(); interacted = true; goHold(+h.dataset.i, true); return; }
    if (e.pointerType === "mouse") { startDrag(e); return; }
    if (horizontal) touchStart = { x: e.clientX, y: e.clientY, id: e.pointerId };
  });
  // on phones a horizontal thumb swipe on the curve scrubs it; a vertical swipe still scrolls the page
  var touchStart = null;
  route.addEventListener("pointermove", function (e) {
    if (!touchStart || dragging || e.pointerId !== touchStart.id) return;
    var dx = e.clientX - touchStart.x, dy = e.clientY - touchStart.y;
    if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) { touchStart = null; startDrag(e); }
  });
  route.addEventListener("pointerup", function () { touchStart = null; });
  route.addEventListener("pointercancel", function () { touchStart = null; });

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
    e.preventDefault(); dismissHint(); interacted = true;
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
  rail.addEventListener("input", function () { dragging = true; interacted = true; dismissHint(); setPos(+rail.value); });
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
    if (!reduce.matches && !interacted && active === N - 1) { setPos(holdS[N - 1] - 18); setTimeout(function () { if (!interacted) setPos(holdS[N - 1]); }, 500); }
  }, 1200);

  // ---------- route description ----------
  $("jobs").innerHTML = R.jobs.map(function (j) {
    return '<li class="job" data-i="' + j._i + '" id="job-' + esc(j.id) + '" style="--c:' + j._color + '"><header><h3>' + esc(j.role) + '</h3><span class="when">' + esc(j._span) + "</span></header>" +
      '<p class="co">' + esc(j.company) + (j.location ? " · " + esc(j.location) : "") + "</p><ul>" +
      j.bullets.map(function (b) { return "<li>" + esc(b) + "</li>"; }).join("") + '</ul><div class="tags">' +
      j.tags.map(function (t) { return '<span class="chip">' + esc(t) + "</span>"; }).join("") +
      '<button class="show" type="button" data-job="' + j._i + '">Show on wall ↑</button></div></li>';
  }).join("");
  $("jobs").addEventListener("click", function (e) {
    var b = e.target.closest("[data-job]"); if (!b) return;
    interacted = true; goHold(+b.dataset.job, true); toWall();
  });

  // ---------- rack ----------
  $("rack").innerHTML = Object.keys(R.skills).map(function (grp) {
    return '<div class="rack-group"><h3>' + esc(grp) + '</h3><div class="chips">' + R.skills[grp].map(function (s) {
      var n = D.usedAt(s).length;
      return '<button type="button" class="chip" aria-pressed="false" data-skill="' + esc(s) + '">' + esc(s) + (n ? "<sup>×" + n + "</sup>" : "") + "</button>";
    }).join("") + "</div></div>";
  }).join("");

  function toWall() { window.scrollTo({ top: 0, behavior: reduce.matches ? "auto" : "smooth" }); token.focus({ preventScroll: true }); }
  // ---------- skill spotlight + deep links ----------
  var spot = null, spotBanner = $("spot"), rackNote = $("rackNote");
  function spotlight(skill, opts) {
    opts = opts || {};
    var key = skill && skill.toLowerCase();
    if (key && spot === key && !opts.force) key = null;          // clicking again clears
    interacted = true; dismissHint();
    spot = key || null;
    var used = spot ? D.usedAt(spot) : [];
    var usedIdx = used.map(function (j) { return j._i; });
    svg.querySelectorAll(".hold").forEach(function (h) { h.classList.toggle("dim", !!spot && usedIdx.indexOf(+h.dataset.i) < 0); });
    document.querySelectorAll("#jobs .job").forEach(function (li) { li.classList.toggle("dim", !!spot && usedIdx.indexOf(+li.dataset.i) < 0); });
    document.querySelectorAll("[data-skill]").forEach(function (b) {
      var on = !!spot && b.dataset.skill.toLowerCase() === spot;
      b.classList.toggle("lit", on); if (b.hasAttribute("aria-pressed")) b.setAttribute("aria-pressed", on);
    });
    if (spot) {
      var label = (used[0] && used[0].tags.find(function (t) { return t.toLowerCase() === spot; })) || skill;
      var where = used.length ? "Used at " + used.map(function (j) { return j.company; }).filter(function (c, k, a) { return a.indexOf(c) === k; }).join(", ") : "In the toolbox, not tied to one role here";
      spotBanner.innerHTML = '<b>' + esc(label) + '</b><span>' + esc(used.length ? used.length + " role" + (used.length > 1 ? "s" : "") : "no tagged roles") + '</span><button type="button" data-clear aria-label="Clear spotlight">✕</button>';
      spotBanner.hidden = false;
      rackNote.innerHTML = "<b>" + esc(label) + ":</b> " + esc(where) + ". " + (used.length ? '<button type="button" class="linkish" data-showwall>Show on the wall ↑</button>' : "");
      live.textContent = label + ". " + where + ".";
      if (used.length && usedIdx.indexOf(active) < 0 && !opts.keepHold) goHold(Math.max.apply(null, usedIdx));
      setHash("skill=" + encodeURIComponent(label));
    } else {
      spotBanner.hidden = true; rackNote.textContent = "";
      setHash("");
    }
  }
  function setHash(h) {
    var url = location.pathname + location.search + (h ? "#" + h : "");
    try { history.replaceState(null, "", url); } catch (e) {}
  }
  document.addEventListener("click", function (e) {
    var c = e.target.closest("[data-skill]");
    if (c) { spotlight(c.dataset.skill); return; }
    if (e.target.closest("[data-clear]")) { spotlight(null); return; }
    if (e.target.closest("[data-showwall]")) { toWall(); }
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && spot) { spotlight(null); e.preventDefault(); } });
  function readHash() {
    var h = decodeURIComponent(location.hash.slice(1));
    var m = h.match(/^skill=(.+)$/);
    if (m) { spotlight(m[1], { force: true }); return true; }
    m = h.match(/^job=(.+)$/);
    if (m) { var j = jobs.find(function (x) { return x.id === m[1]; }); if (j) { goHold(j._i); return true; } }
    return false;
  }
  addEventListener("hashchange", readHash);

  // ---------- round two compare ----------
  var comparing = false;
  function showCompare(on) {
    if (!on) { comparing = false; knotBtn.setAttribute("aria-expanded", "false"); select(active); return; }
    interacted = true; dismissHint();
    if (active !== retie.from) goHold(retie.from);
    comparing = true; knotBtn.setAttribute("aria-expanded", "true");
    var a = jobs[retie.to], b = jobs[retie.from];
    var had = {}; a.tags.forEach(function (t) { had[t.toLowerCase()] = 1; });
    var added = b.tags.filter(function (t) { return !had[t.toLowerCase()]; });
    card.innerHTML = '<div class="meta"><span class="grade" style="--c:#FFBE0B">Round two</span><span class="mono">' + esc(b.company) + "</span></div>" +
      "<h3>Same crag, new route</h3>" +
      '<div class="compare"><p>' + (added.length ? "New the second time: " + added.map(esc).join(", ") + "." : "Same toolkit, more experience.") + " First stint: " + esc(a.role) + ". Now: " + esc(b.role) + '.</p><div><h4>' + esc(a._span) + '</h4><div class="chips">' + a.tags.map(function (t) { return '<span class="chip">' + esc(t) + "</span>"; }).join("") + "</div></div>" +
      "<div><h4>" + esc(b._span) + '</h4><div class="chips">' + b.tags.map(function (t) { return '<span class="chip' + (had[t.toLowerCase()] ? "" : " added") + '">' + esc(t) + "</span>"; }).join("") + "</div></div></div>" + '<button class="btn" type="button" data-uncompare style="margin-top:10px;min-height:40px">Back to the route</button>';
    live.textContent = "Comparing " + a._span + " and " + b._span + " at " + b.company + ".";
  }
  if (knotBtn) knotBtn.addEventListener("click", function () { showCompare(!comparing); });
  card.addEventListener("click", function (e) { if (e.target.closest("[data-uncompare]")) { showCompare(false); knotBtn.focus(); } });
  if (sendBtn) sendBtn.addEventListener("click", function () { interacted = true; dismissHint(); goHold(sendJob, true); });

  // ---------- summit register: scrub through versions with a live preview ----------
  var V = window.VERSIONS;
  var embedded = window.self !== window.top || /[?&]embed=1/.test(location.search);
  if (V) (function () {
    var list = V.list.slice().sort(function (x, y) { return x.v - y.v; });
    var strip = $("altStrip"), note = $("scrubNote"), frame = $("scrubIframe"), cap = $("scrubCap"), box = $("scrubFrame");
    var idx = list.findIndex(function (e) { return e.v === V.current; }); if (idx < 0) idx = list.length - 1;
    var viewing = (function () { var m = location.pathname.match(/\/versions\/v(\d+)\//); return m ? +m[1] : V.current; })();
    function vurl(e) { return e.v === V.current ? INFRA.href : new URL("versions/v" + String(e.v).padStart(2, "0") + "/", INFRA).href; }
    strip.innerHTML = list.map(function (e, k) {
      return '<span class="alt-step' + (e.featured ? " feat" : "") + (e.v === V.current ? " best" : "") + (e.verdict === "rejected" ? " rej" : "") + '" data-k="' + k + '">' +
        '<i class="alt-bar" style="height:' + (14 + k * 6) + 'px"></i><b>' + e.v + "</b></span>";
    }).join("") + '<span class="alt-head" aria-hidden="true"></span>';
    strip.setAttribute("aria-valuemin", 0); strip.setAttribute("aria-valuemax", list.length - 1);
    var steps = strip.querySelectorAll(".alt-step"), head = strip.querySelector(".alt-head"), loadT;
    function show(k, load) {
      idx = Math.max(0, Math.min(list.length - 1, k));
      var e = list[idx];
      steps.forEach(function (st, n) { st.classList.toggle("on", n === idx); });
      head.style.left = (steps[idx].offsetLeft + steps[idx].offsetWidth / 2) + "px";
      strip.setAttribute("aria-valuenow", idx);
      strip.setAttribute("aria-valuetext", "Version " + e.v + ": " + e.title + " (" + e.verdict + ")");
      var isHere = e.v === viewing;
      note.innerHTML = '<span class="mono">v' + e.v + " · " + esc(e.date) + '</span> <span class="vtag ' + esc(e.verdict) + '">' + esc(e.verdict) + "</span>" + (e.v === V.current ? ' <span class="vtag best">current best</span>' : "") +
        "<h3>" + esc(e.title) + "</h3><p>" + esc(e.note) + "</p>" + (e.try ? '<p class="try"><b>Try:</b> ' + esc(e.try) + "</p>" : "") +
        '<div class="cta-row">' + (isHere ? '<span class="btn" style="box-shadow:none;border-style:dashed">You are here</span>' : '<a class="btn btn-hot" href="' + vurl(e) + '">Open v' + e.v + " →</a>") +
        (viewing !== V.current ? '<a class="btn" href="' + INFRA.href + '">Current best ↩</a>' : "") + "</div>";
      cap.textContent = "Live preview · v" + e.v;
      clearTimeout(loadT);
      if (load !== false) loadT = setTimeout(function () { var u = vurl(e) + "?embed=1"; if (frame.dataset.src !== u) { frame.dataset.src = u; frame.src = u; } }, 260);
    }
    function fit() {
      var w = phone.matches ? 390 : 1280, h = phone.matches ? 844 : 800, sc = box.clientWidth / w;
      frame.style.width = w + "px"; frame.style.height = (box.clientHeight / sc) + "px"; frame.style.transform = "scale(" + sc + ")";
    }
    function kFromX(x) {
      var best = 0, bd = Infinity;
      steps.forEach(function (st, n) { var r = st.getBoundingClientRect(), c = r.left + r.width / 2; if (Math.abs(c - x) < bd) { bd = Math.abs(c - x); best = n; } });
      return best;
    }
    var scrubbing = false;
    strip.addEventListener("pointerdown", function (e) { scrubbing = true; strip.setPointerCapture(e.pointerId); show(kFromX(e.clientX)); });
    strip.addEventListener("pointermove", function (e) { if (scrubbing) show(kFromX(e.clientX)); });
    strip.addEventListener("pointerup", function () { scrubbing = false; });
    strip.addEventListener("pointercancel", function () { scrubbing = false; });
    strip.addEventListener("keydown", function (e) {
      var k = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[e.key];
      if (e.key === "Home") show(0); else if (e.key === "End") show(list.length - 1);
      else if (k) show(idx + k);
      else if (e.key === "Enter") { location.href = vurl(list[idx]); return; }
      else return;
      e.preventDefault();
    });
    addEventListener("resize", function () { fit(); show(idx, false); });
    fit(); show(idx, false);
    if (embedded) return;                                   // never nest previews
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { io.disconnect(); show(idx); } }, { rootMargin: "200px" });
      io.observe(box);
    } else show(idx);
  })();
  document.querySelectorAll('a[href="timeline/"]').forEach(function (a) { a.href = new URL("timeline/", INFRA).href; });

  // ---------- footer ----------
  $("footLinks").innerHTML = '<a class="btn btn-hot" href="' + esc(mail) + '">' + esc(R.email) + '</a><a class="btn" href="' + esc(R.github) + '" target="_blank" rel="noopener">GitHub</a><span class="btn" style="box-shadow:none;border-style:dashed">' + esc(R.location) + "</span>";

  // ---------- this page's own speed (MARCO's 99% story, applied here) ----------
  addEventListener("load", function () {
    setTimeout(function () {
      var nav = performance.getEntriesByType && performance.getEntriesByType("navigation")[0];
      var ms = nav ? Math.round(nav.domInteractive) : Math.round(performance.now());
      var el = document.createElement("p"); el.className = "speed";
      el.textContent = "This page was interactive in " + ms + " ms on your device.";
      $("contact").appendChild(el);
    }, 0);
  });

  // ---------- go ----------
  goHold(N - 1);
  if (readHash()) { dismissHint(); }
  shown = pos; draw();
  addEventListener("resize", function () { draw(); });
  phone.addEventListener("change", function () {
    var keep = active; buildGeometry();
    svg.querySelectorAll(".hold").forEach(function (h) { h.classList.toggle("on", +h.dataset.i === keep); });
    railDots.innerHTML = holdS.map(function (h) { return '<i style="left:' + (h / (S - 1) * 100) + '%"></i>'; }).join("") + '<span class="knob"></span>';
    knob = railDots.querySelector(".knob");
    pos = shown = holdS[keep]; draw(); drawRail(); if (spot) spotlight(spot, { force: true, keepHold: true });
  });
  if (document.fonts) document.fonts.ready.then(draw);
})();

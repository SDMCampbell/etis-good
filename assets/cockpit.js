(function () {
  "use strict";
  var R = window.RESUME, D = window.DERIVED;
  var $ = function (id) { return document.getElementById(id); };
  var reduce = matchMedia("(prefers-reduced-motion: reduce)");
  var phone = matchMedia("(max-width: 699px)");
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function pad(n) { return String(n).padStart(2, "0"); }
  var manifestScript = document.querySelector('script[src$="versions/manifest.js"]');
  var INFRA = manifestScript ? new URL("../", manifestScript.src) : new URL("./", location.href);
  var embedded = window.self !== window.top || /[?&]embed=1/.test(location.search);

  var jobs = D.chrono, N = jobs.length, cur = D.current;
  var mail = "mailto:" + R.email + "?subject=" + encodeURIComponent("Hello from your cockpit");

  // ---------- bays: every installed system belongs to a bay (a RESUME.skills group, or Ops) ----------
  var bayNames = Object.keys(R.skills).concat(["Ops"]);
  var bayOf = {};
  Object.keys(R.skills).forEach(function (g) { R.skills[g].forEach(function (s) { if (!bayOf[s.toLowerCase()]) bayOf[s.toLowerCase()] = g; }); });
  function bay(t) { return bayOf[t.toLowerCase()] || "Ops"; }
  var installs = [];   // every first-time skill, in career order
  jobs.forEach(function (j, i) { j._new.forEach(function (t) { installs.push({ t: t, k: i + 1, bay: bay(t) }); }); });
  var totalSystems = installs.length;

  // ---------- pilot plate + current assignment (works with zero interaction) ----------
  $("pilotName").textContent = R.name;
  $("pilotSub").textContent = R.title + " · " + R.location;
  var lastStint = jobs.filter(function (j) { return j.company === cur.company && j !== cur; }).pop();
  $("assignment").innerHTML =
    '<p class="asg-role">' + esc(cur.role) + '</p><p class="asg-co">' + esc(cur.company) + "</p>" +
    '<p class="asg-when">' + esc(cur._span) + (cur.location ? " · " + esc(cur.location) : "") + "</p>" +
    (cur.returning ? '<span class="badge">Re-commissioned' + (lastStint ? " · +" + (cur._cum - lastStint._cum) + " systems since last tour" : "") + "</span>" : "");

  // ---------- canopy horizon (generated ridgelines) ----------
  (function () {
    var out = "", seed = 11, rnd = function () { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    [["#2c3240", 60, 22], ["#232836", 78, 16], ["#1a1f2b", 94, 10]].forEach(function (l) {
      var d = "M0 120 L0 " + l[1];
      for (var x = 0; x <= 1200; x += 40) d += " L" + x + " " + (l[1] - rnd() * l[2]).toFixed(1);
      out += '<path d="' + d + ' L1200 120 Z" fill="' + l[0] + '"/>';
    });
    out += '<g stroke="#62D3E3" stroke-opacity=".35" stroke-width="1.2" fill="none"><circle cx="600" cy="56" r="14"/><path d="M600 30v12M600 70v12M574 56h12M614 56h12"/></g>';
    $("horizon").innerHTML = out;
  })();

  // ---------- lamps: one per sortie, lit once that sortie is installed ----------
  var LAMP = { "unitrends": "Comms", "clemson-ccit": "Sensors", "southeastern-freight": "Firmware", "xgrok": "Decode", "mindamp": "Recovery", "agfirst-senior": "Web", "marco-promos": "Tune" };
  $("lamps").innerHTML = jobs.map(function (j, i) {
    var name = LAMP[j.id] || (j.returning ? "Recomm" : j.company.split(" ")[0]);
    return '<span class="lamp" data-k="' + (i + 1) + '" title="Sortie ' + pad(i + 1) + ": " + esc(j.company) + '"><i></i>' + esc(name) + "</span>";
  }).join("");
  var lamps = [].slice.call(document.querySelectorAll(".lamp"));

  // ---------- frame schematic (original silhouette): one crate per installed system ----------
  var frameG = '<path class="body" d="M84 18h32l6 16h-44z M70 36h60l8 40-10 22H72L62 76z M62 44l-26 8-8 38 12 4 10-30 14-6z M138 44l26 8 8 38-12 4-10-30-14-6z M78 98l-8 52h18l10-40h4l10 40h18l-8-52z"/>';
  installs.forEach(function (s2, n) {
    var col = n % 5, row = Math.floor(n / 5), x = 73 + col * 11, y = 41 + row * 11;
    if (row >= 5) { x = (n % 2 ? 120 : 72) + (Math.floor((n - 25) / 2) % 2) * 6; y = 104 + Math.floor((n - 25) / 4) * 9; }
    frameG += '<rect class="crate" data-n="' + n + '" data-k="' + s2.k + '" x="' + x + '" y="' + y + '" width="9" height="9"><title>' + esc(s2.t) + "</title></rect>";
  });
  $("frame").innerHTML = frameG;
  var crates = [].slice.call(document.querySelectorAll(".frame .crate"));

  // ---------- sensor scope: systems are contacts; bay = sector, sortie = range ----------
  (function () {
    var g = '<defs><radialGradient id="sweepGrad" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="scale(100)"><stop offset="0" stop-color="#62D3E3" stop-opacity=".0"/><stop offset="1" stop-color="#62D3E3" stop-opacity=".22"/></radialGradient></defs>';
    [30, 55, 80, 100].forEach(function (r) { g += '<circle class="ring" r="' + r + '"/>'; });
    var sec = 360 / bayNames.length;
    bayNames.forEach(function (b, i) {
      var a = (i * sec - 90) * Math.PI / 180;
      g += '<line class="axis" x1="0" y1="0" x2="' + (Math.cos(a) * 100).toFixed(1) + '" y2="' + (Math.sin(a) * 100).toFixed(1) + '"/>';
      var am = ((i + .5) * sec - 90) * Math.PI / 180;
      g += '<text class="sector" x="' + (Math.cos(am) * 106).toFixed(1) + '" y="' + (Math.sin(am) * 106 + 2).toFixed(1) + '">' + esc(b.split(" ")[0].toUpperCase()) + "</text>";
    });
    g += '<path class="sweep" d="M0 0 L100 0 A100 100 0 0 0 70.7 -70.7 Z"/>';
    var perBay = {};
    installs.forEach(function (s, n) {
      var bi = bayNames.indexOf(s.bay), slot = (perBay[bi] = (perBay[bi] || 0) + 1);
      var a = ((bi + .18 + ((slot * .27) % .64)) * sec - 90) * Math.PI / 180, r = 18 + (s.k / N) * 74 + (slot % 2) * 5;
      var x = Math.cos(a) * r, y = Math.sin(a) * r;
      g += '<g class="contact" data-n="' + n + '" data-k="' + s.k + '"><circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="2.6"/><text x="' + (x + 4).toFixed(1) + '" y="' + (y + 2).toFixed(1) + '">' + esc(s.t) + "</text></g>";
    });
    $("scope").innerHTML = g;
  })();
  var contacts = [].slice.call(document.querySelectorAll(".contact"));

  // ---------- throttle ----------
  var thr = $("throttle"), handle = $("tHandle"), track = $("tTrack");
  track.innerHTML = jobs.map(function (j, i) { return '<div class="t-notch" data-k="' + (i + 1) + '"><span>' + Math.floor(j._t0) + "</span></div>"; }).join("");
  var notches = [].slice.call(track.querySelectorAll(".t-notch"));
  var p = 0, level = -1, dragging = false, interacted = false, autoRun = false;
  function horiz() { return phone.matches; }
  function layoutNotches() {
    notches.forEach(function (n, i) {
      var f = (i + 1) / N;
      if (horiz()) { n.style.left = (f * 100) + "%"; n.style.top = ""; } else { n.style.top = ((1 - f) * 100) + "%"; n.style.left = ""; }
    });
  }
  // transforms only: moving the handle never counts as layout shift
  function placeHandle() {
    var f = p / N;
    if (horiz()) handle.style.transform = "translateX(" + (f * (thr.clientWidth - 28)).toFixed(1) + "px)";
    else handle.style.transform = "translateY(" + ((1 - f) * (thr.clientHeight - 20)).toFixed(1) + "px)";
  }
  addEventListener("resize", function () { placeHandle(); });
  function setP(v, opts) {
    p = Math.max(0, Math.min(N, v));
    placeHandle();
    var L = Math.floor(p + 1e-6);
    if (L !== level) applyLevel(L, level, opts || {});
  }

  // ---------- console ----------
  // four fixed line slots: text scrolls through them, elements never move (no layout shift)
  var con = $("console"), lines = ["", "", "", ""];
  con.innerHTML = "<li></li><li></li><li></li><li></li>";
  var slots = [].slice.call(con.children);
  function log(html) {
    lines.push(html); lines.shift();
    slots.forEach(function (li, i) { li.innerHTML = lines[i] || "&nbsp;"; });
  }

  // ---------- applying an install level ----------
  var mission = $("mission"), live = $("live");
  function applyLevel(L, prev, opts) {
    level = L;
    var installed = installs.filter(function (s) { return s.k <= L; });
    contacts.forEach(function (c) { var k = +c.dataset.k; c.classList.toggle("on", k <= L); c.classList.toggle("new", k === L); });
    lamps.forEach(function (l) { l.classList.toggle("on", +l.dataset.k <= L); });
    notches.forEach(function (n) { n.classList.toggle("done", +n.dataset.k <= L); });
    crates.forEach(function (c) { var k = +c.dataset.k; c.classList.toggle("lit", k <= L); c.classList.toggle("fresh", k === L); });
    counters(L, installed.length);
    $("tYear").textContent = L ? Math.floor(jobs[L - 1]._t0) : D.firstYear;
    handle.setAttribute("aria-valuenow", L);
    handle.setAttribute("aria-valuetext", L ? Math.floor(jobs[L - 1]._t0) + ", Sortie " + L + " of " + N + ": " + jobs[L - 1].role + " at " + jobs[L - 1].company + ", " + installed.length + " systems online" : "Cold start, no systems installed");
    renderMission(L);
    if (opts.quiet) return;
    if (typeof sfx !== "undefined") { sfx.tick(); if (L > prev && jobs[L - 1] && jobs[L - 1]._new.length) sfx.chirp(); if (jobs[L - 1] && jobs[L - 1].highlight && L > prev) sfx.whoosh(); }
    if (typeof noteExtreme === "function") noteExtreme(L);
    if (interacted && typeof achieve === "function") { if (L > prev) achieve("first"); if (L === N && !autoRun) achieve("full"); }
    if (prev >= 0 && L > prev) {
      for (var k = prev + 1; k <= L; k++) {
        var j = jobs[k - 1];
        log("<em>SORTIE " + pad(k) + "</em> · " + esc(j.company) + " · " + esc(j._span));
        log(j._new.length ? (j._new.some(function (t) { return LEGACY.test(t); }) ? "FLASHING FIRMWARE: " : "INSTALLING: ") + j._new.map(esc).join(" · ") + " <b>▮▮▮ OK</b>" : "NO NEW SYSTEMS · EXISTING SYSTEMS UPGRADED <b>OK</b>");
      }
      if (L === N) log("<b>ALL SYSTEMS NOMINAL</b> · " + installed.length + " SYSTEMS ONLINE");
    } else if (prev > L) {
      log("<em>REWIND</em> · " + (L ? "SORTIE " + pad(L) + " · " + esc(jobs[L - 1].company) : "COLD START") + " · " + installed.length + " SYSTEMS");
    }
  }
  function counters(L, online) {
    $("counters").innerHTML =
      "<div><dt>Service</dt><dd>" + D.yearsIn + "<small> yr</small></dd></div>" +
      "<div><dt>Systems</dt><dd>" + online + "<small>/" + totalSystems + "</small></dd></div>" +
      "<div><dt>Sorties</dt><dd>" + L + "<small>/" + N + "</small></dd></div>";
  }
  function renderMission(L) {
    if (!L) {
      mission.className = "mission cold";
      mission.innerHTML = "<div><b>Cold start</b>Frame AX-1 · no systems installed<br>Push the throttle to install systems →</div>";
      return;
    }
    var j = jobs[L - 1];
    var legacy = j._new.filter(function (t) { return LEGACY.test(t); });
    var decode = j.bullets.some(function (b) { return /reverse-engineer/i.test(b); });
    mission.className = "mission" + (decode ? " decoding" : "");
    mission.innerHTML =
      '<div class="m-head"><span class="m-num">Sortie ' + pad(L) + "/" + pad(N) + '</span><span class="m-span">' + esc(j._span) + "</span>" +
      (j.returning ? '<span class="m-tag">Re-commissioned</span>' : "") + (/present/i.test(j.end) ? '<span class="m-tag">Active</span>' : "") +
      (decode ? '<span class="m-tag dec">Signal decode</span>' : "") + '<button type="button" class="brief-btn" data-brief>Briefing ▸</button></div>' +
      "<h3>" + esc(j.role) + '</h3><p class="m-co">' + esc(j.company) + (j.location ? " · " + esc(j.location) : "") + "</p>" +
      (j.highlight ? tuneGauge(j.highlight) : "") +
      "<ul>" + j.bullets.map(function (b) { return '<li><span class="real">' + esc(b) + "</span></li>"; }).join("") + "</ul>" +
      (legacy.length ? '<div class="fw"><b>Legacy firmware</b> ' + legacy.map(esc).join(", ") + " · still in service</div>" : "") +
      '<div class="m-inst">Installed here:' + (j._new.length ? j._new.map(function (t) { return '<span class="chip' + (LEGACY.test(t) ? " fw" : "") + '">' + esc(t) + "</span>"; }).join("") : " <span>upgrades to existing systems</span>") + "</div>";
    if (decode && !reduce.matches) decodeBullets();
    if (decode && interacted && typeof achieve === "function") achieve("decode");
    if (legacy.length && interacted && typeof achieve === "function") achieve("legacy");
    if (j.highlight && interacted && typeof achieve === "function") achieve("tuned");
    if (j.highlight) sweepTune();
    if (j.returning) ghostRefit(j);
  }
  // ---------- story refits ----------
  var LEGACY = /^cobol$/i;
  function tuneGauge(h) {
    return '<div class="tune"><svg viewBox="0 0 120 66" aria-hidden="true"><path class="band bad" d="M12 60 A48 48 0 0 1 40 18"/><path class="band mid" d="M42 17 A48 48 0 0 1 78 17"/><path class="band good" d="M80 18 A48 48 0 0 1 108 60"/>' +
      '<line class="needle" id="needle" x1="60" y1="60" x2="60" y2="20"/><circle cx="60" cy="60" r="4" fill="#E4ECEF"/></svg>' +
      '<div><b>Tune</b><span class="from">' + esc(h.from) + '</span> → <span class="to">' + esc(h.to) + "</span><small>" + esc(h.label) + "</small></div></div>";
  }
  function sweepTune() {
    var nd = $("needle"); if (!nd) return;
    if (reduce.matches) { nd.style.transform = "rotate(62deg)"; return; }
    nd.style.transform = "rotate(-62deg)"; void nd.getBoundingClientRect();
    requestAnimationFrame(function () { nd.style.transition = "transform 1.1s cubic-bezier(.3,1.4,.5,1)"; nd.style.transform = "rotate(62deg)"; });
  }
  var GLYPHS = "ABCDEF0123456789#$%&";
  function decodeBullets() {
    mission.querySelectorAll("li").forEach(function (li) {
      var real = li.querySelector(".real"), txt = real.textContent, scr = document.createElement("span");
      scr.className = "scr"; scr.setAttribute("aria-hidden", "true"); li.appendChild(scr);
      var t0 = performance.now(), dur = 600;
      (function step(t) {
        var k = Math.min(1, (t - t0) / dur), keep = Math.floor(txt.length * k), out = txt.slice(0, keep);
        for (var i = keep; i < txt.length; i++) out += txt[i] === " " ? " " : GLYPHS[(Math.random() * GLYPHS.length) | 0];
        scr.textContent = out;
        if (k < 1) requestAnimationFrame(step); else { scr.remove(); li.classList.add("decoded"); }
      })(t0);
    });
  }
  function ghostRefit(j) {
    var prev = jobs.filter(function (x) { return x.company === j.company && x !== j; }).pop();
    if (!prev || reduce.matches) return;
    var fr = $("frame"); fr.classList.add("ghost");
    crates.forEach(function (c) { c.classList.toggle("was", +c.dataset.k <= prev._i + 1); });
    log("<em>HANGAR</em> · RE-DOCKING " + esc(j.company.toUpperCase()) + " LOADOUT FROM " + Math.floor(prev._t0) + " · +" + (j._cum - prev._cum) + " SYSTEMS SINCE LAST TOUR");
    setTimeout(function () { fr.classList.remove("ghost"); }, 1000);
  }
  // ping: tap empty scope space to lock the nearest online contact
  function pingScope(e) {
    var m = scopeSvg.getScreenCTM(); if (!m) return null;
    var inv = m.inverse(), x = inv.a * e.clientX + inv.c * e.clientY + inv.e, y = inv.b * e.clientX + inv.d * e.clientY + inv.f;
    if (!reduce.matches) {
      var rip = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      rip.setAttribute("class", "ripple"); rip.setAttribute("cx", x); rip.setAttribute("cy", y); scopeSvg.appendChild(rip);
      var t0 = performance.now();
      (function step(t) { var k = Math.max(0, (t - t0) / 700); rip.setAttribute("r", (k * 50).toFixed(1)); rip.setAttribute("stroke-opacity", (1 - k).toFixed(2)); if (k < 1) requestAnimationFrame(step); else rip.remove(); })(t0);
    }
    var best = null, bd = Infinity;
    contacts.forEach(function (c) { if (!c.classList.contains("on")) return; var d = c.querySelector("circle"), dx = +d.getAttribute("cx") - x, dy = +d.getAttribute("cy") - y, dd = dx * dx + dy * dy; if (dd < bd) { bd = dd; best = c; } });
    return best;
  }
  var annT;
  function announce() {
    clearTimeout(annT);
    annT = setTimeout(function () {
      var L = level; if (!L) { live.textContent = "Cold start."; return; }
      var j = jobs[L - 1];
      live.textContent = "Sortie " + L + ", " + j.company + ", " + j.role + ". " + (j._new.length ? "Installed " + j._new.join(", ") + ". " : "") + j._cum + " systems online.";
    }, 300);
  }

  // ---------- pointer / touch on the throttle ----------
  function pFromEvent(e) {
    var r = track.getBoundingClientRect();
    var f = horiz() ? (e.clientX - r.left) / r.width : 1 - (e.clientY - r.top) / r.height;
    return Math.max(0, Math.min(1, f)) * N;
  }
  function takeover() { interacted = true; autoRun = false; stopAuto(); hideSkip(); }
  var touchStart = null;
  thr.addEventListener("pointerdown", function (e) {
    if (e.pointerType === "touch" && horiz() && e.target !== handle) { touchStart = { x: e.clientX, y: e.clientY, id: e.pointerId }; return; }
    begin(e);
  });
  function begin(e) {
    takeover(); dragging = true;
    thr.setPointerCapture(e.pointerId);
    setP(pFromEvent(e)); e.preventDefault();
  }
  thr.addEventListener("pointermove", function (e) {
    if (touchStart && !dragging && e.pointerId === touchStart.id) {
      var dx = e.clientX - touchStart.x, dy = e.clientY - touchStart.y;
      if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) { touchStart = null; begin(e); }
      return;
    }
    if (dragging) setP(pFromEvent(e));
  });
  function end() {
    touchStart = null;
    if (!dragging) return;
    dragging = false; settle(Math.round(p));
  }
  thr.addEventListener("pointerup", function (e) { if (touchStart && !dragging) { touchStart = null; takeover(); settle(Math.round(pFromEvent(e))); return; } end(); });
  thr.addEventListener("pointercancel", end);
  thr.addEventListener("wheel", function (e) { e.preventDefault(); takeover(); settle(Math.round(p) + (e.deltaY < 0 ? 1 : -1)); }, { passive: false });

  // glide to a whole sortie (snap)
  var glideRaf = 0;
  function settle(target, opts) {
    target = Math.max(0, Math.min(N, target));
    cancelAnimationFrame(glideRaf);
    if (reduce.matches || (opts && opts.instant)) { setP(target, opts); announce(); share(); return; }
    var from = p, t0 = performance.now(), dur = Math.min(900, 160 + Math.abs(target - from) * 120);
    (function step(t) {
      var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      setP(from + (target - from) * e, opts);
      if (k < 1) glideRaf = requestAnimationFrame(step); else { announce(); share(); }
    })(t0);
  }

  // ---------- keyboard ----------
  handle.setAttribute("aria-valuemin", 0); handle.setAttribute("aria-valuemax", N);
  handle.addEventListener("keydown", function (e) {
    var L = Math.round(p), k = e.key, t;
    if (k === "ArrowUp" || k === "ArrowRight") t = L + 1;
    else if (k === "ArrowDown" || k === "ArrowLeft") t = L - 1;
    else if (k === "Home") t = 0; else if (k === "End") t = N;
    else if (k === "PageUp") t = L + 3; else if (k === "PageDown") t = L - 3;
    else return;
    e.preventDefault(); takeover(); settle(t);
  });
  document.addEventListener("keydown", function (e) {
    if (/input|textarea|select/i.test(e.target.tagName) || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === "t" || e.key === "T") { e.preventDefault(); handle.focus(); }
    else if (e.key === "f" || e.key === "F") { takeover(); settle(N); }
    else if (/^[1-9]$/.test(e.key) && +e.key <= N && e.target === document.body) { takeover(); settle(+e.key); }
  });

  // ---------- never an empty cockpit: auto-advance to full systems ----------
  var autoT = null, skipBtn = $("skipBtn");
  function hideSkip() { skipBtn.hidden = true; }
  function stopAuto() { clearTimeout(autoT); autoT = null; }
  skipBtn.addEventListener("click", function () { takeover(); settle(N, { fast: true }); });

  // ---------- HAIL (contact) ----------
  var hailBtn = $("hailBtn"), hailPanel = $("hailPanel");
  hailPanel.innerHTML = '<a href="' + esc(mail) + '">Open email to ' + esc(R.email) + '</a><button type="button" id="copyMail">Copy email address</button><a href="' + esc(R.github) + '" target="_blank" rel="noopener">GitHub profile ↗</a>';
  function setHail(open) { hailPanel.hidden = !open; hailBtn.setAttribute("aria-expanded", open); if (open) hailPanel.querySelector("a").focus(); }
  hailBtn.addEventListener("click", function () { setHail(hailPanel.hidden); });
  document.addEventListener("click", function (e) { if (!hailPanel.hidden && !hailPanel.contains(e.target) && e.target !== hailBtn && !hailBtn.contains(e.target)) setHail(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !hailPanel.hidden) { setHail(false); hailBtn.focus(); e.preventDefault(); } });
  $("copyMail").addEventListener("click", function () {
    var b = this;
    (navigator.clipboard ? navigator.clipboard.writeText(R.email) : Promise.reject()).then(function () { b.textContent = "Copied ✓"; }, function () { b.textContent = R.email; });
  });

  // ---------- plain record (résumé) ----------
  $("recSummary").textContent = R.summary + " " + R.tagline;
  $("recJobs").innerHTML = R.jobs.map(function (j) {
    return '<li id="rec-' + esc(j.id) + '"><div class="when">' + esc(j._span) + '</div><div><h4>' + esc(j.role) + '</h4><p class="co">' + esc(j.company) + (j.location ? " · " + esc(j.location) : "") + "</p><ul>" +
      j.bullets.map(function (b) { return "<li>" + esc(b) + "</li>"; }).join("") + "</ul></div></li>";
  }).join("");
  $("bays").innerHTML = Object.keys(R.skills).map(function (g) {
    return '<div class="bay"><b>' + esc(g) + '</b><div class="chips">' + R.skills[g].map(function (s) { return '<button type="button" class="chip" data-lock="' + esc(s) + '" title="Lock ' + esc(s) + ' on the sensors">' + esc(s) + "</button>"; }).join("") + "</div></div>";
  }).join("");
  $("recContact").innerHTML = '<a href="mailto:' + esc(R.email) + '">' + esc(R.email) + '</a> · <a href="' + esc(R.github) + '">GitHub</a> · ' + esc(R.location);
  document.querySelectorAll('a[href="timeline/"]').forEach(function (a) { a.href = new URL("timeline/", INFRA).href; });

  // ---------- target lock: where was a system used? ----------
  var lockIn = $("lockIn"), legend = $("legend"), scopeSvg = $("scope"), locked = null;
  var allSkills = {};
  installs.forEach(function (s) { allSkills[s.t.toLowerCase()] = s.t; });
  Object.keys(R.skills).forEach(function (g) { R.skills[g].forEach(function (x) { if (!allSkills[x.toLowerCase()]) allSkills[x.toLowerCase()] = x; }); });
  $("lockList").innerHTML = Object.keys(allSkills).map(function (k) { return '<option value="' + esc(allSkills[k]) + '">'; }).join("");
  var ret = document.createElementNS("http://www.w3.org/2000/svg", "g");
  ret.setAttribute("class", "reticle"); ret.innerHTML = '<path d="M-9 -4v-5h5M9 -4v-5h-5M-9 4v5h5M9 4v5h-5"/>';
  scopeSvg.appendChild(ret);
  function findSkill(q) {
    q = String(q || "").trim().toLowerCase(); if (!q) return null;
    var keys = Object.keys(allSkills);
    return allSkills[q] || allSkills[keys.filter(function (k) { return k.indexOf(q) === 0; })[0]] || allSkills[keys.filter(function (k) { return k.indexOf(q) > -1; })[0]] || null;
  }
  function lock(name, opts) {
    opts = opts || {};
    locked = name || null;
    contacts.forEach(function (c) { c.classList.remove("locked"); });
    notches.forEach(function (n) { n.classList.remove("lock"); });
    ret.classList.remove("on");
    if (!locked) { legend.textContent = ""; lockIn.value = ""; setHash(level === N ? "full" : level ? "sortie=" + jobs[level - 1].id : ""); return; }
    var used = D.usedAt(locked), usedK = used.map(function (j) { return j._i + 1; });
    notches.forEach(function (n) { if (usedK.indexOf(+n.dataset.k) > -1) n.classList.add("lock"); });
    var n = installs.findIndex(function (s) { return s.t.toLowerCase() === locked.toLowerCase(); });
    if (n > -1) {
      if (level < installs[n].k && !opts.keepLevel) settle(Math.max.apply(null, usedK.concat([installs[n].k])), { instant: !!opts.instant });
      var c = contacts[n]; c.classList.add("locked");
      var dot = c.querySelector("circle");
      ret.setAttribute("transform", "translate(" + dot.getAttribute("cx") + " " + dot.getAttribute("cy") + ")");
      ret.classList.remove("on"); void ret.getBoundingClientRect(); ret.classList.add("on");
      if (typeof sfx !== "undefined") sfx.lock();
      if (typeof achieve === "function") { achieve("lock"); if (LEGACY.test(locked)) achieve("legacy"); }
    }
    legend.innerHTML = "<b>LOCK: " + esc(locked) + "</b> · " + (used.length
      ? "used in " + used.length + " sortie" + (used.length > 1 ? "s" : "") + ": " + used.slice().sort(function (a, b) { return a._i - b._i; }).map(function (j) { return '<button type="button" class="jump" data-k="' + (j._i + 1) + '">' + esc(j.company.split(" ")[0]) + " " + Math.floor(j._t0) + "</button>"; }).join(" ")
      : "listed in the system bays, not tied to one sortie") + ' <button type="button" class="jump clr" data-clear aria-label="Clear lock">✕</button>';
    lockIn.value = locked;
    setHash("lock=" + encodeURIComponent(locked));
  }
  $("lockForm").addEventListener("submit", function (e) {
    e.preventDefault(); takeover();
    var hit = findSkill(lockIn.value);
    if (hit) lock(hit); else legend.innerHTML = "<b>NO CONTACT</b> · nothing called “" + esc(lockIn.value) + "” on file";
  });
  lockIn.addEventListener("change", function () { var hit = findSkill(lockIn.value); if (hit && hit !== locked) { takeover(); lock(hit); } });
  scopeSvg.addEventListener("click", function (e) { var c = e.target.closest(".contact.on") || pingScope(e); if (c) { takeover(); lock(installs[+c.dataset.n].t, { keepLevel: true }); } });
  document.addEventListener("click", function (e) {
    var j = e.target.closest(".jump"); if (j) { if (j.hasAttribute("data-clear")) lock(null); else { takeover(); settle(+j.dataset.k); } return; }
    var b = e.target.closest("[data-lock]"); if (b) { takeover(); lock(b.dataset.lock, { instant: true }); $("cockpit").scrollIntoView({ behavior: reduce.matches ? "auto" : "smooth" }); }
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && locked && hailPanel.hidden && !$("ref").open) { lock(null); e.preventDefault(); }
    if (e.key === "/" && !/input|textarea/i.test(e.target.tagName)) { e.preventDefault(); lockIn.focus(); }
  });
  function setHash(h) { if (embedded) return; try { history.replaceState(null, "", location.pathname + location.search + (h ? "#" + h : "")); } catch (e) {} }

  // ---------- sound: opt-in only, synthesized, nothing loads until asked ----------
  var sndBtn = $("sndBtn"), audio = null, soundOn = false, lastChirp = 0;
  try { soundOn = localStorage.getItem("cockpit-sound") === "on"; } catch (e) {}
  function sndUI() { sndBtn.setAttribute("aria-pressed", soundOn); $("sndLbl").textContent = soundOn ? "On" : "Off"; }
  function ctx() { if (!audio) { var A = window.AudioContext || window.webkitAudioContext; if (!A) return null; audio = new A(); } if (audio.state === "suspended") audio.resume(); return audio; }
  function tone(f1, f2, dur, type, vol) {
    if (!soundOn || document.hidden) return;
    var c = ctx(); if (!c) return;
    var o = c.createOscillator(), g = c.createGain(), t = c.currentTime;
    o.type = type || "square"; o.frequency.setValueAtTime(f1, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.05, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + dur + 0.02);
  }
  var sfx = {
    tick: function () { tone(660, 0, .05, "square", .03); buzz(8); },
    chirp: function () { var n = performance.now(); if (n - lastChirp < 160) return; lastChirp = n; tone(520, 980, .12, "triangle", .05); },
    lock: function () { tone(880, 0, .08, "sine", .06); setTimeout(function () { tone(1320, 0, .1, "sine", .05); }, 90); },
    whoosh: function () { tone(140, 900, .4, "sawtooth", .03); },
    alarm: function () { tone(440, 220, .35, "square", .05); }
  };
  function buzz(ms) { if (soundOn && navigator.vibrate) try { navigator.vibrate(ms); } catch (e) {} }
  function toggleSound() { soundOn = !soundOn; sndUI(); try { localStorage.setItem("cockpit-sound", soundOn ? "on" : "off"); } catch (e) {} if (soundOn) { ctx(); sfx.lock(); } }
  sndBtn.addEventListener("click", toggleSound); sndUI();

  // ---------- pilot reference card ----------
  var ref = $("ref");
  $("refList").innerHTML = [
    ["T", "Focus the throttle"], ["↑ ↓ / ← →", "Next / previous sortie"], ["Home / End", "Cold start / full systems"], ["PgUp / PgDn", "Three sorties at a time"],
    ["1–" + N, "Jump to sortie N"], ["F", "Full systems"], ["L", "Loadout: the whole stack"], ["Enter", "Briefing for this sortie"], ["/", "Lock a system"], ["Esc", "Clear lock / close"], ["M", "Sound on/off"], ["P", "Print the plain résumé"], ["?", "This card"],
    ["#lock=PHP", "Link straight to a lock"], ["#sortie=xgrok", "Link straight to a sortie"], ["overdrive", "Don't."]
  ].map(function (r) { return "<div><dt>" + esc(r[0]) + "</dt><dd>" + esc(r[1]) + "</dd></div>"; }).join("");
  function openRef() { if (ref.showModal && !ref.open) { ref.showModal(); $("refClose").focus(); achieve("ref"); } }
  $("refClose").addEventListener("click", function () { ref.close(); });
  ref.addEventListener("click", function (e) { if (e.target === ref) ref.close(); });
  $("keysBtn").addEventListener("click", openRef);

  // ---------- overdrive (easter egg) ----------
  var typed = "", slams = [], hot = false;
  function overdrive() {
    if (hot) return; hot = true;
    document.body.classList.add("overdrive"); achieve("hot");
    log('<em class="hot">WARNING</em> · HEAT CRITICAL · THROTTLE ABUSE DETECTED'); sfx.alarm();
    setTimeout(function () { log("<b>COOLANT FLUSH</b>: try learning something new"); }, 1200);
    setTimeout(function () { document.body.classList.remove("overdrive"); hot = false; }, reduce.matches ? 1500 : 2800);
  }
  function noteExtreme(L) {
    if (L !== 0 && L !== N) return;
    var now = performance.now(); slams = slams.filter(function (s) { return now - s.t < 2000; });
    if (!slams.length || slams[slams.length - 1].L !== L) slams.push({ L: L, t: now });
    if (slams.length >= 3) { slams = []; overdrive(); }
  }
  document.addEventListener("keydown", function (e) {
    var typing = /input|textarea|select/i.test(e.target.tagName);
    if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === "?") { e.preventDefault(); openRef(); return; }
    if (e.key === "m" || e.key === "M") { toggleSound(); return; }
    if (e.key === "p" || e.key === "P") { e.preventDefault(); print(); return; }
    if (e.key.length === 1) { typed = (typed + e.key.toLowerCase()).slice(-9); if (typed === "overdrive") { typed = ""; overdrive(); } }
  });

  // ---------- mission briefing (full view per sortie, shareable) ----------
  var brief = $("brief"), briefK = 0;
  function openBrief(k) {
    k = Math.max(1, Math.min(N, k || level || N)); briefK = k;
    var j = jobs[k - 1];
    $("briefBody").innerHTML =
      '<p class="b-k">Mission briefing · Sortie ' + pad(k) + "/" + pad(N) + "</p>" +
      '<div class="b-grid"><section><h3>Objective</h3><p class="b-obj">' + esc(j.role) + "</p></section>" +
      "<section><h3>Theatre</h3><p>" + esc(j.company) + (j.location ? "<br>" + esc(j.location) : "") + '<br><span class="m-span">' + esc(j._span) + "</span></p></section>" +
      '<section class="b-wide"><h3>Intel</h3><ul>' + j.bullets.map(function (b) { return "<li>" + esc(b) + "</li>"; }).join("") + "</ul></section>" +
      '<section class="b-wide"><h3>Systems fitted</h3><p>' + (j._new.length ? j._new.map(function (t) { return '<span class="chip' + (LEGACY.test(t) ? " fw" : "") + '">' + esc(t) + "</span>"; }).join(" ") : "Upgrades to existing systems") +
      '</p><p class="b-tot">' + j._cum + " systems online after this sortie</p></section></div>" +
      '<div class="b-nav"><button type="button" data-bk="' + (k - 1) + '"' + (k <= 1 ? " disabled" : "") + '>◂ Previous</button><button type="button" id="briefCopy">Copy link</button><button type="button" data-bk="' + (k + 1) + '"' + (k >= N ? " disabled" : "") + ">Next ▸</button></div>";
    if (!brief.open && brief.showModal) brief.showModal();
    achieve("brief");
    setHash("sortie=" + j.id + "&brief");
    if (level !== k) settle(k, { instant: true });
  }
  function closeBrief() { if (brief.open) brief.close(); }
  brief.addEventListener("close", function () { setHash(level === N ? "full" : level ? "sortie=" + jobs[level - 1].id : ""); handle.focus({ preventScroll: true }); });
  brief.addEventListener("click", function (e) {
    if (e.target === brief || e.target.closest("[data-bclose]")) return closeBrief();
    var b = e.target.closest("[data-bk]"); if (b && !b.disabled) openBrief(+b.dataset.bk);
    if (e.target.id === "briefCopy") { var t = e.target; (navigator.clipboard ? navigator.clipboard.writeText(location.href) : Promise.reject()).then(function () { t.textContent = "Link copied ✓"; }, function () { t.textContent = location.href; }); }
  });
  brief.addEventListener("keydown", function (e) { if (e.key === "ArrowRight" && briefK < N) openBrief(briefK + 1); else if (e.key === "ArrowLeft" && briefK > 1) openBrief(briefK - 1); });
  mission.addEventListener("click", function (e) { if (e.target.closest("[data-brief]")) { takeover(); openBrief(level); } });
  handle.addEventListener("keydown", function (e) { if (e.key === "Enter" && level) { e.preventDefault(); openBrief(level); } });
  // swipe the mission card on touch to step sorties
  var sw = null;
  mission.addEventListener("pointerdown", function (e) { if (e.pointerType === "touch") sw = { x: e.clientX, y: e.clientY }; });
  mission.addEventListener("pointerup", function (e) {
    if (!sw) return; var dx = e.clientX - sw.x, dy = e.clientY - sw.y; sw = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) { takeover(); settle(Math.round(p) + (dx < 0 ? 1 : -1)); }
  });
  mission.addEventListener("pointercancel", function () { sw = null; });

  // ---------- pilot record: achievements (local only, never gating content) ----------
  var ACH = [
    ["first", "First refit", "Push the throttle yourself"], ["full", "Full systems", "Bring every system online by hand"],
    ["decode", "Decoder", "Watch a sortie's intel decode"], ["legacy", "Legacy certified", "Find the firmware that's still in service"],
    ["tuned", "Tuned", "See the engine tuning gauge"], ["lock", "Locked on", "Lock a system on the sensors"],
    ["brief", "Briefed", "Open a mission briefing"], ["ref", "Pilot's reference", "Open the reference card"], ["hot", "Overdrive", "Push the frame too hard"]
  ];
  var earned = {};
  try { earned = JSON.parse(localStorage.getItem("cockpit-ach") || "{}") || {}; } catch (e) {}
  var toastEl = $("toast"), toastT;
  function achUI() {
    $("recCount").textContent = Object.keys(earned).length + "/" + ACH.length;
    $("achList").innerHTML = ACH.map(function (a) { var on = !!earned[a[0]]; return '<li class="' + (on ? "got" : "") + '"><b>' + (on ? "★ " : "☆ ") + esc(a[1]) + "</b><span>" + esc(on ? "Earned" : a[2]) + "</span></li>"; }).join("");
  }
  function achieve(id) {
    if (embedded || earned[id]) return;
    var a = ACH.filter(function (x) { return x[0] === id; })[0]; if (!a) return;
    earned[id] = Date.now();
    try { localStorage.setItem("cockpit-ach", JSON.stringify(earned)); } catch (e) {}
    achUI();
    toastEl.innerHTML = "<b>★ Achievement</b> " + esc(a[1]);
    toastEl.classList.add("show"); clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove("show"); }, 2600);
    if (typeof sfx !== "undefined") sfx.chirp();
  }
  var achDlg = $("achDlg");
  $("recAux").addEventListener("click", function () { $("recBtn").click(); });
  $("recBtn").addEventListener("click", function () { achUI(); if (achDlg.showModal) achDlg.showModal(); achDlg.querySelector("[data-achclose]").focus(); });
  achDlg.addEventListener("click", function (e) { if (e.target === achDlg || e.target.closest("[data-achclose]")) achDlg.close(); });
  achUI();

  // ---------- gamepad: fly the cockpit with a controller (nothing runs until one connects) ----------
  var padRaf = 0, prevBtn = [], stickMoving = false;
  function padLamp(on) {
    var l = $("padLamp");
    if (on && !l) { l = document.createElement("span"); l.id = "padLamp"; l.className = "lamp on pad"; l.innerHTML = "<i></i>Controller linked"; $("lamps").appendChild(l); }
    if (!on && l) l.remove();
  }
  function pressed(gp, i) { var b = gp.buttons[i]; return !!b && (b.pressed || b.value > 0.5); }
  function pollPad() {
    var gp = (navigator.getGamepads ? [].slice.call(navigator.getGamepads()) : []).filter(Boolean)[0];
    if (!gp) { padRaf = 0; padLamp(false); return; }
    var y = gp.axes[1] || 0, trig = (gp.buttons[7] ? gp.buttons[7].value : 0) - (gp.buttons[6] ? gp.buttons[6].value : 0);
    var push = Math.abs(y) > 0.25 ? -y : Math.abs(trig) > 0.1 ? trig : 0;
    if (push) { if (!stickMoving) { takeover(); cancelAnimationFrame(glideRaf); } stickMoving = true; setP(p + push * 0.06); }
    else if (stickMoving) { stickMoving = false; settle(Math.round(p)); }
    function edge(i, fn) { var now = pressed(gp, i); if (now && !prevBtn[i]) fn(); prevBtn[i] = now; }
    edge(12, function () { takeover(); settle(Math.round(p) + 1); });
    edge(13, function () { takeover(); settle(Math.round(p) - 1); });
    edge(15, function () { takeover(); settle(Math.round(p) + 1); });
    edge(14, function () { takeover(); settle(Math.round(p) - 1); });
    edge(9, function () { takeover(); settle(N); });
    edge(0, function () { takeover(); if (brief.open) closeBrief(); else if (level) openBrief(level); });
    edge(2, function () { takeover(); var j = jobs[Math.max(0, level - 1)]; var t = (j && j._new[0]) || installs[0].t; lock(t, { keepLevel: true }); });
    edge(1, function () { if (brief.open) closeBrief(); else if ($("ref").open) $("ref").close(); else if (locked) lock(null); });
    padRaf = requestAnimationFrame(pollPad);
  }
  addEventListener("gamepadconnected", function () { padLamp(true); log("<b>CONTROLLER LINKED</b> · STICK = THROTTLE · A = BRIEFING · X = LOCK"); if (!padRaf) padRaf = requestAnimationFrame(pollPad); });
  addEventListener("gamepaddisconnected", function () { padLamp(false); });

  // ---------- loadout: the whole stack by bay, with provenance ----------
  var loadout = $("loadout");
  function buildLoadout() {
    var groups = {};
    Object.keys(R.skills).forEach(function (g2) { groups[g2] = R.skills[g2].slice(); });
    installs.forEach(function (s2) { if (s2.bay === "Ops") { (groups.Ops = groups.Ops || []); if (groups.Ops.indexOf(s2.t) < 0) groups.Ops.push(s2.t); } });
    var seen = {};
    $("loadGrid").innerHTML = Object.keys(groups).map(function (g2) {
      var items = groups[g2].filter(function (x) { var k2 = x.toLowerCase(); if (seen[k2]) return false; seen[k2] = 1; return true; });
      return '<section class="load-bay"><h3>' + esc(g2) + ' <small>' + items.length + "</small></h3><ul>" + items.map(function (x) {
        var inst = installs.filter(function (s2) { return s2.t.toLowerCase() === x.toLowerCase(); })[0], used = D.usedAt(x).length;
        return '<li><button type="button" data-loadlock="' + esc(x) + '"><b>' + esc(x) + "</b><span>" +
          (inst ? "S" + pad(inst.k) + " · " + esc(jobs[inst.k - 1].company.split(" ")[0]) + " " + Math.floor(jobs[inst.k - 1]._t0) + " · used in " + used : "on file") + "</span></button></li>";
      }).join("") + "</ul></section>";
    }).join("");
    $("loadSub").textContent = Object.keys(seen).length + " systems on file · " + totalSystems + " installed across " + N + " sorties · select one to lock it on the sensors";
  }
  function openLoadout() { buildLoadout(); if (loadout.showModal && !loadout.open) loadout.showModal(); loadout.querySelector("[data-lclose]").focus(); }
  $("loadBtn").addEventListener("click", function () { takeover(); openLoadout(); });
  loadout.addEventListener("click", function (e) {
    if (e.target === loadout || e.target.closest("[data-lclose]")) return loadout.close();
    var b = e.target.closest("[data-loadlock]"); if (b) { loadout.close(); takeover(); lock(b.dataset.loadlock); }
  });
  document.addEventListener("keydown", function (e) {
    if ((e.key === "l" || e.key === "L") && !/input|textarea|select/i.test(e.target.tagName) && !e.metaKey && !e.ctrlKey && !e.altKey && !document.querySelector("dialog[open]")) { e.preventDefault(); takeover(); openLoadout(); }
  });

  // ---------- hangar day / night ----------
  var themeBtn = $("themeBtn");
  function themeUI() {
    var day = document.documentElement.dataset.theme === "day";
    themeBtn.setAttribute("aria-pressed", day); $("themeIcon").textContent = day ? "☾" : "☀";
    $("themeSr").textContent = day ? "Switch to night cockpit" : "Switch to hangar day";
    var m = document.querySelector('meta[name="theme-color"]'); if (m) m.content = day ? "#E9EEF0" : "#0D1316";
  }
  themeBtn.addEventListener("click", function () {
    var day = document.documentElement.dataset.theme !== "day";
    document.documentElement.dataset.theme = day ? "day" : "night";
    try { localStorage.setItem("cockpit-theme", day ? "day" : "night"); } catch (e) {}
    themeUI();
  });
  themeUI();

  // ---------- deep links ----------
  function share() {
    if (!interacted || embedded || locked) return;
    var h = level === N ? "full" : level ? "sortie=" + jobs[level - 1].id : "";
    try { history.replaceState(null, "", location.pathname + location.search + (h ? "#" + h : "")); } catch (e) {}
  }
  var pendingLock = null, pendingBrief = 0;
  function readHash() {
    var h = decodeURIComponent(location.hash.slice(1)), m;
    if (h === "full") return N;
    if ((m = h.match(/^(?:sortie|job)=([^&]+)(&brief)?$/))) { var i = jobs.findIndex(function (j) { return j.id === m[1]; }); if (i > -1) { if (m[2]) pendingBrief = i + 1; return i + 1; } }
    if ((m = h.match(/^(?:lock|skill)=(.+)$/))) { pendingLock = findSkill(m[1]); return N; }
    return null;
  }
  addEventListener("hashchange", function () { var t = readHash(); if (t != null) { takeover(); settle(t, { instant: true }); if (pendingLock) { lock(pendingLock, { instant: true }); pendingLock = null; } if (pendingBrief) { var pb = pendingBrief; pendingBrief = 0; openBrief(pb); } } });

  // ---------- offline + service worker ----------
  if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol) && !embedded) {
    addEventListener("load", function () { navigator.serviceWorker.register(new URL("sw.js", INFRA).href).catch(function () {}); });
  }

  // ---------- go ----------
  layoutNotches();
  phone.addEventListener("change", function () { layoutNotches(); placeHandle(); });
  var start = readHash();
  if (start != null || reduce.matches || embedded) {
    hideSkip();
    setP(start != null ? start : N, { quiet: true });
    log("FRAME AX-1 · <b>ALL SYSTEMS ONLINE</b> · " + (level ? level + " SORTIES ON RECORD" : ""));
    if (pendingLock) { lock(pendingLock, { instant: true }); pendingLock = null; }
    if (pendingBrief) { var pb = pendingBrief; pendingBrief = 0; setTimeout(function () { openBrief(pb); }, 0); }
  } else {
    setP(0, { quiet: true });
    var booted = false; try { booted = sessionStorage.getItem("booted") === "1"; sessionStorage.setItem("booted", "1"); } catch (e) {}
    if (!booted) {
      document.body.classList.add("booting");
      var endBoot = function () { document.body.classList.remove("booting"); removeEventListener("keydown", endBoot); removeEventListener("pointerdown", endBoot); };
      setTimeout(endBoot, 1200); addEventListener("keydown", endBoot); addEventListener("pointerdown", endBoot);
    }
    log("CONGAREE HEAVY WORKS · FRAME AX-1 \"AUTODIDACT\" · PILOT " + esc((R.handle || "").toUpperCase()) + " · HANDSHAKE <b>OK</b>");
    log("COLD START · PUSH THROTTLE TO INSTALL SYSTEMS");
    autoT = setTimeout(function () { if (!interacted) { autoRun = true; log("<em>AUTOPILOT</em> · NO INPUT · BRINGING ALL SYSTEMS ONLINE"); settle(N); hideSkip(); } }, 6000);
  }
})();

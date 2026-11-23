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

  // ---------- frame schematic (original silhouette) with one hardpoint per bay ----------
  var HP = [[100, 40], [62, 70], [138, 70], [100, 78], [76, 128], [124, 128]];
  $("frame").innerHTML =
    '<path class="body" d="M84 18h32l6 16h-44z M70 36h60l8 40-10 22H72L62 76z M62 44l-26 8-8 38 12 4 10-30 14-6z M138 44l26 8 8 38-12 4-10-30-14-6z M78 98l-8 52h18l10-40h4l10 40h18l-8-52z"/>' +
    bayNames.map(function (b, i) { var p = HP[i % HP.length]; return '<g><circle class="hp" data-bay="' + esc(b) + '" cx="' + p[0] + '" cy="' + p[1] + '" r="6"/><text x="' + (p[0] + (p[0] < 100 ? -9 : 9)) + '" y="' + (p[1] + 3) + '" text-anchor="' + (p[0] < 100 ? "end" : "start") + '">' + esc(b.split(" ")[0].toUpperCase()) + "</text></g>"; }).join("");
  var hps = [].slice.call(document.querySelectorAll(".frame .hp"));

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
  var p = 0, level = -1, dragging = false, interacted = false;
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
    var bays = {}; installed.forEach(function (s) { bays[s.bay] = 1; });
    hps.forEach(function (h) { h.classList.toggle("lit", !!bays[h.dataset.bay]); });
    counters(L, installed.length);
    $("tYear").textContent = L ? Math.floor(jobs[L - 1]._t0) : D.firstYear;
    handle.setAttribute("aria-valuenow", L);
    handle.setAttribute("aria-valuetext", L ? Math.floor(jobs[L - 1]._t0) + ", Sortie " + L + " of " + N + ": " + jobs[L - 1].role + " at " + jobs[L - 1].company + ", " + installed.length + " systems online" : "Cold start, no systems installed");
    renderMission(L);
    if (opts.quiet) return;
    if (prev >= 0 && L > prev) {
      for (var k = prev + 1; k <= L; k++) {
        var j = jobs[k - 1];
        log("<em>SORTIE " + pad(k) + "</em> · " + esc(j.company) + " · " + esc(j._span));
        log(j._new.length ? "INSTALLING: " + j._new.map(esc).join(" · ") + " <b>▮▮▮ OK</b>" : "NO NEW SYSTEMS · EXISTING SYSTEMS UPGRADED <b>OK</b>");
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
    mission.className = "mission";
    mission.innerHTML =
      '<div class="m-head"><span class="m-num">Sortie ' + pad(L) + "/" + pad(N) + '</span><span class="m-span">' + esc(j._span) + "</span>" +
      (j.returning ? '<span class="m-tag">Re-commissioned</span>' : "") + (/present/i.test(j.end) ? '<span class="m-tag">Active</span>' : "") + "</div>" +
      "<h3>" + esc(j.role) + '</h3><p class="m-co">' + esc(j.company) + (j.location ? " · " + esc(j.location) : "") + "</p>" +
      "<ul>" + j.bullets.map(function (b) { return "<li>" + esc(b) + "</li>"; }).join("") + "</ul>" +
      '<div class="m-inst">Installed here:' + (j._new.length ? j._new.map(function (t) { return '<span class="chip">' + esc(t) + "</span>"; }).join("") : " <span>upgrades to existing systems</span>") + "</div>";
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
  function takeover() { interacted = true; stopAuto(); hideSkip(); }
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
  scopeSvg.addEventListener("click", function (e) { var c = e.target.closest(".contact.on"); if (c) { takeover(); lock(installs[+c.dataset.n].t, { keepLevel: true }); } });
  document.addEventListener("click", function (e) {
    var j = e.target.closest(".jump"); if (j) { if (j.hasAttribute("data-clear")) lock(null); else { takeover(); settle(+j.dataset.k); } return; }
    var b = e.target.closest("[data-lock]"); if (b) { takeover(); lock(b.dataset.lock, { instant: true }); $("cockpit").scrollIntoView({ behavior: reduce.matches ? "auto" : "smooth" }); }
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && locked && hailPanel.hidden) { lock(null); e.preventDefault(); }
    if (e.key === "/" && !/input|textarea/i.test(e.target.tagName)) { e.preventDefault(); lockIn.focus(); }
  });
  function setHash(h) { if (embedded) return; try { history.replaceState(null, "", location.pathname + location.search + (h ? "#" + h : "")); } catch (e) {} }

  // ---------- deep links ----------
  function share() {
    if (!interacted || embedded || locked) return;
    var h = level === N ? "full" : level ? "sortie=" + jobs[level - 1].id : "";
    try { history.replaceState(null, "", location.pathname + location.search + (h ? "#" + h : "")); } catch (e) {}
  }
  var pendingLock = null;
  function readHash() {
    var h = decodeURIComponent(location.hash.slice(1)), m;
    if (h === "full") return N;
    if ((m = h.match(/^(?:sortie|job)=(.+)$/))) { var i = jobs.findIndex(function (j) { return j.id === m[1]; }); if (i > -1) return i + 1; }
    if ((m = h.match(/^(?:lock|skill)=(.+)$/))) { pendingLock = findSkill(m[1]); return N; }
    return null;
  }
  addEventListener("hashchange", function () { var t = readHash(); if (t != null) { takeover(); settle(t, { instant: true }); if (pendingLock) { lock(pendingLock, { instant: true }); pendingLock = null; } } });

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
    autoT = setTimeout(function () { if (!interacted) { log("<em>AUTOPILOT</em> · NO INPUT · BRINGING ALL SYSTEMS ONLINE"); settle(N); hideSkip(); } }, 6000);
  }
})();

(function () {
  "use strict";
  var R = window.RESUME, D = window.DERIVED;
  var $ = function (id) { return document.getElementById(id); };
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var CABLE = ["#FF3B5C", "#2EC4FF", "#FFD23F", "#9B5DE5", "#39FF88", "#FF8A3D"];
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  var mail = "mailto:" + R.email;
  var manifestScript = document.querySelector('script[src$="versions/manifest.js"]');

  // ---------- text ----------
  $("barName").textContent = R.name;
  $("name").textContent = R.name;
  $("role").innerHTML = "<b>" + esc(R.title) + "</b> at " + esc(D.current.company) + " · " + esc(R.location);
  $("barEmail").href = mail; $("ctaEmail").href = mail;
  var led = $("led");
  function ledIdle() {
    led.innerHTML = '<span class="dim">&gt; whoami</span><br>' + esc(R.name.toUpperCase()) + "<br>" + esc(R.title.toUpperCase()) + " @ " + esc(D.current.company.toUpperCase()) +
      '<br><span class="dim">&gt; ' + D.yearsIn + "+ YRS · " + D.roleCount + " ROLES · PATCH A SKILL INTO A JOB_</span>";
  }
  ledIdle();

  // ---------- jacks ----------
  var jobs = D.chrono;
  var count = {}, label = {};
  R.jobs.forEach(function (j) { j.tags.forEach(function (t) { var k = t.toLowerCase(); count[k] = (count[k] || 0) + 1; label[k] = label[k] || t; }); });
  var skills = Object.keys(count).sort(function (a, b) { return count[b] - count[a] || a.localeCompare(b); });
  $("skillJacks").innerHTML = skills.map(function (k, i) {
    return '<button type="button" class="jack" data-s="' + i + '" aria-label="Skill ' + esc(label[k]) + '"><span class="hole"></span>' + esc(label[k]) + "</button>";
  }).join("");
  $("jobJacks").innerHTML = jobs.map(function (j, i) {
    return '<button type="button" class="jack" data-j="' + i + '" aria-label="Job ' + esc(j.role) + " at " + esc(j.company) + ", " + esc(j._span) + '"><span class="hole"></span>' + esc(j.company.split(" ")[0]) + "<small>" + Math.floor(j._t0) + "</small></button>";
  }).join("");
  var sJ = [].slice.call(document.querySelectorAll("[data-s]")), jJ = [].slice.call(document.querySelectorAll("[data-j]"));

  // ---------- cables ----------
  var bay = $("bay"), svg = $("cables");
  var links = {};           // "s|j" -> true
  var live = null;          // {s, x, y} while dragging
  var bad = null;           // {s, j, until}
  function center(el) {
    var h = el.querySelector(".hole").getBoundingClientRect(), b = bay.getBoundingClientRect();
    return [h.left + h.width / 2 - b.left, h.top + h.height / 2 - b.top];
  }
  function cablePath(a, b, slack) {
    var dist = Math.hypot(b[0] - a[0], b[1] - a[1]), sag = (slack || 1) * (30 + dist * 0.22);
    return "M" + a[0] + " " + a[1] + " C" + a[0] + " " + (a[1] + sag) + " " + b[0] + " " + (b[1] + sag * (b[1] > a[1] ? .2 : 1)) + " " + b[0] + " " + b[1];
  }
  function draw() {
    var out = "";
    Object.keys(links).forEach(function (key) {
      var p = key.split("|");
      out += '<path d="' + cablePath(center(sJ[p[0]]), center(jJ[p[1]])) + '" stroke="' + CABLE[p[0] % CABLE.length] + '"/>';
    });
    if (bad) out += '<path class="bad" d="' + cablePath(center(sJ[bad.s]), center(jJ[bad.j]), 1.8) + '" stroke="#9aa1ad"/>';
    if (live) out += '<path d="' + cablePath(center(sJ[live.s]), [live.x, live.y], .6) + '" stroke="' + CABLE[live.s % CABLE.length] + '"/>';
    svg.innerHTML = out;
    var litS = {}, litJ = {};
    Object.keys(links).forEach(function (k) { var p = k.split("|"); litS[p[0]] = litJ[p[1]] = 1; });
    sJ.forEach(function (el, i) { el.classList.toggle("lit", !!litS[i]); });
    jJ.forEach(function (el, i) { el.classList.toggle("lit", !!litJ[i]); });
  }

  function plug(si, ji) {
    var k = skills[si], j = jobs[ji];
    var ok = j.tags.some(function (t) { return t.toLowerCase() === k; });
    if (ok) {
      links[si + "|" + ji] = true; bad = null;
      var b = j.bullets.find(function (x) { return x.toLowerCase().indexOf(k) > -1; }) || j.bullets[0];
      led.innerHTML = '<span class="dim">&gt; patch ' + esc(label[k]) + " → " + esc(j.company) + "</span><br>CARRIER OK · " + esc(j.role.toUpperCase()) + " · " + esc(j._span) + "<br>" + esc(b);
    } else {
      bad = { s: si, j: ji };
      jJ[ji].classList.add("nope"); setTimeout(function () { jJ[ji].classList.remove("nope"); }, 1000);
      var used = D.usedAt(k).map(function (x) { return x.company; }).filter(function (c, n, a) { return a.indexOf(c) === n; });
      led.innerHTML = '<span class="dim">&gt; patch ' + esc(label[k]) + " → " + esc(j.company) + '</span><br><span class="err">NO CARRIER</span><br>' + esc(label[k]) + " lives at: " + esc(used.join(", "));
      setTimeout(function () { bad = null; draw(); }, reduce ? 0 : 900);
    }
    draw();
  }

  // pointer drag
  var armed = null, moved = false;
  function arm(i) {
    armed = i; sJ.forEach(function (el, n) { el.classList.toggle("armed", n === i); });
    if (i != null) led.innerHTML = '<span class="dim">&gt; holding ' + esc(label[skills[i]]) + " cable…</span><br>Now pick a job jack.";
  }
  bay.addEventListener("pointerdown", function (e) {
    var s = e.target.closest("[data-s]"); if (!s || e.pointerType === "touch") return;
    var b = bay.getBoundingClientRect();
    live = { s: +s.dataset.s, x: e.clientX - b.left, y: e.clientY - b.top }; moved = false;
    bay.setPointerCapture(e.pointerId); arm(+s.dataset.s); draw(); e.preventDefault();
  });
  bay.addEventListener("pointermove", function (e) {
    if (!live) return;
    var b = bay.getBoundingClientRect(); live.x = e.clientX - b.left; live.y = e.clientY - b.top; moved = true;
    var over = document.elementFromPoint(e.clientX, e.clientY);
    jJ.forEach(function (el) { el.classList.toggle("target", !!over && el.contains(over)); });
    draw();
  });
  bay.addEventListener("pointerup", function (e) {
    if (!live) return;
    var si = live.s; live = null;
    jJ.forEach(function (el) { el.classList.remove("target"); });
    var over = document.elementFromPoint(e.clientX, e.clientY), jack = over && over.closest("[data-j]");
    if (jack) { plug(si, +jack.dataset.j); arm(null); }
    else if (moved) { arm(null); draw(); }
    // else: a plain click leaves the cable armed for tap-tap
  });

  // tap-tap and keyboard (click events)
  bay.addEventListener("click", function (e) {
    var s = e.target.closest("[data-s]"), j = e.target.closest("[data-j]");
    if (s) { if (e.detail === 0 || e.pointerType !== "mouse") { arm(armed === +s.dataset.s ? null : +s.dataset.s); if (armed != null && e.detail === 0) jJ[0].focus(); } }
    else if (j) {
      if (armed == null) { var jb = jobs[+j.dataset.j]; led.innerHTML = '<span class="dim">&gt; ' + esc(jb.company) + "</span><br>" + esc(jb.role.toUpperCase()) + " · " + esc(jb._span) + "<br>Pick a skill jack first."; return; }
      var si = armed; plug(si, +j.dataset.j); arm(null); if (e.detail === 0) sJ[si].focus();
    }
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && armed != null) { var si = armed; arm(null); ledIdle(); sJ[si].focus(); } });

  $("routeAll").addEventListener("click", function () {
    var on = this.getAttribute("aria-pressed") !== "true";
    this.setAttribute("aria-pressed", on);
    links = {};
    if (on) jobs.forEach(function (j, ji) { j.tags.forEach(function (t) { links[skills.indexOf(t.toLowerCase()) + "|" + ji] = true; }); });
    led.innerHTML = on ? '<span class="dim">&gt; route --all</span><br>' + Object.keys(links).length + " LINKS UP · " + skills.length + " SKILLS × " + jobs.length + " ROLES<br>Every lit cable is a skill used in that role." : "";
    if (!on) ledIdle();
    draw();
  });
  $("clearAll").addEventListener("click", function () { links = {}; $("routeAll").setAttribute("aria-pressed", "false"); ledIdle(); draw(); });
  addEventListener("resize", draw);
  if (document.fonts) document.fonts.ready.then(draw);

  // ---------- résumé + footer ----------
  $("joblist").innerHTML = R.jobs.map(function (j, n) {
    return '<li style="--c:' + CABLE[n % CABLE.length] + '"><h3>' + esc(j.role) + '</h3><div class="when">' + esc(j.company) + " · " + esc(j._span) + "</div><ul>" + j.bullets.map(function (b) { return "<li>" + esc(b) + "</li>"; }).join("") + "</ul></li>";
  }).join("");
  $("footLinks").innerHTML = '<a href="' + esc(mail) + '">' + esc(R.email) + '</a><a href="' + esc(R.github) + '">GitHub</a>' + esc(R.location);
  draw();
})();

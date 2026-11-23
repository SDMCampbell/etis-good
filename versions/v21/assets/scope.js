(function () {
  "use strict";
  var R = window.RESUME, D = window.DERIVED;
  var $ = function (id) { return document.getElementById(id); };
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  var jobs = D.chrono, N = jobs.length, y0 = D.firstYear, y1 = D.nowT;
  $("pilotName").textContent = R.name;
  $("pilotSub").textContent = R.title + " · " + D.current.company + " · " + R.location;
  $("hail").href = "mailto:" + R.email;

  // rings are years: centre = first year, edge = now
  function rad(t) { return 12 + (t - y0) / (y1 - y0) * 88; }
  var bays = Object.keys(R.skills).concat(["Ops"]), bayOf = {};
  Object.keys(R.skills).forEach(function (g) { R.skills[g].forEach(function (s) { if (!bayOf[s.toLowerCase()]) bayOf[s.toLowerCase()] = g; }); });
  var contacts = [];   // {kind, x, y, t(year), job|skill}
  jobs.forEach(function (j, i) {
    var a = (-90 + i * (360 / N) + 12) * Math.PI / 180, r = rad(j._t0);
    contacts.push({ kind: "job", j: j, t: j._t0, x: Math.cos(a) * r, y: Math.sin(a) * r });
  });
  var per = {};
  jobs.forEach(function (j) {
    j._new.forEach(function (s) {
      var b = bays.indexOf(bayOf[s.toLowerCase()] || "Ops"), n = (per[b] = (per[b] || 0) + 1);
      var a = (-90 + (b + .2 + (n * .23) % .6) * (360 / bays.length)) * Math.PI / 180, r = rad(j._t0) + 3 + (n % 3) * 2.5;
      contacts.push({ kind: "skill", s: s, j: j, t: j._t0, x: Math.cos(a) * r, y: Math.sin(a) * r });
    });
  });
  // time order for keyboard cycling
  var order = contacts.map(function (c, i) { return i; }).sort(function (a, b) { return contacts[a].t - contacts[b].t || (contacts[a].kind === "job" ? -1 : 1); });

  var svg = $("scope"), g = "";
  for (var yr = Math.ceil(y0); yr <= Math.floor(y1); yr += 2) g += '<circle class="ring" r="' + rad(yr).toFixed(1) + '"/><text class="yr" x="1" y="' + (-rad(yr) + 5).toFixed(1) + '">' + yr + "</text>";
  bays.forEach(function (b, i) { var a = (-90 + (i + .5) * (360 / bays.length)) * Math.PI / 180; g += '<text class="sec" x="' + (Math.cos(a) * 104).toFixed(1) + '" y="' + (Math.sin(a) * 104 + 2).toFixed(1) + '">' + esc(b.split(" ")[0].toUpperCase()) + "</text>"; });
  contacts.forEach(function (c, i) {
    var label = c.kind === "job" ? c.j.company.split(" ")[0] : c.s;
    g += '<g class="c ' + c.kind + '" data-i="' + i + '">' + (c.kind === "job"
      ? '<circle cx="' + c.x.toFixed(1) + '" cy="' + c.y.toFixed(1) + '" r="5"/><circle class="core" cx="' + c.x.toFixed(1) + '" cy="' + c.y.toFixed(1) + '" r="1.8"/>'
      : '<circle cx="' + c.x.toFixed(1) + '" cy="' + c.y.toFixed(1) + '" r="1.8"/>') +
      '<text x="' + (c.x + 6).toFixed(1) + '" y="' + (c.y + 2).toFixed(1) + '">' + esc(label) + "</text></g>";
  });
  svg.innerHTML = g;
  var els = [].slice.call(svg.querySelectorAll(".c"));

  // readout
  var readout = $("readout"), lockI = -1;
  function showJob(j) {
    readout.innerHTML = '<span class="k">' + (j === D.current ? "Current contact" : "Contact") + " · " + esc(j._span) + "</span><h2>" + esc(j.role) + '</h2><p class="co">' + esc(j.company) + (j.location ? " · " + esc(j.location) : "") + "</p><ul>" +
      j.bullets.map(function (b) { return "<li>" + esc(b) + "</li>"; }).join("") + '</ul><div class="tags">' + (j._new.length ? "Installed: " + j._new.map(function (t) { return "<span>" + esc(t) + "</span>"; }).join("") : "") + "</div>";
  }
  function showSkill(s) {
    var used = D.usedAt(s);
    readout.innerHTML = '<span class="k">System</span><h2>' + esc(s) + '</h2><p class="co">Used in ' + used.length + " role" + (used.length === 1 ? "" : "s") + "</p><ul>" + used.map(function (j) { return "<li>" + esc(j.role) + " · " + esc(j.company) + " (" + esc(j._span) + ")</li>"; }).join("") + "</ul>";
  }
  function lock(i) {
    lockI = i; els.forEach(function (e, k) { e.classList.toggle("lock", k === i); });
    var c = contacts[i]; if (c.kind === "job") showJob(c.j); else showSkill(c.s);
  }

  // ping: a ripple from the tap point lights contacts as it passes and locks the nearest
  function toSvg(e) { var m = svg.getScreenCTM().inverse(); return [m.a * e.clientX + m.c * e.clientY + m.e, m.b * e.clientX + m.d * e.clientY + m.f]; }
  function ping(x, y) {
    var vis = contacts.map(function (c, i) { return i; }).filter(function (i) { return !els[i].classList.contains("off"); });
    if (!vis.length) return;
    var near = vis.reduce(function (a, b) { var da = Math.hypot(contacts[a].x - x, contacts[a].y - y), db = Math.hypot(contacts[b].x - x, contacts[b].y - y); return db < da ? b : a; });
    lock(near);
    if (reduce) return;
    var rip = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    rip.setAttribute("class", "ripple"); rip.setAttribute("cx", x); rip.setAttribute("cy", y); svg.appendChild(rip);
    var t0 = performance.now();
    (function step(t) {
      var k = Math.max(0, (t - t0) / 900), r = k * 60;
      rip.setAttribute("r", r.toFixed(1)); rip.setAttribute("stroke-opacity", (1 - k).toFixed(2));
      vis.forEach(function (i) { var d = Math.hypot(contacts[i].x - x, contacts[i].y - y); if (Math.abs(d - r) < 4) { els[i].classList.add("lit"); setTimeout(function () { els[i].classList.remove("lit"); }, 900); } });
      if (k < 1) requestAnimationFrame(step); else rip.remove();
    })(t0);
  }
  svg.addEventListener("click", function (e) { var p = toSvg(e); ping(p[0], p[1]); });
  svg.addEventListener("keydown", function (e) {
    var pos = order.indexOf(lockI), d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (d) { e.preventDefault(); var n = pos; do { n = (n + d + order.length) % order.length; } while (els[order[n]].classList.contains("off") && n !== pos); lock(order[n]); }
    else if (e.key === " " && lockI > -1) { e.preventDefault(); ping(contacts[lockI].x, contacts[lockI].y); }
  });

  // year scrubber: show only what was online by year X
  var scrub = $("yearScrub"), out = $("yearOut");
  scrub.min = Math.floor(y0); scrub.max = Math.ceil(y1); scrub.value = scrub.max;
  function filter() { var y = +scrub.value; out.textContent = y; els.forEach(function (e, i) { e.classList.toggle("off", contacts[i].t >= y + 1); }); }
  scrub.addEventListener("input", filter); filter();

  // plain lists mirror the scope
  $("jobList").innerHTML = R.jobs.map(function (j) { return "<li><b>" + esc(j.role) + "</b>, " + esc(j.company) + " (" + esc(j._span) + ")</li>"; }).join("");
  $("bayList").innerHTML = Object.keys(R.skills).map(function (g2) { return "<p><b>" + esc(g2) + ":</b> " + R.skills[g2].map(esc).join(", ") + "</p>"; }).join("");
  $("contactLine").innerHTML = '<a href="mailto:' + esc(R.email) + '">' + esc(R.email) + '</a> · <a href="' + esc(R.github) + '">GitHub</a>';

  lock(order.indexOf(0) > -1 ? contacts.findIndex(function (c) { return c.kind === "job" && c.j === D.current; }) : 0);
})();

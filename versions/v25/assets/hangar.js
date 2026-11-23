(function () {
  "use strict";
  var R = window.RESUME, D = window.DERIVED;
  var $ = function (id) { return document.getElementById(id); };
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  var jobs = D.chrono, N = jobs.length;
  $("name").textContent = R.name;
  $("role").textContent = D.current.role + " · " + D.current.company + " · " + R.location;
  $("hail").href = "mailto:" + R.email;

  // every first-time system, in order, gets a slot on the frame (original line-art chassis)
  var installs = [];
  jobs.forEach(function (j, i) { j._new.forEach(function (t) { installs.push({ t: t, k: i }); }); });
  var slots = [];
  var cols = 5;
  installs.forEach(function (s, n) { var row = Math.floor(n / cols), col = n % cols; slots.push([62 + col * 20, 70 + row * 26]); });
  var g = '<path class="chassis" d="M90 14h40l8 20H82z M56 40h108l12 70-18 34H62L44 110z M50 52l-34 14-8 64 18 4 12-50 16-8z M170 52l34 14 8 64-18 4-12-50-16-8z M66 144l-12 100h30l18-80h16l18 80h30l-12-100z"/>';
  installs.forEach(function (s, n) { var p = slots[n]; g += '<rect class="hp" x="' + (p[0] - 8) + '" y="' + (p[1] - 8) + '" width="16" height="16"/><rect class="crate" data-n="' + n + '" data-k="' + s.k + '" x="' + (p[0] - 8) + '" y="' + (p[1] - 8) + '" width="16" height="16"><title>' + esc(s.t) + "</title></rect>"; });
  $("frame").innerHTML = g;
  var crates = [].slice.call(document.querySelectorAll(".frame .crate"));

  // bays (oldest first): scrolling down the line installs each bay's crates
  $("line").innerHTML = jobs.map(function (j, i) {
    return '<section class="bay" id="bay-' + esc(j.id) + '" data-k="' + i + '" data-n="' + String(i + 1).padStart(2, "0") + '"><span class="mono">Bay ' + String(i + 1).padStart(2, "0") + " · " + esc(j._span) + "</span><h2>" + esc(j.role) + '</h2><p class="co">' + esc(j.company) + (j.location ? " · " + esc(j.location) : "") + "</p><ul>" +
      j.bullets.map(function (b) { return "<li>" + esc(b) + "</li>"; }).join("") + '</ul><div class="crates">' +
      (j._new.length ? j._new.map(function (t) { return "<span>" + esc(t) + "</span>"; }).join("") : '<span class="none">No new crates · upgrades only</span>') + "</div></section>";
  }).join("");
  var bays = [].slice.call(document.querySelectorAll(".bay"));
  var reached = -1;
  function installTo(k) {
    reached = k;
    crates.forEach(function (c) { c.classList.toggle("on", +c.dataset.k <= k); });
    var n = installs.filter(function (s) { return s.k <= k; }).length;
    $("count").textContent = "Bay " + (k + 1) + " of " + N + " · " + n + " systems fitted";
  }
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function () {
      var mid = innerHeight * 0.55, k = -1;
      bays.forEach(function (b, i) { if (b.getBoundingClientRect().top < mid) k = i; });
      if (k !== reached) installTo(Math.max(0, k));
    }, { threshold: [0, .25, .5, .75, 1] });
    bays.forEach(function (b) { io.observe(b); });
    addEventListener("scroll", function () { var mid = innerHeight * 0.55, k = 0; bays.forEach(function (b, i) { if (b.getBoundingClientRect().top < mid) k = i; }); if (k !== reached) installTo(k); }, { passive: true });
  }
  installTo(0);

  // crate rack: pick a system, light every bay that used it, scroll to the first
  var all = {};
  R.jobs.forEach(function (j) { j.tags.forEach(function (t) { all[t.toLowerCase()] = t; }); });
  var rack = $("rack"), picked = null;
  rack.innerHTML = Object.keys(all).sort().map(function (k) { return '<button type="button" aria-pressed="false" data-s="' + esc(all[k]) + '">' + esc(all[k]) + "</button>"; }).join("");
  rack.addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b) return;
    picked = picked === b.dataset.s ? null : b.dataset.s;
    rack.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", x.dataset.s === picked); });
    var used = picked ? D.usedAt(picked).map(function (j) { return j._i; }) : [];
    bays.forEach(function (bay, i) { bay.classList.toggle("dim", !!picked && used.indexOf(i) < 0); bay.classList.toggle("hit", used.indexOf(i) > -1); });
    crates.forEach(function (c) { c.classList.toggle("hl", !!picked && installs[+c.dataset.n].t.toLowerCase() === picked.toLowerCase()); });
    if (used.length) bays[Math.min.apply(null, used)].scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  });
})();

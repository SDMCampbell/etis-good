(function () {
  "use strict";
  var R = window.RESUME, D = window.DERIVED;
  var $ = function (id) { return document.getElementById(id); };
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var out = $("out"), cmd = $("cmd");
  $("topName").textContent = R.name.toUpperCase();
  $("hail").href = "mailto:" + R.email;

  // ---------- commands: every answer is built from data ----------
  function jobLine(j) { return "<b>[" + Math.floor(j._t0) + "] " + esc(j.role) + "</b> @ " + esc(j.company) + " · " + esc(j._span); }
  var C = {
    help: function () { return "commands: <b>whoami</b> · <b>jobs</b> · <b>job &lt;id&gt;</b> · <b>skills</b> · <b>find &lt;skill&gt;</b> · <b>hail</b> · <b>clear</b>\njob ids: " + D.chrono.map(function (j) { return esc(j.id); }).join(", "); },
    whoami: function () { return "<b>" + esc(R.name.toUpperCase()) + "</b>\n" + esc(R.title) + " · " + esc(R.location) + "\nnow: " + esc(D.current.role) + " @ " + esc(D.current.company) + " (" + esc(D.current._span) + ")\n" + esc(R.summary); },
    jobs: function () { return R.jobs.map(jobLine).join("\n"); },
    job: function (a) {
      var j = D.chrono.filter(function (x) { return x.id === a || x.company.toLowerCase().indexOf(a) === 0; })[0];
      if (!j) return "no such job. try: " + D.chrono.map(function (x) { return esc(x.id); }).join(", ");
      return jobLine(j) + "\n" + j.bullets.map(function (b) { return "- " + esc(b); }).join("\n") + "\nstack: " + j.tags.map(esc).join(", ");
    },
    skills: function () { return Object.keys(R.skills).map(function (g) { return "<b>" + esc(g) + "</b> " + R.skills[g].map(esc).join(", "); }).join("\n"); },
    find: function (a) {
      if (!a) return "usage: find &lt;skill&gt;";
      var used = D.usedAt(a);
      return used.length ? esc(a) + " → used in " + used.length + " role" + (used.length > 1 ? "s" : "") + ":\n" + used.map(jobLine).join("\n") : "no role tagged with " + esc(a) + ". try: skills";
    },
    hail: function () { return 'email: <a href="mailto:' + esc(R.email) + '">' + esc(R.email) + '</a>\ngithub: <a href="' + esc(R.github) + '">' + esc(R.github) + "</a>"; },
    clear: function () { out.innerHTML = ""; return null; }
  };
  function run(line) {
    line = line.trim(); if (!line) return;
    var parts = line.split(/\s+/), name = parts.shift().toLowerCase(), arg = parts.join(" ").toLowerCase();
    var echo = document.createElement("div"); echo.className = "echo"; echo.textContent = "$ " + line; out.appendChild(echo);
    var res = C[name] ? C[name](arg) : "command not found: " + esc(name) + ". try: help";
    if (res == null) return;
    var div = document.createElement("div"); div.innerHTML = res; out.appendChild(div);
    window.scrollTo(0, document.body.scrollHeight);
    rain(div);
  }
  $("form").addEventListener("submit", function (e) { e.preventDefault(); run(cmd.value); cmd.value = ""; });
  $("sugg").innerHTML = ["whoami", "jobs", "skills", "find php", "job xgrok", "hail", "help"].map(function (c2) { return '<button type="button">' + c2 + "</button>"; }).join("");
  $("sugg").addEventListener("click", function (e) { var b = e.target.closest("button"); if (b) { run(b.textContent); cmd.focus(); } });

  // ---------- a compact rain: each answer's words fall into place with a drone escort ----------
  var canvas = $("rain"), ctx = canvas.getContext("2d"), act = [], raf = 0, GL = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789<>/=+*#%$&{}[]";
  function size() { var d = Math.min(2, devicePixelRatio || 1); canvas.width = innerWidth * d; canvas.height = innerHeight * d; ctx.setTransform(d, 0, 0, d, 0, 0); }
  size(); addEventListener("resize", size);
  function rain(el) {
    if (reduce) return;
    el.classList.add("veiled"); el._left = 0;
    var tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), n, re = /\S+/g, m, i = 0, t0 = performance.now();
    while ((n = tw.nextNode())) {
      var cs = getComputedStyle(n.parentElement);
      re.lastIndex = 0;
      while ((m = re.exec(n.textContent))) {
        var rg = document.createRange(); rg.setStart(n, m.index); rg.setEnd(n, m.index + m[0].length);
        var r = rg.getClientRects()[0]; if (!r) continue;
        el._left++;
        act.push({ el: el, t: m[0], x: r.left, y: r.top + scrollY, w: r.width, h: r.height, font: cs.fontWeight + " " + cs.fontSize + " " + cs.fontFamily, color: cs.color, start: t0 + (i++) * 6, dur: 520 + Math.random() * 300, drop: 80 + Math.random() * 240 });
      }
    }
    if (!el._left) el.classList.remove("veiled");
    if (!raf) raf = requestAnimationFrame(frame);
  }
  function frame(now) {
    raf = 0; ctx.clearRect(0, 0, innerWidth, innerHeight);
    var sy = scrollY;
    for (var i = act.length - 1; i >= 0; i--) {
      var w = act[i], t = (now - w.start) / w.dur; if (t < 0) continue;
      if (t >= 1) { act.splice(i, 1); if (--w.el._left <= 0) w.el.classList.remove("veiled"); continue; }
      var y0 = sy - w.drop, y = y0 + (w.y - y0) * t * t, cw = w.w / w.t.length;
      ctx.font = w.font; ctx.textBaseline = "middle";
      for (var c = 0; c < w.t.length; c++) { var lock = t > .65 + .35 * c / w.t.length; ctx.fillStyle = lock ? w.color : "#39FF7A"; ctx.fillText(lock ? w.t[c] : GL[(Math.random() * GL.length) | 0], w.x + c * cw, y - sy + w.h / 2); }
      if (c && i % 9 === 0) { ctx.fillStyle = "#39FF7A"; ctx.fillText("▸", w.x - 14, y - sy + w.h / 2); }
    }
    if (act.length) raf = requestAnimationFrame(frame);
  }

  // boot: the essentials answer themselves so nothing is hidden behind typing
  run("whoami"); run("jobs");
  if (!matchMedia("(pointer: coarse)").matches) cmd.focus({ preventScroll: true });
})();

(function () {
  "use strict";
  var R = window.RESUME, D = window.DERIVED;
  var $ = function (id) { return document.getElementById(id); };
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  var mail = "mailto:" + R.email;

  // ---------- cover ----------
  $("barName").textContent = R.name;
  $("barEmail").href = mail;
  $("issue").textContent = "Issue " + D.yearsIn + " · " + R.location + " · since " + D.firstYear;
  $("name").innerHTML = esc(R.name).replace(" ", "<br>");
  $("title").textContent = R.title;
  $("now").innerHTML = "<em>Now:</em>" + esc(D.current.role) + " at " + esc(D.current.company) + ", since " + esc(D.current.start) + (D.current.returning ? " (round two)" : "");
  $("stats").textContent = D.yearsIn + "+ yrs · " + D.roleCount + " roles · " + D.skillCount + " skills · " + R.email;

  // ---------- squeegee: pull the second ink ----------
  var sheet = $("sheet"), blue = $("blue"), sq = $("squeegee"), p = 0, pulling = false;
  function setP(v) {
    p = Math.max(0, Math.min(1, v));
    blue.style.clipPath = "inset(0 " + ((1 - p) * 100).toFixed(2) + "% 0 0)";
    sq.style.left = (p * 100) + "%";
    sq.setAttribute("aria-valuenow", Math.round(p * 100));
    if (p >= 0.98) printed();
  }
  var done = false;
  function printed() {
    if (done) return; done = true;
    blue.style.clipPath = "none"; sq.classList.add("done");
    blue.classList.add("misreg");
    $("coverHelp").textContent = "Printed! The blue is a little off. Drag it into register, or flip pages →";
  }
  sq.addEventListener("pointerdown", function (e) { pulling = true; sq.setPointerCapture(e.pointerId); e.preventDefault(); });
  sq.addEventListener("pointermove", function (e) { if (!pulling) return; var r = sheet.getBoundingClientRect(); setP((e.clientX - r.left) / r.width); });
  sq.addEventListener("pointerup", function () { pulling = false; });
  sq.addEventListener("keydown", function (e) {
    if (e.key === " " || e.key === "Enter") { e.preventDefault(); autoPull(); }
    else if (e.key === "ArrowRight") { e.preventDefault(); setP(p + 0.1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); setP(p - 0.1); }
  });
  function autoPull() {
    if (reduce) return setP(1);
    var t0 = performance.now(), from = p;
    (function step(t) { var k = Math.min(1, (t - t0) / 700); setP(from + (1 - from) * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); })(t0);
  }
  // fix the misregistration by dragging the blue layer; it snaps when close
  var mx = 7, my = -5, reg = null;
  blue.addEventListener("pointerdown", function (e) {
    if (!done) return;
    reg = { x: e.clientX, y: e.clientY, mx: mx, my: my }; blue.setPointerCapture(e.pointerId); e.preventDefault();
  });
  blue.addEventListener("pointermove", function (e) {
    if (!reg) return;
    mx = reg.mx + (e.clientX - reg.x); my = reg.my + (e.clientY - reg.y);
    blue.style.setProperty("--mx", mx + "px"); blue.style.setProperty("--my", my + "px");
  });
  blue.addEventListener("pointerup", function () {
    if (!reg) return; reg = null;
    if (Math.abs(mx) < 4 && Math.abs(my) < 4) {
      mx = my = 0; blue.style.setProperty("--mx", "0px"); blue.style.setProperty("--my", "0px");
      sheet.classList.remove("thunk"); void sheet.offsetWidth; sheet.classList.add("thunk");
      $("coverHelp").textContent = "In register. Nice. Now flip pages →";
      if (navigator.vibrate) try { navigator.vibrate(15); } catch (e) {}
    }
  });
  if (reduce) setP(1);

  // ---------- pages ----------
  var zine = $("zine");
  var html = "";
  D.chrono.forEach(function (j, i) {
    var stat = j.highlight ? '<div class="big-stat"><b>' + esc(j.highlight.to) + "</b>" + esc(j.highlight.label) + " (was " + esc(j.highlight.from) + ")</div>" : "";
    html += '<section class="page" id="p' + (i + 1) + '" aria-label="' + esc(j.role + ", " + j.company) + '"><article class="spread"><div class="l">' +
      '<p class="era">' + Math.floor(j._t0) + '</p><span class="halftone" aria-hidden="true"></span>' +
      "<h2>" + esc(j.role) + '</h2><p class="co">' + esc(j.company) + (j.location ? " · " + esc(j.location) : "") + '</p><p class="mono">' + esc(j._span) + "</p>" +
      '<span class="sticker">' + j._new.length + " new skill" + (j._new.length === 1 ? "" : "s") + "</span>" + (j.returning ? '<span class="sticker">Round two</span>' : "") +
      '</div><div class="r"><ul>' + j.bullets.map(function (b) { return "<li>" + esc(b) + "</li>"; }).join("") + "</ul><p>" +
      j.tags.map(function (t) { return '<span class="sticker">' + esc(t) + "</span>"; }).join("") + "</p>" + stat + "</div></article></section>";
  });
  var nJ = D.chrono.length;
  html += '<section class="page" id="p' + (nJ + 1) + '" aria-label="Skills"><article class="spread"><div class="l"><p class="era">Kit</p><span class="halftone" aria-hidden="true"></span><h2>' + D.skillCount + ' skills</h2><p>' + esc(R.tagline) + '</p></div><div class="r">' +
    Object.keys(R.skills).map(function (g) { return '<p class="mono">' + esc(g) + "</p><p>" + R.skills[g].map(function (s) { return '<span class="sticker">' + esc(s) + "</span>"; }).join("") + "</p>"; }).join("") + "</div></article></section>";
  html += '<section class="page back" id="back" aria-label="Contact"><article class="spread"><div class="l"><p class="era">Hi.</p><span class="halftone" aria-hidden="true"></span><h2>' + esc(R.name) + "</h2><p>" + esc(R.summary) + '</p></div><div class="r"><h2>Get in touch</h2><a class="hot" href="' + esc(mail) + '">' + esc(R.email) + '</a><p><a href="' + esc(R.github) + '">GitHub</a> · ' + esc(R.location) + '</p><p class="mono">Other editions</p><p><a href="terminal/">Terminal</a> · <a href="gitlog/">Git log</a> · <a href="desktop/">DoogOS</a> · <a href="timeline/">Summit register</a></p></div></article></section>';
  zine.insertAdjacentHTML("beforeend", html);
  var pages = [].slice.call(zine.querySelectorAll(".page"));

  // ---------- navigation ----------
  var cur = 0, prevB = $("prev"), nextB = $("next"), pager = $("pager"), contents = $("contents"), cBtn = $("contentsBtn");
  function label(k) { return k === 0 ? "Cover" : pages[k].getAttribute("aria-label"); }
  function update() {
    cur = Math.round(zine.scrollLeft / zine.clientWidth);
    pager.textContent = String(cur + 1).padStart(2, "0") + " / " + String(pages.length).padStart(2, "0") + " · " + label(cur);
    prevB.disabled = cur === 0; nextB.disabled = cur === pages.length - 1;
  }
  var pending = null, settle;
  function go(k) { k = Math.max(0, Math.min(pages.length - 1, k)); pending = k; clearTimeout(settle); settle = setTimeout(function () { pending = null; }, 700); zine.scrollTo({ left: k * zine.clientWidth, behavior: reduce ? "auto" : "smooth" }); }
  zine.addEventListener("scroll", function () { requestAnimationFrame(update); }, { passive: true });
  function base() { return pending == null ? cur : pending; }
  prevB.addEventListener("click", function () { go(base() - 1); });
  nextB.addEventListener("click", function () { go(base() + 1); });
  document.addEventListener("keydown", function (e) {
    if (e.target === sq || /input|textarea/i.test(e.target.tagName)) return;
    if (e.key === "ArrowRight" || e.key === "PageDown") { e.preventDefault(); go(base() + 1); }
    else if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); go(base() - 1); }
    else if (e.key === "Home") go(0); else if (e.key === "End") go(pages.length - 1);
    else if (e.key === "Escape" && !contents.hidden) { contents.hidden = true; cBtn.setAttribute("aria-expanded", "false"); cBtn.focus(); }
  });
  contents.innerHTML = pages.map(function (pg, k) { return '<li><button type="button" data-k="' + k + '">' + String(k + 1).padStart(2, "0") + " · " + esc(label(k)) + "</button></li>"; }).join("");
  cBtn.addEventListener("click", function () { var open = contents.hidden; contents.hidden = !open; cBtn.setAttribute("aria-expanded", open); if (open) contents.querySelector("button").focus(); });
  contents.addEventListener("click", function (e) { var b = e.target.closest("[data-k]"); if (b) { go(+b.dataset.k); contents.hidden = true; cBtn.setAttribute("aria-expanded", "false"); } });
  $("barEmail").addEventListener("click", function (e) { e.preventDefault(); location.href = mail; });
  addEventListener("resize", function () { zine.scrollLeft = cur * zine.clientWidth; });
  update();
})();

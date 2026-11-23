(function () {
  "use strict";
  var M = window.VERSIONS;
  var list = M.list.slice().sort(function (a, b) { return a.v - b.v; });
  var best = M.current;
  var alt = document.getElementById("alt"), entry = document.getElementById("entry");
  var frame = document.getElementById("frame"), cap = document.getElementById("cap"), rows = document.getElementById("rows");
  var mobile = matchMedia("(max-width: 820px)");

  function pad(n) { return String(n).padStart(2, "0"); }
  function url(v) { return "../versions/v" + pad(v) + "/"; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function badge(e) {
    var b = '<span class="badge ' + esc(e.verdict) + '">' + esc(e.verdict) + "</span>";
    if (e.v === best) b += '<span class="badge best">current</span>';
    return b;
  }

  // refit strip: one step per version, bar height grows with version number
  alt.innerHTML = list.map(function (e, i) {
    var cls = "alt-step" + (e.featured ? " feat" : "") + (e.v === best ? " best" : "") + (e.verdict === "rejected" ? " rej" : "");
    return '<button type="button" role="option" class="' + cls + '" data-v="' + e.v + '" aria-selected="false" tabindex="-1" aria-label="Version ' + e.v + ": " + esc(e.title) + " (" + esc(e.verdict) + ')">' +
      '<span class="lbl">' + (e.featured || e.v === best ? "v" + e.v : "") + "</span>" +
      '<span class="dot">' + e.v + '</span><span class="alt-bar" style="height:' + (8 + Math.round(i / Math.max(1, list.length - 1) * (mobile.matches ? 110 : 190))) + 'px"></span></button>';
  }).join("");

  rows.innerHTML = list.slice().reverse().map(function (e) {
    return '<li class="' + (e.featured ? "feat" : "") + '" data-v="' + e.v + '"><span class="v">' + (e.featured ? "★ " : "") + "v" + pad(e.v) + '</span><span class="t">' + esc(e.title) + " " + badge(e) +
      '</span><a href="' + url(e.v) + '">open →</a><span class="n">' + esc(e.note) + "</span></li>";
  }).join("");
  document.getElementById("onlyFeat").addEventListener("change", function (ev) {
    rows.querySelectorAll("li").forEach(function (li) { li.classList.toggle("hide", ev.target.checked && !li.classList.contains("feat")); });
  });

  var current = null;
  function select(v, focus) {
    var e = list.find(function (x) { return x.v === v; }) || list[list.length - 1];
    current = e.v;
    alt.querySelectorAll(".alt-step").forEach(function (b) {
      var on = +b.dataset.v === e.v; b.setAttribute("aria-selected", on); b.tabIndex = on ? 0 : -1;
      if (on) { b.scrollIntoView({ block: "nearest", inline: "center" }); if (focus) b.focus({ preventScroll: true }); }
    });
    var feats = list.filter(function (x) { return x.featured; }).map(function (x) { return x.v; });
    var prev = feats.filter(function (n) { return n < e.v; }).pop(), next = feats.filter(function (n) { return n > e.v; })[0];
    entry.innerHTML = '<span class="mono">v' + pad(e.v) + " · " + esc(e.date) + "</span>" + badge(e) +
      "<h3>" + (e.featured ? '<span class="star" title="Milestone">★ </span>' : "") + esc(e.title) + "</h3><p>" + esc(e.note) + '</p><p class="why">' + esc(e.why) + "</p>" +
      (e.try ? '<p class="try"><b>Try it:</b> ' + esc(e.try) + "</p>" : "") +
      '<div class="actions"><a class="btn primary" href="' + url(e.v) + '">[ open v' + e.v + " → ]</a>" +
      '<button class="btn" data-go="' + prev + '"' + (prev == null ? " disabled" : "") + ' aria-label="Previous milestone">[ ◀ milestone ]</button>' +
      '<button class="btn" data-go="' + next + '"' + (next == null ? " disabled" : "") + ' aria-label="Next milestone">[ milestone ▶ ]</button>' +
      '<a class="btn" href="../">[ current ↩ ]</a></div>';
    var target = url(e.v) + "?embed=1";
    clearTimeout(window.__tlT);
    window.__tlT = setTimeout(function () { if (frame.dataset.src !== target) { frame.dataset.src = target; frame.src = target; } }, 220);
    cap.textContent = "live preview · v" + e.v;
    history.replaceState(null, "", "?v=" + e.v);
  }
  // compare with current best: a second live preview beside the selected one
  var cmp = document.getElementById("compare"), frames = document.getElementById("frames"), bestWrap = document.getElementById("bestWrap"), bestFrame = document.getElementById("bestFrame");
  cmp.addEventListener("change", function () {
    var on = cmp.checked;
    frames.classList.toggle("cmp-on", on); bestWrap.hidden = !on;
    document.querySelector(".viewer").classList.toggle("cmp-wide", on && !mobile.matches);
    if (on && !bestFrame.src) bestFrame.src = "../?embed=1";
    document.getElementById("bestCap").textContent = "current · v" + best;
    fit();
  });
  // [ and ] step between milestones from anywhere on the page
  document.addEventListener("keydown", function (ev) {
    if (ev.key !== "[" && ev.key !== "]") return;
    var feats = list.filter(function (x) { return x.featured; }).map(function (x) { return x.v; });
    var t = ev.key === "]" ? feats.filter(function (n) { return n > current; })[0] : feats.filter(function (n) { return n < current; }).pop();
    if (t != null) { ev.preventDefault(); select(t, true); }
  });
  // drag across the altimeter to scrub
  var scrubbing = false;
  function vFromX(x) {
    var best2 = null, bd = Infinity;
    alt.querySelectorAll(".alt-step").forEach(function (b) { var r = b.getBoundingClientRect(), c = r.left + r.width / 2; if (Math.abs(c - x) < bd) { bd = Math.abs(c - x); best2 = +b.dataset.v; } });
    return best2;
  }
  alt.addEventListener("pointerdown", function (ev) { scrubbing = true; alt.setPointerCapture(ev.pointerId); select(vFromX(ev.clientX)); });
  alt.addEventListener("pointermove", function (ev) { if (scrubbing) { var v = vFromX(ev.clientX); if (v !== current) select(v); } });
  alt.addEventListener("pointerup", function () { scrubbing = false; alt.focus({ preventScroll: true }); });
  alt.addEventListener("pointercancel", function () { scrubbing = false; });

  entry.addEventListener("click", function (ev) { var b = ev.target.closest("[data-go]"); if (b && !b.disabled) select(+b.dataset.go); });
  alt.addEventListener("click", function (ev) { var b = ev.target.closest(".alt-step"); if (b) select(+b.dataset.v, true); });
  alt.addEventListener("keydown", function (ev) {
    var i = list.findIndex(function (x) { return x.v === current; });
    var d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[ev.key];
    if (ev.key === "Home") i = 0; else if (ev.key === "End") i = list.length - 1; else if (d) i = Math.max(0, Math.min(list.length - 1, i + d)); else if (ev.key === "Enter") { location.href = url(current); return; } else return;
    ev.preventDefault(); select(list[i].v, true);
  });

  // scale the live preview to fit its frame
  function fit() {
    var w = mobile.matches ? 390 : 1280, h = mobile.matches ? 844 : 800;
    [frame, document.getElementById("bestFrame")].forEach(function (f) {
      var box = f.parentElement; if (box.hidden) return;
      var sc = box.clientWidth / w;
      f.style.width = w + "px"; f.style.height = Math.max(h, box.clientHeight / sc) + "px"; f.style.transform = "scale(" + sc + ")";
    });
  }
  addEventListener("resize", fit); fit();

  var q = +(new URLSearchParams(location.search).get("v"));
  select(isNaN(q) || !new URLSearchParams(location.search).has("v") ? best : q);
})();

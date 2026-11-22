/*
 * Injected into every archived snapshot (versions/vNN/...).
 * Shows which version you're looking at, lets you step between milestones,
 * and gets you back to the current best version in one click.
 */
(function () {
  var me = document.currentScript;
  // inside the register's live preview we stay out of the way
  if (window.self !== window.top || /[?&]embed=1/.test(location.search)) return;
  var v = +me.getAttribute("data-v");
  var root = new URL("../", me.src); // site root
  var s = document.createElement("script");
  s.src = new URL("versions/manifest.js", root).href;
  s.onload = render;
  document.head.appendChild(s);

  function vurl(n) { return new URL("versions/v" + String(n).padStart(2, "0") + "/", root).href; }

  function render() {
    var M = window.VERSIONS; if (!M) return;
    var list = M.list;
    var entry = list.find(function (e) { return e.v === v; }) || { title: "Snapshot", verdict: "" };
    var milestones = list.filter(function (e) { return e.featured; }).map(function (e) { return e.v; });
    var prev = milestones.filter(function (n) { return n < v; }).pop();
    var next = milestones.filter(function (n) { return n > v; })[0];

    var css = document.createElement("style");
    css.textContent =
      ".vb{position:fixed;top:10px;left:50%;transform:translateX(-50%);z-index:2147483000;display:flex;align-items:center;gap:2px;" +
      "max-width:calc(100vw - 16px);padding:4px;border-radius:999px;background:#fff7d6;color:#1b1b1b;border:2px solid #1b1b1b;" +
      "box-shadow:3px 3px 0 #1b1b1b;font:600 12px/1 system-ui,-apple-system,Segoe UI,sans-serif}" +
      ".vb a,.vb button{all:unset;cursor:pointer;padding:0 12px;min-height:40px;display:inline-flex;align-items:center;border-radius:999px;white-space:nowrap}" +
      ".vb a:hover,.vb button:hover,.vb a:focus-visible,.vb button:focus-visible{background:#1b1b1b;color:#fff7d6}" +
      ".vb .lbl{display:inline-flex;align-items:center;padding:0 10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}" +
      ".vb .tag{font-size:10px;text-transform:uppercase;letter-spacing:.06em;padding:3px 6px;border-radius:99px;border:1.5px solid currentColor;margin-left:6px}" +
      ".vb .home{background:#1b1b1b;color:#fff7d6}.vb .home:hover{background:#ff5a36;color:#fff}" +
      ".vb [aria-disabled=true]{opacity:.3;pointer-events:none}" +
      ".vb.min .lbl,.vb.min .nav{display:none}" +
      "@media (max-width:560px){.vb .lbl .t,.vb .tag{display:none}}" +
      "@media print{.vb{display:none}}";
    document.head.appendChild(css);

    var bar = document.createElement("nav");
    bar.className = "vb";
    bar.setAttribute("aria-label", "Version history");
    bar.innerHTML =
      '<button type="button" class="nav" data-act="hide" title="Collapse bar" aria-label="Collapse version bar">–</button>' +
      '<span class="lbl">v' + v + '<span class="t"> · ' + esc(entry.title) + "</span>" + (entry.verdict ? '<span class="tag">' + esc(entry.verdict) + "</span>" : "") + "</span>" +
      '<a class="nav" href="' + (prev != null ? vurl(prev) : "#") + '" aria-label="Previous milestone"' + (prev == null ? ' aria-disabled="true"' : "") + ">◀</a>" +
      '<a class="nav" href="' + (next != null ? vurl(next) : "#") + '" aria-label="Next milestone"' + (next == null ? ' aria-disabled="true"' : "") + ">▶</a>" +
      '<a class="nav" href="' + new URL("timeline/?v=" + v, root).href + '">Timeline</a>' +
      '<a class="home" href="' + root.href + '" title="Esc or Alt+0">Current best ↩</a>';
    bar.querySelector("[data-act=hide]").addEventListener("click", function () {
      bar.classList.toggle("min");
    });
    document.body.appendChild(bar);
    // Esc (when not typing) or Alt+0 returns to the current best version
    document.addEventListener("keydown", function (e) {
      var typing = /input|textarea|select/i.test(e.target.tagName) || e.target.isContentEditable;
      if ((e.key === "Escape" && !typing && !e.defaultPrevented && !document.querySelector("[aria-expanded=true], dialog[open]")) || (e.altKey && e.key === "0")) location.href = root.href;
    });
  }
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
})();

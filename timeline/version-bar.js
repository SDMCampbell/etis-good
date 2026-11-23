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
      ".vb{position:fixed;bottom:12px;left:50%;transform:translateX(-50%);z-index:2147483000;display:flex;align-items:center;gap:2px;" +
      "max-width:calc(100vw - 16px);padding:0 4px;background:#050806;color:#C8F7C5;border:1px solid #39FF7A;" +
      "box-shadow:0 0 0 3px rgba(5,8,6,.85),0 0 18px rgba(57,255,122,.25);font:700 12px/1 'JetBrains Mono',ui-monospace,Consolas,monospace}" +
      ".vb a,.vb button{all:unset;cursor:pointer;padding:0 9px;min-height:40px;display:inline-flex;align-items:center;white-space:nowrap;color:#8CFFB0}" +
      ".vb a:hover,.vb button:hover,.vb a:focus-visible,.vb button:focus-visible{color:#EAFFE7;background:#0c1a10;outline:1px solid #39FF7A}" +
      ".vb .lbl{display:inline-flex;align-items:center;padding:0 8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0;color:#7DB878}" +
      ".vb .lbl b{color:#EAFFE7;margin:0 .5ch}" +
      ".vb .tag{margin-left:6px;color:#39FF7A}.vb .tag.rejected{color:#FFC24D}" +
      ".vb .home{color:#050806;background:#39FF7A}.vb .home:hover,.vb .home:focus-visible{background:#EAFFE7;color:#050806}" +
      ".vb [aria-disabled=true]{opacity:.35;pointer-events:none}" +
      ".vb.min .lbl,.vb.min .nav{display:none}" +
      "@media (max-width:560px){.vb .lbl .t,.vb .tag,.vb .w{display:none}.vb .lbl{flex-shrink:0;padding:0 4px}.vb{top:auto;bottom:76px}}" +
      "@media print{.vb{display:none}}";
    document.head.appendChild(css);

    var bar = document.createElement("nav");
    bar.className = "vb";
    bar.setAttribute("aria-label", "Version history");
    bar.innerHTML =
      '<button type="button" class="nav" data-act="hide" title="Collapse bar" aria-label="Collapse version bar">–</button>' +
      '<span class="lbl"><span class="w">archive</span><b>v' + v + '</b><span class="t">' + esc(entry.title) + "</span>" + (entry.verdict ? '<span class="tag ' + esc(entry.verdict) + '">[' + esc(entry.verdict) + "]</span>" : "") + "</span>" +
      '<a class="nav" href="' + (prev != null ? vurl(prev) : "#") + '" aria-label="Previous milestone"' + (prev == null ? ' aria-disabled="true"' : "") + ">◀</a>" +
      '<a class="nav" href="' + (next != null ? vurl(next) : "#") + '" aria-label="Next milestone"' + (next == null ? ' aria-disabled="true"' : "") + ">▶</a>" +
      '<a class="nav" href="' + new URL("timeline/?v=" + v, root).href + '">changelog</a>' +
      '<a class="home" href="' + root.href + '" title="Esc or Alt+0">[ <span class="w">back to </span>current ↩ ]</a>';
    bar.querySelector("[data-act=hide]").addEventListener("click", function () {
      bar.classList.toggle("min");
    });
    document.body.appendChild(bar);
    // Esc (when not typing) or Alt+0 returns to the current best version
    document.addEventListener("keydown", function (e) {
      var typing = /input|textarea|select/i.test(e.target.tagName) || e.target.isContentEditable;
      if ((e.key === "Escape" && !typing && !e.defaultPrevented && !document.querySelector("[aria-expanded=true], dialog[open], #find:not([hidden])")) || (e.altKey && e.key === "0")) location.href = root.href;
    });
  }
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
})();

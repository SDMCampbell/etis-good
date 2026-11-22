/*
 * Concept switcher: injects a small floating nav on every page so visitors
 * can hop between the three versions of the resume.
 * Paths are resolved relative to this script, so it works on GitHub Pages
 * subpaths, a custom domain, or opened straight from disk.
 */
(function () {
  var root = new URL("../", document.currentScript.src);
  var concepts = [
    { id: "terminal", label: "Terminal", key: "1" },
    { id: "gitlog", label: "Git Log", key: "2" },
    { id: "desktop", label: "DoogOS", key: "3" }
  ];
  var current = document.documentElement.getAttribute("data-concept");
  if (current === "home") return; // the home page links the modes itself

  var style = document.createElement("style");
  style.textContent =
    ".cs-nav{position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:99999;" +
    "display:flex;gap:4px;padding:4px;border-radius:999px;background:rgba(18,18,22,.82);" +
    "backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);box-shadow:0 6px 24px rgba(0,0,0,.35);" +
    "border:1px solid rgba(255,255,255,.12);font:500 13px/1 system-ui,-apple-system,Segoe UI,sans-serif}" +
    ".cs-nav a{color:#d6d6de;text-decoration:none;padding:8px 14px;border-radius:999px;white-space:nowrap;transition:background .15s,color .15s}" +
    ".cs-nav a:hover{background:rgba(255,255,255,.1);color:#fff}" +
    ".cs-nav a[aria-current=page]{background:#fff;color:#111}" +
    ".cs-nav .cs-home{opacity:.7;padding:8px 10px}" +
    ".cs-nav kbd{font:inherit;opacity:.45;margin-left:6px;font-size:11px}" +
    "@media (max-width:520px){.cs-nav kbd{display:none}.cs-nav a{padding:8px 10px}}" +
    "@media print{.cs-nav{display:none}}";
  document.head.appendChild(style);

  var nav = document.createElement("nav");
  nav.className = "cs-nav";
  nav.setAttribute("aria-label", "Switch resume concept");

  var home = document.createElement("a");
  home.href = root.href;
  home.className = "cs-home";
  home.title = "All concepts";
  home.textContent = "⌂";
  if (!current) home.setAttribute("aria-current", "page");
  nav.appendChild(home);

  concepts.forEach(function (c) {
    var a = document.createElement("a");
    a.href = new URL(c.id + "/", root).href;
    a.innerHTML = c.label + "<kbd>Alt+" + c.key + "</kbd>";
    if (c.id === current) a.setAttribute("aria-current", "page");
    nav.appendChild(a);
  });

  document.addEventListener("keydown", function (e) {
    if (!e.altKey) return;
    var c = concepts.find(function (x) { return x.key === e.key; });
    if (c) { e.preventDefault(); location.href = new URL(c.id + "/", root).href; }
  });

  (document.body ? Promise.resolve() : new Promise(function (r) { document.addEventListener("DOMContentLoaded", r); }))
    .then(function () { document.body.appendChild(nav); });
})();

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
    { id: "gitlog", label: "Git log", key: "2" },
    { id: "desktop", label: "DoogOS", key: "3" }
  ];
  var current = document.documentElement.getAttribute("data-concept");
  if (current === "home") return; // the home page links the modes itself

  var night = false;
  try { var t = localStorage.getItem("theme"); night = t === "night" || (!t && matchMedia("(prefers-color-scheme: dark)").matches); } catch (e) {}

  var style = document.createElement("style");
  style.textContent =
    ".cs-nav{position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:99999;display:flex;align-items:stretch;gap:2px;" +
    "max-width:calc(100vw - 16px);padding:3px;background:#FFF7E8;border:3px solid #1C1838;box-shadow:4px 4px 0 #1C1838;" +
    "font:600 13px/1 'Instrument Sans',system-ui,-apple-system,Segoe UI,sans-serif}" +
    ".cs-nav a{display:inline-flex;align-items:center;gap:6px;min-height:40px;color:#1C1838;text-decoration:none;padding:0 12px;white-space:nowrap}" +
    ".cs-nav a:hover{background:#F6E9CF}" +
    ".cs-nav a:focus-visible{outline:3px solid #7A4DFF;outline-offset:-3px}" +
    ".cs-nav a[aria-current=page]{background:#1C1838;color:#FFF7E8}" +
    ".cs-nav .cs-home{background:#FF4A1C;color:#1C1838;font-weight:800}" +
    ".cs-nav .cs-home:hover{background:#ff6a42}" +
    ".cs-nav .cs-sep{width:3px;background:#1C1838;margin:4px 3px}" +
    ".cs-nav kbd{font:500 10px ui-monospace,monospace;opacity:.5}" +
    ".cs-nav.night{background:#120F2A;border-color:#EEEAFF;box-shadow:4px 4px 0 #7A4DFF}" +
    ".cs-nav.night a{color:#EEEAFF}.cs-nav.night a:hover{background:#211d45}" +
    ".cs-nav.night a[aria-current=page]{background:#EEEAFF;color:#120F2A}.cs-nav.night .cs-home{color:#1C1838}.cs-nav.night .cs-sep{background:#EEEAFF}" +
    "@media (max-width:560px){.cs-nav kbd,.cs-nav .cs-long{display:none}.cs-nav a{padding:0 9px}}" +
    "@media print{.cs-nav{display:none}}";
  document.head.appendChild(style);

  var nav = document.createElement("nav");
  nav.className = "cs-nav" + (night ? " night" : "");
  nav.setAttribute("aria-label", "Samuel Campbell's site");

  var home = document.createElement("a");
  home.href = root.href;
  home.className = "cs-home";
  home.innerHTML = "← <span>Cockpit</span>";
  home.title = "Back to the main site";
  nav.appendChild(home);
  var sep = document.createElement("span"); sep.className = "cs-sep"; sep.setAttribute("aria-hidden", "true"); nav.appendChild(sep);

  concepts.forEach(function (c) {
    var a = document.createElement("a");
    a.href = new URL(c.id + "/", root).href;
    a.innerHTML = c.label + "<kbd>Alt+" + c.key + "</kbd>";
    if (c.id === current) a.setAttribute("aria-current", "page");
    nav.appendChild(a);
  });
  var reg = document.createElement("a");
  // inside an archived snapshot the register still lives at the real site root
  var infra = /\/versions\/v\d+\/$/.test(root.pathname) ? new URL("../../", root) : root;
  reg.href = new URL("timeline/", infra).href;
  reg.innerHTML = '<span aria-hidden="true">▁▃▅</span><span class="cs-long">Register</span>';
  reg.title = "Summit register: every version of this site";
  reg.setAttribute("aria-label", "Summit register");
  nav.appendChild(reg);

  document.addEventListener("keydown", function (e) {
    if (!e.altKey) return;
    var c = concepts.find(function (x) { return x.key === e.key; });
    if (c) { e.preventDefault(); location.href = new URL(c.id + "/", root).href; }
  });

  (document.body ? Promise.resolve() : new Promise(function (r) { document.addEventListener("DOMContentLoaded", r); }))
    .then(function () { document.body.appendChild(nav); });
})();

(function () {
  "use strict";
  var R = window.RESUME;
  var desk = document.getElementById("desk");
  var tasks = document.getElementById("tasks");
  var mobile = function () { return window.innerWidth <= 700; };

  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  document.getElementById("wpName").textContent = R.name;
  document.getElementById("wpTitle").textContent = R.title + " · " + R.location;

  // ---------- icons (simple flat SVGs, original artwork) ----------
  var ICON = {
    note: '<svg viewBox="0 0 48 48"><path d="M10 4h22l8 8v32H10z" fill="#fff" stroke="#141414" stroke-width="3"/><path d="M32 4v8h8" fill="#e7e1cf" stroke="#141414" stroke-width="3"/><path d="M16 20h18M16 26h18M16 32h12" stroke="#3d6fd8" stroke-width="3"/></svg>',
    folder: '<svg viewBox="0 0 48 48"><path d="M4 10h15l4 5h21v25H4z" fill="#f1b51c" stroke="#141414" stroke-width="3"/><path d="M4 18h40" stroke="#141414" stroke-width="3"/></svg>',
    folderSm: '<svg viewBox="0 0 48 48"><path d="M4 10h15l4 5h21v25H4z" fill="#f1b51c" stroke="#141414" stroke-width="4"/></svg>',
    skills: '<svg viewBox="0 0 48 48"><rect x="5" y="5" width="16" height="16" fill="#e05a47" stroke="#141414" stroke-width="3"/><rect x="27" y="5" width="16" height="16" fill="#3d6fd8" stroke="#141414" stroke-width="3"/><rect x="5" y="27" width="16" height="16" fill="#3aa76d" stroke="#141414" stroke-width="3"/><rect x="27" y="27" width="16" height="16" fill="#f1b51c" stroke="#141414" stroke-width="3"/></svg>',
    mail: '<svg viewBox="0 0 48 48"><rect x="4" y="10" width="40" height="28" fill="#fff" stroke="#141414" stroke-width="3"/><path d="M4 10l20 16 20-16" fill="none" stroke="#141414" stroke-width="3"/><circle cx="38" cy="12" r="6" fill="#e05a47" stroke="#141414" stroke-width="2.5"/></svg>',
    term: '<svg viewBox="0 0 48 48"><rect x="4" y="7" width="40" height="34" fill="#141414" stroke="#141414" stroke-width="3"/><path d="M11 17l7 6-7 6" fill="none" stroke="#9fe870" stroke-width="3"/><path d="M22 31h12" stroke="#9fe870" stroke-width="3"/></svg>',
    git: '<svg viewBox="0 0 48 48"><rect x="4" y="4" width="40" height="40" fill="#fff" stroke="#141414" stroke-width="3"/><path d="M16 10v28" stroke="#3d6fd8" stroke-width="3"/><path d="M16 30c0-8 14-6 14-14" fill="none" stroke="#e05a47" stroke-width="3"/><circle cx="16" cy="12" r="4" fill="#fff" stroke="#141414" stroke-width="2.5"/><circle cx="16" cy="36" r="4" fill="#fff" stroke="#141414" stroke-width="2.5"/><circle cx="30" cy="15" r="4" fill="#fff" stroke="#141414" stroke-width="2.5"/></svg>',
    trash: '<svg viewBox="0 0 48 48"><path d="M10 14h28l-3 30H13z" fill="#e7e1cf" stroke="#141414" stroke-width="3"/><path d="M7 12h34M19 12V6h10v6" fill="none" stroke="#141414" stroke-width="3"/><path d="M19 20v18M24 20v18M29 20v18" stroke="#141414" stroke-width="2"/></svg>',
    gh: '<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="19" fill="#141414"/><path d="M17 35c0-4 1-6 3-7-5-1-8-3-8-9 0-2 1-4 2-5 0-2 0-4 1-5 2 0 4 1 5 2 3-1 6-1 8 0 1-1 3-2 5-2 1 1 1 3 1 5 1 1 2 3 2 5 0 6-3 8-8 9 2 1 3 3 3 7" fill="#fff"/></svg>'
  };

  // ---------- apps ----------
  var apps = {
    about:      { title: "About_Me.txt",   icon: "note",   color: "var(--yellow)", w: 520, h: 420, render: renderAbout },
    experience: { title: "Experience",     icon: "folder", color: "var(--blue)",   w: 760, h: 500, render: renderExperience },
    skills:     { title: "Skills.exe",     icon: "skills", color: "var(--green)",  w: 560, h: 520, render: renderSkills },
    contact:    { title: "Contact.mail",   icon: "mail",   color: "var(--red)",    w: 500, h: 470, render: renderContact },
    trash:      { title: "Trash",          icon: "trash",  color: "var(--paper-2)", w: 440, h: 330, render: renderTrash },
    terminal:   { title: "Terminal",       icon: "term",   href: "../terminal/" },
    gitlog:     { title: "git log",        icon: "git",    href: "../gitlog/" },
    github:     { title: "GitHub",         icon: "gh",     href: R.github, external: true }
  };
  var order = ["about", "experience", "skills", "contact", "terminal", "gitlog", "github", "trash"];

  function renderAbout(el) {
    el.innerHTML = '<div class="notepad"><h2>' + esc(R.name) + "</h2>" +
      esc(R.title) + " · " + esc(R.location) + "\n\n" +
      esc(R.summary) + "\n\n" +
      esc(R.tagline) + "\n\n" +
      "Currently: " + esc(R.jobs[0].role) + " @ " + esc(R.jobs[0].company) + (R.jobs[0].returning ? " (yes, again)" : "") + "\n" +
      "Started:   2011, summer intern writing JavaScript plug-ins\n" +
      "Range:     COBOL → C++ → PHP → .NET → whatever's next\n\n" +
      "-> Open <a href=\"#\" data-open=\"experience\">Experience</a> for the full story\n" +
      "-> Poke around <a href=\"#\" data-open=\"skills\">Skills.exe</a>\n" +
      "-> Or just <a href=\"#\" data-open=\"contact\">say hi</a></div>";
  }

  function renderExperience(el) {
    el.innerHTML = '<div class="explorer"><nav role="tablist" aria-label="Jobs"></nav><article role="tabpanel"></article></div>';
    var nav = el.querySelector("nav"), art = el.querySelector("article");
    nav.innerHTML = R.jobs.map(function (j, i) {
      return '<button role="tab" data-i="' + i + '" aria-selected="false">' + ICON.folderSm + "<span>" + esc(j.company) + '<span class="yr">' + esc(j.start) + (j.end !== j.start ? " – " + esc(j.end) : "") + "</span></span></button>";
    }).join("");
    function show(i) {
      var j = R.jobs[i];
      nav.querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-selected", +b.dataset.i === i ? "true" : "false"); });
      art.innerHTML = (j.returning ? '<div class="stamp">Welcome back!</div>' : "") +
        "<h3>" + esc(j.role) + '</h3><p class="co">' + esc(j.company) + (j.location ? ", " + esc(j.location) : "") +
        '<span class="when">' + esc(j.start) + (j.end !== j.start ? " – " + esc(j.end) : "") + "</span></p>" +
        "<ul>" + j.bullets.map(function (b) { return "<li>" + esc(b) + "</li>"; }).join("") + "</ul>" +
        (j.highlight ? '<div class="meter"><span class="dial">' + esc(j.highlight.to) + "</span><span>" + esc(j.highlight.label) + "<br><span class=\"small\">up from " + esc(j.highlight.from) + "</span></span></div>" : "") +
        '<div class="tagrow">' + j.tags.map(function (t) { return '<button class="tag" data-skill="' + esc(t) + '" title="Open in Skills.exe">' + esc(t) + "</button>"; }).join("") + "</div>";
      art.scrollTop = 0;
    }
    nav.addEventListener("click", function (e) { var b = e.target.closest("button"); if (b) show(+b.dataset.i); });
    art.addEventListener("click", function (e) { var t = e.target.closest("[data-skill]"); if (t) openApp("skills", { skill: t.dataset.skill }); });
    el.showJob = function (company) { var i = R.jobs.findIndex(function (j) { return j.id === company; }); if (i > -1) show(i); };
    show(0);
  }

  function renderSkills(el, opts) {
    var uses = {};
    R.jobs.forEach(function (j) { j.tags.forEach(function (t) { (uses[t.toLowerCase()] = uses[t.toLowerCase()] || []).push(j); }); });
    el.innerHTML = '<div class="skills"><p class="lead">Click any skill to see where I used it. Bars = number of roles.</p>' +
      Object.keys(R.skills).map(function (g) {
        return "<h4>" + esc(g) + '</h4><div class="grid">' + R.skills[g].map(function (s) {
          var n = (uses[s.toLowerCase()] || []).length;
          return '<button class="skill' + (n ? "" : " none") + '" aria-pressed="false" data-s="' + esc(s) + '">' + esc(s) +
            '<span class="pips" aria-hidden="true">' + new Array(n + 1).join("<i></i>") + "</span></button>";
        }).join("") + "</div>";
      }).join("") + '<div class="uses" aria-live="polite"><span class="small">Nothing selected yet. Go on, click one.</span></div></div>';
    var box = el.querySelector(".uses");
    function pick(name) {
      var btns = el.querySelectorAll(".skill");
      var match = null;
      btns.forEach(function (b) { var on = b.dataset.s.toLowerCase() === name.toLowerCase(); b.setAttribute("aria-pressed", on); if (on) match = b; });
      var list = uses[name.toLowerCase()] || [];
      if (!list.length) {
        box.innerHTML = "<b>" + esc(name) + "</b>: part of my toolbox, though not tied to one specific role on this page.";
      } else {
        box.innerHTML = "<b>" + esc(name) + "</b>: used in " + list.length + " role" + (list.length > 1 ? "s" : "") + "<ol>" +
          list.map(function (j) { return '<li><button class="lnk" data-job="' + esc(j.id) + '">' + esc(j.role) + "</button> @ " + esc(j.company) + ' <span class="small">(' + esc(j.start) + (j.end !== j.start ? "–" + esc(j.end) : "") + ")</span></li>"; }).join("") + "</ol>";
      }
      if (match) match.scrollIntoView({ block: "nearest" });
    }
    el.addEventListener("click", function (e) {
      var s = e.target.closest(".skill"); if (s) return pick(s.dataset.s);
      var j = e.target.closest("[data-job]"); if (j) { var w = openApp("experience"); w.content.showJob(j.dataset.job); }
    });
    el.pick = pick;
    if (opts && opts.skill) pick(opts.skill);
  }

  function renderContact(el) {
    el.innerHTML = '<form class="mail">' +
      '<label>To<input value="' + esc(R.email) + '" readonly></label>' +
      '<label>From<input name="from" placeholder="Your name" autocomplete="name"></label>' +
      '<label>About<select name="about"><option>A job opportunity</option><option>A freelance project</option><option>Just saying hi</option></select></label>' +
      '<textarea name="body" aria-label="Message" placeholder="Hey Samuel, ..."></textarea>' +
      '<div class="row"><button class="btn" type="submit">Send ✉</button><button class="btn alt" type="button" data-copy>Copy address</button>' +
      '<span class="small" data-msg></span></div>' +
      '<p class="small" style="margin:0">Opens your email app with this message filled in. Also on <a href="' + esc(R.github) + '" target="_blank" rel="noopener">GitHub</a>.</p></form>';
    var f = el.querySelector("form"), msg = el.querySelector("[data-msg]");
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var subject = f.about.value + (f.from.value ? " (from " + f.from.value + ")" : "");
      location.href = "mailto:" + R.email + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(f.body.value);
      msg.textContent = "Opening your mail app…";
    });
    el.querySelector("[data-copy]").addEventListener("click", function () {
      (navigator.clipboard ? navigator.clipboard.writeText(R.email) : Promise.reject()).then(
        function () { msg.textContent = "Copied!"; }, function () { msg.textContent = R.email; });
    });
  }

  function renderTrash(el) {
    var files = [
      ["table_layout_v1.html", "Replaced by flexbox. RIP."],
      ["final_FINAL_v3_real.css", "Learned version control. Never again."],
      ["svn_checkout.lock", "Moved to Git."],
      ["ie8_hacks.js", "Deleted with joy."]
    ];
    el.innerHTML = '<div class="trash">' + files.map(function (f) {
      return '<div class="file">' + '<svg viewBox="0 0 48 48" width="26" height="26">' + ICON.note.replace(/^<svg[^>]*>|<\/svg>$/g, "") + "</svg><div>" + esc(f[0]) + "<br><small>" + esc(f[1]) + "</small></div></div>";
    }).join("") + '<p style="margin:14px 0 0"><button class="btn alt" type="button" data-empty>Empty Trash</button> <span class="small" data-msg></span></p></div>';
    el.querySelector("[data-empty]").addEventListener("click", function () {
      el.querySelector("[data-msg]").textContent = "Can't. I learned something from every one of these.";
    });
  }

  // ---------- desktop icons ----------
  var iconsEl = document.getElementById("icons");
  iconsEl.innerHTML = order.map(function (id) {
    var a = apps[id];
    return '<li><button class="icon" data-app="' + id + '" title="' + (a.href ? "Open " : "Double-click to open ") + esc(a.title) + '">' + ICON[a.icon] + "<span>" + esc(a.title) + "</span></button></li>";
  }).join("");
  iconsEl.addEventListener("click", function (e) {
    var b = e.target.closest(".icon"); if (!b) return;
    iconsEl.querySelectorAll(".icon").forEach(function (x) { x.classList.toggle("sel", x === b); });
    // single tap opens on touch / small screens; desktop uses double-click like a real OS
    if (mobile() || e.detail === 0 || matchMedia("(pointer: coarse)").matches) openApp(b.dataset.app);
  });
  iconsEl.addEventListener("dblclick", function (e) { var b = e.target.closest(".icon"); if (b) openApp(b.dataset.app); });

  // ---------- window manager ----------
  var wins = {}, z = 10, cascade = 0;
  function openApp(id, opts) {
    var a = apps[id];
    if (a.href) { if (a.external) window.open(a.href, "_blank", "noopener"); else location.href = a.href; return; }
    if (wins[id]) {
      var w = wins[id];
      w.el.classList.remove("min");
      if (opts && opts.skill && w.content.pick) w.content.pick(opts.skill);
      focus(id); return w;
    }
    var el = document.createElement("section");
    el.className = "win";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-label", a.title);
    el.style.setProperty("--c", a.color);
    var dw = desk.clientWidth, dh = desk.clientHeight;
    var w0 = Math.min(a.w, dw - 40), h0 = Math.min(a.h, dh - 40);
    var left = Math.max(10, Math.min(dw - w0 - 10, opts && opts.left != null ? opts.left : 120 + cascade * 64));
    var top = Math.max(10, Math.min(dh - h0 - 10, opts && opts.top != null ? opts.top : 24 + cascade * 48));
    cascade = (cascade + 1) % 6;
    el.style.cssText += ";left:" + left + "px;top:" + top + "px;width:" + w0 + "px;height:" + h0 + "px";
    el.innerHTML = '<div class="bar"><span class="t">' + esc(a.title) + '</span>' +
      '<button data-act="min" aria-label="Minimize">_</button><button data-act="max" aria-label="Maximize">□</button><button data-act="close" aria-label="Close">×</button></div>' +
      '<div class="content"></div><div class="grip" aria-hidden="true"></div>';
    desk.appendChild(el);
    var content = el.querySelector(".content");
    a.render(content, opts);

    var tb = document.createElement("button");
    tb.textContent = a.title;
    tb.addEventListener("click", function () {
      if (el.classList.contains("min")) { el.classList.remove("min"); focus(id); }
      else if (el.classList.contains("focused")) { el.classList.add("min"); el.classList.remove("focused"); tb.classList.remove("on"); }
      else focus(id);
    });
    tasks.appendChild(tb);

    wins[id] = { el: el, tb: tb, content: content };
    el.addEventListener("pointerdown", function () { focus(id); });
    el.querySelector(".bar").addEventListener("click", function (e) {
      var act = e.target.closest("[data-act]"); if (!act) return;
      if (act.dataset.act === "close") close(id);
      if (act.dataset.act === "min") { el.classList.add("min"); el.classList.remove("focused"); tb.classList.remove("on"); }
      if (act.dataset.act === "max") el.classList.toggle("max");
    });
    el.querySelector(".bar").addEventListener("dblclick", function (e) { if (!e.target.closest("button")) el.classList.toggle("max"); });
    content.addEventListener("click", function (e) { var o = e.target.closest("[data-open]"); if (o) { e.preventDefault(); openApp(o.dataset.open); } });
    drag(el, el.querySelector(".bar"), "move");
    drag(el, el.querySelector(".grip"), "resize");
    focus(id);
    return wins[id];
  }
  function focus(id) {
    Object.keys(wins).forEach(function (k) { wins[k].el.classList.toggle("focused", k === id); wins[k].tb.classList.toggle("on", k === id); });
    wins[id].el.style.zIndex = ++z;
  }
  function close(id) { var w = wins[id]; w.el.remove(); w.tb.remove(); delete wins[id]; }

  function drag(el, handle, mode) {
    handle.addEventListener("pointerdown", function (e) {
      if (e.target.closest("button") || mobile() || el.classList.contains("max")) return;
      e.preventDefault();
      handle.setPointerCapture(e.pointerId);
      var sx = e.clientX, sy = e.clientY, r = { l: el.offsetLeft, t: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight };
      function move(ev) {
        var dx = ev.clientX - sx, dy = ev.clientY - sy;
        if (mode === "move") {
          el.style.left = Math.min(desk.clientWidth - 60, Math.max(-r.w + 80, r.l + dx)) + "px";
          el.style.top = Math.min(desk.clientHeight - 34, Math.max(0, r.t + dy)) + "px";
        } else {
          el.style.width = Math.max(280, r.w + dx) + "px";
          el.style.height = Math.max(160, r.h + dy) + "px";
        }
      }
      function up() { handle.removeEventListener("pointermove", move); handle.removeEventListener("pointerup", up); handle.removeEventListener("pointercancel", up); }
      handle.addEventListener("pointermove", move);
      handle.addEventListener("pointerup", up);
      handle.addEventListener("pointercancel", up);
    });
  }

  // ---------- start menu ----------
  var startBtn = document.getElementById("startBtn"), menu = document.getElementById("startMenu");
  menu.innerHTML = '<div class="side">DoogOS</div><ul>' +
    order.map(function (id) { return '<li><button role="menuitem" data-app="' + id + '">' + ICON[apps[id].icon] + esc(apps[id].title) + "</button></li>"; }).join("") +
    '<li><hr></li><li><a role="menuitem" href="../">' + ICON.folder + "Shut down…</a></li></ul>";
  function toggleMenu(open) {
    open = open === undefined ? menu.hidden : open;
    menu.hidden = !open; startBtn.setAttribute("aria-expanded", open);
    if (open) menu.querySelector("button").focus();
  }
  startBtn.addEventListener("click", function () { toggleMenu(); });
  menu.addEventListener("click", function (e) { var b = e.target.closest("[data-app]"); if (b) { toggleMenu(false); openApp(b.dataset.app); } });
  document.addEventListener("pointerdown", function (e) { if (!menu.hidden && !menu.contains(e.target) && !startBtn.contains(e.target)) toggleMenu(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !menu.hidden) { toggleMenu(false); startBtn.focus(); } });

  // ---------- clock ----------
  var clock = document.getElementById("clock");
  function tick() { clock.textContent = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }); }
  tick(); setInterval(tick, 15000);

  // ---------- boot ----------
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  setTimeout(function () {
    document.getElementById("boot").classList.add("done");
    if (!mobile()) openApp("experience", { left: desk.clientWidth - 800, top: 40 });
    openApp("about", { left: 130, top: 24 });
  }, reduce ? 0 : 1250);
})();

(function () {
  "use strict";
  var R = window.RESUME;
  var out = document.getElementById("out");
  var input = document.getElementById("cmd");
  var form = document.getElementById("form");
  var promptEl = document.getElementById("prompt");
  var screen = document.getElementById("screen");
  var quick = document.getElementById("quick");

  var USER = R.handle + "@etis-good";
  var cwd = "~";
  var history = [];
  var hIndex = 0;

  // ---------- helpers ----------
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function print(html, cls) {
    var d = document.createElement("div");
    if (cls) d.className = cls;
    d.innerHTML = html == null ? "" : html;
    out.appendChild(d);
    return d;
  }
  function blank() { print(""); }
  function scroll() { screen.scrollTop = screen.scrollHeight; }
  // A clickable link that runs a command when clicked.
  function cmdLink(cmd, label) {
    return '<button class="lnk" data-run="' + esc(cmd) + '">' + esc(label || cmd) + "</button>";
  }
  function promptHTML() {
    return '<span class="p-user">' + esc(USER) + '</span>:<span class="p-path">' + esc(cwd) + "</span>$";
  }
  function renderPrompt() { promptEl.innerHTML = promptHTML(); }
  function pad(s, n) { s = String(s); return s + " ".repeat(Math.max(1, n - s.length)); }

  // ---------- virtual filesystem ----------
  var fs = {
    "~": { type: "dir", children: ["about.txt", "contact.txt", "skills.txt", "jobs", ".secrets"] },
    "~/jobs": { type: "dir", children: R.jobs.map(function (j) { return j.id + ".md"; }) }
  };
  fs["~/about.txt"] = { type: "file", render: renderAbout };
  fs["~/contact.txt"] = { type: "file", render: renderContact };
  fs["~/skills.txt"] = { type: "file", render: renderSkills };
  fs["~/.secrets"] = { type: "file", render: function () {
    print("Permission denied. Nice try though :)", "err");
    print('<span class="dim">(Honestly, the only secret is that I like COBOL more than I let on.)</span>');
  } };
  R.jobs.forEach(function (j) { fs["~/jobs/" + j.id + ".md"] = { type: "file", render: function () { renderJob(j); } }; });

  function resolve(p) {
    if (!p || p === "~") return "~";
    var parts = (p.startsWith("~") || p.startsWith("/") ? [] : cwd.split("/").slice(1));
    p.replace(/^~\/?|^\//, "").split("/").forEach(function (seg) {
      if (!seg || seg === ".") return;
      if (seg === "..") parts.pop(); else parts.push(seg);
    });
    return ["~"].concat(parts).join("/");
  }

  // ---------- renderers ----------
  function renderAbout() {
    print('<span class="b acc">' + esc(R.name) + "</span>  " + '<span class="dim">' + esc(R.title) + " · " + esc(R.location) + "</span>");
    blank();
    print(esc(R.summary));
    print(esc(R.tagline));
    blank();
    print('<span class="dim">Try</span> ' + cmdLink("experience") + ' <span class="dim">or</span> ' + cmdLink("skills") + ' <span class="dim">or</span> ' + cmdLink("grep drupal"));
  }
  function renderContact() {
    print(pad("email", 10) + '<a class="lnk" href="mailto:' + esc(R.email) + '">' + esc(R.email) + "</a>");
    print(pad("github", 10) + '<a class="lnk" href="' + esc(R.github) + '" target="_blank" rel="noopener">' + esc(R.github.replace("https://", "")) + "</a>");
    print(pad("location", 10) + esc(R.location));
  }
  function renderSkills() {
    var counts = {};
    R.jobs.forEach(function (j) { j.tags.forEach(function (t) { counts[t.toLowerCase()] = (counts[t.toLowerCase()] || 0) + 1; }); });
    Object.keys(R.skills).forEach(function (group) {
      print('<span class="acc b">' + esc(group) + "</span>");
      R.skills[group].forEach(function (s) {
        var n = counts[s.toLowerCase()] || 0;
        var bar = n ? '<span class="bar" style="width:' + n * 1.4 + 'ch"></span> <span class="dim">' + n + " role" + (n > 1 ? "s" : "") + "</span>" : '<span class="dim">·</span>';
        print("  " + cmdLink("grep " + s, pad(s, 14)).replace(/(\s+)<\/button>$/, "</button>$1") + bar);
      });
    });
    blank();
    print('<span class="dim">Click a skill (or run </span>grep &lt;skill&gt;<span class="dim">) to see where I used it.</span>');
  }
  function renderJob(j) {
    print('<span class="acc b"># ' + esc(j.role) + "</span>");
    print('<span class="b">' + esc(j.company) + "</span>" + (j.location ? '<span class="dim"> · ' + esc(j.location) + "</span>" : "") +
      '<span class="dim"> · ' + esc(j.start) + (j.end && j.end !== j.start ? " – " + esc(j.end) : "") + "</span>" +
      (j.returning ? '  <span class="acc">[returning]</span>' : ""));
    blank();
    j.bullets.forEach(function (b) { print("  - " + esc(b)); });
    if (j.highlight) { blank(); print('  <span class="dim">' + esc(j.highlight.label) + ":</span> " + esc(j.highlight.from) + ' → <span class="acc b">' + esc(j.highlight.to) + "</span>"); }
    blank();
    print('<span class="dim">tags:</span> ' + j.tags.map(function (t) { return cmdLink("grep " + t, t); }).join(" "));
  }
  function renderExperience() {
    R.jobs.forEach(function (j) {
      var years = j.start + (j.end && j.end !== j.start ? "–" + j.end : "");
      print('<span class="dim">' + pad(years, 15) + "</span>" + cmdLink("cat jobs/" + j.id + ".md", j.role) + '<span class="dim"> @ ' + esc(j.company) + "</span>");
    });
    blank();
    print('<span class="dim">Click a role, or </span>cat jobs/&lt;name&gt;.md');
  }

  // ---------- commands ----------
  var commands = {
    help: { desc: "list commands", run: function () {
      Object.keys(commands).forEach(function (k) {
        if (commands[k].hidden) return;
        print("  " + cmdLink(k, pad(k, 12)).replace(/(\s+)<\/button>$/, "</button>$1") + '<span class="dim">' + esc(commands[k].desc) + "</span>");
      });
      blank();
      print('<span class="dim">Tab completes · ↑/↓ history · Ctrl+L clears</span>');
    } },
    whoami: { desc: "who is this guy", run: renderAbout },
    experience: { desc: "work history (alias: jobs)", run: renderExperience },
    skills: { desc: "skills, weighted by how often I've used them", run: renderSkills },
    contact: { desc: "how to reach me", run: renderContact },
    grep: { desc: "search my experience, e.g. grep php", run: function (args) {
      var term = args.join(" ").replace(/^-i\s+/, "").trim();
      if (!term) return print("usage: grep &lt;term&gt;", "err");
      var re = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      var hits = 0;
      R.jobs.forEach(function (j) {
        var lines = j.bullets.filter(function (b) { return re.test(b); });
        var tagHit = j.tags.some(function (t) { return t.toLowerCase() === term.toLowerCase(); });
        if (!lines.length && !tagHit) return;
        hits++;
        print(cmdLink("cat jobs/" + j.id + ".md", "jobs/" + j.id + ".md") + '<span class="dim">: ' + esc(j.role) + " @ " + esc(j.company) + "</span>");
        lines.forEach(function (b) { print("    " + esc(b).replace(new RegExp(esc(term).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), function (m) { return "<mark>" + m + "</mark>"; })); });
        if (!lines.length) print('    <span class="dim">(tagged ' + esc(term) + ")</span>");
      });
      if (!hits) print('<span class="dim">No matches for "' + esc(term) + '". But give me a week with it.</span>');
    } },
    ls: { desc: "list files", run: function (args) {
      var all = args.indexOf("-a") > -1 || args.indexOf("-la") > -1;
      var target = resolve(args.filter(function (a) { return a[0] !== "-"; })[0] || cwd);
      var node = fs[target];
      if (!node) return print("ls: cannot access '" + esc(args[0]) + "': No such file or directory", "err");
      if (node.type === "file") return print(esc(target.split("/").pop()));
      print(node.children.filter(function (c) { return all || c[0] !== "."; }).map(function (c) {
        var full = target + "/" + c;
        var rel = full.replace(cwd === "~" ? /^~\// : new RegExp("^" + cwd.replace(/[~/]/g, "\\$&") + "/"), "");
        return fs[full].type === "dir" ? cmdLink("cd " + rel, c + "/") : cmdLink("cat " + rel, c);
      }).join("   "));
    } },
    cd: { desc: "change directory", run: function (args) {
      var t = resolve(args[0] || "~");
      if (!fs[t]) return print("cd: no such file or directory: " + esc(args[0]), "err");
      if (fs[t].type !== "dir") return print("cd: not a directory: " + esc(args[0]), "err");
      cwd = t; renderPrompt();
    } },
    cat: { desc: "print a file", run: function (args) {
      if (!args.length) return print("usage: cat &lt;file&gt;", "err");
      args.forEach(function (a) {
        var n = fs[resolve(a)];
        if (!n) return print("cat: " + esc(a) + ": No such file or directory", "err");
        if (n.type === "dir") return print("cat: " + esc(a) + ": Is a directory", "err");
        n.render();
      });
    } },
    pwd: { desc: "print working directory", run: function () { print(cwd.replace("~", "/home/" + R.handle)); } },
    neofetch: { desc: "system info, but it's me", run: neofetch },
    theme: { desc: "theme green | amber | light", run: function (args) {
      var t = args[0];
      if (["green", "amber", "light"].indexOf(t) < 0) return print("usage: theme green | amber | light", "err");
      document.body.className = "theme-" + t;
      try { localStorage.setItem("term-theme", t); } catch (e) {}
      print("theme set to " + esc(t));
    } },
    history: { desc: "command history", run: function () { history.forEach(function (h, i) { print(pad(i + 1, 5) + esc(h)); }); } },
    clear: { desc: "clear the screen", run: function () { out.innerHTML = ""; } },
    gui: { desc: "prefer windows? open DoogOS", run: function () { print("launching DoogOS..."); setTimeout(function () { location.href = "../desktop/"; }, 500); } },
    echo: { hidden: true, desc: "", run: function (args) { print(esc(args.join(" "))); } },
    date: { hidden: true, desc: "", run: function () { print(esc(new Date().toString())); } },
    sudo: { hidden: true, desc: "", run: function (args) {
      if (args.join(" ") === "hire samuel" || args.join(" ") === "hire sam") { print('<span class="acc b">Excellent decision.</span> ' + '<a class="lnk" href="mailto:' + esc(R.email) + '?subject=Let%27s%20talk">Send the offer →</a>'); }
      else print(esc(R.handle) + " is not in the sudoers file. This incident will be reported. <span class=\"dim\">(try: sudo hire samuel)</span>");
    } },
    exit: { hidden: true, desc: "", run: function () { print("There's no escape. But there is a " + cmdLink("gui") + "."); } },
    vim: { hidden: true, desc: "", run: function () { print("You are now trapped in vim. Just kidding. Type :q anyway if it makes you feel better."); } },
    ":q": { hidden: true, desc: "", run: function () { print("Freedom."); } },
    rm: { hidden: true, desc: "", run: function () { print("rm: refusing to delete my career. It took a while.", "err"); } }
  };
  commands.jobs = Object.assign({}, commands.experience, { hidden: true });
  commands.about = Object.assign({}, commands.whoami, { hidden: true });
  commands.ll = Object.assign({}, commands.ls, { hidden: true, run: function (a) { commands.ls.run(["-a"].concat(a)); } });

  function neofetch() {
    var years = new Date().getFullYear() - 2011;
    var art = [
      "    ____  ____  ____  ____ ",
      "   / __ \\/ __ \\/ __ \\/ __ \\",
      "  / / / / / / / / / / /_/ /",
      " / /_/ / /_/ / /_/ /\\__, / ",
      "/_____/\\____/\\____//____/  "
    ];
    var info = [
      '<span class="acc b">' + esc(USER) + "</span>",
      '<span class="dim">-------------------</span>',
      '<span class="acc">OS</span>: Human (South Carolina edition)',
      '<span class="acc">Role</span>: ' + esc(R.title),
      '<span class="acc">Uptime</span>: ' + years + "+ years in tech",
      '<span class="acc">Shell</span>: PHP / JavaScript / .NET',
      '<span class="acc">Packages</span>: ' + Object.keys(R.skills).reduce(function (n, k) { return n + R.skills[k].length; }, 0) + " skills",
      '<span class="acc">Employers</span>: ' + R.jobs.length + " roles (1 sequel)"
    ];
    if (window.innerWidth < 700) art = []; // art wraps badly on phones
    for (var i = 0; i < Math.max(art.length, info.length); i++) {
      print((art.length ? '<span class="ascii">' + esc(pad(art[i] || "", 30)) + "</span>" : "") + (info[i] || ""));
    }
  }

  // ---------- run / input ----------
  function run(raw, opts) {
    raw = raw.trim();
    if (!(opts && opts.silent)) print(promptHTML() + " " + esc(raw));
    if (raw) { history.push(raw); hIndex = history.length; }
    var parts = raw.split(/\s+/);
    var name = (parts.shift() || "").toLowerCase();
    if (!name) return scroll();
    var c = commands[name];
    if (c) c.run(parts);
    else print("command not found: " + esc(name) + '. Try ' + cmdLink("help") + ".", "err");
    blank();
    scroll();
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var v = input.value; input.value = "";
    run(v);
  });

  input.addEventListener("keydown", function (e) {
    if (e.key === "ArrowUp") { e.preventDefault(); if (hIndex > 0) { hIndex--; input.value = history[hIndex]; } }
    else if (e.key === "ArrowDown") { e.preventDefault(); if (hIndex < history.length) { hIndex++; input.value = history[hIndex] || ""; } }
    else if (e.key === "l" && e.ctrlKey) { e.preventDefault(); out.innerHTML = ""; }
    else if (e.key === "Tab") { e.preventDefault(); complete(); }
  });

  function complete() {
    var v = input.value;
    var parts = v.split(" ");
    var options;
    var word = parts[parts.length - 1];
    if (parts.length === 1) {
      options = Object.keys(commands).filter(function (k) { return !commands[k].hidden && k.indexOf(word) === 0; });
    } else {
      var slash = word.lastIndexOf("/");
      var dirPart = slash > -1 ? word.slice(0, slash + 1) : "";
      var base = word.slice(slash + 1);
      var dir = fs[resolve(dirPart || ".")];
      if (!dir || dir.type !== "dir") return;
      options = dir.children.filter(function (c) { return c.indexOf(base) === 0 && (base[0] === "." || c[0] !== "."); })
        .map(function (c) { return dirPart + c + (fs[resolve(dirPart + c)].type === "dir" ? "/" : ""); });
    }
    if (options.length === 1) {
      parts[parts.length - 1] = options[0];
      input.value = parts.join(" ") + (options[0].slice(-1) === "/" ? "" : " ");
    } else if (options.length > 1) {
      print(promptHTML() + " " + esc(v));
      print(options.map(esc).join("   "), "dim");
      var common = options.reduce(function (a, b) { var i = 0; while (i < a.length && a[i] === b[i]) i++; return a.slice(0, i); });
      parts[parts.length - 1] = common; input.value = parts.join(" ");
      scroll();
    }
  }

  // click-to-run links anywhere in the output
  out.addEventListener("click", function (e) {
    var b = e.target.closest("[data-run]");
    if (b) { run(b.getAttribute("data-run")); input.focus(); }
  });
  // clicking anywhere in the terminal focuses the input (unless selecting text)
  document.getElementById("term").addEventListener("mouseup", function () {
    if (!window.getSelection().toString()) input.focus({ preventScroll: true });
  });

  // quick-command chips (great on mobile)
  ["help", "whoami", "experience", "skills", "contact", "neofetch"].forEach(function (c) {
    var b = document.createElement("button");
    b.type = "button"; b.textContent = c;
    b.addEventListener("click", function () { run(c); input.focus(); });
    quick.appendChild(b);
  });

  // ---------- boot ----------
  try { var t = localStorage.getItem("term-theme"); if (t) document.body.className = "theme-" + t; } catch (e) {}
  renderPrompt();
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var boot = [
    '<span class="dim">[  0.000] etis-good kernel: booting résumé v' + new Date().getFullYear() + "</span>",
    '<span class="dim">[  0.042] mounting /home/' + esc(R.handle) + "/jobs ... " + R.jobs.length + " entries</span>",
    '<span class="dim">[  0.081] loading skills ... ok</span>',
    ""
  ];
  var i = 0;
  (function step() {
    if (i < boot.length) { print(boot[i++]); return setTimeout(step, reduce ? 0 : 140); }
    print("Welcome! I'm <span class=\"acc b\">" + esc(R.name) + "</span>, a " + esc(R.title.toLowerCase()) + ".");
    print("Type " + cmdLink("help") + " to look around, or just run " + cmdLink("whoami") + ".");
    blank();
    input.focus();
    scroll();
  })();
})();

(function () {
  "use strict";
  var R = window.RESUME;
  var ROW = 46, LANE = 18, X0 = 20;
  var COLORS = ["#2f6fde", "#e0623a", "#1a9c7a", "#9b4fd1", "#d49b00", "#d43f7a", "#3a8fb7", "#6c8a1f", "#b5502c"];

  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function hash(str) { var h = 2166136261; for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return ("0000000" + (h >>> 0).toString(16)).slice(-7); }
  function commitType(text) {
    // classify by what the bullet is mostly about
    if (/speed|perform|99%/i.test(text)) return "perf";
    if (/^(led|coordinated)\b/i.test(text)) return "lead";
    if (/^(redesigned|modified|rebuilt|migrated)\b/i.test(text)) return "refactor";
    if (/^monitored\b/i.test(text)) return "ops";
    if (/^developed backend solutions/i.test(text)) return "fix";
    return "feat";
  }
  function shorten(t) {
    t = t.replace(/\s*\(.*?\)/g, "").replace(/\.$/, "");
    var cut = t.split(/,| to | using | which | as well as /)[0];
    return cut.length > 20 ? cut : t;
  }

  // ---------- header ----------
  document.getElementById("name").innerHTML = esc(R.name) + "<small>" + esc(R.title) + " · " + esc(R.location) + "</small>";
  document.getElementById("about").textContent = R.summary + " " + R.tagline;

  // ---------- build commit rows (newest first) ----------
  var rows = [];       // {kind, job, lane, text, date, color}
  var seen = {};       // skills already introduced, for "diffs"
  var chrono = R.jobs.slice().reverse();
  var newSkills = {};
  chrono.forEach(function (j) {
    newSkills[j.id] = j.tags.filter(function (t) { var k = t.toLowerCase(); if (seen[k]) return false; seen[k] = 1; return true; });
  });

  var branches = []; // {job, lane, color, top, bottom, head}
  R.jobs.forEach(function (j, idx) {
    var lane = 1 + (idx % 2);
    var color = COLORS[idx % COLORS.length];
    var head = /present/i.test(j.end);
    var b = { job: j, lane: lane, color: color, head: head, top: rows.length };
    if (!head) rows.push({ kind: "merge", job: j, lane: 0, color: color, date: j.end,
      text: "Merge branch '" + j.id + "'", sub: j.role + " @ " + j.company });
    j.bullets.slice().reverse().forEach(function (bl, i) {
      rows.push({ kind: "commit", job: j, lane: lane, color: color, date: j.start + (j.end !== j.start ? "–" + j.end : ""),
        text: shorten(bl), type: commitType(bl), bulletIndex: j.bullets.length - 1 - i });
    });
    rows.push({ kind: "fork", job: j, lane: lane, color: color, date: j.start,
      text: (j.returning ? "checkout " + j.id + " (welcome back)" : "checkout -b " + j.id), sub: "Joined " + j.company });
    b.bottom = rows.length - 1;
    branches.push(b);
  });
  rows.push({ kind: "root", lane: 0, color: "#888", date: "2011", text: "Initial commit: hello, world", job: null });
  rows.forEach(function (r) { r.hash = hash((r.job ? r.job.id : "root") + r.kind + r.text); });

  // ---------- stats ----------
  var allSkills = {};
  R.jobs.forEach(function (j) { j.tags.forEach(function (t) { allSkills[t] = (allSkills[t] || 0) + 1; }); });
  var commitsCount = rows.length;
  document.getElementById("stats").innerHTML = [
    "<span><b>" + commitsCount + "</b> commits</span>",
    "<span><b>" + R.jobs.length + "</b> branches</span>",
    "<span><b>" + Object.keys(allSkills).length + "</b> skills tagged</span>",
    "<span>since <b>2011</b></span>",
    '<a href="mailto:' + esc(R.email) + '">' + esc(R.email) + "</a>",
    '<a href="' + esc(R.github) + '" target="_blank" rel="noopener">GitHub</a>'
  ].join("");

  // ---------- render list ----------
  var list = document.getElementById("commits");
  var maxLane = 2;
  var padLeft = X0 + LANE * (maxLane + 1);
  list.innerHTML = rows.map(function (r, i) {
    var refs = "";
    if (r.kind === "fork" || (r.kind === "commit" && i === 0)) {
      var br = branches.filter(function (b) { return b.job === r.job; })[0];
      if (br && br.head && i === br.top) refs = '<span class="ref head">HEAD → ' + esc(r.job.id) + "</span>";
    }
    var msg = r.kind === "commit"
      ? '<span class="type">' + r.type + ":</span> " + esc(r.text)
      : esc(r.text) + (r.sub ? ' <span class="muted">· ' + esc(r.sub) + "</span>" : "");
    return '<li class="commit ' + r.kind + '" tabindex="0" data-i="' + i + '" style="padding-left:' + padLeft + 'px">' +
      '<span class="hash">' + r.hash + "</span>" + refs + '<span class="msg">' + msg + '</span><span class="when">' + esc(r.date) + "</span></li>";
  }).join("");

  // ---------- draw graph ----------
  var svg = document.getElementById("graph");
  var H = rows.length * ROW;
  svg.setAttribute("width", padLeft); svg.setAttribute("height", H);
  svg.setAttribute("viewBox", "0 0 " + padLeft + " " + H);
  function x(l) { return X0 + l * LANE; }
  function y(i) { return i * ROW + ROW / 2; }
  var parts = [];
  // main line: from first non-head row to root
  var firstMain = 0; while (rows[firstMain] && rows[firstMain].lane !== 0) firstMain++;
  parts.push('<line x1="' + x(0) + '" y1="' + y(firstMain) + '" x2="' + x(0) + '" y2="' + y(rows.length - 1) + '" stroke="#b9b4a6" stroke-width="2.5"/>');
  branches.forEach(function (b) {
    var L = x(b.lane), c = b.color;
    var startRow = b.head ? b.top : b.top + 1;
    // vertical branch body
    parts.push('<line x1="' + L + '" y1="' + y(startRow) + '" x2="' + L + '" y2="' + y(b.bottom) + '" stroke="' + c + '" stroke-width="2.5"/>');
    // merge curve into main (above)
    if (!b.head) parts.push('<path d="M' + L + " " + y(startRow) + " C" + L + " " + (y(startRow) - ROW * .6) + " " + x(0) + " " + (y(b.top) + ROW * .4) + " " + x(0) + " " + y(b.top) + '" fill="none" stroke="' + c + '" stroke-width="2.5"/>');
    // fork curve out of main (below)
    var below = b.bottom + 1;
    parts.push('<path d="M' + L + " " + y(b.bottom) + " C" + L + " " + (y(b.bottom) + ROW * .6) + " " + x(0) + " " + (y(below) - ROW * .4) + " " + x(0) + " " + y(below) + '" fill="none" stroke="' + c + '" stroke-width="2.5"/>');
  });
  rows.forEach(function (r, i) {
    var cx = x(r.lane), cy = y(i);
    if (r.kind === "merge") parts.push('<circle class="node" data-n="' + i + '" cx="' + cx + '" cy="' + cy + '" r="6" fill="' + r.color + '" stroke="#fffdf8" stroke-width="2"/>');
    else if (r.kind === "root") parts.push('<rect x="' + (cx - 5) + '" y="' + (cy - 5) + '" width="10" height="10" fill="#888" transform="rotate(45 ' + cx + " " + cy + ')"/>');
    else parts.push('<circle class="node" data-n="' + i + '" cx="' + cx + '" cy="' + cy + '" r="' + (r.kind === "fork" ? 4.5 : 5) + '" fill="#fffdf8" stroke="' + r.color + '" stroke-width="2.5"/>');
  });
  // pulse on HEAD
  branches.filter(function (b) { return b.head; }).forEach(function (b) {
    parts.push('<circle class="node-pulse" cx="' + x(b.lane) + '" cy="' + y(b.top) + '" r="6" fill="' + b.color + '"/>');
  });
  svg.innerHTML = parts.join("");

  // ---------- detail panel ----------
  var detail = document.getElementById("detail");
  var active = -1;
  function select(i, opts) {
    if (i < 0 || i >= rows.length) return;
    active = i;
    var r = rows[i];
    Array.prototype.forEach.call(list.children, function (li, k) { li.classList.toggle("active", k === i); });
    svg.querySelectorAll(".node").forEach(function (n) { n.setAttribute("r", +n.dataset.n === i ? 7.5 : (rows[+n.dataset.n].kind === "fork" ? 4.5 : rows[+n.dataset.n].kind === "merge" ? 6 : 5)); });
    var j = r.job;
    var h = '<header><div class="meta">commit <span class="h">' + r.hash + "a" + hash(r.hash).slice(0, 5) + "</span><br>Author: " + esc(R.name) + " &lt;" + esc(R.email) + "&gt;<br>Date:&nbsp;&nbsp; " + esc(r.date) + "</div>";
    if (!j) {
      h += "<h2>Initial commit</h2><div class='sub'>Where it all started: summer internships at Unitrends and the Clemson NOC.</div></header>";
      h += '<div class="body">' + navBtns(i) + "</div>";
      detail.innerHTML = h; return;
    }
    h += "<h2>" + esc(j.role) + '</h2><div class="sub">' + esc(j.company) + (j.location ? " · " + esc(j.location) : "") + " · " + esc(j.start) + (j.end !== j.start ? " – " + esc(j.end) : "") + "</div></header>";
    h += '<div class="body"><ul>' + j.bullets.map(function (b, k) { return '<li class="' + (r.bulletIndex === k ? "focus" : "") + '">' + esc(b) + "</li>"; }).join("") + "</ul>";
    if (j.highlight) h += '<div class="big"><b>' + esc(j.highlight.to) + "</b><span>" + esc(j.highlight.label) + " (was " + esc(j.highlight.from) + ")</span></div>";
    var added = newSkills[j.id];
    h += '<div class="diff"><div class="fh"><span>skills.json</span><span class="plus">+' + added.length + "</span></div>";
    h += '<div class="ln ctx">@@ ' + esc(j.id) + " @@</div>";
    j.tags.forEach(function (t) {
      var isNew = added.indexOf(t) > -1;
      h += '<div class="ln ' + (isNew ? "add" : "ctx") + '">' + (isNew ? "+ " : "  ") + '"' + esc(t) + '"' + (isNew ? "" : "  // already had it") + "</div>";
    });
    h += "</div>";
    if (j.returning) h += '<a class="cta" href="mailto:' + esc(R.email) + '">Want to open a PR with me? Get in touch →</a>';
    h += navBtns(i) + "</div>";
    detail.innerHTML = h;
    if (opts && opts.scroll && window.innerWidth <= 860) detail.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function navBtns(i) {
    return '<div class="nav-btns"><button data-go="' + (i + 1) + '"' + (i >= rows.length - 1 ? " disabled" : "") + '>← Older</button><button data-go="' + (i - 1) + '"' + (i <= 0 ? " disabled" : "") + ">Newer →</button></div>";
  }
  detail.addEventListener("click", function (e) {
    var b = e.target.closest("[data-go]"); if (b) { select(+b.dataset.go); list.children[active].focus({ preventScroll: true }); list.children[active].scrollIntoView({ block: "nearest" }); }
  });
  list.addEventListener("click", function (e) { var li = e.target.closest(".commit"); if (li) select(+li.dataset.i, { scroll: true }); });
  list.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); select(+e.target.dataset.i, { scroll: true }); } });
  document.addEventListener("keydown", function (e) {
    if (e.altKey || e.ctrlKey || e.metaKey || /input|textarea/i.test(e.target.tagName)) return;
    var d = e.key === "j" || e.key === "ArrowDown" ? 1 : e.key === "k" || e.key === "ArrowUp" ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    var n = active + d;
    while (rows[n] && list.children[n].classList.contains("dim")) n += d;
    if (rows[n]) { select(n); list.children[n].focus({ preventScroll: true }); list.children[n].scrollIntoView({ block: "nearest" }); }
  });

  // ---------- skill filter ----------
  var chips = document.getElementById("chips");
  var cmdline = document.getElementById("cmdline");
  var filter = null;
  var sorted = Object.keys(allSkills).sort(function (a, b) { return allSkills[b] - allSkills[a] || a.localeCompare(b); });
  chips.innerHTML = '<button class="chip" aria-pressed="true" data-s="">all</button>' +
    sorted.map(function (s) { return '<button class="chip" aria-pressed="false" data-s="' + esc(s) + '">' + esc(s) + '<span class="n">' + allSkills[s] + "</span></button>"; }).join("");
  chips.addEventListener("click", function (e) {
    var c = e.target.closest(".chip"); if (!c) return;
    filter = c.dataset.s || null;
    chips.querySelectorAll(".chip").forEach(function (x) { x.setAttribute("aria-pressed", x === c ? "true" : "false"); });
    cmdline.innerHTML = "$ git log --graph --oneline" + (filter ? ' <em>--grep="' + esc(filter) + '"</em>' : "");
    var first = -1;
    rows.forEach(function (r, i) {
      var match = !filter || (r.job && (r.job.tags.indexOf(filter) > -1 || r.job.bullets.some(function (b) { return b.toLowerCase().indexOf(filter.toLowerCase()) > -1; })));
      list.children[i].classList.toggle("dim", !match);
      if (match && first < 0 && r.job) first = i;
    });
    if (filter && first > -1) select(first);
  });

  select(0);
})();

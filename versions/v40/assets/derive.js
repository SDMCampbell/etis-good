/*
 * Derived data shared by the main page (and any future direction).
 * Everything here is computed from window.RESUME; nothing is typed by hand.
 */
(function () {
  var R = window.RESUME;
  var now = new Date();
  var MONTHS = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };

  function parseDate(s, isEnd) {
    if (!s || /present/i.test(s)) return now.getFullYear() + now.getMonth() / 12;
    var y = +(String(s).match(/\d{4}/) || [now.getFullYear()])[0];
    var m = String(s).toLowerCase().match(/[a-z]{3}/);
    var mo = m && m[0] in MONTHS ? MONTHS[m[0]] : (isEnd ? 11 : 0);
    return y + mo / 12;
  }
  function span(j) { return j.start + (j.end && j.end !== j.start ? " – " + j.end : ""); }

  var chrono = R.jobs.slice().reverse();
  var seen = {}, cumulative = 0;
  chrono.forEach(function (j, i) {
    j._i = i;
    j._t0 = parseDate(j.start, false);
    j._t1 = parseDate(j.end, true);
    j._span = span(j);
    j._new = j.tags.filter(function (t) { var k = t.toLowerCase(); if (seen[k]) return false; seen[k] = 1; return true; });
    cumulative += j._new.length;
    j._cum = cumulative;
    j._known = Object.keys(seen);
  });

  var allSkills = {};
  Object.keys(R.skills).forEach(function (g) { R.skills[g].forEach(function (s) { allSkills[s.toLowerCase()] = s; }); });
  R.jobs.forEach(function (j) { j.tags.forEach(function (t) { if (!allSkills[t.toLowerCase()]) allSkills[t.toLowerCase()] = t; }); });

  var firstYear = Math.floor(Math.min.apply(null, chrono.map(function (j) { return j._t0; })));
  var usedAt = {};
  R.jobs.forEach(function (j) { j.tags.forEach(function (t) { (usedAt[t.toLowerCase()] = usedAt[t.toLowerCase()] || []).push(j); }); });

  window.DERIVED = {
    chrono: chrono,
    current: R.jobs[0],
    firstYear: firstYear,
    nowT: now.getFullYear() + now.getMonth() / 12,
    yearsIn: now.getFullYear() - firstYear,
    skillCount: Object.keys(allSkills).length,
    roleCount: R.jobs.length,
    usedAt: function (skill) { return usedAt[String(skill).toLowerCase()] || []; },
    span: span
  };
})();

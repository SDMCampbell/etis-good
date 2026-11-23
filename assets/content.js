// Renders the résumé from window.RESUME into #content as plain, semantic HTML.
(function () {
  var R = window.RESUME, el = document.getElementById("content");
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  var html = "";
  html += '<header class="intro">';
  html += "<h1>" + esc(R.name) + "</h1>";
  html += '<p class="title">' + esc(R.title) + " · " + esc(R.location) + "</p>";
  html += '<p class="links"><a href="mailto:' + esc(R.email) + '">' + esc(R.email) + '</a> · <a href="' + esc(R.github) + '">github</a></p>';
  html += '<p class="summary">' + esc(R.summary) + " " + esc(R.tagline) + "</p>";
  html += "</header>";

  html += '<section><h2>Experience</h2><ol class="jobs">';
  R.jobs.forEach(function (j) {
    html += '<li class="job"><h3>' + esc(j.role) + ' <span class="at">@ ' + esc(j.company) + "</span></h3>";
    html += '<p class="when">' + esc(j.start) + " – " + esc(j.end) + (j.location ? " · " + esc(j.location) : "") + "</p>";
    html += "<ul>" + j.bullets.map(function (b) { return "<li>" + esc(b) + "</li>"; }).join("") + "</ul>";
    if (j.tags && j.tags.length) html += '<p class="tags">' + j.tags.map(esc).join(" · ") + "</p>";
    html += "</li>";
  });
  html += "</ol></section>";

  html += "<section><h2>Skills</h2>";
  Object.keys(R.skills).forEach(function (g) {
    html += '<p class="skills"><span class="group">' + esc(g) + ":</span> " + R.skills[g].map(esc).join(", ") + "</p>";
  });
  html += "</section>";

  html += '<footer><p><a href="mailto:' + esc(R.email) + '">' + esc(R.email) + '</a> · <a href="' + esc(R.github) + '">' + esc(R.github.replace(/^https?:\/\//, "")) + "</a></p></footer>";
  el.innerHTML = html;
})();

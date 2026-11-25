// The site's page menu: a "more" dropdown in the top right of every page. Put <span class="site-menu-slot"
// data-here="..."></span> where it goes; data-here marks the current page (resume, game, music, band, signs, tower).
(function () {
  var PAGES = [["resume", "./", "résumé"], ["game", "fight_game.html", "game"], ["music", "music.html", "music"], ["band", "band.html", "band"], ["signs", "signs.html", "signs"], ["tower", "tower.html", "tower"]];
  document.querySelectorAll(".site-menu-slot").forEach(function (slot) {
    var here = slot.dataset.here, menu = document.createElement("details");
    menu.className = "site-menu";
    menu.innerHTML = '<summary aria-label="More pages">more</summary><ul>' + PAGES.map(function (p) {
      return "<li><a href=\"" + p[1] + "\"" + (p[0] === here ? ' aria-current="page"' : "") + ">" + p[2] + "</a></li>";
    }).join("") + "</ul>";
    slot.replaceWith(menu);
    // close on a click elsewhere, or Esc (which then doesn't also reach the page, e.g. dismissing the swarm)
    document.addEventListener("click", function (e) { if (menu.open && !menu.contains(e.target)) menu.open = false; });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menu.open) { menu.open = false; menu.querySelector("summary").focus(); e.stopImmediatePropagation(); e.preventDefault(); }
    }, true);
  });
})();

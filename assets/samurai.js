// Samurai mode: dresses up swarm-intro's cursors (see the html.samurai rules in site.css) and adds the moments
// the library has no hook for, by watching its DOM:
//  - a cursor that starts a selection box draws its sword, and sheathes it when the box finishes
//  - cursors face the way they're moving
//  - an element that has just been cut appears with a flash and a slight shudder
(function () {
  window.samuraiMode = function () {
    document.documentElement.classList.add("samurai");
    var lastX = new WeakMap();
    function posOf(el) { var m = /translate\(([-\d.]+)px,\s*([-\d.]+)px\)/.exec(el.style.transform || ""); return m ? [+m[1], +m[2]] : null; }
    // where each cursor has recently been sent (the library moves it on before our observer runs)
    var trail = new Map();
    function note(c, tf) { var m = /translate\(([-\d.]+)px,\s*([-\d.]+)px\)/.exec(tf || ""); if (!m) return; var a = trail.get(c) || []; a.push([+m[1], +m[2]]); if (a.length > 4) a.shift(); trail.set(c, a); }
    function cursorAt(x, y) {
      var best = null, bd = 3;
      trail.forEach(function (pts, c) { pts.forEach(function (p) { var d = Math.hypot(p[0] - x, p[1] - y); if (d < bd) { bd = d; best = c; } }); });
      return best;
    }
    var mo = new MutationObserver(function (list) {
      list.forEach(function (m) {
        if (m.type === "attributes" && m.attributeName === "style" && m.target.classList.contains("swarm-intro-cursor")) { note(m.target, m.oldValue); note(m.target, m.target.style.transform); }
      });
      list.forEach(function (m) {
        if (m.type === "childList") {
          m.addedNodes.forEach(function (n) {
            if (n.nodeType !== 1) return;
            if (n.classList.contains("swarm-intro-box")) {
              // the box opens where its cursor is standing: that samurai draws
              var x = parseFloat(n.style.left), y = parseFloat(n.style.top), c = cursorAt(x, y);
              if (c) { c.classList.add("slash"); c.classList.remove("flip"); n._samurai = c; }
            }
            if (n.classList.contains("swarm-intro-cursor")) watchCursor(n);
          });
        } else if (m.type === "attributes") {
          var t = m.target;
          if (m.attributeName === "class" && t.classList.contains("swarm-intro-box") && t.classList.contains("is-done") && t._samurai) {
            t._samurai.classList.remove("slash"); t._samurai = null;          // sword back in its sheath
          }
          if (m.attributeName === "data-swarm-intro-pending" && !t.hasAttribute("data-swarm-intro-pending")) cut(t);
        }
      });
    });
    function watchCursor(c) {
      new MutationObserver(function () {
        var p = posOf(c); if (!p) return;
        var lx = lastX.get(c); lastX.set(c, p[0]);
        if (lx === undefined || c.classList.contains("slash")) return;
        if (p[0] < lx - 4) c.classList.add("flip"); else if (p[0] > lx + 4) c.classList.remove("flip");
      }).observe(c, { attributes: true, attributeFilter: ["style"] });
    }
    function cut(el) {
      if (!el.animate) return;
      el.animate([
        { filter: "brightness(2.6) drop-shadow(0 0 6px #C8F7C5)", transform: "translate(-3px, 1px)", clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)" },
        { filter: "brightness(1)", transform: "translate(1px, 0)" },
        { filter: "none", transform: "none" }
      ], { duration: 320, easing: "cubic-bezier(.2,.9,.3,1)" });
    }
    mo.observe(document.body, { childList: true, subtree: true, attributes: true, attributeOldValue: true, attributeFilter: ["class", "style", "data-swarm-intro-pending"] });
    setTimeout(function () { mo.disconnect(); }, 120000);     // the intro is long over by then
  };
})();

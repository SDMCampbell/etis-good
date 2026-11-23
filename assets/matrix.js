// The scrolling "matrix" background: faint columns of glyphs drifting down behind the page.
// They part around the pointer, run at ~20 fps, pause when the tab is hidden or after 20 s without input,
// and are off entirely for visitors who ask for reduced motion.
(function () {
  var cv = document.getElementById("matrix");
  if (!cv) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) { cv.remove(); return; }
  var GLYPHS = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789<>/=+*#%$&{}[]~^│┼├┤─";
  var RGB = "57,255,122";                      // phosphor green
  var c2 = cv.getContext("2d"), cols = [], CW = 22, last = 0, lastPoke = performance.now(), on = false;
  var dpr = Math.min(2, devicePixelRatio || 1), AW, AH, DL = 0, DR = 0;
  var pointer = { x: -999, y: -999, t: 0 };
  function size() {
    AW = innerWidth; AH = innerHeight; cv.width = AW * dpr; cv.height = AH * dpr; c2.setTransform(dpr, 0, 0, dpr, 0, 0);
    var content = document.getElementById("content"), dr = content ? content.getBoundingClientRect() : { left: 0, right: 0 };
    DL = dr.left + 10; DR = dr.right - 10;
    cols = [];
    for (var i = 0, n = Math.ceil(AW / CW); i < n; i++) cols.push({ y: Math.random() * AH, v: 40 + Math.random() * 90, len: 6 + (Math.random() * 14 | 0), g: [], a: .05 + Math.random() * .07 });
  }
  function glyph() { return GLYPHS[(Math.random() * GLYPHS.length) | 0]; }
  function tick(now) {
    on = false;
    if (document.hidden || now - lastPoke > 20000) { c2.clearRect(0, 0, AW, AH); return; }
    on = true; requestAnimationFrame(tick);
    if (now - last < 50) return;
    var dt = Math.min(.1, (now - last) / 1000); last = now;
    c2.clearRect(0, 0, AW, AH);
    c2.font = "14px 'JetBrains Mono', monospace"; c2.textBaseline = "top";
    var px = now - pointer.t < 3000 ? pointer.x : -999, py = pointer.y;
    for (var i = 0; i < cols.length; i++) {
      var col = cols[i]; col.y += col.v * dt;
      if (col.y - col.len * 18 > AH) { col.y = -Math.random() * 200; col.v = 40 + Math.random() * 90; }
      if (Math.random() < .3) col.g[(Math.random() * col.len) | 0] = glyph();
      var x0 = i * CW + 4;
      for (var k = 0; k < col.len; k++) {
        var y = col.y - k * 18; if (y < -18 || y > AH) continue;
        var x = x0, dx = x - px, dy = y - py, d2 = dx * dx + dy * dy;
        if (d2 < 9000) x += (dx >= 0 ? 1 : -1) * (95 - Math.sqrt(d2)) * .6;     // part around the pointer
        var al = k === 0 ? col.a * 2.2 : col.a * (1 - k / col.len);
        if (x > DL && x < DR) al *= .4;                                         // quieter behind the text
        c2.fillStyle = "rgba(" + RGB + "," + al + ")";
        c2.fillText(col.g[k] || (col.g[k] = glyph()), x, y);
      }
    }
  }
  function wake() { lastPoke = performance.now(); if (!on) { last = 0; requestAnimationFrame(tick); } }
  addEventListener("pointermove", function (e) { if (e.pointerType === "mouse") { pointer.x = e.clientX; pointer.y = e.clientY; pointer.t = performance.now(); } }, { passive: true });
  size(); addEventListener("resize", size);
  ["pointermove", "keydown", "scroll", "touchstart", "wheel"].forEach(function (ev) { addEventListener(ev, wake, { passive: true }); });
  document.addEventListener("visibilitychange", wake);
  wake();
})();

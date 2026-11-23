// The animated background. Each mode has its own scene, all with the same kind of motion: things drifting down
// the screen at different speeds, and fainter behind the text column. (They no longer react to the mouse.)
//   normal  -> the matrix: columns of glyphs falling
//   samurai -> cherry blossom petals falling from a sakura branch in the top corner, tumbling as they drift
//   robot   -> deep space: a twinkling starfield with asteroids tumbling down through it
// Runs at ~20-30 fps, pauses when the tab is hidden or after 20 s without input, and is off for visitors whose
// device asks for reduced motion unless they chose "play it anyway".
(function () {
  var cv = document.getElementById("matrix");
  if (!cv) return;
  if (window.MOTION === false) { cv.remove(); return; }
  var MODE = window.MODE || "normal";
  var c2 = cv.getContext("2d"), last = 0, lastPoke = performance.now(), on = false;
  var dpr = Math.min(2, devicePixelRatio || 1), AW, AH, DL = 0, DR = 0;
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function textColumn() { var el = document.getElementById("content"), r = el ? el.getBoundingClientRect() : { left: 0, right: 0 }; DL = r.left + 10; DR = r.right - 10; }

  // ---------- normal: the matrix ----------
  var glyphScene = (function () {
    var GLYPHS = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789<>/=+*#%$&{}[]~^│┼├┤─", RGB = "57,255,122", CW = 22, cols = [];
    function glyph() { return GLYPHS[(Math.random() * GLYPHS.length) | 0]; }
    return {
      fps: 20,
      size: function () { cols = []; for (var i = 0, n = Math.ceil(AW / CW); i < n; i++) cols.push({ y: Math.random() * AH, v: rnd(40, 130), len: 6 + (Math.random() * 14 | 0), g: [], a: rnd(.05, .12) }); },
      draw: function (dt) {
        c2.font = "14px 'JetBrains Mono', monospace"; c2.textBaseline = "top";
        for (var i = 0; i < cols.length; i++) {
          var col = cols[i]; col.y += col.v * dt;
          if (col.y - col.len * 18 > AH) { col.y = -Math.random() * 200; col.v = rnd(40, 130); }
          if (Math.random() < .3) col.g[(Math.random() * col.len) | 0] = glyph();
          for (var k = 0; k < col.len; k++) {
            var y = col.y - k * 18; if (y < -18 || y > AH) continue;
            var x = i * CW + 4;
            var al = k === 0 ? col.a * 2.2 : col.a * (1 - k / col.len); if (x > DL && x < DR) al *= .4;
            c2.fillStyle = "rgba(" + RGB + "," + al + ")";
            c2.fillText(col.g[k] || (col.g[k] = glyph()), x, y);
          }
        }
      }
    };
  })();

  // ---------- samurai: sakura ----------
  var sakuraScene = (function () {
    var petals = [], branch = null, PINKS = ["255,183,197", "255,204,213", "248,160,182", "255,224,230"];
    function newPetal(top) {
      // most petals start under the branch (top left) and the breeze carries them right and down
      var fromTree = Math.random() < .65;
      return { x: fromTree ? rnd(0, AW * .45) : rnd(0, AW), y: top ? rnd(-AH, AH) : rnd(-60, -10) + (fromTree ? rnd(0, AH * .2) : 0),
        vy: rnd(28, 62), vx: rnd(8, 26), sw: rnd(10, 26), ph: rnd(0, 6.3), fr: rnd(.6, 1.4), rot: rnd(0, 6.3), vr: rnd(-1.6, 1.6),
        s: rnd(4.5, 9), flip: rnd(0, 6.3), col: PINKS[(Math.random() * PINKS.length) | 0], a: rnd(.35, .8) };
    }
    function drawBranch() {
      // drawn once per size: a dark gnarled branch reaching in from the top-left corner, heavy with blossom
      branch = document.createElement("canvas"); branch.width = AW * dpr; branch.height = AH * dpr;
      var b = branch.getContext("2d"); b.scale(dpr, dpr);
      var L = Math.min(AW * .5, 520), seed = 7;
      function r() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
      b.strokeStyle = "#2a1a1e"; b.lineCap = "round";
      var tips = [];
      function limb(x, y, a, len, w, depth) {
        var x2 = x + Math.cos(a) * len, y2 = y + Math.sin(a) * len;
        b.lineWidth = w; b.beginPath(); b.moveTo(x, y); b.quadraticCurveTo(x + Math.cos(a + .3) * len * .5, y + Math.sin(a + .3) * len * .5, x2, y2); b.stroke();
        if (depth <= 0 || len < 14) { tips.push([x2, y2]); return; }
        limb(x2, y2, a + (r() - .3) * .7, len * .72, w * .68, depth - 1);
        if (r() < .8) limb(x2, y2, a + .5 + r() * .7, len * .55, w * .6, depth - 1);
        if (r() < .4) tips.push([x2, y2]);
      }
      limb(-20, AH * .02, .28, L * .38, 14, 5);
      limb(-20, AH * .12, .12, L * .3, 9, 4);
      tips.forEach(function (t) {                     // clusters of five-petal blossoms on every twig
        for (var k = 0; k < 7; k++) {
          var bx = t[0] + (r() - .5) * 34, by = t[1] + (r() - .5) * 26, rr = 2.6 + r() * 2.6;
          b.fillStyle = "rgba(" + PINKS[(r() * 4) | 0] + "," + (.55 + r() * .35) + ")";
          for (var p = 0; p < 5; p++) { var an = p * 1.2566 + r(); b.beginPath(); b.ellipse(bx + Math.cos(an) * rr, by + Math.sin(an) * rr, rr * .8, rr * .55, an, 0, 6.3); b.fill(); }
          b.fillStyle = "rgba(255,240,200,.8)"; b.beginPath(); b.arc(bx, by, rr * .35, 0, 6.3); b.fill();
        }
      });
      // fade the branch softly where it crosses the text, so the résumé stays readable over it
      var fade = b.createLinearGradient(0, 0, AW, 0), f = function (x) { return Math.max(0, Math.min(1, x / AW)); };
      fade.addColorStop(0, "#000"); fade.addColorStop(f(DL - 80), "#000"); fade.addColorStop(f(DL + 60), "rgba(0,0,0,.16)");
      fade.addColorStop(f(DR - 60), "rgba(0,0,0,.16)"); fade.addColorStop(f(DR + 80), "#000"); fade.addColorStop(1, "#000");
      b.globalCompositeOperation = "destination-in"; b.fillStyle = fade; b.fillRect(0, 0, AW, AH); b.globalCompositeOperation = "source-over";
    }
    return {
      fps: 60,
      size: function () { drawBranch(); petals = []; var n = Math.round(AW * AH / 9000); for (var i = 0; i < n; i++) petals.push(newPetal(true)); },
      draw: function (dt, now) {
        // the branch at full strength in the margin, faint where it crosses the text
        c2.globalAlpha = .9; c2.drawImage(branch, 0, 0, AW, AH); c2.globalAlpha = 1;
        var t = now / 1000;
        for (var i = 0; i < petals.length; i++) {
          var p = petals[i];
          p.y += p.vy * dt; p.x += (p.vx + Math.cos(t * p.fr + p.ph) * p.sw) * dt; p.rot += p.vr * dt; p.flip += dt * 2.4;
          if (p.y > AH + 20 || p.x > AW + 30) { petals[i] = newPetal(false); continue; }
          var x = p.x, al = p.a * ((x > DL && x < DR) ? .45 : 1);
          // a petal: a teardrop with a notch at the tip, tumbling (scaleY flips as it turns over)
          c2.save(); c2.translate(x, p.y); c2.rotate(p.rot); c2.scale(1, Math.max(.15, Math.abs(Math.cos(p.flip))));
          c2.fillStyle = "rgba(" + p.col + "," + al + ")";
          var s = p.s; c2.beginPath(); c2.moveTo(0, -s);
          c2.quadraticCurveTo(s * .9, -s * .2, s * .25, s * .8); c2.lineTo(0, s * .55); c2.lineTo(-s * .25, s * .8);
          c2.quadraticCurveTo(-s * .9, -s * .2, 0, -s); c2.fill(); c2.restore();
        }
      }
    };
  })();

  // ---------- robot: deep space ----------
  // The far starfield is painted once and handed to a CSS layer that creeps down (see .starfield in site.css); a few dozen brighter stars twinkle
  // on top. Each asteroid is painted once into its own small image and just rotated and moved each frame.
  var spaceScene = (function () {
    var field, fieldY = 0, twinklers = [], rocks = [];
    function newRock(top) {
      var r = Math.random() < .2 ? rnd(10, 18) : rnd(4, 9), n = 7 + (Math.random() * 5 | 0), shade = (34 + Math.random() * 22) | 0;
      var sz = Math.ceil(r * 2.4), cv2 = document.createElement("canvas"); cv2.width = cv2.height = sz * dpr;
      var g = cv2.getContext("2d"); g.scale(dpr, dpr); g.translate(sz / 2, sz / 2); g.beginPath();
      for (var i = 0; i < n; i++) { var a = i / n * 6.283, rr = r * rnd(.7, 1.1); i ? g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : g.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); }
      g.closePath();
      var gr = g.createLinearGradient(-r, -r, r, r);
      gr.addColorStop(0, "rgb(" + (shade + 50) + "," + (shade + 52) + "," + (shade + 60) + ")"); gr.addColorStop(1, "rgb(" + (shade * .4 | 0) + "," + (shade * .4 | 0) + "," + (shade * .5 | 0) + ")");
      g.fillStyle = gr; g.fill(); g.strokeStyle = "rgba(200,220,255,.08)"; g.lineWidth = 1; g.stroke();
      g.fillStyle = "rgba(0,0,0,.2)"; for (var k = 0; k < (r > 12 ? 3 : 1); k++) { g.beginPath(); g.arc(rnd(-r * .4, r * .4), rnd(-r * .4, r * .4), rnd(r * .12, r * .25), 0, 6.3); g.fill(); }
      return { img: cv2, sz: sz, x: rnd(-40, AW + 40), y: top ? rnd(-AH, AH) : -r - rnd(0, 120), r: r,
        vy: rnd(10, 28) * (8 / r + .6), vx: rnd(-14, 14), rot: rnd(0, 6.3), vr: rnd(-.8, .8) };
    }
    return {
      fps: 60,
      size: function () {
        field = document.createElement("canvas"); field.width = Math.round(AW * dpr); field.height = Math.round(AH * dpr);
        var f = field.getContext("2d"); f.scale(dpr, dpr);
        for (var i = 0, n = Math.round(AW * AH / 2600); i < n; i++) {
          var x = rnd(0, AW), y = rnd(0, AH), a = rnd(.25, .65) * ((x > DL && x < DR) ? .5 : 1);
          f.fillStyle = "rgba(220,235,255," + a + ")"; f.beginPath(); f.arc(x, y, rnd(.3, .9), 0, 6.3); f.fill();
        }
        // hand the painted field to a CSS layer that the compositor scrolls: no per-frame drawing cost at all
        var layer = document.getElementById("starfield");
        if (!layer) { layer = document.createElement("div"); layer.id = "starfield"; layer.className = "starfield"; layer.setAttribute("aria-hidden", "true"); cv.parentNode.insertBefore(layer, cv); }
        layer.style.backgroundImage = "url(" + field.toDataURL() + ")"; layer.style.backgroundSize = AW + "px " + AH + "px";
        twinklers = []; for (var t = 0, m = Math.round(AW * AH / 22000); t < m; t++) twinklers.push({ x: rnd(0, AW), y: rnd(0, AH), r: rnd(.8, 1.6), tw: rnd(0, 6.3), sp: rnd(.6, 2.2), v: rnd(4, 9) });
        rocks = []; for (var j = 0, k = Math.max(7, Math.round(AW * AH / 60000)); j < k; j++) rocks.push(newRock(true));
      },
      draw: function (dt, now) {
        var t = now / 1000;
        for (var i = 0; i < twinklers.length; i++) {
          var s = twinklers[i]; s.y += s.v * dt; if (s.y > AH) { s.y = 0; s.x = rnd(0, AW); }
          var a = .3 + .6 * (.5 + .5 * Math.sin(t * s.sp + s.tw)); if (s.x > DL && s.x < DR) a *= .5;
          c2.fillStyle = "rgba(220,235,255," + a + ")"; c2.fillRect(s.x - s.r / 2, s.y - s.r / 2, s.r, s.r);
        }
        for (var j = 0; j < rocks.length; j++) {
          var r = rocks[j]; r.y += r.vy * dt; r.x += r.vx * dt; r.rot += r.vr * dt;
          if (r.y - r.r > AH || r.x < -80 || r.x > AW + 80) { rocks[j] = newRock(false); continue; }
          c2.save(); c2.translate(r.x, r.y); c2.rotate(r.rot); c2.globalAlpha = (r.x > DL && r.x < DR) ? .18 : .45;   // distant: faint, fainter behind the text
          c2.drawImage(r.img, -r.sz / 2, -r.sz / 2, r.sz, r.sz); c2.restore();
        }
        c2.globalAlpha = 1;
      }
    };
  })();

  var scene = MODE === "samurai" ? sakuraScene : MODE === "robot" ? spaceScene : glyphScene;
  function size() {
    AW = innerWidth; AH = innerHeight; cv.width = AW * dpr; cv.height = AH * dpr; c2.setTransform(dpr, 0, 0, dpr, 0, 0);
    textColumn(); scene.size();
  }
  function tick(now) {
    on = false;
    if (document.hidden || now - lastPoke > 20000) { c2.clearRect(0, 0, AW, AH); return; }
    on = true; requestAnimationFrame(tick);
    if (now - last < 1000 / scene.fps) return;
    var dt = Math.min(.1, (now - last) / 1000); last = now;
    c2.clearRect(0, 0, AW, AH);
    scene.draw(dt, now);
  }
  function wake() { lastPoke = performance.now(); if (!on) { last = 0; requestAnimationFrame(tick); } }
  size(); addEventListener("resize", size);
  ["pointermove", "keydown", "scroll", "touchstart", "wheel"].forEach(function (ev) { addEventListener(ev, wake, { passive: true }); });
  document.addEventListener("visibilitychange", wake);
  wake();
})();

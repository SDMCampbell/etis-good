// Cursor Wars: a small auto-battler. You spawn units; they fight on their own. Destroy the enemy core to win.
// Everything is drawn on one canvas (logical size 960x540); no assets. Numbers are a first pass, easy to tune in T below.
//   battle  : energy regenerates and is spent on spawns; an AI spawns for red; sudden death from 2:30
//   sandbox : no energy, no AI; click the left half to spawn for green, the right half for red
(function () {
  var W = 960, H = 540, cv = document.getElementById("arena"), c = cv.getContext("2d"), dpr = Math.min(2, window.devicePixelRatio || 1);
  cv.width = W * dpr; cv.height = H * dpr;
  var COL = { g: "#39FF7A", r: "#FF5C70" }, NAME = { g: "green", r: "red" }, HI = "#EAFFE7", GOLD = "#FFE27A", FONT = "'JetBrains Mono', ui-monospace, monospace";
  // cost, hp, speed px/s, range px, damage, cooldown s
  var T = {
    cursor:  { cost: 2, hp: 70,  sp: 105, range: 18,  dmg: 8,  cd: .6,  note: "cheap melee; every 3rd hit is a double-click (2x)" },
    samurai: { cost: 4, hp: 120, sp: 62,  range: 120, dmg: 55, cd: 2.2, note: "iaijutsu: crouches, vanishes, cuts through one target; parries lasers and bolts (half damage)" },
    robot:   { cost: 5, hp: 160, sp: 55,  range: 220, dmg: 28, cd: 2.2, note: "laser pierces everything in a line; armour (-3 per hit)" },
    wizard:  { cost: 4, hp: 70,  sp: 60,  range: 260, dmg: 28, cd: 1.8, note: "homing bolt with splash damage; keeps its distance" },
    ninja:   { cost: 3, hp: 45,  sp: 130, range: 150, dmg: 8,  cd: .6,  note: "hunts the longest-range enemy; smoke-teleports behind it for a backstab (+14); backs away while reloading" }
  };
  var ORDER = ["cursor", "samurai", "robot", "wizard", "ninja"];
  // who tends to win at equal energy, from simulated mass fights (see the README); the AI counter-picks from this
  var BEATS = { cursor: ["samurai"], samurai: ["robot", "ninja"], robot: ["cursor", "ninja"], wizard: ["cursor", "robot"], ninja: ["wizard"] };
  var CAP = 20, E_START = 6, E_CAP = 12, CORE_HP = 1000, SUDDEN = 150;
  var S, mode = "battle", selected = "cursor", started = false, breakable = false;

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
  function other(t) { return t === "g" ? "r" : "g"; }
  function count(team, type) { return S.units.filter(function (u) { return u.team === team && (!type || u.type === type); }).length; }
  function core(team, x) { return { core: true, team: team, x: x, y: H / 2, hp: CORE_HP, zap: 0, flash: 0, ghost: 0 }; }
  function reset() {
    S = { units: [], shots: [], fx: [], core: { g: core("g", 40), r: core("r", W - 40) }, en: { g: E_START, r: E_START }, t: 0, over: null, shake: 0, aiT: 2, aiPick: null };
  }

  function spawn(type, team, x, y, free) {
    var d = T[type]; if (S.over || count(team) >= CAP) return false;
    if (!free) { if (S.en[team] < d.cost) return false; S.en[team] -= d.cost; }
    var u = { type: type, team: team, d: d, x: x != null ? x : S.core[team].x + (team === "g" ? 34 : -34), y: clamp(y != null ? y : 70 + Math.random() * (H - 140), 44, H - 16),
      hp: d.hp, cd: Math.random() * .3, target: null, ts: 0, hits: 0, state: "", st: 0, face: team === "g" ? 1 : -1, phase: Math.random() * 6, flash: 0, smoke: 1 + Math.random() * 2, ghost: 0, mv: 0 };
    S.units.push(u); puff(u.x, u.y - 10, COL[team]); return true;
  }

  // ---------- effects ----------
  function num(x, y, txt, col) { S.fx.push({ k: "num", x: x + (Math.random() - .5) * 10, y: y, txt: txt, col: col, t: .6, T: .6 }); }
  function line(x1, y1, x2, y2, col, w, t) { S.fx.push({ k: "line", x1: x1, y1: y1, x2: x2, y2: y2, col: col, w: w, t: t, T: t }); }
  function puff(x, y, col) { for (var i = 0; i < 5; i++) S.fx.push({ k: "p", x: x, y: y, vx: (Math.random() - .5) * 60, vy: (Math.random() - .7) * 60, ch: "*", col: col, t: .4, T: .4, g: 0 }); }
  function burst(u) { var G = "/\\|_01"; for (var i = 0; i < 7; i++) S.fx.push({ k: "p", x: u.x, y: u.y - 10, vx: (Math.random() - .5) * 140, vy: -40 - Math.random() * 120, ch: G[(Math.random() * G.length) | 0], col: COL[u.team], t: .8, T: .8, g: 380 }); }

  function hurt(v, dmg, crit, kind) {
    if (v.hp <= 0) return;
    if (v.core) {
      if (mode === "sandbox" && !breakable) return;
      v.hp -= dmg; v.flash = .08; S.shake = .15; num(v.x, v.y - 34, dmg, crit ? GOLD : COL[other(v.team)]);
      if (v.hp <= 0) { v.hp = 0; S.over = other(v.team); for (var i = 0; i < 5; i++) burst({ x: v.x, y: v.y + 10, team: v.team }); }
      return;
    }
    if (v.ghost > 0) return;
    if (v.type === "robot") dmg = Math.max(1, dmg - 3);                // armour
    if (v.type === "samurai" && (kind === "beam" || kind === "bolt")) dmg = Math.ceil(dmg / 2);   // parried
    v.hp -= dmg; v.flash = .08; num(v.x, v.y - 30, dmg, crit ? GOLD : COL[other(v.team)]);
    if (v.hp <= 0) burst(v);
  }

  // ---------- unit brains ----------
  function pick(u) {
    var foes = S.units.filter(function (v) { return v.team !== u.team && v.hp > 0 && v.ghost <= 0; }), own = S.core[u.team], best = null, bd = 1e9;
    if (dist(u, own) < 200) {                                           // defend the core first
      foes.forEach(function (v) { if (dist(v, own) < 190) { var d = dist(u, v); if (d < bd) { bd = d; best = v; } } });
      if (best) return best;
    }
    if (u.type === "ninja") {                                           // the ninja hunts the longest-range enemy anywhere
      var br = -1;
      foes.forEach(function (v) { var d = dist(u, v); if (v.d.range > br || (v.d.range === br && d < bd)) { br = v.d.range; bd = d; best = v; } });
      if (best) return best;
    }
    foes.forEach(function (v) { var d = dist(u, v); if (d < 400 && d < bd) { bd = d; best = v; } });
    return best || S.core[other(u.team)];
  }
  function segDist(px, py, x1, y1, x2, y2) {
    var dx = x2 - x1, dy = y2 - y1, t = clamp(((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy || 1), 0, 1);
    return Math.hypot(px - x1 - dx * t, py - y1 - dy * t);
  }
  function attack(u, t, d) {
    var col = COL[u.team]; u.cd = u.d.cd;
    if (u.type === "cursor") { u.hits++; var crit = u.hits % 3 === 0; hurt(t, u.d.dmg * (crit ? 2 : 1), crit); u.st = .12; u.state = "poke"; }
    else if (u.type === "samurai") { u.state = "crouch"; u.st = .4; }
    else if (u.type === "robot") {
      var L = Math.max(u.d.range, d + 4), ex = u.x + (t.x - u.x) / d * L, ey = u.y - 14 + (t.y - u.y) / d * L, foe = S.core[other(u.team)];
      S.units.forEach(function (v) { if (v.team !== u.team && segDist(v.x, v.y - 12, u.x, u.y - 14, ex, ey) < 10) hurt(v, u.d.dmg, false, "beam"); });
      if (segDist(foe.x, foe.y, u.x, u.y - 14, ex, ey) < 24) hurt(foe, u.d.dmg);
      line(u.x + u.face * 8, u.y - 16, ex, ey, HI, 3, .14); line(u.x + u.face * 8, u.y - 16, ex, ey, col, 7, .1);
    }
    else if (u.type === "wizard") S.shots.push({ k: "bolt", team: u.team, x: u.x + u.face * 9, y: u.y - 30, target: t, tx: t.x, ty: t.y - 12, sp: 300, dmg: u.d.dmg });
    else { S.shots.push({ k: "star", team: u.team, x: u.x + u.face * 6, y: u.y - 14, target: t, tx: t.x, ty: t.y - 12, sp: 520, dmg: u.d.dmg + (u.stab ? 14 : 0), crit: u.stab, rot: 0 }); u.stab = false; }   // backstab after a smoke
  }
  function iai(u, t) {                                                  // gone, and already past the target
    var dx = t.x - u.x, dy = t.y - u.y, d = Math.hypot(dx, dy) || 1, past = t.core ? d - 34 : d + 22, ox = u.x, oy = u.y;
    u.x = clamp(u.x + dx / d * past, 12, W - 12); u.y = clamp(u.y + dy / d * past, 44, H - 14);
    line(ox, oy - 12, u.x, u.y - 12, HI, 2, .25); line(t.x - dx / d * 26, t.y - 12 - dy / d * 26 - 8, t.x + dx / d * 26, t.y - 12 + dy / d * 26 + 8, "#fff", 3, .3);
    hurt(t, u.d.dmg, true); u.state = "recover"; u.st = .35; u.cd = u.d.cd; u.face = -u.face;
  }
  function stepUnit(u, dt) {
    u.cd -= dt; u.flash -= dt; u.ghost -= dt; u.ts -= dt; u.smoke -= dt; u.st -= dt;
    var t = u.target;
    if (u.ts <= 0 || !t || t.hp <= 0) { u.ts = .25; if (!t || t.core || t.hp <= 0 || t.ghost > 0 || dist(u, t) > 500) t = u.target = pick(u); }
    var dx = t.x - u.x, dy = t.y - u.y, d = Math.hypot(dx, dy) || 1, reach = u.d.range + (t.core ? 24 : 0), mx = 0, my = 0;
    if (u.state === "crouch") { if (t.hp <= 0) u.state = ""; else if (u.st <= 0) iai(u, t); u.mv = 0; return; }
    if (u.state === "recover") { if (u.st <= 0) u.state = ""; u.mv = 0; return; }
    if (u.state === "poke" && u.st <= 0) u.state = "";
    u.face = dx >= 0 ? 1 : -1;
    if (u.type === "ninja" && u.smoke <= 0 && !t.core && d < 320) {     // smoke: reappear behind the target
      puff(u.x, u.y - 10, "#9aa"); u.x = clamp(t.x + dx / d * 60, 12, W - 12); u.y = clamp(t.y + dy / d * 60, 44, H - 14); puff(u.x, u.y - 10, "#9aa");
      u.smoke = 5; u.ghost = .4; u.stab = true; u.face = -u.face; return;
    }
    if (d > reach) { mx = dx / d; my = dy / d; }
    else if (u.cd <= 0) attack(u, t, d);
    else if ((u.type === "wizard" || u.type === "ninja") && !t.core && d < reach * .85) { mx = -dx / d * .5; my = -dy / d * .5; }   // back away (at half speed) while reloading
    S.units.forEach(function (v) {                                      // don't stack on allies
      if (v === u || v.team !== u.team) return;
      var ex = u.x - v.x, ey = u.y - v.y, e = Math.hypot(ex, ey);
      if (e < 16) { if (e > .01) { mx += ex / e * .8; my += ey / e * .8; } else my += Math.random() - .5; }
    });
    var m = Math.hypot(mx, my); u.mv = m > .05 ? 1 : 0; if (m > 1) { mx /= m; my /= m; m = 1; }
    u.x = clamp(u.x + mx * u.d.sp * dt, 12, W - 12); u.y = clamp(u.y + my * u.d.sp * dt, 44, H - 14); u.phase += m * u.d.sp * dt * .16;
  }
  function stepShot(s, dt) {
    var t = s.target; if (t.hp > 0 && t.ghost <= 0) { s.tx = t.x; s.ty = t.y - (t.core ? 0 : 12); }
    var dx = s.tx - s.x, dy = s.ty - s.y, d = Math.hypot(dx, dy), mv = s.sp * dt; if (s.rot != null) s.rot += dt * 30;
    if (d > mv + 6) { s.x += dx / d * mv; s.y += dy / d * mv; return true; }
    if (t.hp > 0 && t.ghost <= 0) hurt(t, s.dmg, s.crit, s.k);
    if (s.k === "bolt") {                                               // splash
      S.units.forEach(function (v) { if (v !== t && v.team !== s.team && Math.hypot(v.x - s.tx, v.y - 12 - s.ty) < 40) hurt(v, s.dmg / 2, false, "bolt"); });
      S.fx.push({ k: "ring", x: s.tx, y: s.ty, col: COL[s.team], t: .25, T: .25 });
    }
    return false;
  }

  // ---------- the red AI: counter-pick most of the time, panic when its core is threatened, never float energy ----------
  function ai(dt) {
    S.aiT -= dt; if (S.aiT > 0) return; S.aiT = 1.5;
    var en = S.en.r, afford = ORDER.filter(function (k) { return T[k].cost <= en; });
    if (!S.aiPick) {
      if (Math.random() < .6) {
        var top = null, n = 0; ORDER.forEach(function (k) { var m = count("g", k); if (m > n) { n = m; top = k; } });
        var counters = top ? ORDER.filter(function (k) { return BEATS[k].indexOf(top) >= 0; }) : ORDER;
        S.aiPick = counters[(Math.random() * counters.length) | 0];
      } else S.aiPick = ORDER[(Math.random() * ORDER.length) | 0];
    }
    var threat = S.units.some(function (u) { return u.team === "g" && dist(u, S.core.r) < 250; });
    if (en >= T[S.aiPick].cost) { if (spawn(S.aiPick, "r")) S.aiPick = null; }
    else if ((threat || en >= 10) && afford.length) spawn(afford[0], "r");
  }

  function step(dt) {
    if (S.over) { stepFx(dt); return; }
    S.t += dt;
    var sudden = mode === "battle" && S.t > SUDDEN;
    if (mode === "battle") {
      ["g", "r"].forEach(function (k) { S.en[k] = Math.min(E_CAP, S.en[k] + dt * (sudden ? 2 : 1)); });
      ai(dt);
      if (sudden) ["g", "r"].forEach(function (k) { var co = S.core[k]; if (S.over) return; co.hp -= 8 * dt; if (co.hp <= 0) { co.hp = 0; S.over = other(k); } });
    }
    S.units.forEach(function (u) { if (u.hp > 0) stepUnit(u, dt); });
    S.shots = S.shots.filter(function (s) { return stepShot(s, dt); });
    ["g", "r"].forEach(function (k) {                                   // each core zaps the nearest enemy that gets close
      var co = S.core[k]; co.zap -= dt; co.flash -= dt; if (co.zap > 0) return;
      var best = null, bd = 160; S.units.forEach(function (u) { if (u.team !== k && u.hp > 0 && u.ghost <= 0) { var d = dist(u, co); if (d < bd) { bd = d; best = u; } } });
      if (best) { co.zap = 1; hurt(best, 10); line(co.x, co.y, best.x, best.y - 12, COL[k], 2, .15); }
    });
    S.units = S.units.filter(function (u) { return u.hp > 0; });
    stepFx(dt);
  }
  function stepFx(dt) {
    S.shake -= dt;
    S.fx = S.fx.filter(function (f) { f.t -= dt; if (f.k === "num") f.y -= 28 * dt; if (f.k === "p") { f.vy += f.g * dt; f.x += f.vx * dt; f.y += f.vy * dt; } return f.t > 0; });
  }

  // ---------- drawing ----------
  function L() { c.beginPath(); for (var i = 0; i < arguments.length; i += 2) i ? c.lineTo(arguments[i], arguments[i + 1]) : c.moveTo(arguments[i], arguments[i + 1]); c.stroke(); }
  function legs(u, hipY, spread) { var s = u.mv ? Math.sin(u.phase) * 5 : 0; L(0, hipY, spread + s, 0); L(0, hipY, -spread - s, 0); }
  function head(x, y, r, fill) { c.beginPath(); c.arc(x, y, r, 0, 6.3); fill ? c.fill() : c.stroke(); }
  function drawUnit(u, now) {
    var col = u.flash > 0 ? "#fff" : COL[u.team];
    c.save(); c.translate(u.x, u.y); c.globalAlpha = u.ghost > 0 ? .25 : 1;
    if (u.hp < u.d.hp) { c.fillStyle = "rgba(255,255,255,.15)"; c.fillRect(-9, -40, 18, 2); c.fillStyle = COL[u.team]; c.fillRect(-9, -40, 18 * u.hp / u.d.hp, 2); }
    c.scale(u.face, 1); c.strokeStyle = c.fillStyle = col; c.lineWidth = 2; c.lineCap = c.lineJoin = "round";
    if (u.type === "cursor") {
      var bob = u.mv ? Math.sin(u.phase) * 1.5 : 0, p = u.state === "poke" ? 5 : 0;
      c.translate(p, -12 + bob); c.rotate(.9); c.beginPath(); c.moveTo(0, -11); c.lineTo(8, 6); c.lineTo(1.5, 3.5); c.lineTo(-2, 10); c.lineTo(-5, 8.5); c.lineTo(-1.8, 2.2); c.lineTo(-8, 1.5); c.closePath(); c.fill();
    } else if (u.type === "samurai") {
      var cr = u.state === "crouch" ? 5 : u.state === "recover" ? 3 : 0, ln = cr ? 5 : 1, hy = -11 + cr;
      if (cr) { L(0, hy, 8, 0); L(0, hy, -9, 0); } else legs(u, hy, 4);
      L(0, hy, ln, hy - 11); head(ln + .5, hy - 15, 3.4); L(ln - 2, hy - 18, ln - 6, hy - 21);          // torso, head, topknot
      c.globalAlpha *= .8; L(3, hy - 1, -12, hy + 4); c.globalAlpha /= .8;                               // scabbard
      if (u.state === "recover") { L(ln, hy - 9, 8, hy - 6); c.strokeStyle = "#fff"; L(8, hy - 6, 22, hy - 12); }
      else { L(ln, hy - 9, 6, hy - 3); if (cr) { c.strokeStyle = "#fff"; L(4, hy - 1.2, 8, hy - 2.4); } }
    } else if (u.type === "robot") {
      var hv = -4 + Math.sin(now / 200 + u.phase) * 1.2; c.translate(0, hv);
      c.globalAlpha *= .9; c.fillStyle = HI; var fl = 5 + Math.random() * 5; c.beginPath(); c.moveTo(-5, 0); c.lineTo(-3, fl); c.lineTo(-1, 0); c.moveTo(1, 0); c.lineTo(3, fl); c.lineTo(5, 0); c.fill(); c.fillStyle = col;
      L(-2, -10, -3, 0); L(2, -10, 3, 0); c.fillRect(-4.5, -21, 9, 11); c.fillRect(-3.5, -28, 7, 6);     // legs, chest, helmet
      c.fillStyle = "#050806"; c.fillRect(0, -26, 3.5, 1.4); L(-6.5, -20, -6.5, -13); L(3, -19, 10, -16);  // visor, pack, arm
    } else if (u.type === "wizard") {
      var fb = -5 + Math.sin(now / 420 + u.phase) * 2; c.translate(0, fb);
      c.globalAlpha *= .45; c.beginPath(); c.moveTo(-2.5, -20); c.lineTo(2.5, -20); c.lineTo(7, 0); c.lineTo(3, -2); c.lineTo(0, 0); c.lineTo(-3, -2); c.lineTo(-7, 0); c.closePath(); c.fill(); c.globalAlpha /= .45;
      c.beginPath(); c.moveTo(-2.5, -20); c.lineTo(-7, 0); c.moveTo(2.5, -20); c.lineTo(7, 0); c.stroke();
      head(0, -24, 3); c.beginPath(); c.moveTo(-6, -26.5); c.lineTo(6, -26.5); c.lineTo(-1, -38); c.closePath(); c.fill();   // head, hat
      L(1, -18, 8, -15); c.strokeStyle = "#C9AD86"; L(9, -4, 9, -27); c.fillStyle = "#FFF6DE"; head(9, -29, 2.4 + Math.sin(now / 150) * .5, true);
    } else {
      c.scale(.78, .78); var hy2 = -10; legs(u, hy2, 4.5); L(0, hy2, 4, hy2 - 10); c.fillStyle = col; head(5, hy2 - 13.5, 3.4, true);
      c.strokeStyle = HI; var w = Math.sin(now / 90 + u.phase) * 2; L(2, hy2 - 15, -6, hy2 - 16 + w); L(2, hy2 - 15, -5, hy2 - 12 - w); c.strokeStyle = col;   // headband tails
      L(1, hy2 + 1, -6, hy2 - 13); L(4, hy2 - 8, 9, hy2 - 5); c.strokeStyle = "#FFF1BE"; c.lineWidth = 1.2; L(5.5, hy2 - 14, 8, hy2 - 14);     // back sword, arm, eye
    }
    c.restore();
  }
  function drawCore(co) {
    var col = co.flash > 0 ? "#fff" : COL[co.team], n = Math.ceil(co.hp / CORE_HP * 10);
    c.strokeStyle = col; c.fillStyle = col; c.lineWidth = 2; c.globalAlpha = .08; c.beginPath(); c.arc(co.x, co.y, 160, 0, 6.3); c.fill(); c.globalAlpha = 1;
    c.strokeRect(co.x - 16, co.y - 22, 32, 44); c.globalAlpha = .25 + .15 * Math.sin(S.t * 3); c.fillRect(co.x - 10, co.y - 16, 20, 32); c.globalAlpha = 1;
    c.font = "11px " + FONT; c.textAlign = co.team === "g" ? "left" : "right";
    n = clamp(n, 0, 10); c.fillText("[" + "#".repeat(n) + "-".repeat(10 - n) + "] " + Math.ceil(co.hp), co.team === "g" ? 8 : W - 8, co.y - 34);
  }
  function draw(now) {
    c.setTransform(dpr, 0, 0, dpr, 0, 0); c.fillStyle = "#050806"; c.fillRect(0, 0, W, H);
    if (S.shake > 0) c.translate((Math.random() - .5) * 8, (Math.random() - .5) * 8);
    c.strokeStyle = "rgba(57,255,122,.05)"; c.lineWidth = 1; c.beginPath();
    for (var x = 0; x <= W; x += 40) { c.moveTo(x, 0); c.lineTo(x, H); } for (var y = 0; y <= H; y += 40) { c.moveTo(0, y); c.lineTo(W, y); } c.stroke();
    c.strokeStyle = "rgba(57,255,122,.18)"; c.setLineDash([4, 8]); c.beginPath(); c.moveTo(W / 2, 0); c.lineTo(W / 2, H); c.stroke(); c.setLineDash([]);
    drawCore(S.core.g); drawCore(S.core.r);
    S.units.slice().sort(function (a, b) { return a.y - b.y; }).forEach(function (u) { drawUnit(u, now); });
    S.shots.forEach(function (s) {
      c.save(); c.translate(s.x, s.y); c.fillStyle = s.k === "bolt" ? "#FFF6DE" : HI; c.shadowColor = COL[s.team]; c.shadowBlur = 8;
      if (s.k === "bolt") { c.beginPath(); c.arc(0, 0, 3.5, 0, 6.3); c.fill(); }
      else { c.rotate(s.rot); c.beginPath(); for (var i = 0; i < 8; i++) { var r = i % 2 ? 1.6 : 5, a = i * Math.PI / 4; i ? c.lineTo(Math.cos(a) * r, Math.sin(a) * r) : c.moveTo(r, 0); } c.fill(); }
      c.restore();
    });
    c.textAlign = "center";
    S.fx.forEach(function (f) {
      c.globalAlpha = Math.max(0, f.t / f.T);
      if (f.k === "num") { c.font = "bold 11px " + FONT; c.fillStyle = f.col; c.fillText(f.txt, f.x, f.y); }
      else if (f.k === "p") { c.font = "11px " + FONT; c.fillStyle = f.col; c.fillText(f.ch, f.x, f.y); }
      else if (f.k === "line") { c.strokeStyle = f.col; c.lineWidth = f.w; c.lineCap = "round"; c.beginPath(); c.moveTo(f.x1, f.y1); c.lineTo(f.x2, f.y2); c.stroke(); }
      else if (f.k === "ring") { c.strokeStyle = f.col; c.lineWidth = 2; c.beginPath(); c.arc(f.x, f.y, 40 * (1 - f.t / f.T * .6), 0, 6.3); c.stroke(); }
    });
    c.globalAlpha = 1;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    var sudden = mode === "battle" && S.t > SUDDEN && !S.over;
    if (sudden) { c.font = "bold 12px " + FONT; c.fillStyle = GOLD; c.fillText("SUDDEN DEATH", W / 2, 20); }
    if (mode === "sandbox" && started && !S.over) { c.font = "11px " + FONT; c.fillStyle = "rgba(200,247,197,.35)"; c.fillText("click here: green", W / 4, H - 12); c.fillText("click here: red", W * 3 / 4, H - 12); }
    if (!started || S.over) {
      c.fillStyle = "rgba(5,8,6,.72)"; c.fillRect(0, 0, W, H);
      c.fillStyle = S.over ? COL[S.over] : COL.g; c.font = "bold 44px " + FONT;
      c.fillText(S.over ? (mode === "battle" ? (S.over === "g" ? "YOU WIN" : "YOU LOSE") : NAME[S.over].toUpperCase() + " WINS") : "CURSOR WARS", W / 2, H / 2 - 10);
      c.font = "14px " + FONT; c.fillStyle = HI; c.fillText(S.over ? "click or press R to play again" : "spawn units; they fight on their own. click to start", W / 2, H / 2 + 26);
    }
  }

  // ---------- page controls ----------
  var $ = function (id) { return document.getElementById(id); }, hud = $("hud"), lastHud = "";
  function fmt(t) { t = Math.floor(t); return Math.floor(t / 60) + ":" + ("0" + t % 60).slice(-2); }
  function updateHud() {
    var e = Math.floor(S.en.g), txt = mode === "battle"
      ? "energy [" + "#".repeat(e) + "-".repeat(E_CAP - e) + "] " + e + "/" + E_CAP + "   time " + fmt(S.t) + "   units " + count("g") + " vs " + count("r")
      : "sandbox: free spawns, no AI   units " + count("g") + " vs " + count("r") + " (max " + CAP + " a side)";
    if (txt !== lastHud) { hud.textContent = lastHud = txt; }
    document.querySelectorAll("[data-unit]").forEach(function (b) {
      b.setAttribute("aria-pressed", b.dataset.unit === selected);
      b.classList.toggle("poor", mode === "battle" && S.en.g < T[b.dataset.unit].cost);
    });
  }
  function start() { started = true; }
  function restart() { reset(); started = true; }
  function choose(type) { selected = type; if (!started) start(); if (S.over) return; if (mode === "battle") spawn(type, "g"); }
  var bar = $("units");
  ORDER.forEach(function (k, i) {
    var b = document.createElement("button"); b.type = "button"; b.dataset.unit = k;
    b.innerHTML = "<kbd>" + (i + 1) + "</kbd> " + k + " <span>" + T[k].cost + "</span>"; b.onclick = function () { choose(k); }; bar.appendChild(b);
    var row = document.createElement("tr");
    row.innerHTML = "<th>" + k + "</th><td>" + T[k].cost + "</td><td>" + T[k].hp + "</td><td>" + T[k].note + "</td><td>" + BEATS[k].join(", ") + "</td>";
    $("legend").appendChild(row);
  });
  document.querySelectorAll("[data-game-mode]").forEach(function (b) {
    b.onclick = function () {
      mode = b.dataset.gameMode; document.querySelectorAll("[data-game-mode]").forEach(function (o) { o.setAttribute("aria-pressed", o === b); });
      $("breakWrap").hidden = mode !== "sandbox"; reset();
    };
  });
  $("breakable").onchange = function () { breakable = this.checked; };
  $("restart").onclick = restart;
  addEventListener("keydown", function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var i = "12345".indexOf(e.key);
    if (i >= 0) choose(ORDER[i]); else if (e.key === "r" || e.key === "R") restart();
  });
  cv.addEventListener("click", function (e) {
    if (S.over) return restart();
    if (!started) return start();
    var r = cv.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * W, y = (e.clientY - r.top) / r.height * H;
    if (mode === "sandbox") spawn(selected, x < W / 2 ? "g" : "r", clamp(x, 70, W - 70), y, true);
    else spawn(selected, "g", null, y);
  });

  var last = 0;
  function frame(now) {
    var dt = Math.min(.05, (now - last) / 1000 || 0); last = now;
    if (started && !document.hidden) step(dt);
    draw(now); updateHud(); requestAnimationFrame(frame);
  }
  reset(); requestAnimationFrame(frame);
  window.__game = { state: function () { return S; }, sim: function (sec) { started = true; for (var i = 0; i < sec * 30 && !S.over; i++) step(1 / 30); return S.over; }, reset: reset, setMode: function (m) { mode = m; breakable = true; reset(); }, spawn: function (t, team) { return spawn(t, team, null, null, mode === "sandbox"); }, T: T };   // for tests and tinkering
})();

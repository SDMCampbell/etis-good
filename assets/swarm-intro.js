/*! swarm-intro (https://github.com/swarnadeep31/swarm-intro), compiled from src/index.ts to a browser script.
   Local patch (marked "etis-good patch" below), adding two options:
     idle(agent, now) -> {x, y, ms, wait} | null : where an idle cursor should go instead of wandering at random
     persist: true                                : keep the swarm on screen (idling) after the page is built
   a state on every cursor, as agent.state and data-state on its element: "intro" (swarming the logo at the start),
   "moving" (on its way to a job), "building", "unbuilding", or "idle" (or whatever more specific state the idle hook gives),
   fight: true, which splits the swarm into two teams (data-team on each cursor): "defend" (half, plus the odd one)
   builds the page and keeps it up; "attack" never builds, but tears visible elements down (the build in reverse).
   Defenders rush any attacker that's mid-teardown: catching it cancels the attack, restores the element and knocks
   the attacker back, stunned. Otherwise defenders rebuild what was torn down. Extra states: "attacking" (on its way to
   tear something down), "defending" (chasing an attacker) and "stunned",
   buildPause / revealPause (ms): a pause after the box opens, before the drag, and after the drag, before the element
   appears; the cursor's data-step says which part of a build it's in ("aim", "drag", "reveal"), for a mode to animate,
   war: true, for the Swarm Wars game page: no swarm at the start; units are added with add({x, y, team, kind, hp})
   (data-kind and data-side on the cursor and its boxes). Each one fights for the targets on its own: it rushes any
   enemy on its way to tear down one of its team's targets (catching it knocks it back and costs it a life; at 0 it's
   deleted, and onDeath(agent, x, y) is called), tears down the enemy's targets, and builds empty ones for its team
   (data-owner on the target). buildPause / revealPause may also be functions of the agent. For the end of a round:
   pause(true|false) stops units starting anything new, wipe(team) deletes a team's units one after another,
   data-armor on a target: how many more teardowns it takes before it falls (each one costs a point);
   sealed(el) (an option) says a target can't be taken at all right now, e.g. a keep while its towers stand;
   form(points, team) flies a team into formation at those page points (topping it up with extra cursors in the
   team's colour, so a few survivors can still spell a word), and clear() removes every unit quietly,
   puppet: true, for the music page: units (added with add()) do nothing on their own. order(agent, el) sends a free
   one to build that target (or, with "unbuild", take it apart); act(agent, fn) gives it any job; remove(agent) deletes one; otherwise the idle hook places it,
   and type: false (never type text in; just fade it in) or "all" (type every text element in, however long), and returning rework(el) from swarmIntro(): one cursor takes a built element apart (the build in reverse, from
   its bottom-right corner back to the top-left), then after a short pause another cursor builds it again.
MIT License

Copyright (c) 2026 Swarnadeep Roy

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
(function () {
/*
  swarm-intro — the page starts blank, a swarm of multiplayer-style cursors
  gathers in the middle, then they rebuild every element: dragging out a
  selection box with a live size badge, then typing the text in (or fading
  the element in). Elements below the fold are built as they scroll into
  view. Esc or the "Skip" button reveals everything at once.

  Framework-agnostic: call swarmIntro() once the page's content is in the
  DOM. For a flicker-free start, inline `preloadScript` in <head>.
*/
const DEFAULT_TARGETS = "h1,h2,h3,h4,h5,h6,p,span,a,button,img,svg,video,canvas,li,label,input,textarea,select";
const TYPEABLE = new Set(["H1", "H2", "H3", "H4", "H5", "H6", "P", "SPAN", "LI", "LABEL", "A", "BUTTON"]);
const PENDING = "data-swarm-intro-pending";
const STYLE_ID = "swarm-intro-styles";
/**
 * Inline this in <head> (before the page paints) to keep the page blank until
 * swarmIntro() takes over. Unhides itself after 4s if the script never runs.
 */
const preloadScript = `(function(){try{if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;var d=document.documentElement;d.setAttribute("data-swarm-intro","");var s=document.createElement("style");s.id="swarm-intro-preload";s.textContent="html[data-swarm-intro] body>*{opacity:0;animation:swarm-intro-failsafe 0s 4s forwards}@keyframes swarm-intro-failsafe{to{opacity:1}}";document.head.appendChild(s);}catch(e){}})();`;
const CSS = `
[${PENDING}]{opacity:0!important}
.swarm-intro-rest{color:transparent!important}
.swarm-intro-caret{display:inline-block;width:2px;height:.9em;margin-right:-2px;vertical-align:-.1em;animation:swarm-intro-blink .9s steps(1) infinite}
@keyframes swarm-intro-blink{50%{opacity:0}}
.swarm-intro-layer{position:fixed;inset:0;z-index:2147483000;overflow:hidden;pointer-events:none;transition:opacity .5s}
.swarm-intro-layer.is-leaving{opacity:0}
.swarm-intro-world{position:absolute;inset:0}
.swarm-intro-cursor{position:absolute;top:0;left:0;margin:-2px 0 0 -2px;filter:drop-shadow(0 1px 2px rgb(0 0 0/.35));will-change:transform}
.swarm-intro-box{position:absolute;border:1px solid var(--swarm-intro-fg);border-radius:2px;transition:opacity .35s}
.swarm-intro-box.is-done,.swarm-intro-logo.is-done{opacity:0}
.swarm-intro-badge{position:absolute;top:100%;left:50%;margin-top:6px;transform:translateX(-50%);padding:1px 6px;border-radius:3px;background:var(--swarm-intro-fg);color:var(--swarm-intro-bg);font:500 10px/16px ui-monospace,SFMono-Regular,Menlo,monospace;white-space:nowrap}
.swarm-intro-logo{position:absolute;display:flex;width:48px;height:48px;margin:-24px 0 0 -24px;align-items:center;justify-content:center;border-radius:9999px;background:color-mix(in srgb,var(--swarm-intro-fg) 25%,transparent);color:var(--swarm-intro-fg);font:600 14px ui-monospace,SFMono-Regular,Menlo,monospace;transition:opacity .35s}
.swarm-intro-skip{position:fixed;right:16px;bottom:16px;padding:6px 12px;border:1px solid color-mix(in srgb,var(--swarm-intro-fg) 20%,transparent);border-radius:9999px;background:color-mix(in srgb,var(--swarm-intro-bg) 80%,transparent);backdrop-filter:blur(8px);color:var(--swarm-intro-fg);opacity:.7;font:500 11px ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.08em;text-transform:uppercase;white-space:pre;pointer-events:auto;cursor:pointer}
.swarm-intro-skip:hover{opacity:1}
.swarm-intro-clash{position:absolute;width:26px;height:26px;margin:-13px 0 0 -13px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,#fff 0 18%,var(--swarm-intro-fg) 22%,transparent 62%);animation:swarm-intro-clash .42s ease-out forwards}
@keyframes swarm-intro-clash{from{transform:scale(.3);opacity:1}to{transform:scale(2.2);opacity:0}}
`;
const CURSOR_SVG = `<svg width="18" height="20" viewBox="0 0 18 20" fill="none" aria-hidden="true"><path d="M1.5 1.5 L16 9.2 L9.4 10.9 L6.2 17.6 Z" fill="var(--swarm-intro-fg)" stroke="var(--swarm-intro-bg)" stroke-width="1.2" stroke-linejoin="round"/></svg>`;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const isTransparent = (c) => c === "transparent" || /,\s*0\)$/.test(c);
function pageColors() {
    var _a;
    const body = getComputedStyle(document.body);
    const html = getComputedStyle(document.documentElement);
    const bg = (_a = [body.backgroundColor, html.backgroundColor].find((c) => !isTransparent(c))) !== null && _a !== void 0 ? _a : "#ffffff";
    return { fg: body.color || "#000000", bg };
}
function injectStyles() {
    if (document.getElementById(STYLE_ID))
        return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = CSS;
    document.head.appendChild(style);
}
/** Starts the intro. Call it once the page's content is in the DOM. */
function swarmIntro(options = {}) {
    var _a;
    var _b, _c, _d, _e, _f, _g, _h, _j;
    const html = document.documentElement;
    const unhidePage = () => {
        var _a;
        html.removeAttribute("data-swarm-intro");
        (_a = document.getElementById("swarm-intro-preload")) === null || _a === void 0 ? void 0 : _a.remove();
    };
    let resolveDone;
    const done = new Promise((r) => (resolveDone = r));
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (((_b = options.respectReducedMotion) !== null && _b !== void 0 ? _b : true) && reduced) {
        unhidePage();
        (_a = options.onComplete) === null || _a === void 0 ? void 0 : _a.call(options);
        resolveDone();
        return { skip() { }, destroy() { }, done };
    }
    injectStyles();
    const narrow = window.innerWidth < 768;
    const pace = 1 / clamp((_c = options.speed) !== null && _c !== void 0 ? _c : 1, 0.25, 4);
    const maxCursors = (_d = options.maxCursors) !== null && _d !== void 0 ? _d : (narrow ? 14 : 24);
    const colors = pageColors();
    const fg = (_e = options.color) !== null && _e !== void 0 ? _e : colors.fg;
    const bg = (_f = options.background) !== null && _f !== void 0 ? _f : colors.bg;
    let stopped = false;
    /* ---------------- collect targets ---------------- */
    const root = typeof options.root === "string"
        ? document.querySelector(options.root)
        : ((_g = options.root) !== null && _g !== void 0 ? _g : document.body);
    const candidates = root
        ? Array.from(root.querySelectorAll((_h = options.targets) !== null && _h !== void 0 ? _h : DEFAULT_TARGETS))
        : [];
    const visible = candidates.filter((el) => {
        if (el.closest(".swarm-intro-layer"))
            return false;
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
    });
    // Keep only the outermost target so nested ones are not built twice
    const targets = visible.filter((el) => !visible.some((other) => other !== el && other.contains(el)));
    targets.forEach((el) => el.setAttribute(PENDING, ""));
    let pending = targets.length;
    unhidePage();
    /* ---------------- overlay layer ---------------- */
    const layer = document.createElement("div");
    layer.className = "swarm-intro-layer";
    layer.setAttribute("aria-hidden", "true");
    layer.style.setProperty("--swarm-intro-fg", fg);
    layer.style.setProperty("--swarm-intro-bg", bg);
    const world = document.createElement("div");
    world.className = "swarm-intro-world";
    layer.appendChild(world);
    document.body.appendChild(layer);
    const syncScroll = () => (world.style.transform = `translate(${-window.scrollX}px, ${-window.scrollY}px)`);
    syncScroll();
    window.addEventListener("scroll", syncScroll, { passive: true });
    const skipLabel = (_j = options.skipButton) !== null && _j !== void 0 ? _j : true;
    if (skipLabel) {
        var skipBtn;  // etis-good patch: kept so it can be hidden once the page is built
        const btn = skipBtn = document.createElement("button");
        btn.type = "button";
        btn.className = "swarm-intro-skip";
        btn.textContent = typeof skipLabel === "string" ? skipLabel : "Skip intro  Esc";
        btn.addEventListener("click", () => skip());
        layer.appendChild(btn);
    }
    /* ---------------- agents ---------------- */
    const agents = [];
    const spawn = (x, y) => {
        const el = document.createElement("div");
        el.className = "swarm-intro-cursor";
        el.innerHTML = CURSOR_SVG;
        el.style.transform = `translate(${x}px, ${y}px)`;
        world.appendChild(el);
        const agent = { el, x, y, idleUntil: 0 };
        setState(agent, "intro");
        // etis-good patch: in a fight, attackers are half the swarm rounded down, so the defence gets the odd one
        if (options.fight) {
            const attackers = agents.filter((b) => b.team === "attack").length;
            agent.team = attackers < Math.floor((agents.length + 1) / 2) ? "attack" : "defend";
            el.dataset.team = agent.team;
        }
        agents.push(agent);
        return agent;
    };
    // etis-good patch: which part of a build a cursor is in, as data-step
    function step(a, s) {
        if (s)
            a.el.dataset.step = s;
        else
            delete a.el.dataset.step;
    }
    // etis-good patch: what each cursor is doing right now, readable from the page as data-state
    function setState(a, st) {
        if (a.state === st)
            return;
        a.state = st;
        a.el.dataset.state = st;
    }
    // Speeds up when a fast scroll leaves a long backlog
    const queue = [];
    const boost = () => options.war ? 1 : clamp(1 + queue.length / 12, 1, 3);   // etis-good patch: no rush in a war
    const moveTo = (a, x, y, ms) => {
        const dist = Math.hypot(x - a.x, y - a.y);
        const d = ms !== null && ms !== void 0 ? ms : (clamp(dist * 0.95, 240, 840) * pace) / boost() / (a.speed || 1);   // etis-good patch: per-unit speed
        a.x = x;
        a.y = y;
        a.el.style.transition = `transform ${d}ms cubic-bezier(.45,.05,.25,1)`;
        a.el.style.transform = `translate(${x}px, ${y}px)`;
        return wait(d);
    };
    /* ---------------- reveal helpers ---------------- */
    const docRect = (el) => {
        const r = el.getBoundingClientRect();
        return { x: r.left + window.scrollX, y: r.top + window.scrollY, w: r.width, h: r.height };
    };
    const markDone = (el) => {
        if (!el.hasAttribute(PENDING))
            return;
        el.removeAttribute(PENDING);
        pending--;
    };
    const fadeIn = (el) => {
        markDone(el);
        el.animate([
            { opacity: 0, filter: "blur(6px)" },
            { opacity: 1, filter: "blur(0)" },
        ], { duration: 420, easing: "cubic-bezier(.22,1,.36,1)" });
    };
    const canType = (el) => {
        var _a;
        if (!TYPEABLE.has(el.tagName))
            return false;
        const len = ((_a = el.textContent) !== null && _a !== void 0 ? _a : "").trim().length;
        if (len === 0)
            return false;
        // etis-good patch: type: "all" types every text element, however long or however many lines
        if (options.type === "all")
            return !isTransparent(getComputedStyle(el).color);
        if (len > 400)
            return false;
        // etis-good patch: `type: false` turns typing off, and text that wraps onto more than one line is faded in
        // instead: typing it sends the cursor zigzagging back and forth through the middle of the block, chasing the caret
        if (options.type === false)
            return false;
        const cs = getComputedStyle(el), lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.25;
        if (el.getBoundingClientRect().height > lh * 1.6)
            return false;
        // Gradient (background-clip) text would show through the hidden part
        return !isTransparent(getComputedStyle(el).color);
    };
    /* Types the element's text in place. Untyped characters stay laid out
       but transparent, so nothing around it shifts while it types. */
    const typeIn = async (a, el) => {
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        const nodes = [];
        for (let n = walker.nextNode(); n; n = walker.nextNode()) {
            const node = n;
            if (!node.data.trim())
                continue;
            const rest = document.createElement("span");
            rest.className = "swarm-intro-rest";
            rest.textContent = node.data;
            nodes.push({ node, full: node.data, rest });
        }
        nodes.forEach(({ node, rest }) => {
            node.after(rest);
            node.data = "";
        });
        const caret = document.createElement("span");
        caret.className = "swarm-intro-caret";
        caret.style.background = fg;
        markDone(el);
        const total = nodes.reduce((s, n) => s + n.full.length, 0);
        const step = Math.max(1, Math.ceil(total / ((1100 * pace) / 16)));
        let tick = 0;
        for (const { node, full, rest } of nodes) {
            rest.before(caret);
            for (let i = 0; i < full.length && !stopped; i += step) {
                node.data = full.slice(0, i + step);
                rest.textContent = full.slice(i + step);
                if (tick++ % 4 === 0) {
                    const c = caret.getBoundingClientRect();
                    moveTo(a, c.right + window.scrollX + 2, c.top + window.scrollY + c.height * 0.35, 90);
                }
                await wait(16 / boost());
            }
            node.data = full;
            rest.remove();
        }
        caret.remove();
    };
    /* Drag out a selection box over the element, then build it */
    const build = async (a, el) => {
        const r = docRect(el);
        setState(a, "moving");
        await moveTo(a, r.x, r.y);
        if (stopped)
            return;
        setState(a, "building");
        const box = document.createElement("div");
        box.className = "swarm-intro-box";
        box._cursor = a.el;  // etis-good patch: lets a mode see which cursor opened the box
        box.style.cssText = `left:${r.x}px;top:${r.y}px`;
        box.dataset.w = r.w;  // ...and how big it will be
        box.dataset.h = r.h;
        tagBox(a, box);
        const badge = document.createElement("span");
        badge.className = "swarm-intro-badge";
        box.appendChild(badge);
        world.appendChild(box);
        const bp = typeof options.buildPause === "function" ? options.buildPause(a) : options.buildPause;
        if (bp) {
            step(a, "aim");
            await wait(bp);
        }
        step(a, "drag");
        const dragMs = (clamp(Math.hypot(r.w, r.h) * 1.05, 260, 720) * pace) / boost() / (a.speed || 1);
        const start = performance.now();
        const grow = () => {
            const t = clamp((performance.now() - start) / dragMs, 0, 1);
            const e = 1 - Math.pow(1 - t, 3);
            box.style.width = `${r.w * e}px`;
            box.style.height = `${r.h * e}px`;
            badge.textContent = `${Math.round(r.w * e)} × ${Math.round(r.h * e)}`;
            if (t < 1 && !stopped)
                requestAnimationFrame(grow);
        };
        requestAnimationFrame(grow);
        await moveTo(a, r.x + r.w, r.y + r.h, dragMs);
        const rp = typeof options.revealPause === "function" ? options.revealPause(a) : options.revealPause;
        if (rp && !stopped) {
            step(a, "reveal");
            await wait(rp);
        }
        step(a, "");
        if (stopped)
            return void box.remove();
        el._by = a.el;  // etis-good patch: who built it, so only that unit's mode celebrates
        if (canType(el))
            await typeIn(a, el);
        else {
            fadeIn(el);
            await wait((320 * pace) / boost());
        }
        box.classList.add("is-done");
        setTimeout(() => box.remove(), 400);
    };
    /* etis-good patch: the build in reverse. The cursor goes to the element's bottom-right corner, a full-size
       selection box appears there, and the cursor drags it back to the top-left while the element goes with it:
       text is deleted from the end (still laid out, so nothing shifts), anything else is clipped to the box. */
    const cursorPos = (a) => {
        const m = /matrix\(([^)]+)\)/.exec(getComputedStyle(a.el).transform);
        if (!m) return [a.x, a.y];
        const v = m[1].split(",");
        return [+v[4], +v[5]];
    };
    const unbuild = async (a, el, label) => {
        const r = docRect(el);
        // etis-good patch (fight): a defender can call el._abort to stop the teardown part-way
        let abortedBy = null, abortNow;
        const aborted = new Promise((res) => (abortNow = res));
        let abortPower = 1;
        el._abort = (from, power) => { abortedBy = from || [a.x, a.y]; abortPower = power || 1; abortNow(); };
        setState(a, label || "moving");
        await Promise.race([moveTo(a, r.x + r.w, r.y + r.h), aborted]);
        if (stopped || abortedBy) {
            el._abort = null;
            if (abortedBy) await knockedBack(a, abortedBy, abortPower);
            return abortedBy ? "aborted" : undefined;
        }
        setState(a, "unbuilding");
        const box = document.createElement("div");
        box.className = "swarm-intro-box is-unbuild" + (label === "attacking" && !options.war ? " is-attack" : "");
        tagBox(a, box);
        box._cursor = a.el;
        box.style.cssText = `left:${r.x}px;top:${r.y}px;width:${r.w}px;height:${r.h}px`;
        const badge = document.createElement("span");
        badge.className = "swarm-intro-badge";
        badge.textContent = `${Math.round(r.w)} × ${Math.round(r.h)}`;
        box.appendChild(badge);
        world.appendChild(box);
        let nodes = [];
        let typed = canType(el);
        if (typed) {
            const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
            for (let n = walker.nextNode(); n; n = walker.nextNode()) {
                if (!n.data.trim())
                    continue;
                const rest = document.createElement("span");
                rest.className = "swarm-intro-rest";
                n.after(rest);
                nodes.push({ node: n, full: n.data, rest });
            }
            // a page that styles out the typing (shows built text whole) gets the clip instead
            if (!nodes.length || !isTransparent(getComputedStyle(nodes[0].rest).color)) {
                nodes.forEach(({ rest }) => rest.remove());
                nodes = [];
                typed = false;
            }
        }
        const total = nodes.reduce((t, n) => t + n.full.length, 0);
        const clip = el.style.clipPath;
        const dragMs = (clamp(Math.hypot(r.w, r.h) * 1.05, 260, 720) * pace) / boost() / (a.speed || 1);
        let live = true;
        const shrink = () => {
            if (!live)
                return;
            const p = cursorPos(a);
            const w = clamp(p[0] - r.x, 0, r.w), h = clamp(p[1] - r.y, 0, r.h);
            box.style.width = `${w}px`;
            box.style.height = `${h}px`;
            badge.textContent = `${Math.round(w)} × ${Math.round(h)}`;
            const left = (w / (r.w || 1) + h / (r.h || 1)) / 2;   // how much of the element is still standing
            if (typed) {
                let keep = Math.round(total * left);
                nodes.forEach(({ node, full, rest }) => {
                    const k = clamp(keep, 0, full.length);
                    node.data = full.slice(0, k);
                    rest.textContent = full.slice(k);
                    keep -= k;
                });
            }
            else
                el.style.clipPath = `inset(0 ${r.w - w}px ${r.h - h}px 0)`;
            requestAnimationFrame(shrink);
        };
        requestAnimationFrame(shrink);
        await Promise.race([moveTo(a, r.x, r.y, dragMs).then(() => wait(60)), aborted]);
        live = false;
        el._abort = null;
        if (abortedBy) {
            // stopped part-way: the element is put back as it was
            nodes.forEach(({ node, full, rest }) => { node.data = full; rest.remove(); });
            el.style.clipPath = clip;
            box.classList.add("is-done");
            setTimeout(() => box.remove(), 400);
            await knockedBack(a, abortedBy, abortPower);
            return "aborted";
        }
        // gone: hide it the way the library hides anything not yet built, then put its text back underneath
        if (!stopped && !el.hasAttribute(PENDING)) {
            el.setAttribute(PENDING, "");
            pending++;
        }
        nodes.forEach(({ node, full, rest }) => {
            node.data = full;
            rest.remove();
        });
        el.style.clipPath = clip;
        box.classList.add("is-done");
        setTimeout(() => box.remove(), 400);
        return "done";
    };
    /* etis-good patch: the fight. Helpers for both teams. */
    const fallen = [];                                   // elements the attackers have torn down, waiting to be rebuilt
    const inView = (el) => {
        const r = el.getBoundingClientRect();
        return r.bottom > 40 && r.top < window.innerHeight && r.right > 0 && r.left < window.innerWidth;
    };
    async function knockedBack(a, from, power) {
        if (options.war && power !== 0 && hurt(a, power || 1))
            return;
        const p = cursorPos(a);
        let dx = p[0] - from[0], dy = p[1] - from[1], d = Math.hypot(dx, dy) || 1;
        if (d < 1) { dx = 1; dy = 0; d = 1; }
        setState(a, "stunned");
        a.restUntil = performance.now() + rand(2200, 3400);
        await moveTo(a, p[0] + dx / d * 70, p[1] + dy / d * 50, 260);
        await wait(500);
    }
    function clash(x, y) {
        const e = document.createElement("div");
        e.className = "swarm-intro-clash";
        e.style.left = `${x}px`;
        e.style.top = `${y}px`;
        world.appendChild(e);
        setTimeout(() => e.remove(), 450);
    }
    // An attacker: when rested, tear down a random element that's on screen and not already being worked on
    async function attack(a) {
        if (performance.now() < (a.restUntil || 0))
            return false;
        const choices = targets.filter((t) => !t.hasAttribute(PENDING) && !reworking.has(t) && inView(t));
        if (!choices.length)
            return false;
        const el = choices[Math.floor(Math.random() * choices.length)];
        reworking.add(el);
        a.target = el;
        const res = await unbuild(a, el, "attacking");
        a.target = null;
        reworking.delete(el);
        if (res === "done") {
            fallen.push(el);
            a.restUntil = performance.now() + rand(1500, 3500);
        }
        return true;
    }
    // A defender: first stop any attack in progress (the nearest attacker no one's chasing), then build anything
    // that's waiting (the first build, or new elements scrolled into view), then rebuild what was torn down
    async function defend(a) {
        const me = cursorPos(a);
        let foe = null, fd = Infinity;
        agents.forEach((b) => {
            // defenders only notice an attack once the teardown has visibly started
            if (b.team !== "attack" || !b.target || b.chasedBy || !b.target._abort || b.state !== "unbuilding")
                return;
            const p = cursorPos(b), d = Math.hypot(p[0] - me[0], p[1] - me[1]);
            if (d < fd) { fd = d; foe = b; }
        });
        if (foe) {
            foe.chasedBy = a;
            await intercept(a, foe);
            foe.chasedBy = null;
            return true;
        }
        const el = take();
        if (el) {
            a.idleUntil = 0;
            await build(a, el);
            return true;
        }
        const i = fallen.findIndex((t) => inView(t) && !reworking.has(t));
        if (i >= 0) {
            const t = fallen.splice(i, 1)[0];
            if (!t.hasAttribute(PENDING))
                return true;
            reworking.add(t);
            await build(a, t);
            reworking.delete(t);
            return true;
        }
        return false;
    }
    // Chase an attacker; reaching it while it's still tearing down stops the attack
    async function intercept(a, foe) {
        setState(a, "defending");
        for (let i = 0; i < 16 && !stopped; i++) {
            const el = foe.target;
            if (!el || !el._abort)
                return;
            const p = cursorPos(foe), q = cursorPos(a), d = Math.hypot(p[0] - q[0], p[1] - q[1]);
            if (d < 34) {
                if (options.war && foe.state === "attacking" && Math.random() < (TR(foe).dodge || 0)) {
                    blink(foe);                           // gone in a puff of smoke: the chase goes on
                    await wait(120);
                    continue;
                }
                clash((p[0] + q[0]) / 2, (p[1] + q[1]) / 2 - 10);
                strikeFx(a, p);
                el._abort(q, TR(a).power || 1);
                await wait(250);
                return;
            }
            const ms = clamp(d * 1.05, 120, 600);      // a defender is slower than the attack: far-off ones arrive too late
            moveTo(a, p[0], p[1], ms);
            await wait(Math.min(ms, 120));
        }
    }
    /* etis-good patch: war. Every unit does everything, for its own team. */
    function tagBox(a, box) {
        if (!a.kind)
            return;
        box.dataset.kind = a.kind;
        box.dataset.side = a.team;
    }
    function kill(a) {
        release(a);
        a.dead = true;
        setState(a, "dead");
        const i = agents.indexOf(a);
        if (i >= 0)
            agents.splice(i, 1);
        const p = cursorPos(a);
        if (options.onDeath)
            options.onDeath(a, p[0], p[1]);
        a.el.style.transition = "opacity .25s";
        a.el.style.opacity = "0";
        setTimeout(() => a.el.remove(), 300);
    }
    function add(o) {
        if (stopped)
            return null;
        const a = spawn(o.x, o.y);
        a.team = o.team;
        a.kind = o.kind;
        a.hp = o.hp || TR(a).hp || 3;
        a.speed = TR(a).speed || 1;
        a.el.dataset.hp = a.hp;
        a.el.dataset.kind = o.kind;
        a.el.dataset.side = o.team;
        run(a);
        return a;
    }
    // Unit traits, from options.traits[kind]: role ("claim" | "hunt" | "guard" | "ward" | "raid"), hp, power (damage per
    // hit), watch (how far it will go to stop a raid on its team's panels), speed, dodge (chance), ward (radius, px)
    const TR = (a) => (options.traits && options.traits[a.kind]) || {};
    const centre = (el) => {
        const r = el.getBoundingClientRect();
        return [r.left + window.scrollX + r.width / 2, r.top + window.scrollY + r.height / 2];
    };
    const owned = (el, team) => el.dataset.owner === team && !el.hasAttribute(PENDING);
    // takes damage; true if that was the end of it
    function hurt(a, dmg) {
        a.hp -= dmg;
        a.el.dataset.hp = Math.max(0, a.hp);
        if (a.hp > 0)
            return false;
        kill(a);
        return true;
    }
    // a hit that isn't an interrupted teardown: damage, and a shove away from the hitter
    function hit(b, dmg, from) {
        if (b.dead || hurt(b, dmg))
            return;
        const p = cursorPos(b), dx = p[0] - from[0], dy = p[1] - from[1], d = Math.hypot(dx, dy) || 1;
        moveTo(b, p[0] + dx / d * 26, p[1] + dy / d * 18, 160);
    }
    // pushed out past the edge of a ward centred on c (radius R), and stunned; a teardown in progress is called off
    function repel(b, c, R) {
        if (Math.random() < (TR(b).dodge || 0))
            return blink(b);
        const now = performance.now(), p = cursorPos(b);
        let dx = p[0] - c[0], dy = p[1] - c[1], d = Math.hypot(dx, dy);
        if (d < 1) { dx = rand(-1, 1); dy = rand(-1, 1); d = Math.hypot(dx, dy) || 1; }
        b.repelledUntil = now + 1400;
        if (b.target && b.target._abort && b.state === "unbuilding")
            return b.target._abort(c, 0);              // knockedBack does the shove (no damage) and the stun
        b.restUntil = now + rand(900, 1400);
        setState(b, "stunned");
        moveTo(b, c[0] + dx / d * (R + 46), c[1] + dy / d * (R + 32), 240);
    }
    function blink(b) {
        const p = cursorPos(b);
        moveTo(b, p[0] + rand(-110, 110), p[1] + rand(-70, 70), 1);
    }
    // the samurai's hits are its iaijutsu: samurai.js draws the strike when data-iai changes
    function strikeFx(a, at) {
        if (a.kind !== "samurai")
            return;
        a.el.dataset.iai = performance.now();
        a.el.dataset.ix = at[0];
        a.el.dataset.iy = at[1] - 12;
    }
    // who's protecting a panel: a guard standing on it, or a warder whose ward covers it
    function shielder(el) {
        const own = el.dataset.owner;
        if (!own || el.hasAttribute(PENDING))
            return null;
        const g = el._guard;
        if (g && !g.dead && g.post === el && g.state === "guarding")
            return g;
        const c = centre(el);
        for (const w of agents) {
            if (w.team !== own || w.state !== "warding" || !w.post)
                continue;
            const p = centre(w.post);
            if (Math.hypot(p[0] - c[0], p[1] - c[1]) <= (TR(w).ward || 0))
                return w;
        }
        return null;
    }
    if (options.war)
        setInterval(() => targets.forEach((el) => {
            const sh = shielder(el);
            if (options.sealed && options.sealed(el)) el.dataset.shield = "sealed";
            else if (sh) el.dataset.shield = sh.kind;
            else delete el.dataset.shield;
        }), 250);
    function release(a) {
        if (a.post && a.post._guard === a)
            a.post._guard = null;
        a.post = null;
        if (a.ring) { a.ring.remove(); a.ring = null; }
        delete a.el.dataset.zap;
    }
    // Hold a post: a guard on one of its team's panels (keep first, then towers, walls...), a warder somewhere its ward
    // doesn't overlap another's. A guard also lasers any enemy that comes close (robot.js draws data-zap as a beam).
    async function hold(a, role) {
        const t = TR(a);
        if (a.post && !owned(a.post, a.team))
            release(a);
        if (!a.post) {
            const me = cursorPos(a);
            const posts = targets.filter((el) => owned(el, a.team) && !reworking.has(el) && (role !== "guard" || !el._guard || el._guard.dead)
                && (role !== "ward" || !agents.some((w) => w !== a && w.team === a.team && w.post && TR(w).ward
                    && Math.hypot(centre(w.post)[0] - centre(el)[0], centre(w.post)[1] - centre(el)[1]) < (t.ward || 0) * 1.4)))
                .map((el) => { const c = centre(el); return { el, s: (+el.dataset.prio || 0) * 1000 - Math.hypot(c[0] - me[0], c[1] - me[1]) }; })
                .sort((x, y) => y.s - x.s);
            if (!posts.length)
                return false;
            a.post = posts[0].el;
            if (role === "guard")
                a.post._guard = a;
        }
        const c = centre(a.post), me = cursorPos(a);
        if (Math.hypot(c[0] - me[0], c[1] - me[1]) > 6) {
            setState(a, "moving");
            if (a.ring) { a.ring.remove(); a.ring = null; }
            await moveTo(a, c[0], c[1] + 6);
            if (a.dead)
                return true;
        }
        setState(a, role === "guard" ? "guarding" : "warding");
        if (role === "ward" && !a.ring) {
            a.ring = document.createElement("div");
            a.ring.className = "war-ward";
            a.ring.dataset.side = a.team;
            a.ring.style.cssText = `left:${c[0]}px;top:${c[1]}px;width:${t.ward * 2}px;height:${t.ward * 2}px`;
            world.appendChild(a.ring);
        }
        if (role === "guard") {
            let foe = null, fd = 175;
            agents.forEach((b) => { if (b.team !== a.team && !b.dead) { const p = cursorPos(b), d = Math.hypot(p[0] - c[0], p[1] - c[1]); if (d < fd) { fd = d; foe = b; } } });
            if (foe) {
                const p = cursorPos(foe), now = performance.now();
                a.el.dataset.zap = now;
                a.el.dataset.zx = p[0];
                a.el.dataset.zy = p[1] - 12;
                if (now > (a.zapT || 0)) {
                    a.zapT = now + 1300;
                    setTimeout(() => !a.dead && !foe.dead && hit(foe, 1, c), 90);
                }
            }
            else
                delete a.el.dataset.zap;
        }
        // a warder repels: anyone coming into its ward is blasted back out and stunned for a moment (no damage). A unit
        // that's duelling the warder itself isn't pushed out: beating the warder is how a ward is broken.
        if (role === "ward") {
            const now = performance.now(), R = t.ward || 0;
            let foe = null, fd = R + 10;
            agents.forEach((b) => {
                if (b.team === a.team || b.dead || b.extra || b.state === "duelling" || now < (b.repelledUntil || 0))
                    return;
                const p = cursorPos(b), d = Math.hypot(p[0] - c[0], p[1] - c[1]);
                if (d < fd) { fd = d; foe = b; }
            });
            if (foe && now > (a.zapT || 0)) {
                a.zapT = now + 900;
                const p = cursorPos(foe);
                a.el.dataset.zap = now;
                a.el.dataset.zx = p[0];
                a.el.dataset.zy = p[1] - 14;
                if (a.ring) {
                    a.ring.classList.remove("repel");
                    void a.ring.offsetWidth;
                    a.ring.classList.add("repel");
                }
                setTimeout(() => !a.dead && !foe.dead && repel(foe, c, R), 120);
            }
        }
        await wait(260);
        return true;
    }
    // A duel: close in and trade blows. The defender always strikes back.
    async function duel(a, b) {
        setState(a, "duelling");
        for (let i = 0; i < 16 && !stopped && !a.dead && !b.dead; i++) {
            const p = cursorPos(b), q = cursorPos(a), d = Math.hypot(p[0] - q[0], p[1] - q[1]);
            if (d < 30) {
                if (Math.random() < (TR(b).dodge || 0)) {
                    blink(b);
                    await wait(150);
                    return;
                }
                clash((p[0] + q[0]) / 2, (p[1] + q[1]) / 2 - 10);
                strikeFx(a, p);
                hit(b, TR(a).power || 1, q);
                if (!b.dead) {
                    strikeFx(b, q);
                    if (hurt(a, TR(b).power || 1))
                        return;
                }
                setState(a, "stunned");
                await moveTo(a, q[0] - (p[0] - q[0]) / (d || 1) * 40, q[1] - (p[1] - q[1]) / (d || 1) * 24, 220);
                a.restUntil = performance.now() + 600;
                return;
            }
            const ms = clamp(d * .9, 120, 600);
            moveTo(a, p[0], p[1], ms);
            await wait(Math.min(ms, 120));
        }
    }
    let warPaused = false;
    function wipe(team) {
        agents.filter((a) => a.team === team && !a.dead).forEach((a, i) => setTimeout(() => !a.dead && kill(a), 60 + i * 110));
    }
    function clearAll() {
        agents.slice().forEach((a) => {
            release(a);
            a.dead = true;
            a.el.remove();
        });
        agents.length = 0;
    }
    function form(points, team) {
        warPaused = true;
        const squad = agents.filter((a) => a.team === team && !a.dead);
        while (squad.length < points.length) {         // reinforcements, in the team's colour, from its own edge
            const a = spawn(window.scrollX + (team === "g" ? -30 : window.innerWidth + 30), window.scrollY + rand(0, window.innerHeight));
            a.team = team;
            a.kind = "cursor";
            a.hp = 1;
            a.extra = true;
            a.el.dataset.kind = "cursor";
            a.el.dataset.side = team;
            squad.push(a);
        }
        // the real units take the first places (shuffled, so the sprites are spread through the letters)
        const order = points.map((p, i) => i).sort(() => Math.random() - .5);
        squad.slice(0, points.length).forEach((a, i) => {
            const p = points[order[i]];
            release(a);
            a.target = null;
            setState(a, "victory");
            moveTo(a, p[0], p[1], rand(900, 1700) * pace);
        });
        squad.slice(points.length).forEach((a) => kill(a));
    }
    async function warTurn(a) {
        if (performance.now() < (a.restUntil || 0))
            return false;                                // still stunned
        const t = TR(a), me = cursorPos(a), role = t.role;
        // 1. stop an enemy on its way to tear down, or tearing down, one of ours
        let foe = null, fd = t.watch !== undefined ? t.watch : 460;
        agents.forEach((b) => {
            if (b.team === a.team || b.dead || !b.target || b.chasedBy || !b.target._abort || b.target.dataset.owner !== a.team)
                return;
            const p = cursorPos(b), d = Math.hypot(p[0] - me[0], p[1] - me[1]);
            if (d < fd) { fd = d; foe = b; }
        });
        if (foe) {
            release(a);
            foe.chasedBy = a;
            await intercept(a, foe);
            foe.chasedBy = null;
            return true;
        }
        // 2. the unit's own job
        if ((role === "guard" || role === "ward") && await hold(a, role))
            return true;
        if (role === "hunt") {
            let prey = null, pd = 650;
            agents.forEach((b) => {
                if (b.team === a.team || b.dead)
                    return;
                const p = cursorPos(b), busy = b.state === "attacking" || b.state === "unbuilding" ? 220 : 0, d = Math.hypot(p[0] - me[0], p[1] - me[1]) - busy;
                if (d < pd) { pd = d; prey = b; }
            });
            if (prey) {
                await duel(a, prey);
                return true;
            }
        }
        // 3. a panel that isn't ours: swarmers prefer empty ones, raiders the enemy's most precious ones
        let open = targets.filter((el) => el.dataset.owner !== a.team && !reworking.has(el) && !(options.sealed && options.sealed(el)));
        if (role === "claim") {
            const empty = open.filter((el) => !el.dataset.owner || el.hasAttribute(PENDING));
            if (empty.length) open = empty;
        }
        if (role === "raid") {
            const theirs = open.filter((el) => el.dataset.owner && !el.hasAttribute(PENDING));
            if (theirs.length) open = theirs;
        }
        const scored = open.map((el) => {
            const c = centre(el), d = Math.hypot(c[0] - me[0], c[1] - me[1]);
            return { el, s: d - (role === "raid" ? (+el.dataset.prio || 0) * 350 : 0) };
        }).sort((x, y) => x.s - y.s);
        if (!scored.length)
            return false;
        const el = scored[Math.floor(Math.random() * Math.min(3, scored.length))].el;
        const sh = shielder(el);
        if (sh) {                                         // protected: beat its protector first
            await duel(a, sh);
            return true;
        }
        reworking.add(el);
        a.target = el;
        if (el.dataset.owner && !el.hasAttribute(PENDING)) {   // the enemy's: tear it down
            const res = await unbuild(a, el, "attacking");
            if (res === "done" && +el.dataset.armor > 0) {  // armour takes the hit: it's back, one crack worse
                el.dataset.armor = +el.dataset.armor - 1;
                el.removeAttribute(PENDING);
            }
            else if (res === "done")
                delete el.dataset.owner;
        }
        else {                                            // empty: build it for our team
            el.dataset.owner = a.team;
            await build(a, el);
            el.removeAttribute(PENDING);
        }
        a.target = null;
        reworking.delete(el);
        return true;
    }
    // Jobs handed to one particular cursor (the nearest free one), or queued for the next to come free
    const jobs = [];
    const reworking = new Set();
    const dispatch = (job, el, not, team) => {
        const r = el.getBoundingClientRect(), cx = r.left + r.width / 2 + window.scrollX, cy = r.top + r.height / 2 + window.scrollY;
        const free = agents.filter((a) => !a.working && !a.job && (!team || !options.fight || a.team === team));
        const pool = free.filter((a) => a !== not).length ? free.filter((a) => a !== not) : free;
        let best = null, bd = Infinity;
        pool.forEach((a) => {
            const d = Math.hypot(a.x - cx, a.y - cy);
            if (d < bd) {
                bd = d;
                best = a;
            }
        });
        if (best)
            best.job = job;
        else
            jobs.push(job);
    };
    function rework(target) {
        const el = targets.find((t) => t === target || t.contains(target));
        if (!el || stopped || reworking.has(el) || el.hasAttribute(PENDING))
            return false;
        reworking.add(el);
        dispatch(async (a) => {
            await unbuild(a, el);
            if (stopped)
                return void reworking.delete(el);
            // a short, noticeable pause with the element gone, then someone else builds it back
            setTimeout(() => dispatch(async (b) => {
                await build(b, el);
                reworking.delete(el);
            }, el, a, "defend"), 700);             // in a fight, only a defender builds
        }, el, null);
        return true;
    }
    /* ---------------- scheduling ---------------- */
    const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
            if (!e.isIntersecting)
                return;
            io.unobserve(e.target);
            queue.push(e.target);
        });
        // Call in reinforcements for a long backlog, like a fast scroll
        while (!options.war && !options.puppet && queue.length > agents.length * 2 && agents.length < maxCursors) {
            run(spawn(window.scrollX + rand(0, window.innerWidth), window.scrollY - 30));
        }
    }, { threshold: 0 });
    const take = () => {
        if (!queue.length)
            return null;
        // Nearest-to-top first, so the page builds top to bottom
        let best = 0;
        let bestTop = Infinity;
        queue.forEach((el, i) => {
            const t = el.getBoundingClientRect().top;
            if (t < bestTop) {
                bestTop = t;
                best = i;
            }
        });
        return queue.splice(best, 1)[0];
    };
    // Drift somewhere in view, but keep checking for work while drifting
    const wander = async (a) => {
        // etis-good patch: a custom idle behaviour, if given
        if (options.idle) {
            const t = options.idle(a, performance.now());
            setState(a, (t && t.state) || "idle");
            if (t) {
                a.idleUntil = 0;
                moveTo(a, t.x, t.y, t.ms);
                await wait(t.wait || 120);
                return;
            }
        }
        else
            setState(a, "idle");
        if (performance.now() >= a.idleUntil) {
            const d = rand(900, 1700);
            a.idleUntil = performance.now() + d;
            moveTo(a, window.scrollX + rand(40, window.innerWidth - 40), window.scrollY + rand(80, window.innerHeight - 40), d);
        }
        await wait(120);
    };
    async function run(a) {
        while (!stopped) {
            // etis-good patch: a puppet does what the page orders, and idles where the idle hook says
            if (options.puppet) {
                if (a.dead)
                    return;
                const job = a.job;
                if (job) {
                    a.job = null;
                    a.working = true;
                    await job(a);
                    a.working = false;
                }
                else
                    await wander(a);
                continue;
            }
            // etis-good patch: in a war, each unit fights for its team until it's deleted
            if (options.war) {
                if (a.dead || a.extra)
                    return;
                if (warPaused) {
                    await wait(150);
                    continue;
                }
                a.working = true;
                const did = await warTurn(a);
                a.working = false;
                if (a.dead)
                    return;
                if (!did)
                    await wander(a);
                continue;
            }
            // etis-good patch: a rework job handed to this cursor (or waiting for anyone) comes first
            const job = a.job || jobs.shift();
            if (job) {
                a.job = null;
                a.idleUntil = 0;
                a.working = true;
                await job(a);
                a.working = false;
                continue;
            }
            // etis-good patch: in a fight, attackers attack (and never build); defenders defend before anything else.
            // There's always something to rebuild in a fight, so the skip button goes once nothing new is waiting.
            if (options.fight && !queue.length && typeof skipBtn !== "undefined" && skipBtn)
                skipBtn.style.display = "none";
            if (options.fight && a.team === "attack") {
                a.working = true;
                const did = await attack(a);
                a.working = false;
                if (!did)
                    await wander(a);
                continue;
            }
            if (options.fight && a.team === "defend") {
                a.working = true;
                const did = await defend(a);
                a.working = false;
                if (did)
                    continue;
            }
            const el = take();
            if (el) {
                a.idleUntil = 0;
                a.working = true;
                await build(a, el);
                a.working = false;
            }
            else if (pending <= 0 && !options.persist)
                return finish(false);
            else if (pending <= 0) {
                // etis-good patch: the page is built but the swarm stays, idling
                if (typeof skipBtn !== "undefined" && skipBtn) skipBtn.style.display = "none";
                await wander(a);
            }
            else
                await wander(a);
        }
    }
    /* ---------------- teardown ---------------- */
    // etis-good patch: Escape skips the intro, but not in a war or a puppet show (Esc means something else there)
    const onKey = (e) => e.key === "Escape" && !options.war && !options.puppet && skip();
    window.addEventListener("keydown", onKey);
    let finished = false;
    function finish(fast) {
        if (finished)
            return;
        finished = true;
        setTimeout(() => {
            stopped = true;
            layer.classList.add("is-leaving");
            setTimeout(cleanup, 500);
        }, fast ? 0 : 2200 * pace);
    }
    let cleaned = false;
    function cleanup() {
        var _a;
        if (cleaned)
            return;
        cleaned = true;
        stopped = true;
        io.disconnect();
        window.removeEventListener("scroll", syncScroll);
        window.removeEventListener("keydown", onKey);
        targets.forEach(markDone);
        layer.remove();
        (_a = options.onComplete) === null || _a === void 0 ? void 0 : _a.call(options);
        resolveDone();
    }
    function skip() {
        stopped = true;
        targets.forEach(markDone);
        document.querySelectorAll(".swarm-intro-caret").forEach((c) => c.remove());
        finish(true);
    }
    /* ---------------- intro ---------------- */
    (async () => {
        var _a, _b;
        const count = (_a = options.cursors) !== null && _a !== void 0 ? _a : (narrow ? 8 : 14);
        const cx = window.scrollX + window.innerWidth / 2;
        const cy = window.scrollY + window.innerHeight / 2;
        // Cursors fly in from the edges
        for (let i = 0; i < count; i++) {
            const edge = i % 4;
            const x = window.scrollX + (edge === 1 ? window.innerWidth + 20 : edge === 3 ? -20 : rand(0, window.innerWidth));
            const y = window.scrollY + (edge === 0 ? -20 : edge === 2 ? window.innerHeight + 20 : rand(0, window.innerHeight));
            spawn(x, y);
        }
        // ...and swarm around a logo badge in the middle of the blank page
        if (options.logo !== false) {
            const logo = document.createElement("div");
            logo.className = "swarm-intro-logo";
            logo.textContent = (_b = options.logo) !== null && _b !== void 0 ? _b : "";
            logo.style.cssText = `left:${cx}px;top:${cy}px`;
            world.appendChild(logo);
            for (let round = 0; round < 3 && !stopped; round++) {
                agents.forEach((a, i) => {
                    const angle = (i / agents.length) * Math.PI * 2 + round * 1.3 + rand(-0.4, 0.4);
                    const rad = rand(48, 110);
                    moveTo(a, cx + Math.cos(angle) * rad, cy + Math.sin(angle) * rad, rand(540, 780) * pace);
                });
                await wait(720 * pace);
            }
            logo.classList.add("is-done");
            setTimeout(() => logo.remove(), 400);
        }
        if (stopped)
            return;
        if (!targets.length)
            return finish(false);
        targets.forEach((el) => io.observe(el));
        agents.forEach(run);
    })();
    return {
        skip,
        rework,
        add,
        units: () => agents.filter((a) => !a.extra),
        order: (a, el, how) => {
            if (a.dead || a.working || a.job)
                return false;
            a.job = how === "unbuild" ? (b) => unbuild(b, el) : (b) => build(b, el);
            return true;
        },
        remove: (a) => { if (!a.dead) kill(a); },
        // a custom job for a free puppet: fn(agent, moveTo, wait) runs as its next job (e.g. a dash out and back)
        act: (a, fn) => {
            if (a.dead || a.working || a.job)
                return false;
            a.job = (b) => fn(b, moveTo, wait);
            return true;
        },
        pause: (v) => { warPaused = !!v; },
        wipe,
        form,
        clear: clearAll,
        destroy() {
            skip();
            cleanup();
        },
        done,
    };
}


window.swarmIntro = swarmIntro;
window.swarmIntroPreload = preloadScript;
})();

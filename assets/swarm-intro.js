/*! swarm-intro (https://github.com/swarnadeep31/swarm-intro), compiled from src/index.ts to a browser script.
   Local patch (marked "etis-good patch" below), adding two options:
     idle(agent, now) -> {x, y, ms, wait} | null : where an idle cursor should go instead of wandering at random
     persist: true                                : keep the swarm on screen (idling) after the page is built
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
        agents.push(agent);
        return agent;
    };
    // Speeds up when a fast scroll leaves a long backlog
    const queue = [];
    const boost = () => clamp(1 + queue.length / 12, 1, 3);
    const moveTo = (a, x, y, ms) => {
        const dist = Math.hypot(x - a.x, y - a.y);
        const d = ms !== null && ms !== void 0 ? ms : (clamp(dist * 0.95, 240, 840) * pace) / boost();
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
        if (len === 0 || len > 400)
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
        await moveTo(a, r.x, r.y);
        if (stopped)
            return;
        const box = document.createElement("div");
        box.className = "swarm-intro-box";
        box.style.cssText = `left:${r.x}px;top:${r.y}px`;
        const badge = document.createElement("span");
        badge.className = "swarm-intro-badge";
        box.appendChild(badge);
        world.appendChild(box);
        const dragMs = (clamp(Math.hypot(r.w, r.h) * 1.05, 260, 720) * pace) / boost();
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
        if (stopped)
            return void box.remove();
        if (canType(el))
            await typeIn(a, el);
        else {
            fadeIn(el);
            await wait((320 * pace) / boost());
        }
        box.classList.add("is-done");
        setTimeout(() => box.remove(), 400);
    };
    /* ---------------- scheduling ---------------- */
    const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
            if (!e.isIntersecting)
                return;
            io.unobserve(e.target);
            queue.push(e.target);
        });
        // Call in reinforcements for a long backlog, like a fast scroll
        while (queue.length > agents.length * 2 && agents.length < maxCursors) {
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
            if (t) {
                a.idleUntil = 0;
                moveTo(a, t.x, t.y, t.ms);
                await wait(t.wait || 120);
                return;
            }
        }
        if (performance.now() >= a.idleUntil) {
            const d = rand(900, 1700);
            a.idleUntil = performance.now() + d;
            moveTo(a, window.scrollX + rand(40, window.innerWidth - 40), window.scrollY + rand(80, window.innerHeight - 40), d);
        }
        await wait(120);
    };
    async function run(a) {
        while (!stopped) {
            const el = take();
            if (el) {
                a.idleUntil = 0;
                await build(a, el);
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
    const onKey = (e) => e.key === "Escape" && skip();
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

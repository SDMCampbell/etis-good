"""Round test harness. Usage: python3 check.py <tag> <path> [actions.py]
actions.py defines async def run(page, mode, shot) with mode in {'desktop','mobile','reduced'}"""
import asyncio, sys, subprocess, time, json, importlib.util, os, socket
REPO = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
from playwright.async_api import async_playwright
tag, path = sys.argv[1], sys.argv[2]
acts = None
if len(sys.argv) > 3:
    spec = importlib.util.spec_from_file_location("acts", sys.argv[3]); acts = importlib.util.module_from_spec(spec); spec.loader.exec_module(acts)
PORT = 8765
def up():
    s = socket.socket();
    try: s.connect(("127.0.0.1", PORT)); return True
    except: return False
    finally: s.close()
if not up():
    subprocess.Popen(["python3","-m","http.server",str(PORT)], cwd=REPO, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(0.8)
REPO_SHOTS = os.path.join(REPO, "..", "shots")
os.makedirs(REPO_SHOTS, exist_ok=True)
CLS_JS = "window.__cls=0;new PerformanceObserver(l=>{for(const e of l.getEntries()) if(!e.hadRecentInput) window.__cls+=e.value}).observe({type:'layout-shift',buffered:true});"
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--disable-features=Translate"])
        modes = [("desktop", dict(viewport={"width":1280,"height":800})),
                 ("mobile", dict(viewport={"width":390,"height":844}, is_mobile=True, has_touch=True, device_scale_factor=2)),
                 ("reduced", dict(viewport={"width":1280,"height":800}, reduced_motion="reduce"))]
        report = {}
        for mode, opts in modes:
            ctx = await b.new_context(**opts); pg = await ctx.new_page()
            errs = []
            pg.on("pageerror", lambda e: errs.append("PAGEERR " + str(e)))
            pg.on("console", lambda m: errs.append(m.text) if m.type == "error" and "fonts." not in m.text and "net::ERR" not in m.text else None)
            await pg.add_init_script(CLS_JS)
            await pg.goto(f"http://localhost:{PORT}/{path}"); await pg.wait_for_timeout(900)
            async def shot(name, full=False):
                await pg.screenshot(path=os.path.join(REPO_SHOTS, f"{tag}-{mode}-{name}.png"), full_page=full)
            await shot("load")
            info = await pg.evaluate("({cls: window.__cls, overflowX: document.documentElement.scrollWidth > innerWidth+1, h: document.documentElement.scrollHeight})")
            if acts:
                try:
                    r = await acts.run(pg, mode, shot)
                    if r: info["actions"] = r
                except Exception as e:
                    info["ACTION_FAIL"] = repr(e)[-700:]
            info["cls_after"] = await pg.evaluate("window.__cls")
            info["errors"] = errs
            report[mode] = info
            await ctx.close()
        await b.close()
        print(json.dumps(report, indent=1))
asyncio.run(main())

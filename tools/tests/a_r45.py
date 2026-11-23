import importlib.util, os
spec = importlib.util.spec_from_file_location("a30", os.path.join(os.path.dirname(os.path.abspath(__file__)), "a_r30.py")); a30 = importlib.util.module_from_spec(spec); spec.loader.exec_module(a30)
async def run(pg, mode, shot):
    r = {}
    await pg.wait_for_timeout(2600)
    if mode == "desktop":
        await pg.mouse.move(640, 420); await pg.wait_for_timeout(150); await pg.mouse.move(650, 430); await pg.wait_for_timeout(600)
    await shot("amb")
    r["amb_present"] = await pg.evaluate("!!document.getElementById('amb')")
    # cost: time spent in frames over 2s
    r["long_tasks"] = await pg.evaluate("""new Promise(res=>{let n=0,worst=0,t0=performance.now(),p=t0;function f(t){n++;worst=Math.max(worst,t-p);p=t;if(t-t0<2000)requestAnimationFrame(f);else res([n,Math.round(worst)])}requestAnimationFrame(f)})""")
    c = await pg.evaluate(a30.AUDIT); r["contrast_fails"] = c.get("fails") if isinstance(c, dict) else c
    return r

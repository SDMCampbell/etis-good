import importlib.util, sys
spec = importlib.util.spec_from_file_location("a30", os.path.join(os.path.dirname(os.path.abspath(__file__)), "a_r30.py")); a30 = importlib.util.module_from_spec(spec); spec.loader.exec_module(a30)
async def run(pg, mode, shot):
    r = {}
    await pg.wait_for_timeout(2600)
    for t in ["amber", "ice", "paper", "green"]:
        await pg.click("#phosphor"); await pg.wait_for_timeout(350)
        if mode != "reduced" and t == "amber": await shot("sweep")
        await pg.wait_for_timeout(900)
        th = await pg.evaluate("document.documentElement.dataset.theme || 'green'")
        c = await pg.evaluate(a30.AUDIT)
        r[t] = [th, c if not isinstance(c, dict) else {k: c[k] for k in c if k in ("checked", "fails", "failList")}]
        if mode == "desktop" and t in ("amber", "paper"): await shot(t)
    await pg.click("#phosphor"); await pg.reload(); await pg.wait_for_timeout(500)
    r["persist"] = await pg.evaluate("document.documentElement.dataset.theme")
    await pg.evaluate("localStorage.clear()")
    return r

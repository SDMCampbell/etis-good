import importlib.util, os
spec = importlib.util.spec_from_file_location("a30", os.path.join(os.path.dirname(os.path.abspath(__file__)), "a_r30.py")); a30 = importlib.util.module_from_spec(spec); spec.loader.exec_module(a30)
async def run(pg, mode, shot):
    r = {}
    await pg.wait_for_timeout(1500); await shot("log")
    r["sel"] = await pg.evaluate("document.querySelector('.alt-step[aria-selected=true]').dataset.v")
    await pg.locator(".alt-step").first.focus(); await pg.keyboard.press("]"); await pg.wait_for_timeout(300)
    r["after_bracket"] = await pg.evaluate("document.querySelector('.alt-step[aria-selected=true]').dataset.v")
    c = await pg.evaluate(a30.AUDIT); r["contrast_fails"] = c.get("fails") if isinstance(c, dict) else c
    await pg.check("#compare"); await pg.wait_for_timeout(1500); await shot("compare")
    r["rows"] = await pg.evaluate("document.querySelectorAll('#rows li').length")
    # open archived snapshot with bar, return to current
    await pg.goto(pg.url.split("/timeline")[0] + "/versions/v38/"); await pg.wait_for_timeout(2500); await shot("bar")
    r["bar"] = await pg.evaluate("document.querySelector('.vb') && document.querySelector('.vb').textContent")
    await pg.click(".vb .home"); await pg.wait_for_timeout(800)
    r["returned"] = pg.url
    return r

async def run(pg, mode, shot):
    r = {}
    for m in ["terminal", "gitlog", "desktop"]:
        await pg.goto(f"http://localhost:8765/{m}/"); await pg.wait_for_timeout(1700)
        box = await pg.locator(".cs-nav").bounding_box()
        r[m] = {"nav_w": round(box["width"]), "fits": box["x"] >= 0 and box["x"] + box["width"] <= (390 if mode == "mobile" else 1280),
                "current": await pg.inner_text(".cs-nav [aria-current=page]"), "home": await pg.inner_text(".cs-home")}
        await shot(m)
    await pg.goto("http://localhost:8765/gitlog/"); await pg.wait_for_timeout(600)
    await pg.click(".cs-nav a[aria-label='Summit register']"); await pg.wait_for_timeout(600); r["reg_url"] = pg.url
    await pg.goto("http://localhost:8765/terminal/"); await pg.wait_for_timeout(1300)
    await pg.click(".cs-home"); await pg.wait_for_timeout(600); r["home_url"] = pg.url
    # night carries over
    await pg.evaluate("localStorage.setItem('theme','night')"); await pg.goto("http://localhost:8765/desktop/"); await pg.wait_for_timeout(1700)
    r["night"] = await pg.evaluate("document.querySelector('.cs-nav').classList.contains('night')")
    await shot("desktop-night")
    await pg.evaluate("localStorage.removeItem('theme')")
    return r

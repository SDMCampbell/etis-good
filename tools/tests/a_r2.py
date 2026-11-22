async def run(pg, mode, shot):
    r = {}
    expected = await pg.evaluate("DERIVED.chrono.map(j=>j._cum)")
    cnt = lambda: pg.inner_text("#bagCount")
    r["start"] = await cnt()
    await pg.focus("#token"); await pg.keyboard.press("Home"); await pg.wait_for_timeout(120)
    await shot("descending")
    await pg.wait_for_timeout(700)
    r["home"] = await cnt()
    for k in range(3): await pg.keyboard.press("ArrowUp"); await pg.wait_for_timeout(80)
    await pg.wait_for_timeout(150); await shot("climbing")
    await pg.wait_for_timeout(700)
    r["after3"] = await cnt(); r["expected3"] = expected[3]
    await pg.keyboard.press("End"); await pg.wait_for_timeout(250); await shot("summit")
    await pg.wait_for_timeout(800)
    r["end"] = await cnt(); r["expectedEnd"] = expected[-1]
    r["summit"] = await pg.inner_text("#card .summit")
    r["flying_left"] = await pg.evaluate("document.querySelectorAll('.flying,.puff').length")
    await shot("settled")
    return r

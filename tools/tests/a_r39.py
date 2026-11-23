async def run(pg, mode, shot):
    r = {}
    await pg.wait_for_timeout(2500)
    if mode == "reduced":
        return {"replay_hidden": await pg.evaluate("document.getElementById('replay').hidden")}
    if mode == "mobile":
        r["replay_visible"] = await pg.locator("#replay").is_visible()
    await pg.keyboard.press("0"); await pg.wait_for_timeout(450); await shot("lift")
    await pg.wait_for_timeout(700); await shot("empty")
    await pg.wait_for_timeout(900); await shot("rerain")
    await pg.wait_for_timeout(3500)
    r["veiled"] = await pg.evaluate("document.querySelectorAll('.veiled').length")
    r["skip_hidden"] = await pg.evaluate("document.getElementById('skip').hidden")
    r["name"] = await pg.evaluate("getComputedStyle(document.getElementById('name')).color")
    return r

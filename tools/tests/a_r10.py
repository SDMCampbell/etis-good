async def run(pg, mode, shot):
    r = {}
    if mode == "mobile":
        r["keys_btn_visible"] = await pg.is_visible("#keysBtn"); return r
    await pg.keyboard.press("?"); await pg.wait_for_timeout(200)
    r["help_open"] = await pg.evaluate("document.getElementById('help').open")
    r["focus"] = await pg.evaluate("document.activeElement.id")
    await shot("help")
    await pg.keyboard.press("Tab"); await pg.keyboard.press("Tab")
    r["focus_trapped"] = await pg.evaluate("!!document.activeElement.closest('dialog') || document.activeElement===document.body")
    await pg.keyboard.press("Escape"); await pg.wait_for_timeout(150)
    r["help_closed"] = not await pg.evaluate("document.getElementById('help').open")
    await pg.keyboard.type("belay"); await pg.wait_for_timeout(700)
    r["belay"] = await pg.inner_text("#belay"); r["zones"] = await pg.evaluate("document.querySelectorAll('.diag .zone').length")
    await shot("belay")
    await pg.keyboard.type("belay"); await pg.wait_for_timeout(100)
    r["belay_off"] = await pg.evaluate("document.getElementById('belay').hidden")
    return r

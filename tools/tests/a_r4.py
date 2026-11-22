async def drag(pg, a, b):
    ba = await a.bounding_box(); bb = await b.bounding_box()
    await pg.mouse.move(ba["x"]+ba["width"]/2, ba["y"]+15); await pg.mouse.down()
    await pg.mouse.move(bb["x"]+bb["width"]/2, bb["y"]+15, steps=10); await pg.mouse.up()
async def run(pg, mode, shot):
    r = {}
    php = pg.locator('[aria-label="Skill PHP"]'); cob = pg.locator('[aria-label="Skill COBOL"]')
    mind = pg.locator('[data-j="4"]'); agf = pg.locator('[data-j="7"]')
    r["job4"] = await mind.get_attribute("aria-label")
    if mode == "mobile":
        await php.tap(); await mind.tap(); await pg.wait_for_timeout(200)
        r["ok"] = await pg.inner_text("#led")
        await cob.tap(); await agf.tap(); await pg.wait_for_timeout(200)
        r["bad"] = await pg.inner_text("#led"); await shot("bad")
    else:
        await drag(pg, php, mind); await pg.wait_for_timeout(200); r["ok"] = await pg.inner_text("#led")
        await drag(pg, cob, agf); await pg.wait_for_timeout(100); r["bad"] = await pg.inner_text("#led"); await shot("bad")
        # keyboard
        await pg.focus('[aria-label="Skill Drupal"]'); await pg.keyboard.press("Enter")
        r["kb_focus"] = await pg.evaluate("document.activeElement.dataset.j")
        for _ in range(6): await pg.keyboard.press("Tab")
        r["kb_focus2"] = await pg.evaluate("document.activeElement.getAttribute('aria-label')")
        await pg.keyboard.press("Enter"); await pg.wait_for_timeout(100)
        r["kb"] = await pg.inner_text("#led")
    await pg.click("#routeAll"); await pg.wait_for_timeout(200)
    r["all"] = await pg.inner_text("#led"); r["cables"] = await pg.evaluate("document.querySelectorAll('#cables path').length")
    await shot("routeall")
    return r

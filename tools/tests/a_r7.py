async def run(pg, mode, shot):
    r = {}
    sb = await pg.locator("#sheet").bounding_box(); q = await pg.locator("#squeegee").bounding_box()
    if mode == "mobile":
        await pg.focus("#squeegee"); await pg.keyboard.press("Space"); await pg.wait_for_timeout(900)
    else:
        await pg.mouse.move(q["x"]+9, q["y"]+q["height"]/2); await pg.mouse.down()
        await pg.mouse.move(sb["x"]+sb["width"]*0.5, q["y"]+q["height"]/2, steps=6); await shot("halfpull")
        await pg.mouse.move(sb["x"]+sb["width"]+5, q["y"]+q["height"]/2, steps=6); await pg.mouse.up()
    await pg.wait_for_timeout(300)
    r["help"] = await pg.inner_text("#coverHelp"); await shot("printed")
    if mode != "mobile":
        b = await pg.locator("#blue").bounding_box()
        await pg.mouse.move(b["x"]+200, b["y"]+200); await pg.mouse.down(); await pg.mouse.move(b["x"]+193, b["y"]+205, steps=4); await pg.mouse.up()
        await pg.wait_for_timeout(300); r["reg"] = await pg.inner_text("#coverHelp")
    await pg.keyboard.press("ArrowRight"); await pg.wait_for_timeout(900)
    r["p2"] = await pg.inner_text("#pager"); await shot("page1")
    await pg.click("#contentsBtn"); await pg.click('#contents [data-k="5"]'); await pg.wait_for_timeout(900)
    r["contents"] = await pg.inner_text("#pager"); await shot("page5")
    await pg.click("#next"); await pg.click("#next"); await pg.click("#next"); await pg.click("#next"); await pg.wait_for_timeout(900)
    r["end"] = await pg.inner_text("#pager"); await shot("back")
    return r

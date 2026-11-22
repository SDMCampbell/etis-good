async def run(pg, mode, shot):
    r = {}
    await pg.click(".knot"); await pg.wait_for_timeout(300)
    r["compare"] = await pg.inner_text("#card .compare p"); r["expanded"] = await pg.get_attribute(".knot", "aria-expanded")
    await shot("compare")
    await pg.click("[data-uncompare]"); await pg.wait_for_timeout(200)
    r["back"] = await pg.inner_text("#card h3")
    await pg.click(".send"); await pg.wait_for_timeout(400)
    r["send"] = await pg.inner_text("#card h3")
    await shot("send")
    # keyboard reach the knot
    await pg.focus("#token"); await pg.keyboard.press("Tab")
    r["after_token_tab"] = await pg.evaluate("document.activeElement.className || document.activeElement.id")
    await pg.evaluate("window.scrollTo(0, document.body.scrollHeight)"); await pg.wait_for_timeout(300)
    r["speed"] = await pg.inner_text(".speed")
    return r

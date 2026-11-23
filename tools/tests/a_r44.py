async def run(pg, mode, shot):
    r = {}
    await pg.wait_for_timeout(2700)
    await pg.click("#hiveBtn"); await pg.wait_for_timeout(300); await shot("menu")
    r["focus"] = await pg.evaluate("document.activeElement.dataset.order")
    await pg.keyboard.press("ArrowDown"); r["down"] = await pg.evaluate("document.activeElement.dataset.order")
    await pg.keyboard.press("Escape"); await pg.wait_for_timeout(100)
    r["closed"] = await pg.evaluate("[document.getElementById('swarmMenu').hidden, document.activeElement.id, !!document.getElementById('find').hidden]")
    await pg.click("#hiveBtn"); await pg.click('[data-order="oldest"]'); await pg.wait_for_timeout(2800)
    r["oldest_first"] = await pg.evaluate("document.querySelector('#jobs > li').id")
    if mode != "reduced":
        await pg.evaluate("scrollTo(0,0)"); await pg.wait_for_timeout(300)
        await pg.click("#hiveBtn"); await pg.click('[data-order="form"]'); await pg.wait_for_timeout(1800); await shot("form")
    await pg.click("#hiveBtn"); await pg.click('[data-order="phosphor"]'); await pg.wait_for_timeout(1200)
    r["theme"] = await pg.evaluate("[document.documentElement.dataset.theme, document.getElementById('swarmMenu').hidden]")
    await pg.evaluate("localStorage.clear()")
    r["hdr_overflow"] = await pg.evaluate("document.querySelector('.top').scrollWidth > document.querySelector('.top').clientWidth")
    return r

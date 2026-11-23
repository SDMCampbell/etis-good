async def run(pg, mode, shot):
    if mode != "desktop": return {}
    r = {}
    await pg.wait_for_timeout(200); await pg.keyboard.press("Escape"); await pg.wait_for_timeout(200)
    await pg.click('[data-view="board"]'); await pg.wait_for_timeout(500); await shot("to-board")
    await pg.wait_for_timeout(2200)
    r["board"] = await pg.evaluate("document.body.classList.contains('board')"); await shot("board")
    await pg.click('[data-arr="company"]'); await pg.wait_for_timeout(2700)
    r["company_order"] = await pg.evaluate("[...document.querySelectorAll('#jobs > li')].map(li=>li.id.replace('job-',''))")
    a = await pg.locator("#job-unitrends").bounding_box(); b = await pg.locator("#jobs > li").first.bounding_box()
    await pg.mouse.move(a["x"]+40, a["y"]+30); await pg.mouse.down(); await pg.mouse.move(b["x"]+20, b["y"]+10, steps=6); await pg.mouse.up(); await pg.wait_for_timeout(2700)
    r["dragged_first"] = await pg.evaluate("document.querySelector('#jobs > li').id")
    r["veiled"] = await pg.evaluate("document.querySelectorAll('.veiled').length")
    await pg.click('[data-view="doc"]'); await pg.wait_for_timeout(2600)
    r["back_doc"] = not await pg.evaluate("document.body.classList.contains('board')")
    return r

async def run(pg, mode, shot):
    r = {}
    await pg.wait_for_timeout(200); await pg.keyboard.press("Escape"); await pg.wait_for_timeout(200)
    await pg.evaluate("document.getElementById('exp-h').scrollIntoView()"); await pg.wait_for_timeout(300)
    await pg.click('[data-sort="oldest"]'); await pg.wait_for_timeout(450)
    r["mid_veiled"] = await pg.evaluate("document.querySelectorAll('#jobs .veiled').length"); await shot("carry-mid")
    await pg.wait_for_timeout(2700)
    r["order"] = await pg.evaluate("[...document.querySelectorAll('#jobs > li')].map(li=>li.id.replace('job-',''))")
    r["veiled_after"] = await pg.evaluate("document.querySelectorAll('.veiled').length")
    await pg.click('[data-sort="learned"]'); await pg.wait_for_timeout(2700)
    r["learned_first"] = await pg.evaluate("document.querySelector('#jobs > li').id")
    await shot("carry-done")
    return r

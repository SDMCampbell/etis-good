async def run(pg, mode, shot):
    if mode == "reduced":
        await pg.keyboard.type("php"); await pg.wait_for_timeout(300)
        await pg.click("#gatherBtn"); await pg.wait_for_timeout(300)
        return {"items": await pg.evaluate("document.querySelectorAll('#gather li').length")}
    await pg.wait_for_timeout(2500)
    await pg.keyboard.type("php"); await pg.wait_for_timeout(400)
    await pg.click("#gatherBtn"); await pg.wait_for_timeout(450); await shot("ferry")
    await pg.wait_for_timeout(2200); await shot("gathered")
    r = {"items": await pg.evaluate("document.querySelectorAll('#gather li').length"),
         "lifted": await pg.evaluate("document.querySelectorAll('#gather .lifted').length")}
    await pg.locator("#gather button").nth(2).click(); await pg.wait_for_timeout(900)
    r["cur_visible"] = await pg.evaluate("(()=>{const m=document.querySelector('mark.cur');if(!m)return false;const b=m.getBoundingClientRect();return b.top>0&&b.bottom<innerHeight})()")
    await pg.keyboard.press("Escape"); await pg.wait_for_timeout(300)
    r["closed"] = await pg.evaluate("document.getElementById('gather').hidden")
    return r

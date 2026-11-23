import asyncio, json
from playwright.async_api import async_playwright
B = "http://localhost:8765/"
async def drag(pg, a, b):
    ba = await pg.locator(a).bounding_box(); bb = await pg.locator(b).bounding_box()
    await pg.mouse.move(ba["x"]+ba["width"]/2, ba["y"]+15); await pg.mouse.down()
    await pg.mouse.move(bb["x"]+bb["width"]/2, bb["y"]+15, steps=8); await pg.mouse.up()
async def t0(pg):
    await pg.goto(B+"versions/v00/terminal/"); await pg.wait_for_timeout(1200)
    await pg.fill("#cmd", "grep drupal"); await pg.press("#cmd", "Enter"); await pg.wait_for_timeout(200)
    return await pg.evaluate("document.querySelectorAll('#out mark').length") > 0
async def climb(pg, v):
    await pg.focus("#token"); await pg.keyboard.press("Home"); await pg.wait_for_timeout(300)
    a = await pg.inner_text("#card h3"); await pg.keyboard.press("End"); await pg.wait_for_timeout(300)
    return a != await pg.inner_text("#card h3")
async def t2(pg):
    await pg.focus("#token"); await pg.keyboard.press("Home"); await pg.keyboard.press("End"); await pg.wait_for_timeout(900)
    return (await pg.inner_text("#bagCount")).startswith("20")
async def t3(pg):
    await pg.click('#rack [data-skill="Drupal"]'); await pg.wait_for_timeout(300)
    return await pg.evaluate("document.querySelectorAll('.hold.dim').length") == 6
async def t4(pg):
    await drag(pg, '[aria-label="Skill PHP"]', '[data-j="4"]'); await pg.wait_for_timeout(200)
    return "CARRIER OK" in await pg.inner_text("#led")
async def t5(pg):
    await pg.click(".knot"); await pg.wait_for_timeout(300); return "second time" in await pg.inner_text("#card")
async def t6(pg):
    await pg.focus("#altStrip"); await pg.keyboard.press("Home"); await pg.wait_for_timeout(200)
    return "Version 0" in (await pg.get_attribute("#altStrip", "aria-valuetext") or "")
async def t7(pg):
    await pg.focus("#squeegee"); await pg.keyboard.press("Space"); await pg.wait_for_timeout(1000)
    return "PRINTED" in (await pg.inner_text("#coverHelp")).upper()
async def t8(pg):  # phone: tap a hold on the horizontal curve
    await pg.locator(".hold").nth(1).tap(); await pg.wait_for_timeout(300)
    return "NOC" in await pg.inner_text("#card h3")
async def t11(pg):
    await pg.locator('.pitchbar a[data-sec="skills"]').tap(); await pg.wait_for_timeout(1500)
    return await pg.evaluate("(document.querySelector('.pitchbar a.here')||{}).textContent") == "Rack"
async def t13(pg):
    await pg.click("#themeBtn"); await pg.wait_for_timeout(200); return await pg.evaluate("document.documentElement.dataset.theme") == "night"
async def t14(pg):
    await pg.click("#playBtn"); await pg.wait_for_timeout(500); return "UNITRENDS" in (await pg.inner_text("#caption")).upper()
async def t18(pg):
    return await pg.evaluate("!!document.querySelector('meta[property=\"og:image\"]')")

async def generic(pg): return await pg.evaluate("document.body.innerText.length > 200")
async def w(pg): await pg.wait_for_timeout(2600)
async def t31(pg): await w(pg); return await pg.evaluate("!document.querySelector('.hero').classList.contains('veiled') && !document.querySelector('.top').classList.contains('veiled') && !!document.getElementById('rain')")
async def t32(pg):
    await w(pg); b = await pg.locator("#summary").bounding_box(); await pg.mouse.click(b["x"]+30, b["y"]+10); await pg.wait_for_timeout(250)
    return await pg.evaluate("!!document.querySelector('.lifted')")
async def t34(pg): await w(pg); await pg.keyboard.type("php"); await pg.wait_for_timeout(300); return await pg.evaluate("document.querySelectorAll('mark.hit').length") > 0
async def t37(pg):
    await w(pg); await pg.click('[data-sort="oldest"]'); await pg.wait_for_timeout(2800)
    return await pg.evaluate("document.querySelector('#jobs > li').id") == "job-unitrends"
async def t38(pg): await w(pg); await pg.click('[data-view="board"]'); await pg.wait_for_timeout(2600); return await pg.evaluate("document.body.classList.contains('board')")
async def t40(pg):
    await w(pg); await pg.keyboard.type("php"); await pg.wait_for_timeout(300); await pg.click("#gatherBtn"); await pg.wait_for_timeout(1500)
    return await pg.evaluate("document.querySelectorAll('#gather li').length") > 0
async def t41(pg):
    await w(pg); await pg.click("#phosphor"); await pg.wait_for_timeout(1200)
    ok = await pg.evaluate("document.documentElement.dataset.theme") == "amber"; await pg.evaluate("localStorage.clear()"); return ok
async def t43(pg): return "archive" in await pg.evaluate("(document.querySelector('.vb')||{}).textContent||''")
async def t44(pg): await w(pg); await pg.click("#hiveBtn"); await pg.wait_for_timeout(200); return await pg.evaluate("!document.getElementById('swarmMenu').hidden")
async def t45(pg): await w(pg); return await pg.evaluate("!!document.getElementById('amb')")
TESTS_ALL = [(0,t0,False),(1,lambda p: climb(p,1),False),(2,t2,False),(3,t3,False),(4,t4,False),(5,t5,False),(6,t6,False),(7,t7,False),(8,t8,True),(11,t11,True),(13,t13,False),(14,t14,False),(18,t18,False)] + [(v,generic,False) for v in (19,20,21,22,23,25,26,30,33)] + [(31,t31,False),(32,t32,False),(34,t34,False),(37,t37,False),(38,t38,False),(40,t40,False),(41,t41,False),(43,t43,False),(44,t44,False),(45,t45,False)]
async def main():
    out = {}
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for v, fn, phone in TESTS:
            ctx = await b.new_context(**({"viewport":{"width":390,"height":844},"is_mobile":True,"has_touch":True} if phone else {"viewport":{"width":1280,"height":800}}))
            pg = await ctx.new_page(); errs = []
            pg.on("pageerror", lambda e: errs.append(str(e)))
            url = B + "versions/v%02d/" % v
            await pg.goto(url); await pg.wait_for_timeout(1500)
            bar = await pg.evaluate("!!document.querySelector('.vb')")
            home = await pg.evaluate("(document.querySelector('.vb .home')||{}).href||null")
            try: ok = await fn(pg)
            except Exception as e: ok = "ERR " + repr(e)[:120]
            await pg.goto(url); await pg.wait_for_timeout(800)
            await pg.evaluate("document.activeElement && document.activeElement.blur()"); await pg.keyboard.press("Escape"); await pg.wait_for_timeout(700)
            out["v%d" % v] = {"interaction": ok, "bar": bar, "home_is_root": home == B, "esc_returns": pg.url == B, "errors": errs}
            await ctx.close()
        pg = await b.new_page(); await pg.goto(B + "timeline/"); await pg.wait_for_timeout(800)
        out["timeline"] = {"rows": await pg.evaluate("document.querySelectorAll('#rows li').length"), "featured": await pg.evaluate("document.querySelectorAll('#rows li.feat').length"), "best_badge": await pg.evaluate("(document.querySelector('.badge.best')||{}).textContent")}
        await b.close()
    print(json.dumps(out, indent=1))
TESTS = TESTS_ALL
asyncio.run(main())

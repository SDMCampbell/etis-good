async def run(pg, mode, shot):
    r = {}
    h3 = lambda: pg.inner_text("#card h3")
    r["initial"] = await h3()
    if mode == "mobile":
        box = await pg.locator("#rail").bounding_box()
        await pg.touchscreen.tap(box["x"] + 8, box["y"] + box["height"]/2); await pg.wait_for_timeout(400)
        r["rail_left"] = await h3()
        await pg.touchscreen.tap(box["x"] + box["width"]*0.55, box["y"] + box["height"]/2); await pg.wait_for_timeout(400)
        r["rail_mid"] = await h3()
        await shot("rail")
        # tap a hold
        await pg.locator(".hold").nth(2).dispatch_event("pointerdown")
        await pg.wait_for_timeout(300); r["tap_hold2"] = await h3()
    else:
        tb = await pg.locator("#token").bounding_box()
        await pg.mouse.move(tb["x"]+15, tb["y"]+15); await pg.mouse.down()
        hb = await pg.locator(".hold").nth(3).bounding_box()
        await pg.mouse.move(hb["x"]+hb["width"]/2, hb["y"]+hb["height"]/2, steps=12)
        await pg.wait_for_timeout(200); await shot("dragging")
        await pg.mouse.up(); await pg.wait_for_timeout(400)
        r["drag_to_hold3"] = await h3()
        await shot("dragged")
        # keyboard
        await pg.focus("#token"); await pg.keyboard.press("Home"); await pg.wait_for_timeout(300)
        r["kb_home"] = await h3()
        await pg.keyboard.press("ArrowUp"); await pg.wait_for_timeout(600)
        r["kb_up"] = await h3(); r["live"] = await pg.inner_text("#live")
        await pg.keyboard.press("End"); await pg.wait_for_timeout(200)
        r["aria"] = await pg.get_attribute("#token", "aria-valuetext")
        # tab order: first tabbable elements
        await pg.goto("http://localhost:8765/"); await pg.wait_for_timeout(500)
        order = []
        for _ in range(6):
            await pg.keyboard.press("Tab")
            order.append(await pg.evaluate("document.activeElement.id || document.activeElement.textContent.trim().slice(0,20)"))
        r["tab"] = order
    await pg.evaluate("window.scrollTo(0, document.body.scrollHeight)")
    await pg.wait_for_timeout(300); await shot("bottom")
    await pg.screenshot(path=f"/tmp/etis-shots/r1-{mode}-full.png", full_page=True)
    return r

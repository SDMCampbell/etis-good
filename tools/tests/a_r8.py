async def run(pg, mode, shot):
    r = {}
    h3 = lambda: pg.inner_text("#card h3")
    if mode == "mobile":
        rb = await pg.locator("#route").bounding_box()
        r["route_box"] = [round(rb["width"]), round(rb["height"])]
        # horizontal swipe using CDP touch events
        cdp = await pg.context.new_cdp_session(pg)
        y = rb["y"] + rb["height"]*0.55
        async def touch(t, x): await cdp.send("Input.dispatchTouchEvent", {"type": t, "touchPoints": ([{"x": x, "y": y}] if t != "touchEnd" else [])})
        await touch("touchStart", rb["x"] + rb["width"] - 20)
        for k in range(1, 13): await touch("touchMove", rb["x"] + rb["width"] - 20 - k * (rb["width"] * 0.06))
        await shot("swiping"); await touch("touchEnd", 0); await pg.wait_for_timeout(500)
        r["after_swipe"] = await h3()
        # vertical swipe should NOT change the card
        before = await h3(); sy = await pg.evaluate("scrollY")
        x = rb["x"] + rb["width"]*0.5
        await cdp.send("Input.dispatchTouchEvent", {"type": "touchStart", "touchPoints": [{"x": x, "y": rb["y"]+rb["height"]*0.7}]})
        for k in range(1, 10): await cdp.send("Input.dispatchTouchEvent", {"type": "touchMove", "touchPoints": [{"x": x, "y": rb["y"]+rb["height"]*0.7 - k*20}]})
        await cdp.send("Input.dispatchTouchEvent", {"type": "touchEnd", "touchPoints": []}); await pg.wait_for_timeout(500)
        r["vertical_keeps_card"] = (await h3()) == before; r["scrolled"] = (await pg.evaluate("scrollY")) - sy
        await pg.evaluate("scrollTo(0,0)")
        await pg.locator(".hold").nth(1).tap(); await pg.wait_for_timeout(400); r["tap1"] = await h3()
        await shot("tapped")
        r["card_overflow"] = await pg.evaluate("(()=>{const c=document.querySelector('#card');return c.scrollHeight>c.clientHeight+2})()")
    else:
        await pg.focus("#token"); await pg.keyboard.press("Home"); await pg.wait_for_timeout(300); r["kb_home"] = await h3()
    return r

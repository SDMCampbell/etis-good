async def run(pg, mode, shot):
    r = {}
    await pg.goto("http://localhost:8765/timeline/?v=4"); await pg.wait_for_timeout(800)
    r["start"] = await pg.inner_text("#entry h3")
    await pg.keyboard.press("]"); await pg.wait_for_timeout(200); r["next_ms"] = await pg.inner_text("#entry h3")
    await pg.keyboard.press("["); await pg.keyboard.press("["); await pg.wait_for_timeout(200); r["prev2"] = await pg.inner_text("#entry h3")
    ab = await pg.locator("#alt").bounding_box()
    if mode == "mobile":
        await pg.touchscreen.tap(ab["x"] + ab["width"] - 20, ab["y"] + ab["height"] - 20)
    else:
        await pg.mouse.move(ab["x"] + 20, ab["y"] + ab["height"] - 20); await pg.mouse.down(); await pg.mouse.move(ab["x"] + ab["width"] - 20, ab["y"] + ab["height"] - 20, steps=8); await pg.mouse.up()
    await pg.wait_for_timeout(300); r["dragged"] = await pg.inner_text("#entry h3")
    await pg.keyboard.press("["); await pg.wait_for_timeout(100)
    await pg.check("#compare"); await pg.wait_for_timeout(1500)
    r["best_src"] = await pg.get_attribute("#bestFrame", "src"); r["frames"] = await pg.evaluate("document.querySelectorAll('#frames .frame-wrap:not([hidden])').length")
    await shot("compare")
    return r

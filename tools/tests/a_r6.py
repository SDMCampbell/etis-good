async def run(pg, mode, shot):
    r = {}
    await pg.locator("#register").scroll_into_view_if_needed(); await pg.wait_for_timeout(1500)
    r["initial"] = await pg.inner_text("#scrubNote h3")
    r["frame"] = await pg.get_attribute("#scrubIframe", "src")
    sb = await pg.locator("#altStrip").bounding_box()
    if mode == "mobile":
        await pg.touchscreen.tap(sb["x"] + 12, sb["y"] + sb["height"] - 10); await pg.wait_for_timeout(1200)
    else:
        await pg.mouse.move(sb["x"] + sb["width"] - 10, sb["y"] + 30); await pg.mouse.down()
        await pg.mouse.move(sb["x"] + 15, sb["y"] + 30, steps=8); await pg.mouse.up(); await pg.wait_for_timeout(1500)
    r["scrubbed"] = await pg.inner_text("#scrubNote h3"); r["frame2"] = await pg.get_attribute("#scrubIframe", "src")
    await shot("scrub")
    await pg.focus("#altStrip"); await pg.keyboard.press("End"); await pg.keyboard.press("ArrowLeft"); await pg.wait_for_timeout(300)
    r["kb"] = await pg.get_attribute("#altStrip", "aria-valuetext")
    return r

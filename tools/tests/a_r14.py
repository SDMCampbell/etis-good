async def run(pg, mode, shot):
    r = {}
    h3 = lambda: pg.inner_text("#card h3")
    await pg.click("#playBtn"); await pg.wait_for_timeout(500)
    r["p0"] = [await h3(), await pg.inner_text("#caption"), await pg.inner_text("#playLbl")]
    await shot("playing")
    await pg.wait_for_timeout(2700); r["p1"] = await h3()
    await pg.click("#playBtn"); await pg.wait_for_timeout(2800)
    r["paused_stays"] = [await h3(), await pg.inner_text("#playLbl")]
    await pg.click("#playBtn"); await pg.wait_for_timeout(300); r["resumed"] = await h3()
    # user input takes over
    await pg.focus("#token"); await pg.keyboard.press("End"); await pg.wait_for_timeout(2900)
    r["after_user"] = [await h3(), await pg.inner_text("#playLbl")]
    return r

async def run(pg, mode, shot):
    r = {}
    base = "http://localhost:8765/"
    await pg.click('#rack [data-skill="Angular"]'); await pg.wait_for_timeout(300)
    r["dim_holds"] = await pg.evaluate("document.querySelectorAll('.hold.dim').length")
    r["note"] = await pg.inner_text("#rackNote"); r["hash"] = await pg.evaluate("location.hash")
    r["card"] = await pg.inner_text("#card h3")
    await pg.click("[data-showwall]"); await pg.wait_for_timeout(900); await shot("spot-wall")
    await pg.keyboard.press("Escape"); await pg.wait_for_timeout(200)
    r["after_esc_dim"] = await pg.evaluate("document.querySelectorAll('.hold.dim').length")
    await pg.focus("#token"); await pg.keyboard.press("End"); await pg.wait_for_timeout(700)
    # bag chip spotlight on first screen
    await pg.click('#chips [data-skill="Drupal"]'); await pg.wait_for_timeout(300)
    r["bag_spot"] = await pg.inner_text("#spot")
    await shot("bag-spot")
    await pg.goto(base + "#skill=COBOL"); await pg.wait_for_timeout(700)
    r["deeplink_skill"] = [await pg.inner_text("#spot"), await pg.inner_text("#card h3")]
    await pg.goto(base + "#job=xgrok"); await pg.wait_for_timeout(700)
    r["deeplink_job"] = await pg.inner_text("#card h3")
    await pg.goto(base); await pg.wait_for_timeout(600)
    await pg.focus("#token"); await pg.keyboard.press("PageDown"); await pg.wait_for_timeout(500)
    r["hash_after_kb"] = await pg.evaluate("location.hash")
    return r

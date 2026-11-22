async def run(pg, mode, shot):
    r = {}
    if mode == "reduced": return r
    await pg.evaluate("navigator.serviceWorker.ready.then(()=>1)"); await pg.wait_for_timeout(800)
    await pg.reload(); await pg.wait_for_timeout(800)
    r["controlled"] = await pg.evaluate("!!navigator.serviceWorker.controller")
    await pg.context.set_offline(True)
    await pg.reload(); await pg.wait_for_timeout(1200)
    r["offline_h1"] = await pg.inner_text("#name")
    r["offline_card"] = await pg.inner_text("#card h3")
    r["note_visible"] = await pg.is_visible("#offline")
    await shot("offline")
    await pg.goto("http://localhost:8765/timeline/"); await pg.wait_for_timeout(800)
    r["offline_timeline"] = await pg.inner_text("h1")
    await pg.context.set_offline(False)
    return r

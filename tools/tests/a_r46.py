async def run(pg, mode, shot):
    r = {}
    try: await pg.context.grant_permissions(["clipboard-read", "clipboard-write"], origin="http://localhost:8765")
    except Exception as e: r["perm"] = str(e)[:80]
    await pg.wait_for_timeout(2600)
    await pg.locator("#links [data-copy]").click(); await pg.wait_for_timeout(450)
    if mode != "reduced": await shot("relay")
    await pg.wait_for_timeout(1300); await shot("copied")
    r["toast"] = await pg.evaluate("document.querySelector('.relay-toast').textContent")
    try: r["clip"] = await pg.evaluate("navigator.clipboard.readText()")
    except Exception as e: r["clip"] = "ERR " + str(e)[:60]
    r["btn"] = await pg.evaluate("document.querySelector('#links [data-copy]').textContent")
    return r

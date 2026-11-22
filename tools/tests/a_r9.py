async def run(pg, mode, shot):
    r = {}
    await pg.locator("#job-mindamp").scroll_into_view_if_needed(); await pg.wait_for_timeout(700)
    await pg.evaluate("document.getElementById('job-mindamp').scrollIntoView({block:'center'})"); await pg.wait_for_timeout(600)
    r["mini_on"] = await pg.evaluate("(document.querySelector('#mini a.on')||{}).dataset?.for || null")
    await shot("pitches")
    if mode == "desktop":
        await pg.click('#mini a[data-for="job-xgrok"]'); await pg.wait_for_timeout(900)
        r["after_click"] = await pg.evaluate("(document.querySelector('#mini a.on')||{}).dataset?.for || null")
        await pg.emulate_media(media="print")
        await pg.screenshot(path="/tmp/etis-shots/r9-print.png", full_page=True)
        await pg.emulate_media(media="screen")
        pdf = await pg.pdf(format="Letter", print_background=False)
        open("/tmp/etis-shots/r9.pdf","wb").write(pdf)
    return r

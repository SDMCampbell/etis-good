async def run(pg, mode, shot):
    await pg.wait_for_timeout(2600)
    r = {}
    await pg.evaluate("document.getElementById('sys-h').scrollIntoView()"); await pg.wait_for_timeout(1500)
    await pg.locator('.skill[data-skill="PHP"]').click(); await pg.wait_for_timeout(500)
    if mode != "reduced": await shot("dispatch-mid")
    await pg.wait_for_timeout(2500); await shot("dispatched")
    r["order"] = await pg.evaluate("[...document.querySelectorAll('#jobs > li')].map(li=>(li.classList.contains('used')?'*':'')+li.id.replace('job-',''))")
    r["note"] = await pg.evaluate("document.getElementById('dispatchNote').textContent")
    r["veiled"] = await pg.evaluate("document.querySelectorAll('.veiled').length")
    await pg.click("#dispatchX"); await pg.wait_for_timeout(2700)
    r["cleared"] = await pg.evaluate("[document.querySelectorAll('.used,.uses').length, document.querySelector('#jobs > li').id]")
    # keyboard: tab to a skill and press enter
    await pg.locator('.skill[data-skill="Drupal"]').focus(); await pg.keyboard.press("Enter"); await pg.wait_for_timeout(2700)
    r["kbd"] = await pg.evaluate("document.querySelectorAll('.job.used').length")
    return r

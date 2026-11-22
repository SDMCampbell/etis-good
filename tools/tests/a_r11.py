async def run(pg, mode, shot):
    r = {}
    if mode == "mobile":
        r["here0"] = await pg.evaluate("(document.querySelector('.pitchbar a.here')||{}).textContent||null")
        await pg.locator('.pitchbar a[data-sec="skills"]').tap(); await pg.wait_for_timeout(1500)
        r["here_rack"] = await pg.evaluate("(document.querySelector('.pitchbar a.here')||{}).textContent||null")
        r["skills_top"] = await pg.evaluate("Math.round(document.getElementById('skills').getBoundingClientRect().top)")
        await shot("rack")
        await pg.locator('.pitchbar a[data-sec="wall"]').tap(); await pg.wait_for_timeout(1500)
        r["here_wall"] = await pg.evaluate("(document.querySelector('.pitchbar a.here')||{}).textContent||null")
        await shot("wall")
    else:
        await pg.click('.bar a[data-sec="skills"]'); await pg.wait_for_timeout(1200)
        r["here"] = await pg.evaluate("(document.querySelector('.bar a.here')||{}).textContent||null")
        await shot("rack")
    return r

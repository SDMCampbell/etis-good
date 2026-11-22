CONTRAST = """(()=>{function lum(c){const m=c.match(/[\\d.]+/g).map(Number);const f=v=>{v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4)};return 0.2126*f(m[0])+0.7152*f(m[1])+0.0722*f(m[2])}
function bg(el){while(el){const b=getComputedStyle(el).backgroundColor;if(b&&!/rgba\\(0, 0, 0, 0\\)|transparent/.test(b))return b;el=el.parentElement}return 'rgb(18,15,42)'}
const out={};for(const sel of ['h1','.tagline','.kicker','.role','#card h3','#card li','.bar-link','.lede','.job h3','.job li','.mini a','#footLinks .btn']){const el=document.querySelector(sel);if(!el)continue;const a=lum(getComputedStyle(el).color),b=lum(bg(el));out[sel]=Math.round(((Math.max(a,b)+0.05)/(Math.min(a,b)+0.05))*10)/10}return out})()"""
async def run(pg, mode, shot):
    r = {}
    r["day_contrast"] = await pg.evaluate(CONTRAST)
    await pg.click("#themeBtn"); await pg.wait_for_timeout(300)
    r["theme"] = await pg.evaluate("document.documentElement.dataset.theme")
    r["night_contrast"] = await pg.evaluate(CONTRAST)
    if mode == "desktop":
        rb = await pg.locator("#route").bounding_box()
        await pg.mouse.move(rb["x"]+rb["width"]*0.6, rb["y"]+rb["height"]*0.35); await pg.wait_for_timeout(400)
    await shot("night")
    await pg.evaluate("document.getElementById('route-description').scrollIntoView()"); await pg.wait_for_timeout(300); await shot("night-jobs")
    await pg.reload(); await pg.wait_for_timeout(600)
    r["persisted"] = await pg.evaluate("document.documentElement.dataset.theme")
    return r

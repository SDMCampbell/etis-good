async def run(pg, mode, shot):
    r = {}
    r["og"] = await pg.evaluate("[...document.querySelectorAll('meta[property^=og],meta[name^=twitter]')].length")
    r["og_img_ok"] = await pg.evaluate("fetch('assets/og.png').then(x=>x.ok && x.headers.get('content-type'))")
    # top hold label not under the token at rest
    r["label_clear"] = await pg.evaluate("""(()=>{const t=document.getElementById('token').getBoundingClientRect();const holds=[...document.querySelectorAll('.hold')];const top=holds[holds.length-1].querySelector('text').getBoundingClientRect();
      const ov=!(top.right<t.left||top.left>t.right||top.bottom<t.top||top.top>t.bottom);return !ov})()""")
    await shot("labels")
    return r

AUDIT = """(()=>{
function rgb(c){const m=c.match(/[\\d.]+/g);if(!m)return null;return m.map(Number)}
function lum(c){const f=v=>{v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4)};return 0.2126*f(c[0])+0.7152*f(c[1])+0.0722*f(c[2])}
function bg(el){while(el){const cs=getComputedStyle(el);const b=rgb(cs.backgroundColor);if(b&&(b.length<4||b[3]>0.9))return b;el=el.parentElement}return rgb(getComputedStyle(document.body).backgroundColor)}
const bad=[];let n=0;
document.querySelectorAll('body *').forEach(el=>{
  if(!el.childNodes.length)return; const t=[...el.childNodes].filter(x=>x.nodeType===3&&x.textContent.trim()).length; if(!t)return;
  const r=el.getBoundingClientRect(); if(!r.width||!r.height)return; const cs=getComputedStyle(el); if(cs.visibility==='hidden'||+cs.opacity===0||cs.color.includes('0, 0, 0, 0'))return;
  if(el.closest('[aria-hidden=true]:not(.console)')||el.closest('dialog:not([open])')||el.closest('svg'))return;
  const fg=rgb(cs.color),b=bg(el); if(!fg||!b)return; n++;
  const a=lum(fg),c=lum(b),ratio=(Math.max(a,c)+0.05)/(Math.min(a,c)+0.05);
  const size=parseFloat(cs.fontSize),bold=+cs.fontWeight>=700,large=size>=24||(bold&&size>=18.66);
  if(ratio<(large?3:4.5))bad.push((el.id||el.className||el.tagName)+':'+ratio.toFixed(2)+':'+el.textContent.trim().slice(0,18));
});return {checked:n,fails:bad.slice(0,12)}})()"""
async def run(pg, mode, shot):
    if mode == "reduced": return {}
    r = {}
    await pg.goto("http://localhost:8765/#sortie=marco-promos"); await pg.wait_for_timeout(1400)
    r["night"] = await pg.evaluate(AUDIT)
    await pg.click("#themeBtn"); await pg.wait_for_timeout(400)
    r["theme"] = await pg.evaluate("document.documentElement.dataset.theme")
    r["day"] = await pg.evaluate(AUDIT)
    await shot("day")
    await pg.reload(); await pg.wait_for_timeout(600); r["persist"] = await pg.evaluate("document.documentElement.dataset.theme")
    await pg.evaluate("localStorage.removeItem('cockpit-theme')")
    return r

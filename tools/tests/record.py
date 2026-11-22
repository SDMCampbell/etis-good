"""record.py <json>: {v,title,verdict,featured,note,why,try,lesson,strongest,brief:{...}, snapshot:true, cycle_review:...}
Snapshots the site, appends to manifest + state, advances last_completed_version LAST."""
import json, sys, subprocess, re, datetime, os
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
r = json.loads(open(sys.argv[1]).read())
v = r["v"]
# 1. snapshot
subprocess.run(["python3", "tools/loop.py", "snapshot", str(v)], cwd=ROOT, check=True)
# 2. manifest
mp = ROOT + "/versions/manifest.js"; src = open(mp).read()
data = json.loads(re.search(r"window\.VERSIONS = (\{.*\});", src, re.S).group(1))
data["list"] = [e for e in data["list"] if e["v"] != v]
data["list"].append({k: r[k] for k in ("v","title","verdict","featured","note","why","try")} | {"date": datetime.date.today().isoformat()})
data["list"].sort(key=lambda e: e["v"])
for e in data["list"]:
    if e["v"] in r.get("retro_verdicts", {}): pass
for k, val in r.get("retro_verdicts", {}).items():
    for e in data["list"]:
        if e["v"] == int(k): e["verdict"] = val
data["current"] = r["strongest"]
head = src.split("window.VERSIONS")[0]
open(mp, "w").write(head + "window.VERSIONS = " + json.dumps(data, indent=2, ensure_ascii=False) + ";\n")
# 3. state (counter advanced last)
sp = ROOT + "/iteration-state.json"; st = json.load(open(sp))
st["strongest_version"] = r["strongest"]
st["brief"] = r["brief"]
st["history"] = [h for h in st["history"] if h["v"] != v] + [{"v": v, "title": r["title"], "verdict": r["verdict"], "lesson": r["lesson"]}]
if r.get("cycle_review"): st.setdefault("cycle_reviews", []).append(r["cycle_review"])
json.dump(st, open(sp, "w"), indent=2, ensure_ascii=False)
st["last_completed_version"] = v
json.dump(st, open(sp, "w"), indent=2, ensure_ascii=False)
print("recorded v%d; strongest=%d; target=%d" % (v, st["strongest_version"], st["target_version"]))

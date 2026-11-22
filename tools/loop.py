#!/usr/bin/env python3
"""
Iteration-loop helper for the etis-good site.

  python3 tools/loop.py snapshot <N>      copy the current site into versions/vNN/ (self-contained)
  python3 tools/loop.py restore <N>       restore the site root from versions/vNN/ (undo a rejected experiment)

Snapshots exclude the loop's own infrastructure (versions/, timeline/, tools/, state, dotfiles)
and get a small "version bar" injected so visitors can move between versions and jump back
to the current best in one action.
"""
import os, re, shutil, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INFRA = {".git", "versions", "timeline", "tools", "iteration-state.json", "README.md", "wrangler.jsonc", "wrangler.toml", "node_modules", "docs", "sw.js"}
BAR_RE = re.compile(r'\n?<script data-version-bar[^>]*></script>')
INFRA_LINK = re.compile(r'((?:href|src)=")((?:\.\./)*)(timeline|versions)/')
ROBOTS = '<meta name="robots" content="noindex">'


def site_entries():
    for name in sorted(os.listdir(ROOT)):
        if name in INFRA or name.startswith("."):
            continue
        yield name


def snapshot(n):
    dest = os.path.join(ROOT, "versions", "v%02d" % n)
    if os.path.exists(dest):
        shutil.rmtree(dest)
    os.makedirs(dest)
    for name in site_entries():
        src = os.path.join(ROOT, name)
        (shutil.copytree if os.path.isdir(src) else shutil.copy2)(src, os.path.join(dest, name))
    for dirpath, _, files in os.walk(dest):
        for f in files:
            if not f.endswith(".html"):
                continue
            p = os.path.join(dirpath, f)
            depth = os.path.relpath(p, ROOT).count(os.sep)  # versions/vNN/x.html -> 2
            rel = "../" * depth
            html = open(p, encoding="utf-8").read()
            html = BAR_RE.sub("", html)
            # links to shared infrastructure (register, manifest) must escape the snapshot folder
            html = INFRA_LINK.sub(lambda m: m.group(1) + "../../" + m.group(2) + m.group(3) + "/", html)
            tag = '<script data-version-bar data-v="%d" src="%stimeline/version-bar.js"></script>' % (n, rel)
            html = html.replace("</body>", tag + "\n</body>", 1)
            if ROBOTS not in html:
                html = html.replace("<head>", "<head>\n  " + ROBOTS, 1)
            open(p, "w", encoding="utf-8").write(html)
    print("snapshot ->", os.path.relpath(dest, ROOT))


def restore(n):
    src = os.path.join(ROOT, "versions", "v%02d" % n)
    if not os.path.isdir(src):
        sys.exit("no such snapshot: " + src)
    for name in site_entries():
        p = os.path.join(ROOT, name)
        shutil.rmtree(p) if os.path.isdir(p) else os.remove(p)
    for name in os.listdir(src):
        s = os.path.join(src, name)
        (shutil.copytree if os.path.isdir(s) else shutil.copy2)(s, os.path.join(ROOT, name))
    for dirpath, _, files in os.walk(ROOT):
        if any(seg in dirpath.split(os.sep) for seg in ("versions", ".git", "timeline", "tools")):
            continue
        for f in files:
            if f.endswith(".html"):
                p = os.path.join(dirpath, f)
                html = open(p, encoding="utf-8").read()
                html = BAR_RE.sub("", html).replace("\n  " + ROBOTS, "")
                html = re.sub(r'((?:href|src)=")\.\./\.\./((?:\.\./)*(?:timeline|versions)/)', r"\1\2", html)
                open(p, "w", encoding="utf-8").write(html)
    print("restored root from v%02d" % n)


if __name__ == "__main__":
    if len(sys.argv) != 3 or sys.argv[1] not in ("snapshot", "restore"):
        sys.exit(__doc__)
    {"snapshot": snapshot, "restore": restore}[sys.argv[1]](int(sys.argv[2]))

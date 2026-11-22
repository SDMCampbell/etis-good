# etis-good

Personal bio / resume site for **Samuel Campbell**, Full Stack Web Developer.

The resume comes in three interactive concepts. A floating switcher at the bottom of every page (or `Alt+1` / `Alt+2` / `Alt+3`) moves between them:

| Concept | Path | Idea |
|---|---|---|
| **Terminal** | `/terminal/` | A working shell: `help`, `ls`, `cat`, tab completion, command history |
| **Git Log** | `/gitlog/` | Career as a commit graph. Each job is a branch, and you can filter it by skill |
| **DoogOS** | `/desktop/` | A retro desktop with draggable windows, a skills explorer, and a "Start" menu |

The root `index.html` is a landing page that links to all three.

## Structure

```
index.html              landing page / concept picker
assets/
  resume-data.js        ← single source of truth for all resume content
  switcher.js           floating concept switcher (shared by every page)
terminal/               concept 1
gitlog/                 concept 2
desktop/                concept 3
```

There's no build step and no dependencies: just static HTML, CSS and vanilla JS.

## Editing content

Edit **`assets/resume-data.js`** only. All three concepts render from it. Look for the `TODO`s on the current AgFirst role (start date and highlights).

## Running locally

Any static server works. Pick one:

```bash
python -m http.server 8080        # then open http://localhost:8080
# or
npx serve .
```

Opening `index.html` directly from disk also works.

## Deploying

The site is plain static files, so it runs on GitHub Pages as-is (`.nojekyll` is included):
**Settings → Pages → Deploy from a branch → `main` / root**.
If your domain already points at this repo, push to `main` and it'll update.

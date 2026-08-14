# clinical-hours-tracker — Project Guide

## What this is
A single-page web tool that helps MFT graduate students track clinical and relational hours toward their program's graduation requirements. You enter your hours so far, a June 1 deadline, and (optionally) your current caseload; it shows progress rings, the weekly pace required to finish on time, and — from caseload — an estimated finish date. No account, no backend, nothing leaves the browser.

Live at https://maneetpaul.github.io/clinical-hours-tracker. Status: deployed and in active use.

## How to run it
No build step — it is static HTML/CSS/JS.
- Local preview: open `index.html` directly, or serve the folder: `npx serve -p 5500 .` (matches `.claude/launch.json`).
- Deploy: push to `main`; GitHub Pages serves the site automatically within a minute or two.

## Key files
- `index.html` — page structure and section markup
- `style.css` — all styling; design tokens live in `:root` at the top
- `app.js` — all logic: `render()`, the two donut charts (Chart.js), deadline presets, and the caseload finish-date projection
- `favicon.svg` — graduation-cap favicon
- `../local-version/MFT Hours Tracker.html` — archived original single-file version (pre-split), kept outside the repo

## Conventions & gotchas
- **Cache-busting:** browsers cache `app.js`/`style.css` hard because the filenames never change between deploys. The CSS/JS links in `index.html` carry a `?v=N` query — bump `N` whenever you change either file, or returning visitors get stale assets. This has bitten before.
- **Deadline presets** ("next June 1" / the following year) are computed from the current date in `app.js` — never hardcode the year.
- **Caseload assumption:** ~1 clinical hour per active client per week; that ratio drives the finish-date estimate.
- External libraries (Chart.js, canvas-confetti) and the Inter font load from CDNs.

## Standards this project depends on
- [[project-setup]] — repo structure, git conventions, documentation rules.
- **Hosting exception:** this project uses **GitHub** as its origin remote and **GitHub Pages** as its host, rather than the Frosty bare-repo standard. GitHub Pages serves directly from the repo, so the code must live on GitHub. See the decision log.

## Decisions
### 2026-08-14 — Keep GitHub instead of moving to Frosty
Why: the tool is deployed via GitHub Pages, which serves directly from the GitHub repo. Moving the remote to Frosty would take the live site offline.
Rejected: Frosty-only hosting (the `project-setup` default) — drops the live site. Adding Frosty as a second backup remote — deferred; revisit if off-GitHub backup becomes important.

### 2026-08-14 — De-embedded the GitHub token from git config
Why: the personal access token was stored in plaintext in `remote.origin.url` and had been syncing inside Google Drive (the project's previous location). Switched the remote to the tokenless HTTPS URL so `osxkeychain` handles auth. The exposed token is to be rotated on GitHub.

### 2026-08-14 — Brought under the project-setup standard after directory move
Why: the project moved out of Google Drive to `~/app projects/`. Added `.gitignore`, this `docs/` guide, and a thin `CLAUDE.md`. The folder is intentionally kept nested under a `mft-hours-tracker/` wrapper (alongside a `local-version/` archive) rather than flattened.

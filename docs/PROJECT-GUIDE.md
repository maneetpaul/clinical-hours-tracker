# clinical-hours-tracker — Project Guide

## What this is
A single-page web tool that helps MFT graduate students track total and relational hours toward their program's graduation requirements. You fill in four boxes (hours so far, optional weekly caseload) and pick a deadline; the answer appears directly below: the weekly pace needed and, from caseload, an estimated finish month. No account, no backend, nothing leaves the browser; numbers persist in `localStorage`.

Audience includes older, non-tech-savvy students, and it must keep working after the original author leaves the program — favour plain labelled inputs and plain language over cleverness.

Live at https://maneetpaul.github.io/clinical-hours-tracker. Status: deployed and in active use.

## Working rules

Project-specific rules for anyone working here, on top of the shared rules in [[app-projects-map]].

- Bump the `?v=N` cache-bust query on the CSS/JS links in `index.html` whenever `app.js` or `style.css` changes (see Conventions & gotchas).
- Pushing to `main` deploys the live site through GitHub Pages.

## How to run it
No build step — it is static HTML/CSS/JS.
- Local preview: open `index.html` directly, or serve the folder: `npx serve -p 5500 .` (matches `.claude/launch.json`).
- Deploy: push to `main`; GitHub Pages serves the site automatically within a minute or two.

## Key files
- `index.html` — page structure: the "Your numbers" form card, then the answer card
- `style.css` — all styling; colour and font tokens live in `:root` at the top, with dark-mode overrides right after
- `app.js` — all logic. `CONFIG` at the top holds every program-specific default (requirements, deadline month/day, hours per client, storage key); `compute()` does the math, `render()` updates the page
- `favicon.svg` — graduation-cap favicon
- `~/app projects/_archive/mft-hours-tracker-local-version/MFT Hours Tracker.html` — archived original single-file version (pre-split), kept outside the repo

## Conventions & gotchas
- **Cache-busting:** browsers cache `app.js`/`style.css` hard because the filenames never change between deploys. The CSS/JS links in `index.html` carry a `?v=N` query — bump `N` whenever you change either file, or returning visitors get stale assets. This has bitten before.
- **Deadline presets** ("next June 1" / the following year) are computed from the current date in `app.js` — never hardcode the year.
- **Caseload assumption:** ~1 hour per active client per week (`CONFIG.hoursPerClientPerWeek`); that ratio drives the finish estimate.
- **Wording:** say "total hours/clients", never "clinical". Don't describe relational as "couples and families" — it covers more. Projected finish dates are shown as month + year only, and gaps as rough weeks/months, because they are estimates.
- **No JS dependencies.** Progress bars and confetti are hand-written. The only external load is Google Fonts (Bricolage Grotesque + Instrument Sans), with system-font fallbacks.
- **Git auth:** pushes to GitHub use the `gh` CLI login (`gh auth setup-git`, set 2026-10-24) because the old `osxkeychain` entry was stale and made `git push` hang. If a push ever hangs again, run `gh auth status` and re-login.
- **Saved data** lives under the `localStorage` key `mft-hours:v1`. If the stored shape ever changes incompatibly, bump the key rather than migrating.

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
**Superseded 2026-10-29 — see "Flattened out of the `mft-hours-tracker/` wrapper".**

### 2026-10-24 — Redesign: simple form-then-answer layout, no libraries
Why: the old page repeated the same two-tile layout four times (hours, clients, donuts, pace cards) and put the answer below the fold, so it felt hard to navigate, especially on phones. New layout: one form card with four labelled boxes and a deadline picker, and directly under it one answer card with a single plain-language sentence plus a progress bar per requirement. Numbers now persist in `localStorage`. Chart.js and canvas-confetti were removed so nothing can rot.
Rejected: an "answer first" layout with concentric progress rings, a today→deadline timeline, +/− steppers and pre-filled example numbers — too much going on and confusing for less tech-savvy students. Exact projected finish dates — the estimate can't predict a day, so month + year only. Milestone taglines ("Building momentum") — said nothing useful. The term "clinical hours" — programs say "total hours".

### 2026-10-29 — Flattened out of the `mft-hours-tracker/` wrapper
Why: the wrapper made the folder name differ from the repo name and split Claude Code's per-folder memory, against the project-setup rule of one folder per project, nothing nested. The repo now lives at `~/app projects/clinical-hours-tracker/`; the old single-file version moved to `~/app projects/_archive/mft-hours-tracker-local-version/`.
Rejected: keeping the wrapper so the archive sat next to the repo — the archive is untracked and rarely opened, so proximity wasn't worth the mismatch.

# clinical-hours-tracker

Read `docs/PROJECT-GUIDE.md` first for context.
Setup and conventions: `~/obsidian-vault/AI/skills/project-setup.md`

## Documentation upkeep

Update documentation in the same session as the change, never as a later pass.
Deferred documentation does not get written.

**`docs/PROJECT-GUIDE.md`**
- Append to the decision log when a choice is made between real alternatives, an
  option is **rejected**, or an earlier decision is reversed. Entries are dated and
  never edited retroactively.
- Rewrite the current-state sections when run/build/test commands change, a key file
  appears, a gotcha surfaces, or dependencies change.
- Do not document routine implementation the code already shows, or anything
  recoverable in under a minute by reading the source.

**Shared standards** (`~/obsidian-vault/AI/standards/`)
- The test: *does this fact affect anything outside this project?* If yes, update the
  standard too — not only the project guide.
- Applies to Frosty paths, deploy steps, backup jobs, SSH, and permissions.
- Never copy a standard's content into the project guide. Reference it by name.
- If the vault is unreachable from this session, state plainly what changed and which
  standard needs it. Do not skip silently.
- If no standard covers the change, say so rather than inventing one.

## Working notes
- Static site, no build. Preview with `npx serve -p 5500 .` (see `.claude/launch.json`).
- Bump the `?v=N` cache-bust query on the CSS/JS links in `index.html` whenever you change `app.js` or `style.css`, or returning visitors get stale assets.
- Deployed via GitHub Pages on push to `main`. This project intentionally uses GitHub, not Frosty — see the PROJECT-GUIDE decision log.

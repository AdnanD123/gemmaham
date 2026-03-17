---
name: done
description: Finish current task — commit changes, run checks, and optionally create a PR. Use when you're done implementing and ready to wrap up.
---

# Finish Current Task

Wrap up the current feature branch with quality checks, commit, and optional PR creation.

## Workflow

### Step 1: Check Context

Run in parallel:
1. `git branch --show-current`
2. `git status --short`
3. `git diff --stat`

If on `main`, tell the developer there's no active task branch and suggest `/start`.
If no changes, inform and stop.

### Step 2: Quality Checks

Run sequentially:

1. **Build shared** (if types changed): `cd packages/shared && npm run build`
2. **Build web**: `npm run build`
3. **Translation check**: Quick scan for any `t("` keys missing from i18n files

If build fails, report the errors. Ask if they want to fix now or commit as-is.

### Step 3: Review Changes

Show a summary of all changes:
```
Changes to commit:
  Modified:  <count> files
  Added:     <count> files
  Deleted:   <count> files

  packages/shared:    <count> files
  packages/web:       <count> files
  packages/functions: <count> files
```

### Step 4: Commit

1. Stage specific files: `git add <files>` (not `git add .` — avoid secrets, .env, etc.)
2. Draft a commit message based on the changes
3. Show the message and ask for confirmation
4. Commit with:
   ```
   <type>: <description>

   Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
   ```
   Types: `feat`, `fix`, `refactor`, `style`, `docs`, `chore`

### Step 5: Push & PR (ask first)

Ask: "Want me to push and create a PR?"

If yes:
1. Push: `git push -u origin <branch>`
2. Create PR with `gh pr create`:
   - Title: `<type>: <description>`
   - Body: Summary of changes, files affected, test plan
3. Show PR URL

If no:
1. Just confirm the commit is done
2. They can push later

### Step 6: Confirm

```
Task complete!
  Branch:  <branch>
  Commit:  <hash> <message>
  Build:   PASS | FAIL
  PR:      <URL> | (not created)

Switch back to main? (y/n)
```

## Important Rules

- NEVER commit .env files, credentials, or secrets
- ALWAYS run build check before committing
- ALWAYS ask before pushing or creating a PR
- Create NEW commits, never amend
- Never use --no-verify
- If build fails, ask the developer — don't force commit broken code

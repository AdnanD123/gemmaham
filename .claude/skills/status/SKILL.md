---
name: status
description: Show current work status — branch, changes, recent commits, and project health. Quick overview of where things stand.
allowed-tools: Bash, Read, Glob, Grep
---

# Check Current Status

Show a quick overview of the current working state and project health.

## Gather Information

Run in parallel:
1. `git branch --show-current`
2. `git status --short`
3. `git log --oneline -5`
4. `git stash list`

If on a feature branch, also:
5. `git log main..HEAD --oneline` — commits on this branch
6. `git diff --stat main...HEAD` — total changes vs main

## Output

### On a feature branch:
```
Gemmaham Status

  Branch:   feature/<name>
  Commits:  <n> ahead of main
  Changes:  <n> modified, <n> new, <n> deleted
  Stashes:  <n>

Commits on this branch:
  <hash> <message>
  <hash> <message>

Working tree:
  M  packages/web/app/routes/company.dashboard.tsx
  A  packages/web/components/NotificationBell.tsx
  ?  packages/web/components/NotificationCenter.tsx

Quick actions:
  /review-code  — Review changes before committing
  /done         — Commit, push, and optionally create PR
  /check-types  — Run TypeScript check
```

### On main:
```
Gemmaham Status

  Branch:   main (no active task)
  Changes:  <clean | n uncommitted changes>
  Stashes:  <n>

Recent commits:
  <hash> <message>
  <hash> <message>

Quick actions:
  /start <task>      — Start a new feature branch
  /implement <feat>  — Full lifecycle implementation
  /check-types       — Run TypeScript check
  /audit-ui          — Audit design system consistency
```

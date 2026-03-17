---
name: start
description: Start a new task — create a feature branch and set up for development. Use when beginning work on a new feature, bug fix, or improvement.
argument-hint: <task description>
---

# Start a New Task

You are helping a developer start a new piece of work on the Gemmaham real estate platform.

## Input

The developer's message after `/start` describes what they want to work on. For example:
- "add notification bell to navbar"
- "fix house detail page missing customization section"
- "implement contractor applications page"

## Workflow

### Step 1: Confirm Scope

1. Parse the task description
2. Briefly identify which parts of the codebase are likely affected:
   - Which package(s): shared, web, functions
   - Which role(s): user, company, contractor
   - Which pages/components
3. Ask the developer to confirm before proceeding

### Step 2: Check Current State

1. Run `git status` — check for uncommitted changes
2. Run `git branch --show-current` — check if already on a feature branch
3. If there are uncommitted changes, warn and ask if they want to stash or commit first
4. If on a feature branch, suggest finishing current work first (`/done`)

### Step 3: Create Branch

1. Switch to main and pull: `git checkout main && git pull`
2. Create feature branch: `git checkout -b feature/<kebab-case-description>`
   - Branch names: lowercase, kebab-case, max 50 chars
   - Examples: `feature/notification-bell`, `fix/house-detail-customization`, `feature/contractor-applications`
3. Confirm:

```
Task started!
  Branch:  feature/<name>
  Scope:   <packages affected>
  Role(s): <user/company/contractor>

What would you like to start with?
```

## Important Rules

- ALWAYS pull latest main before branching
- Branch names should be descriptive but concise
- If the developer is on a feature branch with changes, don't silently switch — warn first
- For bug fixes, use `fix/` prefix instead of `feature/`
- For refactoring, use `refactor/` prefix

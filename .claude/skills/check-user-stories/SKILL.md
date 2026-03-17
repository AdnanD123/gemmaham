---
name: check-user-stories
description: Verify user stories against actual implementation. Checks if features described in docs/user-stories/ JSON files are actually working in the codebase. Use to audit feature completeness.
allowed-tools: Read, Grep, Glob, Bash, Agent
---

# Verify User Stories Against Implementation

Check whether the features described in user story JSON files are actually implemented and working.

## Workflow

### Step 1: Load User Stories

Read all JSON files from `docs/user-stories/`:
```bash
ls docs/user-stories/*.json
```

### Step 2: For Each Story File

Parse the JSON and for each test case:

1. **Check route exists**: If the story references a URL path, verify the route file exists in `packages/web/app/routes/`
2. **Check component exists**: If the story references a component, verify it exists in `packages/web/components/`
3. **Check functionality**: Use Grep to search for key function names, Firebase operations, or UI elements mentioned in the test steps
4. **Check i18n**: If the story mentions user-facing text, check it has translation keys

### Step 3: Run JSON Format Verification

```bash
node scripts/verify-user-stories.mjs
```

### Step 4: Report

```
User Story Audit

  Total story files:  <count>
  Total test cases:   <count>

  Verified:     <count> (route + component + logic confirmed)
  Partial:      <count> (route exists but incomplete)
  Missing:      <count> (not implemented)
  JSON format:  PASS | FAIL

Story: company-analytics.json
  [PASS] Revenue chart displays monthly data
  [PASS] Occupancy chart shows status breakdown
  [PARTIAL] Date range filtering — UI exists but missing custom range

Story: contractor-browse-projects.json
  [PASS] Browse available buildings
  [MISSING] Filter by contractor category match
  ...
```

### Step 5: Update (if requested)

If the user asks to update stories, modify the JSON to reflect current implementation status (pass/fail).

## Important

- This is a READ-ONLY audit by default — don't change code
- Cross-reference with the 3 role documentation files in `docs/` for expected features
- Focus on functional completeness, not pixel-perfect UI

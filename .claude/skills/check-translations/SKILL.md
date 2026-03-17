---
name: check-translations
description: Verify i18n translations are complete across all 3 languages (EN, BS, DE). Use when adding new UI text, after editing translation files, or to audit translation coverage.
allowed-tools: Read, Grep, Glob, Agent, Bash
---

# Check i18n Translation Completeness

You are auditing the translation files for Gemmaham to find missing or inconsistent keys across English (EN), Bosnian (BS), and German (DE).

## Workflow

### Step 1: Load Translation Files

Read all three translation files in parallel:
- `packages/web/lib/i18n/en.json` (English — source of truth)
- `packages/web/lib/i18n/bs.json` (Bosnian)
- `packages/web/lib/i18n/de.json` (German)

### Step 2: Deep Compare Keys

Recursively compare all keys in the JSON structure:

1. **Missing in BS**: Keys present in EN but missing in BS
2. **Missing in DE**: Keys present in EN but missing in DE
3. **Extra in BS**: Keys in BS not present in EN (possibly outdated)
4. **Extra in DE**: Keys in DE not present in EN (possibly outdated)
5. **Empty values**: Keys that exist but have empty string `""` as value
6. **Untranslated**: Values in BS or DE that are identical to EN (might be untranslated — flag but don't treat as errors, some words are the same across languages)

### Step 3: Check Usage

Use Grep to search `packages/web/` for `t("` and `t('` patterns to find translation keys used in code. Cross-reference with EN keys to find:
- **Unused keys**: In EN but never referenced in code
- **Missing keys**: Used in code but not in EN

### Step 4: Report

```
Translation Audit Report

  EN keys:  <count>
  BS keys:  <count> (<missing> missing, <extra> extra)
  DE keys:  <count> (<missing> missing, <extra> extra)

Missing in BS (<count>):
  - path.to.key1
  - path.to.key2

Missing in DE (<count>):
  - path.to.key1

Empty values (<count>):
  - bs: path.to.key3
  - de: path.to.key4

Unused keys (<count>):
  - path.to.old.key

Used but undefined (<count>):
  - path.to.new.key

Overall: PASS | NEEDS_FIXES
```

### Step 5: Fix (if requested)

If the user says "fix" or "add missing", copy the EN values to the missing keys in BS/DE as placeholders with a `[TODO: translate]` prefix so they're easy to find later.

## Important

- EN is always the source of truth
- Never delete keys from any file without asking
- Some identical values across languages are normal (brand names, technical terms)
- Translation files are large (~1500 keys) — be thorough but efficient

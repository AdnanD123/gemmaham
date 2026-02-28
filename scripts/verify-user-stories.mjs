#!/usr/bin/env node
/**
 * Verify all user stories have correct format
 *
 * Usage: node scripts/verify-user-stories.mjs
 */
import { readdirSync, readFileSync, statSync, existsSync } from "fs";
import { join, extname, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");
const userStoriesDir = join(rootDir, "docs", "user-stories");

let hasErrors = false;

function error(msg) {
  console.error(`  ✗ ${msg}`);
  hasErrors = true;
}

function success(msg) {
  console.log(`  ✓ ${msg}`);
}

function validateStory(story, index) {
  const issues = [];
  if (!story.description || typeof story.description !== "string") {
    issues.push(`[${index}].description must be a non-empty string`);
  }
  if (!Array.isArray(story.steps) || story.steps.length === 0) {
    issues.push(`[${index}].steps must be a non-empty array`);
  } else {
    story.steps.forEach((step, si) => {
      if (!step || typeof step !== "string") {
        issues.push(`[${index}].steps[${si}] must be a non-empty string`);
      }
    });
  }
  if (typeof story.passes !== "boolean") {
    issues.push(`[${index}].passes must be a boolean`);
  }
  return issues;
}

function validateDirectory(dir, prefix = "") {
  const entries = readdirSync(dir).sort();

  for (const entry of entries) {
    const entryPath = join(dir, entry);
    const stat = statSync(entryPath);

    if (stat.isDirectory()) {
      console.log(`${prefix}${entry}/`);
      validateDirectory(entryPath, prefix + "  ");
      continue;
    }

    if (extname(entry) !== ".json") {
      error(`${prefix}${entry} - not a .json file`);
      continue;
    }

    try {
      const content = readFileSync(entryPath, "utf-8");
      const json = JSON.parse(content);

      if (!Array.isArray(json) || json.length === 0) {
        error(`${prefix}${entry} - must be a non-empty array`);
        continue;
      }

      const allIssues = [];
      json.forEach((story, i) => {
        allIssues.push(...validateStory(story, i));
      });

      if (allIssues.length > 0) {
        error(`${prefix}${entry} - invalid schema`);
        allIssues.forEach((issue) => console.log(`${prefix}    ${issue}`));
      } else {
        const passing = json.filter((f) => f.passes).length;
        const total = json.length;
        success(`${prefix}${entry} (${passing}/${total} passing)`);
      }
    } catch (e) {
      if (e instanceof SyntaxError) {
        error(`${prefix}${entry} - invalid JSON: ${e.message}`);
      } else {
        error(`${prefix}${entry} - ${e}`);
      }
    }
  }
}

console.log(`\nVerifying user stories...\n`);

if (!existsSync(userStoriesDir)) {
  console.log("No docs/user-stories directory found\n");
  process.exit(0);
}

validateDirectory(userStoriesDir);

console.log();

if (hasErrors) {
  console.log("Verification failed\n");
  process.exit(1);
} else {
  console.log("All user stories valid\n");
  process.exit(0);
}

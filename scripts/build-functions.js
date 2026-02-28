import { execSync } from "node:child_process";

// Build shared first (functions types depend on it at compile time)
execSync("npm run build --workspace=packages/shared", { stdio: "inherit" });

// Build functions (compiled JS has no @gemmaham/shared references)
execSync("npm run build --workspace=packages/functions", { stdio: "inherit" });

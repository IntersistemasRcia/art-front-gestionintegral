import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const expectedByDeployment = {
  development: "DEVELOPMENT",
  test: "TEST",
  production: "PRODUCTION",
};

const deployment = process.argv[2]?.trim().toLowerCase();
const expected = expectedByDeployment[deployment];

if (!expected) {
  throw new Error(
    "Usage: node scripts/validate-app-environment.mjs <development|test|production>",
  );
}

const envFile = resolve(".env.production");
const contents = readFileSync(envFile, "utf8");
const environmentLine = contents
  .split(/\r?\n/)
  .find((line) => /^\s*NEXT_PUBLIC_APP_ENVIRONMENT\s*=/.test(line));

if (!environmentLine) {
  throw new Error(
    `[environment] ${envFile} must define NEXT_PUBLIC_APP_ENVIRONMENT=${expected} for a ${deployment} deployment.`,
  );
}

const configured = environmentLine
  .replace(/^\s*NEXT_PUBLIC_APP_ENVIRONMENT\s*=\s*/, "")
  .trim()
  .replace(/^(['"])(.*)\1$/, "$2")
  .toUpperCase();

if (configured !== expected) {
  throw new Error(
    `[environment] NEXT_PUBLIC_APP_ENVIRONMENT must be ${expected} for a ${deployment} deployment.`,
  );
}

console.log(`[environment] ${deployment} configuration validated.`);

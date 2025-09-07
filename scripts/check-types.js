// TypeScript check script that ignores file arguments from lint-staged
// This allows us to use --project flag without conflicts

import { execSync } from 'child_process';

console.log("Running TypeScript check...");

try {
  execSync('npx tsc --project tsconfig.check.json --noEmit', { 
    stdio: 'inherit',
    cwd: process.cwd()
  });
  console.log("✅ TypeScript check passed!");
} catch (error) {
  console.error("❌ TypeScript check failed!");
  process.exit(1);
}

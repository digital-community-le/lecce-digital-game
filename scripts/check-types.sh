#!/bin/bash
# TypeScript check script that ignores file arguments from lint-staged
# This allows us to use --project flag without conflicts

echo "Running TypeScript check..."
npx tsc --project tsconfig.check.json --noEmit

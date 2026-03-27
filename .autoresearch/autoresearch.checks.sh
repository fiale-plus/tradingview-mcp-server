#!/bin/bash
set -euo pipefail

echo "=== Type checking ==="
npx tsc --noEmit

echo "=== Running ALL tests ==="
npx tsx --test src/tests/*.test.ts

echo "=== Checks passed ==="

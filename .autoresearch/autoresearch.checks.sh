#!/bin/bash
set -euo pipefail

echo "=== Building ==="
npm run build 2>&1 | tail -3

echo "=== Running tests ==="
npm test 2>&1 | tail -20

echo "=== Checks passed ==="
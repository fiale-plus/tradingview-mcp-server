#!/bin/bash
set -euo pipefail

command -v npx >/dev/null 2>&1 || { echo "ERROR: npx not found"; exit 1; }

# Run CLI tests with coverage
output=$(npx tsx --test --experimental-test-coverage src/tests/cli.test.ts 2>&1)

# Extract test count
test_count=$(echo "$output" | grep "^ℹ tests " | awk '{print $NF}')
pass_count=$(echo "$output" | grep "^ℹ pass " | awk '{print $NF}')
fail_count=$(echo "$output" | grep "^ℹ fail " | awk '{print $NF}')

echo "METRIC test_count=$test_count"
echo "METRIC pass_count=$pass_count"
echo "METRIC fail_count=$fail_count"

# Extract branch coverage for CLI modules (pipe-delimited table)
formatters_branch=$(echo "$output" | grep "formatters.ts" | awk -F'|' '{gsub(/[[:space:]]/, "", $3); print $3}')
parseargs_branch=$(echo "$output" | grep "parseArgs.ts" | awk -F'|' '{gsub(/[[:space:]]/, "", $3); print $3}')
all_branch=$(echo "$output" | grep "all files" | awk -F'|' '{gsub(/[[:space:]]/, "", $3); print $3}')

echo "METRIC formatters_branch=$formatters_branch"
echo "METRIC parseargs_branch=$parseargs_branch"
echo "METRIC all_branch=$all_branch"

---
metric: coverage
measurement_command: "npx tsx --test --experimental-test-coverage src/tests/cli.test.ts 2>&1"
scope: src/cli/
mode: solo
cycles: 10
round: 1
target: "branch coverage >= 100% for CLI modules, test count >= 55"
backpressure:
  - "npx tsx --test src/tests/*.test.ts"
direction: maximize
checks_timeout_seconds: 300
created: 2026-03-28T00:00:00Z
prior_findings: []
---

# Autoresearch Configuration

Optimizing CLI test verification quality. Focus on branch coverage gaps in parseArgs.ts
and meaningful edge case tests for the new tradingview-cli module.

---
metric: custom
measurement_command: "bash .autoresearch/autoresearch.sh"
scope: .repo-arch pipeline + src/tools training generation
mode: solo
cycles: 50
round: 1
target: "composite_score >= 85 (keyword >= 95, embedding >= 90, diversity >= 0.8, val_loss < 2.0 if trainable)"
backpressure:
  - "node /opt/homebrew/lib/node_modules/@fiale-plus/repo-arch/dist/cli.js mine-history --repo . --out .repo-arch/history.jsonl"
  - "node /opt/homebrew/lib/node_modules/@fiale-plus/repo-arch/dist/cli.js cards --repo . --out .repo-arch/cards.jsonl"
  - "npm run build"
  - "npm test"
direction: maximize
checks_timeout_seconds: 300
created: 2026-05-14T02:10:00Z
prior_findings: []
---

# Autoresearch Configuration: repo-arch Training Quality Deep Sweep

Optimize the quality of repo-arch generated training data and model training for this repository.

Key levers:
- Card confidence thresholds (min-confidence filtering)
- Card acceptance curation (reject noisy cards)
- Training data diversity (reduce near-duplicates)
- Embedding model selection (try larger models)
- LoRA hyperparameters (layers, learning rate, iters)
- Negative example generation quality

Composite metric:
  - keyword_hit_rate (weight: 30%)
  - embedding_hit_rate (weight: 30%)
  - diversity_score = unique_prefixes/total (weight: 20%)
  - val_loss improvement (weight: 20%, if model trainable)

Baseline:
  - keyword: 92.1% (35/38)
  - embedding: 81.6% (31/38)
  - diversity: 87/108 unique user prefixes = 0.806
  - val_loss: unknown (not yet trained)
#!/bin/bash
set -euo pipefail

# autoresearch benchmark script for repo-arch training quality
# Outputs: METRIC name=value lines for composite scoring

CLI="/opt/homebrew/lib/node_modules/@fiale-plus/repo-arch/dist/cli.js"
REPO="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"

# Step 1: Regenerate cards with current state
node "$CLI" cards --repo "$REPO" --invalidate 2>/dev/null || true
node "$CLI" cards --repo "$REPO" --out "$REPO/.repo-arch/cards.jsonl" 2>/dev/null

# Step 2: Run eval to get hit rates
EVAL_JSON=$(node "$CLI" eval --repo "$REPO" --json 2>/dev/null)

# Parse keyword and embedding hit rates
KEYWORD_RATE=$(echo "$EVAL_JSON" | node -e "
  const d = JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
  const kw = d.strategies.find(s => s.strategy === 'keyword');
  console.log(kw ? kw.hitRate : 0);
" 2>/dev/null || echo "0")

EMBEDDING_RATE=$(echo "$EVAL_JSON" | node -e "
  const d = JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
  const em = d.strategies.find(s => s.strategy === 'embedding');
  console.log(em ? em.hitRate : 0);
" 2>/dev/null || echo "0")

# Step 3: Generate dataset and analyze diversity
DATASET_JSON=$(node "$CLI" dataset --repo "$REPO" --json 2>/dev/null)

TOTAL_EXAMPLES=$(echo "$DATASET_JSON" | node -e "
  const d = JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
  console.log(d.examples ? d.examples.length : 0);
" 2>/dev/null || echo "0")

QA_COUNT=$(echo "$DATASET_JSON" | node -e "
  const d = JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
  console.log(d.counts && d.counts.qa ? d.counts.qa : 0);
" 2>/dev/null || echo "0")

REVIEW_COUNT=$(echo "$DATASET_JSON" | node -e "
  const d = JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
  console.log(d.counts && d.counts['review-warning'] ? d.counts['review-warning'] : 0);
" 2>/dev/null || echo "0")

RISK_COUNT=$(echo "$DATASET_JSON" | node -e "
  const d = JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
  console.log(d.counts && d.counts['risk-classification'] ? d.counts['risk-classification'] : 0);
" 2>/dev/null || echo "0")

NEGATIVE_COUNT=$(echo "$DATASET_JSON" | node -e "
  const d = JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
  console.log(d.counts && d.counts.negative ? d.counts.negative : 0);
" 2>/dev/null || echo "0")

ACCEPTED_CARDS=$(echo "$DATASET_JSON" | node -e "
  const d = JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
  console.log(d.acceptedCards || 0);
" 2>/dev/null || echo "0")

TOTAL_CARDS=$(echo "$DATASET_JSON" | node -e "
  const d = JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
  console.log(d.totalCards || 0);
" 2>/dev/null || echo "0")

# Step 4: Analyze training data diversity from the train.jsonl
TRAIN_FILE="$REPO/.repo-arch/train-data/train.jsonl"
if [ -f "$TRAIN_FILE" ]; then
  DIVERSITY=$(node -e "
    const fs = require('fs');
    const lines = fs.readFileSync('$TRAIN_FILE','utf8').trim().split('\n');
    const examples = lines.map(l => JSON.parse(l));
    const prefixes = new Set(examples.map(e => e.messages[0].content.slice(0,60)));
    console.log(prefixes.size / examples.length);
  " 2>/dev/null || echo "0")
else
  DIVERSITY="0"
fi

# Step 5: Compute composite score
# keyword: 30%, embedding: 30%, diversity: 20%, coverage bonus: 20%
# Coverage = acceptedCards/totalCards (curation quality)
COVERAGE=$(node -e "const a=$ACCEPTED_CARDS,t=$TOTAL_CARDS; console.log(t>0?a/t:0)" 2>/dev/null || echo "0")

COMPOSITE=$(node -e "
  const kw = $KEYWORD_RATE;
  const em = $EMBEDDING_RATE;
  const div = $DIVERSITY;
  const cov = $COVERAGE;
  // Weighted composite: each component 0-1 scale, composite 0-100
  const score = (kw * 30 + em * 30 + div * 20 + cov * 20);
  console.log(score.toFixed(2));
" 2>/dev/null || echo "0")

# Output METRIC lines
echo "METRIC keyword_hit_rate=$KEYWORD_RATE"
echo "METRIC embedding_hit_rate=$EMBEDDING_RATE"
echo "METRIC diversity=$DIVERSITY"
echo "METRIC coverage=$COVERAGE"
echo "METRIC composite_score=$COMPOSITE"
echo "METRIC total_examples=$TOTAL_EXAMPLES"
echo "METRIC accepted_cards=$ACCEPTED_CARDS"
echo "METRIC total_cards=$TOTAL_CARDS"
echo "METRIC qa_count=$QA_COUNT"
echo "METRIC review_count=$REVIEW_COUNT"
echo "METRIC risk_count=$RISK_COUNT"
echo "METRIC negative_count=$NEGATIVE_COUNT"
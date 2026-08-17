# Repo-Arch Hooks: Integrating the Local Model into Pi Agent Flows

This guide shows how to use repo-arch's trained model and context packs across common coding workflows.

---

## Hook 1: Pre-Edit Risk Assessment

**When**: Before editing a file, check if this file has historical patterns.

```typescript
// In a pi agent tool registration or pre-edit hook:
import { whyContextPack } from '@fiale-plus/repo-arch/context-pack';

// Before editing src/tools/screen.ts:
const riskContext = whyContextPack(
  'src/tools/screen.ts',
  cards.filter(c => c.affectedFiles.includes('src/tools/screen.ts')),
  5,    // commit count
  { fixCount: 2, changesCount: 8 },
  ['src/index.ts']  // co-change partners
);

// Inject into agent context:
// "⚠️ High-churn file (8 changes). Co-changes with src/index.ts.
//  Repeated fixes found. Consider regression tests before editing."
```

**CLI equivalent**:
```bash
repo-arch why src/tools/screen.ts --json
```

---

## Hook 2: Pre-Code-Review Warning

**When** reviewing a pull request or diff — surface regression risk by cross-referencing changed files against card history.

```typescript
import { diffContextPack } from '@fiale-plus/repo-arch/context-pack';

const diffRisk = diffContextPack(
  'main',
  'feature-branch',
  ['src/index.ts', 'src/tools/screen.ts'],
  [
    { file: 'src/index.ts', severity: 'high', message: '2 repeated fixes, co-change cluster with screen.ts' },
    { file: 'src/tools/screen.ts', severity: 'medium', message: '8 changes, test gap detected' },
  ]
);

// Injects: "HIGH RISK: src/index.ts has a history of repeated fixes.
//            MEDIUM: src/tools/screen.ts changed 8 times with no test updates."
```

**CLI equivalent**:
```bash
repo-arch check-diff --base main --json
```

---

## Hook 3: Session-Start Project Memory

**When** starting work on this project, load the full card set as structured memory.

```typescript
import { cardsContextPack } from '@fiale-plus/repo-arch/context-pack';
import { generateCards, cachedOrGenerate } from '@fiale-plus/repo-arch';

// At agent initialization:
const { cards } = cachedOrGenerate(repoRoot, generateFn);
const memory = cardsContextPack('tradingview-mcp-server', cards, headSha, false);

// memory.text == "Repo-Arch Cards for tradingview-mcp-server (47 commits, 18 cards)"
// Each card includes: type, title, confidence, affectedFiles, and suggestion text.
```

---

## Hook 4: Trained Model Inference via CLI

**When** you need the trained LoRA model to answer a project-specific question:

```bash
# Load the model + adapter and query:
mlx_lm.generate \
  --model Qwen/Qwen2.5-Coder-1.5B-Instruct \
  --adapter-path .repo-arch/adapters/repo-arch-97d42df \
  --prompt "<|im_start|>user\nWhat keeps breaking in src/index.ts?<|im_end|>\n<|im_start|>assistant\n" \
  --max-tokens 100
```

**Example output**: "Repeated fixes in: src/index.ts. This file was fixed 2 times."

---

## Hook 5: Automated Card-Based Guardrails

**When** an action would touch a file with known patterns.

```bash
# Semantic search for similar problems
repo-arch similar "token-only auth middleware vulnerability" --json
# → Returns: past cards about auth, middleware, security patterns

# Staleness check before refactoring
repo-arch check-stale --json
# → Detects: cards pointing to files that were moved or deleted

# File explanation for onboarding
repo-arch why src/api/client.ts --json
# → Returns: fix count, co-change partners, signal breakdown
```

---

## Hook 6: Continuous Training Loop

When new git history accumulates, continue the training loop:

```bash
# After N more commits:
repo-arch flow run --repo .
# → Re-mines history, regenerates cards with new data

repo-arch train resume --repo .
# → Resumes from latest adapter checkpoint, adds more iterations
# → Model incrementally learns new patterns without catastrophic forgetting
```

---

## Integration Architecture Diagram

```
Git History ──→ repo-arch flow ──→ Cards ──→ Dataset ──→ LoRA Training
      │                            │          │              │
      │                            ▼          ▼              ▼
      │                    context-pack   train.jsonl   adapters.safetensors
      │                    (pi agent)     (61 examples)  (1.3M params)
      ▼
repo-arch why/check-diff
(pre-edit / pre-review hooks)
```

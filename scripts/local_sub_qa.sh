#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
mkdir -p qa-reports

echo "=== 1. Running unit tests + WebGL Playwright E2E + comparison_grid.png ==="
node --test --experimental-test-coverage tests/unit.test.js | tee qa-reports/unit_test.log
python3 tests/e2e_verify.py | tee qa-reports/e2e_test.log

if command -v claude >/dev/null 2>&1; then
  echo "=== 2. Running Claude CLI (Subscription) Reproducibility Audit ==="
  claude -p "$(cat .qa/claude_prompt.md)" > qa-reports/qa_report_claude.md
else
  echo "SKIP: 'claude' CLI not found. Open claude.ai/code with .qa/claude_prompt.md"
fi

if command -v codex >/dev/null 2>&1; then
  echo "=== 3. Running Codex CLI (Subscription) Reproducibility Audit ==="
  codex exec -i .qa/comparison_grid.png -i .qa/reference/thumb_maxres.jpg "$(cat .qa/gpt_prompt.md)" -o qa-reports/qa_report_gpt.md || \
    codex "$(cat .qa/gpt_prompt.md)" > qa-reports/qa_report_gpt.md
else
  echo "SKIP: 'codex' CLI not found. Open chatgpt.com/codex with .qa/gpt_prompt.md"
fi

if command -v gh >/dev/null 2>&1 && { [ -s qa-reports/qa_report_claude.md ] || [ -s qa-reports/qa_report_gpt.md ]; }; then
  BODY="# Cross-Model Original-Video Reproducibility Audit ($(git rev-parse --short HEAD))\n\n"
  [ -s qa-reports/qa_report_claude.md ] && BODY+="## Claude Audit\n\n$(cat qa-reports/qa_report_claude.md)\n\n---\n\n"
  [ -s qa-reports/qa_report_gpt.md ] && BODY+="## Codex / GPT Audit\n\n$(cat qa-reports/qa_report_gpt.md)\n"
  printf "%b" "$BODY" | gh issue comment 1 --body-file -
fi

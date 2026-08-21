#!/bin/bash
# CI用: spec-claims の鮮度チェック
# 180日超の checkedAt があれば exit 1
set -euo pipefail

echo "=== spec-claims freshness check (180-day threshold) ==="
node scripts/spec-claims.mjs freshness --threshold-days 180
EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ]; then
  echo ""
  echo "❌ spec-claims freshness check FAILED"
  echo "Run: node scripts/spec-claims.mjs freshness --threshold-days 180"
  echo "Then update each article with: node scripts/spec-claims.mjs update --article-id <id> --checked-at <date>"
  exit 1
fi

echo "✅ All spec-claims within freshness threshold"

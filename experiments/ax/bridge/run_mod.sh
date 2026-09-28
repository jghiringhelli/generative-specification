#!/usr/bin/env bash
# run_mod.sh [K] — modification arm: add GET /api/articles/count to each twin, measure cost per correct line.
# Snapshots + restores src so the frozen twins stay frozen. Sentinel (CLAUDE.md) present. Static success:
# tsc --noEmit passes AND the `articlesCount` feature is wired.
BR="$(cd "$(dirname "$0")" && pwd)"
K="${1:-3}"
MODEL="${2:-claude-sonnet-4-5}"
OUTDIR="${3:-$BR/runs}"
mkdir -p "$OUTDIR"
echo "MOD arm: K=$K model=$MODEL outdir=$OUTDIR"
loc(){ find "$1" -name '*.ts' -print0 | xargs -0 cat 2>/dev/null | wc -l; }

for twin in M D; do
  T="$BR/$twin"
  for rep in $(seq 0 $((K-1))); do
    out="$OUTDIR/mod_${twin}_${rep}"
    before=$(loc "$T/src")
    rm -rf "$T/.srcbak"; cp -r "$T/src" "$T/.srcbak"
    ( cd "$T" && printf '%s' "$(cat "$BR/MOD_PROMPT.md")" | claude -p --output-format stream-json --verbose --dangerously-skip-permissions --model "$MODEL" > "$out.raw" 2>&1 )
    after=$(loc "$T/src")
    net=$((after - before))
    tscok=0; ( cd "$T" && npx tsc --noEmit >/dev/null 2>&1 ) && tscok=1
    wired=0; grep -rqi "articlesCount" "$T/src" && wired=1
    node "$BR/mod_metric.cjs" "$out.json" "$out.raw" "$twin" "$rep" "$net" "$tscok" "$wired"
    rm -rf "$T/src"; mv "$T/.srcbak" "$T/src"
  done
done
echo "=== MOD SUMMARY (cost per correct line: bridge D vs obscure M) ==="
node "$BR/mod_agg.cjs" "$OUTDIR"

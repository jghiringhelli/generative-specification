#!/usr/bin/env bash
# run_ioc.sh [K] — enforced-scope (IoC) comprehension arm.
# The reader gets ONLY a curated surface (sentinel + interfaces + test contracts), NO implementation,
# tools OFF (cannot sweep). Tests JC's claim: the bridge cuts tokens IFF scope is enforced.
BR="$(cd "$(dirname "$0")" && pwd)"
K="${1:-3}"
mkdir -p "$BR/runs"

buildD(){ cat "$BR/INTENT_PROBE.md"; echo; echo "--- NAVIGATION MAP (CLAUDE.md) ---"; cat "$BR/D/CLAUDE.md"; echo;
  echo "--- PORT / REPOSITORY INTERFACES ---"; cat "$BR/D/src/domain/repositories/"*.ts; echo;
  echo "--- BEHAVIORAL TEST SUITE (contracts) ---"; cat "$BR/D/src/__tests__/"*.ts; echo; echo "=== END MATERIAL ==="; }
buildM(){ cat "$BR/INTENT_PROBE.md"; echo; echo "--- NAVIGATION MAP (CLAUDE.md) ---"; cat "$BR/M/CLAUDE.md"; echo;
  echo "--- (this codebase has NO interface / port layer) ---"; echo;
  echo "--- BEHAVIORAL TEST SUITE (contracts) ---"; cat "$BR/M/src/__tests__/"*.ts; echo; echo "=== END MATERIAL ==="; }
buildD > "$BR/runs/bundle_D.txt"; buildM > "$BR/runs/bundle_M.txt"

echo "surface bytes: D=$(wc -c < "$BR/runs/bundle_D.txt") M=$(wc -c < "$BR/runs/bundle_M.txt")"
echo "M implementation (routes) bytes = the sweep penalty if the surface is insufficient: $(cat "$BR/M/src/routes/"*.ts | wc -c)"
echo "D implementation (services+repos+controllers) bytes: $(cat "$BR/D/src/application/services/"*.ts "$BR/D/src/infrastructure/repositories/"*.ts "$BR/D/src/presentation/controllers/"*.ts | wc -c)"

for twin in M D; do
  for rep in $(seq 0 $((K-1))); do
    out="$BR/runs/ioc_${twin}_${rep}.json"
    claude -p --tools "" --output-format json --dangerously-skip-permissions --model claude-sonnet-4-5 < "$BR/runs/bundle_${twin}.txt" > "$out.raw" 2>&1
    node -e "const fs=require('fs');let j;try{j=JSON.parse(fs.readFileSync('$out.raw','utf8'))}catch(e){j={parse_error:e.message}};const u=j.usage||{};const r=j.result||'';const insuf=(r.match(/INSUFFICIENT/gi)||[]).length;fs.writeFileSync('$out',JSON.stringify({twin:'$twin',rep:$rep,in_tokens:u.input_tokens,out_tokens:u.output_tokens,cost:j.total_cost_usd,insufficient:insuf,result:r.slice(0,700)},null,2));console.log('$twin rep$rep in_tokens='+u.input_tokens+' out='+u.output_tokens+' insufficient='+insuf)"
  done
done
echo "=== IOC SUMMARY ==="
node -e "const fs=require('fs'),p='$BR/runs';['M','D'].forEach(t=>{const a=fs.readdirSync(p).filter(f=>f.startsWith('ioc_'+t+'_')&&f.endsWith('.json')).map(f=>JSON.parse(fs.readFileSync(p+'/'+f,'utf8')));const md=x=>{const s=[...x].sort((a,b)=>a-b);return s[Math.floor(s.length/2)]};console.log(t,'in_tokens median='+md(a.map(x=>x.in_tokens)),'raw='+JSON.stringify(a.map(x=>x.in_tokens)),'insufficient='+JSON.stringify(a.map(x=>x.insufficient)))})"

#!/usr/bin/env bash
# ollama_mod.sh [K] [MODEL] — capacity test: cross-cutting readingTime change on a LOCAL weak model.
# M gets its 489-line God-class; D gets its centralized service. Which can the weak model handle?
BR="$(cd "$(dirname "$0")" && pwd)"
K="${1:-3}"; MODEL="${2:-llama3.2:3b}"
OUT="$BR/runs/ollama_$(echo "$MODEL" | tr ':/.' '___')"
mkdir -p "$OUT"
echo "ollama mod arm: K=$K model=$MODEL out=$OUT"
run(){ node "$BR/ollama_mod.cjs" "$BR/$1" "$2" "$MODEL" "$3" "$OUT/omod_${1}_${3}.json"; }
for rep in $(seq 0 $((K-1))); do
  run M "src/routes/articles.ts" "$rep"
  run D "src/application/services/ArticleService.ts" "$rep"
done
echo "=== SUMMARY $MODEL ==="
node -e "const fs=require('fs'),p=process.argv[1];['M','D'].forEach(t=>{const a=fs.readdirSync(p).filter(f=>f.startsWith('omod_'+t+'_')&&f.endsWith('.json')).map(f=>JSON.parse(fs.readFileSync(p+'/'+f,'utf8')));const s=k=>a.reduce((x,o)=>x+(o[k]||0),0);console.log(t,'n='+a.length,'extracted='+s('extracted')+'/'+a.length,'tsc_pass='+s('tsc')+'/'+a.length,'wired='+s('wired')+'/'+a.length,'tsc_errs='+JSON.stringify(a.map(o=>o.tsc_errs)),'code_chars='+JSON.stringify(a.map(o=>o.code_chars)))})" "$OUT"

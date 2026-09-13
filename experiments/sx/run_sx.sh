#!/usr/bin/env bash
# run_sx.sh [K] [model]
# SX chaos-twin study harness — condition S0 (no sentinel) only.
# For twin in {lean, chaotic}, rep 0..K-1:
#   S0: hide twin CLAUDE.md (if any); snapshot src -> .srcbak; run the coding
#   task via `claude -p`; tsc --noEmit; reset+push db; serve; run hurl oracle;
#   run coherence probe; run token metric; kill server; restore src; restore CLAUDE.md.
# Snapshots & restores twin src every run — never permanently modifies it.
set -uo pipefail

K="${1:-2}"
MODEL="${2:-claude-sonnet-4-5}"
COND="${3:-S0}"   # sentinel ablation: S0=none, S1=lean-only, S2=both
RSTART="${4:-0}"  # first rep index (to add reps without overwriting earlier ones)

SX_DIR="C:/workspace/PragmaWorks/gs/generative-specification/experiments/sx"
TWINS_DIR="$SX_DIR/twins"
PROMPT="$SX_DIR/SX_MOD_PROMPT.md"
HURL_DIR="$SX_DIR/repos/realworld-oracle/specs/api/hurl"
HURL="/c/Program Files/Hurl/hurl.exe"
OUT_DIR="$SX_DIR/runs"
mkdir -p "$OUT_DIR"

# --- Concurrency guard: NEVER run two pilots at once. Concurrent snapshot/restore
# of a twin's src races (one run's `rm -rf src` + another's lost `mv .srcbak src`)
# and can DELETE the twin src. A lock makes a second invocation refuse instead.
LOCK="$SX_DIR/.run_sx.lock"
if [ -e "$LOCK" ]; then
  echo "REFUSING: run_sx.sh is already running (lock: $LOCK, pid $(cat "$LOCK" 2>/dev/null)). Two concurrent runs race the src snapshot/restore and can destroy the twins. Wait for it, or remove the lock if stale." >&2
  exit 3
fi
echo "$$" > "$LOCK"
trap 'rm -f "$LOCK"' EXIT INT TERM

PG_CONTAINER="sx-pg"

twin_port()  { case "$1" in lean) echo 3001;; chaotic) echo 3002;; esac; }
twin_db()    { case "$1" in lean) echo conduit_sx_lean;; chaotic) echo conduit_sx_chaotic;; esac; }

kill_port() {
  local port="$1"
  local pids
  pids=$(netstat -ano 2>/dev/null | grep -E "[:.]$port[[:space:]]" | grep -i "LISTENING" | awk '{print $NF}' | sort -u)
  for pid in $pids; do
    [ -n "$pid" ] && [ "$pid" != "0" ] && taskkill //F //PID "$pid" >/dev/null 2>&1 || true
  done
}

wait_ready() {
  local port="$1" i
  for i in $(seq 1 60); do
    if curl -s -o /dev/null "http://localhost:$port/api/tags"; then return 0; fi
    sleep 1
  done
  return 1
}

echo "twin,condition,rep,tsc_pass,oracle_ok_files,oracle_total,coherence,localization_tokens,localization_read_breadth,total_tokens,total_read_breadth,writes,turns,cost_usd"

for TWIN in lean chaotic; do
  DIR="$TWINS_DIR/$TWIN"
  PORT=$(twin_port "$TWIN")
  DB=$(twin_db "$TWIN")

  for REP in $(seq "$RSTART" $((RSTART+K-1))); do
    TAG="${TWIN}_${COND}_rep${REP}"
    RAW="$OUT_DIR/${TAG}.raw"
    RUNJSON="$OUT_DIR/${TAG}.json"
    SERVERLOG="$OUT_DIR/${TAG}.server.log"

    # --- sentinel setup per condition (S0=none, S1=lean-only, S2=both) ---
    # Natural state: lean HAS CLAUDE.md, chaotic has NONE.
    SENT_ACTION="none"
    case "$COND" in
      S0) # no sentinel anywhere: hide if present
        if [ -f "$DIR/CLAUDE.md" ]; then mv "$DIR/CLAUDE.md" "$DIR/CLAUDE.md.hidden"; SENT_ACTION="hidden"; fi ;;
      S1) # sentinel on lean only: hide chaotic's if any, leave lean's
        if [ "$TWIN" = "chaotic" ] && [ -f "$DIR/CLAUDE.md" ]; then mv "$DIR/CLAUDE.md" "$DIR/CLAUDE.md.hidden"; SENT_ACTION="hidden"; fi ;;
      S2) # sentinel on both: chaotic gets a temp copy of lean's map
        if [ "$TWIN" = "chaotic" ] && [ ! -f "$DIR/CLAUDE.md" ]; then cp "$TWINS_DIR/lean/CLAUDE.md" "$DIR/CLAUDE.md"; SENT_ACTION="tempcopy"; fi ;;
    esac

    # --- snapshot src ---
    rm -rf "$DIR/.srcbak"
    cp -r "$DIR/src" "$DIR/.srcbak"

    # --- run the coding task ---
    ( cd "$DIR" && cat "$PROMPT" | claude -p --output-format stream-json --verbose --dangerously-skip-permissions --model "$MODEL" > "$RAW" 2>&1 )
    CLAUDE_RC=$?

    # --- typecheck ---
    ( cd "$DIR" && npx tsc --noEmit ) > "$OUT_DIR/${TAG}.tsc.log" 2>&1
    TSC_PASS=$([ $? -eq 0 ] && echo true || echo false)

    # --- reset db & push schema (kill port + terminate backends first so DROP succeeds) ---
    kill_port "$PORT"
    docker exec "$PG_CONTAINER" psql -U postgres \
      -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='$DB' AND pid<>pg_backend_pid();" \
      -c "DROP DATABASE IF EXISTS $DB;" -c "CREATE DATABASE $DB;" >/dev/null 2>&1
    ( cd "$DIR" && DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5546/$DB" npx prisma db push --skip-generate ) > "$OUT_DIR/${TAG}.dbpush.log" 2>&1
    DBPUSH_RC=$?

    # --- serve ---
    kill_port "$PORT"
    ( cd "$DIR" && DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5546/$DB" PORT="$PORT" JWT_SECRET=sx_secret NODE_ENV=development npx tsx src/index.ts > "$SERVERLOG" 2>&1 ) &
    SERVER_READY=false
    if wait_ready "$PORT"; then SERVER_READY=true; fi

    # --- hurl oracle (differential/behavior check) ---
    ORACLE_OK=0; ORACLE_TOTAL=13
    if [ "$SERVER_READY" = true ]; then
      UIDV="$(date +%s)$$${REP}"
      HURL_OUT=$( "$HURL" --test --jobs 1 \
        --variable "host=http://localhost:$PORT" \
        --variable "uid=$UIDV" \
        "$HURL_DIR"/articles.hurl "$HURL_DIR"/auth.hurl "$HURL_DIR"/comments.hurl \
        "$HURL_DIR"/errors_articles.hurl "$HURL_DIR"/errors_auth.hurl "$HURL_DIR"/errors_authorization.hurl \
        "$HURL_DIR"/errors_comments.hurl "$HURL_DIR"/errors_profiles.hurl "$HURL_DIR"/favorites.hurl \
        "$HURL_DIR"/feed.hurl "$HURL_DIR"/pagination.hurl "$HURL_DIR"/profiles.hurl "$HURL_DIR"/tags.hurl 2>&1 )
      echo "$HURL_OUT" > "$OUT_DIR/${TAG}.hurl.log"
      ORACLE_OK=$(echo "$HURL_OUT" | grep -Ei "Succeeded files:" | grep -Eo "[0-9]+" | head -1)
      [ -z "$ORACLE_OK" ] && ORACLE_OK=0
    fi

    # --- coherence probe ---
    if [ "$SERVER_READY" = true ]; then
      node "$SX_DIR/readingtime_probe.cjs" "http://localhost:$PORT" > "$OUT_DIR/${TAG}.probe.json" 2>"$OUT_DIR/${TAG}.probe.err"
      COHERENCE=$(node -e "try{const p=require('$SX_DIR/runs/${TAG}.probe.json');process.stdout.write(p.coherence||'ERR')}catch(e){process.stdout.write('ERR')}")
    else
      COHERENCE="NO_SERVER"
      echo '{"error":"server did not become ready"}' > "$OUT_DIR/${TAG}.probe.json"
    fi

    # --- token metric ---
    node "$SX_DIR/sx_metric.cjs" "$RAW" > "$OUT_DIR/${TAG}.metric.json" 2>"$OUT_DIR/${TAG}.metric.err"
    read LT LRB TT TRB WR TURNS COST < <(node -e '
      try{const m=require("'"$SX_DIR/runs/${TAG}.metric.json"'");
      process.stdout.write([m.localization_tokens,m.localization_read_breadth,m.total_tokens,m.total_read_breadth,m.writes,m.turns,m.total_cost_usd].join(" "))}
      catch(e){process.stdout.write("ERR ERR ERR ERR ERR ERR ERR")}')

    # --- kill server ---
    kill_port "$PORT"

    # --- restore src ---
    rm -rf "$DIR/src"
    mv "$DIR/.srcbak" "$DIR/src"

    # --- restore sentinel state ---
    case "$SENT_ACTION" in
      hidden)   [ -f "$DIR/CLAUDE.md.hidden" ] && mv "$DIR/CLAUDE.md.hidden" "$DIR/CLAUDE.md" ;;
      tempcopy) rm -f "$DIR/CLAUDE.md" ;;
    esac

    # --- per-run JSON ---
    node -e '
      const fs=require("fs");
      const metric=(()=>{try{return require("'"$SX_DIR/runs/${TAG}.metric.json"'")}catch(e){return{error:String(e)}}})();
      const probe=(()=>{try{return require("'"$SX_DIR/runs/${TAG}.probe.json"'")}catch(e){return{error:String(e)}}})();
      const rec={twin:"'"$TWIN"'",rep:'"$REP"',model:"'"$MODEL"'",condition:"'"$COND"'",
        claude_rc:'"$CLAUDE_RC"',tsc_pass:'"$TSC_PASS"',dbpush_rc:'"$DBPUSH_RC"',server_ready:'"$SERVER_READY"',
        oracle_succeeded_files:'"${ORACLE_OK:-0}"',oracle_total:13,
        coherence:probe.coherence||null,coherence_missed:probe.missed||null,regressions:probe.regressions||null,
        metric,probe_error:probe.error||null};
      fs.writeFileSync("'"$RUNJSON"'",JSON.stringify(rec,null,2));
    '

    echo "$TWIN,$COND,$REP,$TSC_PASS,${ORACLE_OK:-0},$ORACLE_TOTAL,$COHERENCE,$LT,$LRB,$TT,$TRB,$WR,$TURNS,$COST"
  done
done

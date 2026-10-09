// claude adapter: the Claude Code CLI inside the container (image fx1-linux-claude). Route "claude".
// Auth, in this order, all passed by NAME (never by value, never written to the repository):
//   1. ANTHROPIC_API_KEY            (metered; the registered run should use this)
//   2. CLAUDE_CODE_OAUTH_TOKEN      (a subscription token made with `claude setup-token`)
//   3. FX_CLAUDE_CREDS_FILE         (path to a host ~/.claude/.credentials.json: ONLY the access token is copied into the session folder
//                                    for the duration of the cell and deleted afterwards. For a developer's own PC; never on a shared one.)
import fs from 'node:fs';

export default {
  name: 'claude',
  image: 'fx1-linux-claude',
  secretEnv: ['ANTHROPIC_API_KEY', 'CLAUDE_CODE_OAUTH_TOKEN'],
  versionCmd: ['claude', '--version'],

  prepareSession(dir) {
    const f = process.env.FX_CLAUDE_CREDS_FILE;
    if (!process.env.ANTHROPIC_API_KEY && !process.env.CLAUDE_CODE_OAUTH_TOKEN && f) {
      const src = JSON.parse(fs.readFileSync(f, 'utf8')).claudeAiOauth;
      const o = { accessToken: src.accessToken, expiresAt: src.expiresAt, scopes: src.scopes, subscriptionType: src.subscriptionType, rateLimitTier: src.rateLimitTier };
      fs.writeFileSync(`${dir}/.credentials.json`, JSON.stringify({ claudeAiOauth: o }), { mode: 0o666 });
    }
  },
  cleanupSession(dir) { try { fs.rmSync(`${dir}/.credentials.json`, { force: true }); } catch {} },

  // returns { shell, env } executed with `sh -c` inside the container; /cfg is the session folder, /work the sandbox
  command({ model, promptFile, resumeId, maxBudgetUsd = 14 }) {
    const resume = resumeId ? ` --resume ${resumeId}` : '';
    const shell = `cd /work && claude -p "$(cat ${promptFile})" --model "$FX_MODEL" --output-format json --permission-mode acceptEdits ` +
      `--tools Bash,Read,Write,Edit,Glob,Grep --allowedTools Bash,Read,Write,Edit,Glob,Grep --disable-slash-commands --strict-mcp-config ` +
      `--max-budget-usd ${maxBudgetUsd}${resume}`;
    return { shell, env: { CLAUDE_CONFIG_DIR: '/cfg', FX_MODEL: model, HOME: '/home/agent' } };
  },

  parse(stdout, stderr, exit) {
    let j; try { j = JSON.parse(stdout); } catch { return { text: '', isError: true, errorClass: classify(stdout + stderr, true), sessionId: null, modelServed: null, tokens: null, usd: null, parsed: false }; }
    const u = j.usage || {};
    const models = Object.keys(j.modelUsage || {});
    const text = j.result || '';
    const isError = !!j.is_error;
    return {
      text, isError, errorClass: isError ? classify(text + stderr, false) : null, sessionId: j.session_id || null,
      modelServed: models.length ? models.join('+') : null,
      tokens: u.input_tokens != null ? { input: u.input_tokens, output: u.output_tokens || 0, cached: u.cache_read_input_tokens || 0, cacheWrite: u.cache_creation_input_tokens || 0 } : null,
      usd: j.total_cost_usd ?? null, parsed: true,
    };
  },
};

export function classify(s, parseFail) {
  if (/\b(401|403|429|5\d\d)\b|rate.?limit|overloaded|usage limit|credit|billing|authenticat|unauthori|OAuth|invalid.*key|ECONN|ETIMEDOUT|socket hang up|network/i.test(s)) return 'infra';
  if (parseFail) return 'infra-parse';
  return 'agent';
}

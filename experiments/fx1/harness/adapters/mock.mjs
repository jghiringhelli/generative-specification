// mock adapter: no model, no network, no key. Runs in the plain fx1-linux image through the SAME container path as the real adapters,
// so the flow, the volumes, the copy-out, the checker call, the ledger and the queue can be tested end to end.
// It writes a tiny project, makes git commits, and prints a final report with a PRESENT table so the flow's "finished" test fires.
// FX_MOCK_FAIL_LABEL=<label> makes that label's calls fail like a rate limit (to test void handling).
export default {
  name: 'mock',
  image: 'fx1-linux',
  secretEnv: [],
  versionCmd: ['sh', '-c', 'echo mock-1'],
  prepareSession() {},
  cleanupSession() {},
  command({ model, promptFile, turn, label }) {
    const fail = process.env.FX_MOCK_FAIL_LABEL === label;
    const shell = [
      'cd /work',
      'git config --global --add safe.directory "*"; git config --global user.email x@x; git config --global user.name x',
      '[ -d .git ] || git init -q -b master .',
      fail ? 'echo "HTTP 429 rate limit exceeded (mock)" >&2; exit 1' : ':',
      `mkdir -p mock && echo "label=${label} turn=${turn} bytes=$(wc -c < ${promptFile})" > mock/${label}-${turn}.txt`,
      label === 'a1' && turn >= 2 ? 'mkdir -p docs/migration && echo "{}" > docs/migration/equivalence.json' : ':',
      label === 'lock' ? 'mkdir -p docs && echo "mock lock" > docs/spec.lock' : ':',
      `git add -A && git commit -q -m "mock ${label} ${turn}"`,
      turn >= 2 || label === 'mvp' || label === 'lock' || label === 'adopt-fast'
        ? `printf '| element | status |\\n|---|---|\\n| E01 | PRESENT |\\n| E02 | MISSING |\\n'; ${label === 'lock' ? 'echo "lock written, exit 0, record updated; this is a mock text padded to pass the length test of the harness: ' + 'x'.repeat(620) + '"' : ':'}`
        : 'echo "OPEN: mock question; waiting for ratification"',
    ].join('; ');
    return { shell, env: { FX_MODEL: model, HOME: '/tmp' } };
  },
  parse(stdout, stderr, exit) {
    const isError = exit !== 0;
    return { text: (stdout || '').trim(), isError, errorClass: isError ? (/429|rate/i.test(stderr) ? 'infra-rate' : 'agent') : null, sessionId: 'mock-session', modelServed: 'mock-1', tokens: { input: 1000, output: 100, cached: 0 }, usd: 0.01, parsed: true };
  },
};

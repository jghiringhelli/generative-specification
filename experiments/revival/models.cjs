// Model backend abstraction for the revival harness.
//   generate(generator, prompt) -> raw text, across three backends:
//     - qwen*  : local Ollama  (http://localhost:11434) — free, no key
//     - sonnet : `claude -p` CLI (frontier)
//     - xvendor: cross-vendor frontier — OpenAI or Gemini, chosen by env XVENDOR
// Config via env (nothing hard-coded / no keys in the repo):
//   XVENDOR=openai|gemini          (default openai)
//   OPENAI_API_KEY / OPENAI_MODEL  (default gpt-4o)
//   GEMINI_API_KEY / GEMINI_MODEL  (default gemini-2.0-flash)
//   OLLAMA_URL                     (default http://localhost:11434)
//   CLAUDE_MODEL                   (default claude-sonnet-4-5)
const { execFile } = require('child_process');

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const CLAUDE_MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-4-5';
const XVENDOR = (process.env.XVENDOR || 'openai').toLowerCase();

// Map ladder generator names -> Ollama tags. Adjust here if your pulled tags differ.
const OLLAMA_TAG = {
  'qwen1.5b': 'qwen2.5-coder:1.5b',
  'qwen3b': 'qwen2.5-coder:3b',
  'qwen7b': 'qwen2.5-coder:7b',
};

// Extract a code block (or the raw body) from a model reply.
function extractCode(text) {
  if (!text) return '';
  const fence = text.match(/```(?:js|javascript|cjs)?\s*([\s\S]*?)```/i);
  return (fence ? fence[1] : text).trim();
}

async function ollamaGenerate(tag, prompt) {
  const res = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: tag, prompt, stream: false, options: { temperature: 0.7 } }),
  });
  if (!res.ok) throw new Error(`ollama ${tag} HTTP ${res.status}`);
  const j = await res.json();
  return j.response || '';
}

function claudeCLI(prompt) {
  return new Promise((resolve, reject) => {
    execFile('claude', ['-p', prompt, '--model', CLAUDE_MODEL], { maxBuffer: 1 << 24, timeout: 180000 },
      (err, stdout) => err ? reject(err) : resolve(stdout || ''));
  });
}

async function openaiGenerate(prompt) {
  const key = process.env.OPENAI_API_KEY; if (!key) throw new Error('OPENAI_API_KEY not set');
  const model = process.env.OPENAI_MODEL || 'gpt-4o';
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
    body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], temperature: 0.7 }),
  });
  if (!res.ok) throw new Error(`openai HTTP ${res.status}`);
  const j = await res.json();
  return j.choices?.[0]?.message?.content || '';
}

async function geminiGenerate(prompt) {
  const key = process.env.GEMINI_API_KEY; if (!key) throw new Error('GEMINI_API_KEY not set');
  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.7 } }),
  });
  if (!res.ok) throw new Error(`gemini HTTP ${res.status}`);
  const j = await res.json();
  return j.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function generate(generator, prompt) {
  if (OLLAMA_TAG[generator]) return ollamaGenerate(OLLAMA_TAG[generator], prompt);
  if (generator === 'sonnet') return claudeCLI(prompt);
  if (generator === 'xvendor') return XVENDOR === 'gemini' ? geminiGenerate(prompt) : openaiGenerate(prompt);
  throw new Error(`unknown generator: ${generator}`);
}

// Free connectivity probe: which Ollama models are pulled? (answers setup Q2 without any paid call)
async function probeOllama() {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`);
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    const j = await res.json();
    return { ok: true, models: (j.models || []).map(m => m.name) };
  } catch (e) { return { ok: false, error: e.message }; }
}

module.exports = { generate, extractCode, probeOllama, OLLAMA_TAG, XVENDOR, CLAUDE_MODEL };

// CLI: `node models.cjs probe` -> print backend readiness
if (require.main === module && process.argv[2] === 'probe') {
  (async () => {
    const o = await probeOllama();
    console.log('Ollama:', o.ok ? 'UP' : `DOWN (${o.error})`);
    if (o.ok) {
      console.log('  pulled models:', o.models.length ? o.models.join(', ') : '(none)');
      for (const [g, tag] of Object.entries(OLLAMA_TAG))
        console.log(`  ${g.padEnd(9)} -> ${tag.padEnd(22)} ${o.models.includes(tag) ? 'READY' : 'MISSING (ollama pull ' + tag + ')'}`);
    }
    console.log('Frontier (claude CLI):', CLAUDE_MODEL);
    console.log('Cross-vendor XVENDOR=' + XVENDOR + ':', XVENDOR === 'gemini'
      ? (process.env.GEMINI_API_KEY ? 'GEMINI_API_KEY set' : 'GEMINI_API_KEY MISSING')
      : (process.env.OPENAI_API_KEY ? 'OPENAI_API_KEY set' : 'OPENAI_API_KEY MISSING'));
  })();
}

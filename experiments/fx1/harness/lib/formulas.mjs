// formulas.mjs: builds the prompt texts of the FX flow from the formula files. Ported unchanged in content from the development
// harness (run2.js, loop 2); the scripted human messages (RATIFY, DECIDE, CONT) are the same sentences, in English and Spanish.
import fs from 'node:fs';

export const DATE = process.env.FX_DATE || '2026-10-07'; // the development constant; recorded in meta.json

const blocksCache = new Map();
export const blocks = (formDir, f) => {
  const k = formDir + '/' + f;
  if (!blocksCache.has(k)) blocksCache.set(k, [...fs.readFileSync(k, 'utf8').matchAll(/```text\r?\n([\s\S]*?)\r?\n```/g)].map(m => m[1]));
  return blocksCache.get(k);
};
export function fill(t, pairs) { for (const [a, b] of pairs) { if (!t.includes(a)) throw new Error('missing bracket ' + a); t = t.split(a).join(b); } return t; }

const SENT = '[CLAUDE.md | AGENTS.md (most other tools, Cursor included) | .github/copilot-instructions.md]';
// The instruction-file name the formula asks the agent to create. The development loop used CLAUDE.md for every vendor.
// Set FX_SENTINEL_NAME=AGENTS.md (or .github/copilot-instructions.md) for the Copilot route if JC decides so; it is recorded in meta.json.
export const SENTINEL = process.env.FX_SENTINEL_NAME || 'CLAUDE.md';

const REPLAT = {
  habits: { stack: { en: 'Node.js 22, standard library only, node:test', es: 'Node.js 22, solo biblioteca estandar, node:test' }, feat: { en: 'a rename OLD NEW command that renames a habit and keeps its days', es: 'un comando rename OLD NEW que renombra un habito y conserva sus dias' }, clean: { en: 'remove the old export command; done with extra arguments must now fail with exit 2 instead of ignoring them', es: 'quitar el comando viejo export; done con argumentos de mas ahora debe fallar con salida 2 en lugar de ignorarlos' } },
  shortly: { stack: { en: 'Python 3.11, standard library only (http.server), unittest', es: 'Python 3.11, solo biblioteca estandar (http.server), unittest' }, feat: { en: 'GET /links accepts ?limit=N and returns only the first N links', es: 'GET /links acepta ?limit=N y devuelve solo los primeros N enlaces' }, clean: { en: 'remove the old GET /go?c=CODE endpoint; DELETE of an unknown code must return 404 with {"error":"not found"} (check what it does today)', es: 'quitar el endpoint viejo GET /go?c=CODIGO; DELETE de un codigo desconocido debe devolver 404 con {"error":"not found"} (revisa que hace hoy)' } },
  rollup: { stack: { en: 'Node.js 22, standard library only, node:test', es: 'Node.js 22, solo biblioteca estandar, node:test' }, feat: { en: 'a --top N option that sets how many paths the report lists (default 5)', es: 'una opcion --top N que fija cuantos paths lista el informe (por defecto 5)' }, clean: { en: 'remove the old tsv output option', es: 'quitar la opcion vieja de salida tsv' } },
};

export function makePrompts({ formDir, lang, fixtureKey }) {
  const ES = lang === 'es';
  const L = ES ? 'es' : 'en';
  const pick = (f, k) => blocks(formDir, f)[k * 2 + (ES ? 1 : 0)];
  const RP = REPLAT[fixtureKey] || {};
  const greenfield = (spec, stack) => fill(pick('greenfield.md', 0), ES
    ? [['[pégala aquí o indica su ruta]', spec], ['[lenguaje, framework, herramienta de pruebas, base de datos]', stack], [SENT, SENTINEL]]
    : [['[paste it here, or give its path]', spec], ['[language, framework, test tool, database]', stack], [SENT, SENTINEL]]);
  const adopt = () => fill(pick('adopt.md', 0), ES
    ? [['[AAAA-MM-DD]', DATE], ['[ruta, o "ninguna"]', 'ninguna'], [SENT, SENTINEL]]
    : [['[YYYY-MM-DD]', DATE], ['[path, or "none"]', 'none'], [SENT, SENTINEL]]);
  const lock = branch => fill(pick('lock.md', 0), ES
    ? [['[AAAA-MM-DD]', DATE], ['[ruta o URL de gs-lock.mjs, gs-cochange.mjs y gs-redproof.mjs]', '/tools/gs-lock/ (gs-lock.mjs, gs-cochange.mjs, gs-redproof.mjs)'], ['[main | master | otra]', branch], ['[rama principal]', branch]]
    : [['[YYYY-MM-DD]', DATE], ['[path or URL of gs-lock.mjs, gs-cochange.mjs and gs-redproof.mjs]', '/tools/gs-lock/ (gs-lock.mjs, gs-cochange.mjs, gs-redproof.mjs)'], ['[main | master | other]', branch], ['[default branch]', branch]]);
  const migrateA1 = () => fill(blocks(formDir, 'migrate.md')[ES ? 1 : 0], ES
    ? [['[AAAA-MM-DD]', DATE], ['[ruta, o "ninguna"]', 'ninguna'], ['[lenguaje, framework, herramienta de pruebas, base de datos | "el mismo de hoy"]', RP.stack[L]], ['Funcionalidades nuevas que quiero en el sistema nuevo: [una lista | "ninguna"]', 'Funcionalidades nuevas que quiero en el sistema nuevo: ' + RP.feat[L]], ['(cosas que se quitan o que se comportan distinto): [una lista | "ninguna"]', '(cosas que se quitan o que se comportan distinto): ' + RP.clean[L]]]
    : [['[YYYY-MM-DD]', DATE], ['[path, or "none"]', 'none'], ['[language, framework, test tool, database | "same as today"]', RP.stack[L]], ['New features wanted in the new system: [a list | "none"]', 'New features wanted in the new system: ' + RP.feat[L]], ['(things to remove or to behave differently): [a list | "none"]', '(things to remove or to behave differently): ' + RP.clean[L]]]);
  const migrateA2 = () => {
    const g = greenfield(ES ? 'docs/spec/ (recuperada del código; ya ratificada por id; conserva los ids tal como están; no reabras lo que ratifiqué)' : 'docs/spec/ (recovered from the code; already ratified by id; keep the ids exactly as they are; do not re-open what I ratified)', RP.stack[L]);
    const add = fill(blocks(formDir, 'migrate.md')[ES ? 3 : 2], [['[regenerate | carry]', 'regenerate'], ['gs-migrate-' + (ES ? 'FECHA' : 'DATE'), 'gs-migrate-' + DATE]]);
    return g + '\n\n' + add;
  };
  const verify = migration => fill(pick('verify-substrate.md', 0), ES
    ? [['[ruta de gs-check.mjs]', '/tools/gs-check/gs-check.mjs'], ['[ruta absoluta de la carpeta del proyecto]', '/work'], ['[ruta absoluta, por ejemplo en una carpeta temporal]', '/tmp/gs-report.json'], ['[--migration si este proyecto se migró con la fórmula 12 (tiene docs/migration/equivalence.json), si no, nada]', migration ? '--migration' : 'nada']]
    : [['[path of gs-check.mjs]', '/tools/gs-check/gs-check.mjs'], ['[absolute path of the project folder]', '/work'], ['[absolute path, for example a temporary folder]', '/tmp/gs-report.json'], ['[--migration if this project was migrated with formula 12 (it has docs/migration/equivalence.json), otherwise nothing]', migration ? '--migration' : 'nothing']]);
  const RATIFY = ES
    ? 'Ratifico por id todos los criterios y registros tal como están. Resuelve cada línea OPEN: con tu mejor criterio a partir del brief, registra el supuesto en los documentos del proyecto y no vuelvas a preguntar. Continúa con la fase siguiente.'
    : 'I ratify every criterion and record above by id, as written. Use your best judgment from the brief for each OPEN: line, record the assumption in the project documents, and do not ask again. Continue with the next phase.';
  const DECIDE = ES
    ? 'Decisiones: aplica mi lista de limpieza: drop para lo que quita (razón: la limpieza que pedí) y change para lo que cambia de comportamiento (con el criterio nuevo que lo reemplaza). keep para cada otro elemento que tenga un criterio. defer para cualquier elemento que no hayas podido fijar sin cambiar código de producción, con la razón. Ratifico por id todos los criterios tal como están. Resuelve cada línea OPEN: con tu mejor criterio, registra el supuesto en los documentos del proyecto y no vuelvas a preguntar. Continúa con la fase siguiente.'
    : 'Decisions: apply my cleanup list: drop for what it removes (reason: the cleanup I asked for) and change for what it makes behave differently (with the new criterion that replaces it). keep for every other element that has a criterion. defer for any element you could not pin without changing production code, with the reason. I ratify every criterion by id, as written. Use your best judgment for each OPEN: line, record the assumption in the project documents, and do not ask again. Continue with the next phase.';
  const CONT = ES
    ? 'Usa tu mejor criterio, registra el supuesto en los documentos del proyecto y no vuelvas a preguntar. Continúa con la fase siguiente.'
    : 'Use your best judgment, record the assumption in the project documents, and do not ask again. Continue with the next phase.';
  const neutral = brief => ES
    ? `Construye el siguiente producto como una primera versión funcional en la carpeta actual. Usa git y haz commit de tu trabajo a medida que avances. Elige herramientas sensatas dentro del stack indicado. Brief:\n\n${brief}`
    : `Build the following product as a working first version in the current folder. Use git and commit your work as you go. Choose sensible tools within the stated stack. Brief:\n\n${brief}`;
  return { ES, L, RP, greenfield, adopt, lock, migrateA1, migrateA2, verify, RATIFY, DECIDE, CONT, neutral };
}

export const reportDone = res => /(PRESENT|MISSING)/.test(res || '') && /\|/.test(res || '');

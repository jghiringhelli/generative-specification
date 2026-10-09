import claude from './claude.mjs';
import copilot from './copilot.mjs';
import mock from './mock.mjs';

export const ADAPTERS = { claude, copilot, mock };
export function getAdapter(name) {
  const a = ADAPTERS[name];
  if (!a) { console.error(`unknown adapter ${name}; have: ${Object.keys(ADAPTERS).join(', ')}`); process.exit(2); }
  return a;
}
// Which adapter runs a vendor tag of the schedule. Default: everything -> copilot; anth -> claude ONLY when a Claude credential is in the environment
// (ANTHROPIC_API_KEY, CLAUDE_CODE_OAUTH_TOKEN or FX_CLAUDE_CREDS_FILE), otherwise the Claude models are called through Copilot like the others.
// Override per vendor with FX_ROUTE_<VENDOR>=claude|copilot|mock.
export function routeFor(vendor) {
  const v = vendor.toUpperCase();
  if (process.env['FX_ROUTE_' + v]) return process.env['FX_ROUTE_' + v];
  const claudeCred = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_CODE_OAUTH_TOKEN || process.env.FX_CLAUDE_CREDS_FILE;
  return vendor === 'anth' && claudeCred ? 'claude' : 'copilot';
}

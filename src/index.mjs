import { randomBytes } from 'node:crypto';

const fail = (message) => { throw new TypeError(message); };

function validateConfig(config) {
  if (!config || typeof config !== 'object') fail('Config must be an object');
  if (typeof config.environment !== 'string' || !config.environment.trim()) fail('environment must be a non-empty string');
  if (!/^test(?:[-_].*)?$/i.test(config.environment)) fail(`Refusing environment "${config.environment}": environment must start with "test"`);
  if (!config.adapter || typeof config.adapter !== 'object') fail('adapter must be an object');
  for (const name of ['setup', 'erase']) if (typeof config.adapter[name] !== 'function') fail(`adapter.${name} must be a function`);
  if (config.adapter.cleanup !== undefined && typeof config.adapter.cleanup !== 'function') fail('adapter.cleanup must be a function when provided');
  if (!Array.isArray(config.stores) || config.stores.length === 0) fail('stores must be a non-empty array');
  const names = new Set();
  for (const store of config.stores) {
    if (!store || typeof store.name !== 'string' || !store.name.trim() || typeof store.inspect !== 'function') fail('Each store needs a name and inspect function');
    if (names.has(store.name)) fail(`Duplicate store name: ${store.name}`);
    names.add(store.name);
  }
}

function validateFinding(name, result) {
  if (!result || typeof result !== 'object' || typeof result.clear !== 'boolean') fail(`Store "${name}" returned malformed finding: expected { clear: boolean, detail?: string }`);
  if (result.detail !== undefined && typeof result.detail !== 'string') fail(`Store "${name}" returned malformed finding detail`);
  return { store: name, clear: result.clear, ...(result.detail ? { detail: result.detail } : {}) };
}

/** Run one isolated delete check. Callbacks receive { canary, environment }. */
export async function runEraseCheck(config) {
  validateConfig(config); // Refusal and config validation happen before any adapter side effects.
  const canary = `erasecheck-${randomBytes(18).toString('hex')}`;
  const context = { canary, environment: config.environment };
  let setupAttempted = false;
  let findings = [];
  let failure;
  let failed = false;
  try {
    setupAttempted = true;
    await config.adapter.setup(context);
    await config.adapter.erase(context);
    const inspections = await Promise.allSettled(config.stores.map(async ({ name, inspect }) => validateFinding(name, await inspect(context))));
    const rejected = inspections.find(({ status }) => status === 'rejected');
    if (rejected) throw rejected.reason;
    findings = inspections.map(({ value }) => value);
  } catch (error) {
    failure = error;
    failed = true;
  } finally {
    if (setupAttempted && typeof config.adapter.cleanup === 'function') {
      try { await config.adapter.cleanup(context); }
      catch (error) { if (!failed) failure = error; failed = true; }
    }
  }
  if (failed) throw failure;
  return { canary, environment: config.environment, passed: findings.every((finding) => finding.clear), findings };
}

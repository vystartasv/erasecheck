import test from 'node:test';
import assert from 'node:assert/strict';
import { runEraseCheck } from '../src/index.mjs';

function fixture(overrides = {}) {
  const calls = [];
  const config = {
    environment: 'test',
    adapter: {
      setup: async () => calls.push('setup'),
      erase: async () => calls.push('erase'),
      cleanup: async () => calls.push('cleanup')
    },
    stores: [{ name: 'records', inspect: async () => ({ clear: true }) }],
    ...overrides
  };
  return { config, calls };
}

test('passes when configured stores are clear', async () => {
  const { config } = fixture();
  const result = await runEraseCheck(config);
  assert.equal(result.passed, true);
  assert.match(result.canary, /^erasecheck-[a-f0-9]{36}$/);
  assert.deepEqual(result.findings, [{ store: 'records', clear: true }]);
});

test('reports residue by store name', async () => {
  const { config } = fixture({ stores: [{ name: 'vector-memory', inspect: async () => ({ clear: false, detail: 'still indexed' }) }] });
  const result = await runEraseCheck(config);
  assert.equal(result.passed, false);
  assert.equal(result.findings[0].store, 'vector-memory');
});

test('refuses unsafe environment before side effects', async () => {
  const { config, calls } = fixture({ environment: 'production' });
  await assert.rejects(runEraseCheck(config), /Refusing environment/);
  assert.deepEqual(calls, []);
});

test('validates every store before starting adapter side effects', async () => {
  const { config, calls } = fixture({ stores: [
    { name: 'records', inspect: async () => ({ clear: true }) },
    { name: 'invalid', inspect: true }
  ] });
  await assert.rejects(runEraseCheck(config), /Each store needs a name and inspect function/);
  assert.deepEqual(calls, []);
});

test('waits for every inspection to settle before cleanup after a rejection', async () => {
  const calls = [];
  const config = {
    environment: 'test',
    adapter: {
      setup: async () => calls.push('setup'),
      erase: async () => calls.push('erase'),
      cleanup: async () => calls.push('cleanup')
    },
    stores: [
      { name: 'rejects', inspect: async () => { calls.push('rejects'); throw new Error('inspection failed'); } },
      { name: 'slow', inspect: async () => { await new Promise((resolve) => setTimeout(resolve, 10)); calls.push('slow'); return { clear: true }; } }
    ]
  };
  await assert.rejects(runEraseCheck(config), /inspection failed/);
  assert.deepEqual(calls, ['setup', 'erase', 'rejects', 'slow', 'cleanup']);
});

test('does not treat a falsey rejection reason as a successful run', async () => {
  const { config, calls } = fixture({ stores: [{ name: 'records', inspect: async () => { throw null; } }] });
  await assert.rejects(runEraseCheck(config), (error) => error === null);
  assert.deepEqual(calls, ['setup', 'erase', 'cleanup']);
});

test('CLI errors do not include arbitrary adapter exception data', async () => {
  const { spawnSync } = await import('node:child_process');
  const { mkdtemp, writeFile, rm } = await import('node:fs/promises');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const directory = await mkdtemp(join(tmpdir(), 'erasecheck-'));
  try {
    const adapter = join(directory, 'adapter.mjs');
    await writeFile(adapter, "export default { environment: 'test', adapter: { setup: async () => { throw new Error('private-record-value') }, erase() {} }, stores: [{ name: 'records', inspect() { return { clear: true } } }] }");
    const cli = spawnSync(process.execPath, ['src/cli.mjs', 'run', adapter], { encoding: 'utf8' });
    assert.equal(cli.status, 1);
    assert.match(cli.stdout, /EraseCheck run failed/);
    assert.doesNotMatch(cli.stdout, /private-record-value/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('rejects malformed findings and still cleans up', async () => {
  const { config, calls } = fixture({ stores: [{ name: 'records', inspect: async () => ({ clear: 'yes' }) }] });
  await assert.rejects(runEraseCheck(config), /malformed finding/);
  assert.deepEqual(calls, ['setup', 'erase', 'cleanup']);
});

test('cleans up after erase failure and rethrows it', async () => {
  const { config, calls } = fixture({ adapter: { setup: async () => calls.push('setup'), erase: async () => { calls.push('erase'); throw new Error('erase failed'); }, cleanup: async () => calls.push('cleanup') } });
  await assert.rejects(runEraseCheck(config), /erase failed/);
  assert.deepEqual(calls, ['setup', 'erase', 'cleanup']);
});

test('cleans up after setup failure', async () => {
  const { config, calls } = fixture({ adapter: { setup: async () => { calls.push('setup'); throw new Error('setup failed'); }, erase: async () => calls.push('erase'), cleanup: async () => calls.push('cleanup') } });
  await assert.rejects(runEraseCheck(config), /setup failed/);
  assert.deepEqual(calls, ['setup', 'cleanup']);
});

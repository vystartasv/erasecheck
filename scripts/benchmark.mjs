import { performance } from 'node:perf_hooks';
import { writeFile } from 'node:fs/promises';
import { runEraseCheck } from '../src/index.mjs';

const values = new Map(['sql', 'cache', 'vector-memory'].map((name) => [name, new Set()]));
const stores = [...values].map(([name, set]) => ({ name, inspect: ({ canary }) => ({ clear: !set.has(canary) }) }));
const config = { environment: 'test-benchmark', stores, adapter: {
  setup: ({ canary }) => { for (const set of values.values()) set.add(canary); },
  erase: ({ canary }) => { for (const set of values.values()) set.delete(canary); },
  cleanup: ({ canary }) => { for (const set of values.values()) set.delete(canary); }
} };
const iterations = 1000;
const started = performance.now();
for (let i = 0; i < iterations; i++) {
  const result = await runEraseCheck(config);
  if (!result.passed) throw new Error('Benchmark check failed');
}
const elapsedMs = performance.now() - started;
const output = { method: '1000 sequential runs; 3 in-memory stores; single process', iterations, elapsedMs: Number(elapsedMs.toFixed(2)), runsPerSecond: Number((iterations / (elapsedMs / 1000)).toFixed(1)), millisecondsPerRun: Number((elapsedMs / iterations).toFixed(4)), node: process.version };
await writeFile(new URL('../benchmark-output.json', import.meta.url), `${JSON.stringify(output, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);

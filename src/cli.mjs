#!/usr/bin/env node
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { runEraseCheck } from './index.mjs';

async function main() {
  const [command, adapterPath] = process.argv.slice(2);
  if (command !== 'run' || !adapterPath || process.argv.length > 4) {
    process.stderr.write('Usage: erasecheck run <adapter.mjs>\n');
    process.exitCode = 2;
    return;
  }
  try {
    const loaded = await import(pathToFileURL(resolve(adapterPath)).href);
    const result = await runEraseCheck(loaded.default ?? loaded.config);
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    if (!result.passed) process.exitCode = 1;
  } catch (error) {
    process.stdout.write(`${JSON.stringify({ passed: false, error: 'EraseCheck run failed' }, null, 2)}\n`);
    process.exitCode = 1;
  }
}

main();

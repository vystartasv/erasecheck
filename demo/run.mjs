import { runEraseCheck } from '../src/index.mjs';
import config, { setRetainVector } from './adapter.mjs';

const fullErase = await runEraseCheck(config);
setRetainVector(true);
const retainedVector = await runEraseCheck(config);
const output = { fullErase, retainedVector };
process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
if (!fullErase.passed || retainedVector.passed || !retainedVector.findings.some(({ store, clear }) => store === 'vector-memory' && !clear)) process.exitCode = 1;

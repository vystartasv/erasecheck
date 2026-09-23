# Benchmark method and result

## Method

`npm run benchmark` runs the same three in-memory inspectors used in the demo for 1,000 consecutive harness invocations in one Node process. Each invocation creates a unique 18-byte random canary, runs setup, erase, all three checks, and cleanup. The measured interval uses `performance.now()` around the loop. No database, network, or provider call is involved.

## Result

See `benchmark-output.json` for the latest generated result. This is a local harness overhead measurement, not a prediction for a real adapter or a comparative performance claim. The benchmark does not measure the static site or inspect browser network behavior.

# EraseCheck spec

## Goal
Local integration-test harness for deletion paths in agent apps. Canaries synthetic, random, one-run.

## Contract
- Node ESM; no runtime dependencies.
- Adapter: `environment`, `setup`, `erase`, optional `cleanup`; named stores each expose async `inspect`.
- Environment must start `test`; label check only, not production protection. Validate full config before side effects.
- Setup → erase → inspect all configured stores; wait for all inspections to settle → cleanup in `finally` after setup begins.
- Finding must be `{clear:boolean, detail?:string}`; report named stores and pass iff every finding clear.
- CLI emits machine-readable JSON; nonzero on failure/residue.

## Boundaries
- Application-controlled configured stores only; no provider-internal abuse-log verification.
- No legal-compliance claim; no guarantee for unconfigured stores.
- Synthetic canary only; adapter controls its own data/network behavior. No production target or real user data.

## Acceptance
Deterministic tests cover clear/residue, refusal before side effects, malformed findings, cleanup after failures. Demo covers three stores and vector-memory residue. Static site local-only, responsive, WCAG AA contrast and keyboard operable.

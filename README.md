# EraseCheck

EraseCheck runs a local integration check against **application-controlled stores you name**. It generates a random canary, invokes your test setup and erase callbacks, validates each store finding, and calls cleanup in `finally`.

It makes no legal-compliance claim, cannot inspect provider-internal abuse-monitoring logs, and cannot say anything about unconfigured stores. A passing result describes only the configured inspectors in that run.

## Requirements

Node.js 20+. Runtime dependencies: none.

## Quick start

```sh
npm ci
npm test
npm run build
node src/cli.mjs run demo/adapter.mjs
node demo/run.mjs
```

An adapter is an ES module with a default config export:

```js
export default {
  environment: 'test-local', // label check only; not production protection
  adapter: {
    setup: async ({ canary }) => seedTestState(canary),
    erase: async ({ canary }) => deleteTestState(canary),
    cleanup: async ({ canary }) => purgeTestState(canary)
  },
  stores: [
    { name: 'primary-db', inspect: async ({ canary }) => ({ clear: !(await db.has(canary)) }) }
  ]
};
```

Run it with `node src/cli.mjs run ./adapter.mjs` from this checkout. An inspector must return `{ clear: boolean, detail?: string }`. JSON goes to stdout; a residue result or runtime/config failure exits nonzero. The random synthetic canary and findings are included in the JSON report. Keep `detail` limited to synthetic test information and treat reports as sensitive. The environment prefix is a label check only; use isolated test resources and credentials. The harness itself makes no network requests, but adapter callbacks can do anything their code permits.

The demo uses three in-memory stores. It clears every canary, then a second run deliberately retains one in `vector-memory` so the finding shows the store name. Its cleanup removes leftovers.

## Development

```sh
npm ci
npm test
npm run typecheck
npm run build
npm run benchmark
```

See [SPEC.md](SPEC.md), [product research](docs/PRODUCT-RESEARCH.md), and [benchmark method/results](docs/BENCHMARK.md). The independent static site is `site/index.html` and works offline.

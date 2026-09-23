// Three application-controlled stores; vector memory deliberately keeps the canary.
const rows = new Map([['sql', new Set()], ['cache', new Set()], ['vector-memory', new Set()]]);
let keepVector = false;
const stores = [...rows].map(([name, values]) => ({
  name,
  inspect: ({ canary }) => ({ clear: !values.has(canary), ...(values.has(canary) ? { detail: 'canary still indexed' } : {}) })
}));

export function setRetainVector(value) { keepVector = value; }

export default {
  environment: 'test-local',
  stores,
  adapter: {
    setup: ({ canary }) => { for (const values of rows.values()) values.add(canary); },
    erase: ({ canary }) => { for (const [name, values] of rows) if (name !== 'vector-memory' || !keepVector) values.delete(canary); },
    cleanup: ({ canary }) => { for (const values of rows.values()) values.delete(canary); }
  }
};

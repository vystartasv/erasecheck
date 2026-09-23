const buttons = [document.querySelector('#run-clean'), document.querySelector('#run-retained')];
const state = document.querySelector('#run-state');
const canaryLabel = document.querySelector('#canary');
const results = document.querySelector('#results');
const stores = new Map([['primary database', new Set()], ['session cache', new Set()], ['vector memory', new Set()]]);

function run(retainVector) {
  const canary = `demo-${crypto.randomUUID()}`;
  state.textContent = 'RUNNING';
  canaryLabel.textContent = canary;
  for (const values of stores.values()) values.add(canary);
  for (const [name, values] of stores) if (!retainVector || name !== 'vector memory') values.delete(canary);
  results.replaceChildren(...[...stores].map(([name, values]) => {
    const row = document.createElement('div');
    row.className = 'finding';
    const label = document.createElement('strong');
    label.textContent = name;
    const status = document.createElement('span');
    const clear = !values.has(canary);
    status.className = clear ? 'ok' : 'residue';
    status.textContent = clear ? '✓ clear' : '● canary found';
    row.append(label, status);
    return row;
  }));
  state.textContent = retainVector ? 'RESIDUE FOUND' : 'PASSED';
}
buttons[0].addEventListener('click', () => run(false));
buttons[1].addEventListener('click', () => run(true));

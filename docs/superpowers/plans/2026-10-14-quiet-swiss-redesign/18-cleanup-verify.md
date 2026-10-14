# Task 18: Cleanup and full verification

Part of [the Quiet Swiss plan](../2026-10-14-quiet-swiss-redesign.md). Read its **Global Constraints** first. Runs after Tasks 1–17 are committed.

**Files:**
- Delete: `src/components/ui/reveal.tsx`, `src/components/ui/animated-counter.tsx` (replaced by `system/Reveal` and `system/CountUp`)
- Create: `docs/superpowers/tools/cdp.cjs` (the Chrome DevTools harness both tools share)
- Rewrite: `docs/superpowers/tools/shoot.cjs` (on top of `cdp.cjs`; adds a tablet pass, more dialogs, the phone menu, touch and reduced-motion emulation)
- Create: `docs/superpowers/tools/smoke.cjs` (click-through check that fails on console errors or broken interactions)

**Interfaces:**
- Consumes: the finished site; selectors from earlier tasks: `section[id]`, `.surface-interactive[role="button"]` (Task 4 `Surface` with `onActivate`), `[role="radiogroup"][aria-label="View mode"]` (Task 8), `[aria-label="Footprint view"]` with options "Map view"/"Table view" (Task 12), `[aria-label="Timeline view"]` with "Timeline view"/"List view" (Task 13), `[aria-label="Open menu"]` and `[aria-label="Back to top"]` (Task 5), `.detail-dialog-title` and `.detail-row[role="button"]` (Task 15), `.reveal` (Tasks 1 and 3).
- Produces: a verified branch, plus `cdp.cjs` exporting `launch({ outDir, port, onEvent? })` → `{ send, evalJS, shot, press, load, close }` and `sleep(ms)`.

---

- [ ] **Step 1: Remove the superseded UI helpers**

Run:

```bash
git grep -nE "ui/reveal|ui/animated-counter|BackgroundAnimation|components/Navigation" -- src
```

Expected: no output. Then delete the two files:

```bash
git rm src/components/ui/reveal.tsx src/components/ui/animated-counter.tsx
```

If the grep printed anything, the task that owns that file missed a migration: fix the import to use `@/components/system/Reveal` or `@/components/system/CountUp` before deleting.

- [ ] **Step 2: Sweep for legacy classes and animations**

The old stylesheet's classes no longer exist, so any leftover use silently does nothing. Run:

```bash
git grep -nwE "glass|text-gradient|text-gradient-animated|gradient-card|gradient-bg|card-hover|btn-shine|link-hover|section-divider|bg-grid|portfolio-card|portfolio-glow-pulse|portfolio-light-streak|aurora|aurora-1|aurora-2|aurora-3|education-bg|glow-on-hover|hero-animated-bg|hero-overlay|background-animation|reveal-left|reveal-right|reveal-scale|typing-caret|animate-fade-in|animate-slide-in|animate-scale-in|animate-glow|hero-bg" -- "src/*.tsx" "src/*.ts" "src/*.css"
```

Expected: no output. (`reveal`, `is-revealed` and `animate-in` are current classes and are deliberately not in the list.) Remove any hit: delete the class, or swap it for the design-system equivalent used by the surrounding task (for example `surface`, `type-meta`, `link-quiet`).

- [ ] **Step 3: Create `docs/superpowers/tools/cdp.cjs`**

```js
// Minimal Chrome DevTools Protocol harness shared by shoot.cjs and smoke.cjs (Node 22+, built-in WebSocket).
const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const CHROME_CANDIDATES = [
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
];
const KEY_CODES = { Escape: 27, Enter: 13, Tab: 9 };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const getJSON = (url) =>
  new Promise((res, rej) =>
    http.get(url, (r) => { let s = ''; r.on('data', (d) => (s += d)); r.on('end', () => res(JSON.parse(s))); }).on('error', rej)
  );

/**
 * Starts headless Chrome (CHROME_PATH or a standard install), connects to its page and returns helpers.
 * `onEvent(method, params)` receives every CDP event (console messages, exceptions, log entries).
 */
async function launch({ outDir, port, onEvent = () => {} }) {
  const chromePath = process.env.CHROME_PATH || CHROME_CANDIDATES.find((p) => fs.existsSync(p));
  if (!chromePath) throw new Error('Chrome not found; set CHROME_PATH');
  // Absolute paths only: Chrome exits at once (code 21) for a relative --user-data-dir.
  const out = path.resolve(outDir).replace(/\\/g, '/');
  fs.mkdirSync(out, { recursive: true });
  // Keep Chrome's throwaway profile outside the project: Vite's file watcher crashes (EBUSY) on files Chrome holds open.
  const profile = path.join(os.tmpdir(), `cdp-profile-${port}-${process.pid}`).replace(/\\/g, '/');
  const chrome = spawn(chromePath, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--disable-extensions',
    `--user-data-dir=${profile}`, `--remote-debugging-port=${port}`, '--window-size=1440,900', 'about:blank',
  ], { stdio: 'ignore' });
  // Also clean up when a run fails and the script exits early.
  process.on('exit', () => {
    chrome.kill();
    try { fs.rmSync(profile, { recursive: true, force: true }); } catch {}
  });

  let targets = null;
  for (let i = 0; i < 50 && !targets; i++) {
    try { targets = await getJSON(`http://localhost:${port}/json`); } catch { await sleep(200); }
  }
  if (!targets) throw new Error('Chrome devtools port never came up');
  const page = targets.find((t) => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });

  let id = 0;
  const pending = new Map();
  ws.onmessage = (m) => {
    const msg = JSON.parse(m.data);
    if (msg.id && pending.has(msg.id)) {
      const { res, rej } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? rej(new Error(JSON.stringify(msg.error))) : res(msg.result);
    } else if (msg.method) {
      onEvent(msg.method, msg.params);
    }
  };

  const send = (method, params = {}) =>
    new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });

  const evalJS = async (expression) => {
    const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' ' + JSON.stringify(r.exceptionDetails.exception));
    return r.result.value;
  };

  const shot = async (name) => {
    const r = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${out}/${name}.png`, Buffer.from(r.data, 'base64'));
  };

  const press = async (key) => {
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key, code: key, windowsVirtualKeyCode: KEY_CODES[key], text: key === 'Enter' ? '\r' : undefined });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key, code: key, windowsVirtualKeyCode: KEY_CODES[key] });
    await sleep(key === 'Tab' ? 120 : 600);
  };

  /** Sets the viewport (touch emulation for phones), loads the URL, walks the page once so reveals fire; returns the page height. */
  const load = async (url, { width, height, mobile = false, walk = true }) => {
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile });
    await send('Emulation.setTouchEmulationEnabled', { enabled: mobile, maxTouchPoints: mobile ? 5 : 0 });
    await send('Page.navigate', { url });
    await sleep(4500);
    if (walk) {
      await evalJS(`(async () => { const s = (ms) => new Promise((r) => setTimeout(r, ms));
        for (let y = 0; y < document.documentElement.scrollHeight; y += ${Math.floor(height * 0.7)}) { window.scrollTo(0, y); await s(90); }
        window.scrollTo(0, 0); await s(700); })()`);
    }
    return evalJS('document.documentElement.scrollHeight');
  };

  const close = async () => {
    ws.close();
    chrome.kill();
    await sleep(300);
    try { fs.rmSync(profile, { recursive: true, force: true }); } catch {}
  };

  await send('Page.enable');
  await send('Runtime.enable');

  return { send, evalJS, shot, press, load, close };
}

module.exports = { launch, sleep };
```

- [ ] **Step 4: Rewrite `docs/superpowers/tools/shoot.cjs`**

Replace the whole file with:

```js
// Saves screenshots of the whole site (desktop, tablet, phone) plus key dialogs and states.
// Usage: node docs/superpowers/tools/shoot.cjs <outDir> [url]
// Env: CHROME_PATH=<browser binary>, REDUCED_MOTION=1 to emulate prefers-reduced-motion: reduce.
const { launch, sleep } = require('./cdp.cjs');

const OUT = process.argv[2];
const BASE = process.argv[3] || 'http://localhost:5199/';

async function main() {
  if (!OUT) throw new Error('usage: node shoot.cjs <outDir> [url]');
  const page = await launch({ outDir: OUT, port: 9333 });
  const { send, evalJS, shot, press, load } = page;
  if (process.env.REDUCED_MOTION === '1') {
    await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  }

  async function tiles(prefix, width, height, mobile, maxTiles) {
    const total = await load(BASE, { width, height, mobile });
    const n = Math.min(maxTiles, Math.ceil(total / height));
    for (let i = 0; i < n; i++) {
      await evalJS(`window.scrollTo(0, ${i * height}); new Promise(r => setTimeout(r, 450))`);
      await shot(`${prefix}_${String(i).padStart(2, '0')}`);
    }
    console.log(`${prefix}: ${width}x${height}, page height ${total}, ${n} tiles`);
  }

  // Clicks the first match, waits for its dialog and saves a screenshot.
  async function dialogShot(name, selector) {
    const result = await evalJS(`(async () => { const s = (ms) => new Promise((r) => setTimeout(r, ms));
      const el = document.querySelector(${JSON.stringify(selector)}); if (!el) return 'no element';
      el.scrollIntoView({ block: 'center' }); await s(300); el.click(); await s(1500);
      const dialog = [...document.querySelectorAll('[role="dialog"]')].pop();
      return dialog ? 'opened ' + (dialog.querySelector('.detail-dialog-title')?.textContent || '') : 'no dialog'; })()`);
    console.log(`${name} dialog: ${result}`);
    await shot(`desktop_dialog_${name}`);
    await press('Escape');
  }

  await tiles('desktop', 1440, 900, false, 40);
  console.log('sections (id:top:height):', await evalJS(`[...document.querySelectorAll('section[id]')].map(s => s.id + ':' + Math.round(s.getBoundingClientRect().top + window.scrollY) + ':' + Math.round(s.getBoundingClientRect().height)).join(', ')`));
  await dialogShot('project', '#portfolio .surface-interactive');
  await dialogShot('experience', '#experience .surface-interactive');
  await dialogShot('skill', '#skills .surface-interactive');

  // Experience card hover state (content expands on hover).
  const hover = await evalJS(`(async () => { const s = (ms) => new Promise((r) => setTimeout(r, ms));
    const el = document.querySelector('#experience .surface-interactive'); if (!el) return null;
    el.scrollIntoView({ block: 'center' }); await s(300); const r = el.getBoundingClientRect(); return { x: r.left + 200, y: r.top + 40 }; })()`);
  if (hover) {
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: hover.x, y: hover.y });
    await sleep(700);
    await shot('desktop_hover_experience');
  }

  await tiles('tablet', 1024, 768, false, 40);
  await tiles('mobile', 390, 844, true, 40);

  // Phone menu sheet.
  console.log('mobile menu:', await evalJS(`(async () => { const s = (ms) => new Promise((r) => setTimeout(r, ms));
    window.scrollTo(0, 0); await s(400);
    const el = document.querySelector('[aria-label="Open menu"]'); if (!el) return 'no menu button';
    el.click(); await s(900); return 'opened'; })()`));
  await shot('mobile_menu');
  await press('Escape');

  await page.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 5: Create `docs/superpowers/tools/smoke.cjs`**

```js
// Clicks through the site in headless Chrome and exits non-zero on console errors or broken interactions.
// Usage: node docs/superpowers/tools/smoke.cjs <outDir> [url]
// Env: CHROME_PATH=<browser binary>.
const { launch, sleep } = require('./cdp.cjs');

const OUT = process.argv[2];
const BASE = process.argv[3] || 'http://localhost:5199/';
const SECTION_ORDER = 'hero,about,experience,domains,skills,portfolio,customers,references,education,map,timeline,contact';
const CARD = '.surface-interactive[role="button"]';

async function main() {
  if (!OUT) throw new Error('usage: node smoke.cjs <outDir> [url]');

  const errors = [];
  const resourceErrors = [];
  const page = await launch({
    outDir: OUT,
    port: 9334,
    onEvent: (method, params) => {
      if (method === 'Runtime.exceptionThrown') {
        errors.push(`exception: ${params.exceptionDetails.exception?.description || params.exceptionDetails.text}`);
      } else if (method === 'Runtime.consoleAPICalled' && params.type === 'error') {
        errors.push(`console.error: ${params.args.map((a) => a.value ?? a.description ?? '').join(' ').slice(0, 400)}`);
      } else if (method === 'Log.entryAdded' && params.entry.level === 'error') {
        resourceErrors.push(`${params.entry.text} ${params.entry.url || ''}`.trim());
      }
    },
  });
  const { send, evalJS, shot, press, load } = page;
  await send('Log.enable');

  const failures = [];
  const expect = (name, ok, detail) => {
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail !== undefined ? `  (${detail})` : ''}`);
    if (!ok) failures.push(name);
  };
  const dialogCount = () => evalJS(`document.querySelectorAll('[role="dialog"]').length`);
  const closeAll = async () => {
    for (let i = 0; i < 4 && (await dialogCount()) > 0; i++) await press('Escape');
  };
  // Clicks the first match (twice if a touch-style card only expanded) and reports the top dialog's title.
  const openFrom = (selector) => evalJS(`(async () => { const s = (ms) => new Promise((r) => setTimeout(r, ms));
    const el = document.querySelector(${JSON.stringify(selector)}); if (!el) return 'missing';
    el.scrollIntoView({ block: 'center' }); await s(400); el.click(); await s(1300);
    if (!document.querySelector('[role="dialog"]')) { el.click(); await s(1300); }
    const dialog = [...document.querySelectorAll('[role="dialog"]')].pop();
    return dialog ? (dialog.querySelector('.detail-dialog-title')?.textContent || 'untitled').trim() : 'no dialog'; })()`);

  // ---------- Desktop ----------
  await load(BASE, { width: 1440, height: 900 });

  const order = await evalJS(`[...document.querySelectorAll('section[id]')].map((s) => s.id).join(',')`);
  expect('all twelve sections render in order', order === SECTION_ORDER, order);

  for (const sectionId of ['skills', 'portfolio', 'customers', 'references']) {
    const modes = await evalJS(`(async () => { const s = (ms) => new Promise((r) => setTimeout(r, ms));
      const section = document.getElementById(${JSON.stringify(sectionId)}); if (!section) return 'no section';
      section.scrollIntoView(); await s(500);
      const radios = [...section.querySelectorAll('[role="radiogroup"][aria-label="View mode"] [role="radio"]')];
      const out = [];
      for (const radio of radios) { radio.click(); await s(700); out.push(radio.getAttribute('aria-label') + '=' + section.querySelectorAll('.surface').length); }
      if (radios[0]) { radios[0].click(); await s(400); }
      return out.join(' '); })()`);
    expect(`${sectionId}: every view mode shows items`, modes !== '' && modes !== 'no section' && !/=0(\s|$)/.test(modes), modes);
  }

  const entryPoints = [
    ['project', `#portfolio ${CARD}`],
    ['skill', `#skills ${CARD}`],
    ['client', `#customers ${CARD}`],
    ['domain', `#domains ${CARD}`],
    ['education', `#education ${CARD}`],
    ['experience', `#experience ${CARD}`],
  ];
  for (const [name, selector] of entryPoints) {
    const title = await openFrom(selector);
    expect(`${name} dialog opens from its section`, !['missing', 'no dialog'].includes(title), title);
    await shot(`dialog_${name}`);
    await closeAll();
    expect(`${name} dialog closes on Escape`, (await dialogCount()) === 0);
  }

  const nested = await evalJS(`(async () => { const s = (ms) => new Promise((r) => setTimeout(r, ms));
    const card = document.querySelector('#portfolio ${CARD}'); if (!card) return 'no card';
    card.scrollIntoView({ block: 'center' }); await s(300); card.click(); await s(1300);
    const tab = [...document.querySelectorAll('[role="dialog"] [role="tab"]')].find((t) => /skills/i.test(t.textContent)); if (!tab) return 'no skills tab';
    tab.focus(); tab.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 })); await s(600);
    const row = document.querySelector('[role="dialog"] .detail-row[role="button"]'); if (!row) return 'no clickable row';
    row.click(); await s(1300);
    return String(document.querySelectorAll('[role="dialog"]').length); })()`);
  expect('a skill row inside the project dialog opens the skill dialog on top', nested === '2', nested);
  await closeAll();

  const footprint = await evalJS(`(async () => { const s = (ms) => new Promise((r) => setTimeout(r, ms));
    const section = document.getElementById('map'); section.scrollIntoView(); await s(700);
    const table = section.querySelector('[role="radio"][aria-label="Table view"]'); if (!table) return 'no table toggle';
    table.click(); await s(900);
    const row = section.querySelector('tbody tr'); if (!row) return 'no rows';
    row.click(); await s(1300);
    const dialog = [...document.querySelectorAll('[role="dialog"]')].pop();
    return dialog ? (dialog.querySelector('.detail-dialog-title')?.textContent || 'untitled').trim() : 'no dialog'; })()`);
  expect('a footprint table row opens a dialog', !['no table toggle', 'no rows', 'no dialog'].includes(footprint), footprint);
  await closeAll();

  const maximise = await evalJS(`(async () => { const s = (ms) => new Promise((r) => setTimeout(r, ms));
    const section = document.getElementById('map');
    section.querySelector('[role="radio"][aria-label="Map view"]')?.click(); await s(900);
    const button = [...section.querySelectorAll('button')].find((b) => /maximize/i.test(b.textContent)); if (!button) return 'no maximize button';
    button.click(); await s(800);
    const rect = section.querySelector('.map-frame').getBoundingClientRect();
    return Math.round(rect.width) + 'x' + Math.round(rect.height); })()`);
  expect('map maximise fills the viewport', maximise === '1440x900', maximise);
  await shot('map_maximized');
  await press('Escape');
  const restored = await evalJS(`Math.round(document.querySelector('#map .map-frame').getBoundingClientRect().width)`);
  expect('Escape restores the map', restored < 1440, String(restored));

  const timeline = await evalJS(`(async () => { const s = (ms) => new Promise((r) => setTimeout(r, ms));
    const section = document.getElementById('timeline'); section.scrollIntoView(); await s(700);
    const list = section.querySelector('[role="radio"][aria-label="List view"]'); if (!list) return 'no list toggle';
    list.click(); await s(900);
    const item = section.querySelector('${CARD}'); if (!item) return 'no items';
    item.click(); await s(1300);
    const dialog = [...document.querySelectorAll('[role="dialog"]')].pop();
    return dialog ? (dialog.querySelector('.detail-dialog-title')?.textContent || 'untitled').trim() : 'no dialog'; })()`);
  expect('a timeline list item opens a dialog', !['no list toggle', 'no items', 'no dialog'].includes(timeline), timeline);
  await closeAll();

  // Keyboard: Enter on a focused card opens its dialog, Tab stays inside, Escape closes and returns focus.
  await evalJS(`(() => { const el = document.querySelector('#portfolio ${CARD}'); el.scrollIntoView({ block: 'center' }); el.focus(); })()`);
  await press('Enter');
  await sleep(900);
  const openedByKey = await dialogCount();
  for (let i = 0; i < 8; i++) await press('Tab');
  const focusInside = await evalJS(`Boolean(document.activeElement && document.activeElement.closest('[role="dialog"]'))`);
  await press('Escape');
  await sleep(300);
  const focusBack = await evalJS(`document.activeElement === document.querySelector('#portfolio ${CARD}')`);
  expect('keyboard: Enter opens, Tab is trapped, Escape returns focus', openedByKey === 1 && focusInside && focusBack, `dialogs ${openedByKey}, inside ${focusInside}, returned ${focusBack}`);

  const top = await evalJS(`(async () => { const s = (ms) => new Promise((r) => setTimeout(r, ms));
    window.scrollTo(0, document.documentElement.scrollHeight); await s(1000);
    const button = document.querySelector('[aria-label="Back to top"]'); if (!button) return -1;
    button.click(); await s(1800); return Math.round(window.scrollY); })()`);
  expect('back to top returns to the top', top >= 0 && top < 40, String(top));

  const cvLinks = await evalJS(`[...document.querySelectorAll('a[href$=".pdf"]')].length`);
  expect('CV download links are on the page', cvLinks >= 2, String(cvLinks));

  // ---------- Phone ----------
  await load(BASE, { width: 390, height: 844, mobile: true });
  const overflow = await evalJS(`document.documentElement.scrollWidth - document.documentElement.clientWidth`);
  expect('phone: no horizontal page scroll', overflow <= 0, `${overflow}px`);

  const sheet = await evalJS(`(async () => { const s = (ms) => new Promise((r) => setTimeout(r, ms));
    window.scrollTo(0, 0); await s(400);
    const button = document.querySelector('[aria-label="Open menu"]'); if (!button) return 'no menu button';
    button.click(); await s(900);
    const link = [...document.querySelectorAll('[role="dialog"] nav a, [role="dialog"] nav button')].find((a) => /projects/i.test(a.textContent)); if (!link) return 'no projects link';
    link.click(); await s(2000);
    return document.querySelectorAll('[role="dialog"]').length + '|' + Math.round(document.getElementById('portfolio').getBoundingClientRect().top); })()`);
  const [sheetDialogs, portfolioTop] = String(sheet).split('|');
  expect('phone: the menu sheet jumps to Projects and closes', sheetDialogs === '0' && Math.abs(Number(portfolioTop)) < 140, sheet);

  const touch = await evalJS(`(async () => { const s = (ms) => new Promise((r) => setTimeout(r, ms));
    if (matchMedia('(hover: hover) and (pointer: fine)').matches) return 'skipped (touch emulation not active)';
    const card = document.querySelector('#experience ${CARD}'); if (!card) return 'no card';
    card.scrollIntoView({ block: 'center' }); await s(400);
    const before = card.getBoundingClientRect().height; card.click(); await s(900);
    return document.querySelectorAll('[role="dialog"]').length + ' dialogs, height ' + Math.round(before) + ' -> ' + Math.round(card.getBoundingClientRect().height); })()`);
  if (String(touch).startsWith('skipped')) {
    console.log(`INFO  phone: tap-to-expand ${touch}`);
  } else {
    const match = /^0 dialogs, height (\d+) -> (\d+)$/.exec(touch);
    expect('phone: first tap expands an experience card instead of opening it', Boolean(match) && Number(match[2]) > Number(match[1]), touch);
  }
  await closeAll();

  // ---------- Reduced motion ----------
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await load(BASE, { width: 1440, height: 900, walk: false });
  const hidden = await evalJS(`[...document.querySelectorAll('.reveal')].filter((el) => parseFloat(getComputedStyle(el).opacity) < 0.99).length`);
  expect('reduced motion: all reveal content visible without scrolling', hidden === 0, `${hidden} hidden`);
  const running = await evalJS(`document.getAnimations().filter((a) => a.playState === 'running').length`);
  console.log(`INFO  reduced motion: ${running} running animations`);
  await shot('reduced_motion_top');

  console.log(`\n${errors.length} console errors, ${resourceErrors.length} failed resources`);
  errors.forEach((e) => console.log(`  ERROR ${e}`));
  resourceErrors.slice(0, 20).forEach((e) => console.log(`  RESOURCE ${e}`));
  await page.close();

  if (failures.length || errors.length) {
    console.log(`\nFAILED: ${failures.length} checks, ${errors.length} console errors`);
    process.exit(1);
  }
  console.log('\nAll smoke checks passed.');
}

main().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 6: Run all quality gates**

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Expected: all pass.

- [ ] **Step 7: Run the smoke check against the dev server and the production build**

Start the dev server in the background (`npm run dev -- --port 5199 --strictPort`), then:

```bash
node docs/superpowers/tools/smoke.cjs .superpowers/shots/task-18-smoke-dev http://localhost:5199/
```

Expected: every line `PASS` (an `INFO` line for tap-to-expand is fine), `0 console errors`, exit code 0. `RESOURCE` lines are reported but do not fail the run; investigate any that point at `/data/*.json` or a font. Stop the dev server.

Then check the built site the way GitHub Pages serves it:

```bash
npm run build
npm run preview -- --port 5299 --strictPort
```

and, in another shell:

```bash
node docs/superpowers/tools/smoke.cjs .superpowers/shots/task-18-smoke-preview http://localhost:5299/
```

Expected: the same result. Stop the preview server. Fix every `FAIL` or console error in the task file that owns the component, re-run the gates, and commit the fix before continuing.

- [ ] **Step 8: Screenshot pass at three sizes**

With the dev server running:

```bash
node docs/superpowers/tools/shoot.cjs .superpowers/shots/task-18 http://localhost:5199/
REDUCED_MOTION=1 node docs/superpowers/tools/shoot.cjs .superpowers/shots/task-18-reduced http://localhost:5199/
```

Open the PNGs and compare them with the mockup (`docs/superpowers/specs/assets/2026-10-13-quiet-swiss-mockup.html`, open it in a browser). Check:
1. **Desktop (`desktop_*`)**: every section has its `NN / label` eyebrow, a two-tone title and quiet lede; cards are flat `#0f0f12` surfaces with hairline borders and 10px corners; no leftover gradients, glass blur or rounded pills; the ticker band sits between hero and about.
2. **Tablet (`tablet_*`)**: the nav shows the menu button instead of links; card grids are two columns, tiles six columns; section headers stack.
3. **Phone (`mobile_*`)**: one-column cards, three-column skill tiles, 2×2 stats, chip rows scroll sideways, no text overflowing its card, the timeline rail is hidden, and `mobile_menu.png` shows the full-screen menu sheet with large tap targets.
4. **Dialogs (`desktop_dialog_*`)**: project, experience and skill dialogs share one header layout (logo tile, title, mono meta, tags, two icon buttons) and underline tabs with mono counts.
5. **Reduced motion (`task-18-reduced`)**: the same content, fully visible, with no blur or offset on any card.

- [ ] **Step 9: Manual checklist (spec §11.3) in a real browser**

Open `http://localhost:5199/` in Chrome and tick each item:
- [ ] Each ListViewer section (skills, projects, clients, references): every view mode, every category chip, search (type a word, then clear it), and "Show more"/"Show less".
- [ ] Experience and education cards expand on hover (desktop); with DevTools device toolbar (touch) the first tap expands and the second opens the dialog.
- [ ] References carousel: drag with the mouse and swipe in touch mode; arrow keys move it when focused; the progress bars follow.
- [ ] Dialogs open from every entry point: section cards, map markers, map table rows, timeline items, and links inside other dialogs; maximise and restore work; Escape and the close button both close.
- [ ] Footprint: chips filter the pins and the table; map/table switch; maximise fills the screen, locks page scroll, Escape restores.
- [ ] Timeline: chips filter; zoom in/out changes the axis label; timeline/list switch.
- [ ] CV downloads (compact and detailed) work from the nav menu, the hero, the phone menu sheet and the contact section.
- [ ] Back-to-top appears after scrolling and returns to the top.
- [ ] `/privacy/amelbook` looks exactly as on `prod` (open both side by side), and an unknown URL shows the new 404 page.
- [ ] Moving the mouse shows the line field and flashlight grid reacting; scrolling fast skews the page slightly and it settles at rest; titles drift sideways while scrolling (desktop only); numbers count up when their stats enter the view.

- [ ] **Step 10: Keyboard pass**

Starting from the address bar, press Tab through the page: focus moves in layout order (nav links, CV menu, hero buttons, cards, chips, segmented controls); every focused element shows the 2px accent focus ring; Enter or Space opens a focused card; arrow keys move within a segmented control; inside a dialog Tab cycles through its controls only and Escape returns focus to the card that opened it; the phone menu sheet traps focus and closes on Escape.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "chore(design): remove superseded helpers and add screenshot and smoke tools

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

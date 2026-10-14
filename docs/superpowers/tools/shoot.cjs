// Saves screenshots of the whole site (desktop, tablet, phone) plus key dialogs and states.
// Usage: node docs/superpowers/tools/shoot.cjs <outDir> [url]
// Env: CHROME_PATH=<browser binary>, REDUCED_MOTION=1 to emulate prefers-reduced-motion: reduce.
const { launch, sleep } = require('./cdp.cjs');

// Resolves once the scroll skew has settled and every reveal block in view has finished fading in (9 s at most).
// Without it a tile is captured mid-transition: reveals take about a second and headless Chrome renders slowly.
const SETTLE = `new Promise((resolve) => {
  const started = performance.now();
  const tick = () => {
    const main = document.querySelector('main');
    const skewed = Boolean(main && main.style.transform);
    const unsettled = [...document.querySelectorAll('.reveal')].some((el) => {
      const rect = el.getBoundingClientRect();
      const visible = Math.min(rect.bottom, innerHeight) - Math.max(rect.top, 0);
      if (visible < Math.min(rect.height, innerHeight) * 0.1) return false;
      const style = getComputedStyle(el);
      return !el.classList.contains('is-revealed') || parseFloat(style.opacity) < 0.99 || style.filter !== 'none';
    });
    if ((!skewed && !unsettled) || performance.now() - started > 9000) resolve();
    else setTimeout(tick, 100);
  };
  tick();
})`;

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
      await evalJS(`window.scrollTo({ top: ${i * height}, behavior: 'instant' }); ${SETTLE}`);
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
  const found = await evalJS(`(async () => { const s = (ms) => new Promise((r) => setTimeout(r, ms));
    const el = document.querySelector('#experience .surface-interactive'); if (!el) return false;
    el.scrollIntoView({ behavior: 'instant', block: 'center' }); await s(300); return true; })()`);
  if (found) {
    await evalJS(SETTLE);
    const hover = await evalJS(`(() => { const r = document.querySelector('#experience .surface-interactive').getBoundingClientRect(); return { x: r.left + 200, y: r.top + 40 }; })()`);
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: hover.x, y: hover.y });
    await sleep(700);
    await shot('desktop_hover_experience');
  }

  await tiles('tablet', 1023, 768, false, 40); // 1023, not 1024: Tailwind's lg starts at 1024
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

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

  // The screenshot viewer: find a project with a Screenshots tab, open its first screenshot and expect a second dialog.
  const projectCards = await evalJS(`document.querySelectorAll('#portfolio ${CARD}').length`);
  let viewer = 'no project with screenshots';
  const errorsBeforeViewer = errors.length;
  for (let i = 0; i < projectCards; i++) {
    const found = await evalJS(`(async () => { const s = (ms) => new Promise((r) => setTimeout(r, ms));
      const card = document.querySelectorAll('#portfolio ${CARD}')[${i}]; if (!card) return 'no card';
      card.scrollIntoView({ block: 'center' }); await s(300); card.click(); await s(1500);
      const tab = [...document.querySelectorAll('[role="dialog"] [role="tab"]')].find((t) => /screenshots/i.test(t.textContent)); if (!tab) return 'no screenshots tab';
      tab.focus(); tab.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 })); await s(600);
      return 'screenshots'; })()`);
    if (found === 'screenshots') {
      viewer = await evalJS(`(async () => { const s = (ms) => new Promise((r) => setTimeout(r, ms));
        const shot = document.querySelector('[role="dialog"] .surface-interactive[role="button"]'); if (!shot) return 'no screenshot card';
        shot.click(); await s(1300);
        return String(document.querySelectorAll('[role="dialog"]').length); })()`);
      await shot('dialog_screenshot_viewer');
      await closeAll();
      break;
    }
    await closeAll();
  }
  expect('a screenshot opens the viewer on top without console errors', viewer === '2' && errors.length === errorsBeforeViewer, `${viewer}, ${errors.length - errorsBeforeViewer} new errors`);

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

  // On touch the card has no button role (its hint holds the buttons), so it is selected by class, not by CARD.
  const touch = await evalJS(`(async () => { const s = (ms) => new Promise((r) => setTimeout(r, ms));
    if (matchMedia('(hover: hover) and (pointer: fine)').matches) return 'skipped (touch emulation not active)';
    const card = document.querySelector('#experience .surface-interactive'); if (!card) return 'no card';
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

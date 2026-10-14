// Drives headless Chrome over CDP: scrolls through the site and saves one PNG per screen.
const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const CHROME = process.env.CHROME_PATH
  || ['C:/Program Files (x86)/Google/Chrome/Application/chrome.exe', 'C:/Program Files/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome']
    .find((p) => fs.existsSync(p));
// Chrome exits at once (code 21) for a relative --user-data-dir, so always work with an absolute output path.
const OUT = path.resolve(process.argv[2]).replace(/\\/g, '/');
const BASE = process.argv[3] || 'http://localhost:8081/';
const PORT = 9333;
// Keep Chrome's throwaway profile outside the project: Vite's file watcher crashes (EBUSY) on files Chrome holds open.
const profile = path.join(os.tmpdir(), `shoot-profile-${process.pid}`).replace(/\\/g, '/');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const getJSON = (url) =>
  new Promise((res, rej) =>
    http.get(url, (r) => { let s = ''; r.on('data', (d) => (s += d)); r.on('end', () => res(JSON.parse(s))); }).on('error', rej)
  );

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const chrome = spawn(CHROME, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--disable-extensions',
    `--user-data-dir=${profile}`, `--remote-debugging-port=${PORT}`, '--window-size=1440,900', 'about:blank',
  ], { stdio: 'ignore' });

  let targets = null;
  for (let i = 0; i < 50 && !targets; i++) {
    try { targets = await getJSON(`http://localhost:${PORT}/json`); } catch { await sleep(200); }
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
    fs.writeFileSync(`${OUT}/${name}.png`, Buffer.from(r.data, 'base64'));
  };

  await send('Page.enable');
  await send('Runtime.enable');

  async function load(width, height, mobile) {
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile });
    await send('Page.navigate', { url: BASE });
    await sleep(4500);
    // Walk the page once so IntersectionObserver reveals fire and data sections render.
    await evalJS(`(async () => {
      const s = (ms) => new Promise((r) => setTimeout(r, ms));
      for (let y = 0; y < document.documentElement.scrollHeight; y += ${Math.floor(height * 0.7)}) { window.scrollTo(0, y); await s(90); }
      window.scrollTo(0, 0); await s(700); return document.documentElement.scrollHeight;
    })()`);
    return evalJS('document.documentElement.scrollHeight');
  }

  async function tiles(prefix, width, height, mobile, maxTiles) {
    const total = await load(width, height, mobile);
    const n = Math.min(maxTiles, Math.ceil(total / height));
    for (let i = 0; i < n; i++) {
      await evalJS(`window.scrollTo(0, ${i * height}); new Promise(r => setTimeout(r, 450))`);
      await shot(`${prefix}_${String(i).padStart(2, '0')}`);
    }
    console.log(`${prefix}: ${width}x${height}, page height ${total}, ${n} tiles`);
    return total;
  }

  await tiles('desktop', 1440, 900, false, 40);

  // Project detail dialog: click the first portfolio card.
  const sections = await evalJS(`[...document.querySelectorAll('section[id]')].map(s => s.id + ':' + Math.round(s.getBoundingClientRect().top + window.scrollY) + ':' + Math.round(s.getBoundingClientRect().height)).join(', ')`);
  console.log('sections (id:top:height):', sections);
  await evalJS(`(async () => { const s = (ms) => new Promise((r) => setTimeout(r, ms));
    const el = document.querySelector('#portfolio .surface-interactive, #portfolio .cursor-pointer'); if (!el) return 'no card';
    el.scrollIntoView({ block: 'center' }); await s(300); el.click(); await s(1500); return 'clicked ' + el.className; })()`).then(console.log);
  await shot('desktop_dialog_project');
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await sleep(600);

  // Experience card hover state (content expands on hover).
  await evalJS(`(async () => { const s = (ms) => new Promise((r) => setTimeout(r, ms));
    const el = document.querySelector('#experience .surface-interactive, #experience .cursor-pointer'); if (!el) return 'no exp card';
    el.scrollIntoView({ block: 'center' }); await s(300); const r = el.getBoundingClientRect(); window.__hover = { x: r.left + 200, y: r.top + 40 }; return 'ok'; })()`);
  const hv = await evalJS('JSON.stringify(window.__hover || null)');
  if (hv && hv !== 'null') {
    const { x, y } = JSON.parse(hv);
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
    await sleep(700);
    await shot('desktop_hover_experience');
  }

  await tiles('mobile', 390, 844, true, 14);

  ws.close();
  chrome.kill();
  await sleep(300);
  try { fs.rmSync(profile, { recursive: true, force: true }); } catch {}
}

main().catch((e) => { console.error(e); process.exit(1); });

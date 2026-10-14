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
    // Chrome rejects maxTouchPoints below 1, so only pass it when touch emulation is on.
    await send('Emulation.setTouchEmulationEnabled', mobile ? { enabled: true, maxTouchPoints: 5 } : { enabled: false });
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

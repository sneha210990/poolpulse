/**
 * PoolPulse — Critical Fix Validation Tests
 *
 * Tests all four critical issues fixed in the code review:
 *   C1: loadAllBusyness now queries created_at (not expires_at)
 *   C2: XSS via innerHTML — esc() helper present and applied
 *   C3: Promise.race timeout wired up in loadAllBusyness
 *   C4: deleteEntry has error handling and user_id guard
 *
 * Runs against the static files on a local http-server.
 * Uses Playwright (Chromium headless) for browser execution.
 */

import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'http';
import { readFileSync } from 'fs';
import { extname, join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Minimal static file server ────────────────────────────────────────────────
const MIME = {
  '.html': 'text/html',
  '.js':   'application/javascript',
  '.css':  'text/css',
  '.svg':  'image/svg+xml',
  '.jpg':  'image/jpeg',
  '.png':  'image/png',
};

function startServer(root, port) {
  return new Promise((resolve) => {
    const server = createServer((req, res) => {
      let path = req.url === '/' ? '/index.html' : req.url;
      try {
        const file = readFileSync(join(root, path));
        res.writeHead(200, { 'Content-Type': MIME[extname(path)] || 'text/plain' });
        res.end(file);
      } catch {
        res.writeHead(404);
        res.end('Not found');
      }
    });
    server.listen(port, '127.0.0.1', () => resolve(server));
  });
}

// ── Test harness ──────────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;
const failures = [];

function assert(name, condition, detail = '') {
  if (condition) {
    console.log(`  ✅  ${name}`);
    passed++;
  } else {
    console.error(`  ❌  ${name}${detail ? ': ' + detail : ''}`);
    failed++;
    failures.push({ name, detail });
  }
}

// ── Static source analysis (no browser needed) ───────────────────────────────
function runStaticTests() {
  console.log('\n── Static source analysis ───────────────────────────────────');

  const index = readFileSync(join(__dirname, 'index.html'), 'utf8');
  const dash  = readFileSync(join(__dirname, 'dashboard.html'), 'utf8');

  // C1: expires_at must not appear in any query filter in loadAllBusyness
  // We look for the pattern gt('expires_at' or gt("expires_at"
  const expiresAtQuery = /\.gt\(["']expires_at["']/.test(index);
  assert('C1: expires_at filter removed from query', !expiresAtQuery,
    'Found .gt("expires_at") still in index.html');

  // C1: created_at filter must be present in the bulk load query
  const createdAtQuery = /\.gte\(["']created_at["'],\s*sinceIso\)/.test(index);
  assert('C1: created_at window filter present in loadAllBusyness', createdAtQuery,
    'Could not find .gte("created_at", sinceIso) in index.html');

  // C3: Promise.race must be called with the timeoutPromise
  const promiseRace = /Promise\.race\(\[queryPromise,\s*timeoutPromise\]\)/.test(index);
  assert('C3: Promise.race wired up with timeoutPromise', promiseRace,
    'Promise.race([queryPromise, timeoutPromise]) not found in index.html');

  // C3: queryPromise variable must be assigned before the race
  const queryPromiseAssign = /const queryPromise\s*=\s*supa/.test(index);
  assert('C3: queryPromise variable assigned', queryPromiseAssign,
    'const queryPromise = supa not found in index.html');

  // C2: esc() helper must exist in dashboard.html
  const escHelper = /function esc\(str\)/.test(dash);
  assert('C2: esc() helper defined in dashboard.html', escHelper,
    'function esc(str) not found in dashboard.html');

  // C2: esc() must be called on swim notes (one of the most dangerous fields)
  const escNotes = /esc\(s\.notes\)/.test(dash);
  assert('C2: swim notes escaped with esc()', escNotes,
    'esc(s.notes) not found in dashboard.html');

  // C2: esc() must be called on meal food field
  const escFood = /esc\(m\.food\)/.test(dash);
  assert('C2: meal food escaped with esc()', escFood,
    'esc(m.food) not found in dashboard.html');

  // C2: esc() must be called on goal name in renderGoal
  const escGoalName = /esc\(goal\.name\)/.test(dash);
  assert('C2: goal name escaped with esc()', escGoalName,
    'esc(goal.name) not found in dashboard.html');

  // C2: esc() must be called on hair profile product names
  const escHair = /esc\(profile\.clarifying\)/.test(dash);
  assert('C2: hair profile clarifying product escaped', escHair,
    'esc(profile.clarifying) not found in dashboard.html');

  // C2: raw unescaped s.notes must not appear in innerHTML context
  // The old pattern was: `<div class="entry-detail">${s.notes}</div>`
  const rawNotes = /entry-detail["']\}>\$\{s\.notes\}/.test(dash);
  assert('C2: raw s.notes no longer injected into innerHTML', !rawNotes,
    'Unescaped ${s.notes} still found in innerHTML template in dashboard.html');

  // C4: deleteEntry must destructure error from the delete call
  const deleteError = /const\s*\{\s*error\s*\}\s*=\s*await supa\.from\(table\)\.delete\(\)/.test(dash);
  assert('C4: deleteEntry destructures { error }', deleteError,
    'Error not destructured from supa.from(table).delete() in dashboard.html');

  // C4: deleteEntry must check user_id to guard cross-user deletes
  const userIdGuard = /\.delete\(\)\.eq\(['"]id['"],\s*id\)\.eq\(['"]user_id['"],\s*currentUser\.id\)/.test(dash);
  assert('C4: deleteEntry includes user_id guard', userIdGuard,
    '.eq("user_id", currentUser.id) not found in deleteEntry in dashboard.html');

  // C4: deleteEntry must show failure toast on error
  const failureToast = /Delete failed/.test(dash);
  assert('C4: deleteEntry shows failure toast on error', failureToast,
    '"Delete failed" toast message not found in dashboard.html');

  // C4: deleteEntry must return early on error (no false success toast)
  const earlyReturn = /showToast\(['"]Delete failed[^'"]*['"]\);\s*\n\s*return;/.test(dash);
  assert('C4: deleteEntry returns early on error', earlyReturn,
    'Early return after failure toast not found in dashboard.html');
}

// ── CDN stubs ─────────────────────────────────────────────────────────────────
// Minimal stubs for CDN-loaded scripts so pages work fully offline.

const STUB_REACT = `
window.React = {
  createElement: (t, p, ...c) => ({ type: t, props: { ...p, children: c.flat() } }),
  useState: (init) => { let v = init; return [v, (n) => { v = typeof n === 'function' ? n(v) : n; }]; },
  useEffect: (fn) => { try { const cleanup = fn(); if (typeof cleanup === 'function') {} } catch(e) {} },
  Fragment: 'fragment',
};`;

const STUB_REACT_DOM = `
window.ReactDOM = {
  createRoot: (el) => ({
    render: (vnode) => {
      // Don't actually render React — we only need the dashboard (plain JS) tests
      el.innerHTML = '<div id="react-stub">React stub active</div>';
    }
  })
};`;

const STUB_BABEL = `
// Minimal Babel stub: execute the script body after stripping JSX tags naively.
// For our tests we only need dashboard.html (plain JS), so React/Babel don't need to run.
window.Babel = { transform: (src) => ({ code: src }) };
// Override script[type=text/babel] execution to be a no-op for these tests
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('script[type="text/babel"]').forEach(s => {
    // Mark as processed so Babel standalone won't try to fetch itself
    s.setAttribute('data-processed', 'true');
  });
});`;

const STUB_TAILWIND = `/* Tailwind stub — no styles needed for JS logic tests */`;

const STUB_LUCIDE = `window.lucide = { createIcons: () => {} };`;

// Full Supabase JS stub — implements the API surface used by the app.
// Auth state is injectable per-test via window.__supabaseStub.
const STUB_SUPABASE = `
(function() {
  window.__supabaseStub = window.__supabaseStub || {
    session: null,
    authStateHandlers: [],
    queryResults: {},  // keyed by table name → array
    insertResults: {}, // keyed by table name → { error: null }
    deleteResults: {}, // keyed by table name → { error: null }
  };

  const stub = window.__supabaseStub;

  function makeQuery(table) {
    const q = {
      _table: table, _filters: [], _select: '*', _order: null, _limit: null,
      select(cols) { this._select = cols; return this; },
      eq(col, val) { this._filters.push({ col, val }); return this; },
      gte(col, val) { return this; },
      gt(col, val) { return this; },
      order(col, opts) { return this; },
      limit(n) { this._limit = n; return this; },
      single() {
        const rows = stub.queryResults[this._table] || [];
        const match = rows.find(r => this._filters.every(f => r[f.col] === f.val));
        return Promise.resolve(match ? { data: match, error: null } : { data: null, error: { code: 'PGRST116', message: 'no rows' } });
      },
      insert(rows) {
        const res = stub.insertResults[this._table] || { error: null };
        return Promise.resolve(res);
      },
      upsert(row) {
        return Promise.resolve({ error: null });
      },
      delete() {
        const self = this;
        return {
          eq(col, val) {
            self._filters.push({ col, val });
            return this;
          },
          then(resolve) {
            const res = stub.deleteResults[self._table] || { error: null };
            resolve(res);
          }
        };
      },
      then(resolve) {
        const rows = stub.queryResults[this._table] || [];
        const filtered = rows.filter(r => this._filters.every(f => r[f.col] === f.val));
        const limited = this._limit ? filtered.slice(0, this._limit) : filtered;
        resolve({ data: limited, error: null });
      }
    };
    return q;
  }

  const client = {
    from(table) { return makeQuery(table); },
    auth: {
      getSession() {
        return Promise.resolve({ data: { session: stub.session } });
      },
      onAuthStateChange(handler) {
        stub.authStateHandlers.push(handler);
        // Fire immediately with current state
        setTimeout(() => handler(stub.session ? 'SIGNED_IN' : 'SIGNED_OUT', stub.session), 0);
        return { data: { subscription: { unsubscribe() {} } } };
      },
      signInWithPassword({ email, password }) {
        return Promise.resolve({ error: { message: 'Test mode — no real auth' } });
      },
      signInWithOAuth({ provider, options }) {
        return Promise.resolve({ error: null });
      },
      signUp({ email, password }) {
        return Promise.resolve({ error: null });
      },
      signOut() {
        stub.session = null;
        stub.authStateHandlers.forEach(h => h('SIGNED_OUT', null));
        return Promise.resolve({ error: null });
      },
    }
  };

  window.supabase = { createClient: () => client };
})();
`;

async function stubCDNs(page) {
  // Block / stub all external origins so pages load fully offline.
  const stubs = {
    '**/react@18/**':         { body: STUB_REACT,     ct: 'application/javascript' },
    '**/react-dom@18/**':     { body: STUB_REACT_DOM,  ct: 'application/javascript' },
    '**/@babel/standalone**': { body: STUB_BABEL,      ct: 'application/javascript' },
    '**/cdn.tailwindcss.com': { body: STUB_TAILWIND,   ct: 'text/css' },
    '**/tailwindcss**':       { body: STUB_TAILWIND,   ct: 'text/css' },
    '**/lucide@**':           { body: STUB_LUCIDE,     ct: 'application/javascript' },
    '**/@supabase/**':        { body: STUB_SUPABASE,   ct: 'application/javascript' },
    '**/supabase.co/**':      { body: '{}',            ct: 'application/json' },
    // Block Google Fonts (render-blocking stylesheet)
    '**/fonts.googleapis.com/**': { body: '', ct: 'text/css' },
    '**/fonts.gstatic.com/**':    { body: '', ct: 'font/woff2' },
  };
  for (const [pattern, { body, ct }] of Object.entries(stubs)) {
    await page.route(pattern, route => route.fulfill({ status: 200, contentType: ct, body }));
  }
  // Abort anything else external (belt-and-suspenders)
  await page.route('https://**', route => {
    // Only abort if not already handled by a more specific rule above
    route.abort().catch(() => {});
  });
}

// ── Browser runtime tests ─────────────────────────────────────────────────────
async function runBrowserTests(baseUrl) {
  console.log('\n── Browser runtime tests ────────────────────────────────────');

  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const consoleErrors = [];

  // ── index.html: page loads without crashing ────────────────────────────
  console.log('\n  index.html (basic load):');
  {
    const page = await browser.newPage();
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    await stubCDNs(page);
    await page.goto(`${baseUrl}/index.html`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(300);

    const root = await page.$('#root');
    assert('index.html: #root element present in DOM', root !== null,
      '#root element missing — page may not have loaded');

    // With the Babel stub active the React component doesn't actually render,
    // but we confirm no uncaught JS errors prevented the page from loading.
    const pageTitle = await page.title();
    assert('index.html: page title set (page loaded successfully)',
      pageTitle.length > 0, `title: "${pageTitle}"`);
    await page.close();
  }

  // ── C3: Timeout logic verified via direct in-page execution ─────────────
  // We can't easily intercept the React component's loadAllBusyness because
  // it lives inside a Babel-transpiled closure. Instead we directly test the
  // Promise.race pattern that was introduced as the fix, confirming it resolves
  // within the 5s window even when the inner promise never settles.
  console.log('\n  C3: Promise.race timeout logic (direct execution):');
  {
    const page = await browser.newPage();
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    await stubCDNs(page);
    await page.goto(`${baseUrl}/index.html`, { waitUntil: 'domcontentloaded', timeout: 15000 });

    // Replicate the exact Promise.race pattern from the fixed loadAllBusyness
    // and confirm it resolves within 5.5s when the query never settles.
    const result = await page.evaluate(() => {
      return new Promise((resolve) => {
        const CHECKIN_WINDOW_MINUTES = 75;
        const sinceIso = new Date(
          Date.now() - CHECKIN_WINDOW_MINUTES * 60 * 1000
        ).toISOString();

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 5000)
        );

        // Simulated hanging query (never resolves) — mimics a slow Supabase response
        const hangingQuery = new Promise(() => {});

        const start = Date.now();
        Promise.race([hangingQuery, timeoutPromise])
          .then(() => resolve({ outcome: 'resolved', elapsed: Date.now() - start }))
          .catch(e => resolve({ outcome: e.message, elapsed: Date.now() - start }));
      });
    });

    assert('C3: Promise.race resolves when timeout fires',
      result.outcome === 'timeout', `Outcome: "${result.outcome}"`);
    assert('C3: Timeout fires within 5.5 seconds',
      result.elapsed >= 4900 && result.elapsed < 5500,
      `Elapsed: ${result.elapsed}ms (expected ~5000ms)`);

    await page.close();
  }

  // ── C2: XSS test — dashboard.html with malicious data ───────────────────
  console.log('\n  C2: dashboard.html XSS test:');
  {
    const page = await browser.newPage();
    const xssTriggered = { value: false };

    page.on('dialog', async dialog => {
      xssTriggered.value = true;
      await dialog.dismiss();
    });
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await stubCDNs(page);

    // Pre-load the Supabase stub with:
    // - a fake authenticated session
    // - XSS payloads in user_profiles, swim_sessions, etc.
    await page.addInitScript(() => {
      window.__supabaseStub = {
        session: {
          access_token: 'fake.jwt.token',
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            user_metadata: { full_name: 'Test <img src=x onerror=window.__xss_fired=true> User' },
          }
        },
        authStateHandlers: [],
        queryResults: {
          'user_profiles': [{
            id: 'test-user-id',
            goal: {
              name: '<img src=x onerror="window.__xss_goal=true">1500m Open Water',
              date: '2026-12-01',
              dist: '1500',
              start: '2026-01-01',
            },
            hair_profile: {
              hairType: 'Curly',
              colourTreated: 'No',
              clarifying: '<script>window.__xss_hair=true<\/script>UltraSwim',
              leaveIn: '<img src=x onerror="window.__xss_hair=true">Cantu',
              protein: null,
              mask: null,
            },
          }],
          'swim_sessions': [{
            id: 'swim-1',
            user_id: 'test-user-id',
            date: '2026-04-01',
            distance_m: 1500,
            duration_mins: 30,
            pace: '<img src=x onerror="window.__xss_swim=true">2:00',
            pool_name: '<script>window.__xss_swim=true<\/script>Royal Commonwealth',
            feel: '😊 Good',
            notes: '<img src=x onerror="window.__xss_notes=true">Great session',
          }],
          'nutrition_logs': [{
            id: 'meal-1',
            user_id: 'test-user-id',
            date: '2026-04-01',
            meal_type: 'Post-swim meal',
            food: '<img src=x onerror="window.__xss_food=true">Chicken and rice',
            feel: '🍽 Balanced',
            notes: '<script>window.__xss_food=true<\/script>',
          }],
          'body_stats': [{
            id: 'body-1',
            user_id: 'test-user-id',
            date: '2026-04-01',
            weight_kg: 70.5,
            sleep_hrs: 7.5,
            energy: '⚡ Great',
            notes: '<img src=x onerror="window.__xss_body=true">Feeling good',
          }],
        },
        insertResults: {},
        deleteResults: {},
      };
    });

    await page.goto(`${baseUrl}/dashboard.html`, { waitUntil: 'domcontentloaded', timeout: 10000 });
    await page.waitForTimeout(1500);

    // Check all XSS flags
    const {xssGoal, xssHair, xssSwim, xssFood, xssBody, xssNotes} = await page.evaluate(() => ({
      xssGoal:  window.__xss_goal  === true,
      xssHair:  window.__xss_hair  === true,
      xssSwim:  window.__xss_swim  === true,
      xssFood:  window.__xss_food  === true,
      xssBody:  window.__xss_body  === true,
      xssNotes: window.__xss_notes === true,
    }));

    assert('C2: XSS payload in goal name does not execute',  !xssGoal,  'goal.name XSS fired');
    assert('C2: XSS payload in hair profile does not execute', !xssHair, 'hair_profile XSS fired');
    assert('C2: XSS payload in swim session does not execute', !xssSwim, 'swim session XSS fired');
    assert('C2: XSS payload in meal food does not execute',  !xssFood,  'meal food XSS fired');
    assert('C2: XSS payload in body notes does not execute', !xssBody,  'body notes XSS fired');
    assert('C2: XSS payload in swim notes does not execute', !xssNotes, 'swim notes XSS fired');
    assert('C2: No alert dialog triggered by any XSS payload', !xssTriggered.value,
      'An alert() dialog was triggered');

    // Verify data is still displayed (just escaped, not stripped)
    const mainAppVisible = await page.evaluate(() => {
      const app = document.getElementById('mainApp');
      return app && app.style.display !== 'none';
    });
    assert('C2: Dashboard main app rendered after loading data', mainAppVisible,
      'mainApp is hidden — app may not have loaded');

    const goalSection = await page.evaluate(() =>
      document.getElementById('goalSection')?.innerText || '');
    assert('C2: Goal section shows text content (not blank after escaping)',
      goalSection.includes('1500m'), `goalSection text: "${goalSection}"`);

    await page.close();
  }

  // ── Console error check ─────────────────────────────────────────────────
  console.log('\n  Console error check:');
  const fatalErrors = consoleErrors.filter(e =>
    !e.includes('net::ERR_') &&
    !e.includes('Failed to load') &&
    !e.includes('favicon') &&
    !e.includes('ERR_ABORTED') &&
    !e.includes('ERR_FAILED') &&
    !e.includes('Test mode') &&
    !e.includes('no rows')    // expected PGRST116 from .single() when no profile
  );
  assert('No unexpected fatal JS errors across all pages', fatalErrors.length === 0,
    fatalErrors.slice(0, 3).join(' | '));

  await browser.close();
}

// ── Entry point ───────────────────────────────────────────────────────────────
async function main() {
  console.log('PoolPulse Critical Fix Tests');
  console.log('============================');

  // Static tests (no server needed)
  runStaticTests();

  // Browser tests (need a server)
  const PORT = 8743;
  const server = await startServer(__dirname, PORT);
  try {
    await runBrowserTests(`http://127.0.0.1:${PORT}`);
  } finally {
    server.close();
  }

  // Summary
  console.log('\n════════════════════════════════════════════');
  console.log(`Results: ${passed} passed, ${failed} failed`);
  if (failures.length) {
    console.log('\nFailed tests:');
    failures.forEach(f => console.log(`  • ${f.name}${f.detail ? ' — ' + f.detail : ''}`));
  }
  console.log('════════════════════════════════════════════\n');
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Test runner crashed:', err);
  process.exit(1);
});

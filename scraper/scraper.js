#!/usr/bin/env node
/**
 * PoolPulse timetable scraper
 *
 * Scrapes lane swimming sessions from Edinburgh Leisure timetable pages
 * and upserts them into the Supabase `pool_timetables` table.
 *
 * Usage:
 *   node scraper.js                        # scrape all configured pools
 *   node scraper.js royal-commonwealth     # scrape one pool by id
 *   node scraper.js royal-commonwealth --dry-run   # print without saving
 */

'use strict';

const puppeteer = require('puppeteer');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// ─── Config ───────────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY; // service role bypasses RLS

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌  Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env');
  console.error('    Copy .env.example to .env and fill in the values.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── Pool registry ────────────────────────────────────────────────────────────

const POOLS = [
  {
    id: 'royal-commonwealth',
    name: 'Royal Commonwealth Pool',
    url: 'https://www.edinburghleisure.co.uk/venues/royal-commonwealth-pool/timetables',
  },
  // Uncomment as you expand coverage:
  // { id: 'warrender',     name: 'Warrender Swim Centre',      url: 'https://www.edinburghleisure.co.uk/venues/warrender-swim-centre/timetables' },
  // { id: 'glenogle',      name: 'Glenogle Swim Centre',       url: 'https://www.edinburghleisure.co.uk/venues/glenogle-swim-centre/timetables' },
  // { id: 'leith-victoria',name: 'Leith Victoria Swim Centre', url: 'https://www.edinburghleisure.co.uk/venues/leith-victoria-swim-centre/timetables' },
  // { id: 'dalry',         name: 'Dalry Swim Centre',          url: 'https://www.edinburghleisure.co.uk/venues/dalry-swim-centre/timetables' },
  // { id: 'portobello',    name: 'Portobello Swim Centre',     url: 'https://www.edinburghleisure.co.uk/venues/portobello-swim-centre/timetables' },
  // { id: 'ainslie-park',  name: 'Ainslie Park Leisure Centre',url: 'https://www.edinburghleisure.co.uk/venues/ainslie-park-leisure-centre/timetables' },
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const LANE_KEYWORDS = ['lane swimming', 'lane swim', 'public lane', 'adult lane', 'swim lane'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isLaneSwimming(text) {
  const lower = (text || '').toLowerCase();
  return LANE_KEYWORDS.some(kw => lower.includes(kw));
}

/**
 * Normalise time strings (e.g. "9:30am", "09:30", "21:30") → "HH:MM:SS"
 * so they can be stored in a Postgres TIME column.
 */
function normaliseTime(raw) {
  if (!raw) return null;
  const s = raw.trim().toLowerCase().replace(/\s+/g, '');
  const suffix = s.endsWith('am') ? 'am' : s.endsWith('pm') ? 'pm' : null;
  const core = s.replace(/(am|pm)$/, '');
  const [hStr, mStr = '0'] = core.split(':');
  let h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (isNaN(h) || isNaN(m)) return null;
  if (suffix === 'pm' && h !== 12) h += 12;
  if (suffix === 'am' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
}

function dedupe(sessions) {
  const seen = new Set();
  return sessions.filter(s => {
    const key = `${s.pool_id}|${s.day_of_week}|${s.start_time}|${s.end_time}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ─── Network interception ─────────────────────────────────────────────────────

/**
 * Attach a response listener that captures JSON from booking-system API calls.
 * Returns the array (filled in place as responses arrive).
 */
function attachApiListener(page) {
  const captured = [];
  page.on('response', async response => {
    const url = response.url();
    const ct = response.headers()['content-type'] || '';
    if (!ct.includes('application/json')) return;
    // Only interested in endpoints that look timetable-related
    if (
      url.includes('timetable') ||
      url.includes('schedule') ||
      url.includes('activity') ||
      url.includes('session') ||
      url.includes('legend') ||
      url.includes('gladstone') ||
      url.includes('edinburghleisure')
    ) {
      try {
        const data = await response.json();
        captured.push({ url, data });
        console.log(`  📡 Captured API response: ${url}`);
      } catch (_) { /* non-JSON body */ }
    }
  });
  return captured;
}

/**
 * Parse captured API responses for lane swimming sessions.
 * Tries common field names used by Legend, Gladstone, and similar systems.
 */
function parseApiResponses(responses, poolId) {
  const sessions = [];

  for (const { url, data } of responses) {
    // Normalise to an array regardless of response shape
    const items = Array.isArray(data)
      ? data
      : (data.activities || data.sessions || data.results || data.items || data.data || []);

    if (!Array.isArray(items) || !items.length) continue;
    console.log(`  Parsing ${items.length} items from ${url}`);

    for (const item of items) {
      const name = item.activity || item.activityName || item.name || item.description || item.title || '';
      if (!isLaneSwimming(name)) continue;

      const dayRaw = item.day || item.dayOfWeek || item.weekday || item.DayOfWeek || '';
      const day = DAYS.find(d => d.toLowerCase() === dayRaw.toLowerCase()) || dayRaw;
      const start = normaliseTime(item.startTime || item.start_time || item.StartTime || item.start);
      const end   = normaliseTime(item.endTime   || item.end_time   || item.EndTime   || item.end);

      if (day && start && end) {
        sessions.push({ pool_id: poolId, day_of_week: day, start_time: start, end_time: end, activity_name: name.slice(0, 100) });
      }
    }
  }
  return sessions;
}

// ─── DOM scraping ─────────────────────────────────────────────────────────────

/**
 * Inspect the page structure and log useful diagnostics.
 */
async function diagnosePage(page) {
  return page.evaluate(() => ({
    title: document.title,
    url: location.href,
    iframes: Array.from(document.querySelectorAll('iframe')).map(f => ({ src: f.src, id: f.id, name: f.name })),
    hasTable: !!document.querySelector('table'),
    activityClassCount: document.querySelectorAll('[class*="activity"],[class*="session"],[class*="timetable"]').length,
    bodyPreview: document.body.innerText.slice(0, 600).replace(/\s+/g, ' '),
  }));
}

/**
 * Extract sessions from whichever page is currently loaded.
 * Uses three independent strategies so at least one is likely to work
 * regardless of whether the timetable is a <table>, CSS-grid divs,
 * or plain text with time patterns.
 */
async function extractFromCurrentPage(page, poolId) {
  return page.evaluate(
    (poolId, DAYS, LANE_KEYWORDS) => {
      const sessions = [];

      function isLane(text) {
        const l = (text || '').toLowerCase();
        return LANE_KEYWORDS.some(kw => l.includes(kw));
      }

      function parseTime(raw) {
        if (!raw) return null;
        const s = raw.trim().toLowerCase().replace(/\s+/g, '');
        const suffix = s.endsWith('am') ? 'am' : s.endsWith('pm') ? 'pm' : null;
        const core = s.replace(/(am|pm)$/, '');
        const [hStr, mStr = '0'] = core.split(':');
        let h = parseInt(hStr, 10);
        const m = parseInt(mStr, 10);
        if (isNaN(h) || isNaN(m)) return null;
        if (suffix === 'pm' && h !== 12) h += 12;
        if (suffix === 'am' && h === 12) h = 0;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
      }

      // ── Strategy A: HTML <table> with day headers ──────────────────────────
      for (const table of document.querySelectorAll('table')) {
        const headerCells = Array.from(table.querySelectorAll('th')).map(th => th.innerText.trim());
        const dayIndexes = {};
        headerCells.forEach((h, i) => {
          const match = DAYS.find(d => d.toLowerCase() === h.toLowerCase() || h.toLowerCase().startsWith(d.toLowerCase().slice(0, 3)));
          if (match) dayIndexes[i] = match;
        });
        if (Object.keys(dayIndexes).length < 3) continue; // not a timetable

        for (const row of table.querySelectorAll('tr')) {
          const cells = Array.from(row.querySelectorAll('td')).map(c => c.innerText.trim());
          cells.forEach((cell, colIdx) => {
            if (!isLane(cell)) return;
            const day = dayIndexes[colIdx + 1]; // +1 if col 0 is time label
            if (!day) return;
            const range = cell.match(/(\d{1,2}:\d{2}\s*(?:am|pm)?)\s*[-–—]\s*(\d{1,2}:\d{2}\s*(?:am|pm)?)/i);
            if (range) {
              sessions.push({ pool_id: poolId, day_of_week: day, start_time: parseTime(range[1]), end_time: parseTime(range[2]), activity_name: 'Lane Swimming' });
            }
          });
        }
      }

      // ── Strategy B: Structured divs / cards ───────────────────────────────
      const candidates = document.querySelectorAll(
        '[class*="activity"], [class*="session"], [class*="timetable-item"], [class*="schedule-item"], [class*="event"]'
      );
      for (const el of candidates) {
        const text = el.innerText || '';
        if (!isLane(text)) continue;
        const dayFound = DAYS.find(d => text.includes(d));
        const range = text.match(/(\d{1,2}:\d{2}\s*(?:am|pm)?)\s*[-–—]\s*(\d{1,2}:\d{2}\s*(?:am|pm)?)/i);
        if (dayFound && range) {
          sessions.push({ pool_id: poolId, day_of_week: dayFound, start_time: parseTime(range[1]), end_time: parseTime(range[2]), activity_name: 'Lane Swimming' });
        }
      }

      // ── Strategy C: Line-by-line text scan ────────────────────────────────
      // Works for pages that just render a text list of sessions.
      const lines = document.body.innerText.split('\n').map(l => l.trim()).filter(Boolean);
      let currentDay = null;
      const rangeRe = /(\d{1,2}:\d{2}\s*(?:am|pm)?)\s*[-–—]\s*(\d{1,2}:\d{2}\s*(?:am|pm)?)/i;

      for (const line of lines) {
        const dayHit = DAYS.find(d => line === d || line.startsWith(d + ' ') || line.startsWith(d + ':'));
        if (dayHit) { currentDay = dayHit; continue; }
        if (!currentDay || !isLane(line)) continue;
        const m = line.match(rangeRe);
        if (m) {
          sessions.push({ pool_id: poolId, day_of_week: currentDay, start_time: parseTime(m[1]), end_time: parseTime(m[2]), activity_name: 'Lane Swimming' });
        }
      }

      return sessions;
    },
    poolId,
    DAYS,
    LANE_KEYWORDS
  );
}

/**
 * Full DOM scrape attempt: tries the main page, then any relevant iframes.
 */
async function scrapeFromDom(page, poolId) {
  const info = await diagnosePage(page);
  console.log(`  Title   : ${info.title}`);
  console.log(`  URL     : ${info.url}`);
  console.log(`  iframes : ${info.iframes.length}`);
  info.iframes.forEach(f => console.log(`    • ${f.src || '(no src)'}`));
  console.log(`  Tables  : ${info.hasTable}`);
  console.log(`  Activity elements: ${info.activityClassCount}`);
  console.log(`  Body    : ${info.bodyPreview.slice(0, 200)}`);

  const sessions = [];

  // Try main page first
  const mainSessions = await extractFromCurrentPage(page, poolId);
  sessions.push(...mainSessions);
  if (mainSessions.length) console.log(`  Found ${mainSessions.length} sessions on main page.`);

  // Try any timetable-looking iframes
  for (const frame of info.iframes) {
    const src = frame.src || '';
    if (!src || src === 'about:blank') continue;
    if (!/(legend|gladstone|leisure|timetable|schedule|booking)/i.test(src)) continue;

    console.log(`  → Navigating into iframe: ${src}`);
    try {
      const iframePage = await page.browser().newPage();
      await iframePage.setUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
      );
      const iframeCaptures = attachApiListener(iframePage);
      await iframePage.goto(src, { waitUntil: 'networkidle2', timeout: 20000 });
      await new Promise(r => setTimeout(r, 2000));

      const apiSessions = parseApiResponses(iframeCaptures, poolId);
      if (apiSessions.length) {
        sessions.push(...apiSessions);
        console.log(`    API: found ${apiSessions.length} sessions`);
      }

      const domSessions = await extractFromCurrentPage(iframePage, poolId);
      sessions.push(...domSessions);
      if (domSessions.length) console.log(`    DOM: found ${domSessions.length} sessions`);

      await iframePage.close();
    } catch (err) {
      console.log(`    Failed: ${err.message}`);
    }
  }

  return sessions;
}

// ─── Database ─────────────────────────────────────────────────────────────────

async function saveSessions(sessions) {
  if (!sessions.length) {
    console.log('  No sessions to save.');
    return;
  }
  const poolId = sessions[0].pool_id;

  const { error: delErr } = await supabase.from('pool_timetables').delete().eq('pool_id', poolId);
  if (delErr) { console.error('  ❌  Delete failed:', delErr.message); return; }

  const { error: insErr } = await supabase.from('pool_timetables').insert(sessions);
  if (insErr) { console.error('  ❌  Insert failed:', insErr.message); return; }

  console.log(`  ✅  Saved ${sessions.length} sessions to pool_timetables.`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function printSessions(sessions) {
  if (!sessions.length) { console.log('  (none found)'); return; }
  const byDay = {};
  for (const s of sessions) (byDay[s.day_of_week] = byDay[s.day_of_week] || []).push(s);
  for (const day of DAYS) {
    if (!byDay[day]) continue;
    console.log(`\n  ${day}`);
    for (const s of byDay[day].sort((a, b) => a.start_time.localeCompare(b.start_time))) {
      console.log(`    ${s.start_time.slice(0, 5)} – ${s.end_time.slice(0, 5)}  ${s.activity_name}`);
    }
  }
}

async function scrapePool(browser, pool, dryRun) {
  console.log(`\n${'─'.repeat(62)}`);
  console.log(`Pool  : ${pool.name}`);
  console.log(`URL   : ${pool.url}`);
  console.log('─'.repeat(62));

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.setUserAgent(
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
  );
  // Intercept API calls made during initial page load
  const apiCaptures = attachApiListener(page);

  let sessions = [];
  try {
    console.log('\nLoading page...');
    await page.goto(pool.url, { waitUntil: 'networkidle2', timeout: 30000 });
    // Extra wait for any deferred JS rendering
    await new Promise(r => setTimeout(r, 3000));

    // Prefer API data — it's cleaner than DOM parsing
    const apiSessions = parseApiResponses(apiCaptures, pool.id);
    if (apiSessions.length) {
      console.log(`\nAPI interception yielded ${apiSessions.length} sessions.`);
      sessions = apiSessions;
    } else {
      console.log('\nNo API data captured — falling back to DOM parsing...');
      sessions = await scrapeFromDom(page, pool.id);
    }

    sessions = dedupe(sessions);

    console.log(`\nExtracted ${sessions.length} unique lane swimming sessions:`);
    printSessions(sessions);

    if (dryRun) {
      console.log('\n[dry-run] Skipping database write.');
    } else {
      console.log('');
      await saveSessions(sessions);
    }
  } finally {
    await page.close();
  }
  return sessions;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const poolId = args.find(a => !a.startsWith('--'));

  const pools = poolId ? POOLS.filter(p => p.id === poolId) : POOLS;
  if (!pools.length) {
    console.error(`No pool found with id "${poolId}".`);
    console.error(`Available ids: ${POOLS.map(p => p.id).join(', ')}`);
    process.exit(1);
  }

  console.log('PoolPulse Timetable Scraper');
  console.log(`Pools : ${pools.map(p => p.name).join(', ')}`);
  console.log(`Mode  : ${dryRun ? 'dry-run (no DB writes)' : 'live'}`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    for (const pool of pools) {
      await scrapePool(browser, pool, dryRun);
    }
  } finally {
    await browser.close();
  }

  console.log('\nDone.');
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});

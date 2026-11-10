// Spacing: topic mastery (new / shaky / solid) from the answer history, shown in the Topics menu, and shaky topics
// coming up more often in new practice sets.
// Solid needs 3 right in a row on at least 2 different days; 3 right on one day is shaky; a miss after a solid run
// drops back to shaky (seeded, and live through Check Answer); a topic never tried shows no badge.
const puppeteer = require('puppeteer-core');
const path = require('path');
const { APP_URL, CHROME, skipTour, fullBank } = require('./config');
const KEY = 'cs61a-practice:v1';
let fails = 0;
const ok = (c, m) => { console.log(`${c ? 'PASS' : 'FAIL'}  ${m}`); if (!c) fails++; };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

global.window = {};
require(path.join(__dirname, '..', '..', 'app', 'data', 'questions.js'));
const B = window.CS61A_BANK;
const partsOf = (pid) => B.QUESTIONS.filter((q) => q.problem === pid);
const topicsOf = (pid) => [...new Set(partsOf(pid).flatMap((q) => q.topics))];
// Noon on the day `d` days ago (local time), so "same day" and "different days" never depend on when the test runs.
const noon = (d, min = 0) => { const t = new Date(); t.setHours(12, min, 0, 0); return t.getTime() - d * 24 * 60 * 60 * 1000; };
const e = (id, ok, at) => ({ id, ok, at, via: 'check', set: 'seed' });
// Parts tagged with one topic only, so each answer counts toward that topic alone.
const LINKS = 'sp25-5a', OOP = 'fa25-5a', TREES = 'fa25-3a';
const HISTORY = [
  e(LINKS, true, noon(3)), e(LINKS, true, noon(2)), e(LINKS, true, noon(1)),              // links: solid
  e(OOP, true, noon(1, 0)), e(OOP, true, noon(1, 5)), e(OOP, true, noon(1, 10)),          // oop: 3 right, one day → shaky
  e(TREES, true, noon(4)), e(TREES, true, noon(3)), e(TREES, true, noon(2)), e(TREES, false, noon(1)), // trees: solid, then a miss → shaky
];

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
  const page = await browser.newPage();
  await skipTour(page);
  await fullBank(page);
  await page.setViewport({ width: 1400, height: 900 });
  const errors = [];
  page.on('pageerror', (er) => errors.push(String(er)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('dialog', (d) => d.accept());
  const st = async () => { await wait(300); return page.evaluate((k) => JSON.parse(localStorage.getItem(k)), KEY); };
  const seed = async (obj) => {
    await page.evaluate((k, v) => { localStorage.setItem(k, v); Storage.prototype.setItem = function () {}; }, KEY, JSON.stringify(obj));
    await page.goto(APP_URL); await wait(150);
    await page.click('[data-action="enter"]'); await wait(150);
  };
  const click = async (sel) => { await page.waitForSelector(sel, { visible: true, timeout: 8000 }); await page.click(sel); await wait(80); };
  const all = Object.keys(B.EXAMS);
  const prefs = (o) => ({ mode: 'practice', topics: [], exams: all, examsKnown: all, difficulties: ['easy', 'medium', 'hard'], timerOn: false, minutes: 25, mix: true, ...o });
  // Badge text per topic in the Topics menu ('' when none).
  const badges = async () => {
    await click('[data-action="menu"][data-id="topics"]');
    const b = await page.$$eval('input[name="topics"]', (l) => Object.fromEntries(l.map((i) => { const m = i.closest('label').querySelector('.mastery'); return [i.value, m ? m.textContent : '']; })));
    await click('[data-action="menu"][data-id="topics"]');
    return b;
  };
  await page.goto(APP_URL);

  // ── no history: no badges ──
  await seed({ version: 6, prefs: prefs({ size: 5 }) });
  let b = await badges();
  ok(Object.values(b).every((x) => x === ''), '1. no history: every topic is new (no badge)');

  // ── the three states ──
  await seed({ version: 6, prefs: prefs({ size: 5 }), history: HISTORY });
  b = await badges();
  ok(b.links === 'solid', `2. 3 right in a row over 3 days → solid (links: ${b.links || 'none'})`);
  ok(b.oop === 'shaky', `3. 3 right on one day → shaky (oop: ${b.oop || 'none'})`);
  ok(b.trees === 'shaky', `4. solid, then a miss → shaky (trees: ${b.trees || 'none'})`);
  ok(b.hof === '' && b.recursion === '', '5. topics never answered show no badge');
  await click('[data-action="menu"][data-id="topics"]');
  const key = await page.$eval('.mastery-key', (el) => el.textContent.replace(/\s+/g, ' '));
  await click('[data-action="menu"][data-id="topics"]');
  ok(/solid right 3 times in a row, on 2\+ days/.test(key) && /shaky tried, not solid yet; comes up more often/.test(key), `6. the menu explains the badges (“${key.trim()}”)`);

  // ── shaky topics come up more often ──
  const P = Object.keys(B.PROBLEMS);
  const shakyGroup = (pid) => topicsOf(pid).some((t) => t === 'oop' || t === 'trees');
  const base = P.filter(shakyGroup).length / P.length;
  let hits = 0, total = 0;
  for (let i = 0; i < 30; i++) {
    await click('[data-action="start"]'); await page.waitForSelector('#pane-right .part');
    const s = (await st()).session;
    hits += s.groups.filter((g) => shakyGroup(g.pid)).length; total += s.groups.length;
    await page.goto(APP_URL); await wait(100); await click('[data-action="enter"]');
  }
  const share = hits / total;
  // With weight 3 the expected share is about 3p / (3p + 1 - p) (about 0.6 here, against 0.36 unweighted); the bar
  // is halfway between, several standard deviations from either.
  const want = 3 * base / (3 * base + 1 - base);
  ok(share > (base + want) / 2, `7. 30 sets of 5: ${(share * 100).toFixed(0)}% of questions are in a shaky topic (unweighted: ${(base * 100).toFixed(0)}%)`);

  // ── live: a wrong answer on a solid topic makes it shaky ──
  const ids = partsOf('sp25-5a').map((q) => q.id);
  await seed({ version: 6, prefs: prefs({ size: 5 }), history: HISTORY.filter((x) => x.id === LINKS),
    session: { ids, title: 'Live', startedAt: Date.now(), timer: null } });
  b = await badges();
  ok(b.links === 'solid', '8. links starts solid');
  await click('[data-action="resume"]'); await page.waitForSelector('#part-sp25-5a');
  const right = B.ANSWER_KEY['sp25-5a'].correct;
  const wrong = (right + 1) % B.QUESTIONS.find((q) => q.id === 'sp25-5a').choices.length;
  await click(`label[for="c-sp25-5a-${wrong}"]`); await click('#part-sp25-5a [data-action="check"]');
  await click('[data-action="home"], [data-action="go-home"]');
  b = await badges();
  ok(b.links === 'shaky', `9. after a wrong Check Answer on it, links is shaky (${b.links || 'none'})`);

  ok(!errors.length, `no page errors${errors.length ? ': ' + errors.join(' | ') : ''}`);
  await browser.close();
  process.exit(fails ? 1 : 0);
})().catch((er) => { console.error(er); process.exit(1); });

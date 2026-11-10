// Review my mistakes: a practice set built from the answer history (store.history).
// The button and its hint (off with no history, off when no miss matches the filters), the mix (missed questions
// first, then other questions in the missed topics, about 30% questions right a while ago, oldest first, nothing
// answered right in the last day), set size, a small set, exam and topic filters, Mix topics off, whole groups, and
// a miss on an out-of-scope part never bringing anything in.
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
const ORDER = Object.fromEntries(B.QUESTIONS.map((q, i) => [q.id, i]));
const partsOf = (pid) => B.QUESTIONS.filter((q) => q.problem === pid);
const topicsOf = (pid) => [...new Set(partsOf(pid).flatMap((q) => q.topics))];
const DAY = 24 * 60 * 60 * 1000;
const now = Date.now();

// The history: two OOP-only questions missed (so OOP is the weak topic), five recursion-only questions right some
// days ago (topics never missed), two lists questions right an hour ago.
const MISSED = ['fa25-5', 'sp23-2a'];
const OLD = { 'sp23-5a': 6, 'sp25-5b': 5, 'sp25-5d': 4, 'fa24-4a': 3, 'fa23-4a': 2 }; // days ago
const RECENT = ['sp24-4a', 'sp24-4b'];
const entry = (id, ok, at) => ({ id, ok, at, via: 'check', set: 'seed' });
const HISTORY = [
  ...Object.entries(OLD).flatMap(([pid, d]) => partsOf(pid).map((q) => entry(q.id, true, now - d * DAY))),
  ...MISSED.flatMap((pid) => partsOf(pid).map((q) => entry(q.id, false, now - 3 * DAY))),
  ...RECENT.flatMap((pid) => partsOf(pid).map((q) => entry(q.id, true, now - 60 * 60 * 1000))),
];
const OLDEST3 = Object.entries(OLD).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([pid]) => pid);

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
  const errors = [];
  const open = async (full) => {
    const page = await browser.newPage();
    await skipTour(page);
    if (full) await fullBank(page); // fixed question list, whatever this semester's scope hides
    await page.setViewport({ width: 1400, height: 900 });
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('dialog', (d) => d.accept());
    await page.goto(APP_URL);
    return page;
  };
  const page = await open(true);
  const st = async (pg = page) => { await wait(300); return pg.evaluate((k) => JSON.parse(localStorage.getItem(k)), KEY); };
  const seed = async (obj, pg = page) => {
    await pg.evaluate((k, v) => { localStorage.setItem(k, v); Storage.prototype.setItem = function () {}; }, KEY, JSON.stringify(obj));
    await pg.goto(APP_URL); await wait(150);
    await pg.click('[data-action="enter"]'); await wait(150);
  };
  const click = async (sel) => { await page.waitForSelector(sel, { visible: true, timeout: 8000 }); await page.click(sel); await wait(80); };
  const all = Object.keys(B.EXAMS);
  const prefs = (o) => ({ mode: 'practice', topics: [], exams: all, examsKnown: all, difficulties: ['easy', 'medium', 'hard'], timerOn: false, minutes: 25, mix: true, ...o });
  const reviewOff = (pg = page) => pg.$eval('[data-action="start-review"]', (b) => b.disabled);
  const hint = (pg = page) => pg.$eval('#review-hint', (e) => e.textContent.replace(/\s+/g, ' ').trim());
  const review = async (p) => {
    await seed({ version: 6, prefs: p, history: HISTORY });
    await click('[data-action="start-review"]'); await page.waitForSelector('#pane-right .part');
    return (await st()).session;
  };
  const wholeGroups = (s) => s.groups.every((g) => JSON.stringify(g.ids) === JSON.stringify(partsOf(g.pid).map((q) => q.id)));

  // ── the button ──
  await seed({ version: 6, prefs: prefs({ size: 10 }) });
  ok(await reviewOff() && /once you’ve checked an answer and gotten it wrong/.test(await hint()), `1. no history: Review my mistakes is off (“${await hint()}”)`);
  await seed({ version: 6, prefs: prefs({ size: 10 }), history: HISTORY });
  ok(!(await reviewOff()) && /gotten wrong \(\d+ matching\)/.test(await hint()), `2. with misses: on (“${await hint()}”)`);

  // ── a set of 10: 7 weak (both misses, then OOP questions), 3 right a while ago (the oldest) ──
  let s = await review(prefs({ size: 10 }));
  let pids = s.groups.map((g) => g.pid);
  ok(s.title === 'Review my mistakes' && pids.length === 10 && new Set(pids).size === 10, `3. a set of 10 different questions titled “${s.title}”`);
  ok(MISSED.every((pid) => pids.includes(pid)), '4. both missed questions are in it');
  const old = pids.filter((pid) => pid in OLD);
  ok(old.length === 3 && OLDEST3.every((pid) => old.includes(pid)), `5. 3 of 10 (30%) were right a while ago, the oldest ones (${old.join(', ')})`);
  ok(!pids.some((pid) => RECENT.includes(pid)), '6. nothing answered right in the last day');
  const rest = pids.filter((pid) => !MISSED.includes(pid) && !(pid in OLD));
  ok(rest.length === 5 && rest.every((pid) => topicsOf(pid).includes('oop')), `7. the other 5 are from the missed topic, OOP (${rest.join(', ')})`);
  ok(wholeGroups(s), '8. every question has all of its parts, in exam order');

  // ── a small set still has both kinds ──
  s = await review(prefs({ size: 2 }));
  pids = s.groups.map((g) => g.pid);
  ok(pids.length === 2 && pids.filter((p) => MISSED.includes(p)).length === 1 && pids.includes(OLDEST3[0]), `9. a set of 2: one missed question and the oldest right one (${pids.join(', ')})`);

  // ── only what you got wrong: everything comes from the weak side ──
  await seed({ version: 6, prefs: prefs({ size: 6 }), history: HISTORY.filter((e) => !e.ok) });
  await click('[data-action="start-review"]'); await page.waitForSelector('#pane-right .part');
  pids = (await st()).session.groups.map((g) => g.pid);
  ok(pids.length === 6 && MISSED.every((p) => pids.includes(p)) && pids.every((p) => topicsOf(p).includes('oop')), '10. no right answers in the history: 6 weak questions, no filler');

  // ── filters ──
  s = await review(prefs({ size: 10, exams: ['fa25'] }));
  pids = s.groups.map((g) => g.pid);
  ok(JSON.stringify(pids) === '["fa25-5"]', `11. Fall 2025 only: just its one match, fa25-5 (${pids.join(', ')})`);
  await seed({ version: 6, prefs: prefs({ size: 10, topics: ['links'] }), history: HISTORY });
  ok(await reviewOff() && /no wrong answers match these filters/.test(await hint()), `12. Linked Lists only (no misses there): off (“${await hint()}”)`);

  // ── Mix topics off: exam order ──
  s = await review(prefs({ size: 10, mix: false }));
  pids = s.groups.map((g) => g.pid);
  ok(pids.every((p, i) => !i || ORDER[partsOf(pids[i - 1])[0].id] < ORDER[partsOf(p)[0].id]), '13. Mix topics off: the review set is in exam order');

  // ── its answers go into the history like any set ──
  const first = s.groups[0].ids.find((id) => ['single_choice'].includes(B.QUESTIONS.find((q) => q.id === id).type));
  if (first) {
    await click(`label[for="c-${first}-0"]`); await click(`#part-${first} [data-action="check"]`);
    const S = await st();
    ok(S.history.length === HISTORY.length + 1 && S.history[S.history.length - 1].set === S.session.id, '14. a checked answer in the review set is recorded');
  } else ok(true, '14. (first question has no single-choice part; skipped)');

  // ── phone width: the start row wraps and nothing scrolls sideways ──
  await page.setViewport({ width: 390, height: 844 });
  await seed({ version: 6, prefs: prefs({ size: 5 }), history: HISTORY });
  const fit = await page.evaluate(() => ['.mix-toggle', '[data-action="start-review"]', '[data-action="start"]', '#review-hint'].every((sel) => document.querySelector(sel).getBoundingClientRect().right <= document.documentElement.clientWidth)
    && document.documentElement.scrollWidth <= document.documentElement.clientWidth);
  ok(fit, '16. phone width: Mix topics, both buttons and the hint fit, no sideways scroll');
  await page.setViewport({ width: 1400, height: 900 });

  // ── scope: a miss on a hidden part brings nothing in ──
  const scoped = await open(false);
  await seed({ version: 6, prefs: prefs({ size: 10 }), history: [entry('fa25-1c', false, now - 3 * DAY)] }, scoped);
  ok(await reviewOff(scoped), '15. only an out-of-scope part missed (orders of growth): off');

  ok(!errors.length, `no page errors${errors.length ? ': ' + errors.join(' | ') : ''}`);
  await browser.close();
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });

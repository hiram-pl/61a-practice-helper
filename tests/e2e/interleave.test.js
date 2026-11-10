// Interleaving (Mix topics): practice sets alternate between topics instead of coming in bank order.
// The Mix topics box (on by default, saved, on for older saved preferences), no two groups in a row with the same main
// topic unless it can't be avoided, every part of a group together and in exam order, a narrow topic filter, and Mix
// topics off giving the former bank order.
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
// Same rule as app.js mainTopic: the tag most parts carry, ties to the one listed first.
const mainTopic = (pid) => {
  const count = {};
  const order = [];
  partsOf(pid).forEach((q) => q.topics.forEach((t) => { if (!count[t]) order.push(t); count[t] = (count[t] || 0) + 1; }));
  return order.reduce((best, t) => (best === null || count[t] > count[best] ? t : best), null);
};
// Fewest back-to-back repeats possible: only when one topic has more than half the groups.
const minRepeats = (pids) => {
  const c = {};
  pids.forEach((pid) => { const t = mainTopic(pid); c[t] = (c[t] || 0) + 1; });
  return Math.max(0, 2 * Math.max(...Object.values(c)) - pids.length - 1);
};
const repeats = (pids) => pids.slice(1).filter((pid, i) => mainTopic(pid) === mainTopic(pids[i])).length;

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
  const page = await browser.newPage();
  await skipTour(page);
  await fullBank(page); // every transcribed question, so the counts don't depend on this semester's scope
  await page.setViewport({ width: 1400, height: 900 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('dialog', (d) => d.accept());
  const st = async () => { await wait(300); return page.evaluate((k) => JSON.parse(localStorage.getItem(k)), KEY); };
  const seed = async (obj) => {
    await page.evaluate((k, v) => { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); Storage.prototype.setItem = function () {}; }, KEY, obj === null ? null : JSON.stringify(obj));
    await page.goto(APP_URL); await wait(150);
    await page.click('[data-action="enter"]'); await wait(150);
  };
  const click = async (sel) => { await page.waitForSelector(sel, { visible: true, timeout: 8000 }); await page.click(sel); await wait(80); };
  const all = Object.keys(B.EXAMS);
  const prefs = (o) => ({ mode: 'practice', topics: [], exams: all, examsKnown: all, difficulties: ['easy', 'medium', 'hard'], timerOn: false, minutes: 25, ...o });
  // Start a set from the setup screen and return its groups' problem ids.
  const startSet = async (p) => {
    await seed({ prefs: p });
    await click('[data-action="start"]'); await page.waitForSelector('#pane-right .part');
    return (await st()).session;
  };
  // Parts of each group together, in exam order, and every part of the group included.
  const wholeGroups = (s) => s.groups.every((g) => JSON.stringify(g.ids) === JSON.stringify(partsOf(g.pid).map((q) => q.id))) &&
    JSON.stringify(s.ids) === JSON.stringify(s.groups.flatMap((g) => g.ids));
  await page.goto(APP_URL);

  // ── the box: on by default, saved when changed, on for preferences saved before it existed ──
  await seed(null);
  ok(await page.$eval('#mix-topics', (i) => i.checked) && /mix topics/i.test(await page.$eval('.mix-toggle', (e) => e.textContent)), '1. Mix topics is shown and on by default');
  await click('#mix-topics');
  let S = await st();
  ok(S.prefs.mix === false && !(await page.$eval('#mix-topics', (i) => i.checked)), '2. unticking it saves mix: false');
  await click('#mix-topics');
  S = await st();
  ok(S.prefs.mix === true, '   ticking it again saves mix: true');
  await seed({ prefs: { mode: 'practice', size: 4, timerOn: false } });
  ok(await page.$eval('#mix-topics', (i) => i.checked), '3. older saved preferences (no mix field) → on');

  // ── Mix topics on: interleaved, whole groups ──
  let s = await startSet(prefs({ size: 999, mix: true }));
  let pids = s.groups.map((g) => g.pid);
  const ALL = new Set(B.QUESTIONS.map((q) => q.problem)).size;
  ok(pids.length === ALL && new Set(pids).size === ALL, `4. a set of every question has all ${ALL} groups, none twice`);
  ok(repeats(pids) === minRepeats(pids), `5. same main topic back to back only when unavoidable (${repeats(pids)} repeats, minimum ${minRepeats(pids)})`);
  ok(wholeGroups(s), '6. each group has all of its parts, together and in exam order');
  const bank = pids.slice().sort((a, b) => ORDER[partsOf(a)[0].id] - ORDER[partsOf(b)[0].id]);
  ok(JSON.stringify(pids) !== JSON.stringify(bank), '7. not in bank order');

  let allGood = true, varied = new Set();
  for (let i = 0; i < 6; i++) {
    s = await startSet(prefs({ size: 8, mix: true }));
    pids = s.groups.map((g) => g.pid);
    varied.add(pids.join());
    if (pids.length !== 8 || repeats(pids) !== minRepeats(pids) || !wholeGroups(s)) { allGood = false; console.log('      set:', pids.map((p) => `${p}:${mainTopic(p)}`).join(' ')); }
  }
  ok(allGood, '8. six sets of 8: each interleaved as far as possible, with whole groups');
  ok(varied.size > 1, `   the sets differ (${varied.size} different orders)`);

  // ── a narrow filter: one topic, so main topics repeat more ──
  s = await startSet(prefs({ size: 999, mix: true, topics: ['trees'] }));
  pids = s.groups.map((g) => g.pid);
  ok(pids.length > 1 && repeats(pids) === minRepeats(pids) && wholeGroups(s), `9. Trees only: ${pids.length} groups, ${repeats(pids)} repeats (minimum ${minRepeats(pids)})`);

  // ── Mix topics off: bank order, as before ──
  s = await startSet(prefs({ size: 999, mix: false }));
  pids = s.groups.map((g) => g.pid);
  ok(JSON.stringify(pids) === JSON.stringify(bank) && wholeGroups(s), '10. Mix topics off → every group in bank order');
  s = await startSet(prefs({ size: 6, mix: false }));
  pids = s.groups.map((g) => g.pid);
  ok(pids.every((p, i) => !i || ORDER[partsOf(pids[i - 1])[0].id] < ORDER[partsOf(p)[0].id]), '    a set of 6 with it off is in bank order too');

  // ── retrying keeps the set's own order ──
  s = await startSet(prefs({ size: 5, mix: true }));
  const first = s.groups.map((g) => g.pid);
  await click('#nav-toggle'); await click('.go-review [data-action="finish"]'); // unanswered parts → confirm (accepted)
  await click('[data-action="retry-missed"]'); await page.waitForSelector('#pane-right .part');
  S = await st();
  ok(JSON.stringify(S.session.groups.map((g) => g.pid)) === JSON.stringify(first), '11. Retry incorrect & unanswered keeps the order of the set it came from');

  // ── phone width: the box fits ──
  await page.setViewport({ width: 390, height: 844 });
  await seed({ prefs: prefs({ size: 5 }) });
  const box = await page.$eval('.mix-toggle', (e) => { const r = e.getBoundingClientRect(); return { r: r.right, w: document.documentElement.clientWidth }; });
  ok(box.r <= box.w && await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), '12. phone width: Mix topics fits, no sideways scroll');

  ok(!errors.length, `no page errors${errors.length ? ': ' + errors.join(' | ') : ''}`);
  await browser.close();
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });

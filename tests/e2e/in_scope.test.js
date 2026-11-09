// This semester's scope (app/data/in_scope.js): out-of-scope parts never appear in Practice or Exam mode, the
// out-of-scope topic is not listed, exam totals count only what is shown, scope notes appear next to their question, and
// saved data that mentions hidden parts (old attempts, old filters, old picks) still loads.
const puppeteer = require('puppeteer-core');
const path = require('path');
const { APP_URL, CHROME, skipTour } = require('./config');
const KEY = 'cs61a-practice:v1';
let fails = 0;
const ok = (c, m) => { console.log(`${c ? 'PASS' : 'FAIL'}  ${m}`); if (!c) fails++; };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

global.window = {};
require(path.join(__dirname, '..', '..', 'app', 'data', 'questions.js'));
require(path.join(__dirname, '..', '..', 'app', 'data', 'in_scope.js'));
const B = window.CS61A_BANK;
const SC = window.CS61A_SCOPE;
const OUT_T = new Set(SC.outOfScopeTopics);
const hidden = (q) => (SC.problems[q.problem] || {}).status === 'out' || (SC.questions[q.id] || {}).status === 'out' || (q.topics.length > 0 && q.topics.every((t) => OUT_T.has(t)));
const HIDDEN = new Set(B.QUESTIONS.filter(hidden).map((q) => q.id));
const examIds = (e) => B.QUESTIONS.filter((q) => B.PROBLEMS[q.problem].exam === e && !HIDDEN.has(q.id)).map((q) => q.id);
const ALL_EXAMS = Object.keys(B.EXAMS);

ok(HIDDEN.size === 24, `24 parts are out of scope (${HIDDEN.size})`);
ok(['sp24-1a', 'sp24-1b', 'sp24-1d', 'sp24-4aplus', 'sp23-4e', 'fa22-4b-c', 'sp23-2f', 'fa25-1c'].every((id) => HIDDEN.has(id)), 'mutation, repr and orders-of-growth parts are hidden');
ok(['sp24-1c', 'fa25-3a', 'sp25-3a', 'fa23-3a', 'fa22-1c', 'fa21-5b-a'].every((id) => !HIDDEN.has(id)), 'parts that only carry a note stay in scope');

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
  const page = await browser.newPage();
  await skipTour(page);
  await page.setViewport({ width: 1400, height: 900 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('dialog', (d) => d.accept());
  const st = async () => { await wait(300); return page.evaluate((k) => JSON.parse(localStorage.getItem(k)), KEY); };
  const seed = async (obj) => {
    await page.evaluate((k, v) => { localStorage.setItem(k, v); Storage.prototype.setItem = function () {}; }, KEY, JSON.stringify(obj));
    await page.goto(APP_URL); await wait(150);
  };
  const click = async (sel) => { await page.waitForSelector(sel, { visible: true, timeout: 8000 }); await page.click(sel); await wait(80); };
  const text = (sel) => page.$eval(sel, (e) => e.textContent.replace(/\s+/g, ' ').trim());
  const goTo = async (pid) => { await click('#nav-toggle'); await click(`#nav-${pid}`); await wait(200); };
  const prefs = { mode: 'practice', exams: ALL_EXAMS, examsKnown: ALL_EXAMS, topics: [], difficulties: ['easy', 'medium', 'hard'], size: 999, timerOn: false, minutes: 25 };
  await page.goto(APP_URL);

  // ── Practice: nothing out of scope, everything else offered ──
  await seed({ prefs });
  await click('[data-action="enter"]');
  await click('[data-action="menu"][data-id="topics"]');
  const topicRows = await page.$$eval('input[name="topics"]', (l) => l.map((i) => i.value));
  ok(!topicRows.includes('efficiency') && topicRows.includes('trees') && !/scope/i.test(await text('.dd-panel')), `Topics menu: Efficiency is not listed (${topicRows.length} topics shown)`);
  await click('[data-action="menu"][data-id="topics"]');
  await click('[data-action="start"]'); await page.waitForSelector('#pane-right .part');
  let S = await st();
  const inScopeCount = B.QUESTIONS.length - HIDDEN.size;
  ok(S.session.ids.length === inScopeCount && S.session.ids.every((id) => !HIDDEN.has(id)), `practice with every filter on: ${S.session.ids.length} parts, none out of scope (expected ${inScopeCount})`);

  await seed({ prefs: { ...prefs, topics: ['efficiency', 'trees'] } });
  await click('[data-action="enter"]');
  S = await st();
  ok(JSON.stringify(S.prefs.topics) === '["trees"]', `a saved Efficiency filter is dropped, the rest kept (${JSON.stringify(S.prefs.topics)})`);

  // ── Full past exams: counts and points only include what is shown ──
  const exam = (e) => ({ prefs: { ...prefs, mode: 'exam' }, examPrefs: { kind: 'full', examId: e, topics: [], picked: [], timerOn: false, minutes: 120 } });
  for (const [e, pts] of [['sp23', 31], ['sp24', 45], ['fa22', 37], ['fa25', 49]]) {
    await seed(exam(e));
    await click('[data-action="enter"]');
    const row = await page.$eval(`#exam-id-${e}`, (i) => i.closest('label').textContent.replace(/\s+/g, ' ').trim());
    ok(new RegExp(`${examIds(e).length} parts · ${pts} points`).test(row), `${e}: listed as “${row}”`);
    await click(`#exam-id-${e}`); await click('[data-action="start-exam"]'); await page.waitForSelector('#pane-right .part');
    S = await st();
    ok(JSON.stringify(S.exam.ids) === JSON.stringify(examIds(e)), `${e}: the exam has the ${S.exam.ids.length} in-scope parts in exam order`);
    if (e === 'sp23') ok(!S.exam.groups.some((g) => g.pid.startsWith('sp23-2')) && !S.exam.groups.some((g) => g.pid === 'sp23-3a-iii'), `sp23: Q2 and 3(a)iii are gone entirely (${S.exam.groups.length} groups left)`);
    if (e === 'sp24') {
      ok(S.exam.groups[0].pid === 'sp24-1' && JSON.stringify(S.exam.groups[0].ids) === '["sp24-1c"]', 'sp24: Q1 keeps only part (c)');
      ok(/\(2\.0 points\)/.test(await text('#problem-article h2')), `sp24 Q1 header shows the in-scope points: “${await text('#problem-article h2')}”`);
      const note = await text('#problem-article .src .scope-note');
      ok(/shake/.test(note) && /cruel/.test(note) && !(await page.$('#part-sp24-1c .scope-note')), `sp24 Q1: the note about the code is on the left: “${note}”`);
    }
  }

  // ── Problem notes (custom exam) and the topic-based exam picker ──
  await seed({ prefs: { ...prefs, mode: 'exam' }, examPrefs: { kind: 'custom', examId: 'fa25', topics: [], picked: ['sp23-2a', 'fa25-3', 'fa23-3'], timerOn: false, minutes: 120 } });
  await click('[data-action="enter"]');
  S = await st();
  ok(JSON.stringify(S.examPrefs.picked) === '["fa25-3","fa23-3"]', `a saved pick of an out-of-scope question is dropped (${JSON.stringify(S.examPrefs.picked)})`);
  const chips = await page.$$eval('.chips [id^="xt-"]', (l) => l.map((c) => c.id));
  ok(chips.length > 0 && !chips.includes('xt-efficiency'), `exam topic filter: Efficiency is not listed (${chips.length} topic chips)`);
  const listed = await page.$$eval('#pick-list [data-pick]', (l) => l.map((i) => i.dataset.pick));
  ok(!listed.some((pid) => ['sp23-2a', 'sp23-2b', 'fa22-4b', 'sp23-3a-iii'].includes(pid)) && listed.includes('sp24-1'), `picker lists ${listed.length} questions, none wholly out of scope`);
  await click('[data-action="start-exam"]'); await page.waitForSelector('#pane-right .part');
  const n1 = await text('#problem-article .src .scope-note');
  ok(/repr string/.test(n1), `fa25 Q3 has its problem note: “${n1.slice(0, 70)}…”`);
  ok(await page.$$eval('#problem-article > *', (l) => l.filter((e) => e.classList.contains('scope-note')).length) === 0, 'the note sits inside the source line, so saved pen strokes keep their blocks');
  await goTo('fa23-3');
  const n2 = await text('#problem-article .src .scope-note');
  const h2 = await text('#problem-article h2');
  ok(/__str__/.test(n2) && /\(5\.0 points\)/.test(h2) && !(await page.$('#part-fa23-3f')), `fa23 Q3: note “${n2.slice(0, 50)}…”, header “${h2}”, no blank (f)`);

  // ── Answer notes sit beside the part; question notes on the left ──
  await seed({ prefs: { ...prefs, mode: 'exam' }, examPrefs: { kind: 'custom', examId: 'fa25', topics: [], picked: ['fa22-1'], timerOn: false, minutes: 120 } });
  await click('[data-action="enter"]'); await click('[data-action="start-exam"]'); await page.waitForSelector('#pane-right .part');
  const partNotes = await page.$$eval('#pane-right .part', (ps) => ps.map((p) => [p.dataset.part, !!p.querySelector('.scope-note')]));
  ok(JSON.stringify(partNotes) === '[["fa22-1a",false],["fa22-1b",false],["fa22-1c",true],["fa22-1d",true]]', `fa22 Q1: answer notes only on (c) and (d) ${JSON.stringify(partNotes)}`);
  ok(/__str__/.test(await text('#problem-article .src .scope-note')), 'fa22 Q1: the note about the code is on the left');

  // ── Saved data from before this change still loads ──
  const old = { id: 'old-fa25', mode: 'exam', submitted: true, kind: 'full', examId: 'fa25', title: 'Fall 2025 Midterm 2', ids: ['fa25-1a', 'fa25-1c'], groups: [{ pid: 'fa25-1', ids: ['fa25-1a', 'fa25-1c'] }], index: 0,
    answers: { 'fa25-1a': 3 }, graded: { 'fa25-1a': 'correct', 'fa25-1c': 'skipped' }, score: { v: 2, earned: 1, possible: 2, auto: 2, counts: { correct: 1, incorrect: 0, staff: 0, skipped: 1 }, staff: 0, unknown: 0, partial: false }, notes: {}, annotations: {}, eliminated: {}, startedAt: 1, finishedAt: 2 };
  const q1 = ['sp24-1a', 'sp24-1b', 'sp24-1c', 'sp24-1d'];
  const session = { ids: q1, groups: [{ pid: 'sp24-1', ids: q1 }], index: 0, title: 'Old set', answers: {}, checked: {}, revealed: {}, selfGrade: {}, marked: {}, eliminated: {}, notes: {}, annotations: {}, timer: null, startedAt: 1, finishedAt: null, finished: false };
  await seed({ prefs, attempts: [old], session });
  await click('[data-action="enter"]');
  S = await st();
  ok(S.attempts.length === 1 && S.attempts[0].ids.includes('fa25-1c'), 'a past attempt that includes an out-of-scope part is kept');
  ok(S.session && S.session.ids.includes('sp24-1a'), 'an unfinished practice set that includes an out-of-scope part is kept');
  await click('[data-action="resume"]'); await page.waitForSelector('#part-sp24-1a');
  ok(/\(7\.0 points\)/.test(await text('#problem-article h2')), 'that set still shows Q1 with its printed 7 points');

  ok(errors.length === 0, `no page errors${errors.length ? ': ' + errors.join(' | ') : ''}`);
  await browser.close();
  console.log(fails ? `\n${fails} FAILED` : '\nall passed');
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });

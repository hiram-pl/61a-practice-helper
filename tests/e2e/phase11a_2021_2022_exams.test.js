// Phase 11A: Fall 2022 and Fall 2021 Midterm 2 added to the bank. Checks the data against the PDFs' structure,
// then the new exams through Full Past Exam Mode, grading, review and official solutions, topic-based practice,
// the environment diagram workspace (Fall 2022 Q2), the exam illustrations, code shown as printed in question
// text, and the saved-filter migration. Existing exams and attempts must not change.
const puppeteer = require('puppeteer-core');
const path = require('path');
const { APP_URL, CHROME } = require('./config');
const KEY = 'cs61a-practice:v1';
let fails = 0;
const ok = (c, m) => { console.log(`${c ? 'PASS' : 'FAIL'}  ${m}`); if (!c) fails++; };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

global.window = {};
require(path.join(__dirname, '..', '..', 'app', 'data', 'questions.js'));
require(path.join(__dirname, '..', '..', 'app', 'data', 'test_suites.js'));
const B = window.CS61A_BANK;
const SUITES = window.CS61A_TEST_SUITES.suites;
const partsOf = (pid) => B.QUESTIONS.filter((q) => q.problem === pid);
const examPids = (e) => Object.keys(B.PROBLEMS).filter((pid) => B.PROBLEMS[pid].exam === e);
const examIds = (e) => examPids(e).flatMap((pid) => partsOf(pid).map((q) => q.id));
const qOf = (id) => B.QUESTIONS.find((q) => q.id === id);
const official = (q) => {
  const k = B.ANSWER_KEY[q.id];
  if (!k) return 'my drawing'; // fa22 Q8 has no official answer
  if (q.type === 'single_choice') return k.correct;
  if (q.type === 'multi_select') return [...k.correct];
  return k.accepted[0];
};

// ── static: structure taken from the PDFs ──
// [question number, subparts, points] per top-level question, in exam order (A+ and optional parts count, 0 points).
const PDF = {
  fa22: [['1', 4, 7], ['2', 5, 6], ['3', 5, 8], ['4', 6, 9], ['5', 6, 7], ['6', 5, 7], ['7', 4, 0], ['8', 1, 0]],
  fa21: [['1', 5, 7], ['2', 9, 11], ['3', 10, 13], ['4', 9, 10], ['5', 5, 9]],
};
for (const [e, rows] of Object.entries(PDF)) {
  const pids = examPids(e);
  const byQ = (n) => pids.filter((pid) => B.PROBLEMS[pid].number.match(/^\d+/)[0] === n);
  const seen = [...new Set(pids.map((pid) => B.PROBLEMS[pid].number.match(/^\d+/)[0]))];
  ok(JSON.stringify(seen) === JSON.stringify(rows.map((r) => r[0])), `${e}: question groups ${seen.join(', ')} in exam order`);
  for (const [n, subparts, pts] of rows) {
    const qs = byQ(n).flatMap(partsOf);
    const got = qs.reduce((t, q) => t + q.points, 0);
    ok(qs.length === subparts && got === pts, `${e} Q${n}: ${qs.length} subparts, ${got} points (PDF parts: ${subparts}, ${pts})`);
  }
}
ok(examIds('fa21').reduce((t, id) => t + qOf(id).points, 0) === 50, 'fa21: 50 points in total, as printed');
ok(examIds('fa22').reduce((t, id) => t + qOf(id).points, 0) === 44 && B.PROBLEMS['fa22-6b'].points === 6,
  'fa22: part values sum to 44 (the PDF prints 45; Q6(b) prints 6.0 points over parts worth 1 + 1 + 2 + 1)');
ok(B.QUESTIONS.length === new Set(B.QUESTIONS.map((q) => q.id)).size, `all ${B.QUESTIONS.length} question ids are unique`);
ok(['fa25', 'sp25', 'fa24', 'sp24', 'fa23', 'sp23'].every((e) => examIds(e).length === { fa25: 33, sp25: 29, fa24: 31, sp24: 30, fa23: 27, sp23: 26 }[e]), 'earlier exams unchanged in size');
ok(B.QUESTIONS.filter((q) => /^(fa22|fa21)/.test(q.id)).every((q) => B.ANSWER_KEY[q.id] || q.id === 'fa22-8a'), 'every new subpart has an official answer (except the optional drawing, Q8)');
ok(B.QUESTIONS.filter((q) => /^(fa22|fa21)/.test(q.id) && q.type === 'code').every((q) => q.points === 0), 'only 0-point parts (A+ and the optional drawing) are graded by course staff');
ok(!SUITES.some((t) => /^(fa22|fa21)/.test(t.problem)), 'no Run Code test suites were added for the new exams');
const fig = B.PROBLEMS['fa22-2'].figure;
ok(fig && fig.slots.length === 8, 'fa22 Q2: environment diagram figure with 8 typing blanks');
ok(['fa22-4a', 'fa22-4b', 'fa22-6a', 'fa22-7', 'fa21-1'].every((pid) => B.PROBLEMS[pid].illustration && !B.PROBLEMS[pid].figure), 'the hydra, graph, tree and box-and-pointer pictures are illustrations, not diagram workspaces');
ok(Object.keys(B.PROBLEMS).filter((pid) => /^fa21/.test(pid)).every((pid) => !B.PROBLEMS[pid].figure), 'fa21: no environment diagram questions');

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('dialog', (d) => d.accept());
  const st = async () => { await wait(400); return page.evaluate((k) => JSON.parse(localStorage.getItem(k)), KEY); };
  const seed = async (obj) => {
    await page.evaluate((k, v) => { localStorage.setItem(k, v); Storage.prototype.setItem = function () {}; }, KEY, JSON.stringify(obj));
    await page.goto(APP_URL); await wait(150);
  };
  const click = async (sel) => { await page.waitForSelector(sel, { visible: true, timeout: 8000 }); await page.click(sel); await wait(60); };
  const has = async (sel) => !!(await page.$(sel));
  const text = (sel) => page.$eval(sel, (e) => e.textContent.replace(/\s+/g, ' ').trim());
  const imgLoaded = (sel) => page.waitForFunction((s) => { const i = document.querySelector(s); return i && i.complete && i.naturalWidth > 0; }, { timeout: 8000 }, sel);
  const goTo = async (pid) => { await click('#nav-toggle'); await click(`#nav-${pid}`); await wait(200); };
  await page.goto(APP_URL);

  // ── a filter saved after Phase 9 (all six exams of its time selected) picks up 2021–2022; a narrowed one is kept ──
  const prefs = { mode: 'practice', topics: [], difficulties: ['easy', 'medium', 'hard'], size: 999, timerOn: false, minutes: 25 };
  const phase9 = ['fa25', 'sp25', 'fa24', 'sp24', 'fa23', 'sp23'];
  await seed({ prefs: { ...prefs, exams: phase9, examsKnown: phase9 } });
  await click('[data-action="enter"]');
  await page.goto(APP_URL); await wait(150);
  let S = await st();
  ok(JSON.stringify(S.prefs.exams) === JSON.stringify(Object.keys(B.EXAMS)), `saved "all midterms" filter now includes 2022 and 2021 (${S.prefs.exams})`);
  await seed({ prefs: { ...prefs, exams: ['sp23'], examsKnown: phase9 } });
  await click('[data-action="enter"]');
  await page.goto(APP_URL); await wait(150);
  S = await st();
  ok(JSON.stringify(S.prefs.exams) === JSON.stringify(['sp23']), 'a filter narrowed to one exam is kept');

  // ── topic-based practice shows the new questions ──
  await seed({ prefs: { ...prefs, exams: ['fa22', 'fa21'], topics: ['trees'], examsKnown: Object.keys(B.EXAMS) } });
  await click('[data-action="enter"]'); await click('[data-action="start"]'); await page.waitForSelector('#pane-right .part');
  S = await st();
  const treeGroups = [...new Set(B.QUESTIONS.filter((q) => /^(fa22|fa21)/.test(q.id) && q.topics.includes('trees')).map((q) => q.problem))];
  ok(S.session.groups.length === treeGroups.length && S.session.groups.every((g) => treeGroups.includes(g.pid) && JSON.stringify(g.ids) === JSON.stringify(partsOf(g.pid).map((q) => q.id))),
    `Trees practice from 2021–2022: ${S.session.groups.length} complete question groups`);

  // ── Full Past Exam Mode for both: start, check pictures and code text, answer officially, submit, review ──
  const old = { id: 'old-sp23', mode: 'exam', submitted: true, kind: 'full', examId: 'sp23', title: 'Spring 2023 Midterm 2', ids: ['sp23-1a'], groups: [{ pid: 'sp23-1', ids: ['sp23-1a'] }], index: 0,
    answers: { 'sp23-1a': '[1, [3]]' }, graded: { 'sp23-1a': 'correct' }, score: { v: 2, earned: 2, possible: 2, auto: 1, counts: { correct: 1, incorrect: 0, staff: 0, skipped: 0 }, staff: 0, unknown: 0, partial: false }, notes: {}, annotations: {}, eliminated: {}, startedAt: 1, finishedAt: 2 };
  for (const [e, label, total] of [['fa22', 'Fall 2022 Midterm 2', 44], ['fa21', 'Fall 2021 Midterm 2', 50]]) {
    await seed({ prefs: { mode: 'exam', exams: Object.keys(B.EXAMS), examsKnown: Object.keys(B.EXAMS) }, examPrefs: { kind: 'full', examId: e, topics: [], picked: [], timerOn: false, minutes: 120 }, attempts: [old] });
    await click('[data-action="enter"]');
    const row = await page.$eval(`#exam-id-${e}`, (i) => i.closest('label').textContent.replace(/\s+/g, ' ').trim());
    ok(new RegExp(`${total} points`).test(row) && /Complete/.test(row), `${e}: listed as “${row}”`);
    await click(`#exam-id-${e}`); await click('[data-action="start-exam"]'); await page.waitForSelector('#pane-right .part');
    S = await st();
    ok(JSON.stringify(S.exam.groups.map((g) => g.pid)) === JSON.stringify(examPids(e)) && JSON.stringify(S.exam.ids) === JSON.stringify(examIds(e)), `${e}: full exam has all ${examIds(e).length} subparts in exam order`);
    ok(new RegExp(label).test(await text('.set-name')) && !(await has('#run-btn')), `${e}: header shows “${label}”; no Run Code during the live exam`);
    if (e === 'fa22') {
      await goTo('fa22-2'); await imgLoaded('.dg-canvas img');
      ok(await page.$$eval('.dg-slot', (s) => s.length) === 8 && !(await has('.exam-figure')), 'fa22 Q2: diagram workspace with the exam image and 8 typing blanks');
      await page.focus('.dg-slot[data-slot="1"]'); await page.keyboard.type('[4]'); await page.evaluate(() => document.activeElement.blur());
      ok(((await st()).exam.diagrams['fa22-2'] || []).some((a) => a.slot === 1 && a.text === '[4]'), 'fa22 Q2: typing in box (a) is saved with the exam');
      for (const pid of ['fa22-4a', 'fa22-4b', 'fa22-6a', 'fa22-7']) {
        await goTo(pid); await imgLoaded('.exam-figure img');
        ok(!(await has('#dg-canvas')), `${pid}: the exam’s picture loads under the question text, with no diagram workspace`);
      }
      await goTo('fa22-4a');
      ok(/^lerna=Tree\(6,\[Tree\(4,/.test(await page.$eval('[data-annot="intro"] pre', (p) => p.textContent)), 'fa22 Q4(a): the lerna line is shown as code');
      await goTo('fa22-4b');
      const opts = await page.$eval('[data-annot="outro"] pre', (p) => p.textContent);
      ok(/Option 2:  for _ in range\(2\):\n {15}hydra\.branches\.append\(Tree\(1\)\)\n {15}hydra\.label = 2/.test(opts) && /Option 5/.test(opts), 'fa22 Q4(b): the five options are shown as printed, with their indentation');
      await goTo('fa22-6a');
      ok(/>>> g = Graph\(6\)[\s\S]*>>> g\.has_path\(1,5\)/.test(await page.$eval('[data-annot="intro"] pre', (p) => p.textContent)), 'fa22 Q6(a): the example session is shown as code');
      await goTo('fa22-8');
      ok(await has('#ta-fa22-8a') && /Draw a picture/.test(await text('#pane-right')), 'fa22 Q8 (optional) has a free-response box');
    } else {
      await imgLoaded('.exam-figure img');
      ok(!(await has('#dg-canvas')) && /box-and-pointer/.test(await page.$eval('.exam-figure img', (i) => i.alt)), 'fa21 Q1: the box-and-pointer diagrams load under the question text');
    }
    // answer every part with the official answer, then submit
    const answers = Object.fromEntries(examIds(e).map((id) => [id, official(qOf(id))]));
    await page.evaluate((k, a) => { const s = JSON.parse(localStorage.getItem(k)); s.exam.answers = a; localStorage.setItem(k, JSON.stringify(s)); Storage.prototype.setItem = function () {}; }, KEY, answers);
    await page.goto(APP_URL); // an exam in progress reopens directly on reload
    await page.waitForSelector('#pane-right .part');
    ok(Object.keys((await st()).exam.answers).length === examIds(e).length, `${e}: exam in progress restored after reload with all answers`);
    await click('.p-footer [data-action="submit-exam"]'); await page.waitForSelector('.exam-results');
    S = await st();
    const A = S.attempts[S.attempts.length - 1];
    const staff = examIds(e).filter((id) => qOf(id).type === 'code');
    ok(A.score.earned === total && A.score.possible === total && A.score.counts.incorrect === 0 && staff.every((id) => A.graded[id] === 'staff'),
      `${e}: official answers score ${A.score.earned}/${A.score.possible}; ${staff.length} staff-graded part(s), none counted as wrong`);
    const snap = (a) => JSON.stringify([a.id, a.ids, a.answers, a.graded, a.score, a.finishedAt]);
    ok(S.attempts.length === 2 && snap(S.attempts[0]) === snap(old), `${e}: earlier Spring 2023 attempt in Exam History unchanged`);
    await click('.actions [data-action="exam-review"]'); await page.waitForSelector('#review-work .part');
    const first = examIds(e)[0];
    const want = String(qOf(first).type === 'multi_select' ? qOf(first).choices[B.ANSWER_KEY[first].correct[0]] : B.ANSWER_KEY[first].accepted[0]).split('\n')[0];
    ok(await has(`#rv-${first}`) && (await text(`#rv-${first}`)).includes(want), `${e}: review shows the official answer for ${first} (“${want}”)`);
    if (e === 'fa22') {
      await goTo('fa22-8');
      ok(/Solution not yet available/.test(await text('#rv-fa22-8a')), 'fa22 Q8 review: no official answer is shown (none exists)');
    }
  }

  ok(errors.length === 0, `no console errors${errors.length ? ': ' + errors.join(' | ').slice(0, 300) : ''}`);
  await browser.close();
  console.log(fails ? `\n${fails} FAILED` : '\nALL PASSED');
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });

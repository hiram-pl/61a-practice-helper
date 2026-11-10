// Phase 11C: fixes from the Phase 11B audit (docs/phase11-compatibility-audit.md).
//   B-1  bold text that contains code renders as bold (it showed literal **), in the four audited places and a study
//        guide; code spans, fenced code, italics and saved highlights keep working (highlights saved before store v5
//        are moved to the same words).
//   B-2  Spring 2025 Q2's header shows the 6 points of the parts listed with it (2(c), 1 point, is its own problem).
//   N-4  answers typed with curly quotes ‘ ’ “ ” are graded like straight quotes; different answers still aren't.
const puppeteer = require('puppeteer-core');
const path = require('path');
const { APP_URL, CHROME, skipTour } = require('./config');
const KEY = 'cs61a-practice:v1';
let fails = 0;
const ok = (c, m) => { console.log(`${c ? 'PASS' : 'FAIL'}  ${m}`); if (!c) fails++; };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

global.window = {};
require(path.join(__dirname, '..', '..', 'app', 'data', 'questions.js'));
const B = window.CS61A_BANK;
const idsOf = (pid) => B.QUESTIONS.filter((q) => q.problem === pid).map((q) => q.id);
// The text an intro showed before store v5 (bold around code kept its **), as highlights counted it.
const legacyText = (s) => s.split(/\n\n/).map((p) => p.split(/(`[^`]*`)/).map((x) => (x.startsWith('`') && x.endsWith('`') && x.length > 1 ? x.slice(1, -1)
  : x.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*\s][^*]*?)\*/g, '$1'))).join('')).join('');

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
  const page = await browser.newPage();
  await skipTour(page);
  await page.setViewport({ width: 1400, height: 900 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('dialog', (d) => d.accept());
  const st = async () => { await wait(350); return page.evaluate((k) => JSON.parse(localStorage.getItem(k)), KEY); };
  const seed = async (obj) => { await page.evaluate((k, v) => { localStorage.setItem(k, v); Storage.prototype.setItem = function () {}; }, KEY, JSON.stringify(obj)); await page.goto(APP_URL); await wait(150); };
  const click = async (sel) => { await page.waitForSelector(sel, { visible: true, timeout: 8000 }); await page.click(sel); await wait(60); };
  const practice = async (pids, extra) => {
    const ids = pids.flatMap(idsOf);
    await seed({ version: 5, prefs: { mode: 'practice', timerOn: false }, session: { ids, index: 0, title: 'x', answers: {}, timer: null, startedAt: Date.now(), finished: false, ...(extra || {}) } });
    await click('[data-action="enter"]'); await click('.resume [data-action="resume"]'); await page.waitForSelector('#pane-right .part');
  };
  const html = (sel) => page.$eval(sel, (e) => e.innerHTML);
  const text = (sel) => page.$eval(sel, (e) => e.textContent.replace(/\s+/g, ' ').trim());
  await page.goto(APP_URL);

  // ── B-1: bold around code ──
  // no literal **, and the phrase sits in a <strong> that also contains code
  const boldOk = (h, phrase) => !h.includes('**') && new RegExp(`<strong>[^]*?${phrase}[^]*?<code>[^]*?</strong>`).test(h);
  await practice(['fa23-6']);
  let h = await html('#part-fa23-6b .q-head');
  ok(boldOk(h, 'You may not use') && (h.match(/<code>/g) || []).length === 5, 'fa23 6(b) prompt: bold, with its five code spans inside');
  for (const [pid, phrase] of [['sp25-4b', 'You may not call'], ['fa24-5b', 'Do not mutate'], ['sp24-4b', 'starting with']]) {
    await practice([pid]);
    h = await html('[data-annot="intro"]');
    ok(boldOk(h, phrase), `${pid} intro: “${phrase} …” is bold with its code inside, no literal **`);
  }
  // not broken: code spans with *, italics, fenced code, a * that is code
  await practice(['sp24-1']);
  ok((await html('#part-sp24-1c .q-head')).includes('<code>print([x*x for x in cruel(summer)])</code>'), 'a code span containing * stays code (sp24 1(c))');
  await practice(['sp25-5a']);
  h = await html('[data-annot="intro"]');
  ok(!/<em>(?:(?!<\/em>)[^])*<code>/.test(h) && h.includes('<em>plus-times-expression</em>') && h.includes('<code>*</code>') && h.includes('<code>+</code>') && h.includes('<strong>Definition.</strong>'),
    'sp25 5(a) intro: `+` and `*` stay code, no italic runs across them, *plus-times-expression* is italic, **Definition.** bold');
  await practice(['sp25-4b']);
  ok((await html('[data-annot="intro"]')).includes('<em>Hint:</em>'), 'italic still works (*Hint:* in sp25 4(b))');
  await practice(['fa22-4a']);
  ok(/^lerna=Tree\(6,\[/.test(await page.$eval('[data-annot="intro"] pre', (p) => p.textContent)), 'fenced code still shows as code (fa22 Q4(a))');
  // study guide (Learning Insights): miss a Python Fundamentals part so its guide appears
  await seed({ version: 5, prefs: { mode: 'exam' }, examPrefs: { kind: 'custom', topics: [], picked: ['fa25-6a'], timerOn: false, minutes: 120 } });
  await click('[data-action="enter"]'); await click('[data-action="start-exam"]'); await page.waitForSelector('#pane-right .part');
  await click('label[for="c-fa25-6a-0"]');
  await click('.p-footer [data-action="submit-exam"]'); await page.waitForSelector('.exam-results');
  h = await page.$$eval('.guide-body', (gs) => gs.map((g) => g.innerHTML).join(''));
  ok(h.includes('<strong>returns <code>None</code></strong>') && !/\*\*returns/.test(h), 'study guide: “returns None” is bold with None as code (it also showed **)');

  // ── B-1: a highlight saved before v5, after the bold, stays on the same words ──
  const intro = B.PROBLEMS['sp25-4b'].intro;
  const old = legacyText(intro);
  const at = old.indexOf('Hint');
  const before = old.indexOf('Implement');
  const hl = [{ id: 'h1', kind: 'hl', where: 'intro', start: at, end: at + 4 }, { id: 'h2', kind: 'hl', where: 'intro', start: before, end: before + 9 }];
  await seed({ version: 4, prefs: { mode: 'practice', timerOn: false }, session: { ids: idsOf('sp25-4b'), index: 0, title: 'x', answers: {}, timer: null, startedAt: Date.now(), finished: false, notes: {}, annotations: { 'sp25-4b': hl } } });
  await page.evaluate(() => { Storage.prototype.setItem = Object.getPrototypeOf(localStorage).setItem; });
  await click('[data-action="enter"]'); await click('.resume [data-action="resume"]'); await page.waitForSelector('mark.hl');
  const marks = async () => page.$$eval('mark.hl', (ms) => { const by = {}; ms.forEach((m) => { by[m.dataset.aid] = (by[m.dataset.aid] || '') + m.textContent; }); return by; });
  let m = await marks();
  ok(m.h1 === 'Hint' && m.h2 === 'Implement', `v4 highlights land on the same words after the fix (${JSON.stringify(m)})`);
  await page.goto(APP_URL); await click('[data-action="enter"]'); await click('.resume [data-action="resume"]'); await page.waitForSelector('mark.hl');
  m = await marks();
  const S = await st();
  ok(S.version >= 5 && m.h1 === 'Hint' && m.h2 === 'Implement', 'saved as v5 or later; reloading does not move them again');

  // ── B-2: Spring 2025 Q2 header ──
  await practice(['sp25-2', 'sp25-2c']);
  ok(/^2\. \(6\.0 points\)/.test(await text('#problem-article h2')), 'sp25 Q2 header: 6.0 points, the parts (a) 3 + (b) 3 listed with it');
  await click('[data-action="next"]'); await page.waitForFunction(() => /2\(c\)/.test(document.querySelector('#problem-article h2').textContent));
  ok(/^2\(c\)\. \(1\.0 points\)/.test(await text('#problem-article h2')), 'sp25 2(c) header: 1.0 points');
  ok(B.QUESTIONS.filter((q) => B.PROBLEMS[q.problem].exam === 'sp25').reduce((t, q) => t + q.points, 0) === 50 && B.QUESTIONS.find((q) => q.id === 'sp25-2a').points === 3, 'Spring 2025 still totals 50; part points unchanged');

  // ── N-4: curly quotes ──
  const checkAnswer = async (pid, qid, answer) => {
    await practice([pid]);
    await page.$eval(`#ta-${qid}`, (t, v) => { t.value = v; t.dispatchEvent(new Event('input', { bubbles: true })); }, answer);
    await click(`#part-${qid} [data-action="check"]`); await wait(150);
    const fb = await text(`#part-${qid} .feedback`).catch(() => '');
    return { correct: /^Correct/.test(fb), stored: (await st()).session.answers[qid] };
  };
  for (const [pid, qid, ans] of [['sp23-5b', 'sp23-5f', 'yield s + ‘<>’'], ['fa25-6d', 'fa25-6i', '[“”]'], ['sp24-3', 'sp24-3a', '{‘Front’: Speaker(lambda x: x)}'], ['sp23-5b', 'sp23-5cd', 'yield s + ‘.’\nyield s + ‘%’']]) {
    const r = await checkAnswer(pid, qid, ans);
    ok(r.correct && r.stored === ans, `${qid}: ${JSON.stringify(ans)} is correct, and the answer is kept as typed`);
  }
  for (const [pid, qid, ans, why] of [['sp23-5b', 'sp23-5f', 'yield s + ‘<’', 'different string'], ['sp23-5b', 'sp23-5f', 'yield s + <>', 'quotes left out'],
    ['sp23-5b', 'sp23-5f', 'yield s + `<>`', 'backticks are not quotes'], ['fa25-6d', 'fa25-6i', '[“”, “”]', 'two strings']]) {
    const r = await checkAnswer(pid, qid, ans);
    ok(!r.correct, `${qid}: ${JSON.stringify(ans)} → not correct (${why})`);
  }
  // review shows the official answer as written (straight quotes)
  await seed({ version: 5, prefs: { mode: 'exam' }, examPrefs: { kind: 'custom', topics: [], picked: ['sp23-5b'], timerOn: false, minutes: 120 } });
  await click('[data-action="enter"]'); await click('[data-action="start-exam"]'); await page.waitForSelector('#ta-sp23-5f');
  await page.$eval('#ta-sp23-5f', (t) => { t.value = 'yield s + ‘<>’'; t.dispatchEvent(new Event('input', { bubbles: true })); });
  await click('.p-footer [data-action="submit-exam"]'); await page.waitForSelector('.exam-results');
  const A = (await st()).attempts.slice(-1)[0];
  ok(A.graded['sp23-5f'] === 'correct' && A.answers['sp23-5f'] === 'yield s + ‘<>’', 'exam: a curly-quote answer is graded correct and stored as typed');
  await click('.actions [data-action="exam-review"]'); await page.waitForSelector('#rv-sp23-5f');
  ok((await text('#rv-sp23-5f .feedback pre')) === "yield s + '<>'" && (await text('#rv-sp23-5f .rv-block')).includes('yield s + ‘<>’'), 'review: the submitted answer as typed, the official answer unchanged');

  ok(errors.length === 0, `no console errors${errors.length ? ': ' + errors.join(' | ').slice(0, 300) : ''}`);
  await browser.close();
  console.log(fails ? `\n${fails} FAILED` : '\nALL PASSED');
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });

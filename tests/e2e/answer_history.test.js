// Answer history (store v6): a lasting log of graded answers in store.history.
// Practice Check Answer (first verdict per part per set; "not an exact match" waits for the self-grade), self-grades
// (a changed self-grade updates its entry), a later set counting again, exam submission (auto-graded right/wrong only;
// unanswered and staff-graded parts left out), review workspaces adding nothing, a v5 save loading with an empty
// history, damaged entries dropped, and Start Over keeping the history.
const puppeteer = require('puppeteer-core');
const { APP_URL, CHROME, skipTour, fullBank } = require('./config');
const KEY = 'cs61a-practice:v1';
let fails = 0;
const ok = (c, m) => { console.log(`${c ? 'PASS' : 'FAIL'}  ${m}`); if (!c) fails++; };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
  const page = await browser.newPage();
  await skipTour(page);
  await fullBank(page); // fa25-1c (orders of growth) is out of scope this semester; the exam below uses all of fa25-1
  await page.setViewport({ width: 1400, height: 900 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('dialog', (d) => d.accept());
  const st = async () => { await wait(400); return page.evaluate((k) => JSON.parse(localStorage.getItem(k)), KEY); };
  // Write the saved store, then reload (setItem is switched off first so the old page can't save over it on unload).
  const inject = async (src) => {
    await page.evaluate((k, src) => { const s = JSON.parse(localStorage.getItem(k)) || {}; const out = new Function('s', src)(s) || s; localStorage.setItem(k, JSON.stringify(out)); Storage.prototype.setItem = function () {}; }, KEY, src);
    await page.reload(); await wait(150);
  };
  const has = async (sel) => !!(await page.$(sel));
  const click = async (sel) => { await page.waitForSelector(sel, { visible: true, timeout: 8000 }); await page.click(sel); await wait(60); };
  const type = async (id, text) => {
    await page.click(`#ta-${id}`, { clickCount: 3 }); await page.keyboard.press('Backspace');
    await page.keyboard.type(text); await wait(400);
  };
  const choose = (id, i) => click(`label[for="c-${id}-${i}"]`);
  const check = (id) => click(`#part-${id} [data-action="check"]`);
  const reveal = async (id) => { await click(`#part-${id} [data-action="reveal"]`); await click(`#reveal-yes-${id}`); };
  const resumeSet = async (ids, title) => {
    await inject(`s.session = { ids: ${JSON.stringify(ids)}, title: ${JSON.stringify(title)}, startedAt: Date.now() }; s.prefs = Object.assign(s.prefs || {}, { timerOn: false }); return s;`);
    if (await has('[data-action="enter"]')) await click('[data-action="enter"]');
    await click('[data-action="resume"]');
    await page.waitForSelector('#pane-right .part');
  };

  await page.goto(APP_URL);
  const B = await page.evaluate(() => window.CS61A_BANK);
  const key = (id) => B.ANSWER_KEY[id];
  const rightA = key('fa25-1a').correct, wrongA = (rightA + 1) % B.QUESTIONS.find((q) => q.id === 'fa25-1a').choices.length;
  const rightC = key('fa25-1c').correct;

  // ── a v5 save (no history, a practice set without an id) loads; history starts empty ──
  await page.evaluate((k) => { localStorage.clear(); localStorage.setItem(k, JSON.stringify({ version: 5, prefs: { mode: 'practice' } })); }, KEY);
  await resumeSet(['fa25-1a', 'fa25-1b', 'fa25-1c', 'sp25-5h'], 'History test');
  let S = await st();
  ok(S.version === 6 && Array.isArray(S.history) && S.history.length === 0, '1. v5 save → version 6, empty history');
  ok(typeof S.session.id === 'string' && S.session.id && S.session.logged && !Object.keys(S.session.logged).length, '   the saved set gets an id and an empty logged map');
  const set1 = S.session.id;

  // ── multiple choice: the first check counts; fixing it and checking again doesn't add an entry ──
  await choose('fa25-1a', wrongA); await check('fa25-1a');
  S = await st();
  ok(S.history.length === 1 && S.history[0].id === 'fa25-1a' && S.history[0].ok === false && S.history[0].via === 'check' && S.history[0].set === set1 && typeof S.history[0].at === 'number',
    `2. wrong choice checked → one entry ok:false via check (${JSON.stringify(S.history[0])})`);
  await choose('fa25-1a', rightA); await check('fa25-1a');
  S = await st();
  ok(S.history.length === 1 && S.history[0].ok === false, '3. right on the second check in the same set → still one entry, still a miss');

  // ── short answer: "not an exact match" isn't recorded; a later exact match is ──
  await type('fa25-1b', '[1, 2]'); await check('fa25-1b');
  S = await st();
  ok(S.session.checked['fa25-1b'] === 'unmatched' && S.history.length === 1, '4. unmatched short answer → nothing recorded (waits for a self-grade)');
  await type('fa25-1b', key('fa25-1b').accepted[0]); await check('fa25-1b');
  S = await st();
  const eB = S.history.find((e) => e.id === 'fa25-1b');
  ok(S.history.length === 2 && eB && eB.ok === true && eB.via === 'check', '5. exact match checked → entry ok:true via check');

  // ── Show Solution with no check: nothing recorded, and Check Answer is gone ──
  await choose('fa25-1c', rightC); await reveal('fa25-1c');
  S = await st();
  ok(!S.history.some((e) => e.id === 'fa25-1c') && !(await has('#part-fa25-1c [data-action="check"]')), '6. solution shown before checking → no entry, no Check button');

  // ── code part: self-grade is recorded; changing it updates the same entry ──
  await click('[data-action="next"]');
  await page.waitForSelector('#ta-sp25-5h');
  await type('sp25-5h', "'+' + x"); await reveal('sp25-5h');
  S = await st();
  ok(!S.history.some((e) => e.id === 'sp25-5h'), '7. showing the solution alone records nothing');
  await click('#part-sp25-5h [data-action="self"][data-v="incorrect"]');
  S = await st();
  const n7 = S.history.length;
  const eH = S.history.find((e) => e.id === 'sp25-5h');
  ok(eH && eH.ok === false && eH.via === 'self' && eH.set === set1, '8. "I got it wrong" → entry ok:false via self');
  await click('#part-sp25-5h [data-action="self"][data-v="correct"]');
  S = await st();
  ok(S.history.length === n7 && S.history.find((e) => e.id === 'sp25-5h').ok === true, '9. changed to "I got it right" → same entry, now ok:true');

  // ── a later practice set counts again ──
  await resumeSet(['fa25-1a'], 'Second set');
  S = await st();
  ok(S.session.id !== set1 && S.history.length === n7, '10. a new set has its own id; history kept across sets');
  await choose('fa25-1a', rightA); await check('fa25-1a');
  S = await st();
  const last = S.history[S.history.length - 1];
  ok(S.history.length === n7 + 1 && last.id === 'fa25-1a' && last.ok === true && last.set === S.session.id, '11. same part in a new set → a new entry');

  // ── Start Over drops the set but keeps the history ──
  await page.goto(APP_URL); await wait(150);
  if (await has('[data-action="enter"]')) await click('[data-action="enter"]');
  await click('[data-action="discard"]');
  S = await st();
  ok(!S.session && S.history.length === n7 + 1, '12. Start Over → no set, history unchanged');

  // ── exam: auto-graded right/wrong recorded at submission; unanswered and staff-graded parts are not ──
  const before = S.history.length;
  await inject(`s.prefs = Object.assign(s.prefs || {}, { mode: 'exam' }); s.examPrefs = { kind: 'custom', topics: [], picked: ['fa25-1', 'sp25-5d'], timerOn: false, minutes: 120 }; return s;`);
  if (await has('[data-action="enter"]')) await click('[data-action="enter"]');
  await click('[data-action="start-exam"]');
  await page.waitForSelector('#pane-right .part');
  await choose('fa25-1a', rightA);   // correct
  await type('fa25-1b', '[1, 2]');   // incorrect
  // (c) unanswered
  await click('[data-action="next"]');
  await type('sp25-5h', "'+' + x");  // code → graded by course staff
  S = await st();
  ok(S.history.length === before, '13. nothing recorded while the exam is in progress');
  await click('.p-footer [data-action="submit-exam"]');
  await page.waitForSelector('.exam-results');
  S = await st();
  const A = S.attempts[S.attempts.length - 1];
  const ex = S.history.slice(before);
  ok(ex.length === 2 && ex.every((e) => e.via === 'exam' && e.set === A.id && e.at === A.finishedAt), `14. submission → 2 exam entries tied to the attempt (${ex.map((e) => e.id).join(', ')})`);
  ok(ex.find((e) => e.id === 'fa25-1a').ok === true && ex.find((e) => e.id === 'fa25-1b').ok === false, '15. right and wrong recorded as graded');
  ok(!ex.some((e) => e.id === 'fa25-1c' || e.id === 'sp25-5h'), '16. unanswered (c) and staff-graded code part left out');

  // ── review workspace: changing answers there records nothing ──
  const n16 = S.history.length;
  await click('[data-action="exam-review"][data-q="fa25-1a"]');
  await choose('fa25-1a', wrongA);
  S = await st();
  ok(S.reviews[A.id] && S.reviews[A.id].answers['fa25-1a'] === wrongA && S.history.length === n16, '17. answer changed in the review workspace → no new entries');

  // ── damaged entries are dropped on load; good ones kept ──
  const good = S.history.length;
  await inject(`s.history.push(null, 5, { id: 'no-such-part', ok: true, at: 1, via: 'check', set: 'x' }, { id: 'fa25-1a', ok: 'yes', at: 1, via: 'check', set: 'x' },
    { id: 'fa25-1a', ok: true, at: '1', via: 'check', set: 'x' }, { id: 'fa25-1a', ok: true, at: 1, via: 'guess', set: 'x' }, { id: 'fa25-1a', ok: true, at: 1, via: 'check' }); return s;`);
  if (await has('[data-action="enter"]')) await click('[data-action="enter"]');
  S = await st();
  ok(S.history.length === good, `18. 7 damaged entries dropped, ${good} kept`);
  await inject('s.history = { not: "a list" }; return s;');
  if (await has('[data-action="enter"]')) await click('[data-action="enter"]');
  S = await st();
  ok(Array.isArray(S.history) && S.history.length === 0, '19. history that isn’t a list → empty, app still loads');

  ok(!errors.length, `no page errors${errors.length ? ': ' + errors.join(' | ') : ''}`);
  await browser.close();
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });

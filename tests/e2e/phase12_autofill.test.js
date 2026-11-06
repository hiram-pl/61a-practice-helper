// Phase 12: Exam Settings → Auto-fill Code. A ⋮ button right after the trash icon, only during an exam in progress,
// opens Exam Settings with an Auto-fill Code switch. On by default for every new exam; off keeps answers saved but
// leaves the code blanks empty; back on shows the current answers; Save & Leave / Resume and a refresh keep the
// choice for that attempt. Practice and review are unchanged, and so are grading and submission.
const puppeteer = require('puppeteer-core');
const { APP_URL, CHROME, skipTour } = require('./config');
const KEY = 'cs61a-practice:v1';
let fails = 0;
const ok = (c, m) => { console.log(`${c ? 'PASS' : 'FAIL'}  ${m}`); if (!c) fails++; };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const PID = 'sp25-4b'; // blank (d) is typed (sp25-4d), blank (e) is a choice (sp25-4e, official answer: choice 2)

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
  const click = async (sel) => { await page.waitForSelector(sel, { visible: true, timeout: 8000 }); await page.click(sel); await wait(80); };
  const has = (sel) => page.$(sel).then(Boolean);
  const slot = (name) => page.$eval(`.CodeMirror .cm-slot[data-blank="${name}"]`, (e) => e.textContent);
  const type = async (qid, v) => { await page.$eval(`#ta-${qid}`, (t, x) => { t.value = x; t.dispatchEvent(new Event('input', { bubbles: true })); }, v); await wait(80); };
  const sw = () => page.$eval('#autofill-switch', (b) => b.getAttribute('aria-checked'));
  const panelOpen = () => page.$eval('#exam-settings', (p) => !p.hidden);
  const choiceText = (i) => page.$eval(`label[for="c-sp25-4e-${i}"]`, (l) => l.textContent.replace(/\s+/g, ' ').trim());
  const startExam = async () => {
    await seed({ version: 5, prefs: { mode: 'exam' }, examPrefs: { kind: 'custom', topics: [], picked: [PID], timerOn: false, minutes: 120 } });
    await click('[data-action="enter"]'); await click('[data-action="start-exam"]'); await page.waitForSelector('#pane-right .part');
    await page.waitForSelector('.CodeMirror .cm-slot');
  };
  await page.goto(APP_URL);

  // ── Practice: no ⋮, blanks fill as before ──
  await seed({ version: 5, prefs: { mode: 'practice', timerOn: false }, session: { ids: ['sp25-4d', 'sp25-4e', 'sp25-4f', 'sp25-4g'], index: 0, title: 'x', answers: {}, timer: null, startedAt: Date.now(), finished: false, notes: {}, annotations: {} } });
  await click('[data-action="enter"]'); await click('.resume [data-action="resume"]'); await page.waitForSelector('.CodeMirror .cm-slot');
  ok(!(await has('[data-ann="settings"]')) && !(await has('#exam-settings')), 'practice: no ⋮ button, no Exam Settings');
  await click('label[for="c-sp25-4e-2"]');
  ok(!(await slot('e')).includes('___'), 'practice: a selected choice fills its blank');

  // ── New exam: ⋮ right after the trash icon, Auto-fill on ──
  await startExam();
  ok(await page.$eval('[data-ann="clear"]', (b) => { const n = b.nextElementSibling; return !!n && !!n.querySelector('[data-ann="settings"]'); }), '⋮ sits immediately after the trash icon');
  ok(await page.$eval('[data-ann="settings"]', (b) => b.getAttribute('aria-label') === 'Exam settings' && b.getAttribute('aria-expanded') === 'false'), '⋮ is labelled “Exam settings”, collapsed');
  ok(!(await panelOpen()), 'Exam Settings starts closed');
  await click('[data-ann="settings"]');
  ok(await panelOpen() && (await page.$eval('#exam-settings', (p) => p.textContent)).includes('Exam Settings') && (await page.$eval('#exam-settings', (p) => p.textContent)).includes('Auto-fill Code'), 'clicking ⋮ opens Exam Settings with Auto-fill Code');
  ok((await sw()) === 'true' && (await st()).exam.autoFill === undefined, 'Auto-fill Code is on by default for a new exam');
  await click('[data-ann="settings"]');
  ok(!(await panelOpen()), 'clicking ⋮ again closes it');

  await click('label[for="c-sp25-4e-2"]');
  await type('sp25-4d', 'result[node.label]');
  const eOn = await slot('e'), dOn = await slot('d');
  ok(!eOn.includes('___') && dOn === 'result[node.label]', `on: the choice and the typed answer fill their blanks (${JSON.stringify([eOn, dOn])})`);

  // ── Off: answers stay, blanks don't fill ──
  await click('[data-ann="settings"]'); await click('#autofill-switch');
  let S = await st();
  ok((await sw()) === 'false' && S.exam.autoFill === false, 'switching off saves autoFill: false on the exam');
  ok((await slot('e')) === '___(e)___' && (await slot('d')) === '___(d)___', 'off: both blanks show as empty');
  ok(/Auto-fill Code is off/.test(await page.$eval('#fill-hint', (e) => e.textContent)), 'off: the hint under the editor says Auto-fill Code is off');
  ok(S.exam.answers['sp25-4e'] === 2 && S.exam.answers['sp25-4d'] === 'result[node.label]' && await has('#c-sp25-4e-2:checked'), 'off: the selected and typed answers are still saved and shown on the right');
  ok(await panelOpen(), 'the panel stays open after toggling');
  await click('label[for="c-sp25-4e-1"]');
  await type('sp25-4g', 'visit(b, depth + 1)');
  S = await st();
  ok((await slot('e')) === '___(e)___' && (await slot('g')) === '___(g)___' && S.exam.answers['sp25-4e'] === 1 && S.exam.answers['sp25-4g'] === 'visit(b, depth + 1)', 'off: new answers are saved but the blanks stay empty');

  // ── Back on: blanks show the current answers ──
  await click('[data-ann="settings"]'); await click('#autofill-switch');
  ok((await sw()) === 'true' && (await st()).exam.autoFill === true, 'switching back on is saved');
  ok(/appear in the blanks automatically/.test(await page.$eval('#fill-hint', (e) => e.textContent)), 'on again: the hint says answers appear in the blanks');
  const e1 = await slot('e');
  ok(!e1.includes('___') && e1 !== eOn && (await slot('d')) === 'result[node.label]' && (await slot('g')) === 'visit(b, depth + 1)', `on again: blanks show the current answers (choice 1 now: ${JSON.stringify(e1)})`);

  // ── Escape and an outside click close it ──
  ok(await panelOpen(), "the panel is still open from the previous step"); // it stays open after toggling
  await page.keyboard.press('Escape'); await wait(80);
  ok(!(await panelOpen()) && await page.evaluate(() => document.activeElement && document.activeElement.id === 'exam-settings-btn'), 'Escape closes Exam Settings and returns focus to ⋮');
  await click('[data-ann="settings"]');
  await page.click('#pane-right'); await wait(80);
  ok(!(await panelOpen()), 'a click outside closes it');

  // ── Save & Leave / Resume and refresh keep the choice ──
  await click('[data-ann="settings"]'); await click('#autofill-switch'); await page.keyboard.press('Escape');
  await click('.p-footer [data-action="save-leave"]');
  ok((await st()).exam.autoFill === false, 'Save & Leave keeps autoFill: false on the attempt');
  await click('.resume [data-action="resume-exam"]'); await page.waitForSelector('.CodeMirror .cm-slot');
  await click('[data-ann="settings"]');
  ok((await sw()) === 'false' && (await slot('e')) === '___(e)___' && await has('#c-sp25-4e-1:checked'), 'after Resume: still off, blanks empty, answers kept');
  await page.reload(); await page.waitForSelector('.CodeMirror .cm-slot');
  ok((await slot('e')) === '___(e)___' && (await slot('d')) === '___(d)___' && /Auto-fill Code is off/.test(await page.$eval('#fill-hint', (e) => e.textContent)), 'after a refresh mid-exam: still off (blanks and hint)');

  // ── Submission and grading are unchanged; review fills the blanks, no ⋮ ──
  await click('label[for="c-sp25-4e-2"]'); // the official answer, chosen while off
  await click('.p-footer [data-action="submit-exam"]'); await page.waitForSelector('.exam-results');
  const A = (await st()).attempts.slice(-1)[0];
  ok(A.answers['sp25-4e'] === 2 && A.graded['sp25-4e'] === 'correct' && A.graded['sp25-4d'] === 'correct' && A.graded['sp25-4g'] === 'correct' && A.graded['sp25-4f'] !== 'correct',
    `grading unchanged with Auto-fill off (${JSON.stringify(A.graded)})`);
  ok((await st()).exam === null, 'the submitted exam is no longer in progress');
  await click('.actions [data-action="exam-review"]'); await page.waitForSelector('.CodeMirror .cm-slot');
  ok(!(await has('[data-ann="settings"]')), 'review: no ⋮ button');
  ok(!(await slot('e')).includes('___') && (await slot('d')) === 'result[node.label]', 'review: blanks show the submitted answers as before');

  // ── The next new exam starts with Auto-fill on ──
  await startExam();
  await click('label[for="c-sp25-4e-2"]');
  await click('[data-ann="settings"]');
  ok((await sw()) === 'true' && !(await slot('e')).includes('___'), 'a new exam starts with Auto-fill Code on');

  ok(errors.length === 0, `no console errors${errors.length ? ': ' + errors.join(' | ').slice(0, 300) : ''}`);
  await browser.close();
  console.log(fails ? `\n${fails} FAILED` : '\nALL PASSED');
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });

// Phase 10: Practice setup without the Question Types filter, and a number box for Set size.
// Layout (Topics / Exams / Difficulty, then Set size and Timer on the left of row 2), set size rules (default 5,
// 1 to the matching count, typing, arrows, filter changes), complete question groups, old saved preferences,
// and an unfinished saved set still resuming.
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
const partsOf = (pid) => B.QUESTIONS.filter((q) => q.problem === pid).map((q) => q.id);
const groupsMatching = (exams, diffs, topics) => [...new Set(B.QUESTIONS.filter((q) => exams.includes(B.PROBLEMS[q.problem].exam) && diffs.includes(q.difficulty)
  && (!topics.length || q.topics.some((t) => topics.includes(t)))).map((q) => q.problem))];

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
  const page = await browser.newPage();
  await skipTour(page);
  await fullBank(page); // checks every transcribed part against the PDF, so scope is off
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
  const val = () => page.$eval('#set-size', (i) => i.value);
  const summary = () => page.$eval('.start-row .summary', (e) => e.textContent.replace(/\s+/g, ' ').trim());
  const typeSize = async (text) => { await page.click('#set-size', { clickCount: 3 }); await page.keyboard.press('Backspace'); if (text) await page.keyboard.type(text); await wait(80); };
  const blur = async () => { await page.click('.setup-card', { offset: { x: 5, y: 5 } }); await wait(150); };
  const all = Object.keys(B.EXAMS);
  const ALL = groupsMatching(all, ['easy', 'medium', 'hard'], []).length;
  await page.goto(APP_URL);

  // ── layout ──
  await seed(null);
  const boxes = await page.$$eval('.setup-card .dd-row > .dd', (ds) => ds.map((d) => { const r = d.getBoundingClientRect(); return { t: d.querySelector('.dd-label').textContent, x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) }; }));
  ok(!(await page.$('[data-id="types"]')) && !/question types/i.test(await page.$eval('.setup-card', (e) => e.textContent)), '1. no Question Types box');
  ok(JSON.stringify(boxes.map((b) => b.t.toLowerCase())) === JSON.stringify(['topics', 'exams', 'difficulty', 'set size', 'timer']), `five boxes in order: ${boxes.map((b) => b.t).join(', ')}`);
  ok(boxes[0].y === boxes[1].y && boxes[1].y === boxes[2].y && boxes[0].x < boxes[1].x && boxes[1].x < boxes[2].x, '2. Topics, Exams, Difficulty in the first row');
  ok(boxes[3].y > boxes[0].y && boxes[3].x === boxes[0].x, '3. Set size: second row, first column');
  ok(boxes[4].y === boxes[3].y && boxes[4].x === boxes[1].x, '4. Timer: second row, second column');
  ok(boxes.every((b) => b.w === boxes[0].w) && boxes[3].h === boxes[4].h && boxes[3].h === boxes[0].h, `5. third column of row 2 empty; all boxes ${boxes[0].w}×${boxes[0].h}px`);

  // ── default and limits ──
  ok(await val() === '5' && (await summary()).startsWith(`${ALL} matching questions · this set has 5`), `6. default 5 of ${ALL}: “${await summary()}”`);
  ok(await page.$eval('#set-size', (i) => [i.min, i.max].join()) === `1,${ALL}`, `input allows 1 to ${ALL}`);
  await click('.dd-step-btn[data-d="1"]');
  ok(await val() === '6' && /this set has 6/.test(await summary()), '8. ▲ adds one');
  await click('.dd-step-btn[data-d="-1"]'); await click('.dd-step-btn[data-d="-1"]');
  ok(await val() === '4' && (await st()).prefs.size === 4, '8. ▼ removes one (saved)');
  await typeSize('12');
  ok(/this set has 12/.test(await summary()) && await page.evaluate(() => document.activeElement.id) === 'set-size', '7. typing 12 updates the summary live and keeps focus');
  await blur();
  ok(await val() === '12' && (await st()).prefs.size === 12, '7. 12 kept after blur');
  await typeSize('');
  ok(await page.evaluate(() => document.activeElement.id) === 'set-size' && await val() === '' && /this set has 12/.test(await summary()), 'an empty box while typing is left alone (still 12 in use)');
  await blur();
  ok(await val() === '12', 'empty on blur → last valid size');
  await typeSize('999'); await blur();
  ok(await val() === String(ALL), `9. 999 → clamped to ${ALL}`);
  await typeSize('2.6'); await blur();
  ok(await val() === '3', 'decimal 2.6 → 3');
  await typeSize('0'); await blur();
  ok(await val() === '1' && await page.$eval('.dd-step-btn[data-d="-1"]', (b) => b.disabled), 'below 1 → 1, and ▼ is disabled at 1');
  await typeSize('-4'); await blur();
  ok(await val() === '1', 'negative → 1');
  await page.click('#set-size'); await page.keyboard.press('ArrowUp'); await wait(100);
  ok(/this set has 2/.test(await summary()), 'keyboard ↑ also steps');
  await blur();

  // ── filter changes ──
  await typeSize('20'); await blur();
  const fa23 = groupsMatching(['fa23'], ['easy', 'medium', 'hard'], []).length; // 8
  await click('[data-id="exams"]');
  for (const e of all.filter((x) => x !== 'fa23')) await page.click(`input[data-pref="exams"][value="${e}"]`), await wait(60);
  await page.keyboard.press('Escape'); await blur();
  ok(await val() === String(fa23) && (await summary()).startsWith(`${fa23} matching questions · this set has ${fa23}`), `10. Fall 2023 only: max ${fa23}, size 20 → ${fa23}`);
  await click('[data-id="exams"]'); await page.click('input[data-pref="exams"][value="sp23"]'); await wait(80); await blur();
  const both23 = groupsMatching(['fa23', 'sp23'], ['easy', 'medium', 'hard'], []).length;
  ok(await val() === String(fa23) && (await summary()).startsWith(`${both23} matching`), `more matches (${both23}): the size stays ${fa23}`);

  // fewer than 5 match → default shows the maximum
  const few = groupsMatching(['fa23'], ['easy', 'medium', 'hard'], ['efficiency']).length; // 1
  await seed({ prefs: { mode: 'practice', topics: ['efficiency'], exams: ['fa23'], examsKnown: all, difficulties: ['easy', 'medium', 'hard'], size: 5, timerOn: false, minutes: 25 } });
  ok(await val() === String(few) && (await summary()).startsWith(`${few} matching question`), `only ${few} match → set size ${few}`);

  // zero matches → Start disabled
  await seed({ prefs: { mode: 'practice', topics: [], exams: all, examsKnown: all, difficulties: [], size: 5, timerOn: false, minutes: 25 } });
  ok(await page.$eval('[data-action="start"]', (b) => b.disabled) && await page.$eval('#set-size', (i) => i.disabled) && (await summary()).startsWith('0 matching'), '11. zero matches: Start and the box are disabled');

  // ── old saved preferences: a types selection and 'all' are dropped; groups stay complete ──
  await seed({ prefs: { mode: 'practice', topics: ['oop'], exams: ['sp23'], examsKnown: all, difficulties: ['easy', 'medium', 'hard'], types: ['single_choice'], size: 'all', timerOn: false, minutes: 25 } });
  let S = await st();
  ok(!('types' in S.prefs) && S.prefs.size === 5 && await val() === '2', `old types selection removed; old 'all' → default 5, clamped to the 2 matching groups`);
  await click('[data-action="start"]'); await page.waitForSelector('#pane-right .part');
  S = await st();
  const pids = [...new Set(S.session.ids.map((id) => B.QUESTIONS.find((q) => q.id === id).problem))];
  ok(pids.length === 2 && pids.every((pid) => partsOf(pid).every((id) => S.session.ids.includes(id))) && S.session.ids.length === pids.reduce((t, pid) => t + partsOf(pid).length, 0),
    `12. every part of each chosen group is in the set (${S.session.ids.length} parts, choice and typed answers alike)`);
  ok(new Set(S.session.ids.map((id) => B.QUESTIONS.find((q) => q.id === id).type)).size > 1, 'the set mixes question types');

  // a set of exactly N groups
  await seed({ prefs: { mode: 'practice', topics: [], exams: all, examsKnown: all, difficulties: ['easy', 'medium', 'hard'], size: 7, timerOn: false, minutes: 25 } });
  await click('[data-action="start"]'); await page.waitForSelector('#pane-right .part');
  S = await st();
  ok(S.session.groups.length === 7 && S.session.groups.every((g) => JSON.stringify(g.ids) === JSON.stringify(partsOf(g.pid))), 'Start with 7 → 7 complete question groups');

  // ── an unfinished set saved earlier resumes unchanged ──
  const ids = [...partsOf('fa24-4a'), ...partsOf('sp24-3')];
  const oldSession = { ids, groups: [{ pid: 'fa24-4a', ids: partsOf('fa24-4a') }, { pid: 'sp24-3', ids: partsOf('sp24-3') }], index: 1, title: 'Old set', answers: { 'fa24-4a': 1, 'sp24-3a': "{'Front': Speaker(lambda x: x)}" }, checked: {}, revealed: {}, selfGrade: {}, marked: {}, timer: null, startedAt: 1, finishedAt: null, finished: false };
  await seed({ prefs: { mode: 'practice', topics: [], exams: all, examsKnown: all, difficulties: ['easy', 'medium', 'hard'], types: ['code'], size: 10, timerOn: false, minutes: 25 }, session: oldSession });
  await click('.resume [data-action="resume"]'); await page.waitForSelector('#pane-right .part');
  S = await st();
  ok(JSON.stringify(S.session.ids) === JSON.stringify(ids) && S.session.answers['sp24-3a'] === oldSession.answers['sp24-3a'] && S.session.index === 1, '14. a saved set resumes with its questions, answers and position');
  ok(await page.$$eval('#pane-right .part', (ps) => ps.map((p) => p.dataset.part).join()) === partsOf('sp24-3').join(), 'it opens on question 2 (Spring 2024 Q3) with all its parts');

  // ── Exam Mode untouched ──
  await seed({ prefs: { mode: 'exam', exams: all, examsKnown: all }, examPrefs: { kind: 'full', examId: 'fa25', topics: [], picked: [], timerOn: false, minutes: 120 } });
  ok(await page.$$eval('.kind-list .kind-opt', (l) => l.length) === all.length && !(await page.$('#set-size')), '15. Exam Mode: full exams listed, no practice set size');

  // ── phone width ──
  await page.setViewport({ width: 390, height: 844 });
  await seed({ prefs: { mode: 'practice', topics: [], exams: all, examsKnown: all, difficulties: ['easy', 'medium', 'hard'], size: 5, timerOn: true, minutes: 25 } });
  const mob = await page.$$eval('.setup-card .dd-row > .dd', (ds) => ds.map((d) => Math.round(d.getBoundingClientRect().left)));
  ok(new Set(mob).size === 1 && await page.evaluate(() => document.documentElement.scrollWidth <= 390), '16. phone: boxes stacked in one column, no sideways scroll');
  await page.setViewport({ width: 1400, height: 900 });

  ok(errors.length === 0, `no console errors${errors.length ? ': ' + errors.join(' | ').slice(0, 300) : ''}`);
  await browser.close();
  console.log(fails ? `\n${fails} FAILED` : '\nALL PASSED');
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });

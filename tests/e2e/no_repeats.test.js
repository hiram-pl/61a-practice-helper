// No repeats and Your topics.
// Start only picks questions with no graded part in the history; once those run out it fills the set with done
// questions, the ones answered longest ago first. The home page's Your topics card shows every answered topic,
// strongest first, as a right vs. missed bar, with Strongest / Needs the most work callouts.
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
const firstPart = (pid) => B.QUESTIONS.find((q) => q.problem === pid).id;
const FA25 = Object.keys(B.PROBLEMS).filter((pid) => B.PROBLEMS[pid].exam === 'fa25');
const FRESH = FA25.slice(0, 2);   // never answered
const DONE = FA25.slice(2);       // answered, DONE[0] longest ago
const DAY = 24 * 60 * 60 * 1000;
const HISTORY = DONE.map((pid, i) => ({ id: firstPart(pid), ok: true, at: Date.now() - (DONE.length - i) * DAY, via: 'check', set: 'seed' }));
// Topic results for Your topics: links 3/3 right, oop 0/2.
const LINKS = 'sp25-5a', OOP = 'fa25-5a';
const TOPIC_HISTORY = [
  ...[3, 2, 1].map((d) => ({ id: LINKS, ok: true, at: Date.now() - d * DAY, via: 'check', set: 'seed' })),
  ...[2, 1].map((d) => ({ id: OOP, ok: false, at: Date.now() - d * DAY, via: 'check', set: 'seed' })),
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
  const startSet = async () => {
    await click('[data-action="start"]'); await page.waitForSelector('#pane-right .part');
    const pids = (await st()).session.groups.map((g) => g.pid);
    await page.goto(APP_URL); await wait(100); await click('[data-action="enter"]');
    return pids;
  };
  await page.goto(APP_URL);

  // ── no repeats ──
  await seed({ version: 6, prefs: prefs({ exams: ['fa25'], size: 2 }), history: HISTORY });
  const summary = await page.$eval('.start-row .summary', (el) => el.textContent.replace(/\s+/g, ' '));
  ok(/\(2 not done yet\)/.test(summary), `1. the summary counts questions not done yet (“${summary.trim()}”)`);
  let clean = true;
  for (let i = 0; i < 8; i++) { const pids = await startSet(); if (pids.some((p) => DONE.includes(p)) || pids.length !== 2) clean = false; }
  ok(clean, '2. 8 sets of 2: only the 2 questions never answered, no done ones');

  await seed({ version: 6, prefs: prefs({ exams: ['fa25'], size: 4 }), history: HISTORY });
  const note = await page.$eval('.start-row .summary', (el) => el.textContent);
  ok(/2 you’ve done before, oldest first/.test(note), '3. a set bigger than what is left says how many repeats it has');
  const pids = await startSet();
  ok(FRESH.every((p) => pids.includes(p)) && pids.includes(DONE[0]) && pids.includes(DONE[1]) && pids.length === 4,
    `4. set of 4 with 2 left: both new ones + the 2 done longest ago (${pids.join(', ')})`);

  // ── Your topics ──
  await seed({ version: 6, prefs: prefs({ size: 5 }) });
  const empty = await page.$eval('.topic-overview', (el) => el.textContent);
  ok(/Check some answers/.test(empty) && !(await page.$('.to-row')), '5. no history: Your topics explains itself, no bars');

  await seed({ version: 6, prefs: prefs({ size: 5 }), history: TOPIC_HISTORY });
  const rows = await page.$$eval('.to-row', (l) => l.map((r) => r.dataset.topic));
  ok(rows[0] === 'links' && rows[rows.length - 1] === 'oop', `6. strongest first, weakest last (${rows.join(', ')})`);
  const callouts = await page.$$eval('.to-callout b', (l) => l.map((b) => b.textContent));
  ok(callouts[0] === 'Linked Lists' || /link/i.test(callouts[0]), `7. Strongest callout names links (${callouts[0]})`);
  ok(/oop|object/i.test(callouts[1]), `8. Needs the most work callout names OOP (${callouts[1]})`);
  const oopRow = await page.$eval('.to-row[data-topic="oop"]', (r) => ({ text: r.textContent.replace(/\s+/g, ' '), label: r.querySelector('.to-bar').getAttribute('aria-label') }));
  ok(/0%/.test(oopRow.text) && /2 missed/.test(oopRow.text) && /0 right, 2 missed/.test(oopRow.label), `9. OOP row: 0%, 2 missed (“${oopRow.text.trim()}”)`);

  await page.setViewport({ width: 390, height: 800 });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  ok(!overflow, '10. phone width: no sideways scroll');

  ok(!errors.length, `no page errors${errors.length ? ': ' + errors.join(' | ') : ''}`);
  await browser.close();
  process.exit(fails ? 1 : 0);
})().catch((er) => { console.error(er); process.exit(1); });

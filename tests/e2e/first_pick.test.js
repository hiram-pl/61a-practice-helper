// First pick counts: in practice, clicking a one-answer choice grades it right away and records it in the history.
// Changing to the right answer afterwards shows "Correct now" but the miss stays, in the history and the results.
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
const Q = B.QUESTIONS.find((q) => q.type === 'single_choice' && q.problem === 'fa25-1');
const RIGHT = B.ANSWER_KEY[Q.id].correct, WRONG = (RIGHT + 1) % Q.choices.length;
const IDS = B.QUESTIONS.filter((q) => q.problem === Q.problem).map((q) => q.id);

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
  const click = async (sel) => { await page.waitForSelector(sel, { visible: true, timeout: 8000 }); await page.click(sel); await wait(80); };
  const feedback = () => page.$eval(`#part-${Q.id} .feedback`, (el) => el.textContent.replace(/\s+/g, ' '));
  const start = async (history = []) => {
    await page.goto(APP_URL);
    await page.evaluate((k, v) => localStorage.setItem(k, v), KEY, JSON.stringify({ version: 6, history, session: { ids: IDS, title: 'T', startedAt: Date.now(), timer: null } }));
    await page.goto(APP_URL); await wait(150);
    await click('[data-action="enter"]'); await click('[data-action="resume"]'); await page.waitForSelector(`#part-${Q.id}`);
  };

  await start();
  await click(`label[for="c-${Q.id}-${WRONG}"]`);
  let S = await st();
  ok(S.session.checked[Q.id] === 'incorrect' && S.history.length === 1 && S.history[0].ok === false, '1. a wrong click is graded and recorded as a miss, no Check Answer needed');
  ok(/counts as a miss/.test(await feedback()), '2. the feedback says it counts as a miss');
  await click(`label[for="c-${Q.id}-${RIGHT}"]`);
  S = await st();
  ok(S.session.checked[Q.id] === 'correct' && S.history.length === 1 && S.history[0].ok === false, '3. switching to the right answer shows it correct; the history keeps one miss');
  ok(/Correct now/.test(await feedback()), '4. the feedback says "Correct now" but still a miss');
  await click('[data-action="finish"]');
  const row = await page.$$eval('.result-row', (l, id) => l.find((r) => r.dataset.q === id).textContent, Q.id);
  ok(/Incorrect/.test(row) && /wrong on the first pick/.test(row), '5. results count it as Incorrect and say it was fixed after');

  await start();
  await click(`label[for="c-${Q.id}-${RIGHT}"]`);
  S = await st();
  ok(S.history.length === 1 && S.history[0].ok === true && /Correct!/.test(await feedback()), '6. a right first click is recorded right');

  ok(!errors.length, `no page errors${errors.length ? ': ' + errors.join(' | ') : ''}`);
  await browser.close();
  process.exit(fails ? 1 : 0);
})().catch((er) => { console.error(er); process.exit(1); });

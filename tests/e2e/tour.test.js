// First-visit tour (app/tour.js): the welcome prompt, one-time tips across Practice, an exam and its review,
// dimming and blocking the page behind a tip, the countdown waiting while tips are up, End tutorial, No thanks, Replay.
const puppeteer = require('puppeteer-core');
const { APP_URL, CHROME } = require('./config');
const KEY = 'cs61a-practice:v1';
const TOUR = 'cs61a-practice:tour';
let fails = 0;
const ok = (c, m) => { console.log(`${c ? 'PASS' : 'FAIL'}  ${m}`); if (!c) fails++; };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
  const errors = [];
  const fresh = async (width = 1400, height = 900) => {
    const ctx = await browser.createBrowserContext();
    const page = await ctx.newPage();
    await page.setViewport({ width, height });
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('dialog', (d) => d.accept());
    await page.goto(APP_URL);
    return page;
  };
  // The tour's own buttons get a real mouse press (down and up), as a person would; page controls a plain click.
  const click = async (page, sel) => {
    await page.waitForSelector(sel);
    if (sel.startsWith('[data-tour')) {
      const at = await page.$eval(sel, (el) => { const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
      await page.mouse.click(...at);
    } else await page.$eval(sel, (el) => el.click());
    await wait(60);
  };
  const step = (page) => page.evaluate(() => { const t = document.querySelector('.tour'); return t ? (t.dataset.step || 'welcome') : null; });
  const tourState = (page) => page.evaluate((k) => JSON.parse(localStorage.getItem(k)), TOUR);
  const store = (page) => page.evaluate((k) => JSON.parse(localStorage.getItem(k)), KEY);
  // Clicks Next / Got it until no tip is up; returns the tips in the order shown.
  const drain = async (page) => {
    const seen = [];
    for (let i = 0; i < 10; i++) {
      await wait(200);
      const s = await step(page);
      if (!s) break;
      seen.push(s);
      await click(page, '[data-tour="next"]');
    }
    return seen;
  };

  // ── Welcome prompt and the home tip ──
  let page = await fresh();
  ok(!(await step(page)), 'landing page: no prompt yet');
  await click(page, '[data-action="enter"]');
  ok(await step(page) === 'welcome', 'home: the welcome prompt asks about the tour');
  ok(await page.$eval('#app', (a) => a.inert), 'the page behind the prompt can’t be used');
  await click(page, '[data-tour="start"]');
  ok(await step(page) === 'modes', 'Start tour: the first tip points at Practice Mode and Exam Mode');
  const geo = await page.evaluate(() => {
    const ring = document.querySelector('.tour-ring').getBoundingClientRect();
    const modes = document.querySelector('.mode-switch').getBoundingClientRect();
    return { around: ring.left <= modes.left && ring.right >= modes.right && ring.top <= modes.top && ring.bottom >= modes.bottom,
      holes: (document.querySelector('.tour-dim path').getAttribute('d').match(/M/g) || []).length };
  });
  ok(geo.around && geo.holes === 2, 'only the mode buttons are left undimmed and outlined');
  const start = await page.$eval('[data-action="start"]', (b) => { const r = b.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
  await page.mouse.click(...start);
  await wait(150);
  ok(await page.$('.home') && await step(page) === 'modes', 'clicking the dimmed page does nothing');
  await page.keyboard.press('ArrowRight');
  ok(await step(page) === 'modes', 'keys don’t reach the page behind the tip');
  ok(await page.$eval('[data-tour="next"]', (b) => b.textContent) === 'Got it', 'one tip on this screen: “Got it”');
  await click(page, '[data-tour="next"]');
  ok(!(await step(page)) && !(await page.$eval('#app', (a) => a.inert)), 'Got it: the page is usable again');
  ok((await tourState(page)).seen.modes === true, 'the tip is remembered as seen');
  await page.reload();
  await click(page, '[data-action="enter"]');
  ok(!(await step(page)), 'after a reload: no prompt and no repeat of the home tip');

  // ── Exam: tips come before the countdown ──
  await click(page, '#mode-exam');
  await click(page, '#exam-id-fa25');
  await click(page, '[data-action="start-exam"]');
  await page.waitForSelector('#pane-right .part');
  await wait(200);
  ok(await step(page) === 'directions-exam', 'exam, first question: the Directions tip comes first');
  ok(await page.$eval('.directions', (d) => d.textContent.includes('Save')), 'Directions opened by itself');
  ok(!(await page.$('[data-tour="back"]')), 'first tip on this screen: no Back (the last tip was on the home page)');
  let S = await store(page);
  ok(S.exam.timer.runningSince === null && S.exam.timer.pausedByTour === true, 'the countdown waits while the tip is up');
  const clock1 = await page.$eval('#clock', (c) => c.textContent);
  await wait(1300);
  ok(await page.$eval('#clock', (c) => c.textContent) === clock1, 'the clock doesn’t move');
  await page.keyboard.press('ArrowRight');
  ok((await store(page)).exam.index === 0, 'arrow keys don’t change the question behind a tip');
  ok(await page.$eval('[data-tour="next"]', (b) => b.textContent) === 'Next', 'more tips on this screen: “Next”');
  await page.reload(); // a refresh during the tips keeps the clock waiting and shows the tip again
  await page.waitForSelector('#pane-right .part');
  await wait(300);
  ok(await step(page) === 'directions-exam' && (await store(page)).exam.timer.runningSince === null, 'refresh during a tip: the tip is back, the clock still waits');
  await click(page, '[data-tour="next"]');
  ok(!(await page.$('.directions')) && await step(page) === 'annotate', 'Next closes Directions; then the annotation tools tip');
  ok(await page.$eval('.tour-card', (c) => c.querySelectorAll('.tool-key svg').length === 6 && c.textContent.includes('Highlighter: Select text')),
    'the annotation tip lists each toolbar icon with its name and use');
  await click(page, '[data-tour="back"]');
  await wait(150);
  ok(await step(page) === 'directions-exam' && await page.$('.directions'), 'Back: returns to the Directions tip and reopens the panel');
  await click(page, '[data-tour="next"]');
  ok(await step(page) === 'annotate', 'Next again: on to the annotation tip');
  const first = ['directions-exam', ...await drain(page)];
  ok(first[1] === 'annotate' && first.includes('mark') && !first.includes('run') && !first.includes('modes'),
    `exam tips: annotation, mark for review, no Run Code (${first.join(', ')})`);
  S = await store(page);
  ok(typeof S.exam.timer.runningSince === 'number' && !S.exam.timer.pausedByTour, 'after the last tip the countdown starts');
  ok(S.exam.timer.durationMs - S.exam.timer.remainingMs < 1000, 'the tips didn’t use up exam time');
  await click(page, '#nav-toggle');
  await click(page, '#nav-fa25-2');
  await page.waitForSelector('#dg-canvas');
  await wait(250);
  ok(await step(page) === 'dg-icons' && await page.$eval('.tour-card', (c) => c.querySelectorAll('.tool-key li').length === 8 && c.textContent.includes('Arrow')),
    'diagram tip 1: each diagram icon with its name');
  ok(await page.$eval('[data-tour="next"]', (b) => b.textContent) === 'Next', 'diagram tip 1 leads on with Next');
  await click(page, '[data-tour="next"]');
  await click(page, '[data-tour="back"]');
  ok(await step(page) === 'dg-icons', 'Back within the diagram tips');
  await click(page, '[data-tour="next"]');
  await page.waitForFunction(() => { const d = document.querySelector('.tour-demo'); return d && d.textContent.includes('5'); }, { timeout: 8000 }).catch(() => {});
  ok(await step(page) === 'dg-value' && await page.$eval('.tour-demo', (d) => !!d.querySelector('.td-cursor') && d.textContent.includes('5')), 'diagram tip 2: the value demo plays');
  await click(page, '[data-tour="next"]');
  await page.waitForFunction(() => document.querySelectorAll('.tour-demo .td-cell').length === 3, { timeout: 8000 }).catch(() => {});
  ok(await step(page) === 'dg-list' && await page.$eval('.tour-demo', (d) => d.querySelectorAll('.td-cell').length === 3), 'diagram tip 3: the list demo adds cells with +');
  await click(page, '[data-tour="next"]');
  await page.waitForSelector('.tour-demo .td-ink line.done', { timeout: 8000 }).catch(() => {});
  ok(await step(page) === 'dg-arrow' && await page.$eval('.tour-demo', (d) => !!d.querySelector('.td-ink line.done')), 'diagram tip 4: the arrow demo connects to the list');
  ok(await page.$eval('[data-tour="next"]', (b) => b.textContent) === 'Got it', 'the last diagram tip says Got it');
  const second = ['dg-icons', 'dg-value', 'dg-list', ...await drain(page)];
  ok(second.join() === 'dg-icons,dg-value,dg-list,dg-arrow' && !second.includes('annotate') && !second.includes('mark'), `diagram question: only the new tips (${second.join(', ')})`);
  ok(!(await page.$('.tour')) && !(await page.$eval('#app', (a) => a.inert)), 'tips are cleared');
  await click(page, '#nav-toggle');
  await click(page, '#nav-fa25-3'); // the first question with blanks in its code
  await wait(300);
  ok(await step(page) === 'blanks', 'question with blanks: the answers-fill-the-code tip');
  const pair = await page.evaluate(() => [...document.querySelectorAll('.tour-ring')].map((r) => r.getBoundingClientRect().left));
  ok(pair.length === 2 && pair[0] < 700 && pair[1] > 700, 'it outlines a blank in the code and its answer on the right');
  const third = await drain(page);
  const shownInExam = new Set([...first, ...second, ...third]);
  await click(page, '.p-footer [data-action="submit-exam"]');
  await wait(300);
  const confirm = await page.$('[data-action="confirm-submit"]');
  if (confirm) await click(page, '[data-action="confirm-submit"]');
  await page.waitForSelector('#insights');
  await wait(250);
  ok(await step(page) === 'insights', 'exam review page: the learning insights tip');
  await drain(page);
  ok(!(await step(page)), 'results: no other tips');

  // ── Practice afterwards: only what hasn't been shown ──
  await page.goto(APP_URL);
  await page.evaluate((k) => { const v = JSON.parse(localStorage.getItem(k)); v.prefs.mode = 'practice'; v.prefs.types = ['code']; localStorage.setItem(k, JSON.stringify(v)); }, KEY);
  await page.reload();
  await click(page, '[data-action="enter"]');
  await click(page, '#mode-practice');
  await click(page, '[data-action="start"]');
  await page.waitForSelector('#run-btn');
  await wait(250);
  const practice = await drain(page);
  ok(practice.includes('run') && practice.every((s) => !shownInExam.has(s)), `practice: Run Code, and nothing already seen in the exam (${practice.join(', ')})`);
  S = await store(page);
  ok(!S.session.timer || typeof S.session.timer.runningSince === 'number', 'practice timer runs once the tips are done');
  ok(!practice.includes('tutor'), 'no Python Tutor button on the page: no Python Tutor tip');
  // A stand-in for the Python Tutor button (it ships on its own branch): the tip appears once the button does.
  await page.evaluate(() => {
    document.querySelector('.run-bar').insertAdjacentHTML('beforeend', '<button class="btn btn-sm" id="tutor-btn">Python Tutor ↗</button>');
    window.CS61A_TOUR.update();
  });
  await wait(200);
  ok(await step(page) === 'tutor' && await page.$eval('.tour-card', (c) => c.textContent.includes('every blank is filled')), 'Python Tutor button present: its tip shows');
  await drain(page);
  await page.close();

  // ── End tutorial, Replay, Escape ──
  page = await fresh();
  await click(page, '[data-action="enter"]');
  await click(page, '[data-tour="start"]');
  await click(page, '[data-tour="end"]');
  ok(!(await step(page)) && (await tourState(page)).on === false, 'End tutorial: the tip closes and the tour is off');
  await click(page, '#mode-practice');
  await click(page, '[data-action="start"]');
  await page.waitForSelector('#pane-right .part');
  await wait(300);
  ok(!(await step(page)), 'after End tutorial: no tips on questions');
  await page.goto(APP_URL);
  await click(page, '[data-action="enter"]');
  ok(await page.$('[data-action="replay-tour"]'), 'home has a Replay the tutorial button');
  await click(page, '[data-action="replay-tour"]');
  ok(await step(page) === 'modes', 'Replay: the tips start over from the home tip');
  await page.keyboard.press('Escape');
  await wait(100);
  ok(!(await step(page)) && (await tourState(page)).seen.modes, 'Escape closes a tip like Got it');
  await page.close();

  // ── No thanks ──
  page = await fresh();
  await click(page, '[data-action="enter"]');
  await click(page, '[data-tour="no"]');
  ok(!(await step(page)), 'No thanks: the prompt closes');
  await page.reload();
  await click(page, '[data-action="enter"]');
  ok(!(await step(page)), 'No thanks: not asked again');
  await click(page, '#mode-practice');
  await click(page, '[data-action="start"]');
  await page.waitForSelector('#pane-right .part');
  await wait(300);
  ok(!(await step(page)), 'No thanks: no tips on questions');
  await page.close();

  // ── Phone width: the card stays on screen ──
  page = await fresh(390, 800);
  await click(page, '[data-action="enter"]');
  await click(page, '[data-tour="start"]');
  await click(page, '#mode-practice').catch(() => {});
  await click(page, '[data-tour="next"]');
  await click(page, '[data-action="start"]');
  await page.waitForSelector('#pane-right .part');
  await wait(300);
  const box = await page.$eval('.tour-card', (c) => { const r = c.getBoundingClientRect(); return [r.left, r.right, r.top, r.bottom]; });
  ok(box[0] >= 0 && box[1] <= 390 && box[2] >= 0 && box[3] <= 800, `phone: the tip card fits the screen (${box.map(Math.round).join(', ')})`);
  await page.close();

  ok(errors.length === 0, `no page errors ${errors.join(' | ').slice(0, 200)}`);
  await browser.close();
  console.log(fails ? `${fails} FAILED` : 'All passed');
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.log('ERROR', e.message); process.exit(2); });

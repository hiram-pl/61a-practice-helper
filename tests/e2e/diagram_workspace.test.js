// Environment diagram workspace and the Python Tutor link: drawing, text, arrows, undo/redo, saving, and the
// path from an exam into its review. Also checks that ordinary re-renders leave the workspace alone.
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
  await fullBank(page); // uses questions this semester's scope may hide; in_scope.test.js covers the scope
  await page.setViewport({ width: 1400, height: 900 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('dialog', (d) => d.accept());
  const st = async () => { await wait(350); return page.evaluate((k) => JSON.parse(localStorage.getItem(k)), KEY); };
  const click = async (sel) => { await page.waitForSelector(sel); await page.$eval(sel, (el) => el.click()); await wait(40); };
  const tool = (k) => click(`[data-dg="${k}"]`);
  const canvasAt = async (x, y) => {
    const r = await page.$eval('#dg-canvas', (el) => { document.getElementById('pane-right').scrollTop = 0; const b = el.getBoundingClientRect(); return { left: b.left, top: b.top }; });
    return [r.left + x, r.top + y];
  };
  const drag = async (x1, y1, x2, y2) => {
    await page.mouse.move(...await canvasAt(x1, y1));
    await page.mouse.down();
    await page.mouse.move(...await canvasAt((x1 + x2) / 2, (y1 + y2) / 2), { steps: 4 });
    await page.mouse.move(...await canvasAt(x2, y2), { steps: 4 });
    await page.mouse.up();
    await wait(40);
  };
  const clickAt = async (x, y) => { await page.mouse.click(...await canvasAt(x, y)); await wait(40); };
  const gotoProblem = async (pid) => { await click('#nav-toggle'); await click(`#nav-${pid}`); await page.waitForSelector('#dg-canvas'); };
  const startExam = async (id) => {
    await page.goto(APP_URL);
    await page.evaluate((k, v) => { localStorage.setItem(k, v); Storage.prototype.setItem = function () {}; }, KEY, JSON.stringify({ prefs: { mode: 'exam' }, examPrefs: { kind: 'full', topics: [], picked: [], timerOn: false, minutes: 120 } }));
    await page.goto(APP_URL);
    await click('[data-action="enter"]');
    await click(`#exam-id-${id}`);
    await click('[data-action="start-exam"]');
    await page.waitForSelector('#pane-right .part');
  };
  const items = (S, pid) => (S.exam.diagrams || {})[pid] || [];

  await startExam('fa25');
  ok(!(await page.$('#dg-canvas')), 'no workspace on a question without a figure');
  await gotoProblem('fa25-2');
  ok(await page.$eval('.dg-canvas img', (i) => i.complete && i.naturalWidth === 628), 'Fall 2025 Q2: the exam’s diagram image loads');
  ok(!(await page.$('#pane-left img')), 'the figure is no longer shown on the left');
  ok(!(await page.$('#tutor-btn')), 'live exam: no Python Tutor button');

  await tool('pen');
  await drag(300, 40, 360, 90);
  let S = await st();
  ok(items(S, 'fa25-2').length === 1 && items(S, 'fa25-2')[0].kind === 'pen', 'pen: a stroke is saved in image coordinates');

  await tool('pen'); // back to typing
  await clickAt(500, 300);
  await page.keyboard.type('s');
  await page.keyboard.press('Enter');
  S = await st();
  const text = items(S, 'fa25-2').find((a) => a.kind === 'text');
  ok(text && text.text === 's', 'text: click and type places a text box');
  ok(Math.abs(text.x - 497) <= 1 && Math.abs(text.y - 289) <= 1, 'text: the box lands on the click, not above it');
  ok(S.exam.marked && !S.exam.marked['fa25-2'], 'typing in a text box doesn’t trigger the M shortcut');

  await clickAt(450, 340); // only ends the selection
  await clickAt(450, 340);
  await page.keyboard.press('Enter');
  S = await st();
  ok(items(S, 'fa25-2').filter((a) => a.kind === 'text').length === 1, 'text: an empty box isn’t kept');

  await tool('arrow');
  await drag(420, 100, 600, 100);
  S = await st();
  let arrow = items(S, 'fa25-2').find((a) => a.kind === 'arrow');
  ok(arrow && arrow.from[0] === 420 && arrow.to[0] === 600, 'arrow: drag draws from start to end');
  await tool('arrow'); // back to select
  await drag(480, 100, 480, 150);
  S = await st();
  arrow = items(S, 'fa25-2').find((a) => a.kind === 'arrow');
  ok(arrow.from[1] === 150 && arrow.to[1] === 150, 'select: dragging the line moves the whole arrow');
  await drag(600, 150, 620, 200);
  S = await st();
  arrow = items(S, 'fa25-2').find((a) => a.kind === 'arrow');
  ok(arrow.to[0] === 620 && arrow.to[1] === 200 && arrow.from[1] === 150, 'select: dragging an end moves only that end');

  await drag(text.x + 6, text.y + 10, text.x + 46, text.y + 30);
  S = await st();
  const moved = items(S, 'fa25-2').find((a) => a.kind === 'text');
  ok(moved.x === text.x + 40 && moved.y === text.y + 20, 'select: dragging a text box moves it');
  await clickAt(moved.x + 6, moved.y + 10);
  ok(await page.evaluate(() => document.activeElement.classList.contains('dg-text')), 'select: clicking a text box edits it');
  await page.keyboard.press('End');
  await page.keyboard.type('!');
  await page.keyboard.press('Enter');
  S = await st();
  ok(items(S, 'fa25-2').find((a) => a.kind === 'text').text === 's!', 'text: edits are saved');

  await tool('undo');
  S = await st();
  ok(items(S, 'fa25-2').find((a) => a.kind === 'text').text === 's', 'undo: reverses the text edit');
  ok(await page.$eval('.dg-text:not(.dg-slot)', (i) => i.value === 's'), 'undo: the box on screen shows the old text');
  await tool('redo');
  S = await st();
  ok(items(S, 'fa25-2').find((a) => a.kind === 'text').text === 's!', 'redo: restores it');

  const answer = 'fa25-2a';
  await page.type(`#pane-right textarea[data-qid="${answer}"]`, '[3, 2]');
  await wait(100);
  ok(await page.$('.dg-layer .dg-pen') && await page.$('.dg-text:not(.dg-slot)'), 'answering (a re-render) leaves the workspace in place');
  await click('[data-action="mark"]');
  ok(await page.$('.dg-layer .dg-pen'), 'Mark for Review (a re-render) leaves the workspace in place');

  await tool('eraser');
  const pen = items(await st(), 'fa25-2').find((a) => a.kind === 'pen').pts;
  await clickAt(...pen[Math.floor(pen.length / 2)]);
  S = await st();
  ok(!items(S, 'fa25-2').some((a) => a.kind === 'pen'), 'eraser: removes a stroke');
  ok(items(S, 'fa25-2').some((a) => a.kind === 'arrow'), 'eraser: leaves other marks');
  await tool('undo');

  const annotationsBefore = JSON.stringify((await st()).exam.annotations);
  await click('[data-ann="pen"]');
  ok(JSON.stringify((await st()).exam.annotations) === annotationsBefore, 'the left annotation tools don’t touch the diagram');
  await click('[data-ann="pen"]');

  await page.reload();
  await page.waitForSelector('#dg-canvas');
  ok(await page.$('.dg-layer .dg-pen') && await page.$('.dg-layer .dg-arrow') && await page.$eval('.dg-text:not(.dg-slot)', (i) => i.value === 's!'), 'reload: the diagram is restored');

  await click('.p-footer [data-action="submit-exam"]');
  await page.waitForSelector('.exam-results');
  S = await st();
  ok(S.attempts.length === 1 && (S.attempts[0].diagrams['fa25-2'] || []).length === 3, 'submit: the attempt keeps the diagram');
  const submitted = JSON.stringify(S.attempts[0].diagrams);

  await click('.actions [data-action="exam-review"]');
  await page.waitForSelector('#review-work .part');
  await click('#nav-toggle');
  await click('#nav-fa25-2');
  await page.waitForSelector('#dg-canvas');
  ok(await page.$('.dg-layer .dg-pen') && await page.$eval('.dg-text:not(.dg-slot)', (i) => i.value === 's!'), 'review: the diagram is there');
  ok(await page.$('#tutor-btn'), 'review: the Python Tutor button is available');
  await tool('pen');
  await drag(300, 200, 360, 230);
  S = await st();
  ok(JSON.stringify(S.attempts[0].diagrams) === submitted, 'review: new marks don’t change the submitted attempt');
  ok(Object.values(S.reviews)[0].diagrams['fa25-2'].length === 4, 'review: new marks are saved in the review workspace');

  const opened = [];
  await page.evaluate(() => { window.__opened = []; window.open = (...a) => { window.__opened.push(a); return null; }; });
  await click('#tutor-btn');
  opened.push(...await page.evaluate(() => window.__opened));
  const url = opened[0] && opened[0][0];
  ok(url && url.startsWith('https://pythontutor.com/cp/composingprograms.html#code='), 'Python Tutor: opens the Composing Programs version');
  const params = new URLSearchParams((url || '').split('#')[1] || '');
  ok(/def wrap\(s\):/.test(params.get('code') || '') && params.get('mode') === 'edit' && params.get('py') === '3' && params.get('cumulative') === 'true', 'Python Tutor: the code and options are in the URL');
  ok(opened[0] && opened[0][1] === '_blank' && opened[0][2] === 'noopener', 'Python Tutor: new tab, no access back to this page');
  ok(await page.$eval('#tutor-btn', (b) => b.getAttribute('aria-disabled') === 'false'), 'Python Tutor: a question with no blanks in its code is always available');

  // A question with blanks: unavailable (greyed, says what's missing) until every blank has an answer.
  await click('#nav-toggle');
  await click('#nav-fa25-3');
  await page.waitForSelector('#tutor-btn');
  const tutorState = () => page.evaluate(() => {
    const b = document.getElementById('tutor-btn'), m = document.getElementById('tutor-msg');
    return { off: b.getAttribute('aria-disabled') === 'true', faded: getComputedStyle(b).opacity < 0.6, msg: m.hidden ? '' : m.textContent, opened: window.__opened.length };
  });
  let ts = await tutorState();
  ok(ts.off && ts.faded && !ts.msg, 'Python Tutor: greyed out while the code has empty blanks');
  await click('#tutor-btn');
  ts = await tutorState();
  ok(ts.opened === 1 && ts.msg === 'Fill in every blank first. Still empty: (a), (b), (c).', `Python Tutor: a click doesn’t open it and says which blanks are empty (${ts.msg})`);
  const parts = await page.$$eval('#review-work .part', (ps) => ps.map((p) => p.dataset.part));
  for (const [i, id] of parts.entries()) {
    const sel = `#review-work .part[data-part="${id}"]`;
    if (await page.$(`${sel} input[type="radio"], ${sel} input[type="checkbox"]`)) await click(`${sel} input:not([type="hidden"])`);
    else await page.$eval(`${sel} textarea`, (t) => { t.value = 'wrong but filled'; t.dispatchEvent(new Event('input', { bubbles: true })); });
    await wait(80);
    ts = await tutorState();
    if (i === 0) ok(ts.off && ts.msg === 'Fill in every blank first. Still empty: (b), (c).', `Python Tutor: the message updates as blanks are filled (${ts.msg})`);
  }
  ts = await tutorState();
  ok(!ts.off && !ts.faded && !ts.msg, 'Python Tutor: available again once every blank is filled, right or wrong');
  await click('#tutor-btn');
  ts = await tutorState();
  ok(ts.opened === 2 && /def includes\(part, whole\):/.test(decodeURIComponent((await page.evaluate(() => window.__opened[1][0])).split('code=')[1])), 'Python Tutor: then a click opens it with the filled-in code');
  await click('#nav-toggle');
  await click('#nav-fa25-2');
  await page.waitForSelector('#dg-canvas');
  const tutorCode = (pid) => page.evaluate((id) => {
    const B = window.CS61A_BANK;
    return window.CS61A_TUTOR.build(id, B.PROBLEMS[id].code, B, window.CS61A_TEST_SUITES);
  }, pid);
  const exclude = await tutorCode('fa25-4');
  ok(/def exclude\(s, x\):/.test(exclude) && exclude.includes('>>> exclude(a, 3)'), 'Python Tutor: keeps the question code and its doctests');
  ok(exclude.includes('class Link:') && exclude.indexOf('class Link:') < exclude.indexOf('def exclude('), 'Python Tutor: defines Link before the code');
  ok(exclude.includes('\na = [3, 4, 5, 3.0, 6, 5, 3]\nprint(exclude(a, 3))\nprint(a)  # no change to a\n'), 'Python Tutor: adds the doctest calls, printing their results');
  ok(exclude.includes('print(repr(exclude_link(a, 3)))'), 'Python Tutor: repr() when the doctest shows a Link');
  ok((await tutorCode('sp25-1')).endsWith('print([x[1] for x in s if isinstance(x, list)])\nprint(next(m))\nprint(t.pop())\nprint([next(m) for z in range(2)])\n'), 'Python Tutor: adds What Would Python Display expressions in order');
  ok((await tutorCode('sp24-1')).includes('class Link:'), 'Python Tutor: What Would Python Display gets Link too');
  ok((await tutorCode('fa25-5')).includes('\nc.order(6)  # All'), 'Python Tutor: no print() around functions that print and return None');
  ok(await page.evaluate(() => {
    const B = window.CS61A_BANK;
    return window.CS61A_TUTOR.build('fa25-2', B.PROBLEMS['fa25-2'].code, B, window.CS61A_TEST_SUITES).trim() === B.PROBLEMS['fa25-2'].code.trim();
  }), 'Python Tutor: environment diagram code is unchanged');

  // Blanks: typeable straight away, Tab moves on, and they get out of the way while drawing.
  await tool('pen'); // back to typing
  const review = async () => Object.values((await st()).reviews)[0].diagrams['fa25-2'];
  ok(await page.$$eval('.dg-slot', (l) => l.length) === 24, 'blanks: Fall 2025 Q2 has all 24');
  const firstBlank = await page.$eval('.dg-slot[data-slot="1"]', (el) => [el.offsetLeft + 8, el.offsetTop + 10]);
  await clickAt(...firstBlank);
  await page.keyboard.type('s');
  await page.keyboard.press('Tab');
  await page.keyboard.type('[1, 2, 3]');
  await page.keyboard.press('Enter');
  let d = await review();
  ok(d.find((a) => a.slot === 1).text === 's' && d.find((a) => a.slot === 2).text === '[1, 2, 3]', 'blanks: click and type, Tab goes to the next one');
  ok(await page.$eval('.dg-slot[data-slot="2"]', (el) => el.offsetWidth > 43), 'blanks: a long value widens its box');
  await tool('undo');
  ok((await review()).every((a) => a.slot !== 2), 'blanks: undo clears the last one typed');
  await tool('redo');
  await tool('pen');
  const hidden = await page.$eval('.dg-slot[data-slot="3"]', (el) => { const c = getComputedStyle(el); return c.pointerEvents === 'none' && c.backgroundColor === 'rgba(0, 0, 0, 0)'; });
  ok(hidden, 'blanks: hidden and not clickable while drawing');
  ok(await page.$eval('.dg-slot[data-slot="1"]', (el) => el.value === 's' && getComputedStyle(el).visibility === 'visible'), 'blanks: typed text stays visible while drawing');
  const countBefore = (await review()).length;
  await drag(...firstBlank, firstBlank[0] + 40, firstBlank[1] + 5);
  d = await review();
  ok(d.length === countBefore + 1 && d[d.length - 1].kind === 'pen', 'blanks: the pen draws straight over them');
  await tool('pen');
  ok(await page.$eval('.dg-slot[data-slot="3"]', (el) => getComputedStyle(el).pointerEvents !== 'none'), 'blanks: back when the pen is off');
  await clickAt(...firstBlank);
  await page.keyboard.press('End');
  await page.keyboard.press('Backspace');
  await page.keyboard.press('Enter');
  d = await review();
  ok(!d.some((a) => a.slot === 1), 'blanks: emptying one removes it');
  await clickAt(...firstBlank);
  await page.keyboard.type('x');
  await page.keyboard.press('Enter');
  d = await review();
  ok(d.find((a) => a.slot === 1).text === 'x', 'blanks: it can be typed in again');
  await click('#nav-toggle'); await click('#nav-fa25-1');
  await gotoProblem('fa25-2');
  ok(await page.$eval('.dg-slot[data-slot="1"]', (el) => el.value === 'x'), 'blanks: still there after leaving the question and coming back');

  // Lists and magnetic arrows.
  const diagram = async () => Object.values((await st()).reviews)[0].diagrams['fa25-2'];
  const center = (sel) => page.$eval(sel, (el) => {
    const c = document.getElementById('dg-canvas').getBoundingClientRect();
    const b = el.getBoundingClientRect();
    return [b.left - c.left + b.width / 2, b.top - c.top + b.height / 2];
  });
  await tool('list');
  await clickAt(440, 450);
  await page.keyboard.type('5');
  await page.keyboard.press('Enter');
  let dd = await diagram();
  let lists = dd.filter((a) => a.kind === 'list');
  ok(lists.length === 1 && lists[0].cells.length === 1 && lists[0].cells[0] === '5', 'list: a click makes a one-element list, ready to type in');
  ok(await page.$eval('#dg-canvas', (c) => c.dataset.mode === 'select'), 'list: back to typing afterwards');
  await click('[data-dgl="add"]');
  await page.keyboard.type('6');
  await page.keyboard.press('Enter');
  await click('[data-dgl="add"]');
  await page.keyboard.press('Enter');
  dd = await diagram();
  ok(dd.find((a) => a.kind === 'list').cells.join() === '5,6,', 'list: + adds an element and goes to it');
  await click('[data-dgl="remove"]');
  dd = await diagram();
  ok(dd.find((a) => a.kind === 'list').cells.join() === '5,6', 'list: − removes the last element');
  await tool('undo'); await tool('redo');
  ok((await diagram()).find((a) => a.kind === 'list').cells.join() === '5,6', 'list: undo and redo');
  await tool('list');
  await clickAt(440, 530);
  await page.keyboard.type('7');
  await page.keyboard.press('Enter');
  const firstList = (await diagram()).filter((a) => a.kind === 'list')[0].id;
  const secondList = (await diagram()).filter((a) => a.kind === 'list')[1].id;
  const cellOf = (id, i) => `.dg-list[data-did="${id}"] .dg-cell[data-i="${i}"]`;
  ok((await diagram()).filter((a) => a.kind === 'list').length === 2, 'list: a second list can be added');

  await tool('arrow');
  const c1 = await center(cellOf(firstList, 1));
  const c2 = await center(cellOf(secondList, 0));
  await drag(c1[0] + 3, c1[1] + 3, c2[0] - 4, c2[1] - 4);
  dd = await diagram();
  const link = dd.filter((a) => a.kind === 'arrow').find((a) => a.fromRef && a.fromRef.list);
  ok(link && link.fromRef.list === firstList && link.fromRef.cell === 1 && link.toRef.list === secondList && link.toRef.cell === 0, 'arrow: snaps from one list’s element to another’s, even when dropped off-centre');
  const value = await center('.dg-slot[data-slot="6"]');
  await drag(value[0], value[1], c2[0] + 2, c2[1]);
  dd = await diagram();
  const links = dd.filter((a) => a.kind === 'arrow' && a.toRef && a.toRef.list === secondList);
  ok(links.length === 2 && links[1].fromRef.slot === 6, 'arrow: snaps from a value blank too');
  const sameSide = links[0].to[0] === links[1].to[0];
  ok(!sameSide || Math.abs(links[0].to[1] - links[1].to[1]) >= 3, 'arrow: two arrows to one target don’t land on the same spot');
  const arrowCount = async () => (await diagram()).filter((a) => a.kind === 'arrow').length;
  const n0 = await arrowCount();
  const c3 = await center(cellOf(firstList, 0));
  await clickAt(...c3); // click and let go: the end follows the pointer
  await page.mouse.move(...await canvasAt(c3[0] + 60, c3[1] - 40), { steps: 4 });
  await wait(60);
  ok(await page.$$eval('.dg-layer .dg-arrow', (l) => l.length) > n0 && await arrowCount() === n0, 'arrow by clicks: after the first click the arrow follows the pointer, not saved yet');
  await clickAt(c2[0] + 3, c2[1] - 2);
  dd = await diagram();
  const clicked = dd.filter((a) => a.kind === 'arrow').find((a) => a.fromRef && a.fromRef.list === firstList && a.fromRef.cell === 0);
  ok(await arrowCount() === n0 + 1 && clicked && clicked.toRef && clicked.toRef.list === secondList, 'arrow by clicks: the second click places it and snaps onto the list');
  await clickAt(...c3);
  await page.mouse.move(...await canvasAt(c3[0] + 80, c3[1] + 30), { steps: 3 });
  await page.keyboard.press('Escape');
  await wait(60);
  await page.mouse.move(...await canvasAt(c3[0] + 120, c3[1] + 50), { steps: 3 });
  ok(await arrowCount() === n0 + 1 && await page.$eval('#dg-canvas', (c) => c.dataset.mode === 'arrow'), 'arrow by clicks: Esc cancels the arrow in progress and keeps the Arrow tool');
  await tool('undo');
  ok(await arrowCount() === n0, 'arrow by clicks: one undo removes it');
  const cellsOf = async (id) => (await diagram()).find((a) => a.id === id).cells.length;
  const plusAt = async (id, k) => page.mouse.click(...await canvasAt(...await center(`.dg-list[data-did="${id}"] [data-dgl="${k}"]`)));
  const m0 = await cellsOf(secondList);
  await plusAt(secondList, 'add'); await wait(60); await page.keyboard.press('Escape');
  ok(await cellsOf(secondList) === m0 + 1, 'list: + works while the Arrow tool is on');
  await plusAt(secondList, 'remove'); await wait(60);
  ok(await cellsOf(secondList) === m0, 'list: − works while the Arrow tool is on');
  await tool('list');
  await plusAt(secondList, 'add'); await wait(60); await page.keyboard.press('Escape');
  ok(await cellsOf(secondList) === m0 + 1 && (await diagram()).filter((a) => a.kind === 'list').length === 2, 'list: + works while the List tool is on, without making a new list');
  await plusAt(secondList, 'remove'); await wait(60);
  await tool('list');
  await tool('arrow');
  await tool('arrow');
  const before = links[0].to.slice();
  const grip = await center(`.dg-list[data-did="${secondList}"] .dg-grip`);
  await drag(grip[0], grip[1], grip[0] + 30, grip[1] + 20);
  dd = await diagram();
  const after = dd.find((a) => a.id === links[0].id);
  ok(Math.abs(after.to[0] - before[0] - 30) <= 12 && after.toRef.list === secondList, 'arrow: follows a list when it moves');
  await click(`.dg-list[data-did="${firstList}"] [data-dgl="remove"]`);
  dd = await diagram();
  const orphan = dd.find((a) => a.id === links[0].id);
  ok(orphan && !orphan.fromRef, 'arrow: stays, unattached, when its element is removed');
  await tool('undo');
  dd = await diagram();
  ok(dd.find((a) => a.id === links[0].id).fromRef.cell === 1, 'arrow: undo reattaches it');

  ok(errors.length === 0, `no page errors${errors.length ? `: ${errors.join(' | ')}` : ''}`);
  await browser.close();
  console.log(fails ? `\n${fails} check(s) FAILED` : '\nAll checks passed');
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });

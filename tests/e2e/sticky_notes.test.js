// Sticky notes in the annotation toolbar: placing a note (Blank note / Tree note), typing, moving, resizing,
// deleting, tree branches (+ adds, × removes a node with everything below it, arrows drawn automatically, tidy
// layout), undo / redo / Clear all, notes kept per question and across a refresh, typing in a note never changes
// the question, and saved pen strokes stay where they were.
const puppeteer = require('puppeteer-core');
const { APP_URL, CHROME, skipTour } = require('./config');
const KEY = 'cs61a-practice:v1';
let fails = 0;
const ok = (c, m) => { console.log(`${c ? 'PASS' : 'FAIL'}  ${m}`); if (!c) fails++; };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const ALL = ['fa25', 'sp25', 'fa24', 'sp24', 'fa23', 'sp23', 'fa22', 'fa21'];

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
  const notes = async () => ((await st()).session.annotations['fa25-3'] || []).filter((a) => a.kind === 'note');
  const click = async (sel) => { await page.waitForSelector(sel, { visible: true, timeout: 8000 }); await page.click(sel); await wait(80); };
  const art = () => page.$eval('#problem-article', (a) => { const r = a.getBoundingClientRect(); return { x: r.left, y: r.top }; });
  const place = async (dx, dy, kind) => {
    await click('[data-ann="note"]');
    const a = await art();
    await page.mouse.click(a.x + dx, a.y + dy); await wait(120);
    if (kind) await click(`[data-nd="new-${kind}"]`);
  };
  const away = async () => { await page.mouse.click(8, 890); await wait(120); }; // somewhere neutral, so the field loses focus
  const typeIn = async (sel, text) => { await page.focus(sel); await page.keyboard.type(text); };
  const addKid = async (path) => { await page.hover(`.tnode[data-path="${path}"]`); await page.click(`.tnode[data-path="${path}"] .tnode-add`); await wait(80); };
  const dragBy = async (sel, dx, dy) => {
    const r = await page.$eval(sel, (e) => { const b = e.getBoundingClientRect(); return [b.left + Math.min(30, b.width / 2), b.top + b.height / 2]; });
    await page.mouse.move(r[0], r[1]); await page.mouse.down();
    for (let i = 1; i <= 5; i++) { await page.mouse.move(r[0] + dx * i / 5, r[1] + dy * i / 5); await wait(16); }
    await page.mouse.up(); await wait(150);
  };
  const box = (sel) => page.$eval(sel, (e) => { const b = e.getBoundingClientRect(); return { x: Math.round(b.left), y: Math.round(b.top), w: Math.round(b.width), h: Math.round(b.height) }; });

  // A practice set with Fall 2025 Q3 (code with blanks) and Q4.
  const ids = ['fa25-3a', 'fa25-3b', 'fa25-3c', 'fa25-4a', 'fa25-4b'];
  const session = { ids, groups: [{ pid: 'fa25-3', ids: ids.slice(0, 3) }, { pid: 'fa25-4', ids: ids.slice(3) }], index: 0, title: 'Notes test', answers: {}, checked: {}, revealed: {}, selfGrade: {}, marked: {}, eliminated: {}, notes: {}, annotations: {}, timer: null, startedAt: 1, finishedAt: null, finished: false };
  await page.goto(APP_URL);
  await page.evaluate((k, v) => { localStorage.setItem(k, v); Storage.prototype.setItem = function () {}; }, KEY, JSON.stringify({ prefs: { mode: 'practice', exams: ALL, examsKnown: ALL, topics: [], difficulties: ['easy', 'medium', 'hard'], size: 5, timerOn: false, minutes: 25 }, session }));
  await page.goto(APP_URL); await wait(150);
  await click('[data-action="enter"]'); await click('[data-action="resume"]');
  await page.waitForSelector('#pane-right .part');

  // ── Toolbar ──
  const order = await page.$$eval('#annot-bar [data-ann]', (bs) => bs.map((b) => b.dataset.ann));
  ok(order.slice(0, 4).join() === 'hl,pen,eraser,note', `sticky note tool sits after the eraser (${order.join(', ')})`);
  await click('[data-ann="note"]');
  ok(await page.$eval('[data-ann="note"]', (b) => b.getAttribute('aria-pressed')) === 'true' && /sticky note should go/.test(await page.$eval('#annot-hint', (h) => h.textContent)),
    'the tool is pressed and the hint says to click where the note goes');
  await click('[data-ann="note"]');
  ok(await page.$eval('[data-ann="note"]', (b) => b.getAttribute('aria-pressed')) === 'false', 'clicking it again turns it off');

  // ── Pen stroke first, to check notes don't move saved strokes ──
  await click('[data-ann="pen"]');
  let a = await art();
  await page.mouse.move(a.x + 60, a.y + 300); await page.mouse.down(); await page.mouse.move(a.x + 140, a.y + 320); await page.mouse.up(); await wait(150);
  await click('[data-ann="pen"]');
  const strokeBefore = await page.$eval('.annot-layer path', (p) => p.getAttribute('d'));

  // ── Chooser ──
  await place(120, 200);
  ok(await page.$('.note-pick') && await page.$eval('[data-ann="note"]', (b) => b.getAttribute('aria-pressed')) === 'false', 'clicking the page opens the Blank note / Tree note chooser');
  await page.keyboard.press('Escape'); await wait(100);
  ok(!(await page.$('.note-pick')), 'Escape closes the chooser');
  await place(120, 200); await click('[data-nd="cancel"]');
  ok(!(await page.$('.note-pick')) && (await notes()).length === 0, 'Cancel closes it without adding a note');

  // ── Blank note ──
  await place(120, 200, 'text');
  ok(await page.evaluate(() => document.activeElement.classList.contains('snote-text')), 'a blank note opens ready to type');
  await page.keyboard.type('base case?');
  await page.keyboard.press('ArrowRight');
  ok((await st()).session.index === 0, 'arrow keys inside a note move the cursor, not the question');
  await away();
  let N = await notes();
  ok(N.length === 1 && N[0].type === 'text' && N[0].text === 'base case?', `the note and its text are saved (${JSON.stringify(N.map((n) => n.text))})`);
  ok(await page.$eval('.annot-layer path', (p) => p.getAttribute('d')) === strokeBefore, 'the pen stroke drawn earlier hasn’t moved');

  // move and resize
  const b0 = await box('.snote');
  await dragBy('.snote-bar', 90, 60);
  const b1 = await box('.snote');
  ok(b1.x - b0.x === 90 && b1.y - b0.y === 60, `dragging the top bar moves the note (${b1.x - b0.x}, ${b1.y - b0.y})`);
  await dragBy('.snote-size', 70, 40);
  const b2 = await box('.snote');
  ok(b2.w === b1.w + 70 && b2.h === b1.h + 40 && b2.x === b1.x, `dragging the corner resizes it (${b2.w}×${b2.h})`);
  await dragBy('.snote-size', -400, -400);
  const b3 = await box('.snote');
  ok(b3.w === 150 && b3.h === 90, `it can't shrink below 150×90 (${b3.w}×${b3.h})`);
  N = await notes();
  ok(N[0].w === 150 && N[0].h === 90, 'the size is saved');

  // undo / redo walk back through resize, resize, move and the text
  await click('[data-ann="undo"]'); await click('[data-ann="undo"]');
  ok(JSON.stringify(await box('.snote')) === JSON.stringify(b1), 'Undo twice: back to the size before resizing');
  await click('[data-ann="undo"]');
  ok(JSON.stringify(await box('.snote')) === JSON.stringify(b0), 'Undo: back to where it was placed');
  await click('[data-ann="undo"]');
  ok(await page.$eval('.snote-text', (t) => t.value) === '', 'Undo: the typing is taken back as one step');
  await click('[data-ann="undo"]');
  ok(!(await page.$('.snote')), 'Undo: the note is gone');
  for (let i = 0; i < 5; i++) await click('[data-ann="redo"]');
  N = await notes();
  ok(N.length === 1 && N[0].text === 'base case?' && JSON.stringify(await box('.snote')) === JSON.stringify(b3), 'Redo five times: text, place and size all come back');
  await click('.snote-x');
  ok(!(await page.$('.snote')) && (await notes()).length === 0, '× on the bar deletes the note');
  await click('[data-ann="undo"]');
  ok(await page.$('.snote') && (await notes()).length === 1, 'Undo brings a deleted note back');

  // ── Tree note: the 6 / 4 / 2 tree ──
  await place(330, 40, 'tree');
  ok(await page.evaluate(() => document.activeElement.dataset.path === '0'), 'a tree note starts with one root node, ready to type');
  ok(await page.$('.tree-hint') && !(await page.$('.tnode[data-path="0"] .tnode-del')), 'a one-node tree shows how + and × work; the root has no ×');
  await page.keyboard.type('6');
  await addKid('0'); await page.keyboard.type('4');
  ok(await page.evaluate(() => document.activeElement.dataset.path === '0.0'), '+ adds a branch and moves typing to it');
  await addKid('0'); await page.keyboard.type('2');
  await addKid('0.0'); await page.keyboard.type('2');
  await addKid('0.0'); await page.keyboard.type('2');
  await addKid('0.1'); await page.keyboard.type('1');
  await addKid('0.1'); await page.keyboard.type('1');
  for (const p of ['0.0.0', '0.0.1']) { await addKid(p); await page.keyboard.type('1'); await addKid(p); await page.keyboard.type('1'); }
  await away();
  N = await notes();
  const tree = N.find((n) => n.type === 'tree').tree;
  const show = (t) => (t.kids.length ? `${t.label}(${t.kids.map(show).join(' ')})` : t.label);
  ok(show(tree) === '6(4(2(1 1) 2(1 1)) 2(1 1))', `the tree is saved: ${show(tree)}`);
  ok(await page.$$eval('.snote-tree .tnode', (l) => l.length) === 11 && await page.$$eval('.snote-tree .tree-edges line', (l) => l.length) === 10, 'every branch has an arrow (11 nodes, 10 arrows)');
  const geo = await page.$$eval('.snote-tree .tnode', (l) => Object.fromEntries(l.map((n) => [n.dataset.path, [n.offsetLeft, n.offsetTop]])));
  const mid = (p) => (geo[`${p}.0`][0] + geo[`${p}.1`][0]) / 2;
  ok(['0', '0.0', '0.1', '0.0.0', '0.0.1'].every((p) => Math.abs(geo[p][0] - mid(p)) < 1) && geo['0'][1] < geo['0.0'][1] && geo['0.0'][1] < geo['0.0.0'][1] && geo['0.0.0'][1] < geo['0.0.0.0'][1],
    'tidy layout: each parent is centered over its branches, one row per level');
  const leaves = ['0.0.0.0', '0.0.0.1', '0.0.1.0', '0.0.1.1', '0.1.0', '0.1.1'].map((p) => geo[p][0]);
  ok(leaves.every((x, i) => !i || x > leaves[i - 1]), 'leaves run left to right without overlapping');
  const arrowsOk = await page.$eval('.snote-tree', (n) => [...n.querySelectorAll('.tree-edges line')].every((l) => l.getAttribute('marker-end')));
  ok(arrowsOk, 'each line ends in an arrowhead');
  const tb = await box('.snote-tree');
  const canvas = await page.$eval('.snote-tree .tree-canvas', (c) => [c.offsetWidth, c.offsetHeight]);
  ok(tb.w >= canvas[0] && tb.h >= canvas[1], `the note grew to fit the tree (${tb.w}×${tb.h} for a ${canvas[0]}×${canvas[1]} tree)`);

  // remove a node: everything below goes with it
  await page.hover('.tnode[data-path="0.0"]'); await page.click('.tnode[data-path="0.0"] .tnode-del'); await wait(120);
  N = await notes();
  ok(show(N.find((n) => n.type === 'tree').tree) === '6(2(1 1))' && await page.$$eval('.snote-tree .tree-edges line', (l) => l.length) === 3, '× on the 4 removes it and everything below it; arrows redrawn');
  await click('[data-ann="undo"]');
  ok(show((await notes()).find((n) => n.type === 'tree').tree) === '6(4(2(1 1) 2(1 1)) 2(1 1))', 'Undo puts the whole branch back');

  // ── Anywhere in the work area: the right pane, across the divider, scrolling with its own pane ──
  const panes = await page.$eval('#pane-right', (r) => { const b = r.getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width }; });
  await click('[data-ann="note"]');
  await page.mouse.click(panes.x + 140, panes.y + 120); await wait(120);
  await click('[data-nd="new-text"]');
  await page.keyboard.type('right side'); await away();
  N = await notes();
  const right = N.find((n) => n.text === 'right side');
  ok(right && right.pane === 'right', `a note can be placed on the right side (pane: ${right && right.pane})`);
  const textNote = N.find((n) => n.text === 'base case?');
  ok(textNote.pane === 'left', 'the notes placed on the problem belong to the left side');
  const tsel = `.snote[data-aid="${textNote.id}"]`;
  const tb0 = await box(tsel);
  const dx = Math.round(panes.x + 60 - tb0.x);
  await dragBy(`${tsel} .snote-bar`, dx, 0);
  const tb1 = await box(tsel);
  ok(tb1.x > panes.x && (await notes()).find((n) => n.id === textNote.id).pane === 'right', `dragging a note across the divider moves it to the right side (x ${tb0.x} → ${tb1.x})`);
  // scroll each pane: a note moves only with its own side
  const rsel = `.snote[data-aid="${right.id}"]`;
  const before2 = { r: await box(rsel), t: await box('.snote-tree') };
  await page.$eval('#pane-left', (p) => { p.scrollTop = 120; }); await wait(150);
  const afterL = { r: await box(rsel), t: await box('.snote-tree') };
  ok(afterL.t.y === before2.t.y - 120 && afterL.r.y === before2.r.y, `scrolling the left side moves its notes only (tree ${before2.t.y} → ${afterL.t.y}, right note stays at ${afterL.r.y})`);
  await page.$eval('#pane-left', (p) => { p.scrollTop = 0; }); await wait(150);
  await page.$eval('#pane-right', (p) => { p.style.paddingBottom = '1200px'; p.scrollTop = 80; }); await wait(150);
  const afterR = { r: await box(rsel), t: await box('.snote-tree') };
  ok(afterR.r.y === before2.r.y - 80 && afterR.t.y === before2.t.y, `scrolling the right side moves its notes only (right note ${before2.r.y} → ${afterR.r.y})`);
  await page.$eval('#pane-right', (p) => { p.scrollTop = 0; p.style.paddingBottom = ''; }); await wait(150);
  const barZ = await page.evaluate(() => { const b = document.querySelector('#annot-bar [data-ann="note"]').getBoundingClientRect(); return document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2).closest('[data-ann]') !== null; });
  ok(barZ, 'notes never cover the annotation toolbar');
  await click('[data-ann="undo"]'); await click('[data-ann="undo"]'); await click('[data-ann="undo"]'); // the drag, the right note's text, the right note
  ok((await notes()).length === 2 && (await notes()).find((n) => n.id === textNote.id).pane === 'left', 'Undo takes the note back across the divider and removes the right-side note');

  // ── Notes belong to their question and survive a refresh ──
  await page.keyboard.press('ArrowRight'); await wait(300);
  ok((await st()).session.index === 1 && !(await page.$('.snote')), 'the next question has no notes');
  await page.keyboard.press('ArrowLeft'); await wait(300);
  ok(await page.$$eval('.snote', (l) => l.length) === 2, 'back on Q3: both notes are there');
  const before = await box('.snote-tree');
  await page.reload(); await wait(200);
  await click('[data-action="enter"]'); await click('[data-action="resume"]');
  await page.waitForSelector('.snote-tree');
  ok(JSON.stringify(await box('.snote-tree')) === JSON.stringify(before) && await page.$eval('.tnode-input[data-path="0"]', (i) => i.value) === '6', 'after a refresh the notes are back in the same place');
  ok(await page.$eval('.annot-layer path', (p) => p.getAttribute('d')) === strokeBefore, 'and the pen stroke is where it was');

  // ── Clear all ──
  await click('[data-ann="clear"]');
  ok(!(await page.$('.snote')) && (await st()).session.annotations['fa25-3'].length === 0, 'Clear all removes the notes along with the other marks');
  await click('[data-ann="undo"]');
  ok(await page.$$eval('.snote', (l) => l.length) === 2, 'Undo brings them all back');

  // ── Phone width ──
  await page.setViewport({ width: 390, height: 800 }); await wait(300);
  ok(await page.$$eval('.snote', (l) => l.every((n) => n.getBoundingClientRect().width > 0)), 'notes still show at phone width');

  // ── Drawing, erasing and highlighting on notes ──
  const inkNotes = [
    { id: 'n1', kind: 'note', type: 'text', pane: 'left', x: 60, y: 300, w: 240, h: 150, text: 'base case: whole is a leaf\nthen recurse on branches' },
    { id: 'n2', kind: 'note', type: 'tree', pane: 'left', x: 340, y: 300, w: 240, h: 200, tree: { label: '6', kids: [{ label: '4', kids: [] }, { label: '2', kids: [] }] } },
  ];
  await page.setViewport({ width: 1400, height: 900 });
  await page.evaluate((k, v) => { localStorage.setItem(k, v); Storage.prototype.setItem = function () {}; }, KEY, JSON.stringify({
    prefs: { mode: 'practice', exams: ALL, examsKnown: ALL, topics: [], difficulties: ['easy', 'medium', 'hard'], size: 5, timerOn: false, minutes: 25 },
    session: { ...session, index: 0, annotations: { 'fa25-3': inkNotes } } }));
  await page.goto(APP_URL); await wait(150);
  await click('[data-action="enter"]'); await click('[data-action="resume"]');
  await page.waitForSelector('.snote[data-aid="n1"] .snote-text');
  const noteOf = async (id) => (await notes()).find((n) => n.id === id);
  const body1 = () => page.$eval('.snote[data-aid="n1"] .snote-body', (e) => { const r = e.getBoundingClientRect(); return [r.left, r.top]; });

  // red pen on a note
  await click('[data-ann="pen"]');
  let bp = await body1();
  await page.mouse.move(bp[0] + 20, bp[1] + 70); await page.mouse.down();
  for (let i = 1; i <= 8; i++) { await page.mouse.move(bp[0] + 20 + i * 15, bp[1] + 70 + (i % 2) * 8); await wait(12); }
  await page.mouse.up(); await wait(150);
  ok(((await noteOf('n1')).ink || []).length === 1 && await page.$$eval('.snote[data-aid="n1"] .snote-ink path', (l) => l.length) === 1, 'the red pen draws on a note, and the stroke is saved with it');
  ok(await page.$eval('.annot-layer', (s) => s.querySelectorAll('path').length) === 0, 'the stroke isn’t on the problem underneath');
  await page.mouse.click(bp[0] + 100, bp[1] + 20); await wait(100);
  ok(!(await page.evaluate(() => document.activeElement.classList.contains('snote-text'))), 'with the pen on, clicking a note doesn’t start typing');
  ok(((await noteOf('n1')).ink || []).length === 2, 'a click with the pen leaves a dot, as on the problem');
  await click('[data-ann="undo"]');
  ok(((await noteOf('n1')).ink || []).length === 1, 'Undo takes the dot back off the note');
  await click('[data-ann="pen"]');
  await dragBy('.snote[data-aid="n1"] .snote-bar', 40, 30);
  const inside = await page.$eval('.snote[data-aid="n1"]', (n) => { const a = n.getBoundingClientRect(), b = n.querySelector('.snote-ink path').getBoundingClientRect(); return b.left >= a.left && b.right <= a.right && b.top >= a.top && b.bottom <= a.bottom; });
  ok(inside, 'moving the note takes the drawing with it');

  // highlighter on a blank note: blue, stays on its words while typing before it
  await click('[data-ann="hl"]');
  await page.evaluate(() => { const ta = document.querySelector('.snote[data-aid="n1"] .snote-text'); ta.focus(); ta.setSelectionRange(11, 26); ta.dispatchEvent(new MouseEvent('mouseup', { bubbles: true })); });
  await wait(150);
  ok(JSON.stringify((await noteOf('n1')).hls) === '[[11,26]]' && await page.$eval('.snote[data-aid="n1"] .snote-mirror mark', (m) => m.textContent) === 'whole is a leaf', 'selecting text in a note with the highlighter highlights it');
  ok(await page.$eval('.snote-mirror mark', (m) => getComputedStyle(m).backgroundColor) === 'rgb(166, 220, 255)', 'note highlights are light blue, not the note’s yellow');
  await page.evaluate(() => { const ta = document.querySelector('.snote[data-aid="n1"] .snote-text'); ta.focus(); ta.setSelectionRange(0, 0); });
  await page.keyboard.type('IDEA: ');
  await away();
  ok(JSON.stringify((await noteOf('n1')).hls) === '[[17,32]]' && await page.$eval('.snote[data-aid="n1"] .snote-mirror mark', (m) => m.textContent) === 'whole is a leaf', 'typing before it: the highlight stays on the same words');
  const markBox = await page.$eval('.snote[data-aid="n1"] .snote-mirror mark', (m) => { const r = m.getBoundingClientRect(); return [r.left, r.top]; });
  const textBox = await page.evaluate(() => { const ta = document.querySelector('.snote[data-aid="n1"] .snote-text'); const r = ta.getBoundingClientRect(); return [r.left, r.top]; });
  ok(markBox[1] - textBox[1] < 12, 'the blue mark lines up with the first line of text');

  // highlighter on a tree node: click on, click off
  await click('.snote[data-aid="n2"] .tnode-input[data-path="0.0"]'); await wait(150);
  ok((await noteOf('n2')).tree.kids[0].hl === true && await page.$eval('.snote[data-aid="n2"] .tnode-input[data-path="0.0"]', (i) => getComputedStyle(i).backgroundColor) === 'rgb(166, 220, 255)', 'clicking a tree node with the highlighter highlights it in blue');
  await click('.snote[data-aid="n2"] .tnode-input[data-path="0.0"]'); await wait(150);
  ok(!(await noteOf('n2')).tree.kids[0].hl, 'clicking it again takes the highlight off');
  await click('.snote[data-aid="n2"] .tnode-input[data-path="0.0"]'); await wait(150);
  await click('[data-ann="hl"]');

  // eraser: strokes, highlighted words, highlighted nodes; one undo step per drag
  await click('[data-ann="eraser"]');
  const stroke = await page.$eval('.snote[data-aid="n1"] .snote-ink path', (p) => { const r = p.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
  await page.mouse.move(stroke[0] - 30, stroke[1]); await page.mouse.down();
  for (let i = 0; i <= 6; i++) { await page.mouse.move(stroke[0] - 30 + i * 10, stroke[1] + (i % 2 ? 4 : -4)); await wait(12); }
  await page.mouse.up(); await wait(150);
  ok(!(await noteOf('n1')).ink && await page.$$eval('.snote[data-aid="n1"] .snote-ink path', (l) => l.length) === 0, 'the eraser removes a stroke on a note');
  const mk = await page.$eval('.snote[data-aid="n1"] .snote-mirror mark', (m) => { const r = m.getBoundingClientRect(); return [r.left + 10, r.top + r.height / 2]; });
  await page.mouse.click(mk[0], mk[1]); await wait(150);
  ok(!(await noteOf('n1')).hls && !(await page.$('.snote[data-aid="n1"] .snote-mirror mark')), 'it removes highlighted words (the words stay)');
  ok((await noteOf('n1')).text.startsWith('IDEA: base case'), 'the text itself is untouched');
  const nd = await page.$eval('.snote[data-aid="n2"] .tnode-input[data-path="0.0"]', (i) => { const r = i.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
  await page.mouse.click(nd[0], nd[1]); await wait(150);
  ok(!(await noteOf('n2')).tree.kids[0].hl, 'and highlighted tree nodes');
  await click('[data-ann="eraser"]');
  await click('[data-ann="undo"]'); await click('[data-ann="undo"]'); await click('[data-ann="undo"]');
  ok(((await noteOf('n1')).ink || []).length === 1 && JSON.stringify((await noteOf('n1')).hls) === '[[17,32]]' && (await noteOf('n2')).tree.kids[0].hl === true, 'Undo three times: the stroke, the highlight and the node highlight come back');
  await page.reload(); await wait(200);
  await click('[data-action="enter"]'); await click('[data-action="resume"]');
  await page.waitForSelector('.snote[data-aid="n1"] .snote-ink path');
  ok(await page.$eval('.snote[data-aid="n1"] .snote-mirror mark', (m) => m.textContent) === 'whole is a leaf' && await page.$eval('.snote[data-aid="n2"] .tnode-input[data-path="0.0"]', (i) => i.classList.contains('hl')),
    'after a refresh: drawings and highlights on notes are all there');

  // ── In an exam, then in its review ──
  await page.setViewport({ width: 1400, height: 900 });
  await page.evaluate((k, v) => { localStorage.setItem(k, v); Storage.prototype.setItem = function () {}; }, KEY, JSON.stringify({
    prefs: { mode: 'exam', exams: ALL, examsKnown: ALL, topics: [], difficulties: ['easy', 'medium', 'hard'], size: 5, timerOn: false, minutes: 25 },
    examPrefs: { kind: 'custom', examId: 'fa25', topics: [], picked: ['fa25-3'], timerOn: false, minutes: 120 } }));
  await page.goto(APP_URL); await wait(150);
  await click('[data-action="enter"]'); await click('[data-action="start-exam"]');
  await page.waitForSelector('#pane-right .part');
  await place(200, 120, 'text');
  await page.keyboard.type('try p == len');
  await away();
  ok(((await st()).exam.annotations['fa25-3'] || []).some((n) => n.kind === 'note' && n.text === 'try p == len'), 'notes work during an exam and are saved with it');
  await click('.p-footer [data-action="submit-exam"]');
  await wait(300);
  if (await page.$('[data-action="confirm-submit"]')) await click('[data-action="confirm-submit"]');
  await page.waitForSelector('.exam-results');
  await page.$eval('.rq-group details, details.rq-group', (d) => { d.open = true; }).catch(() => {});
  await click('[data-action="exam-review"][data-q="fa25-3a"]');
  await page.waitForSelector('#note-layer .snote');
  await wait(200);
  ok(await page.$eval('.snote-text', (t) => t.value).catch(() => null) === 'try p == len', 'the review of that exam shows the note made during it');

  ok(errors.length === 0, `no page errors${errors.length ? ': ' + errors.join(' | ') : ''}`);
  await browser.close();
  console.log(fails ? `\n${fails} FAILED` : '\nall passed');
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });

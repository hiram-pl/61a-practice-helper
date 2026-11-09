// Sticky notes in the annotation toolbar: one click on the note button makes a note in the middle of the page, ready to type; each note has its own toolbar (type
// and move, highlighter, red pen, eraser, tree, undo / redo, delete selected, clear). Text boxes and trees can be
// dragged inside a note but never overlap (a drop slides to the nearest free spot, growth pushes things down);
// drawings move with the text box or tree they are drawn on; resizing only adds space; notes can sit on either side
// and scroll with it; minimizing pulls a note into a numbered icon in the bottom bar (between Exit and the question button) and the icon brings it
// back. Also: main undo / redo / Clear all, notes kept per question and across a refresh, notes saved by the earlier
// version still open, typing in a note never changes the question, and saved pen strokes stay where they were.
const puppeteer = require('puppeteer-core');
const { APP_URL, CHROME, skipTour } = require('./config');
const KEY = 'cs61a-practice:v1';
let fails = 0;
const ok = (c, m) => { console.log(`${c ? 'PASS' : 'FAIL'}  ${m}`); if (!c) fails++; };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const ALL = ['fa25', 'sp25', 'fa24', 'sp24', 'fa23', 'sp23', 'fa22', 'fa21'];
const PREFS = { mode: 'practice', exams: ALL, examsKnown: ALL, topics: [], difficulties: ['easy', 'medium', 'hard'], size: 5, timerOn: false, minutes: 25 };

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
  const noteOf = async (id) => (await notes()).find((n) => n.id === id);
  const click = async (sel) => { await page.waitForSelector(sel, { visible: true, timeout: 8000 }); await page.click(sel); await wait(80); };
  const art = () => page.$eval('#problem-article', (a) => { const r = a.getBoundingClientRect(); return { x: r.left, y: r.top }; });
  const place = async () => { await click('[data-ann="note"]'); await wait(150); }; // one click: the note appears in the middle
  const away = async () => { await page.mouse.click(8, 890); await wait(120); }; // somewhere neutral, so the field loses focus
  const addKid = async (n, path) => { await page.hover(`${n} .tnode[data-path="${path}"]`); await page.click(`${n} .tnode[data-path="${path}"] .tnode-add`); await wait(80); };
  const box = (sel) => page.$eval(sel, (e) => { const b = e.getBoundingClientRect(); return { x: Math.round(b.left), y: Math.round(b.top), w: Math.round(b.width), h: Math.round(b.height) }; });
  const dragFrom = async ([x, y], dx, dy) => {
    await page.mouse.move(x, y); await page.mouse.down();
    for (let i = 1; i <= 6; i++) { await page.mouse.move(x + dx * i / 6, y + dy * i / 6); await wait(16); }
    await page.mouse.up(); await wait(200);
  };
  const dragBy = async (sel, dx, dy) => {
    const r = await page.$eval(sel, (e) => { const b = e.getBoundingClientRect(); return [b.left + Math.min(30, b.width / 2), b.top + b.height / 2]; });
    await dragFrom(r, dx, dy);
  };
  const tool = (n, k) => click(`${n} [data-nt="${k}"]`);
  const pressed = (n, k) => page.$eval(`${n} [data-nt="${k}"]`, (b) => b.getAttribute('aria-pressed'));
  const disabled = (n, k) => page.$eval(`${n} [data-nt="${k}"]`, (b) => b.disabled);
  const overlap = (p, q) => p.x < q.x + q.w && q.x < p.x + p.w && p.y < q.y + q.h && q.y < p.y + p.h;
  const bodyAt = async (n, x, y) => { const b = await box(`${n} .snote-body`); return [b.x + x, b.y + y]; };
  const show = (t) => (t.kids.length ? `${t.label}(${t.kids.map(show).join(' ')})` : t.label);
  const seed = async (session, extra) => {
    await page.evaluate((k, v) => { localStorage.setItem(k, v); Storage.prototype.setItem = function () {}; }, KEY, JSON.stringify(Object.assign({ prefs: PREFS, session }, extra || {})));
    await page.goto(APP_URL); await wait(150);
    await click('[data-action="enter"]'); await click('[data-action="resume"]');
    await page.waitForSelector('#pane-right .part');
  };

  // A practice set with Fall 2025 Q3 (code with blanks) and Q4.
  const ids = ['fa25-3a', 'fa25-3b', 'fa25-3c', 'fa25-4a', 'fa25-4b'];
  const session = { ids, groups: [{ pid: 'fa25-3', ids: ids.slice(0, 3) }, { pid: 'fa25-4', ids: ids.slice(3) }], index: 0, title: 'Notes test', answers: {}, checked: {}, revealed: {}, selfGrade: {}, marked: {}, eliminated: {}, notes: {}, annotations: {}, timer: null, startedAt: 1, finishedAt: null, finished: false };
  await page.goto(APP_URL);
  await seed(session);

  // ── Toolbar ──
  const order = await page.$$eval('#annot-bar [data-ann]', (bs) => bs.map((b) => b.dataset.ann));
  ok(order.slice(0, 4).join() === 'hl,pen,eraser,note', `sticky note tool sits after the eraser (${order.join(', ')})`);
  ok(await page.$eval('[data-ann="note"]', (b) => !b.hasAttribute('aria-pressed') && b.title === 'New sticky note'), 'the note button is a plain button (“New sticky note”), not a tool that stays on');

  // ── Pen stroke first, to check notes don't move saved strokes ──
  await click('[data-ann="pen"]');
  const a0 = await art();
  await page.mouse.move(a0.x + 60, a0.y + 300); await page.mouse.down(); await page.mouse.move(a0.x + 140, a0.y + 320); await page.mouse.up(); await wait(150);
  await click('[data-ann="pen"]');
  const strokeBefore = await page.$eval('.annot-layer path', (p) => p.getAttribute('d'));

  // ── One click makes a note in the middle of the page, ready to type ──
  await place();
  ok(!(await page.$('.note-pick')) && await page.$$eval('.snote', (l) => l.length) === 1, 'one click on the note button makes a note (no second click on the page, no chooser)');
  const mid0 = await page.evaluate(() => { const l = document.getElementById('note-layer').getBoundingClientRect(), n = document.querySelector('.snote').getBoundingClientRect(); return [n.left + n.width / 2 - (l.left + l.width / 2), n.top + n.height / 2 - (l.top + l.height / 2)]; });
  ok(Math.abs(mid0[0]) < 3 && Math.abs(mid0[1]) < 3, `it appears in the middle of the page (${mid0.map(Math.round).join(', ')} px off center)`);
  ok(await page.evaluate(() => document.activeElement.classList.contains('snote-text')), 'the new note is ready to type');
  ok(await page.$eval('.snote .snote-title', (t) => t.textContent) === 'Note 1', 'the note is numbered: Note 1');
  await page.keyboard.type('base case?');
  await page.keyboard.press('ArrowRight');
  ok((await st()).session.index === 0, 'arrow keys inside a note move the cursor, not the question');
  await away();
  let N = await notes();
  const id1 = N[0].id;
  const n1 = `.snote[data-aid="${id1}"]`;
  ok(N.length === 1 && N[0].items.length === 1 && N[0].items[0].type === 'text' && N[0].items[0].text === 'base case?', `the note and its text are saved (${JSON.stringify(N.map((n) => n.items))})`);
  ok(await page.$eval('.annot-layer path', (p) => p.getAttribute('d')) === strokeBefore, 'the pen stroke drawn earlier hasn’t moved');

  // ── The note's own toolbar ──
  const nt = await page.$$eval(`${n1} [data-nt]`, (bs) => bs.map((b) => b.dataset.nt));
  ok(nt.join() === 'select,hl,pen,eraser,tree,undo,redo,del,clear', `each note has its own toolbar (${nt.join(', ')})`);
  ok(await pressed(n1, 'select') === 'true' && await disabled(n1, 'redo') && !(await disabled(n1, 'undo')), 'Type and move is on to start; the note’s Undo is on and Redo is off');
  ok(await page.$eval(`${n1} .nitem-text`, (e) => e.classList.contains('sel')) && !(await disabled(n1, 'del')), 'the text box just typed in is selected, so Delete selected is on');

  // ── Move and resize; resizing never moves what is inside ──
  const b0 = await box(n1);
  await dragBy(`${n1} .snote-bar`, -300, -200);
  const b1 = await box(n1);
  ok(b1.x - b0.x === -300 && b1.y - b0.y === -200, `dragging the top bar moves the note (${b1.x - b0.x}, ${b1.y - b0.y})`);
  const t0 = await box(`${n1} .nitem-text`);
  await dragBy(`${n1} .snote-size`, 70, 40);
  const b2 = await box(n1);
  const t1 = await box(`${n1} .nitem-text`);
  ok(b2.w === b1.w + 70 && b2.h === b1.h + 40 && b2.x === b1.x, `dragging the corner resizes it (${b2.w}×${b2.h})`);
  ok(t1.x === t0.x && t1.y === t0.y, 'resizing only adds space: the text stays where it was');
  await dragBy(`${n1} .snote-size`, -400, -400);
  const b3 = await box(n1);
  const t3 = await box(`${n1} .nitem-text`);
  ok(b3.h === 110 && b3.w >= 228 && t3.x + t3.w <= b3.x + b3.w, `it can't shrink below 228×110, or past what is in it (${b3.w}×${b3.h}, text box still inside)`);
  N = await notes();
  ok(N[0].w === b3.w && N[0].h === b3.h, 'the size is saved');

  // main undo / redo walk back through resize, resize, move, the text and the note
  await click('[data-ann="undo"]'); await click('[data-ann="undo"]');
  ok(JSON.stringify(await box(n1)) === JSON.stringify(b1), 'Undo twice: back to the size before resizing');
  await click('[data-ann="undo"]');
  ok(JSON.stringify(await box(n1)) === JSON.stringify(b0), 'Undo: back to where it was placed');
  await click('[data-ann="undo"]');
  ok(!(await page.$(`${n1} .nitem`)) && await page.$(`${n1} .snote-empty`), 'Undo: the typing is taken back as one step (the note is empty)');
  await click('[data-ann="undo"]');
  ok(!(await page.$('.snote')), 'Undo: the note is gone');
  for (let i = 0; i < 5; i++) await click('[data-ann="redo"]');
  N = await notes();
  ok(N.length === 1 && N[0].items[0].text === 'base case?' && JSON.stringify(await box(n1)) === JSON.stringify(b3), 'Redo five times: text, place and size all come back');
  await click(`${n1} .snote-x`);
  ok(!(await page.$('.snote')) && (await notes()).length === 0, '× on the bar deletes the note');
  await click('[data-ann="undo"]');
  ok(await page.$('.snote') && (await notes()).length === 1, 'Undo brings a deleted note back');
  await dragBy(`${n1} .snote-size`, 140, 120); // room to work in

  // ── Clicking empty space starts another text box; one left empty goes away ──
  let p = await bodyAt(n1, 30, 150);
  await page.mouse.click(p[0], p[1]); await wait(150);
  ok(await page.evaluate(() => document.activeElement.classList.contains('snote-text')) && await page.$$eval(`${n1} .nitem-text`, (l) => l.length) === 2,
    'clicking empty space in a note starts a new text box there');
  await away();
  ok(await page.$$eval(`${n1} .nitem-text`, (l) => l.length) === 1 && (await noteOf(id1)).items.length === 1, 'a text box left empty goes away when it loses focus');

  // ── A text box is as wide as its text ──
  const short = await box(`${n1} .nitem-text`);
  ok(short.w < 120, `a short text box is only as wide as its text (${short.w}px for “base case?”)`);

  // ── Tree tool ──
  await tool(n1, 'tree');
  ok(await pressed(n1, 'tree') === 'true', 'the tree tool is pressed');
  p = await bodyAt(n1, 40, 110);
  await page.mouse.click(p[0], p[1]); await wait(150);
  ok(await page.evaluate(() => document.activeElement.dataset.path === '0') && await pressed(n1, 'select') === 'true',
    'a click with the tree tool places a tree with one root, ready to type; the tool goes back to Type and move');
  ok(!(await page.$(`${n1} .tnode[data-path="0"] .tnode-del`)), 'the root has no ×');
  await page.keyboard.type('6');
  await addKid(n1, '0'); await page.keyboard.type('4');
  ok(await page.evaluate(() => document.activeElement.dataset.path === '0.0'), '+ adds a branch and moves typing to it');
  await addKid(n1, '0'); await page.keyboard.type('2');
  await addKid(n1, '0.0'); await page.keyboard.type('2');
  await addKid(n1, '0.0'); await page.keyboard.type('2');
  await addKid(n1, '0.1'); await page.keyboard.type('1');
  await addKid(n1, '0.1'); await page.keyboard.type('1');
  for (const q of ['0.0.0', '0.0.1']) { await addKid(n1, q); await page.keyboard.type('1'); await addKid(n1, q); await page.keyboard.type('1'); }
  await away();
  N = await notes();
  const treeItem = () => N[0].items.find((i) => i.type === 'tree');
  ok(show(treeItem().tree) === '6(4(2(1 1) 2(1 1)) 2(1 1))', `the tree is saved: ${show(treeItem().tree)}`);
  ok(await page.$$eval(`${n1} .tnode`, (l) => l.length) === 11 && await page.$$eval(`${n1} .tree-edges line`, (l) => l.length) === 10, 'every branch has an arrow (11 nodes, 10 arrows)');
  const geo = await page.$$eval(`${n1} .tnode`, (l) => Object.fromEntries(l.map((n) => [n.dataset.path, [n.offsetLeft, n.offsetTop]])));
  const mid = (q) => (geo[`${q}.0`][0] + geo[`${q}.1`][0]) / 2;
  ok(['0', '0.0', '0.1', '0.0.0', '0.0.1'].every((q) => Math.abs(geo[q][0] - mid(q)) < 1) && geo['0'][1] < geo['0.0'][1] && geo['0.0'][1] < geo['0.0.0'][1] && geo['0.0.0'][1] < geo['0.0.0.0'][1],
    'tidy layout: each parent is centered over its branches, one row per level');
  const leaves = ['0.0.0.0', '0.0.0.1', '0.0.1.0', '0.0.1.1', '0.1.0', '0.1.1'].map((q) => geo[q][0]);
  ok(leaves.every((x, i) => !i || x > leaves[i - 1]), 'leaves run left to right without overlapping');
  ok(await page.$eval(n1, (n) => [...n.querySelectorAll('.tree-edges line')].every((l) => l.getAttribute('marker-end'))), 'each line ends in an arrowhead');
  const nb = await box(n1);
  const tc = await box(`${n1} .tree-canvas`);
  ok(tc.x + tc.w <= nb.x + nb.w && tc.y + tc.h <= nb.y + nb.h, `the note grew to show the whole tree (${nb.w}×${nb.h})`);
  let tx = await box(`${n1} .nitem-text`);
  let tr = await box(`${n1} .nitem-tree`);
  ok(!overlap(tx, tr), 'the text and the tree don’t overlap');

  // remove a node: everything below goes with it; the note's own undo / redo
  await page.hover(`${n1} .tnode[data-path="0.0"]`); await page.click(`${n1} .tnode[data-path="0.0"] .tnode-del`); await wait(120);
  N = await notes();
  ok(show(treeItem().tree) === '6(2(1 1))' && await page.$$eval(`${n1} .tree-edges line`, (l) => l.length) === 3, '× on the 4 removes it and everything below it; arrows redrawn');
  await tool(n1, 'undo');
  N = await notes();
  ok(show(treeItem().tree) === '6(4(2(1 1) 2(1 1)) 2(1 1))', 'the note’s own Undo puts the whole branch back');
  await tool(n1, 'redo');
  N = await notes();
  ok(show(treeItem().tree) === '6(2(1 1))', 'and its Redo removes it again');
  await tool(n1, 'undo');

  // ── Text and trees never overlap ──
  tr = await box(`${n1} .nitem-tree`);
  tx = await box(`${n1} .nitem-text`);
  await page.hover(`${n1} .nitem-tree`);
  const grip = await box(`${n1} .nitem-tree .nitem-grip`);
  await page.mouse.move(grip.x + 8, grip.y + 4); await page.mouse.down();
  for (let i = 1; i <= 6; i++) { await page.mouse.move(grip.x + 8 + (tx.x - tr.x + 20) * i / 6, grip.y + 4 + (tx.y - tr.y + 4) * i / 6); await wait(16); }
  ok(await page.$eval(`${n1} .nitem-tree`, (e) => e.classList.contains('clash')), 'dragging the tree over the text outlines it in red');
  await page.mouse.up(); await wait(250);
  tr = await box(`${n1} .nitem-tree`);
  tx = await box(`${n1} .nitem-text`);
  ok(!overlap(tx, tr) && !(await page.$(`${n1} .nitem.clash`)), `dropped on the text, the tree slides to the nearest free spot (tree at ${tr.x - tx.x}, ${tr.y - tx.y} from the text)`);
  await tool(n1, 'undo');
  // a tree beside the text: the text wraps before reaching it
  await tool(n1, 'tree');
  tx = await box(`${n1} .nitem-text`);
  await page.mouse.click(tx.x + tx.w + 40, tx.y + 30); await wait(150);
  await page.keyboard.type('9'); await away();
  const side = await page.$$eval(`${n1} .nitem-tree`, (l) => l.map((e) => { const q = e.getBoundingClientRect(); return { x: q.left, y: q.top }; }));
  const besideTree = side.find((q) => q.x > tx.x + tx.w && q.y < tx.y + tx.h);
  ok(!!besideTree, 'a tree can go right beside a short text box');
  await page.focus(`${n1} .snote-text`);
  await page.keyboard.press('End');
  await page.keyboard.type(' then combine what the branches return, and check the leaves one at a time before returning');
  const wrapped = await box(`${n1} .nitem-text`);
  ok(besideTree && wrapped.x + wrapped.w < besideTree.x && wrapped.h > tx.h, `typing more: the text box grows, then wraps before the tree beside it (${wrapped.w}×${wrapped.h})`);
  await away();
  await tool(n1, 'undo'); await tool(n1, 'undo'); await tool(n1, 'undo'); // the typing, the label 9, the tree
  ok((await noteOf(id1)).items.length === 2 && (await noteOf(id1)).items[0].text === 'base case?', 'the note’s Undo takes back the typing, then the second tree');
  // typing more lines pushes the tree down
  const trBefore = await box(`${n1} .nitem-tree`);
  await page.focus(`${n1} .snote-text`);
  await page.keyboard.press('End');
  for (let i = 0; i < 5; i++) { await page.keyboard.press('Enter'); await page.keyboard.type(`line ${i}`); }
  await away();
  tr = await box(`${n1} .nitem-tree`);
  tx = await box(`${n1} .nitem-text`);
  ok(!overlap(tx, tr) && tr.y >= trBefore.y, `a taller text box pushes the tree down instead of covering it (tree ${trBefore.y} → ${tr.y})`);
  const nb2 = await box(n1);
  ok(tr.y + tr.h <= nb2.y + nb2.h, 'and the note grows to keep the tree in view');
  await tool(n1, 'undo');
  ok((await noteOf(id1)).items.find((i) => i.type === 'text').text === 'base case?', 'Undo takes the extra lines back');

  // ── Drawings move with what they are drawn on ──
  await tool(n1, 'pen');
  tr = await box(`${n1} .nitem-tree`);
  await dragFrom([tr.x + 4, tr.y + tr.h - 8], 30, -6); // on the tree, away from its nodes
  const nb3 = await box(n1);
  await dragFrom([nb3.x + nb3.w - 20, nb3.y + nb3.h - 20], -12, 0); // empty space
  N = await notes();
  ok(N[0].ink && N[0].ink.length === 2 && N[0].ink[0].item === treeItem().id && !N[0].ink[1].item, 'a stroke drawn on the tree belongs to it; one on empty space belongs to the note');
  ok(await page.$eval('.annot-layer', (s) => s.querySelectorAll('path').length) === 1, 'the strokes aren’t on the problem underneath');
  await tool(n1, 'select');
  const inkBox = () => page.$$eval(`${n1} .snote-ink path`, (l) => l.map((e) => { const r = e.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top)]; }));
  const ink0 = await inkBox();
  tr = await box(`${n1} .nitem-tree`);
  await page.hover(`${n1} .nitem-tree`);
  const g2 = await box(`${n1} .nitem-tree .nitem-grip`);
  await dragFrom([g2.x + 8, g2.y + 4], 60, 20);
  const tr2 = await box(`${n1} .nitem-tree`);
  const ink1 = await inkBox();
  ok(ink1[0][0] - ink0[0][0] === tr2.x - tr.x && ink1[0][1] - ink0[0][1] === tr2.y - tr.y && tr2.x !== tr.x, `dragging the tree takes its drawing with it (moved ${tr2.x - tr.x}, ${tr2.y - tr.y})`);
  ok(ink1[1][0] === ink0[1][0] && ink1[1][1] === ink0[1][1], 'the stroke on empty space stays put');
  const before3 = { ink: await inkBox(), tree: await box(`${n1} .nitem-tree`), text: await box(`${n1} .nitem-text`) };
  await dragBy(`${n1} .snote-size`, 90, 50);
  const after3 = { ink: await inkBox(), tree: await box(`${n1} .nitem-tree`), text: await box(`${n1} .nitem-text`) };
  ok(JSON.stringify(before3) === JSON.stringify(after3), 'resizing the note moves nothing inside it: text, tree and drawings stay together');
  await dragBy(`${n1} .snote-bar`, 30, 20);
  const inside = await page.$eval(n1, (n) => { const a = n.getBoundingClientRect(); return [...n.querySelectorAll('.snote-ink path')].every((pth) => { const b = pth.getBoundingClientRect(); return b.left >= a.left && b.right <= a.right && b.top >= a.top && b.bottom <= a.bottom; }); });
  ok(inside, 'moving the note takes all its drawings with it');

  // delete selected, clear this note
  await page.click(`${n1} .tree-canvas`, { offset: { x: 3, y: 3 } }); await wait(100);
  ok(await page.$eval(`${n1} .nitem-tree`, (e) => e.classList.contains('sel')) && !(await disabled(n1, 'del')), 'clicking the tree selects it, and Delete selected turns on');
  await tool(n1, 'del');
  N = await notes();
  ok(!treeItem() && N[0].ink.length === 1 && !N[0].ink[0].item, 'Delete selected removes the tree and the drawing on it');
  await tool(n1, 'undo');
  N = await notes();
  ok(treeItem() && N[0].ink.length === 2, 'the note’s Undo brings both back');
  await tool(n1, 'clear');
  ok((await noteOf(id1)).items.length === 0 && !(await noteOf(id1)).ink && await page.$(`${n1} .snote-empty`), 'Clear this note (after asking) empties it');
  await tool(n1, 'undo');
  ok((await noteOf(id1)).items.length === 2, 'Undo restores it');

  // ── Anywhere in the work area: the right pane, across the divider, scrolling with its own pane ──
  const panes = await page.$eval('#pane-right', (r) => { const b = r.getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width }; });
  await place();
  await page.keyboard.type('right side'); await away();
  const nr = await box('.snote:last-of-type');
  await dragBy('.snote:last-of-type .snote-bar', Math.round(panes.x + 140 - nr.x), 0);
  N = await notes();
  const right = N.find((n) => n.items.some((i) => i.text === 'right side'));
  ok(right && right.pane === 'right', `a note can be dragged onto the right side (pane: ${right && right.pane})`);
  ok(N.find((n) => n.id === id1).pane === 'left', 'the note placed on the problem belongs to the left side');
  const rsel = `.snote[data-aid="${right.id}"]`;
  ok(await page.$eval(`${rsel} .snote-title`, (t) => t.textContent) === 'Note 2', 'the second note is Note 2');
  const before2 = { r: await box(rsel), t: await box(n1) };
  await page.$eval('#pane-left', (pl) => { pl.scrollTop = 120; }); await wait(150);
  const afterL = { r: await box(rsel), t: await box(n1) };
  ok(afterL.t.y === before2.t.y - 120 && afterL.r.y === before2.r.y, `scrolling the left side moves its notes only (${before2.t.y} → ${afterL.t.y}, right note stays at ${afterL.r.y})`);
  await page.$eval('#pane-left', (pl) => { pl.scrollTop = 0; }); await wait(150);
  await page.$eval('#pane-right', (pr) => { pr.style.paddingBottom = '1200px'; pr.scrollTop = 80; }); await wait(150);
  const afterR = { r: await box(rsel), t: await box(n1) };
  ok(afterR.r.y === before2.r.y - 80 && afterR.t.y === before2.t.y, `scrolling the right side moves its notes only (right note ${before2.r.y} → ${afterR.r.y})`);
  await page.$eval('#pane-right', (pr) => { pr.scrollTop = 0; pr.style.paddingBottom = ''; }); await wait(150);
  const rb0 = await box(rsel);
  await dragBy(`${rsel} .snote-bar`, Math.round(panes.x - 300 - rb0.x), 0);
  ok((await noteOf(right.id)).pane === 'left', 'dragging a note across the divider moves it to the left side');
  await click('[data-ann="undo"]');
  ok((await noteOf(right.id)).pane === 'right', 'Undo takes it back across');
  const barZ = await page.evaluate(() => { const b = document.querySelector('#annot-bar [data-ann="note"]').getBoundingClientRect(); return document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2).closest('[data-ann]') !== null; });
  ok(barZ, 'notes never cover the annotation toolbar');
  // two clicks: the second note steps down and right instead of hiding the first
  await place(); await place();
  const pair = await page.$$eval('.snote', (l) => l.slice(-2).map((n) => [n.offsetLeft, n.offsetTop]));
  ok(pair.length === 2 && pair[1][0] - pair[0][0] === 28 && pair[1][1] - pair[0][1] === 28, `a second new note is offset so it doesn't cover the first (${JSON.stringify(pair)})`);
  await away();
  await click('[data-ann="undo"]'); await click('[data-ann="undo"]');
  ok((await notes()).length === 2, 'Undo twice removes the two new notes');

  // ── Minimize into a numbered icon, and back ──
  const where1 = await box(n1);
  await click(`${n1} [data-nd="min"]`);
  ok(await page.$('.snote-ghost'), 'minimizing plays an animation (the note is pulled toward its icon)');
  await wait(600);
  ok(!(await page.$(n1)) && !(await page.$('.snote-ghost')), 'then the note is gone from the page');
  const dock1 = await page.$eval(`.dock-note[data-aid="${id1}"]`, (d) => ({ title: d.title, num: d.textContent.trim() }));
  ok(dock1.title === '1st note' && dock1.num === '1', `its icon shows its number, and hovering says which note (“${dock1.title}”, ${dock1.num})`);
  const dk = await box(`.dock-note[data-aid="${id1}"]`);
  const exitR = await page.$eval('.p-footer [data-action="home"]', (e) => e.getBoundingClientRect().right);
  const navL = await page.$eval('#nav-toggle', (e) => e.getBoundingClientRect().left);
  ok(await page.$eval(`.dock-note[data-aid="${id1}"]`, (d) => !!d.closest('.p-footer')) && dk.x > exitR && dk.x + dk.w < navL,
    'the icon sits in the bottom bar, between Exit and the question button (off the code)');
  await click(`${rsel} [data-nd="min"]`); await wait(600);
  const titles = await page.$$eval('.dock-note', (l) => l.map((d) => d.title));
  ok(titles.join() === '1st note,2nd note', `each minimized note gets its own icon, in the order the notes were made (${titles.join(', ')})`);
  ok(JSON.stringify(Object.keys((await st()).session.noteMin).sort()) === JSON.stringify([id1, right.id].sort()), 'which notes are minimized is saved');
  await page.reload(); await wait(200);
  await click('[data-action="enter"]'); await click('[data-action="resume"]');
  await page.waitForSelector('.dock-note');
  ok(await page.$$eval('.dock-note', (l) => l.length) === 2 && !(await page.$('.snote')), 'after a refresh they are still minimized');
  await click(`.dock-note[data-aid="${id1}"]`);
  await wait(80);
  const opening = !!(await page.$('.snote-ghost'));
  await wait(600);
  ok(opening && JSON.stringify(await box(n1)) === JSON.stringify(where1), 'clicking the icon brings the note back where it was, with an animation');
  ok(await page.$$eval('.dock-note', (l) => l.map((d) => d.title).join()) === '2nd note', 'its icon is gone; the other stays');
  await click('[data-ann="undo"]');
  ok(await page.$(n1) && await page.$$eval('.dock-note', (l) => l.length) === 1, 'Undo doesn’t open or close notes');
  await click('[data-ann="redo"]');
  await click(`.dock-note[data-aid="${right.id}"]`); await wait(600);

  // ── Notes belong to their question and survive a refresh ──
  await page.keyboard.press('ArrowRight'); await wait(300);
  ok((await st()).session.index === 1 && !(await page.$('.snote')), 'the next question has no notes');
  await page.keyboard.press('ArrowLeft'); await wait(300);
  ok(await page.$$eval('.snote', (l) => l.length) === 2, 'back on Q3: both notes are there');
  const before = { note: await box(n1), tree: await box(`${n1} .nitem-tree`) };
  await page.reload(); await wait(200);
  await click('[data-action="enter"]'); await click('[data-action="resume"]');
  await page.waitForSelector(`${n1} .nitem-tree`);
  ok(JSON.stringify({ note: await box(n1), tree: await box(`${n1} .nitem-tree`) }) === JSON.stringify(before) && await page.$eval(`${n1} .tnode-input[data-path="0"]`, (i) => i.value) === '6',
    'after a refresh the notes and what is in them are back in the same place');
  ok(await page.$eval('.annot-layer path', (pth) => pth.getAttribute('d')) === strokeBefore, 'and the pen stroke on the problem is where it was');

  // ── Clear all ──
  await click('[data-ann="clear"]');
  ok(!(await page.$('.snote')) && (await st()).session.annotations['fa25-3'].length === 0, 'Clear all removes the notes along with the other marks');
  await click('[data-ann="undo"]');
  ok(await page.$$eval('.snote', (l) => l.length) === 2, 'Undo brings them all back');

  // ── Phone width ──
  await page.setViewport({ width: 390, height: 800 }); await wait(300);
  ok(await page.$$eval('.snote', (l) => l.every((n) => n.getBoundingClientRect().width > 0)), 'notes still show at phone width');
  await click(`${n1} [data-nd="min"]`); await wait(600);
  const pdock = await box(`.dock-note[data-aid="${id1}"]`);
  const pfoot = await box('.p-footer');
  ok(pdock.w > 0 && pdock.y + pdock.h <= pfoot.y && pfoot.y - (pdock.y + pdock.h) < 20, 'at phone width (no Exit button) the icon sits just above the bottom bar');
  await click(`.dock-note[data-aid="${id1}"]`); await wait(600);
  await page.setViewport({ width: 1400, height: 900 });

  // ── Highlighting and erasing in a note; notes saved by the earlier version ──
  const oldNotes = [ // the earlier format: one blank note, one tree note
    { id: 'n1', kind: 'note', type: 'text', pane: 'left', x: 60, y: 300, w: 240, h: 150, text: 'base case: whole is a leaf\nthen recurse on branches', ink: [{ id: 'k1', pts: [[20, 90], [60, 96], [100, 90]] }] },
    { id: 'n2', kind: 'note', type: 'tree', pane: 'left', x: 340, y: 300, w: 240, h: 200, tree: { label: '6', kids: [{ label: '4', kids: [] }, { label: '2', kids: [] }] } },
  ];
  await seed({ ...session, index: 0, annotations: { 'fa25-3': oldNotes } });
  await page.waitForSelector('.snote[data-aid="n1"] .snote-text');
  const o1 = '.snote[data-aid="n1"]';
  const o2 = '.snote[data-aid="n2"]';
  ok(await page.$eval(`${o1} .snote-text`, (t) => t.value) === oldNotes[0].text && await page.$$eval(`${o2} .tnode`, (l) => l.length) === 3 && await page.$$eval(`${o1} .snote-ink path`, (l) => l.length) === 1,
    'notes saved by the earlier version open with their text, tree and drawing');

  // highlighter: blue, stays on its words while typing before it
  await tool(o1, 'hl');
  await page.evaluate((sel) => { const ta = document.querySelector(`${sel} .snote-text`); ta.focus(); ta.setSelectionRange(11, 26); ta.dispatchEvent(new MouseEvent('mouseup', { bubbles: true })); }, o1);
  await wait(150);
  const textOf = async (nid) => (await noteOf(nid)).items.find((i) => i.type === 'text');
  ok(JSON.stringify((await textOf('n1')).hls) === '[[11,26]]' && await page.$eval(`${o1} .snote-mirror mark`, (m) => m.textContent) === 'whole is a leaf', 'selecting text with the note’s highlighter highlights it');
  ok(await page.$eval(`${o1} .snote-mirror mark`, (m) => getComputedStyle(m).backgroundColor) === 'rgb(166, 220, 255)', 'note highlights are light blue, not the note’s yellow');
  await page.evaluate((sel) => { const ta = document.querySelector(`${sel} .snote-text`); ta.focus(); ta.setSelectionRange(0, 0); }, o1);
  await page.keyboard.type('IDEA: ');
  await away();
  ok(JSON.stringify((await textOf('n1')).hls) === '[[17,32]]' && await page.$eval(`${o1} .snote-mirror mark`, (m) => m.textContent) === 'whole is a leaf', 'typing before it: the highlight stays on the same words');
  const markBox = await box(`${o1} .snote-mirror mark`);
  const textBox = await box(`${o1} .snote-text`);
  ok(markBox.y - textBox.y < 12, 'the blue mark lines up with the first line of text');
  await tool(o1, 'select');
  const treeOf = async (nid) => (await noteOf(nid)).items.find((i) => i.type === 'tree').tree;
  await tool(o2, 'hl');
  await click(`${o2} .tnode-input[data-path="0.0"]`); await wait(150);
  ok((await treeOf('n2')).kids[0].hl === true && await page.$eval(`${o2} .tnode-input[data-path="0.0"]`, (i) => getComputedStyle(i).backgroundColor) === 'rgb(166, 220, 255)', 'clicking a tree node with the highlighter highlights it in blue');
  await click(`${o2} .tnode-input[data-path="0.0"]`); await wait(150);
  ok(!(await treeOf('n2')).kids[0].hl, 'clicking it again takes the highlight off');
  await click(`${o2} .tnode-input[data-path="0.0"]`); await wait(150);
  await tool(o2, 'hl');
  ok(await pressed(o2, 'select') === 'true', 'clicking the pressed tool again goes back to Type and move');

  // eraser: strokes, highlighted words, highlighted nodes; one undo step per drag
  await tool(o1, 'eraser');
  const stroke = await page.$eval(`${o1} .snote-ink path`, (pth) => { const r = pth.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
  await dragFrom([stroke[0] - 30, stroke[1]], 60, 0);
  ok(!(await noteOf('n1')).ink && await page.$$eval(`${o1} .snote-ink path`, (l) => l.length) === 0, 'the eraser removes a stroke on a note');
  const mk = await box(`${o1} .snote-mirror mark`);
  await page.mouse.click(mk.x + 10, mk.y + mk.h / 2); await wait(150);
  ok(!(await textOf('n1')).hls && !(await page.$(`${o1} .snote-mirror mark`)), 'it removes highlighted words');
  ok((await textOf('n1')).text.startsWith('IDEA: base case'), 'the words themselves stay');
  await tool(o2, 'eraser');
  const nd = await box(`${o2} .tnode-input[data-path="0.0"]`);
  await page.mouse.click(nd.x + nd.w / 2, nd.y + nd.h / 2); await wait(150);
  ok(!(await treeOf('n2')).kids[0].hl, 'and highlighted tree nodes');
  await tool(o1, 'undo'); await tool(o1, 'undo');
  await tool(o2, 'undo');
  ok(((await noteOf('n1')).ink || []).length === 1 && JSON.stringify((await textOf('n1')).hls) === '[[17,32]]' && (await treeOf('n2')).kids[0].hl === true, 'each note’s Undo brings back what was erased in it');
  await page.reload(); await wait(200);
  await click('[data-action="enter"]'); await click('[data-action="resume"]');
  await page.waitForSelector(`${o1} .snote-ink path`);
  ok(await page.$eval(`${o1} .snote-mirror mark`, (m) => m.textContent) === 'whole is a leaf' && await page.$eval(`${o2} .tnode-input[data-path="0.0"]`, (i) => i.classList.contains('hl')),
    'after a refresh: drawings and highlights on notes are all there');

  // ── In an exam, then in its review ──
  await page.evaluate((k, v) => { localStorage.setItem(k, v); Storage.prototype.setItem = function () {}; }, KEY, JSON.stringify({
    prefs: { ...PREFS, mode: 'exam' },
    examPrefs: { kind: 'custom', examId: 'fa25', topics: [], picked: ['fa25-3'], timerOn: false, minutes: 120 } }));
  await page.goto(APP_URL); await wait(150);
  await click('[data-action="enter"]'); await click('[data-action="start-exam"]');
  await page.waitForSelector('#pane-right .part');
  await place();
  await page.keyboard.type('try p == len');
  await away();
  ok(((await st()).exam.annotations['fa25-3'] || []).some((n) => n.kind === 'note' && n.items.some((i) => i.text === 'try p == len')), 'notes work during an exam and are saved with it');
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

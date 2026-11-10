// Checks app/data/in_scope.js against the question bank (no browser needed):  node tests/verify_in_scope.js
//
// A typo in an id doesn't break the app; the question just quietly stays visible. This catches that, and a few other
// easy mistakes, then prints what each exam loses. Exits non-zero on any error.
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const DATA = path.join(__dirname, '..', 'app', 'data');
const sandbox = { window: {} };
vm.createContext(sandbox);
for (const f of ['questions.js', 'in_scope.js']) vm.runInContext(fs.readFileSync(path.join(DATA, f), 'utf8'), sandbox, { filename: f });
const { TOPICS, EXAMS, PROBLEMS, QUESTIONS } = sandbox.window.CS61A_BANK;
const SCOPE = sandbox.window.CS61A_SCOPE;

let failures = 0;
const fail = (msg) => { failures++; console.log(`FAIL ${msg}`); };
const pass = (msg) => console.log(`PASS ${msg}`);

if (!SCOPE) { fail('in_scope.js does not define window.CS61A_SCOPE'); process.exit(1); }
const problems = SCOPE.problems || {};
const questions = SCOPE.questions || {};
const outTopics = new Set(SCOPE.outOfScopeTopics || []);
const QIDS = new Set(QUESTIONS.map((q) => q.id));

// 1. Every id exists (the typo check). Suggest the closest real id when one is missing.
const suggest = (id, pool) => {
  const near = pool.filter((x) => x.toLowerCase().replace(/[^a-z0-9]/g, '') === id.toLowerCase().replace(/[^a-z0-9]/g, '') ||
    x.startsWith(id) || id.startsWith(x));
  return near.length ? ` (did you mean ${near.slice(0, 3).map((x) => `'${x}'`).join(', ')}?)` : '';
};
let before = failures;
Object.keys(problems).forEach((id) => { if (!PROBLEMS[id]) fail(`problems['${id}'] is not a problem in questions.js${suggest(id, Object.keys(PROBLEMS))}`); });
Object.keys(questions).forEach((id) => { if (!QIDS.has(id)) fail(`questions['${id}'] is not a question part in questions.js${suggest(id, [...QIDS])}`); });
[...outTopics].forEach((t) => { if (!TOPICS.some((x) => x.id === t)) fail(`outOfScopeTopics has unknown topic '${t}'`); });
if (failures === before) pass(`all ${Object.keys(problems).length} problem ids, ${Object.keys(questions).length} part ids and ${outTopics.size} topic ids exist`);

// 2. Every entry is well formed.
before = failures;
const checkEntry = (map, id, e) => {
  const where = `${map}['${id}']`;
  if (!e || (e.status !== 'out' && e.status !== 'note')) return fail(`${where}: status must be 'out' or 'note'`);
  if (e.status === 'out' && !e.reason) fail(`${where}: an 'out' entry needs a reason`);
  if (e.status === 'note' && !e.note) fail(`${where}: a 'note' entry needs note text`);
  if (e.source !== 'ed' && e.source !== 'inferred') fail(`${where}: source must be 'ed' or 'inferred'`);
};
Object.entries(problems).forEach(([id, e]) => checkEntry('problems', id, e));
Object.entries(questions).forEach(([id, e]) => checkEntry('questions', id, e));
if (failures === before) pass('every entry has a valid status, a reason or note, and a source');

// The same rule the app uses (app.js inScope).
const listedOut = (q) => (problems[q.problem] && problems[q.problem].status === 'out') || (questions[q.id] && questions[q.id].status === 'out');
const topicOut = (q) => q.topics.length > 0 && q.topics.every((t) => outTopics.has(t));
const inScope = (q) => !listedOut(q) && !topicOut(q);

// 3. Questions hidden only by an out-of-scope topic should still be listed, so the file says why each one is gone.
before = failures;
QUESTIONS.filter((q) => topicOut(q) && !listedOut(q)).forEach((q) => fail(`'${q.id}' is hidden by an out-of-scope topic (${q.topics.join(', ')}) but isn't listed in questions; add it with a reason`));
// ...and a question that touches an out-of-scope topic but stays visible is worth a second look.
const noted = (q) => (questions[q.id] && questions[q.id].status === 'note') || (problems[q.problem] && problems[q.problem].status === 'note');
QUESTIONS.filter((q) => inScope(q) && q.topics.some((t) => outTopics.has(t)) && !noted(q)).forEach((q) => fail(`'${q.id}' is tagged ${q.topics.filter((t) => outTopics.has(t)).join(', ')} (out of scope) but is still shown; mark it 'out' or add a note`));
if (failures === before) pass('every question with an out-of-scope topic is listed');

// 4. A note on something that is hidden would never be seen.
before = failures;
Object.entries(questions).forEach(([id, e]) => {
  const q = QUESTIONS.find((x) => x.id === id);
  if (q && e.status === 'note' && !inScope(q)) fail(`questions['${id}'] has a note but the part is hidden`);
});
Object.entries(problems).forEach(([id, e]) => {
  if (PROBLEMS[id] && e.status === 'note' && !QUESTIONS.some((q) => q.problem === id && inScope(q))) fail(`problems['${id}'] has a note but every part is hidden`);
});
if (failures === before) pass('no note is attached to a hidden question');

// Summary: what each exam loses.
console.log('\nHidden per exam (parts · points):');
Object.values(EXAMS).forEach((ex) => {
  const parts = QUESTIONS.filter((q) => PROBLEMS[q.problem].exam === ex.id);
  const gone = parts.filter((q) => !inScope(q));
  // Same as app.js groupPoints: the parts' sum when all are published, otherwise the problem's printed total.
  const points = (keep) => Object.keys(PROBLEMS).filter((pid) => PROBLEMS[pid].exam === ex.id).reduce((t, pid) => {
    const ps = parts.filter((q) => q.problem === pid && keep(q));
    if (!ps.length) return t;
    return t + (ps.every((q) => typeof q.points === 'number') ? ps.reduce((n, q) => n + q.points, 0) : PROBLEMS[pid].points);
  }, 0);
  console.log(`  ${ex.label.padEnd(22)} ${String(gone.length).padStart(2)} parts · ${points(() => true)} → ${points(inScope)} pts   ${gone.map((q) => q.id).join(', ')}`);
});

console.log(failures ? `\n${failures} problem(s) found` : '\nin_scope.js OK');
process.exit(failures ? 1 : 0);

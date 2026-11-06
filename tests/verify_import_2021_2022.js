// Phase 11A import check: fills every Fall 2022 / Fall 2021 Midterm 2 code blank with its official answer and runs
// the exam's own examples in local Python. This checks the transcription (code, blanks and answer key); it does not
// add Run Code suites. Where an exam example can't run exactly as printed, the case below says why and what is used.
const path = require('path');
const { execFileSync } = require('child_process');

global.window = {};
require(path.join(__dirname, '..', 'app', 'data', 'questions.js'));
const B = window.CS61A_BANK;
const partsOf = (pid) => B.QUESTIONS.filter((q) => q.problem === pid && q.blank);
// The text an official answer puts in its blank. Select-all blanks with several correct options take the one named.
const PICK = { 'fa22-4b-a': 'hydra.label = 2\nhydra.branches = [Tree(1), Tree(1)]', 'fa21-5a-a': 'not t.is_leaf()' };
function officialText(q) {
  if (PICK[q.id]) return PICK[q.id];
  const k = B.ANSWER_KEY[q.id];
  if (q.type === 'single_choice') return q.choices[k.correct];
  if (q.type === 'multi_select') { if (k.correct.length !== 1) throw new Error(`${q.id}: pick an option`); return q.choices[k.correct[0]]; }
  return k.accepted[0];
}
const fill = (pid, over = {}) => B.PROBLEMS[pid].code.split('\n').map((line) => line.replace(/⟦([^⟧]+)⟧/g, (m, name, col) => {
  const q = partsOf(pid).find((x) => x.blank === name);
  return (over[q.id] !== undefined ? over[q.id] : officialText(q)).split('\n').map((l, i) => (i ? ' '.repeat(col) + l : l)).join('\n');
})).join('\n');

const TREE = `class Tree:
    def __init__(self, label, branches=[]):
        for b in branches:
            assert isinstance(b, Tree)
        self.label = label
        self.branches = list(branches)
    def is_leaf(self):
        return not self.branches
    def __repr__(self):
        if self.branches:
            branch_str = ', ' + repr(self.branches)
        else:
            branch_str = ''
        return 'Tree({0}{1})'.format(repr(self.label), branch_str)
`;
const LINK = `class Link:
    empty = ()
    def __init__(self, first, rest=empty):
        assert rest is Link.empty or isinstance(rest, Link)
        self.first = first
        self.rest = rest
    def __repr__(self):
        if self.rest is not Link.empty:
            rest_repr = ', ' + repr(self.rest)
        else:
            rest_repr = ''
        return 'Link(' + repr(self.first) + rest_repr + ')'
    def __str__(self):
        string = '<'
        while self.rest is not Link.empty:
            string += str(self.first) + ' '
            self = self.rest
        return string + str(self.first) + '>'
`;
// Used only by this check: the exam omits has_path ("assume it works").
const HAS_PATH = `def _has_path(self, source, destination):
    seen, todo = set(), [source]
    while todo:
        n = todo.pop()
        if n == destination:
            return True
        if n not in seen:
            seen.add(n)
            todo.extend(self.destinations(n))
    return False
Graph.has_path = _has_path
`;
const LERNA = 'lerna=Tree(6,[Tree(4,[Tree(2,[Tree(1),Tree(1)]),Tree(2,[Tree(1),Tree(1)])]),Tree(2,[Tree(1),Tree(1)])])\n';

// Each job: setup + the filled problem code, then `doctest` (run the docstrings found) and/or `check` lines,
// each `expr  ==>  expected repr` (evaluated in the same namespace).
const jobs = [
  { pid: 'fa22-3a', doctest: true },
  { pid: 'fa22-3b', setup: fill('fa22-3a') + '\n', doctest: true },
  { pid: 'fa22-4a', setup: TREE + LERNA, doctest: true, fixDocstring: [['>>>is_hydra', '>>> is_hydra']],
    note: 'the PDF prints `>>>is_hydra(lerna)` with no space after the prompt; doctest needs one' },
  { pid: 'fa22-4b', setup: TREE + fill('fa22-4a') + '\n',
    note: 'expected trees are printed without spaces and wrapped; compared as trees',
    check: [
      ["(lambda t: [chop_head(t, n) for n in [1, 1, 3, 1, 3]] and repr(t))(Tree(1))", "repr(Tree(6,[Tree(4,[Tree(2,[Tree(1),Tree(1)]),Tree(2,[Tree(1),Tree(1)])]),Tree(2,[Tree(1),Tree(1)])]))"],
      ["(lambda t: [chop_head(t, n) for n in [1, 1, 3, 1, 3, 2]] and repr(t))(Tree(1))", "repr(Tree(7,[Tree(5,[Tree(3,[Tree(1),Tree(2,[Tree(1),Tree(1)])]),Tree(2,[Tree(1),Tree(1)])]),Tree(2,[Tree(1),Tree(1)])]))"],
    ] },
  { pid: 'fa22-5a', note: 'the third example, count_subsets(list(range(1,10000))), is exponential with this implementation and is left out',
    check: [['count_subsets([25, 50, 75, 100, 125, 150])', '2'], ['count_subsets([25, 50, 25, 75])', '3']] },
  { pid: 'fa22-5b-ii', note: 'the faster version reproduces all three examples',
    check: [['count_subsets([25, 50, 75, 100, 125, 150])', '2'], ['count_subsets([25, 50, 25, 75])', '3'], ['count_subsets(list(range(1,10000)))', '444793']] },
  // NEEDS REVIEW: the exam prints g.destinations(0) as [1, 2], but its official answer lists destinations in the order
  // edges were added, and the example adds (0, 2) before (0, 1), so it returns [2, 1]. Checked here as the official
  // answer behaves, plus the same elements as printed.
  { pid: 'fa22-6a', note: 'example session from the question text (has_path omitted by the exam); official answer gives destinations(0) as [2, 1], the exam prints [1, 2]',
    check: [['(lambda g: [g.add_edge(*e) for e in [(0, 2), (2, 0), (0, 1), (1, 4), (4, 2), (5, 4), (5, 5)]] and [g.destinations(0), g.destinations(5), g.destinations(3)])(Graph(6))', '[[2, 1], [4, 5], []]'],
      ['(lambda g: [g.add_edge(*e) for e in [(0, 2), (2, 0), (0, 1), (1, 4), (4, 2), (5, 4), (5, 5)]] and [sorted(g.destinations(0)), g.destinations(5), g.destinations(3)])(Graph(6))', '[[1, 2], [4, 5], []]']] },
  { pid: 'fa22-6b', setup: fill('fa22-6a') + '\n' + HAS_PATH, doctest: true, note: 'uses a has_path written for this check (the exam omits it)' },
  { pid: 'fa22-7', setup: TREE + fill('fa22-6a') + '\n' + LERNA, note: 'no doctest; checked against the pictured example (edges in pre-order)',
    check: [['(lambda g: (g.nodes, sorted(g.edges)))(tree_to_graph(lerna))', '(11, [(0, 1), (0, 8), (1, 2), (1, 5), (2, 3), (2, 4), (5, 6), (5, 7), (8, 9), (8, 10)])']] },
  { pid: 'fa21-2a', doctest: true },
  { pid: 'fa21-2b', doctest: true },
  { pid: 'fa21-3a', doctest: true },
  { pid: 'fa21-3b', doctest: true },
  { pid: 'fa21-3c', setup: fill('fa21-3b') + '\n', doctest: true },
  { pid: 'fa21-4a', doctest: true },
  { pid: 'fa21-4b', doctest: true },
  { pid: 'fa21-4c', note: 'no doctest; same behavior as max_diff, so max_diff’s examples are used',
    check: [['max_diff_fast(range(-7, 4), lambda x: x * x)', '(-7, 0)'], ["max_diff_fast(['what', 'a', 'great', 'film'], len)", "('great', 'a')"]] },
  { pid: 'fa21-5a', setup: TREE, doctest: true },
  { pid: 'fa21-5b', setup: TREE + LINK + fill('fa21-5a') + '\n', doctest: true },
];

const py = String.raw`
import doctest, json, sys, types
out = []
for job in json.load(sys.stdin):
    m = types.ModuleType('exam_' + job['pid'].replace('-', '_'))
    code = job['code']
    for a, b in job.get('fixDocstring', []):
        code = code.replace(a, b)
    try:
        exec(job.get('setup', ''), m.__dict__)
        exec(code, m.__dict__)
    except Exception as e:
        out.append({'pid': job['pid'], 'ok': False, 'detail': 'code raised ' + repr(e)}); continue
    problems = []
    tried = 0
    if job.get('doctest'):
        for name, obj in list(m.__dict__.items()):
            if getattr(obj, '__doc__', None) and '>>>' in (obj.__doc__ or '') and getattr(obj, '__module__', None) == m.__name__:
                for test in doctest.DocTestFinder(recurse=False).find(obj, name, globs=m.__dict__):
                    r = doctest.DocTestRunner(verbose=False)
                    r.run(test, out=lambda s: problems.append(s.strip().splitlines()[-1][:160]))
                    tried += r.tries
    for expr, want in job.get('check', []):
        tried += 1
        try:
            value = eval(expr, m.__dict__)
            # want is either a repr to match, or (starting with repr() an expression whose value must match
            got, exp = (value, eval(want, m.__dict__)) if want.startswith('repr(') else (repr(value), want)
            if got != exp:
                problems.append(f'{expr[:60]} -> {got[:80]} (want {exp[:80]})')
        except Exception as e:
            problems.append(f'{expr[:60]} raised {e!r}')
    out.append({'pid': job['pid'], 'ok': not problems and tried > 0, 'tried': tried, 'detail': '; '.join(problems)[:400]})
print(json.dumps(out))
`;

// Every accepted alternative answer must also pass the same examples.
const alternatives = jobs.flatMap((j) => partsOf(j.pid).filter((q) => q.type === 'short_answer' && B.ANSWER_KEY[q.id].accepted.length > 1)
  .flatMap((q) => B.ANSWER_KEY[q.id].accepted.slice(1).map((alt) => ({ ...j, pid: j.pid, label: `${q.id} = ${alt.replace(/\n/g, ' / ')}`, over: { [q.id]: alt } }))));
const payload = [...jobs, ...alternatives].map((j) => ({ ...j, setup: j.setup || '', code: fill(j.pid, j.over) }));
let failed = 0;
const results = JSON.parse(execFileSync('python3', ['-I', '-c', py], { input: JSON.stringify(payload), encoding: 'utf8', timeout: 120000 }));
results.forEach((r, i) => {
  const j = payload[i];
  if (!r.ok) failed++;
  if (j.label) { if (!r.ok) console.log(`FAIL  alternative ${j.label}: ${r.detail}`); return; }
  console.log(`${r.ok ? 'ok  ' : 'FAIL'}  ${r.pid}: ${r.tried || 0} example(s)${j.note ? ` · ${j.note}` : ''}${r.ok ? '' : ` · ${r.detail}`}`);
});
console.log(`      ${alternatives.length} accepted alternative answers rerun with the same examples`);
const covered = new Set(jobs.map((j) => j.pid));
const runnable = Object.keys(B.PROBLEMS).filter((pid) => /^(fa22|fa21)/.test(pid) && partsOf(pid).length && !['fa22-1', 'fa22-2', 'fa21-1'].includes(pid));
const missing = runnable.filter((pid) => !covered.has(pid));
if (missing.length) { failed++; console.log(`FAIL  not checked: ${missing.join(', ')}`); }
console.log(failed ? `\n${failed} problem(s)` : `\nAll ${jobs.length} Fall 2022 / Fall 2021 code problems run with their official and accepted answers`);
process.exit(failed ? 1 : 0);

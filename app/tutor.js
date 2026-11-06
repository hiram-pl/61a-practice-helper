// The code a problem opens with in Python Tutor: definitions it needs, then the editor's code, then the calls that
// make it run. Calls come from the doctests in the code, or from the prompts on What Would Python Display questions.
// Environment diagram code already makes its own calls, so nothing is added and line numbers still match the prompts.
//
// Composing Programs' Python Tutor runs Python 3.6, so the study guide's @dataclass classes (Python 3.12) can't run
// there. These classes print and behave the way the 2024 and 2025 exams expect, with Link.empty and t.is_leaf().

window.CS61A_TUTOR = (function () {
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
    def __str__(self):
        def format_tree(t, indent):
            string = indent + str(t.label)
            for b in t.branches:
                string += '\\n' + format_tree(b, indent + '  ')
            return string
        return format_tree(self, '')
`;
  // Official solutions of earlier parts, for problems with no verified suite to take them from.
  const EVENT = `class Event:
    def __init__(self, start, end):
        self.start, self.end = start, end

    def __repr__(self):
        return f'Event({self.start}, {self.end})'

    def split(self, k):
        assert (self.end - self.start) % k == 0
        length = (self.end - self.start) // k
        start = self.start
        for i in range(k):
            yield Event(start, start + length)
            start = start + length
`;
  const IS_STRIP = `def is_strip(s):
    assert type(s) == list
    return len(s) == 0 or s == list(range(s[0], s[0] + len(s)))
`;
  // helpers: definitions a problem needs that no suite provides.
  // calls:   replaces its doctests when running them all would pass Python Tutor's step limit. Empty when stepping
  //          through its recursive generators freezes the Python Tutor page.
  // asWritten: its functions print and return None, so print() would add a None the exam doesn't show.
  const PROBLEMS = {
    'fa25-5': { asWritten: true },
    'sp24-3': { asWritten: true },
    'sp24-4e': { calls: [] },
    'sp25-3b': { helpers: EVENT },
    'sp24-4b': { helpers: IS_STRIP },
    'sp25-5c': { calls: ['print(close([1, 2], 3))'] },
    'sp25-5d': { calls: ['print(close_exp([1, 2], 3))'] },
    'fa24-4a': { calls: ['print(semiperfect(6))'] },
    'fa24-4b': { calls: [] },
    'fa24-4c': { calls: ['print(semisums(22))  # 22 is not semiperfect, so there are no sums.'] },
    'fa25-6aplus': { calls: ['print(pizzas(1))'] },
    'fa24-5b': { calls: ['print(repr(longest(Link(5, Link(1, Link(3))), 7)))'] },
    'fa24-6': { calls: [
      'print(max_path(Tree(4, [Tree(5), Tree(9, [Tree(7)])]), len))  # The longest path',
    ] },
  };

  // print() shows Link and Tree objects and strings differently from the doctest, so those go through repr().
  function printed(source, expected) {
    const [, expr, comment] = source.match(/^(.*?)(\s+#.*)?$/s);
    if (/^print\(/.test(expr)) return source;
    return (/^(?:(?:Link|Tree)\(|['"])/.test(expected) ? `print(repr(${expr}))` : `print(${expr})`) + (comment || '');
  }
  function doctestCalls(code, asWritten) {
    const lines = code.split('\n');
    const calls = [];
    for (let i = 0; i < lines.length; i++) {
      const start = lines[i].match(/^\s*>>> (.*)$/);
      if (!start) continue;
      const source = [start[1]];
      while (i + 1 < lines.length && /^\s*\.\.\.( |$)/.test(lines[i + 1])) source.push(lines[++i].replace(/^\s*\.\.\. ?/, ''));
      const next = lines[i + 1] === undefined ? '' : lines[i + 1].trim();
      const expected = next && !next.startsWith('>>>') && !next.startsWith('"""') ? next : '';
      calls.push(expected && !asWritten ? printed(source.join('\n'), expected) : source.join('\n'));
    }
    return calls;
  }
  function promptCalls(pid, questions) {
    return questions.filter((q) => q.problem === pid)
      .map((q) => (String(q.prompt).match(/^`([^`]+)`$/) || [])[1])
      .filter(Boolean)
      .map((e) => printed(e, ''));
  }
  // Run Code's setup, with its Link and Tree swapped for the versions here. Classes come first: code can use them
  // while it is being defined.
  function definitions(pid, body, suites) {
    const reg = suites || {};
    const suite = (reg.suites || []).find((t) => t.problem === pid);
    let setup = (suite && suite.setup) || '';
    if (reg.LINK) setup = setup.split(reg.LINK).join(LINK);
    if (reg.TREE) setup = setup.split(reg.TREE).join(TREE);
    const spec = PROBLEMS[pid] || {};
    if (spec.helpers) setup += spec.helpers;
    const needs = (name, cls) => new RegExp(`\\b${name}\\b`).test(body) && !setup.includes(`class ${name}`) && !body.includes(`class ${name}`) ? cls : '';
    return needs('Link', LINK) + needs('Tree', TREE) + setup;
  }
  function build(pid, code, bank, suites) {
    const spec = PROBLEMS[pid] || {};
    const prompts = promptCalls(pid, bank.QUESTIONS);
    const calls = spec.calls || (prompts.length ? prompts : doctestCalls(code, spec.asWritten));
    const body = [code.replace(/\s+$/, ''), calls.join('\n')].filter(Boolean).join('\n\n');
    const defs = definitions(pid, body, suites);
    return (defs ? `${defs.replace(/\s+$/, '')}\n\n` : '') + body + '\n';
  }
  return { build };
})();

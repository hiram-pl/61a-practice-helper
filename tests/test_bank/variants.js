// Plausible wrong answers used to validate the verified test suites (app/data/test_suites.js).
// Each variant replaces some blanks of the official solution; the suite must FAIL for every one.
// Wrong multiple-choice options and multi-select subsets are generated automatically by the verifier, and every
// accepted alternative answer must PASS, so neither is listed here.
// `alternatives` are other correct answers (not in the answer key) that the suite must also accept.
module.exports = {
  'fa25-3': {
    wrong: [
      { b: 'includes(whole.branches[w], part.branches[p])' },
      { b: 'part.branches[p] == whole.branches[w]' },
      { b: 'part.branches[p].label == whole.branches[w].label' },
      { c: 'p == len(whole.branches)' },
      { c: 'w == len(whole.branches)' },
      { c: 'True' },
      { c: 'p > 0' },
    ],
  },
  'fa25-4': {
    wrong: [
      { a: 's' },
      { a: '[y for y in s if y is not x]' },
      { a: 'list(set(s) - {x})' },
      { a: '[y for y in s if y != x][1:]' },
      { a: 's.remove(x) or s' },
      { b: 's.rest is Link.empty' },
      { c: 'None' },
      { d: 's.first != x' },
      { e: 's.rest' },
      { f: 's' },
      { f: 'Link(s.first, s.rest)' },
      { f: 'exclude_link(s.rest, x)' },
      { b: 's is None', c: 's' },
    ],
    alternatives: [
      { a: 'list(filter(lambda e: e != x, s))' },
      { a: '[s[i] for i in range(len(s)) if s[i] != x]' },
      { d: 'not s.first != x' },
    ],
  },
  'fa25-5': {
    wrong: [
      { c: 'self.cook(self.pizzas)' },
      { c: 'Parlor.cook(self, quantity)' },
      { c: 'quantity - self.pizzas' },
      { d: 'rest * self.price' },
      { d: 'self.alt.price' },
      { e: 'self.alt.order(rest)' },
      { e: 'self.alt.order(quantity, self)' },
      { e: 'self.alt.cook(rest)' },
      { f: 'q' },
      { f: 'None' },
    ],
  },
  'fa25-6a': { wrong: [] },
  'fa25-6b': {
    wrong: [
      { d: 'True' },
      { d: 'disallow.get(slice) == pizza[0]' },
      { d: 'pizza[0] != pizza[-1]' },
      { d: 'disallow.get(previous) != slice' },
      { d: 'disallow.get(pizza[0]) != pizza[1]' },
      { d: 'slice != pizza[0]' },
    ],
  },
  'fa25-6c': {
    wrong: [
      { e: 'n == num_slices - 1' },
      { e: 'n > num_slices' },
      { e: 'num_slices == 1' },
      { h: 'f(n+1, x, x)' },
      { h: 'f(n+1, first, previous)' },
      { h: 'f(n, first, x)' },
    ],
  },
  'fa25-6d': {
    wrong: [
      { i: '[]' },
      { i: '""' },
      { j: "['_' + x for x in pizzas(n-1)]" },
      { j: "['_' for x in recurse]" },
      { j: "[x + '_' for x in recurse]" },
      { l: 'x[0] == z' },
      { l: 'x[-1] != z' },
      { m: 'filter(ok, ways)' },
      { m: 'list(ways)' },
      { m: 'list(map(ok, ways))' },
    ],
    alternatives: [
      { j: "list(map(lambda x: '_' + x, recurse))" },
    ],
  },
  'fa25-6aplus': {
    wrong: [
      { 'A+': 'filter(lambda p: len(p) == n, g(slices)), range(count_pizzas(n))' },
      { 'A+': 'filter(lambda p: acceptable(p), g(slices)), range(count_pizzas(n))' },
      { 'A+': 'filter(lambda p: len(p) == n and acceptable(p), g(slices)), range(n)' },
      { 'A+': 'g(slices), range(count_pizzas(n))' },
    ],
    alternatives: [
      { 'A+': '(p for p in g(slices) if len(p) == n and acceptable(p)), range(count_pizzas(n))' },
    ],
  },
  'sp25-3a': {
    wrong: [
      { b: 'Event(start, length)' },
      { b: 'Event(self.start, self.start + length)' },
      { b: 'Event(start, self.end)' },
      { b: 'Event(start + length, start)' },
    ],
  },
  'sp25-4a': {
    wrong: [
      { a: 'y+1 for y in below' },
      { a: 'y for y in below if y is not None' },
      { a: 'y+1 for y in below if y' },
      { a: '1 for y in below if y is not None' },
      { c: 'append(1)' },
      { c: 'extend(0)' },
      { c: 'insert(0)' },
    ],
  },
  'sp25-4b': {
    wrong: [
      { d: 'result[depth]' },
      { d: 'result[node]' },
      { g: 'visit(b, depth)' },
      { g: 'visit(node, depth + 1)' },
    ],
  },
  'sp25-5a': {
    wrong: [
      { b: 's.first * muladd(s.rest)' },
      { b: 's.first * s.rest.first + muladd(s.rest)' },
      { b: 's.first * (s.rest.first + muladd(s.rest.rest))' },
      { b: 's.first + s.rest.first * muladd(s.rest.rest)' },
      { b: 's.first * s.rest.first' },
    ],
  },
  'sp25-5b': {
    wrong: [
      { e: 'f(left, n - 1)' },
      { e: 'f(k - 1, n - 1)' },
      { e: 'f(left - 1, n)' },
    ],
  },
  'sp25-5c': {
    wrong: [
      { f: 'close(s[i:], x)' },
      { f: 'close(s[i+1:], x - product(s[:i]))' },
      { f: 'close(s[i:], x + product(s[:i]))' },
      { f: 'product(s[i:])' },
      { f: 'close(s[:i], x - product(s[i:]))' },
    ],
  },
  'sp25-5d': {
    wrong: [
      { 'A+': "'+' + close_exp(s[i+1:], x)" },
      { 'A+': "'+' + close_exp(s[i:], x - eval(term))" },
      { 'A+': "'*' + close_exp(s[i+1:], x - eval(term))" },
      { 'A+': "'+' + str(close(s[i+1:], x - eval(term)))" },
    ],
  },

  // ── Fall 2024 Midterm 2 ──
  'fa24-3': {
    wrong: [
      { b: 'b.inventory.count(s)' },
      { b: 'len(b.inventory)' },
      { b: 'b.copies(p)' },
      { b: 'copies(b, s)' },
      { c: 'self.branches[k].inventory' },
      { c: 'self.inventory.append' },
      { c: 'self.branches[k].append' },
      { c: 'self.branches[k].inventory.append(s)' },
      { c: 'lambda s: self.branches[k].inventory + [s]' },
    ],
  },
  'fa24-4a': {
    wrong: [
      { c: 'd' },
      { c: 's + d' },
      { c: 'n - d' },
      { c: 's - 1' },
      { d: 'False' },
      { d: 'f(s - d, d + 1)' },
      { d: 'f(n, d + 1)' },
      { d: 'f(s, d)' },
    ],
  },
  'fa24-4b': {
    wrong: [
      { f: 'subsums(s[1:], n)' },
      { f: 'subsums(s[1:], n - 1)' },
      { f: 'subsums(s[1:], s[0] - n)' },
      { f: 'subsums(s[:1], n - s[0])' },
      { f: 'subsums(s, n - s[0])' },
    ],
  },
  'fa24-4c': {
    wrong: [
      { k: 'n - 1' },
      { k: '0' },
      { k: 'k' },
      { l: 'lambda k: n % k == 0, range(1, n + 1)' },
      { l: 'lambda k: n % k == 0, range(n)' },
      { l: 'lambda k: n % k, range(1, n)' },
      { l: 'lambda k: k % n == 0, range(1, n)' },
      { l: 'semiperfect, range(1, n)' },
    ],
    alternatives: [
      { l: 'lambda k: not n % k, range(1, n)' },
      { l: 'lambda d: n % d == 0, range(2, n)' },  // 1 is never semiperfect
    ],
  },
  'fa24-5a': {
    wrong: [
      { a: 'b is Link.empty' },
      { a: 'a.rest is Link.empty' },
      { a: 'a is not Link.empty' },
      { a: 'a == b' },
      { a: 'False' },
    ],
    alternatives: [
      { a: 'not a' },
    ],
  },
  'fa24-5b': {
    wrong: [
      { f: 's.first < n' },
      { f: 'n > 0' },
      { f: 's.first >= n' },
      { f: 's.rest is not Link.empty' },
      { g: 'Link(s.first, t)' },
      { g: 'Link(s.first, longest(s.rest, n))' },
      { g: 'longest(s.rest, n - s.first)' },
      { g: 's' },
    ],
    alternatives: [
      { f: 'n - s.first >= 0' },
    ],
  },
  'fa24-6': {
    wrong: [
      { 'A+': 'g(x + [b.label])' },
      { 'A+': 'g(x + max_path(b, g))' },
      { 'A+': 'g(max_path(b, g))' },
      { 'A+': 'max_path(b, g)' },
    ],
    alternatives: [
      { 'A+': 'g([t.label] + max_path(b, lambda p: g([t.label] + p)))' },
    ],
  },

  // ── Spring 2024 Midterm 2 ──
  'sp24-3': {
    wrong: [
      { a: '{}' },
      { a: "{'Front': Speaker}" },
      { a: "{'Front': lambda x: x}" },
      { a: "{'Front': Speaker(str.lower)}" },
      { c: 'm.speakers[location] = self.transform' },
      { c: 'self.speakers[location] = self' },
      { c: 'm.speakers = {location: self}' },
      { c: "m.speakers['location'] = self" },
      { c: 'm.speakers[self] = location' },
    ],
    alternatives: [
      { a: 'dict(Front=Speaker(lambda x: x))' },
      { c: 'm.speakers.update({location: self})' },
    ],
  },
  'sp24-4a': {
    wrong: [
      { b: 's[0] + 1' },
      { b: '0' },
      { b: 's[-1]' },
      { b: 'len(s)' },
    ],
    alternatives: [
      { b: 'min(s)' },
    ],
  },
  'sp24-4c': {
    wrong: [
      { a: 'longest_with_s0(s[1:])' },
      { a: 'longest(s)' },
      { a: 's[1:]' },
      { a: 'longest(s[:-1])' },
      { d: 'k == result[0] + 1' },
      { d: 'k > result[-1]' },
      { d: 'k == s[0] + 1' },
      { d: 'k - 1 in result' },
    ],
    alternatives: [
      { d: 'k - result[-1] == 1' },
    ],
  },
  'sp24-4d': {
    wrong: [
      { b: 'b.label == t.label + 1' },
      { b: 'has_strip(b)' },
      { b: 'b.label == t.label + 1 or has_strip(b)' },
      { b: 't.label == b.label + 1 and has_strip(b)' },
      { b: 'b.label == t.label + 1 and is_strip(b)' },
    ],
    alternatives: [
      { b: 'has_strip(b) and b.label - t.label == 1' },
    ],
  },
  'sp24-4e': { wrong: [] },  // every blank is multiple choice; all wrong options are generated
  'sp24-4aplus': {
    wrong: [
      { 'A+': 'has_strip(b)' },
      { 'A+': 't.label + 1 == b.label' },
      { 'A+': 'has_strip(b) and t.label + 1 == b.label' },
      { 'A+': 'only_strips(b) or has_strip(b)' },
    ],
    alternatives: [
      { 'A+': 't.label + 1 == b.label and has_strip(b) and not only_strips(b)' },
    ],
  },

  // ── Fall 2023 Midterm 2 ──
  'fa23-3': {
    wrong: [
      { b: 'self.books[0]' },
      { b: 'title' },
      { b: 'Book(title, self)' },
      { b: 'self.books' },
    ],
    alternatives: [
      { b: "self.books.get(title, None)" },
    ],
  },
  'fa23-4b': {
    wrong: [
      { d: 'k * k' },
      { d: '[k]' },
      { d: '[total, k]' },
      { e: 'squares(total - k * k, k + 1)' },
      { e: 'squares(total, k)' },
      { e: 'squares(total - k, k)' },
      { e: 'squares(k * k, k)' },
    ],
  },
  'fa23-5': {
    wrong: [
      { a: 't.is_leaf()' },
      { a: 'n == t.label' },
      { a: 't.is_leaf() and n == 0' },
      { b: 'only_paths(b, n)' },
      { b: 'only_paths(b, n - b.label)' },
      { b: 'b' },
    ],
    alternatives: [
      { a: 'not t.branches and t.label == n' },
    ],
  },
  'fa23-6': {
    wrong: [
      { b: 'True' },
      { b: 'find(rest, b, lambda rest: False)' },
      { b: 'find(s, b, lambda rest: True)' },
      { b: 'rest.first == b' },
      { b: 'find(rest, a, lambda rest: True)' },
    ],
  },

  // ── Spring 2023 Midterm 2 ──
  'sp23-2a': {
    wrong: [
      { a: 'self.sent = True' },
      { a: 'sent = False' },
      { b: 'self.sent = False' },
      { b: 'sent = True' },
      { c: 'self.contents.upper()' },
      { c: 'Letter(self.contents)' },
      { c: 'self' },
    ],
    alternatives: [
      { c: 'type(self)(self.contents.upper())' },
    ],
  },
  'sp23-3a': {
    wrong: [
      { a: 'sum(s[:k])' },
      { a: 's[k]' },
      { a: 'sum(s[k:])' },
      { a: 'sum(s[:k+2])' },
    ],
    alternatives: [
      { a: 'sum(s[0:k+1])' },
    ],
  },
  'sp23-3b': {
    wrong: [
      { e: 'f(suffix.rest, total)' },
      { e: 'f(suffix, total + suffix.first)' },
      { e: 'f(suffix.rest, suffix.first)' },
      { f: 'f(s, 0)' },
      { f: 'f(s.rest, 0)' },
      { f: 'f(s, s.first)' },
    ],
  },
  'sp23-4a': {
    wrong: [
      { a: 'y' },
      { a: 'exclude(y, y.label)' },
      { a: 'exclude(t, x)' },
      { b: 'b.label != x' },
      { b: 't.label == x' },
      { b: 'False' },
    ],
  },
  'sp23-4b': {
    wrong: [
      { e: 't = exclude(t, x)' },
      { e: 'exclude(t, x)' },
      { e: 't.branches = exclude(t, x)' },
      { e: 't.branches = [exclude(b, x) for b in t.branches]' },
    ],
    alternatives: [
      { e: 't.branches[:] = exclude(t, x).branches' },
    ],
  },
  'sp23-5a': {
    wrong: [
      { a: '0' },
      { b: 'count_park(n-1) + count_park(n-2)' },
      { b: '2 * count_park(n-1) + 2 * count_park(n-2)' },
      { b: '3 * count_park(n-1)' },
      { b: '2 * count_park(n-1)' },
    ],
  },
  'sp23-5b': {
    wrong: [
      { 'c, d': "yield s + '.'" },
      { 'c, d': "yield s + '.'\nyield s + '.'" },
      { 'c, d': "yield s + '.'\nyield s + '<>'" },
      { e: 'park(n-1)' },
      { e: 'park(n)' },
      { f: "yield s + '%'" },
      { f: "yield '<>' + s + '<>'" },
    ],
    alternatives: [
      { 'c, d': "yield '.' + s\nyield '%' + s", f: "yield '<>' + s" },  // prepending works only if (f) prepends too
    ],
  },
  'sp23-5aplus': {
    wrong: [
      { 'A+': '(yes + s for s in f(n, k))' },
      { 'A+': '(yes + s for s in f(n, k) if s[0] != no)' },
      { 'A+': '(no + s for s in f(n, k) if not s or s[0] != no)' },
    ],
  },
};

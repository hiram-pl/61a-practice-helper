// What is in scope for the current exam. Edit this file each semester; questions.js never changes.
//
// The question bank is past CS 61A Midterm 2 exams. This copy is set up as practice for Data C88C Midterm 2 (Fall 2026).
//
// Scope: everything through Lecture 20 (Object Examples) on https://c88c.org/fa26/. Iterators is Lecture 22, after it.
// C88C staff: Midterm 2 covers the same material as past CS 61A Midterm 2 exams, except
//   - not covered: orders of growth, linked list mutation, tree mutation, repr strings, special method names
//     (such as __add__ and __iter__), and, this semester, Data Abstraction and Generators;
//   - older exams use Link.empty where we now use (), and t.is_leaf() where we now use is_leaf(t);
//   - skip the A+ questions unless you are very comfortable with the rest.
// The earlier CS 61A Midterm 3 scope (Ed post #1237, https://edstem.org/us/courses/100850/discussion/8416140) is kept:
// its entries are marked source: 'ed'. Entries added for C88C apply the rules above, so they are 'inferred'.
// No question in the bank is about data abstraction itself (constructors and selectors), so none is removed for it.
//
// Shape:
//   outOfScopeTopics – topic ids (from TOPICS in questions.js). The topic is shown as not in scope, and a question
//                      whose topics are all out of scope is hidden even if it is not listed below.
//   problems         – keyed by PROBLEMS id. Applies to every part of that problem. A note here is shown in the left
//                      pane: use it when the out-of-scope idea is in the question itself (its text or code).
//   questions        – keyed by QUESTIONS id (one part). Use this when only some parts are affected. A note here is
//                      shown beside that part's answer box: use it when the out-of-scope idea is in the answer.
// Each entry:
//   status: 'out'  – hidden from Practice and Exam mode (still kept in questions.js for later semesters)
//           'note' – still asked, with `note` shown next to it
//   reason / note    – why; shown to students for 'note'
//   source: 'ed'       – listed in the Ed post
//           'inferred' – the post does not cover this exam; the post's rules were applied by us
//
// Problem ids and part ids can look alike (problem 'sp25-3a' vs. part 'sp25-3a'), so keep them in their own maps.
// Check this file with: node tests/verify_in_scope.js

window.CS61A_SCOPE = (() => {
  // Notes reused below. The old spellings are kept in the questions (questions.js is never edited for scope), so a short
  // answer typed the new way shows "not an exact match": Show Solution, then mark it yourself.
  const LINK_EMPTY = 'This exam writes `Link.empty` for the empty linked list. This semester we write `()` instead; they mean the same thing.';
  const IS_LEAF = 'This exam writes `t.is_leaf()`. This semester we write `is_leaf(t)`; they mean the same thing.';
  const A_PLUS = 'A+ question: on the exam it is worth no points. Skip it unless you are very comfortable with the rest.';
  const typedNew = (old, now) => `The official answer uses \`${old}\`. If you write \`${now}\` instead, Check Answer says it isn’t an exact match: show the solution and mark it right yourself.`;
  const NO_ITERATORS = 'This answer only uses `map`, `filter` or `zip` to build a list or a value. You don’t need iterators (`iter`, `next`) for it.';

  return {
    label: 'Data C88C Midterm 2 (Fall 2026)',
    source: 'https://c88c.org/fa26/',
    outOfScopeTopics: ['efficiency', 'generators', 'iterators'],

    problems: {
      // ── From the CS 61A scope ──
      // Spring 2023 Q2 uses __repr__ (the Ed post marks all of Q2)
      'sp23-2a': { status: 'out', reason: 'Uses __repr__', source: 'ed' },
      'sp23-2b': { status: 'out', reason: 'Uses __repr__', source: 'ed' },
      // Fall 2022 Q4(b): chop_head mutates the hydra tree
      'fa22-4b': { status: 'out', reason: 'Mutates a tree', source: 'inferred' },

      'fa25-3': { status: 'note', source: 'ed',
        note: 'The definition below says “repr string”. Here that just means what Python shows when it evaluates a tree (like `Tree(2, [Tree(20), Tree(22)])` on line 4), so the question is still in scope.' },
      'fa23-3': { status: 'note', source: 'ed',
        note: 'The `Book` class defines a `__str__` method, which is no longer taught. Blank (f) depends on that method, so it was removed. The other blanks are in scope.' },
      'fa22-1': { status: 'note', source: 'inferred',
        note: 'The `Snake` class defines a `__str__` method, which is no longer taught. All you need to know: printing a `Snake` object shows its name.' },

      // ── Generators (not covered this semester) ──
      'fa25-1': { status: 'out', reason: 'What Would Python Display with a generator', source: 'inferred' },
      'fa25-6aplus': { status: 'out', reason: 'Generators (A+ question)', source: 'inferred' },
      'sp25-3a': { status: 'out', reason: 'Event.split is a generator', source: 'inferred' },
      'sp25-3b': { status: 'out', reason: 'BerkeleyEvent.split is a generator', source: 'inferred' },
      'fa24-4b': { status: 'out', reason: 'subsums is a generator', source: 'inferred' },
      'sp24-1': { status: 'out', reason: 'Generators; parts (a), (b) mutate a linked list and (d) is orders of growth', source: 'inferred' },
      'sp24-4e': { status: 'out', reason: 'strips is a generator', source: 'inferred' },
      'fa23-4b': { status: 'out', reason: 'Generators', source: 'inferred' },
      'sp23-5b': { status: 'out', reason: 'park is a generator', source: 'inferred' },
      'sp23-5aplus': { status: 'out', reason: 'Generators (A+ question)', source: 'inferred' },
      'fa22-3a': { status: 'out', reason: 'make_test_dice is a generator', source: 'inferred' },
      'fa21-3b': { status: 'out', reason: 'ring is a generator', source: 'inferred' },
      'fa21-3c': { status: 'out', reason: 'fork is a generator', source: 'inferred' },
      'fa25-6d': { status: 'note', source: 'inferred',
        note: 'Blank (k) uses a generator, which isn’t covered this semester, so it was removed. The other blanks are in scope.' },
      'fa24-4c': { status: 'note', source: 'inferred',
        note: 'Blanks (i) and (k) call the `subsums` generator, which isn’t covered this semester, so they were removed. Blanks (j) and (l) don’t need it.' },

      // ── Iterators (Lecture 22, after the Midterm 2 scope) ──
      'fa23-1': { status: 'out', reason: 'What Would Python Display with iter / next', source: 'inferred' },
      'fa22-3b': { status: 'out', reason: 'Dice are iterators (next)', source: 'inferred' },
      'fa22-7': { status: 'out', reason: 'Uses iter / next (A+ question)', source: 'inferred' },
      'sp25-1': { status: 'note', source: 'inferred',
        note: 'Parts (b) to (d) use iterators (`iter`, `next`), which come after the Midterm 2 scope, so they were removed.' },

      // ── Older notation ──
      'fa25-4': { status: 'note', source: 'inferred', note: LINK_EMPTY },
      'sp25-5a': { status: 'note', source: 'inferred', note: LINK_EMPTY },
      'fa24-5a': { status: 'note', source: 'inferred', note: LINK_EMPTY },
      'fa24-5b': { status: 'note', source: 'inferred', note: LINK_EMPTY },
      'fa23-6': { status: 'note', source: 'inferred', note: LINK_EMPTY },
      'sp23-3b': { status: 'note', source: 'inferred', note: LINK_EMPTY },
      'fa21-5b': { status: 'note', source: 'inferred', note: LINK_EMPTY },
      'sp25-4a': { status: 'note', source: 'inferred', note: IS_LEAF },
      'fa24-1': { status: 'note', source: 'inferred', note: IS_LEAF },
      'sp24-4d': { status: 'note', source: 'inferred', note: IS_LEAF },
      'fa23-5': { status: 'note', source: 'inferred', note: IS_LEAF },
      'fa22-4a': { status: 'note', source: 'inferred', note: IS_LEAF },
      'fa21-5a': { status: 'note', source: 'inferred', note: IS_LEAF },

      // ── A+ questions still in scope ──
      'fa24-6': { status: 'note', source: 'inferred', note: `${A_PLUS} ${IS_LEAF}` },
      'sp25-5d': { status: 'note', source: 'inferred', note: A_PLUS },
      'fa23-5aplus': { status: 'note', source: 'inferred', note: A_PLUS },
    },

    questions: {
      // ── From the CS 61A scope ──
      // Fall 2025
      'fa25-1c': { status: 'out', reason: 'Orders of growth', source: 'ed' },
      // Spring 2025
      'sp25-2c': { status: 'out', reason: 'Orders of growth', source: 'ed' },
      // Fall 2024
      'fa24-2c': { status: 'out', reason: 'Orders of growth', source: 'ed' },
      // Spring 2024
      'sp24-1a': { status: 'out', reason: 'Mutates a linked list', source: 'ed' },
      'sp24-1b': { status: 'out', reason: 'Mutates a linked list', source: 'ed' },
      'sp24-1d': { status: 'out', reason: 'Orders of growth', source: 'ed' },
      'sp24-4aplus': { status: 'out', reason: 'Mutates a tree’s branches (A+ question)', source: 'ed' },
      // Fall 2023
      'fa23-3f': { status: 'out', reason: 'Answer choices use repr', source: 'ed' },
      'fa23-6c': { status: 'out', reason: 'Orders of growth', source: 'ed' },
      // Spring 2023
      'sp23-3a-iii': { status: 'out', reason: 'Orders of growth', source: 'ed' },
      'sp23-4e': { status: 'out', reason: 'Mutates a tree’s branches', source: 'ed' },
      // Fall 2022
      'fa22-1c': { status: 'note', source: 'inferred',
        note: 'This answer uses the `__str__` method: printing the `snek` object shows its name.' },
      'fa22-1d': { status: 'note', source: 'inferred',
        note: 'This answer uses the `__str__` method: `f"{self} crawled"` puts the snake’s name in the string.' },
      'fa22-5b-i': { status: 'out', reason: 'Orders of growth', source: 'inferred' },
      'fa22-5b-ii': { status: 'out', reason: 'Orders of growth', source: 'inferred' },
      // Fall 2021
      'fa21-4b-iii': { status: 'out', reason: 'Orders of growth', source: 'inferred' },

      // ── Generators and iterators in otherwise in-scope questions ──
      'fa25-6k': { status: 'out', reason: 'Generators', source: 'inferred' },
      'fa24-4i': { status: 'out', reason: 'Calls the subsums generator', source: 'inferred' },
      'fa24-4k': { status: 'out', reason: 'Calls the subsums generator', source: 'inferred' },
      'sp25-1b': { status: 'out', reason: 'Iterators (iter / next)', source: 'inferred' },
      'sp25-1c': { status: 'out', reason: 'Iterators (iter / next)', source: 'inferred' },
      'sp25-1d': { status: 'out', reason: 'Iterators (iter / next)', source: 'inferred' },
      // Tagged iterators, but only use map / filter / zip to build a value
      'fa25-6m': { status: 'note', source: 'inferred', note: NO_ITERATORS },
      'fa24-4l': { status: 'note', source: 'inferred', note: NO_ITERATORS },
      'fa21-4a-c': { status: 'note', source: 'inferred', note: NO_ITERATORS },

      // ── Short answers whose official answer uses the older notation ──
      'fa25-4b': { status: 'note', source: 'inferred', note: typedNew('Link.empty', '()') },
      'fa25-4c': { status: 'note', source: 'inferred', note: typedNew('Link.empty', '()') },
      'fa24-5a': { status: 'note', source: 'inferred', note: typedNew('Link.empty', '()') },
      'fa21-5b-c': { status: 'note', source: 'inferred', note: typedNew('Link.empty', '()') },
      'fa23-5a': { status: 'note', source: 'inferred', note: typedNew('t.is_leaf()', 'is_leaf(t)') },
      'fa21-5a-b': { status: 'note', source: 'inferred', note: typedNew('b.is_leaf()', 'is_leaf(b)') },
    },
  };
})();

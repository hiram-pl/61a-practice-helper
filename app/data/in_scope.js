// What is in scope for the current exam. Edit this file each semester; questions.js never changes.
//
// The question bank is past CS 61A Midterm 2 exams. In Fall 2026 they are practice for CS 61A Midterm 3 and
// C88C Midterm 2, which cover about the same material.
//
// Source: Ed post #1237, "Midterm 3 Practice: Past Midterm 2 Exam Index"
//   https://edstem.org/us/courses/100850/discussion/8416140
// Out of scope this semester: mutating linked lists and trees, repr / __repr__, orders of growth, nonlocal.
//
// Shape:
//   outOfScopeTopics – topic ids (from TOPICS in questions.js). The topic is shown as not in scope, and a question
//                      whose topics are all out of scope is hidden even if it is not listed below.
//   problems         – keyed by PROBLEMS id (the left pane). Applies to every part of that problem.
//   questions        – keyed by QUESTIONS id (one part). Use this when only some parts are affected.
// Each entry:
//   status: 'out'  – hidden from Practice and Exam mode (still kept in questions.js for later semesters)
//           'note' – still asked, with `note` shown next to it
//   reason / note    – why; shown to students for 'note'
//   source: 'ed'       – listed in the Ed post
//           'inferred' – the post does not cover this exam; the post's rules were applied by us
//
// Problem ids and part ids can look alike (problem 'sp25-3a' vs. part 'sp25-3a'), so keep them in their own maps.
// Check this file with: node tests/verify_in_scope.js

window.CS61A_SCOPE = {
  label: 'CS 61A Midterm 3 / C88C Midterm 2 (Fall 2026)',
  source: 'https://edstem.org/us/courses/100850/discussion/8416140',
  outOfScopeTopics: ['efficiency'],

  problems: {
    // Spring 2023 Q2 uses __repr__ (the Ed post marks all of Q2)
    'sp23-2a': { status: 'out', reason: 'Uses __repr__', source: 'ed' },
    'sp23-2b': { status: 'out', reason: 'Uses __repr__', source: 'ed' },
    // Fall 2022 Q4(b): chop_head mutates the hydra tree
    'fa22-4b': { status: 'out', reason: 'Mutates a tree', source: 'inferred' },

    'fa25-3': { status: 'note', source: 'ed',
      note: 'This question mentions the “repr string” of a Tree. That is just what Python shows when it evaluates a tree, so the question is still in scope.' },
    'sp25-3a': { status: 'note', source: 'ed',
      note: '`Event` defines `__repr__`, which is no longer taught. It only decides how events look in the tests; the rest of the question is in scope.' },
    'sp25-3b': { status: 'note', source: 'ed',
      note: '`Event` (from part (a)) defines `__repr__`, which is no longer taught. It only decides how events look in the tests; the rest of the question is in scope.' },
    'fa23-3': { status: 'note', source: 'ed',
      note: 'This class defines `__str__`, which is no longer taught. Blank (f), which depends on it, has been removed; the other blanks are in scope.' },
    'fa22-1': { status: 'note', source: 'inferred',
      note: '`Snake` defines `__str__`, which is no longer taught: printing a `Snake` shows its name.' },
  },

  questions: {
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
    'sp24-1c': { status: 'note', source: 'ed',
      note: 'The `shake` code mutates a linked list, which is out of scope. This part only uses `cruel`.' },
    // Fall 2023
    'fa23-3f': { status: 'out', reason: 'Answer choices use repr', source: 'ed' },
    'fa23-6c': { status: 'out', reason: 'Orders of growth', source: 'ed' },
    // Spring 2023
    'sp23-3a-iii': { status: 'out', reason: 'Orders of growth', source: 'ed' },
    'sp23-4e': { status: 'out', reason: 'Mutates a tree’s branches', source: 'ed' },
    // Fall 2022
    'fa22-5b-i': { status: 'out', reason: 'Orders of growth', source: 'inferred' },
    'fa22-5b-ii': { status: 'out', reason: 'Orders of growth', source: 'inferred' },
    // Fall 2021
    'fa21-4b-iii': { status: 'out', reason: 'Orders of growth', source: 'inferred' },
  },
};

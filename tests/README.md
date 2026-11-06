# Tests

Browser regression tests for the app in `../app`. They drive a real Chrome through
[puppeteer-core](https://pptr.dev) against `app/index.html` (no server needed) and check the
saved `localStorage` state as well as the page.

```sh
cd tests
npm install          # puppeteer-core only; uses your installed Chrome
npm test             # every suite + the study-guide doctests
node e2e/phase5a_qa.test.js   # one suite
```

Set `CHROME=/path/to/chrome` if Chrome isn't in the default location, or `APP_URL=http://localhost:8000/`
to test a served copy. `npm run test:guides` needs `python3`.

| Suite | Covers |
|---|---|
| `phase1_elimination` | answer elimination, persistence, keyboard |
| `phase2_navigator` | question navigator, statuses, keyboard, mobile |
| `phase3_exam_mode` | exam setup, timer, Save & Leave, submission, results |
| `phase4_results_review` | auto-graded score, learning insights, editable review isolation |
| `session_isolation` | annotations / code / answers scoped to each practice set |
| `tour` | First-visit tour: welcome prompt, one-time tips across Practice / exam / review, dimming and blocking the page behind a tip, the countdown waiting for tips, End tour, No thanks, Replay, phone width (other suites start with the tour declined) |
| `phase5a_qa` | damaged saved data, grading audit, Go to Home, two open tabs, Phase 6 readiness |
| `phase6a_runner` | Run Code: output, errors, timeout + recovery, isolation, stale results, review safety (needs internet for Pyodide) |
| `phase6c_test_bank` | The 40 shipped suites in Pyodide (official passes, a wrong answer is caught); real Practice/Exam/Review flow |
| `phase6b_tests` | Verified tests (fixture suites, test-only): Passed X/Y, per-case details, not-run cases, case timeout, isolation, unverified suites ignored, exam/review safety |
| `phase8_2024_exams` | Fall 2024 / Spring 2024 Midterm 2: structure and points vs the PDFs, full exams in order, official answers score 45/45 and 50/50, A+ staff-graded, history unchanged, topic practice, diagram image, saved-filter migration, Run Code suite |
| `phase9_2023_exams` | Fall 2023 / Spring 2023 Midterm 2: structure and points vs the PDFs, full exams in order, official answers score 45/45, A+ staff-graded, history unchanged, diagram workspace (8 blanks, saved into the attempt), tree illustration, topic practice, saved-filter migration, Run Code suite with the Tree `__str__` setup |
| `phase10_practice_setup` | Practice setup: no Question Types box, Set size and Timer on the left of row 2, set size default 5 / 1 to the matching count / typing, arrows, decimals, empty and out-of-range input / filter changes, Start disabled with no matches, complete question groups, old saved preferences, resuming a saved set, phone layout |
| `phase11a_2021_2022_exams` | Fall 2022 / Fall 2021 Midterm 2: structure and points vs the PDFs, full exams in order, official answers score 44/44 and 50/50, staff-graded A+ and optional parts, history unchanged, diagram workspace (8 blanks), the exam pictures as illustrations, code shown as printed in question text, topic practice, saved-filter migration |
| `phase11c_fixes` | Audit fixes: bold text containing code renders bold (4 exam places + a study guide) while code spans, italics and fenced code still work; highlights saved before store v5 stay on the same words; Spring 2025 Q2 header 6.0 / 2(c) 1.0, total 50; curly-quote answers graded like straight quotes, stored as typed, official answers unchanged; different answers still wrong |
| `diagram_workspace` | Environment diagram workspace (pen, typing in blanks, lists, magnetic arrows, undo/redo, saving, exam to review) and the Python Tutor link (the classes and calls it adds; greyed out until every blank is filled) |
| `study_guides_doctest` | every study-guide example runs and prints what it shows |
| `verify_test_bank` | every verified suite passes with the official solution and all accepted answers, and fails for every wrong choice and listed wrong answer (local Python, same harness as the browser) |
| `verify_import_2021_2022` | fills every Fall 2022 / Fall 2021 code blank with its official (and each accepted) answer and runs the exam's own examples in local Python; notes where an example can't run exactly as printed |

Each suite prints one `PASS`/`FAIL` line per check and exits non-zero on failure.

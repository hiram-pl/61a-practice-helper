# Phase 11 — Compatibility Audit of Midterm 2 Exams

Audit date: 2026-11-05 · Branch `feature/historical-exams-2021-2022` (from `main` at `daaf8ac`, plus Phase 11A) · Audit in Phase 11B; fixes for B-1, B-2 and N-4 in Phase 11C (see “Phase 11C update” below).

**Result:** 250 subparts across 8 exams: **158 PASS**, **27 BUG**, **51 LIMITED**, **14 NEEDS REVIEW**. The two display bugs found in 11B (B-1, B-2) and the curly-quote grading issue (N-4) were fixed in 11C. The remaining confirmed bug (T-1) is in Python Tutor on the unmerged `python-tutor` branch and appears only when it is combined with the 2021–2023 exams. No grading errors were found: with the official answers, every exam scores full marks on its auto-graded parts.

## Phase 11C update — fixes (2026-11-05)

Phase 11C fixed the three findings approved for it: **B-1**, **B-2** and **N-4**. Nothing else was changed. The counts above are after these fixes. In 11B they were 144 PASS, 41 BUG, 47 LIMITED and 18 NEEDS REVIEW.

### Confirmed fixes

**B-1: bold text that contains code showed literal `**`.** Fixed.
- **Root cause:** the inline renderer split text at code spans first and only then applied bold and italic to the pieces between them. A `**…**` that had a code span inside it was split in half, so neither half matched and the asterisks were shown.
- **Fix:** code spans are now set aside as placeholders, bold and italic are applied to the whole text, and the code spans are put back.
- **Where it showed:**
  - the four audited places: Fall 2023 6(b) prompt, and the Spring 2025 4(b), Fall 2024 5(b) and Spring 2024 4(b) intros;
  - a fifth instance found while testing, in the Python Fundamentals study guide (“**returns `None`**”).
- **What else changed:** a render comparison of all 624 prose strings before and after the fix showed that these five were the only ones that changed.
- **Saved highlights:** highlights are stored as character positions in the rendered text, and removing the `**` shifts those positions. Highlights saved before this fix are moved once to the same words, and the saved data is now store version 5.

**B-2: Spring 2025 Q2 header showed 7 points.** Fixed.
- **Root cause:** the PDF's Q2 is 7 points: (a) 3, (b) 3 and (c) 1. On this site, 2(c) is its own problem, so the Q2 header counted a point that is shown under 2(c).
- **Fix:** the Q2 header now shows 6 points, and 2(c) shows 1. Part points and the exam's total of 50 are unchanged.

**N-4: answers typed with curly quotes were marked “Not an exact match”.** Fixed.
- **Reproduced:** typing `‘<>’` or `“”` made Spring 2023 5(f) and Fall 2025 6(i) fail.
- **Not reproduced:** a device substituting smart quotes on its own. A student who types them, or pastes them from a document, hits the same path.
- **Root cause:** the grading comparison treated `"` as `'` but did not handle ‘ ’ “ ”.
- **Fix:** the comparison now also treats ‘ ’ “ ” as `'`. The scope is limited:
  - the student's answer is stored and shown exactly as typed;
  - official solutions are displayed unchanged;
  - code that is run is not touched;
  - no other characters are normalized.
- **Scope check:** across the whole answer key, the only effect on accepted forms is that Fall 2022 1(d)'s curly-quote form now coincides with its straight-quote form, which is expected.

### Files changed in 11C

- `app/app.js`:
  - the inline renderer (B-1);
  - store version 5 and the one-time highlight move (B-1);
  - the answer comparison (N-4).
- `app/data/questions.js`: Spring 2025 Q2 header points, with a comment (B-2).
- `tests/e2e/phase11c_fixes.test.js`: new, 25 checks.
- `tests/e2e/phase3_exam_mode.test.js` and `tests/e2e/session_isolation.test.js`: now expect store version 5.

### Tests performed

- **New regression suite (`phase11c_fixes`), 25 of 25 pass.** It checks:
  - **B-1 rendering:** all five places render bold with their code inside;
  - **B-1 non-regression:** code spans containing `*`, italics and fenced code still render;
  - **B-1 highlights:** version 4 highlights land on the same words and do not move again after a reload;
  - **B-2:** the headers show 6.0 and 1.0, and the total is still 50;
  - **N-4 positive cases:** four answers with curly quotes are correct and stored as typed;
  - **N-4 negative cases:** four different answers are still wrong (a different string, quotes left out, backticks, two strings);
  - **N-4 in exam mode:** grading and review show the student's answer as typed and the official answer unchanged;
  - **console:** no console errors.
- **Full suite (`node tests/run_all.js`):** all suites pass, including the verified Run Code bank (40 suites) and the 2021–2022 import check.
- **Intermittent failure:** one phase2 check (“whitespace-only text answers…”) failed once in about 16 runs during this phase. It did not reproduce in 10 instrumented reruns, and its cause is unidentified. No 11C change touches that code path.
- **Browser audit (step 2 of “How it was checked”) rerun after the fixes:**
  - all 250 parts render, grade and review correctly;
  - every exam scores its full auto-graded points;
  - there are no console errors.

### Remaining and deferred

- **Python Tutor (T-1, T-2, T-3):** support for the 2021–2023 problems needs to be done on Osbert's `python-tutor` branch before it is combined with these exams. It was not touched in this phase.
- **Select-all blanks (L-1):** a Run Code note for these blanks is still open. The other limitations (L-2 to L-10) are unchanged.
- **Source discrepancies:** N-1, N-2 and N-3 need answers from course staff rather than code changes.
- **Issues across all exams:** G-1 (exact-match grading), G-2 (unreviewed explanations and tags) and G-3 (live pythontutor.com untested) are unchanged.

## Summary by exam

| Exam | Subparts | PASS | BUG | LIMITED | NEEDS REVIEW | Score with official answers |
|---|---|---|---|---|---|---|
| Fall 2025 Midterm 2 | 33 | 17 | 0 | 10 | 6 | 46/46 |
| Spring 2025 Midterm 2 | 29 | 23 | 0 | 6 | 0 | 50/50 |
| Fall 2024 Midterm 2 | 31 | 23 | 0 | 8 | 0 | 45/45 |
| Spring 2024 Midterm 2 | 30 | 20 | 0 | 7 | 3 | 50/50 |
| Fall 2023 Midterm 2 | 27 | 15 | 1 | 8 | 3 | 45/45 |
| Spring 2023 Midterm 2 | 26 | 21 | 3 | 1 | 1 | 45/45 |
| Fall 2022 Midterm 2 | 36 | 11 | 16 | 8 | 1 | 44/44 |
| Fall 2021 Midterm 2 | 38 | 28 | 7 | 3 | 0 | 50/50 |

A question's status is its most serious finding (BUG, then NEEDS REVIEW, then LIMITED). PASS means every check below ran on it and none failed.

## How it was checked

All checks ran on every one of the 250 subparts unless stated.

1. **Data (B1, B2, B6):** answer key shape against the question type; duplicate choices; empty prompts; point values against problem headers; every image file exists and matches its stated size; diagram blanks lie inside their image; every “on line N” reference points at that line of the code.
2. **Browser (B1, B2, B6, B7):** each exam as a full past exam in headless Chrome. For every part: it is shown, with its label and prompt; the editor holds exactly the stored code; the question number is in the header; pictures load (diagram workspace with all its blanks, or an illustration); the input matches the type (one radio per choice, one checkbox per choice, or a text box). Then official answers are submitted: every auto-gradable part is graded correct, every staff-graded part is “Graded by Course Staff”, the score equals the auto-gradable points, and review shows the official answer for every part. A two-line answer was typed and graded correct (Fall 2022 Q1).
3. **Python (B3, B6):** for every problem with code: what Run Code gets with the official answers compiles and runs on its own; the official answers pass the exam's own doctests: 55 of 64 problems pass as printed. Of the other 9: Fall 2021 Q1 has no doctests; Fall 2025 6(d), Spring 2023 5(c), Fall 2022 4(a), 4(b) and 5 print examples that can't run as printed (L-9); Fall 2022 6(a), 6(b) and 7 failed only because this audit also loaded the earlier parts' docstrings, and 6(b) needs the `has_path` the exam omits. All 19 Fall 2022 and Fall 2021 code problems pass in the dedicated check (tests/verify_import_2021_2022.js), which handles each of these cases; every What Would Python Display expression is re-evaluated and matches its official answer; every diagram question's printed output matches its official answer. Diagram questions about bindings (Fall 2023 2(a), Fall 2022 2(a)–(d)) were checked by tracing the code when they were imported (Phases 9 and 11A).
4. **Run Code suites (B3):** the 40 verified suites pass with every official solution and accepted answer and fail on 645 tested wrong versions (`npm test` → verify_test_bank). No new suites were added for Fall 2022 or Fall 2021.
5. **Python Tutor (B4):** not on this branch. `app/tutor.js` from `origin/python-tutor` (read only, not merged or changed) was used to build each problem's Python Tutor code with the official answers, and the result was run and its steps counted: 72 of 81 problems run cleanly. The live pythontutor.com page (Python 3.6, its own step limit) was not exercised.
6. **Review and persistence (B7):** covered by the existing suites, all passing in the Phase 11A run: phase4 (review edits never change the submitted attempt or score), phase5a (damaged saved data, two open tabs), session_isolation, phase3 (pre-exam saved sessions still load), diagram_workspace (diagram work carried into review), plus step 2 above for all eight exams.

## Findings by severity

**Medium**
- **T-1** (BUG): Python Tutor (python-tutor branch) can’t build runnable code for 8 newer problems — 27 parts
- **T-2** (NEEDS REVIEW): Python Tutor: two problems run 11,000–13,000 steps — 4 parts
- **L-1** (LIMITED): Select-all blanks with several correct options can’t be run — 4 parts
- **N-1** (NEEDS REVIEW): Fall 2022 Q6(b) points: header 6, parts 5 (exam 44 vs printed 45) — 4 parts

**Low**
- **T-3** (LIMITED): Python Tutor stops at the expected error in Fall 2023 1(c) — 4 parts
- **L-2** (LIMITED): Run Code: code that needs definitions not in the editor — 17 parts
- **L-3** (LIMITED): Diagram workspace has no official completed diagram — 16 parts
- **L-4** (LIMITED): A choice the official solution also accepted is graded wrong — 1 part
- **L-5** (LIMITED): Blanks graded alone where the solution states a joint condition — 2 parts
- **L-6** (LIMITED): Exam layout that the renderer approximates — 8 parts
- **L-7** (LIMITED): Open-ended expression graded by exact match — 1 part
- **L-8** (LIMITED): Optional drawing question has no official answer — 1 part
- **L-9** (LIMITED): Exam doctests that don’t run exactly as printed — 17 parts
- **L-10** (LIMITED): Parts with no published point value — 5 parts
- **N-2** (NEEDS REVIEW): Fall 2022 6(a): exam example disagrees with the official answer — 1 part
- **N-3** (NEEDS REVIEW): Exam text corrected during transcription — 9 parts

**Across all exams (not counted per question)**
- **G-1:** Short answers are graded by exact match (ignoring spaces and quote style). 59 of the 112 code-blank short answers list exactly one accepted form, so a correct but differently written answer is marked wrong. Verified suites (Run Code) give a second opinion on 40 problems.
- **G-2:** Explanations, topic tags and difficulty levels were written for this site and have not been reviewed by course staff.
- **G-3:** Python Tutor's behavior on pythontutor.com itself (Python 3.6, its step limit) is untested.

## Recommended follow-up (after 11C)

B-1, N-4 and B-2, which were recommended for 11C in 11B, are fixed. Still open, in priority order:

1. **T-1 / T-2** Python Tutor support for the 2021–2023 problems: needed before `python-tutor` is merged with this branch (coordinate with Osbert; it touches his file).
2. **L-1** A note under Run Code for select-all blanks.
3. **N-1 / N-2 / N-3** need answers from course staff rather than code changes.

## Findings in detail

### B-1 · FIXED in 11C (was BUG) · Medium — Bold text that contains code shows literal asterisks

- **Questions:** `fa23-6b`, `sp25-4d`, `sp25-4e`, `sp25-4f`, `sp25-4g`, `fa24-5e`, `fa24-5f`, `fa24-5g`, `sp24-4b-a`, `sp24-4b-b`, `sp24-4b-c`, `sp24-4b-d`
- **Expected:** Text such as **Do not mutate `s`.** renders in bold.
- **Actual:** It renders as “**Do not mutate s.**”, with the asterisks visible. Four places: Fall 2023 6(b) prompt; the intros of Spring 2025 4(b), Fall 2024 5(b) and Spring 2024 4(b).
- **Root cause:** `inline()` in app/app.js splits the text at code spans first and applies bold/italic to each piece separately, so a bold run with code inside never finds its closing `**`.
- **Recommended fix:** In `inline()`, swap code spans for placeholders, apply bold/italic to the whole string, then put the code spans back.
- **Impact on other questions:** Every prompt, intro, outro and explanation goes through it; only these four contain bold around code. Saved highlights in those three intros are stored as character offsets, which shift by the removed asterisks; the fix should check that existing highlights still land, or accept that they may move.

### B-2 · FIXED in 11C (was BUG) · Low — Spring 2025 Q2 header shows 7.0 points for 6 points of parts

- **Questions:** `sp25-2a`, `sp25-2b`
- **Expected:** The left-pane header matches the parts shown with it.
- **Actual:** Header “(7.0 points)”; parts (a) and (b) are 3 + 3. The 7th point is 2(c), shown as its own problem.
- **Root cause:** `sp25-2` keeps the PDF’s 7 points after 2(c) was split into `sp25-2c` (Phase 1).
- **Recommended fix:** Set the header to the parts’ total, or label it “7.0 points, including 2(c)”.
- **Impact on other questions:** Display only: scores, exam totals (50) and the exam list already use the parts.

### T-1 · BUG · Medium — Python Tutor (python-tutor branch) can’t build runnable code for 8 newer problems

- **Questions:** `fa22-3b-a`, `fa22-3b-b`, `fa22-3b-c`, `fa22-6b-a`, `fa22-6b-b`, `fa22-6b-c`, `fa22-6b-d`, `fa21-3c-a`, `fa21-3c-b`, `fa21-3c-c`, `fa21-3c-d`, `fa21-5b-a`, `fa21-5b-b`, `fa21-5b-c`, `fa23-5aplus`, `sp23-2d`, `sp23-2e`, `sp23-2f`, `fa22-4b-a`, `fa22-4b-b`, `fa22-4b-c`, `fa22-4b-d`, `fa22-5a-a`, `fa22-5a-b`, `fa22-5a-c`, `fa22-5a-d`, `fa22-5b-i`
- **Expected:** Opening a problem in Python Tutor runs its code and doctests with the definitions they need.
- **Actual:** Building each problem with origin/python-tutor’s app/tutor.js (official answers filled in) and running it: NameError for fa22-3b (make_test_dice), fa22-6b (Graph), fa21-3c (ring), fa21-5b (twig), fa23-5aplus (only_paths), sp23-2b (Letter); SyntaxError for fa22-4b (its select-all blank is filled with “Option 2 | Option 4”); RecursionError for fa22-5a (the exam doctest count_subsets(list(range(1,10000))) is exponential with this implementation).
- **Root cause:** tutor.js takes earlier parts’ definitions from a Run Code suite’s setup or its own hand-written list; the branch predates Phase 9 and 11, and these problems have neither.
- **Recommended fix:** Add `helpers` (official earlier parts) and, for fa22-5a, `calls` without the 10,000-element example to tutor.js’s PROBLEMS list; give fa22-4b a runnable stand-in for its option labels.
- **Impact on other questions:** Only matters once python-tutor is merged with this branch. All 2024/2025 problems build and run.

### T-2 · NEEDS REVIEW · Medium — Python Tutor: two problems run 11,000–13,000 steps

- **Questions:** `fa23-4a`, `fa23-4b`, `fa23-4c`, `sp23-5aplus`
- **Expected:** Python Tutor steps through the code within its step limit.
- **Actual:** fa23-4a: 11,099 executed lines; sp23-5aplus: 12,705. Every other problem is under 2,400.
- **Root cause:** All of the exam’s doctests are run as calls.
- **Recommended fix:** Add a `calls` entry with one small example each (tutor.js does this for fa24-4a and others).
- **Impact on other questions:** Needs a check on pythontutor.com itself: its exact limit was not tested here.

### T-3 · LIMITED · Low — Python Tutor stops at the expected error in Fall 2023 1(c)

- **Questions:** `fa23-1a`, `fa23-1b`, `fa23-1c`, `fa23-1d`
- **Expected:** Each What Would Python Display expression is stepped through.
- **Actual:** next(t) raises StopIteration (the official answer is Error), so 1(d)’s expression never runs.
- **Root cause:** tutor.js runs the prompts one after another in one script.
- **Recommended fix:** Run an expression whose answer is “Error” inside try/except, or put it last.
- **Impact on other questions:** Any What Would Python Display question with an Error answer before the last part.

### L-1 · LIMITED · Medium — Select-all blanks with several correct options can’t be run

- **Questions:** `sp25-3g`, `fa23-4a`, `fa21-5a-a`, `fa22-4b-a`
- **Expected:** Run Code and Python Tutor run the code with the student’s answer in each blank.
- **Actual:** A select-all answer is put in the blank as “option A | option B”. That runs but means something else in Python (bitwise or), and fa22-4b-a’s options are labels (“Option 2”), so its code doesn’t compile.
- **Root cause:** A blank holds one expression; several correct choices can’t all go in it.
- **Recommended fix:** Show a note under Run Code for these blanks (“Select-all blank: run with one option at a time”), or let Run Code fill the first selected option.
- **Impact on other questions:** These four problems have no verified suites for this reason (already documented).

### L-2 · LIMITED · Low — Run Code: code that needs definitions not in the editor

- **Questions:** `fa24-1a`, `fa24-1b`, `fa24-1c`, `fa24-1d`, `fa24-1e`, `sp24-1a`, `sp24-1b`, `sp24-1c`, `sp24-1d`, `sp25-3d`, `sp25-3e`, `sp25-3f`, `sp25-3g`, `fa23-5aplus`, `sp23-2d`, `sp23-2e`, `sp23-2f`
- **Expected:** Run Code on the exam’s code runs it.
- **Actual:** NameError at once: fa24-1 and sp24-1 build Trees/Links at top level; sp25-3b, fa23-5aplus and sp23-2b need part (a)’s definitions.
- **Root cause:** Run Code runs only the editor (the README says it does not add the course’s Link/Tree classes).
- **Recommended fix:** Optionally prepend the course Link/Tree classes (and earlier parts) to the console run, labelled as such.
- **Impact on other questions:** Console only; grading and verified suites are unaffected.

### L-3 · LIMITED · Low — Diagram workspace has no official completed diagram

- **Questions:** `fa25-2a`, `sp25-2a`, `sp25-2b`, `fa24-2a`, `fa24-2b`, `fa24-2c`, `sp24-2a`, `sp24-2b`, `sp24-2c`, `fa23-2a`, `fa23-2b`, `fa22-2a`, `fa22-2b`, `fa22-2c`, `fa22-2d`, `fa22-2e`
- **Expected:** Review shows how the diagram should look.
- **Actual:** Review shows the official answers to the questions about the diagram, and the student’s own diagram work; no completed diagram (none of the PDFs has one; Spring 2024’s is only an external link).
- **Root cause:** By design: the workspace is ungraded scratch work.
- **Recommended fix:** None needed for correctness.
- **Impact on other questions:** All six diagram questions.

### L-4 · LIMITED · Low — A choice the official solution also accepted is graded wrong

- **Questions:** `fa23-6c`
- **Expected:** Constant and Linear both earn the point (the solution says both were accepted).
- **Actual:** Only Linear is correct; the explanation says so.
- **Root cause:** A single-choice part has one correct index.
- **Recommended fix:** Allow `correct` to be a list for single-choice parts.
- **Impact on other questions:** Grading logic; only this part needs it today.

### L-5 · LIMITED · Low — Blanks graded alone where the solution states a joint condition

- **Questions:** `fa21-2a-b`, `fa21-2a-e`
- **Expected:** Per the solution, at least one of (b) and (e) must copy `coins`.
- **Actual:** Each blank accepts only copying answers, so `coins` in one blank (with a copy in the other) is marked wrong.
- **Root cause:** Each part is graded on its own.
- **Recommended fix:** A cross-part rule, or a note in the explanation.
- **Impact on other questions:** These two parts.

### L-6 · LIMITED · Low — Exam layout that the renderer approximates

- **Questions:** `sp23-5cd`, `fa22-4b-a`, `fa22-6a-a`, `fa22-5a-a`, `fa22-5a-b`, `fa22-5a-c`, `fa22-5a-d`, `fa22-5b-i`
- **Expected:** The exam’s layout.
- **Actual:** Spring 2023 5(b) i: blanks (c) and (d) are one two-line blank. Fall 2022 4(b) i: the five options are listed under the code (prompts can’t hold code blocks). Fall 2022 6(a): the graph picture shows under the text that says “The above”. Fall 2022 5: the two printed count_subsets listings are one code block.
- **Root cause:** One code block and one picture per problem; prompts are inline text.
- **Recommended fix:** None needed for correctness.
- **Impact on other questions:** Display only.

### L-7 · LIMITED · Low — Open-ended expression graded by exact match

- **Questions:** `fa23-4b-iv`
- **Expected:** Any correct expression is accepted.
- **Actual:** Three forms checked by running them are accepted; others are marked wrong.
- **Root cause:** Short answers are compared to listed forms.
- **Recommended fix:** Switch to staff grading, or grade by running.
- **Impact on other questions:** This part (the same applies more mildly to every code blank; see G-1).

### L-8 · LIMITED · Low — Optional drawing question has no official answer

- **Questions:** `fa22-8a`
- **Expected:** —
- **Actual:** Free-text box; review says “Solution not yet available”; no topics, so it never appears in topic practice.
- **Root cause:** The PDF’s answer box holds the A+ explanation.
- **Recommended fix:** None.
- **Impact on other questions:** Full Fall 2022 exam and all-topics practice.

### L-9 · LIMITED · Low — Exam doctests that don’t run exactly as printed

- **Questions:** `fa25-6i`, `fa25-6j`, `fa25-6k`, `fa25-6l`, `fa25-6m`, `fa22-4a-a`, `fa22-4a-b`, `fa22-4b-a`, `fa22-4b-b`, `fa22-4b-c`, `fa22-4b-d`, `fa22-5a-a`, `fa22-5a-b`, `fa22-5a-c`, `fa22-5a-d`, `fa22-5b-i`, `sp23-5aplus`
- **Expected:** Python’s doctest passes on the exam’s examples with the official answer.
- **Actual:** Expected output wrapped across lines (Fall 2025 6(d) pizzas(3), Spring 2023 5(c) pack(8)); Fall 2022 4(a) `>>>is_hydra(lerna)` has no space after the prompt; Fall 2022 4(b) prints trees without spaces; Fall 2022 5 has an exponential example.
- **Root cause:** How the PDFs print them.
- **Recommended fix:** None in the exam text; affects Python Tutor (T-1) and anyone running doctest.
- **Impact on other questions:** Verified suites already use runnable copies of these cases.

### L-10 · LIMITED · Low — Parts with no published point value

- **Questions:** `fa25-4b`, `fa25-4c`, `fa25-4d`, `fa25-4e`, `fa25-4f`
- **Expected:** Each part counts toward the score.
- **Actual:** They are graded but left out of the auto-graded score (46 possible for Fall 2025; the results say so).
- **Root cause:** The PDF gives one total for exclude_link, not per blank.
- **Recommended fix:** Split the 4 points only with a source.
- **Impact on other questions:** Fall 2025 score total.

### N-1 · NEEDS REVIEW · Medium — Fall 2022 Q6(b) points: header 6, parts 5 (exam 44 vs printed 45)

- **Questions:** `fa22-6b-a`, `fa22-6b-b`, `fa22-6b-c`, `fa22-6b-d`
- **Expected:** Parts sum to the printed 6.0 points.
- **Actual:** Parts print 1 + 1 + 2 + 1 = 5; kept as printed, so the exam shows 44.
- **Root cause:** Inconsistency in the PDF.
- **Recommended fix:** Correct one value once confirmed.
- **Impact on other questions:** Fall 2022 total.

### N-2 · NEEDS REVIEW · Low — Fall 2022 6(a): exam example disagrees with the official answer

- **Questions:** `fa22-6a-a`
- **Expected:** The printed example g.destinations(0) == [1, 2] holds.
- **Actual:** The official answer returns [2, 1] (edge (0, 2) is added before (0, 1)).
- **Root cause:** Inconsistency in the PDF.
- **Recommended fix:** None until confirmed.
- **Impact on other questions:** This part’s grading is unaffected (exact match on the official expression).

### N-3 · NEEDS REVIEW · Low — Exam text corrected during transcription

- **Questions:** `sp24-4d-a`, `sp24-4d-b`, `sp24-4d-c`, `fa25-6e`, `fa25-6f`, `fa25-6g`, `fa25-6h`, `fa25-6aplus`, `fa25-6j`
- **Expected:** Exam text as printed.
- **Actual:** Spring 2024 4(d): a missing colon after blank (b) was added. Fall 2025 Q6: `num-slices` → `num_slices`, `count-pizzas` → `count_pizzas`, `"-" + x` → `'_' + x`.
- **Root cause:** Typos in the PDFs that would stop the code running.
- **Recommended fix:** None if confirmed.
- **Impact on other questions:** These problems.

### N-4 · FIXED in 11C (was NEEDS REVIEW) · Low — Curly quotes in typed answers are not normalized

- **Questions:** `fa25-6i`, `fa25-6j`, `sp24-3a`, `sp23-5cd`, `sp23-5f`
- **Expected:** A correct answer typed with smart quotes (some phones and Macs substitute them) is graded correct.
- **Actual:** Grading ignores whitespace and straight-quote style but not curly quotes; the answer box sets spellcheck and autocapitalize off, not autocorrect. Not reproduced on a device.
- **Root cause:** `norm()` in app/app.js.
- **Recommended fix:** Map curly quotes to straight ones in `norm()`.
- **Impact on other questions:** Any short answer containing a quote; these five plus fa22-1d (which already lists both forms).

## Question-by-question results

| Exam | Question | Type | Status | Issue | Recommended Action |
|------|----------|------|--------|-------|--------------------|
| Fall 2025 | Q1 (a) `fa25-1a` | Multiple choice | PASS | — | — |
| Fall 2025 | Q1 (b) `fa25-1b` | Short answer | PASS | — | — |
| Fall 2025 | Q1 (c) `fa25-1c` | Multiple choice | PASS | — | — |
| Fall 2025 | Q2 (a) `fa25-2a` | Short answer | LIMITED | L-3 | Leave; add solution images only if staff provide them |
| Fall 2025 | Q3 (a) `fa25-3a` | Multiple choice | PASS | — | — |
| Fall 2025 | Q3 (b) `fa25-3b` | Short answer | PASS | — | — |
| Fall 2025 | Q3 (c) `fa25-3c` | Short answer | PASS | — | — |
| Fall 2025 | Q4 (a) `fa25-4a` | Short answer | PASS | — | — |
| Fall 2025 | Q4 (b) `fa25-4b` | Short answer | LIMITED | L-10 | Leave unless staff give per-blank points |
| Fall 2025 | Q4 (c) `fa25-4c` | Short answer | LIMITED | L-10 | Leave unless staff give per-blank points |
| Fall 2025 | Q4 (d) `fa25-4d` | Short answer | LIMITED | L-10 | Leave unless staff give per-blank points |
| Fall 2025 | Q4 (e) `fa25-4e` | Short answer | LIMITED | L-10 | Leave unless staff give per-blank points |
| Fall 2025 | Q4 (f) `fa25-4f` | Short answer | LIMITED | L-10 | Leave unless staff give per-blank points |
| Fall 2025 | Q5 (a) `fa25-5a` | Multiple choice | PASS | — | — |
| Fall 2025 | Q5 (b) `fa25-5b` | Multiple choice | PASS | — | — |
| Fall 2025 | Q5 (c) `fa25-5c` | Short answer | PASS | — | — |
| Fall 2025 | Q5 (d) `fa25-5d` | Short answer | PASS | — | — |
| Fall 2025 | Q5 (e) `fa25-5e` | Short answer | PASS | — | — |
| Fall 2025 | Q5 (f) `fa25-5f` | Short answer | PASS | — | — |
| Fall 2025 | Q6(a) i. `fa25-6a` | Multiple choice | PASS | — | — |
| Fall 2025 | Q6(b) i. `fa25-6b` | Multiple choice | PASS | — | — |
| Fall 2025 | Q6(b) ii. `fa25-6c` | Multiple choice | PASS | — | — |
| Fall 2025 | Q6(b) iii. `fa25-6d` | Short answer | PASS | — | — |
| Fall 2025 | Q6(c) i. `fa25-6e` | Short answer | NEEDS REVIEW | N-3 | Confirm the corrections |
| Fall 2025 | Q6(c) ii. `fa25-6f` | Multiple choice | NEEDS REVIEW | N-3 | Confirm the corrections |
| Fall 2025 | Q6(c) iii. `fa25-6g` | Multiple choice | NEEDS REVIEW | N-3 | Confirm the corrections |
| Fall 2025 | Q6(c) iv. `fa25-6h` | Short answer | NEEDS REVIEW | N-3 | Confirm the corrections |
| Fall 2025 | Q6(d) i. `fa25-6i` | Short answer | LIMITED | L-9, N-4 (fixed) | Leave the exam text; tests already use runnable copies |
| Fall 2025 | Q6(d) ii. `fa25-6j` | Short answer | NEEDS REVIEW | N-3, L-9, N-4 (fixed) | Confirm the corrections |
| Fall 2025 | Q6(d) iii. `fa25-6k` | Multiple choice | LIMITED | L-9 | Leave the exam text; tests already use runnable copies |
| Fall 2025 | Q6(d) iv. `fa25-6l` | Short answer | LIMITED | L-9 | Leave the exam text; tests already use runnable copies |
| Fall 2025 | Q6(d) v. `fa25-6m` | Short answer | LIMITED | L-9 | Leave the exam text; tests already use runnable copies |
| Fall 2025 | Q6(d) vi vi. `fa25-6aplus` | Code (staff-graded) | NEEDS REVIEW | N-3 | Confirm the corrections |
| Spring 2025 | Q1 (a) `sp25-1a` | Short answer | PASS | — | — |
| Spring 2025 | Q1 (b) `sp25-1b` | Multiple choice | PASS | — | — |
| Spring 2025 | Q1 (c) `sp25-1c` | Multiple choice | PASS | — | — |
| Spring 2025 | Q1 (d) `sp25-1d` | Short answer | PASS | — | — |
| Spring 2025 | Q2 (a) `sp25-2a` | Short answer | LIMITED | L-3, B-2 (fixed) | Leave; add solution images only if staff provide them |
| Spring 2025 | Q2 (b) `sp25-2b` | Short answer | LIMITED | L-3, B-2 (fixed) | Leave; add solution images only if staff provide them |
| Spring 2025 | Q2(c) (c) `sp25-2c` | Multiple choice | PASS | — | — |
| Spring 2025 | Q3(a) i. `sp25-3a` | Multiple choice | PASS | — | — |
| Spring 2025 | Q3(a) ii. `sp25-3b` | Short answer | PASS | — | — |
| Spring 2025 | Q3(a) iii. `sp25-3c` | Multiple choice | PASS | — | — |
| Spring 2025 | Q3(b) i. `sp25-3d` | Short answer | LIMITED | L-2 | Document; optional: add the course classes to Run Code’s console run |
| Spring 2025 | Q3(b) ii. `sp25-3e` | Multiple choice | LIMITED | L-2 | Document; optional: add the course classes to Run Code’s console run |
| Spring 2025 | Q3(b) iii. `sp25-3f` | Multiple choice | LIMITED | L-2 | Document; optional: add the course classes to Run Code’s console run |
| Spring 2025 | Q3(b) iv. `sp25-3g` | Select all | LIMITED | L-1, L-2 | Keep excluded from tests; consider a note under Run Code |
| Spring 2025 | Q4(a) i. `sp25-4a` | Short answer | PASS | — | — |
| Spring 2025 | Q4(a) ii. `sp25-4b` | Multiple choice | PASS | — | — |
| Spring 2025 | Q4(a) iii. `sp25-4c` | Short answer | PASS | — | — |
| Spring 2025 | Q4(b) i. `sp25-4d` | Short answer | PASS | B-1 (fixed) | — |
| Spring 2025 | Q4(b) ii. `sp25-4e` | Multiple choice | PASS | B-1 (fixed) | — |
| Spring 2025 | Q4(b) iii. `sp25-4f` | Multiple choice | PASS | B-1 (fixed) | — |
| Spring 2025 | Q4(b) iv. `sp25-4g` | Short answer | PASS | B-1 (fixed) | — |
| Spring 2025 | Q5(a) i. `sp25-5a` | Multiple choice | PASS | — | — |
| Spring 2025 | Q5(a) ii. `sp25-5b` | Short answer | PASS | — | — |
| Spring 2025 | Q5(b) i. `sp25-5c` | Multiple choice | PASS | — | — |
| Spring 2025 | Q5(b) ii. `sp25-5d` | Multiple choice | PASS | — | — |
| Spring 2025 | Q5(b) iii. `sp25-5e` | Short answer | PASS | — | — |
| Spring 2025 | Q5(c) i. `sp25-5f` | Short answer | PASS | — | — |
| Spring 2025 | Q5(c) ii. `sp25-5g` | Select all | PASS | — | — |
| Spring 2025 | Q5(d) i. `sp25-5h` | Code (staff-graded) | PASS | — | — |
| Fall 2024 | Q1 (a) `fa24-1a` | Short answer | LIMITED | L-2 | Document; optional: add the course classes to Run Code’s console run |
| Fall 2024 | Q1 (b) `fa24-1b` | Short answer | LIMITED | L-2 | Document; optional: add the course classes to Run Code’s console run |
| Fall 2024 | Q1 (c) `fa24-1c` | Short answer | LIMITED | L-2 | Document; optional: add the course classes to Run Code’s console run |
| Fall 2024 | Q1 (d) `fa24-1d` | Short answer | LIMITED | L-2 | Document; optional: add the course classes to Run Code’s console run |
| Fall 2024 | Q1 (e) `fa24-1e` | Short answer | LIMITED | L-2 | Document; optional: add the course classes to Run Code’s console run |
| Fall 2024 | Q2 (a) `fa24-2a` | Short answer | LIMITED | L-3 | Leave; add solution images only if staff provide them |
| Fall 2024 | Q2 (b) `fa24-2b` | Multiple choice | LIMITED | L-3 | Leave; add solution images only if staff provide them |
| Fall 2024 | Q2 (c) `fa24-2c` | Multiple choice | LIMITED | L-3 | Leave; add solution images only if staff provide them |
| Fall 2024 | Q3 (a) `fa24-3a` | Multiple choice | PASS | — | — |
| Fall 2024 | Q3 (b) `fa24-3b` | Short answer | PASS | — | — |
| Fall 2024 | Q3 (c) `fa24-3c` | Short answer | PASS | — | — |
| Fall 2024 | Q4(a) i. `fa24-4a` | Multiple choice | PASS | — | — |
| Fall 2024 | Q4(a) ii. `fa24-4b` | Multiple choice | PASS | — | — |
| Fall 2024 | Q4(a) iii. `fa24-4c` | Short answer | PASS | — | — |
| Fall 2024 | Q4(a) iv. `fa24-4d` | Short answer | PASS | — | — |
| Fall 2024 | Q4(b) i. `fa24-4e` | Multiple choice | PASS | — | — |
| Fall 2024 | Q4(b) ii. `fa24-4f` | Short answer | PASS | — | — |
| Fall 2024 | Q4(b) iii. `fa24-4g` | Multiple choice | PASS | — | — |
| Fall 2024 | Q4(b) iv. `fa24-4h` | Multiple choice | PASS | — | — |
| Fall 2024 | Q4(c) i. `fa24-4i` | Multiple choice | PASS | — | — |
| Fall 2024 | Q4(c) ii. `fa24-4j` | Multiple choice | PASS | — | — |
| Fall 2024 | Q4(c) iii. `fa24-4k` | Short answer | PASS | — | — |
| Fall 2024 | Q4(c) iv. `fa24-4l` | Short answer | PASS | — | — |
| Fall 2024 | Q5(a) i. `fa24-5a` | Short answer | PASS | — | — |
| Fall 2024 | Q5(a) ii. `fa24-5b` | Multiple choice | PASS | — | — |
| Fall 2024 | Q5(a) iii. `fa24-5c` | Multiple choice | PASS | — | — |
| Fall 2024 | Q5(a) iv. `fa24-5d` | Multiple choice | PASS | — | — |
| Fall 2024 | Q5(b) i. `fa24-5e` | Multiple choice | PASS | B-1 (fixed) | — |
| Fall 2024 | Q5(b) ii. `fa24-5f` | Short answer | PASS | B-1 (fixed) | — |
| Fall 2024 | Q5(b) iii. `fa24-5g` | Short answer | PASS | B-1 (fixed) | — |
| Fall 2024 | Q6 (a) `fa24-6a` | Code (staff-graded) | PASS | — | — |
| Spring 2024 | Q1 (a) `sp24-1a` | Multiple choice | LIMITED | L-2 | Document; optional: add the course classes to Run Code’s console run |
| Spring 2024 | Q1 (b) `sp24-1b` | Short answer | LIMITED | L-2 | Document; optional: add the course classes to Run Code’s console run |
| Spring 2024 | Q1 (c) `sp24-1c` | Short answer | LIMITED | L-2 | Document; optional: add the course classes to Run Code’s console run |
| Spring 2024 | Q1 (d) `sp24-1d` | Multiple choice | LIMITED | L-2 | Document; optional: add the course classes to Run Code’s console run |
| Spring 2024 | Q2 (a) `sp24-2a` | Short answer | LIMITED | L-3 | Leave; add solution images only if staff provide them |
| Spring 2024 | Q2 (b) `sp24-2b` | Short answer | LIMITED | L-3 | Leave; add solution images only if staff provide them |
| Spring 2024 | Q2 (c) `sp24-2c` | Short answer | LIMITED | L-3 | Leave; add solution images only if staff provide them |
| Spring 2024 | Q3 (a) `sp24-3a` | Short answer | PASS | N-4 (fixed) | — |
| Spring 2024 | Q3 (b) `sp24-3b` | Multiple choice | PASS | — | — |
| Spring 2024 | Q3 (c) `sp24-3c` | Short answer | PASS | — | — |
| Spring 2024 | Q3 (d) `sp24-3d` | Multiple choice | PASS | — | — |
| Spring 2024 | Q4(a) i. `sp24-4a-a` | Multiple choice | PASS | — | — |
| Spring 2024 | Q4(a) ii. `sp24-4a-b` | Short answer | PASS | — | — |
| Spring 2024 | Q4(a) iii. `sp24-4a-c` | Multiple choice | PASS | — | — |
| Spring 2024 | Q4(b) i. `sp24-4b-a` | Multiple choice | PASS | B-1 (fixed) | — |
| Spring 2024 | Q4(b) ii. `sp24-4b-b` | Short answer | PASS | B-1 (fixed) | — |
| Spring 2024 | Q4(b) iii. `sp24-4b-c` | Multiple choice | PASS | B-1 (fixed) | — |
| Spring 2024 | Q4(b) iv. `sp24-4b-d` | Multiple choice | PASS | B-1 (fixed) | — |
| Spring 2024 | Q4(c) i. `sp24-4c-a` | Short answer | PASS | — | — |
| Spring 2024 | Q4(c) ii. `sp24-4c-b` | Multiple choice | PASS | — | — |
| Spring 2024 | Q4(c) iii. `sp24-4c-c` | Multiple choice | PASS | — | — |
| Spring 2024 | Q4(c) iv. `sp24-4c-d` | Short answer | PASS | — | — |
| Spring 2024 | Q4(d) i. `sp24-4d-a` | Multiple choice | NEEDS REVIEW | N-3 | Confirm the corrections |
| Spring 2024 | Q4(d) ii. `sp24-4d-b` | Short answer | NEEDS REVIEW | N-3 | Confirm the corrections |
| Spring 2024 | Q4(d) iii. `sp24-4d-c` | Multiple choice | NEEDS REVIEW | N-3 | Confirm the corrections |
| Spring 2024 | Q4(e) i. `sp24-4e-a` | Multiple choice | PASS | — | — |
| Spring 2024 | Q4(e) ii. `sp24-4e-b` | Multiple choice | PASS | — | — |
| Spring 2024 | Q4(e) iii. `sp24-4e-c` | Multiple choice | PASS | — | — |
| Spring 2024 | Q4(e) iv. `sp24-4e-d` | Multiple choice | PASS | — | — |
| Spring 2024 | Q4(e) v v. `sp24-4aplus` | Code (staff-graded) | PASS | — | — |
| Fall 2023 | Q1 (a) `fa23-1a` | Multiple choice | LIMITED | T-3 | Optional: wrap prompt calls that are expected to error |
| Fall 2023 | Q1 (b) `fa23-1b` | Multiple choice | LIMITED | T-3 | Optional: wrap prompt calls that are expected to error |
| Fall 2023 | Q1 (c) `fa23-1c` | Multiple choice | LIMITED | T-3 | Optional: wrap prompt calls that are expected to error |
| Fall 2023 | Q1 (d) `fa23-1d` | Multiple choice | LIMITED | T-3 | Optional: wrap prompt calls that are expected to error |
| Fall 2023 | Q2 (a) `fa23-2a` | Select all | LIMITED | L-3 | Leave; add solution images only if staff provide them |
| Fall 2023 | Q2 (b) `fa23-2b` | Short answer | LIMITED | L-3 | Leave; add solution images only if staff provide them |
| Fall 2023 | Q3 (a) `fa23-3a` | Multiple choice | PASS | — | — |
| Fall 2023 | Q3 (b) `fa23-3b` | Short answer | PASS | — | — |
| Fall 2023 | Q3 (c) `fa23-3c` | Multiple choice | PASS | — | — |
| Fall 2023 | Q3 (d) `fa23-3d` | Multiple choice | PASS | — | — |
| Fall 2023 | Q3 (e) `fa23-3e` | Multiple choice | PASS | — | — |
| Fall 2023 | Q3 (f) `fa23-3f` | Multiple choice | PASS | — | — |
| Fall 2023 | Q4(a) i. `fa23-4a` | Select all | NEEDS REVIEW | T-2, L-1 | Trim their calls, as tutor.js already does for similar problems |
| Fall 2023 | Q4(a) ii. `fa23-4b` | Short answer | NEEDS REVIEW | T-2 | Trim their calls, as tutor.js already does for similar problems |
| Fall 2023 | Q4(a) iii. `fa23-4c` | Short answer | NEEDS REVIEW | T-2 | Trim their calls, as tutor.js already does for similar problems |
| Fall 2023 | Q4(b) i. `fa23-4d` | Short answer | PASS | — | — |
| Fall 2023 | Q4(b) ii. `fa23-4e` | Short answer | PASS | — | — |
| Fall 2023 | Q4(b) iii. `fa23-4f` | Select all | PASS | — | — |
| Fall 2023 | Q4(b) iv. `fa23-4b-iv` | Short answer | LIMITED | L-7 | Consider making it staff-graded, or add a verified test |
| Fall 2023 | Q5 (a) `fa23-5a` | Short answer | PASS | — | — |
| Fall 2023 | Q5 (b) `fa23-5b` | Short answer | PASS | — | — |
| Fall 2023 | Q5 (c) `fa23-5c` | Multiple choice | PASS | — | — |
| Fall 2023 | Q5 (d) `fa23-5d` | Multiple choice | PASS | — | — |
| Fall 2023 | Q5(e) (e) `fa23-5aplus` | Code (staff-graded) | BUG | T-1, L-2 | Before merging python-tutor: add helpers/calls for the 2021–2023 problems |
| Fall 2023 | Q6 (a) `fa23-6a` | Multiple choice | PASS | — | — |
| Fall 2023 | Q6 (b) `fa23-6b` | Short answer | PASS | B-1 (fixed) | — |
| Fall 2023 | Q6 (c) `fa23-6c` | Multiple choice | LIMITED | L-4 | Decide whether to accept Constant too (a grading change) |
| Spring 2023 | Q1 (a) `sp23-1a` | Short answer | PASS | — | — |
| Spring 2023 | Q1 (b) `sp23-1b` | Short answer | PASS | — | — |
| Spring 2023 | Q1 (c) `sp23-1c` | Short answer | PASS | — | — |
| Spring 2023 | Q2(a) i. `sp23-2a` | Short answer | PASS | — | — |
| Spring 2023 | Q2(a) ii. `sp23-2b` | Short answer | PASS | — | — |
| Spring 2023 | Q2(a) iii. `sp23-2c` | Short answer | PASS | — | — |
| Spring 2023 | Q2(b) i. `sp23-2d` | Multiple choice | BUG | T-1, L-2 | Before merging python-tutor: add helpers/calls for the 2021–2023 problems |
| Spring 2023 | Q2(b) ii. `sp23-2e` | Short answer | BUG | T-1, L-2 | Before merging python-tutor: add helpers/calls for the 2021–2023 problems |
| Spring 2023 | Q2(b) iii. `sp23-2f` | Short answer | BUG | T-1, L-2 | Before merging python-tutor: add helpers/calls for the 2021–2023 problems |
| Spring 2023 | Q3(a) i. `sp23-3a` | Short answer | PASS | — | — |
| Spring 2023 | Q3(a) ii. `sp23-3b` | Multiple choice | PASS | — | — |
| Spring 2023 | Q3(a) iii iii. `sp23-3a-iii` | Multiple choice | PASS | — | — |
| Spring 2023 | Q3(b) i. `sp23-3d` | Multiple choice | PASS | — | — |
| Spring 2023 | Q3(b) ii. `sp23-3e` | Short answer | PASS | — | — |
| Spring 2023 | Q3(b) iii. `sp23-3f` | Short answer | PASS | — | — |
| Spring 2023 | Q4(a) i. `sp23-4a` | Short answer | PASS | — | — |
| Spring 2023 | Q4(a) ii. `sp23-4b` | Short answer | PASS | — | — |
| Spring 2023 | Q4(a) iii. `sp23-4c` | Multiple choice | PASS | — | — |
| Spring 2023 | Q4(a) iv. `sp23-4d` | Multiple choice | PASS | — | — |
| Spring 2023 | Q4(b) i. `sp23-4e` | Short answer | PASS | — | — |
| Spring 2023 | Q5(a) i. `sp23-5a` | Short answer | PASS | — | — |
| Spring 2023 | Q5(a) ii. `sp23-5b` | Short answer | PASS | — | — |
| Spring 2023 | Q5(b) i. `sp23-5cd` | Short answer | LIMITED | L-6, N-4 (fixed) | Leave (documented) |
| Spring 2023 | Q5(b) ii. `sp23-5e` | Short answer | PASS | — | — |
| Spring 2023 | Q5(b) iii. `sp23-5f` | Short answer | PASS | N-4 (fixed) | — |
| Spring 2023 | Q5(c) i. `sp23-5aplus` | Code (staff-graded) | NEEDS REVIEW | T-2, L-9 | Trim their calls, as tutor.js already does for similar problems |
| Fall 2022 | Q1 (a) `fa22-1a` | Short answer | PASS | — | — |
| Fall 2022 | Q1 (b) `fa22-1b` | Short answer | PASS | — | — |
| Fall 2022 | Q1 (c) `fa22-1c` | Short answer | PASS | — | — |
| Fall 2022 | Q1 (d) `fa22-1d` | Short answer | PASS | — | — |
| Fall 2022 | Q2 (a) `fa22-2a` | Multiple choice | LIMITED | L-3 | Leave; add solution images only if staff provide them |
| Fall 2022 | Q2 (b) `fa22-2b` | Multiple choice | LIMITED | L-3 | Leave; add solution images only if staff provide them |
| Fall 2022 | Q2 (c) `fa22-2c` | Multiple choice | LIMITED | L-3 | Leave; add solution images only if staff provide them |
| Fall 2022 | Q2 (d) `fa22-2d` | Multiple choice | LIMITED | L-3 | Leave; add solution images only if staff provide them |
| Fall 2022 | Q2 (e) `fa22-2e` | Short answer | LIMITED | L-3 | Leave; add solution images only if staff provide them |
| Fall 2022 | Q3(a) i. `fa22-3a-a` | Select all | PASS | — | — |
| Fall 2022 | Q3(a) ii. `fa22-3a-b` | Short answer | PASS | — | — |
| Fall 2022 | Q3(b) i. `fa22-3b-a` | Short answer | BUG | T-1 | Before merging python-tutor: add helpers/calls for the 2021–2023 problems |
| Fall 2022 | Q3(b) ii. `fa22-3b-b` | Short answer | BUG | T-1 | Before merging python-tutor: add helpers/calls for the 2021–2023 problems |
| Fall 2022 | Q3(b) iii. `fa22-3b-c` | Short answer | BUG | T-1 | Before merging python-tutor: add helpers/calls for the 2021–2023 problems |
| Fall 2022 | Q4(a) i. `fa22-4a-a` | Short answer | LIMITED | L-9 | Leave the exam text; tests already use runnable copies |
| Fall 2022 | Q4(a) ii. `fa22-4a-b` | Short answer | LIMITED | L-9 | Leave the exam text; tests already use runnable copies |
| Fall 2022 | Q4(b) i. `fa22-4b-a` | Select all | BUG | T-1, L-1, L-6, L-9 | Before merging python-tutor: add helpers/calls for the 2021–2023 problems |
| Fall 2022 | Q4(b) ii. `fa22-4b-b` | Short answer | BUG | T-1, L-9 | Before merging python-tutor: add helpers/calls for the 2021–2023 problems |
| Fall 2022 | Q4(b) iii. `fa22-4b-c` | Short answer | BUG | T-1, L-9 | Before merging python-tutor: add helpers/calls for the 2021–2023 problems |
| Fall 2022 | Q4(b) iv. `fa22-4b-d` | Short answer | BUG | T-1, L-9 | Before merging python-tutor: add helpers/calls for the 2021–2023 problems |
| Fall 2022 | Q5 (a) i. `fa22-5a-a` | Multiple choice | BUG | T-1, L-6, L-9 | Before merging python-tutor: add helpers/calls for the 2021–2023 problems |
| Fall 2022 | Q5 (a) ii. `fa22-5a-b` | Multiple choice | BUG | T-1, L-6, L-9 | Before merging python-tutor: add helpers/calls for the 2021–2023 problems |
| Fall 2022 | Q5 (a) iii. `fa22-5a-c` | Multiple choice | BUG | T-1, L-6, L-9 | Before merging python-tutor: add helpers/calls for the 2021–2023 problems |
| Fall 2022 | Q5 (a) iv. `fa22-5a-d` | Short answer | BUG | T-1, L-6, L-9 | Before merging python-tutor: add helpers/calls for the 2021–2023 problems |
| Fall 2022 | Q5 (b) i. `fa22-5b-i` | Multiple choice | BUG | T-1, L-6, L-9 | Before merging python-tutor: add helpers/calls for the 2021–2023 problems |
| Fall 2022 | Q5(b) ii (b) ii. `fa22-5b-ii` | Multiple choice | PASS | — | — |
| Fall 2022 | Q6(a) i. `fa22-6a-a` | Short answer | NEEDS REVIEW | N-2, L-6 | Ask staff; possibly accept order-insensitive answers |
| Fall 2022 | Q6(b) i. `fa22-6b-a` | Short answer | BUG | T-1, N-1 | Before merging python-tutor: add helpers/calls for the 2021–2023 problems |
| Fall 2022 | Q6(b) ii. `fa22-6b-b` | Short answer | BUG | T-1, N-1 | Before merging python-tutor: add helpers/calls for the 2021–2023 problems |
| Fall 2022 | Q6(b) iii. `fa22-6b-c` | Short answer | BUG | T-1, N-1 | Before merging python-tutor: add helpers/calls for the 2021–2023 problems |
| Fall 2022 | Q6(b) iv. `fa22-6b-d` | Short answer | BUG | T-1, N-1 | Before merging python-tutor: add helpers/calls for the 2021–2023 problems |
| Fall 2022 | Q7 (a) `fa22-7a` | Code (staff-graded) | PASS | — | — |
| Fall 2022 | Q7 (b) `fa22-7b` | Code (staff-graded) | PASS | — | — |
| Fall 2022 | Q7 (c) `fa22-7c` | Code (staff-graded) | PASS | — | — |
| Fall 2022 | Q7 (d) `fa22-7d` | Code (staff-graded) | PASS | — | — |
| Fall 2022 | Q8 (a) `fa22-8a` | Code (staff-graded) | LIMITED | L-8 | Leave (0 points, staff-graded) or remove if unwanted |
| Fall 2021 | Q1 (a) `fa21-1a` | Select all | PASS | — | — |
| Fall 2021 | Q1 (b) `fa21-1b` | Short answer | PASS | — | — |
| Fall 2021 | Q1 (c) `fa21-1c` | Short answer | PASS | — | — |
| Fall 2021 | Q1 (d) `fa21-1d` | Multiple choice | PASS | — | — |
| Fall 2021 | Q1 (e) `fa21-1e` | Short answer | PASS | — | — |
| Fall 2021 | Q2(a) i. `fa21-2a-a` | Short answer | PASS | — | — |
| Fall 2021 | Q2(a) ii. `fa21-2a-b` | Short answer | LIMITED | L-5 | Leave; or accept `coins` in one blank when the other copies |
| Fall 2021 | Q2(a) iii. `fa21-2a-c` | Short answer | PASS | — | — |
| Fall 2021 | Q2(a) iv. `fa21-2a-d` | Multiple choice | PASS | — | — |
| Fall 2021 | Q2(a) v. `fa21-2a-e` | Short answer | LIMITED | L-5 | Leave; or accept `coins` in one blank when the other copies |
| Fall 2021 | Q2(b) i. `fa21-2b-a` | Short answer | PASS | — | — |
| Fall 2021 | Q2(b) ii. `fa21-2b-b` | Short answer | PASS | — | — |
| Fall 2021 | Q2(b) iii. `fa21-2b-c` | Multiple choice | PASS | — | — |
| Fall 2021 | Q2(b) iv. `fa21-2b-d` | Short answer | PASS | — | — |
| Fall 2021 | Q3(a) i. `fa21-3a-a` | Short answer | PASS | — | — |
| Fall 2021 | Q3(a) ii. `fa21-3a-b` | Short answer | PASS | — | — |
| Fall 2021 | Q3(a) iii. `fa21-3a-c` | Short answer | PASS | — | — |
| Fall 2021 | Q3(a) iv. `fa21-3a-d` | Multiple choice | PASS | — | — |
| Fall 2021 | Q3(b) i. `fa21-3b-a` | Multiple choice | PASS | — | — |
| Fall 2021 | Q3(b) ii. `fa21-3b-b` | Short answer | PASS | — | — |
| Fall 2021 | Q3(c) i. `fa21-3c-a` | Short answer | BUG | T-1 | Before merging python-tutor: add helpers/calls for the 2021–2023 problems |
| Fall 2021 | Q3(c) ii. `fa21-3c-b` | Short answer | BUG | T-1 | Before merging python-tutor: add helpers/calls for the 2021–2023 problems |
| Fall 2021 | Q3(c) iii. `fa21-3c-c` | Multiple choice | BUG | T-1 | Before merging python-tutor: add helpers/calls for the 2021–2023 problems |
| Fall 2021 | Q3(c) iv. `fa21-3c-d` | Short answer | BUG | T-1 | Before merging python-tutor: add helpers/calls for the 2021–2023 problems |
| Fall 2021 | Q4(a) i. `fa21-4a-a` | Short answer | PASS | — | — |
| Fall 2021 | Q4(a) ii. `fa21-4a-b` | Multiple choice | PASS | — | — |
| Fall 2021 | Q4(a) iii. `fa21-4a-c` | Short answer | PASS | — | — |
| Fall 2021 | Q4(a) iv. `fa21-4a-d` | Short answer | PASS | — | — |
| Fall 2021 | Q4(b) i. `fa21-4b-a` | Short answer | PASS | — | — |
| Fall 2021 | Q4(b) ii. `fa21-4b-b` | Short answer | PASS | — | — |
| Fall 2021 | Q4(b) iii. `fa21-4b-iii` | Multiple choice | PASS | — | — |
| Fall 2021 | Q4(c) i. `fa21-4c-a` | Short answer | PASS | — | — |
| Fall 2021 | Q4(c) ii. `fa21-4c-b` | Short answer | PASS | — | — |
| Fall 2021 | Q5(a) i. `fa21-5a-a` | Select all | LIMITED | L-1 | Keep excluded from tests; consider a note under Run Code |
| Fall 2021 | Q5(a) ii. `fa21-5a-b` | Short answer | PASS | — | — |
| Fall 2021 | Q5(b) i. `fa21-5b-a` | Short answer | BUG | T-1 | Before merging python-tutor: add helpers/calls for the 2021–2023 problems |
| Fall 2021 | Q5(b) ii. `fa21-5b-b` | Short answer | BUG | T-1 | Before merging python-tutor: add helpers/calls for the 2021–2023 problems |
| Fall 2021 | Q5(b) iii. `fa21-5b-c` | Short answer | BUG | T-1 | Before merging python-tutor: add helpers/calls for the 2021–2023 problems |

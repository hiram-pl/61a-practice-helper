# CS 61A Practice: prototype

A no-login, browser-based practice tool for CS 61A, laid out like the Digital SAT (problem on the left, answer on the right, timer at the top right). It is seeded with questions from CS 61A **Midterm 2** of **Fall 2025**, **Spring 2025**, **Fall 2024**, **Spring 2024**, **Fall 2023**, **Spring 2023**, **Fall 2022** and **Fall 2021** (`mt2/`).

## Run it

There is no build step and nothing to install. Open `app/index.html` in a browser.

To serve it instead:

```sh
cd app && python3 -m http.server 8000   # then visit http://localhost:8000
```

To deploy, upload the `app/` folder to any static host (Netlify drop, Vercel, GitHub Pages).

## What's in the prototype

- **Landing page:** the `assets/home_page.jpg` banner. Clicking anywhere goes to setup.
- **Setup:** dropdown menus for Topics (with question counts), Exams, Difficulty and Timer (off, or 1–60 minutes), and a Set size number box: 1 up to the number of matching question groups, default 5, typed or stepped with its arrows. A set always includes every part of each question it picks. **Mix topics** (beside Start, on by default) interleaves the set: questions alternate between topics, so two in a row don't share a main topic unless the set leaves no other choice. Turn it off for exam order.
- **Practice:** a split pane. Each question is a **group**: all of its parts (i, ii, iii…) are shown together on the right.
  - The left side shows the shared problem text and an **editable Python editor** (CodeMirror, dark theme, line numbers), where you can type notes, comments, or your own solution. Nothing is run.
  - **Answers fill the code:** picking a choice, or typing an answer, shows it in that part's blank right away. Selected choices are blue, typed answers green, and the active part's blank is outlined. Click a blank to jump to its part.
  - **Annotation toolbar** (top of the left pane): highlighter (select text or code), red pen (freehand), eraser (click or drag), sticky notes, undo/redo, and clear all (asks first). Each question keeps its own annotations.
  - **Sticky notes:** click the note button and a numbered note (Note 1, Note 2, …) appears in the middle of the page, ready to type (a second one steps down and to the right so it doesn't cover the first). Each note has its own toolbar: **Type and move** (click empty space to start a text box, which is as wide as its text and wraps at the note's edge or at a tree beside it; drag a text box or tree by the dotted strip on top of it, or a tree by its background), **highlighter** (select text, or click a tree node; light blue), **red pen**, **eraser**, **tree** (click to place a tree: **+** on a node adds a branch, **×** removes that node with everything below it; arrows and layout are drawn automatically), then undo / redo for that note, delete selected, and clear this note. Text boxes and trees never overlap: one dropped on another slides to the nearest free spot, and one that grows pushes what it reaches downward. A drawing made on a text box or tree moves with it. Drag the top bar to move a note, the corner to resize it: resizing only adds or removes space (never smaller than what is in it), and the note grows on its own when its contents need room. A note can go anywhere, left or right side: it scrolls with the side it is on, and dragging it across the divider moves it there. **–** minimizes a note into a numbered icon in the bottom bar, between Exit and the question button (on a phone, just above the bar; hover: "1st note", "2nd note", in the order the notes were made); clicking the icon brings it back where it was. Both play a short animation. Notes are included in the main undo/redo and clear all (minimizing isn't an undo step); the tutorial has a short animation showing them.
  - Code edits and annotations are saved with the practice set (or exam attempt) they were made in, so resuming brings them back and a new set starts clean. **Reset code** restores the original code and keeps your answers.
  - The right side shows each part in the exam's own format: **round bubbles** for "select exactly one", **square checkboxes** for "select all that apply", and a bordered answer box for written answers.
- **Grading:**
  - **Check Answer** grades the response. **Show Solution** asks for confirmation, then shows the official answer and an explanation.
  - Short answers are compared to the official answer and accepted equivalents, ignoring spaces and quote style.
  - When an answer doesn't match exactly, you can mark it right or wrong yourself.
  - Code questions (the A+ problems) are self-check only.
- **Timer:** works from timestamps, so it stays accurate across tab switches and reloads. It has pause, resume, reset, and hide. At 00:00 it shows a banner, and your answers are kept.
- **Navigator:** a "Question N of M" popover showing which questions are answered, unanswered, or marked for review. Keyboard: `←`/`→` move between questions, `M` marks for review.
- **Run Code:** in Practice Mode and in the editable exam review, **Run Code** under the scratch editor runs the code with Python in your browser ([Pyodide](https://pyodide.org) 0.26.4 in a Web Worker) and shows the console output and any error. It runs exactly what the editor shows, with your current answers in the blanks; an unanswered blank fails as a syntax error. Each run starts with fresh globals, and a run is stopped after 5 seconds (the worker is restarted). Running is feedback only: it never changes answers, grades or scores, and it is turned off during a live exam.
- **Verified tests:** when a question has a *verified* test suite in `app/data/test_suites.js`, the same Run Code click also runs its doctest cases and shows PrairieLearn-style results ("Passed 3/5 tests", with expandable Input / Expected / Actual per case). Each case runs in a fresh namespace; a case that runs over 5 seconds is marked "Timed out" and the remaining cases "Not run" (never counted as passed). Questions without a verified suite show Console Output only.
- **Verified test bank:** 40 coding problems from the six midterms have suites: the exam's own doctests plus added boundary cases, each labelled "From the exam" or "Added". What Would Python Display, environment-diagram and order-of-growth questions have none, and neither do sp25 Q3(b) and sp24 Q4(b), where a wrong choice runs exactly like the official answer, so tests can't tell them apart, or fa23 Q4(a), whose select-all blank has three correct options. fa23 Q5(e) and sp23 Q2(b) have none because their code can't run without part (a)'s definitions, and Run Code runs the student's code on its own before any tests. Suites that need the course's `Link`/`Tree` classes, or functions from earlier parts, provide them in a setup that is named under the results. Every suite is validated by `tests/verify_test_bank.js`: it must pass with the official solution and every accepted answer, and fail for every wrong multiple-choice option and a list of plausible wrong answers (645 versions). The suites were generated and validated by Claude Code and have not been reviewed by course staff.
  - Needs an internet connection the first time: Python (about 10 MB) is downloaded from the jsDelivr CDN, then cached by the browser. It works both when the site is served and when `index.html` is opened directly.
  - Code that uses the course's `Link` or `Tree` classes needs those definitions in the editor; the runner doesn't add them.
  - The worker keeps student code off the page and away from saved data, but it is not a security sandbox (code can still make network requests).
- **Analytics:** `index.html` loads Cloudflare Web Analytics (aggregate visits and page views, no cookies), only when served from `jacobkao-cal.github.io`, so local copies and the tests send nothing. The app sends it nothing: answers, code, grades and exam history never leave the browser. A privacy note on the home page says so.
- **Saving:** everything is stored in `localStorage`. The home page offers **Resume Practice** and **Start Over**.
- **Results:** counts of completed, correct, incorrect, not graded, and unanswered questions, plus time spent. You can retry the missed questions or jump back to any one.
- **Answer history:** every graded answer is kept in a lasting log (`store.history`), across practice sets and exams: the part, right or wrong, when, how it was graded (Check Answer, self-grade or exam), and which set or attempt it came from. Start Over keeps it. Review my mistakes is built from it.
- **Topic mastery (spacing):** the Topics menu marks each topic you have answered as **solid** (right 3 times in a row, on at least 2 different days) or **shaky** (tried, not solid yet); a miss drops a solid topic back to shaky. Questions in shaky topics are 3 times as likely to be picked when Start builds a set, so they keep coming back in later sets, mixed in with everything else, until they are solid.
- **First pick counts:** in Practice Mode, clicking a choice on a one-answer (round bubble) question grades it right away, no Check Answer needed, and that first pick is what goes in the answer history. If it was wrong you can still pick the right one (it shows "Correct now"), but the part stays a miss in the history and the results. Select-all questions still use Check Answer, since one click can't be judged.
- **No repeats:** Start only picks questions you haven't answered yet (a question counts as done once any of its parts has a graded answer in the history). The summary shows how many matching questions are left. When fewer are left than the set size, the rest are questions you've done, the ones answered longest ago first, and the summary says how many. Review my mistakes still brings back done questions on purpose.
- **Your topics:** a card on the home page (both modes) with one bar per topic you've answered, green for right and red for missed, strongest at the top, plus **Strongest** and **Needs the most work** callouts. It is built from the answer history (practice and exams). Topics are ranked by accuracy with one right and one wrong answer assumed, so 1 of 1 doesn't outrank 9 of 10.
- **Review my mistakes:** a button beside Start that builds a set from the answer history instead of at random: mostly (about 70%) questions you got wrong and other questions in the topics you miss most, plus (about 30%) questions you got fully right at least a day ago. It uses the set size, the Topics / Exams / Difficulty filters, this semester's scope and Mix topics, like Start. It is off until a wrong answer matches the filters, and the hint under it says why.

## Files

```
app/
  index.html          page shell
  styles.css          all styling (light, exam-style)
  app.js              screens, state, timer, grading, scratch editor, persistence
  runner.js           Run Code: Pyodide in a Web Worker (lazy load, timeout, fresh globals per run)
  assets/             landing image; environment-diagram and illustration images from the exam PDFs
  vendor/codemirror/  CodeMirror 5.65 (bundled locally, so it works offline)
  data/questions.js   TOPICS, PROBLEMS (left-pane context), QUESTIONS, ANSWER_KEY (kept separate)
  data/in_scope.js    this semester's scope: questions hidden from Practice/Exam mode, scope notes, out-of-scope topics
  data/study_guides.js  Learning Insights study guides (examples checked with doctest)
  data/test_suites.js   Verified Run Code test suites (schema and validation documented in the file)
tests/                browser regression tests (see tests/README.md); not deployed
```

### Adding questions

Add a `PROBLEMS` entry (intro text, plus code with blanks written as `⟦a⟧`). A problem is one question group. Then add one `QUESTIONS` item per part (`problem` names the group, and `blank: 'a'` links the part to the `⟦a⟧` blank), and its answer in `ANSWER_KEY`:

- Multiple choice: `correct` is the index of the right choice. For select-all, it is an array of indices.
- Short answer and code: `accepted` lists the answers, with the official one first.

Topics are configured in `TOPICS`. A topic with no questions (such as Scheme) shows as "No questions yet".

### Updating the scope each semester

`app/data/in_scope.js` decides what is in scope; `questions.js` is never edited for this, so out-of-scope questions stay in the bank for later semesters. Staff usually post the list on Ed (for Fall 2026: Ed #1237, past Midterm 2 exams as practice for 61A Midterm 3 / C88C Midterm 2).

This copy is set up for **Data C88C Midterm 2 (Fall 2026)**: everything through Lecture 20 on [c88c.org/fa26](https://c88c.org/fa26/), on top of the 61A list above. That hides orders of growth, generators and iterators (Lecture 22) as topics, every question built on a generator or on `iter` / `next`, and the earlier mutation and repr parts. Notes explain the older notation (`Link.empty` is now `()`, `t.is_leaf()` is now `is_leaf(t)`) and suggest skipping the A+ questions unless you are comfortable with the rest. No question is about data abstraction itself, so none is removed for it.

- `problems` / `questions`: mark a whole problem or one part `status: 'out'` (hidden, with a `reason`) or `status: 'note'` (still asked, with a `note`). Where the note shows follows where the out-of-scope idea is: a note under `problems` sits in the left pane (the idea is in the question text or code); a note under `questions` sits beside that part's answer box (the answer itself needs it). Use `source: 'ed'` when the Ed post lists it and `'inferred'` when you applied the post's rules to an exam it doesn't cover.
- `outOfScopeTopics`: the topic is hidden from the Practice topic menu and the Exam topic filter; it comes back when removed from this list.
- Exam totals, the full-exam list and the points in each question header only count what is shown. Saved sessions and past attempts that include hidden parts still open.
- Run `node tests/verify_in_scope.js` after editing: it catches ids that don't exist (a typo would leave a question visible) and lists what each exam loses.

## Notes and decisions

- I used plain HTML/JS instead of React/Vite so the prototype opens with a double-click. The data model follows the spec, so moving to React later only means porting the UI.
- Answer keys come from the official solution PDFs. I filled every blank with its official answer and ran the docstring tests to check the transcription.
- The PDFs had a few typos, which I corrected: `num-slices` → `num_slices`, `count-pizzas` → `count_pizzas`, `"-" + x` → `'_' + x`.
- Explanations were written for this prototype and are **not official**. Questions without one say "Explanation not yet available."
- Points for the individual blanks of Fall 2025 Q4(b) aren't listed in the exam, so they are not shown.
- Fall 2024, Fall 2023 and Spring 2023 Midterm 2 total 45 points; Fall 2025, Spring 2025, Spring 2024 and Fall 2021 total 50. These are the PDFs' own point values. Fall 2022 prints 45, but its Q6(b) prints 6 points over parts worth 1 + 1 + 2 + 1, so its part values sum to 44; the parts are kept as printed.
- Environment-diagram questions use the diagram image from the exam PDF (extracted losslessly) in the diagram workspace; `figure.slots` marks its empty blanks. The Spring 2024 solution's completed diagram is only an external link in the PDF, so it isn't included, and no official completed diagram is shown in review (the workspace is ungraded scratch work).
- Fall 2023 Q5's drawing of the doctest trees is not a diagram to fill in, so it is an `illustration`: shown under the question text, with no workspace.
- Spring 2024 Q4(d) prints blank (b) as `if _______` without a colon; the colon is added so the filled-in code runs. Other wording (including the PDF's "postive" in Fall 2024 Q5(b)) is kept as printed.
- A saved practice filter that had every exam of its time selected (the default) picks up exams added later on the next load; a filter narrowed on purpose is kept.
- Spring 2023 Q5(b) i asks for blanks (c) and (d) together, as one 3-point part, so the code has one two-line blank labelled (c, d). Spring 2023 Q3(a) iii asks about a second `prefix` implementation, so it is its own problem (like Spring 2025 Q2(c)).
- Fall 2023 Q6(c): the official solution also accepted Constant; this site only marks Linear (the marked answer) correct, and the explanation says so.
- Answer history only records real evidence. In practice, a part's first verdict in a set counts: if you miss it, fix it and check again, it stays a miss (a new set can count it again). "Not an exact match" isn't a verdict, so the self-grade that follows is recorded instead, and a self-grade changed afterwards (a misclick) updates its entry. Nothing is recorded once the solution has been shown, except the self-grade it asks for. In exams, only automatically graded parts answered right or wrong are recorded at submission: unanswered and staff-graded parts are not evidence of a misunderstanding (the same rule as Learning Insights). Review workspaces record nothing. Self-grades are taken on trust, including code (A+) parts, which can only be self-graded in practice.
- The history is a log, not per-part totals, because spacing needs the order and the days answers were given; per-part and per-topic totals are worked out from it. A part with no topic tags counts toward its question's tags. Saves from before store v6 start with an empty history (past exam attempts are not added to it), and damaged entries are dropped on load.
- C88C scope: a part that uses `map`, `filter` or `zip` only to build a value (Fall 2025 6(m), Fall 2024 4(l), Fall 2021 4(a) blank (c)) stays in scope with a note, even though it is tagged Iterators; a question whose code is a generator is removed whole, even parts tagged only OOP (Spring 2025 Q3), because every blank sits inside the generator. Short answers whose official answer uses `Link.empty` or `.is_leaf()` keep it (questions.js is not edited for scope), so an answer typed the new way is graded by the student after Show Solution; a note beside the part says so.
- The Exam Mode topic filter leaves out out-of-scope topics, like the Practice topic menu; before, it only dropped a topic when no shown part was tagged with it.
- Mix topics: mixing topics makes you decide which idea each question needs instead of reusing the last one, which helps that choice stick. A question's main topic is the tag most of its parts carry (ties go to the one listed first). Each step takes a question from the topic with the most questions still waiting, other than the previous question's, so a large topic is spread through the set instead of piling up at the end; within a topic the order is random. Which questions are picked is unchanged, only their order. Saved preferences from before the box existed get it on; Retry incorrect & unanswered keeps the order of the set it came from.
- Review my mistakes: the weak part comes first from questions whose latest answer on some part was wrong (most wrong parts first), then from other questions in topics you have missed, weakest first. A topic's weakness is its share of wrong answers with one extra right answer assumed, so one miss counts less than a long run of them; a topic never missed is not weak, so topics you haven't tried aren't pulled in. A question you got right in the last day is skipped (it isn't due), and the questions right a while ago come oldest first, so old material comes back before it is forgotten. If either side runs short, the other fills the set; with no right answers at all, the set is all weak questions rather than random filler. Only in-scope parts count, so a miss on a hidden part brings nothing in.
- Topic mastery comes from the answer history in time order: each right answer on a topic extends its run and each wrong one ends it. Solid needs the run to cover 2 different days so one good sitting isn't enough; the topic has to still be right after a break, which is what spacing checks. A part counts toward its own topic tags (or its question's, if it has none). Topics never answered are new and get no badge or extra weight, so the weighting brings back what you have started rather than pulling in everything you haven't. Picking uses weighted sampling without replacement (each question's key is random^(1/weight)); only Start is weighted, since Review my mistakes already builds its set from the history.
- **Rights:** this is an independent student project, not an official CS 61A service. Get permission from course staff before publishing exam text publicly.

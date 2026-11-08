// Walkthrough videos: one official CS 61A YouTube playlist per past exam, keyed by the exam ids in
// questions.js (EXAMS). A question's playlist is found from its problem's exam (PROBLEMS[pid].exam), never from
// where it appears in a practice set or exam, so every question of an exam opens the same playlist.
//
// Only playlists the project owner has verified belong here. An exam without one simply shows no Walkthrough
// button; never add a placeholder or a playlist for a different exam.
//
// The pages that link here are after-the-fact learning pages only: Exam Results (also when reopened from
// Exam History) and Practice Summary. Nothing links to a playlist during an exam in progress.
window.CS61A_WALKTHROUGHS = (() => {
  const PLAYLISTS = {
    fa25: 'https://www.youtube.com/playlist?list=PLx38hZJ5RLZdHLeNazq9I_9fq7RNi88_3', // Fall 2025 Midterm 2
    sp25: 'https://www.youtube.com/playlist?list=PLx38hZJ5RLZdplR_nWuFysBTGb6vS1lPf', // Spring 2025 Midterm 2
    fa24: 'https://www.youtube.com/playlist?list=PLx38hZJ5RLZdLRCSh96VduetN63u1RzEC', // Fall 2024 Midterm 2
    sp24: 'https://www.youtube.com/playlist?list=PLx38hZJ5RLZfbmnkOylwvn2E3G6mhAIYj', // Spring 2024 Midterm 2
    fa23: 'https://www.youtube.com/playlist?list=PLx38hZJ5RLZdFxYu7LlJI8DLhfxpqnSkO', // Fall 2023 Midterm 2
    sp23: 'https://www.youtube.com/playlist?list=PLx38hZJ5RLZenSsdPn9cE8-OOM3nGcg5V', // Spring 2023 Midterm 2
    fa22: 'https://www.youtube.com/playlist?list=PLx38hZJ5RLZcAajfg4WZT-DyuhXMlR_hJ', // Fall 2022 Midterm 2
    fa21: 'https://www.youtube.com/playlist?list=PLx38hZJ5RLZcwZ1N5xCL2y48ca2U9dbw5', // Fall 2021 Midterm 2
  };
  const VALID = /^https:\/\/www\.youtube\.com\/playlist\?list=[A-Za-z0-9_-]+$/;
  // The playlist URL for an exam id, or null when there is none (unknown exam, or a malformed entry).
  function getWalkthroughPlaylist(examId) {
    if (typeof examId !== 'string' || !Object.prototype.hasOwnProperty.call(PLAYLISTS, examId)) return null;
    const url = PLAYLISTS[examId];
    return typeof url === 'string' && VALID.test(url) ? url : null;
  }
  return { version: 1, PLAYLISTS, getWalkthroughPlaylist };
})();

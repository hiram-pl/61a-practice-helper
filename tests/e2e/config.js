// Shared settings for the browser tests. Override with environment variables:
//   CHROME=/path/to/chrome   APP_URL=http://localhost:8000/
const path = require('path');
const { pathToFileURL } = require('url');

const DEFAULT_CHROME = {
  darwin: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  linux: '/usr/bin/google-chrome',
  win32: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
}[process.platform];

module.exports = {
  APP_URL: process.env.APP_URL || pathToFileURL(path.join(__dirname, '..', '..', 'app', 'index.html')).href,
  CHROME: process.env.CHROME || DEFAULT_CHROME,
  // The first-visit tour (app/tour.js) would cover the page and hold timers, so other suites start with it
  // declined, on every load (including after a test clears localStorage). tour.test.js covers the tour itself.
  skipTour: (page) => page.evaluateOnNewDocument(() => {
    try { if (!localStorage.getItem('cs61a-practice:tour')) localStorage.setItem('cs61a-practice:tour', '{"asked":true,"on":false,"seen":{}}'); } catch (e) { /* no storage */ }
  }),
  // Load the app without this semester's scope (app/data/in_scope.js), so every transcribed question is offered.
  // Suites that check an exam against its PDF (all parts, points, official answers) use this; in_scope.test.js
  // covers what the scope hides and notes.
  fullBank: (page) => page.evaluateOnNewDocument(() => {
    Object.defineProperty(window, 'CS61A_SCOPE', { configurable: true, get: () => undefined, set: () => {} });
  }),
};

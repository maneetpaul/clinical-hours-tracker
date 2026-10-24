# MFT Hours Tracker

A simple web tool that shows MFT graduate students their weekly pace toward their program's total and relational hour requirements.

No install, no account, nothing sent anywhere. Numbers are saved in the student's own browser.

**Live site:** [maneetpaul.github.io/clinical-hours-tracker](https://maneetpaul.github.io/clinical-hours-tracker)

## How to use

1. Enter your total hours and relational hours so far.
2. Optionally, enter how many clients you see each week (total, and how many of those are relational).
3. Pick your deadline (defaults to the next June 1).

The answer appears right under the boxes: the hours per week you need, and, if you entered clients, the month you're likely to finish.

## Program requirements

Defaults are 500 total and 250 relational hours. Students can change them with the "Does your program need different totals?" link.

## Maintaining this after it's handed off

Everything is plain HTML, CSS and JavaScript. There is no build step and no libraries to update.

- **Change the defaults** (500 / 250, the June 1 deadline, the one-hour-per-client assumption) in the `CONFIG` block at the top of `app.js`.
- **After editing `app.js` or `style.css`,** bump the `?v=N` number on both links in `index.html`. Otherwise returning visitors keep the old files.
- **To publish,** push to `main`. GitHub Pages updates the live site within a minute or two.
- **To preview locally,** open `index.html` in a browser, or run `npx serve -p 5500 .`

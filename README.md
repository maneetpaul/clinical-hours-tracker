# MFT Clinical Hours Tracker

A simple, single-file web tool for tracking progress toward MFT licensure hour requirements.

No install, no account, no data stored anywhere — just open the file in a browser.

## Requirements tracked

| Requirement | Hours |
|---|---|
| Total Clinical Hours | 500 |
| Relational Hours | 250 |

## How to use

1. Download `index.html`
2. Open it in any web browser
3. Enter your current total hours and relational hours
4. Set your deadline date
5. The dashboard calculates your required pace automatically

## What it shows

- Progress rings for total and relational hours
- Weeks remaining until your deadline
- Hours per week needed (color-coded: green ≤5, yellow ≤9, red >9)

## Customizing requirements

If your program has different hour requirements, open `index.html` in a text editor and change these two lines near the top of the `<script>` section:

```js
const TOTAL_REQUIRED = 500;
const REL_REQUIRED = 250;
```

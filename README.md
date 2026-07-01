# CHUNK // SOLVENCY v0.7

A private, local-first, phone-installable solvency board. This release focuses on macro legibility: a two-line IN / OUT ledger, discrete retained tails, a configurable hard-cycle deadline, daily duty planning, and exact expandable evidence maps on cards.

## What changed in v0.7

- **Two-line ledger:** IN is its own continuous row; OUT is the row below. There is no fake divider void inside either mass.
- **Discrete stacked tails:** at $100/cell, every category keeps its own small remainder as a distinct colored partial cell at the far end of IN or OUT. The app no longer fuses all tails into one anonymous residue color.
- **Hard monthly cycle:** default deadline is the next first of the month. Change it in `SETTINGS → Hard cycle deadline`. Campaign math, scheduled inbound, daily recommendation, and task equivalents now all refer to that same date.
- **Today’s Duty:** top-left current-event card opens today’s calendar square. It shows a real daily target when you set one, or a suggested pace to close the unmapped gap by the chosen deadline.
- **Exact / Tight cards:** exact mode (the default) expands large cards and shows all $25 evidence cells, up through a safe high cap. Tight mode restores compact capped card maps.

## Updating from v0.6

1. Export a backup from v0.6 once you have real data.
2. Unzip v0.7.
3. Copy the **contents inside** `chunk-solvency-v0.7` into your local cloned `chunk-solvency` repo folder. Replace duplicates. Do not overwrite the hidden `.git` folder.
4. Stage, commit, and push.

Suggested commit message:

```
Install two-line ledger and active duty planning v0.7
```

Your v0.6 saved state migrates automatically on the same URL/browser. v0.7 changes display defaults but does not erase your actual values. Your data remains local to each browser/device. Keep backup JSON files private and out of GitHub.

## Install on iPhone

Open the GitHub Pages URL in Safari, then use **Share → Add to Home Screen → Open as Web App → Add**. After updating, open the direct Pages URL once in Safari before relaunching the Home Screen app so the new service worker can update its cache.

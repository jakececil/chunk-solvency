# CHUNK // SOLVENCY v0.6

A private, local-first financial visualization that turns money into editable physical matter. Version 0.6 adds the **IN / OUT ledger**: full $100 (or $25) cells remain tied to their source category, while all small remainders can be collected at the tail of each side for a clean comparison without blank accounting voids.

## What changed

- **Default quantum is now $100/cell.** Switch to $25 for closer inspection at any time.
- **IN / OUT is the default Continuous Body mode.** Every visible segment is classified as incoming matter or outgoing pressure. The first OUT cell gets a hard visual boundary without consuming a blank cell.
- **Collect / Inline tail switch.** Collected is the default; all small non-full remainders pool at the far end of IN or OUT. Inline retains the detailed fractional-tail behavior.
- **Expanded current-events deck:** cycle gap, scheduled inbound, full task equivalents, and a month-by-month work log.
- **Calendar goals now affect plan metadata.** Planned daily targets appear in Scheduled Inbound and task-equivalent calculations.
- **Log confirmed earnings on any day.** This creates a durable monthly work-history metric. It deliberately does not auto-increase True Cash—update cash when the money actually lands.
- **Debt dragon cards are fully clickable.** Tap the card to tune the body; the two buttons still target body and minimum separately.
- **All zero anchors remain in the key.** $0 is a valid state, not deletion.

## Update path

1. Export a JSON backup from the currently deployed app once you have meaningful numbers.
2. Unzip this release.
3. Copy the **contents inside** `chunk-solvency-v0.6` into the existing local `chunk-solvency` Git repository. Do not copy the outer folder itself.
4. Let the operating system replace duplicate files. Do not delete the hidden `.git` directory in the repository.
5. In VS Code Source Control, stage all changes, commit, and push.

Suggested commit message:

```
Install IN OUT ledger and campaign deck v0.6
```

After GitHub Pages deploys, open the direct Pages URL once and hard refresh. The service worker cache is versioned as `v0.6.0`.

## Data

All live financial state stays in the browser's local storage for the exact device and browser. GitHub hosts code only. Exported JSON is sensitive; keep it private and never commit it to the repository.

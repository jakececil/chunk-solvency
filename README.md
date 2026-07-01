# CHUNK // SOLVENCY v0.8 — calibration + spectrum pass

This is the first post-beta polish pass after the packed-tail ledger locked in.

## What changed

- **The core two-line IN / OUT Body stays untouched.** Full cells remain sequential; each category’s own partial tail remains a solid, packed, clickable physical fragment at its side’s end.
- **$100 is the default display quantum** for the Body *and* the cards below it. Switch to `$25 / CELL` whenever you want a closer inspection. The card maps now obey the same selected resolution rather than permanently visualizing every amount in $25 pieces.
- **Board settings became the calibration room.** It now includes the hard deadline, time horizon, body defaults, card density, cell quantum, colorway, demo loading, and **Start Clean**. The destructive controls are no longer sitting in the primary interface.
- **Colorway profiles** were added. `Flow spectrum` is the default: IN remains cool (indigo hard assets → violet pipeline → green true cash → cyan buffer → blue investments), while OUT heats from yellow → orange → red dragon mass. `Midnight signal` and `Markerboard` are alternate moods.
- The visible scrollbar now changes from green near the top of the board toward yellow, orange, and red as you scroll deeper. iPhone Home Screen web apps often hide the scrollbar entirely; desktop browsers should show the treatment.
- **Today’s Duty now names the current day** and includes a compact context sentence. It remains the direct button into today’s calendar square.
- **Mapped Inbound now names its hard-cycle cutoff.** Its copy explicitly distinguishes cycle-wide planned/pipeline money from what is expected specifically today.
- `PACK AT END` and `KEEP INLINE` are more plainly named. Pack at End remains the default macro mode.

## Update from v0.7.1

1. Export a backup from v0.7.1 once you have anything irreplaceable entered.
2. Unzip `chunk-solvency-v0.8.zip`.
3. Copy the **contents inside** `chunk-solvency-v0.8` over your cloned local `chunk-solvency` repository folder. Replace duplicate files. Do **not** replace the hidden `.git` folder.
4. In VS Code Source Control, stage all changes, commit, and push.

Suggested commit message:

```text
Calibrate colorways settings and card quantum v0.8
```

## State and privacy

The board is still local-first. GitHub Pages hosts code only; financial state saves in the browser/device where you use the app. v0.8 searches for the prior v0.7.1 state automatically and migrates it to the new versioned local store. Export/import is still the deliberate bridge between desktop and phone.

After GitHub Pages rebuilds, open the direct Pages URL in Safari once before launching the Home Screen app. The service-worker cache is versioned as `v0.8`, so that visit gives the installed web app the new shell.

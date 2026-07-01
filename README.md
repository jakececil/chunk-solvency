# CHUNK // SOLVENCY — v0.4.1

A local-first visual financial board. This build is the **continuous-body / mobile repair** pass, plus the initialization hotfix.


## v0.4.1 hotfix — required

The original v0.4 JavaScript tried to create/load the board before several helper constants had initialized. That could leave the screen stuck on **“Loading board.”** v0.4.1 moves the local-state load to the correct point in startup and changes the service-worker cache name so the repaired code can replace the failed shell.

If v0.4 showed the loading state, overwrite with this build. You do **not** need to erase browser storage; your existing local state should still be read normally once the repaired script runs.

## What changed in v0.4

- **Continuous body is genuinely gapless.** Every visible little square is one quarter-cell. The board renders all visible quarter-cells for every positive segment in a single uninterrupted chain—assets, cash layers, obligations, debt minimums, and full dragon mass. A $9,200 balance at a $100 major-tile scale renders all 368 $25 cells.
- **No mobile floating-label void field.** Segment names now live in a compact clickable map above the body; the body itself is only contiguous matter.
- **Mobile layout rebuilt.** The full body uses 16 columns on normal phones, 14 on narrow phones, and 32 on wide desktops. It has no horizontal ribbon or hidden overflow requirement.
- **Quarter logic retained.** A $100 major tile is four $25 cells by default. Exact dollar values remain visible even when a number has to round to the nearest visible $25 cell.
- **Universal direct tuner.** Tap any continuous-body color, territory card, obligation, debt button, or life track to open the same compact adjustment sheet. It supports exact typing, ± quarter-cell buttons, and a horizontal finger-drag dial.
- **One-tap commit path.** The compact tuner uses a standard button event, not a native dialog/form submission. `APPLY TO BOARD` is fixed in the same window and should not require a first “recognition” tap.
- **No global touchend prevention.** v0.3’s aggressive double-tap guard was removed because it could plausibly contribute to ghost / two-tap behavior. The viewport remains locked and inputs stay 16px to prevent iPhone text-field zoom.
- **Every calendar square is active.** The rolling seven-across time corridor begins at today and has no blank leading cells. Tap any day to set a non-binding earning goal, add a pipeline landing, or add an obligation due that day.
- **Calendar connections are automatic.** A pipeline item with an expected landing date, a one-off obligation due date, a monthly obligation, and a debt minimum all appear on their matching time-corridor days.
- **Local state persists and v0.3 state migrates.** The app reads `chunk-solvency-v3` / v0.2 / v0.1 browser state once if the new v0.4.1 state has not been created yet.

## Privacy

The working financial board is saved only inside the browser on that particular device. GitHub Pages hosts the code, not your numbers.

- Desktop and iPhone state are intentionally separate.
- Use **EXPORT** to create a private JSON backup.
- Use **IMPORT** to transfer a backup to another device.
- Never upload an exported backup JSON file into the GitHub repo.

## Updating the existing repository

1. Unzip `chunk-solvency-v0.4.1.zip`.
2. Open your local cloned `chunk-solvency` repo folder in File Explorer.
3. Copy the **contents inside** `chunk-solvency-v0.4` into that repo folder.
4. When Windows asks, choose **Replace the files in the destination**.
5. Do not delete the hidden `.git` folder in the repo.
6. In VS Code Source Control, stage all changes, commit, and push.

Suggested commit message:

```text
Install gapless continuous body and day planner v0.4
```

The repository root should directly contain:

```text
index.html
styles.css
app.js
manifest.json
sw.js
icons/
README.md
.nojekyll
.gitignore
```

## GitHub Pages / phone refresh note

Because this is a PWA, Safari can hang on to an old cached app shell for a moment after you push.

1. Push v0.4.1.
2. Open the GitHub Pages URL in Safari rather than from the old Home Screen icon.
3. Reload it once.
4. If the old build persists, delete the prior Home Screen icon and add the page again through Safari’s **Share → Add to Home Screen**.

The app’s service worker cache name is now `chunk-solvency-v0-4-1`, so a fresh deploy should replace prior cached assets automatically.

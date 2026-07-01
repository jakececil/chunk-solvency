# CHUNK // SOLVENCY v0.5

A local-first personal solvency board. The app itself is static and safe to host on GitHub Pages; its live numbers remain in the browser’s local storage on each device.

## What changed in v0.5

- **Exact resolution switch:** choose **$25 per body cell** or **$100 per body cell** from the Continuous Body controls or Settings. The final cell is a literal partial tail rather than a rounded lie.
- **Continuous / Exploded toggle:** continuous mode is a single gapless organism; exploded mode contains each visible territory in a tidy rectangle, about five $100 tiles wide when possible.
- **Persistent tuning key:** every territory remains in the key even at `$0`. Zero is a valid state, not disappearance.
- **Visibility controls:** each key row has an ON/OFF switch to include or hide that segment from the body without deleting it.
- **Universal placement control:** add a money object, obligation, debt dragon, or life track from the same control station above the Body.
- **Every body segment is tunable:** liquidity territories, obligations, debt body, debt minimums, and sanctioned-life reserves all use direct typing, `$25` nudge buttons, and left/right finger drag.
- **Card evidence restored:** territory, obligation, and dragon cards use compact quarter-cell tile evidence. Life tracks use hollow quarter-cells that fill toward their target.
- **Mobile pass:** body uses a narrow phone grid, flow key collapses cleanly, and sheet action buttons stay fixed in the visible sheet footer.

## First launch

Open `index.html` locally to inspect the board. It starts with fake demo terrain; press **START CLEAN** before entering real numbers.

## Updating your current GitHub repo

1. **Export your board first** inside the app if you have entered real values. Keep the JSON private.
2. Unzip this package.
3. In File Explorer, open the extracted `chunk-solvency-v0.5` folder.
4. Open your existing cloned `chunk-solvency` repository folder in a second Explorer window.
5. Copy the **contents inside** `chunk-solvency-v0.5` into the repository folder. Do not copy the outer v0.5 folder itself. Let Windows replace duplicates.
6. In VS Code Source Control, stage all changes, commit, and push.

Suggested commit message:

```text
Install exact quantum controls and exploded body v0.5
```

## GitHub Pages and iPhone refresh

GitHub Pages will rebuild after your push. Open the site directly in Safari once after the deployment to let the new service-worker cache install. If the Home Screen app keeps showing an older visual shell, close it, open the Pages URL in Safari, then add it to Home Screen again.

## Privacy note

Never upload the exported JSON backup to GitHub. It contains your actual financial state. GitHub hosts the code only; browser storage holds the live board separately on desktop and iPhone.

# CHUNK // SOLVENCY v1.0

A private, local-first solvency board. GitHub Pages hosts the interface; live board data remains in the browser on each device.

## v1.0: palette control without accidental commitment

- **Color Composer:** palette chips now open a candidate-only composer. Pick a color, inspect it, cancel it, or stage it. Nothing reaches the board until **STAGE COLOR**, and nothing persists until **SAVE CALIBRATION**.
- **Named custom profile workflow:** **MAKE CUSTOM COPY** clones the active colorway. Name it, stage individual segment colors, then save it into your private palette list. The palette grid stays compact in two columns on mobile.
- **Pipeline is fully controllable:** every palette profile writes its Pipeline color into the live `--pipe` variable; Pipeline is no longer locked to lavender.
- **Safer settings topology:** local demo/reset controls remain below all normal calibration and palette controls in a clearly marked destructive zone.
- **Layer dragging retained:** desktop layer cards can be dragged directly. There is no persistent grip-bar clutter; while dragging, a luminous line appears at the exact insertion boundary. `↑ / ↓` remains available everywhere, including mobile.
- **Quiet living background:** subtle low-contrast gradient blooms drift behind the board. **Ambient board drift** can switch it off for a still field.
- **Card header cleanup:** Liquidity cards no longer repeat their category name in the header and title.

## Update from v0.9

1. In the existing app, choose **EXPORT** if real values have been entered.
2. Unzip this release.
3. Copy the **contents inside** `chunk-solvency-v1.0` into the existing local GitHub repo folder.
4. Replace duplicates but keep the hidden `.git` folder.
5. In VS Code Source Control: stage all → commit → push.

Suggested commit message:

```text
Promote CHUNK Solvency to v1.0 palette and layer polish
```

The app automatically migrates a saved v0.9/v1 board into the v1.0 local-storage key on first launch. Export is still the safety line.

## GitHub Pages

The repository root should contain these files directly:

```text
index.html
styles.css
app.js
manifest.json
sw.js
icons/
README.md
```

GitHub: **Settings → Pages → Deploy from a branch → main → /(root)**.

After deployment, open the direct Pages URL once in Safari before reopening the Home Screen app. This lets the v1.0 service-worker shell replace prior cached code.

## Privacy

- Financial values persist in browser storage on the device/browser.
- The GitHub repository contains application code only.
- Exported JSON contains financial values. Keep it private and never commit it to GitHub.

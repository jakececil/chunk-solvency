# CHUNK // SOLVENCY v1.0.1

A private, local-first solvency board. GitHub Pages hosts the interface; live board data remains in browser storage on each device.

## v1.0.1 — cleanup calibration

- **Palette Lab is full-width again.** The Board Settings form is two columns for ordinary fields; the Custom Profile Lab and Local Board Tools always span the entire sheet. Palette slots remain a readable two-column grid, including on mobile.
- **Destructive controls are isolated.** Load Demo Terrain and Start Clean live in their own full-width danger zone beneath normal board and palette calibration.
- **Color Composer stays put.** Staging a color no longer ejects the composer. Try values, stage them to the temporary draft, keep comparing, then close or discard at leisure. Only **Save Calibration** persists the custom profile.
- **Motion speed control.** Background drift now has a dedicated speed slider, a stronger visible travel path, and a default that is actually detectable. Set the field to Still at any time.
- **IN / OUT divider in the tuning key.** Key layers are now in visibly separated groups. Drag-and-drop remains inside each group and preserves the luminous insertion line; arrows remain for mobile and precise nudges.
- **Liquidity cards reclaimed space.** Repeated “Liquidity Territory / Direct Total” copy is removed so the useful name, amount, and evidence map lead.

## Update

1. In the current app, choose **EXPORT** if you have entered real values.
2. Unzip this release.
3. Copy the **contents inside** `chunk-solvency-v1.0.1` into the existing local GitHub repo folder.
4. Replace duplicates but keep the hidden `.git` folder.
5. In VS Code Source Control: stage all → commit → push.

Suggested commit message:

```text
Polish v1.0.1 settings layout motion and key groups
```

The app searches previous local board keys and migrates the saved terrain forward. Export remains the safety line.

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

After deployment, open the direct Pages URL once in Safari before reopening the Home Screen app so the new service-worker shell replaces the prior cached build.

## Privacy

- Financial values persist in browser storage on the device/browser.
- The GitHub repository contains application code only.
- Exported JSON contains financial values. Keep it private and never commit it to GitHub.

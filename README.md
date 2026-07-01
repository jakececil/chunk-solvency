# CHUNK // SOLVENCY v0.9

A private, local-first solvency board. GitHub Pages hosts the interface; the live board state stays in the browser on each device.

## v0.9: palette lab + movable Body layers

- **The Continuous Body now comes first.** The IN / OUT physical ledger sits immediately under the Body heading; controls and the tuning key sit below it.
- **Custom palette profiles.** In **Board settings → Custom profile lab**, create named editable palettes from any base colorway. Every major visual variable is independent:
  - hard assets, pipeline, true cash, buffer, investments
  - sanctioned life
  - one-off, variable/flexible, and fixed/essential pressure
  - debt minimum and debt body mass
- **Direct segment recoloring.** Tap any Body segment, then use **Segment color** in its tuning sheet. This automatically creates or updates the active custom profile.
- **Reorderable layers.** The tuning key now has **↑ / ↓** controls for every segment. On desktop, whole key items can also be dragged by their grip. The system keeps IN and OUT as distinct rows, but you can change priority/order within either side.
- **Date fields expanded.** Expected landing dates and other date controls now use full-width formatting inside the editor sheets.
- The old **demo terrain banner** is gone from the main board. Demo/reset tools remain inside Settings.

## Update from an earlier version

1. In the existing app, use **EXPORT** once your local board contains real values.
2. Unzip this release.
3. Copy the **contents inside** `chunk-solvency-v0.9` into your existing local GitHub repo folder.
4. Replace duplicates. Keep the repo's hidden `.git` folder intact.
5. In VS Code Source Control, stage all changes, commit, and push.

Suggested commit message:

```text
Install palette profiles and movable Body layers v0.9
```

Because the app moves from the v0.8 local-storage key to a newer key, it will automatically import the most recent saved v0.8 board on first launch. The export is still your safety line.

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

In GitHub: **Settings → Pages → Deploy from a branch → main → /(root)**.

After the new version deploys, open the direct Pages URL in Safari once before launching the existing Home Screen icon. This lets the v0.9 service-worker cache replace the previous shell.

## Privacy model

- Financial values persist in browser storage on the individual device.
- The GitHub repository contains only application code.
- Exported JSON backups include your actual values. Keep them private; do not commit them to GitHub.

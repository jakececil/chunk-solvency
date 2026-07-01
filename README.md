# CHUNK // SOLVENCY v0.3

A local-first financial terrain board. There is no account, server, bank link, analytics, or database. The app code can be hosted on GitHub Pages, but the actual board state is stored locally in each browser/device.

## What changed in v0.3

- **No input zoom ambush:** the app now uses a locked mobile viewport, 16px form inputs, no autofocus on dialogs, and gesture-zoom suppression. Opening an editor should no longer fling iPhone Safari into a close-up of a text field.
- **The Continuous Body:** a literal, untruncated flow map showing every amount as major tiles divided into four quarter-cells. At the default scale, one major tile is $100 and one visible quarter-cell is $25. The dollar readout remains exact; the visual body rounds only to the nearest $25 quarter-cell, so $66 becomes three visible quarter-cells instead of pretending to be a whole $100 chunk.
- **Square week calendar:** the Time Corridor is a complete seven-column calendar grid. It shows the whole horizon at once rather than requiring horizontal ribbon scrolling.
- **Tap-to-tune territories:** tap hard assets, pipeline, true cash, buffer, or investments to open a direct territory tuner. Type an exact amount or drag left/right in $25 quarter steps. This is a board-level total control; individual named entries remain editable below.
- **Correct territory behavior:** tapping an asset territory opens that territory’s tuner, not an accidental “new money object” form.
- **Debt cards are dossiers:** debt mass is fully represented in the Continuous Body. The cards remain compact summaries instead of lying with truncated chunk squares.

## First run

1. Unzip the package.
2. Open the `chunk-solvency-v0.3` folder in VS Code.
3. Open `index.html` in a browser, or use Live Server.
4. The initial figures are **demo terrain**. Use **START CLEAN** when you want to enter real numbers.

## Updating your existing GitHub repo from v0.2

Do this in the local cloned repository folder you created last time. Do **not** delete the `.git` folder.

1. Unzip this v0.3 package somewhere separate.
2. Open two File Explorer windows:
   - the unzipped `chunk-solvency-v0.3` folder;
   - your local cloned `chunk-solvency` repository folder.
3. Copy the **contents inside** `chunk-solvency-v0.3` into the existing local `chunk-solvency` repository folder.
4. When Windows asks, choose **Replace the files in the destination**.
5. In VS Code, open the local `chunk-solvency` repository folder.
6. Open Source Control (`Ctrl + Shift + G`), stage all changes, commit with:

   ```text
   Rebuild flow body and quarter-cell controls in v0.3
   ```

7. Push / Sync Changes.

Your existing locally saved v0.2 board should migrate automatically when v0.3 opens on the same browser + site URL. Still, export a backup before doing heavy edits.

## GitHub Pages + iPhone

Keep GitHub Pages pointed at the `main` branch and `/(root)` source. After pushing, wait briefly for Pages to rebuild.

Because this is a Progressive Web App, an older Home Screen install can show cached v0.2 files for a little while. If the new build does not appear:

1. Open the GitHub Pages URL directly in Safari.
2. Close and reopen Safari, then revisit the URL.
3. If needed, remove the old Home Screen icon and add the site again: **Share → Add to Home Screen → Open as Web App → Add**.

## State + backups

- **Automatic save:** all edits are saved in local browser storage.
- **Different device = different state:** desktop and iPhone do not share their saved board automatically.
- **Move a board:** use **EXPORT** on one device and **IMPORT** on the other.
- **Do not commit exports:** exported JSON files contain your actual financial information. Keep them outside the public repository.

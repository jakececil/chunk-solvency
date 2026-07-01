# CHUNK // SOLVENCY

A private, local-first visual financial instrument.

It is **not** connected to a bank, does not create an account, and does not send numbers to a server. The app is a static website. Your editable financial state saves inside the browser on the device where you use it.

## What this first version does

- Shows five distinct asset layers: hard assets, pipeline, immediate cash, protected buffer, and investments.
- Calculates active cash, monthly wall, active-cash runway, debt total, and a forecast through upcoming scheduled events.
- Turns pipeline + due dates + recurring bills + debt minimums into one continuous time flow.
- Tracks debt balances and monthly minimums as “debt dragons.”
- Answers the practical question: **what does one more task actually change?**
- Saves every edit locally and automatically.
- Exports/imports an encrypted-by-nobody-but-you JSON backup file. Treat this backup as private financial data.
- Is installable from Safari to an iPhone Home Screen after GitHub Pages hosting.

## Important privacy rule

**Do not put a backup JSON file in this repository.**

GitHub hosts this app’s code. Your live values are stored in browser local storage, so they do not automatically go into GitHub. A JSON export is different: it contains your actual numbers. Keep it in Files/iCloud Drive/private storage only.

Also: browser storage belongs to one exact device + one exact website address. Your phone and your PC will each have their own local board unless you export from one and import to the other. Before changing the repository name or Pages URL, export a backup first.

---

# First launch on your PC

1. Unzip this folder somewhere boring and permanent, such as `Documents/Projects/chunk-solvency`.
2. Open **VS Code**.
3. Choose **File → Open Folder** and select the `chunk-solvency` folder.
4. For a fast preview, open `index.html` in a browser.
   - The interface, editing, and local save all work this way.
   - The fully offline “installed app” behavior only activates once it is hosted or served through a local web server.
5. You will initially see **demo terrain**. It is fake data purely so the interface has a visible body.
   - Press **Start clean** at the top to erase it.
   - Then add your own cash, obligations, and debt dragons.

## Recommended local preview (optional)

If you already use the VS Code extension **Live Server**, right-click `index.html` and choose **Open with Live Server**. That is only for previewing; it is not required for GitHub Pages.

---

# Put it on GitHub Pages

This project does not need npm, Node, a terminal, a database, or a build process.

## Easiest browser-only route

1. On GitHub, create a new repository called something simple, such as `chunk-solvency`.
2. Choose **Public** for the simplest free Pages setup.
   - This exposes the code, but not the browser-local financial state you enter after deployment.
   - Do **not** upload financial exports or screenshots containing sensitive numbers.
3. Open the empty repository page.
4. Click **Add file → Upload files**.
5. Drag in the **contents inside** this folder:

   ```text
   chunk-solvency/
   ├── index.html
   ├── styles.css
   ├── app.js
   ├── manifest.json
   ├── sw.js
   ├── .nojekyll
   └── icons/
   ```

   Do not upload the ZIP itself. Do not create a second nested `chunk-solvency/chunk-solvency` layer.
6. Scroll down and click **Commit changes**.
7. In the repository, open **Settings → Pages**.
8. Under **Build and deployment**, choose **Deploy from a branch**.
9. Set branch to **main**, folder to **/(root)**, then click **Save**.
10. GitHub will show the published URL after it builds. It normally follows this pattern:

   ```text
   https://YOUR-GITHUB-NAME.github.io/chunk-solvency/
   ```

11. Open that URL on your PC first. Make one fake edit, refresh, and confirm it stays. Then erase/reset it or load your real board.

GitHub Pages can publish static files directly from the root of a branch; this project is structured specifically for that simple route.

---

# Put it on your iPhone Home Screen

1. Open the GitHub Pages URL in **Safari** on your iPhone.
2. Tap **Share**.
3. Scroll and select **Add to Home Screen**.
4. Turn on **Open as Web App** if Safari presents the toggle.
5. Tap **Add**.

You should now have a CHUNK icon that opens separately from regular Safari tabs.

### First-time behavior

- The app needs internet for the first hosted launch so Safari can load it.
- Once opened, it registers an offline cache for its basic shell.
- Your entered state stays inside that Home Screen app’s browser storage.
- The phone board and the PC board are separate. Use **Export** / **Import** to move your state across devices deliberately.

---

# How to use the model

## 1. Put money in its proper layer

- **Immediate cash**: checking / physical cash / money usable today.
- **Pipeline**: money expected but not yet settled. Give it an expected date and confidence percentage.
- **Protected buffer**: savings intentionally held outside active flow.
- **Investment**: capital that could be sold, but may create a loss or cost future upside.
- **Hard asset**: possessions you *could* sell under pressure. This is intentionally the least “real” money layer.

Only **Immediate cash** powers the headline runway. That is on purpose: the app refuses to pretend speculative or protected money is already cash in your hand.

## 2. Add obligations with timing

- **Monthly recurring** obligations become recurring entries in the flow.
- **One-off** obligations appear on their specific date.
- Add debt accounts separately: their minimums automatically show in the timeline and the monthly wall.

## 3. Calibrate one task

In **Settings**, enter a normal or conservative expected payout for one full task. The app uses it only as a perception tool. It does not turn DA into fractional work; it shows what a complete task changes once completed.

---

# Folder map

```text
chunk-solvency/
├── index.html        # App structure
├── styles.css        # Visual design / responsive phone layout
├── app.js            # State, calculations, interactions, storage
├── manifest.json     # Home Screen app identity
├── sw.js             # Offline cache / PWA behavior
├── .nojekyll         # Makes GitHub Pages serve the static files directly
├── icons/            # Home Screen / browser icons
└── README.md         # This guide
```

---

# Version 0.1 boundaries

This is deliberately not yet a bank-dashboard clone.

There is currently no automatic bank syncing, account login, cloud sync, notifications, multi-user access, charts library, or native iOS wrapper. Those are later choices—not foundational requirements. The core job right now is to find out whether the visual flow, liquidity layers, threat gradient, runway logic, and debt anatomy change how it feels to look at money.

When you have used this for a few days, the next features should be chosen from lived friction rather than imagined product scope.

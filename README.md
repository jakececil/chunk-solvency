# CHUNK // SOLVENCY — v0.2

A **private, local-first financial terrain board** built around the actual whiteboard logic:

- time is a corridor;
- money has different liquidity temperatures;
- bills are a warm monthly wall;
- debt is visible mass;
- desire gets a bounded place instead of being treated as treason.

This version is a deeper rebuild of v0.1. It remains a static web app: no npm, no Node, no server, no accounts, no database, no bank link, no tracking.

## The important privacy model

Your financial values save **inside the browser on the device where you use the app**.

GitHub Pages hosts the code only. The live board is not written into GitHub unless you manually upload an exported backup file—which you should never do.

- PC board and iPhone board are separate local states.
- Use **EXPORT** to create a JSON backup.
- Use **IMPORT** to move that private JSON between devices.
- Do not commit the backup JSON to the repository.

## What v0.2 does

- **Time corridor:** shows the next 14–60 days as physical cells, with money arriving and obligations becoming hot.
- **Liquidity territories:** hard assets, pipeline, true cash, protected buffer, and investments live as distinct territories with different meanings.
- **Monthly wall:** recurring and one-off obligations become visible warm blocks.
- **Debt dragons:** balances turn into a field of cells. Each cell is a chunk of visible mass. The cell scale adapts if the balance is very large.
- **Sanctioned life tracks:** books, tools, toys, travel, candy, art material, etc. can have a bounded, visible allocation goal.
- **One full task event:** this is intentionally a complete-task readout, not a “do twenty minutes” productivity gimmick. It shows how one actual finished DA task changes the true-cash terrain.
- **Automatic browser saving** plus private JSON export/import.
- **Phone-first PWA structure:** works as a normal site, and can be added to an iPhone Home Screen through Safari after GitHub Pages deployment.

## Folder structure

```text
chunk-solvency-v0.2/
├── index.html
├── styles.css
├── app.js
├── manifest.json
├── sw.js
├── .nojekyll
├── .gitignore
├── icons/
│   ├── icon-192.png
│   ├── icon-512.png
│   └── apple-touch-icon.png
└── README.md
```

## First local test

1. Unzip the project folder somewhere permanent, such as `Documents/Projects/`.
2. Open the folder in VS Code.
3. Double-click `index.html` or right-click it and choose **Open with Live Server** if you already use that extension.
4. You will see fake demo terrain. It exists only to give the board a physical body on first launch.
5. Tap **START CLEAN**, then add your actual layers and obligations.

The basic interface works from a normal local file. The service-worker/offline shell activates after it is served from a website such as GitHub Pages.

## Put it on GitHub Pages — browser-only route

1. Create a new GitHub repository, preferably called `chunk-solvency`.
2. Choose **Public** for the simplest GitHub Pages setup. That exposes the app code, **not** the local values you input later.
3. In the empty repository, click **Add file → Upload files**.
4. Upload the *contents inside this folder*:

   ```text
   index.html
   styles.css
   app.js
   manifest.json
   sw.js
   .nojekyll
   .gitignore
   icons/
   README.md
   ```

   Do not upload the ZIP itself. Do not create an accidental nested route like `chunk-solvency/chunk-solvency/index.html`.

5. Commit the uploaded files to `main`.
6. In the GitHub repository go to **Settings → Pages**.
7. Under **Build and deployment**, select **Deploy from a branch**.
8. Select branch **main**, folder **/(root)**, then press **Save**.
9. After deployment, GitHub will provide a URL like:

   ```text
   https://YOUR-GITHUB-USERNAME.github.io/chunk-solvency/
   ```

10. Open that URL on desktop first. Make one fake edit and refresh to prove local persistence. Then reset or enter your actual board.

## Put it on iPhone Home Screen

1. Open the GitHub Pages address in **Safari** on iPhone.
2. Tap the Share icon.
3. Choose **Add to Home Screen**.
4. Turn on **Open as Web App** if Safari displays that option.
5. Tap **Add**.

The Home Screen version uses its own local browser storage. So it is normal for the PC and iPhone boards to begin empty relative to each other. Export/import is the intentional bridge.

## Updating from v0.1

v0.2 will try to read an existing v0.1 local board if it finds one in the same browser and deployed URL. It does not overwrite your old v0.1 state, but it can bring the old assets, obligations, and debt data into the new visual system.

Before updating a live app, use **EXPORT** in v0.1 anyway. Treat this as a real financial instrument: keep a backup before moving terrain.

## Current boundaries

This is not yet a bank sync app, automatic data importer, tax estimator, or a native Xcode package. That is intentional.

The core question here is whether looking at money as **spatial matter moving through threat and time** creates better decisions than looking at it as flat text. Once that is proven in lived use, future upgrades can be chosen from actual friction instead of imagined app scope.

# CHUNK // SOLVENCY v0.7.1 — packed-tail polish hotfix

## What changed

The default **IN / OUT** ledger now uses the visual logic Jake specified:

- Full cells remain full, countable chunks in their category order.
- Each category’s non-full remainder is lifted to the end of its respective **IN** or **OUT** mass.
- Each remainder becomes its own **solid clickable proportional block** rather than a fractional fill inside a hollow square.
- Those blocks flex-pack together with no internal dark remainder gaps. They remain distinct by color and thin dividers, so tapping one still tunes the source category.
- **INLINE DETAIL** is unchanged: it continues to show partial tails in their original positions when you specifically want per-category microscopic accounting.

This is intentionally a narrow v0.7.1 patch. It preserves the working two-line ledger, calendar, campaign deck, exact card maps, and persistent local state.

## Update route

1. Export a backup from the live app once real data matters.
2. Unzip `chunk-solvency-v0.7.1.zip`.
3. Copy the **contents inside** `chunk-solvency-v0.7.1` over your cloned local `chunk-solvency` repository folder. Replace duplicate files; do not replace the hidden `.git` folder.
4. In VS Code, stage all changes, commit, then push:

```text
Pack proportional tails without hollow gaps v0.7.1
```

5. After GitHub Pages deploys, open the direct Safari Pages URL once before reopening the Home Screen app. This version has a new cache identifier, so the corrected physical-tail renderer replaces the previous shell.

## Privacy note

Your financial board still lives only in browser-local storage on each device. GitHub Pages hosts the application code, not your entered amounts. Export backups are private financial files; keep them outside the public repository.

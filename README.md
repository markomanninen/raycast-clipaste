
# Clipaste Launcher — Raycast Extension (complete)

Features:
- One **Form** to run `clipaste` with flags for `paste`, `copy`, `get`, `status`, `clear`, and simple `ai` actions.
- **Recipes** dropdown from `assets/clipaste-recipes.json` (no hardcoding).
- **Clipboard Preview** + **History offset (0–5)** using Raycast Clipboard API.
- Optional **pngpaste** fallback (macOS) that dumps a clipboard image to a temp file for inline preview.

## Install & Run

```bash
npm i -g clipaste
cd clipaste-raycast-full
npm install
npm run dev
```

Open Raycast → run **Clipaste Launcher**.

If `clipaste` isn’t on PATH, open the command’s Preferences and set **clipaste binary**.

### pngpaste (optional)
```bash
brew install pngpaste
```
Enable the preference **"Enable pngpaste fallback (macOS)"** to show the action in the panel.

## Notes
- Clipboard API returns `{ text?, file?, html? }`. Images are previewed inline when they are files; otherwise use **pngpaste** fallback.
- Linux users: `clipaste` may require `xclip` or `xsel` per its README.
- All values are persisted with `useLocalStorage` so your last setup reopens intact.

MIT © 2025

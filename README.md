# The Red Envelope — hero page

## Files
- `index.html` — the page (26KB, no build step, no dependencies to install)
- `assets/hongbao-video.mp4` — background video (Three.js texture, with a plain-`<video>` fallback on mobile/no-WebGL browsers)
- `assets/red-envelope-logo.png` — footer logo

## Deploy to GitHub Pages
1. Push this whole folder (keeping `assets/` alongside `index.html`) to your repo — e.g. the root of `theredenvelopenz/TheRedEnvelopeNZ`.
2. In the repo's **Settings → Pages**, make sure the source branch/folder is enabled (it already is per your existing setup).
3. Visit `https://theredenvelopenz.github.io/TheRedEnvelopeNZ/` — should be live within a minute or two of the push.

## Notes
- Everything is vanilla HTML + a few CDN scripts (Tailwind Play, React, Babel, Three.js) — no `npm install`, no build.
- The cart/contact form are UI-only (no backend wired up) — same as before, just no longer inlined as base64.
- If you want this folder inside your existing multi-page site instead of replacing it, drop `index.html`'s content into wherever your hero section currently lives, and copy `assets/` alongside your other assets.

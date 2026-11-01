# neurotic_docx_bench — review site (gh-pages)

Drop-in replacement for the `gh-pages` branch root. Same viewers, same JS, restyled in the Arthur Souza Rodrigues design system (paper `#FAFAF8`, ink `#0A0A0A`, hairlines, one highlighter accent, radius 0) and renamed from "Jubarte" to **neurotic_docx_bench**.

## What changed

- `_static/bench.css` — one shared stylesheet for all three pages (the dark base theme + jubarte override layers are gone). Fonts: Libre Franklin + Roboto Mono, self-hosted in `_static/fonts/` (SIL OFL). The Manrope / JetBrains Mono files are no longer referenced and can be deleted.
- **Case data moved out of the HTML.** `index.html` (18 MB) and `redlines/index.html` (11 MB) carried `const DATA = [...]` inline, so nothing painted until the whole file had downloaded and parsed. Each viewer now fetches a sibling `data.json` — the page paints at once, the JSON caches on its own, and GitHub Pages gzips it.
  - Shape: `{"base": "https://pub-….r2.dev/", "cases": [...]}`. Entries in `pages.*` and `pdfs.*` that start with `~/` are relative to `base` (saves ~25%). Everything else is the schema the build scripts already produce.
  - **Build scripts** (`_build/*/patch_site.py`, `process.py`) that rewrote `const DATA = …` must now write `data.json` instead. A loader that expands `~/` is the only thing the page does with it.
- Fixed: the redlines page shipped the DOCX→PDF header (wrong crumb, `speed/` link that 404'd under `/redlines/`); `#brand` grid rules leaking into the non-grid speed page; viewport/`lang`/`<head>` scaffolding; `100vh` → `100dvh`; keyboard hints offered `1–8/9` for 20 engines (now only the first nine show a key); images without `alt`; the sidebar and main area are `<aside>`/`<main>`; speed tables got `<thead>` and scroll horizontally on narrow screens; focus rings; `prefers-reduced-motion`.
- Engine colours are functional (one per engine); the legend bullets are the brand square.
- **Mobile viewer** (≤720px, or force with `?mobile=1` / `?mobile=0`): burger drawer for the case list and filters, the bench switch, a thumb bar with prev · random · next · overlay, and exactly two documents — Word and one engine (the "vs" select). The **Layout** sheet is the tweak: *Side by side, top half* (default — cropped pages keep text legible, "Whole page" expands), *Overlay, Word under the engine* (clear it from the thumb bar or the chip above the page), *Side by side, whole pages* (tiny, for pagination drift). Blend and mix live in the same sheet. Choice persists with the rest of the viewer state.
- Footer carries the notice link, the maintainer line and the required "Attorney advertising." disclaimer.

Everything under `_build/` on the branch is untouched by this.

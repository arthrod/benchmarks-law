# benchmarks.law — results site (spec)

Replaces the current hand-coded homepage of the EmDash site at benchmarks.law (Worker `benchmarks-law`, D1 `benchmarks-law`, passkey admin). The CMS, D1, R2 and admin stay.

## Design
The Arthur Souza Rodrigues design system (zip): paper #FAFAF8, ink #0A0A0A, muted #6B6B6B, faint #E8E8E5, one accent #FFD400 used as a highlighter swipe. Libre Franklin 700 headlines, Roboto Mono 600 uppercase labels with slash prefixes, radius 0, no soft shadows (hard 7px accent offset on hover), icon-free and emoji-free, "Attorney advertising." disclaimer in the footer, © MMXXVI. Fonts self-hosted from the zip.

## Content model (EmDash)
New collection `reports`: title (string, req), series (string: `editors-trial`), code (string, e.g. "Report A"), dek (text), body (text, markdown), position (integer), notice (string, e.g. "INTERIM"), source_path (string), docx_path (string), updated (string). `entry.id` is the slug.
Markdown is stored after import-time rewriting:
- links to sibling report `.md` files → `/editors-trial/<slug>`
- `../out/**.png` figures → `/editors-trial/figures/<path>` (static assets in `public/`)
- other repo-relative links → `https://github.com/arthrod/editors_trial/blob/benchmark-fairness-reports/<path>`
Rendering: `marked` (GFM) with heading ids from github-slugger; contents from H2/H3; tables wrapped for horizontal scroll.

## Routes (all SSR, Astro.cache.set(cacheHint))
- `/` hub: what benchmarks.law publishes, two benchmark cards (editors_trial, neurotic_docx_bench), reports list from EmDash.
- `/editors-trial/` series index, `/editors-trial/[slug]` long-read page (sticky contents with scrollspy, 3px accent progress bar, meta row).
- `/neurotic-docx-bench/` the restyled static viewers from the zip (DOCX→PDF, redlines, speed, editors, home), served from `public/`. Fix its dead links to `jandira-tech/editors_trial`.

## Import
`scripts/sync.ts` (`pnpm sync:assets`, `pnpm sync:content`, `pnpm sync:vendors`) reads `REPORTS_ROOT` (default `../../editors_trial`; every command stops if it is absent), builds entries, and upserts via `emdash content create/update` against `EMDASH_URL` (default `https://benchmarks.law`) with `EMDASH_TOKEN`.

## Acceptance
vitest on slugging, title/dek extraction, TOC, link rewriting. Live: `/`, every report, the neurotic viewers return 200 without console errors; admin `/_emdash/admin` still loads.

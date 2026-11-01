# benchmarks.law

> DOCX tools, measured against Microsoft Word.

[benchmarks.law](https://benchmarks.law) runs the editors and converters that contracts and briefs pass through on the same documents. It checks what comes out against what Word does, and publishes every input, output and log, so you can open a result and check it yourself.

Two benches are published:

| Bench | Where | What it measures |
|---|---|---|
| **01 · Editors trial** | [`/editors-trial/`](https://benchmarks.law/editors-trial/) | 12 open-source DOCX editors, plus LibreOffice as a baseline. Each editor's own code imports and exports one adversarial document, and the result is scored construct by construct and opened in Word. Ten hostile packages are opened in a sandbox. The reports are the main report, A, A2, B, C, D, D1 and D2, plus the vendor notes and one lane note per editor. |
| **02 · neurotic_docx_bench** | [`/neurotic-docx-bench/`](https://benchmarks.law/neurotic-docx-bench/home/) | DOCX → PDF and redlines, page by page against Word (pixel, ink overlap, drift-tolerant SSIM, text boundaries), plus a speed run on 10,000 inputs. |

The reports are written in [arthrod/editors_trial](https://github.com/arthrod/editors_trial) (branch `benchmark-fairness-reports`); this repository only publishes them.

## Stack

| Layer | Choice |
|---|---|
| Framework | [Astro](https://astro.build) 7, `output: "server"`, `@astrojs/cloudflare` adapter |
| CMS | [EmDash](https://github.com/emdash-cms/emdash): the `reports` and `vendors` collections, site settings and the admin UI |
| Runtime | Cloudflare Worker `benchmarks-law` (`src/worker.ts`), custom domain `benchmarks.law` |
| Database / storage | Cloudflare D1 (`DB`), R2 (`MEDIA`). The bench's page images are served from the public R2 URL in `public/neurotic-docx-bench/data.json` (`base`). |
| Cache | Astro route cache on Cloudflare (`cacheCloudflare()`); see [Caching](#caching) |
| Design | Paper, ink and one yellow highlighter; radius 0; Libre Franklin and Roboto Mono (SIL OFL 1.1, `public/fonts/OFL.txt`); no icons |
| Tooling | pnpm, vitest, `astro check` |

## Project layout

| Path | Purpose |
|---|---|
| `src/layouts/Site.astro` | The shell: the navbar shared with the bench, the footer, and EmDash's head (title, description, OG tags) |
| `src/pages/index.astro` | Home: what is measured, the two benches, and the report index |
| `src/pages/editors-trial/index.astro` | The editors-trial hub: the reports, notes and lane notes |
| `src/pages/editors-trial/vendors.astro` | "The field": each editor's round-trip score, safety grade and links, from the EmDash `vendors` collection (synced from `src/data/vendors.json`; round trip, critical features and hostile-input grade are rewritten from editors_trial `out/facts.json` on every `sync:vendors`, never typed) |
| `src/pages/editors-trial/[slug].astro` | One report, rendered from the CMS, with the report switcher. Old slugs redirect (below). |
| `src/lib/reports.ts` | `REPORT_FILES` (which editors_trial file becomes which slug, code and position), `RENAMED_SLUGS`, markdown rendering and link rewriting |
| `src/lib/cms.ts`, `positions.ts`, `switcher.ts`, `navbar.ts`, `vendors.ts`, `neurotic.ts`, `root.ts` | CMS reads, report ordering, the switcher groups, the navbar injected into the bench, score formatting, the bench page patcher, and `REPORTS_ROOT` resolution |
| `scripts/sync.ts` | Publishes editors_trial and the bench into this site (below) |
| `public/neurotic-docx-bench/` | The bench viewer, a static drop-in (its own `NOTICE.md`) |
| `public/editors-trial/{figures,files}/` | Figures and `.docx` downloads copied from editors_trial by `sync:assets` |
| `scripts/make_logo.py` | Outlines `b.law` from the Fraunces variable font into `public/b-law.svg` (the favicon) |
| `docs/results-site-spec.md` | The publishing spec |
| `tests/` | vitest: rendering, link rewriting, XSS neutralising, positions, renames, cache hints, the bench patches and the Lighthouse fixes |

## Publishing a report change

Reports are edited in editors_trial, never here. To publish:

```bash
export REPORTS_ROOT=/path/to/editors_trial      # default ../../editors_trial; every command stops if it is missing
export EMDASH_TOKEN=…                           # personal access token with content:write
pnpm sync:assets     # figures, .docx downloads, bench link fixes, navbar and the at-a-glance score table → public/
pnpm sync:content    # upsert every report; pins source links to the trial tag or commit (src/data/release.json)
pnpm sync:vendors    # figures from out/facts.json → src/data/vendors.json, then upsert the `vendors` collection
pnpm run deploy      # only needed when public/ or the code changed
```

To add a report, add a row to `REPORT_FILES` in `src/lib/reports.ts`. If you rename a slug, add the old one to `RENAMED_SLUGS`: `[slug].astro` then answers the old address with a 301. For example, Report E became D1 and D2 on 2026-11-01, so `/editors-trial/report-e-jubarte` now goes to `/editors-trial/report-d1-jubarte` and `/editors-trial/report-e-word` to `/editors-trial/report-d2-word`. Sync never deletes, so `partitionReports` hides any CMS entry still stored under an old slug; retire it anyway from the admin (or `emdash content delete`).

## Caching

Public pages (`/`, `/editors-trial`, `/editors-trial/vendors`, `/editors-trial/[slug]`) are cached for 300 s and served stale for up to an hour while they revalidate (`PUBLIC_PAGE` in `astro.config.mjs`). They are tagged `emdash:settings`. Every page that lists reports also merges the collection's cache hint (`Astro.cache.set(cacheHint)`), so an EmDash write to settings or to the reports purges them. The editor toolbar is delivered client-side (`toolbar: "client"`), so a cached anonymous page stays editable for signed-in editors.

## Commands

```bash
pnpm install
pnpm exec emdash dev    # local dev server (migrations, seed, types) → http://localhost:4321, admin at /_emdash/admin
pnpm test               # vitest
pnpm run typecheck      # astro check
pnpm run deploy         # astro build && wrangler deploy (direct to production; there is no CI step)
```

## Lighthouse

Production, 2026-11-01. Lighthouse latest, headless Chrome; mobile uses the default throttled preset and desktop uses `--preset=desktop`. Scores are performance / accessibility / best practices / SEO. The two viewers were measured after `edc5021`, every other page after `03bc390` (the later commits do not change what those pages render).

| Page | Mobile | Desktop |
|---|---|---|
| `/` | 100 / 100 / 100 / 100 | 100 / 100 / 100 / 100 |
| `/editors-trial/` | 99 / 100 / 100 / 100 | 100 / 100 / 100 / 100 |
| `/editors-trial/vendors` | 99 / 100 / 100 / 100 | 100 / 100 / 100 / 100 |
| `/editors-trial/report-c` (long read) | 100 / 100 / 100 / 100 | 100 / 100 / 100 / 100 |
| `/neurotic-docx-bench/home/` | 99 / 100 / 100 / 100 | 100 / 100 / 100 / 100 |
| `/neurotic-docx-bench/editors/` | 99 / 100 / 100 / 100 | 100 / 100 / 100 / 100 |
| `/neurotic-docx-bench/speed/` | 100 / 100 / 100 / 100 | 100 / 100 / 100 / 100 |
| `/neurotic-docx-bench/` (DOCX → PDF viewer) | 70 / 100 / 100 / 100 | 69 / 100 / 100 / 100 |
| `/neurotic-docx-bench/redlines/` (redlines viewer) | 87 / 100 / 100 / 100 | 81 / 100 / 100 / 100 |

Where the viewers lose points:

- **Mobile LCP, 6.8 s on DOCX → PDF.** The viewer renders nothing until it has parsed `data.json` (13.6 MB, about 1 MB over the wire). Splitting that file per document set is the fix; it has not been made.
- **Desktop CLS, about 0.36 on both viewers.** `#main` moves down as the toolbar rows above it (engines, legend) fill in once the data arrives. The page images themselves no longer shift: they carry the Letter size (`width="1020" height="1320"`) and `height:auto`, which took mobile CLS from 0.33 to 0.

Two audits fail without costing score: the footer's social links have an accessible name that does not contain their visible text (`label-content-name-mismatch`), and some report tables have data cells without a header (`td-has-header`, Report C).

Re-run with `pnpm dlx lighthouse@latest <url> --only-categories=performance,accessibility,best-practices,seo [--preset=desktop]`.

## Deployment

`pnpm run deploy` builds and runs `wrangler deploy` to the Worker `benchmarks-law`, bound to **benchmarks.law** (`routes` with `custom_domain: true` in `wrangler.jsonc`). EmDash puts only `/_emdash/admin` behind first-run setup; the public pages render without it.

## License

The **code** in this repository is under the **[Apache License 2.0](./LICENSE)**.

The fonts are under the SIL Open Font License 1.1 (`public/fonts/OFL.txt`). The bench viewer is built on docxide-pdf (Apache 2.0), and its document sets keep their own notices; see `public/neurotic-docx-bench/NOTICE.md`.

© benchmarks.law

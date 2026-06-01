# benchmarks.law

> A legal-AI benchmark for attorneys first. Independent of vendor approval, minimally reliant on AI.

[benchmarks.law](https://benchmarks.law) is an independent benchmark of legal-AI tools, built on human judgment rather than machine grading. It evaluates the tools attorneys actually use — with or without the vendor's authorization — introduces a single, known error into real filed work (briefs and executed contracts), submits the document to the tool's own review surface, and checks one verifiable thing: did the tool catch the error? Pass or fail. Errors are introduced and diffed in code; the pass/fail call is confirmed by a person. No LLM judges, no opt-outs, no quiet exits.

The site also mirrors, in full and with attribution, two prior legal-AI benchmarking efforts the author co-authored (legalbenchmarks.ai Phase 1 & 2), with commentary on where their methods diverge from the standard this site is built on.

## Stack

A single server-rendered marketing page built on [Astro](https://astro.build) + [EmDash CMS](https://github.com/emdash-cms/emdash), deployed as a Cloudflare Worker.

| Layer | Choice |
|---|---|
| Framework | Astro (`output: "server"`, `@astrojs/cloudflare` adapter) |
| CMS | EmDash (site settings, menus, admin UI) |
| Runtime | Cloudflare Workers |
| Database | Cloudflare D1 |
| Storage | Cloudflare R2 |
| Smooth scroll | [Lenis](https://github.com/darkroomengineering/lenis) |
| Fonts | Fraunces (display), Spectral (serif), IBM Plex Mono — loaded non-render-blocking with `font-display: optional` |
| Package manager | [bun](https://bun.sh) |

The page is intentionally bespoke: a newspaper-masthead aesthetic in Michigan navy (`#00274C`) and maize (`#FFCB05`) on cream paper, with no dependence on the EmDash starter's SaaS chrome.

## Project layout

| Path | Purpose |
|---|---|
| `src/layouts/Base.astro` | The reusable shell — masthead, sticky scroll-spy navbar, footer, `<head>` wiring, Lenis init. Keeps EmDash plumbing (`getSiteSettings`, `EmDashHead`) so it re-themes per project from CMS settings. |
| `src/pages/index.astro` | The marketing page — all content sections (manifesto, methodology, contribute, the two mirrored reports, about) plus the contribution-form modal. |
| `src/pages/404.astro` | Not-found page on the same design language. |
| `src/styles/benchmarks.css` | The full stylesheet (extracted, global). |
| `public/b-law.svg` | The `b.law` wordmark logo, used as the favicon. |
| `scripts/make_logo.py` | A `uv` script that outlines `b.law` from the Fraunces variable fonts into a self-contained SVG (roman `b` + italic `.law` accent). |
| `seed/seed.json` | EmDash schema + site settings (title, tagline). |
| `wrangler.jsonc` | Worker config — D1/R2/KV bindings, custom domain, observability. |

### Notable details

- **Contribution form** is a Google Form loaded lazily inside a native `<dialog>` modal — the heavy third-party iframe is only instantiated on click, so it never touches the initial page load. Any `.js-open-form` button opens it.
- **Sticky scroll-spy navbar** slides in once the masthead scrolls past, highlights the current section, and uses Lenis for smooth in-page jumps. It is `inert` while hidden (off the tab order and out of the accessibility tree).
- **Lighthouse: 100 / 100 / 100 / 100** (desktop) on the production domain — CLS 0, TBT 0.

## Commands

```bash
npx emdash dev        # Local dev server (runs migrations, seeds, generates types) → http://localhost:4321
bun run build         # Production build (astro build)
bun run deploy        # Build + wrangler deploy
bun run typecheck     # astro check
npx emdash types      # Regenerate TypeScript types from the schema
```

Generate the logo SVG:

```bash
uv run scripts/make_logo.py        # writes public/b-law.svg
```

## Deployment

Deployed as the Cloudflare Worker `benchmarks-law`, bound to the custom domain **[benchmarks.law](https://benchmarks.law)** (`routes` with `custom_domain: true` in `wrangler.jsonc`). D1, R2, and KV resources are auto-provisioned on first deploy. EmDash gates only the `/_emdash/admin` routes behind first-run setup; the public page renders without it.

## License

The **code** in this repository is licensed under the **[Apache License 2.0](./LICENSE)**.

The **mirrored report content** (the legalbenchmarks.ai Phase 1 & 2 reports reproduced on the site) is the work of its respective authors and is made available under **Creative Commons Attribution 4.0 International (CC BY 4.0)**, as noted inline on the page. The Apache 2.0 license covers the source code, not that third-party content.

© benchmarks.law

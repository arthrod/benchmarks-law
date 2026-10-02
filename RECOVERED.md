# benchmarks.law, recovered from the deployed site

This branch is **not** source code. It is the site as `https://benchmarks.law/` served it on 2026-10-02
(deployment of 2026-06-01, Worker `benchmarks-law`), saved byte for byte with `wget -m -p` so the page
survives if the Worker is ever overwritten. The Astro source that produced it was not found on any
checked machine (publicize plan 02, step 4).

- `index.html`, `_astro/*`, `b-law.svg`: the deployed files.
- Fonts load from Google Fonts (Fraunces, Spectral, IBM Plex Mono), as on the live site.

`main` of this repo is still the starter template and is what Workers Builds deploys; do not merge this
branch into it. When the real site is rebuilt (plan 02, step 7), use this as the reference for the
masthead, principles, contribute and prior-work sections.

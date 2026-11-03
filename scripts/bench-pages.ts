// Builds the bench pages from the pinned releases into public/neurotic-docx-bench/
// (see src/lib/bench-pages.ts). Runs as part of `pnpm build`; `bench fetch` first.
import { resolve } from "node:path";
import { writeBenchPages } from "../src/lib/bench-pages";

const site = resolve(import.meta.dirname, "..");
const written = writeBenchPages(site);
console.log(`bench pages: ${written.join(", ") || "none written"}`);

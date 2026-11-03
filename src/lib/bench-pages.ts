/**
 * The bench pages this site renders from the pinned releases (bench.lock → `bench fetch`):
 * the leaderboard at /neurotic-docx-bench/ and, from the same bundle, the case browsers and
 * the speed page. Everything is generated at build time into public/neurotic-docx-bench/
 * (git-ignored; `pnpm bench:pages` rebuilds it) — the site serves exactly what the pinned
 * manifests verified, never a hand-patched copy.
 *
 * The leaderboard is @jandira-tech/bench-viewer's buildLeaderboardPage (the arthur-law skin:
 * scores ranked, no headlines, no "ours", no affiliation mark — tests/bench-pages.test.ts pins
 * that) with the site navbar inserted above it, the way every bench page here wears it.
 */
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, relative, resolve } from "node:path";
import { buildLeaderboardPage, type Scores } from "@jandira-tech/bench-viewer";
import { navbarHtml } from "./navbar";
import { reportRows } from "./reports";

/** Where the pinned ndb release lands (.bench/ndb/, from `bench fetch`). */
export const NDB = "ndb";
/** Where the pinned editors_trial release lands (.bench/editors_trial/). */
export const ET = "editors_trial";

/** The scores.json of the pinned ndb release, parsed by the viewer that renders it. */
export function pinnedScores(site: string): Scores {
	const path = join(site, ".bench", NDB, "results/scores.json");
	if (!existsSync(path))
		throw new Error(`${path} is missing — run \`bench fetch --repo ${site}\` before building`);
	return JSON.parse(readFileSync(path, "utf8")) as Scores;
}

/** The navbar rows every bench page shares: the reports the pinned et bundle carries. */
export interface Row {
	slug: string;
	data: { position: number; code: string; title: string };
}
export function benchRows(site: string): Row[] {
	const root = join(site, ".bench", ET);
	return existsSync(root) ? reportRows(root) : [];
}

/** The leaderboard page: bench-viewer's arthur-law page with the site navbar above it. */
export function leaderboardHtml(scores: Scores, rows: ReturnType<typeof benchRows>): string {
	const nav = navbarHtml({ crumb: "Scores", current: "benches", path: "/neurotic-docx-bench/", rows });
	return buildLeaderboardPage(scores).replace("<body>", () => `<body>\n${nav}`);
}

/** The files the leaderboard needs beside it (the stylesheets its markup links). */
const LEADERBOARD_ASSETS = ["tokens.css", "arthur-law.css"];

function packageDir(): string {
	const req = createRequire(import.meta.url);
	return dirname(req.resolve("@jandira-tech/bench-viewer/package.json"));
}

/** Paths under `dir` that git tracks — a generated page must never clobber one (the copy under
 * public/neurotic-docx-bench/ is deleted in its own commit; until then it keeps serving). */
export function trackedUnder(site: string, dir: string): Set<string> {
	const out = join(site, dir);
	const r = spawnSync("git", ["-C", site, "ls-files", "--", dir], { encoding: "utf8" });
	const tracked = new Set<string>();
	if (r.status === 0)
		for (const line of r.stdout.split("\n")) if (line) tracked.add(relative(out, join(site, line)));
	return tracked;
}

/**
 * Build every bench page from the pinned bundles into `dir` (default public/neurotic-docx-bench/),
 * skipping paths git still tracks there. Returns the paths it wrote, relative to `dir`.
 */
export function writeBenchPages(site: string, dir = join("public", "neurotic-docx-bench")): string[] {
	const out = join(site, dir);
	const tracked = trackedUnder(site, dir);
	const scores = pinnedScores(site);
	const rows = benchRows(site);
	const pages: [string, string][] = [["index.html", leaderboardHtml(scores, rows)]];
	const written: string[] = [];
	for (const rel of [...pages.map(([p]) => p), ...LEADERBOARD_ASSETS]) {
		if (tracked.has(rel)) {
			console.warn(`bench pages: ${rel} is still tracked; the old copy serves until its deletion commit`);
			continue;
		}
		mkdirSync(dirname(join(out, rel)), { recursive: true });
		const source = pages.find(([p]) => p === rel);
		if (source) writeFileSync(join(out, rel), source[1], "utf8");
		else copyFileSync(join(packageDir(), "themes", rel), join(out, rel));
		written.push(rel);
	}
	return written;
}

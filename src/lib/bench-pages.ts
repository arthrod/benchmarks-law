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
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, relative, resolve } from "node:path";
import { buildLeaderboardPage, renderCasesPage, renderSpeedPage, type Scores } from "@jandira-tech/bench-viewer";
import { benchPage, injectNavbar, navbarHtml } from "./navbar";
import { reportRows } from "./reports";
import { scorecardHtml, type Facts } from "./scorecard";

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

/** The out/facts.json of the pinned editors_trial release: every figure the scorecard prints. */
export function pinnedFacts(site: string): Facts {
	const path = join(site, ".bench", ET, "out/facts.json");
	if (!existsSync(path))
		throw new Error(`${path} is missing — run \`bench fetch --repo ${site}\` before building`);
	return JSON.parse(readFileSync(path, "utf8")) as Facts;
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
	// injectNavbar swaps the placeholder for the navbar and links /nav.css + /nav.js in the head.
	const page = buildLeaderboardPage(scores).replace("<body>", () => '<body>\n<header id="brand"></header>');
	return withSiteIcon(injectNavbar(page, nav));
}

// ---- the case browsers and the speed page, from the same bundle -------------------------------------------

/** The pages fetch the release's own files instead of carrying them: one shard per group opens a group. */
const VIEWER = {
	indexUrl: "../release/cases/index.json",
	moduleUrl: "../js/cases.js",
	speedModuleUrl: "../js/speed.js",
	speedUrl: "../release/speed.json",
	stylesheet: "../cases.css",
};

/** A page without an icon link makes the browser ask for /favicon.ico, which 404s (Lighthouse). */
export function withSiteIcon(html: string): string {
	if (/rel=["']icon["']/.test(html)) return html;
	return html.replace(/(\n?<\/head>)/, '\n<link rel="icon" type="image/svg+xml" href="/b-law.svg">$1');
}

/** The conversion case browser at /neurotic-docx-bench/cases/. */
export function casesPage(rows: ReturnType<typeof benchRows>): string {
	return benchPage(
		withSiteIcon(
			renderCasesPage({
				kind: "conversion",
				indexUrl: VIEWER.indexUrl,
				moduleUrl: VIEWER.moduleUrl,
				stylesheet: VIEWER.stylesheet,
			}),
		),
		"cases/index.html",
		rows,
	);
}

/** The redline case browser at /neurotic-docx-bench/redlines/. */
export function redlinesPage(rows: ReturnType<typeof benchRows>): string {
	return benchPage(
		withSiteIcon(
			renderCasesPage({
				kind: "redline",
				indexUrl: VIEWER.indexUrl,
				moduleUrl: VIEWER.moduleUrl,
				stylesheet: VIEWER.stylesheet,
			}),
		),
		"redlines/index.html",
		rows,
	);
}

/** The speed page at /neurotic-docx-bench/speed/. */
export function speedPage(rows: ReturnType<typeof benchRows>): string {
	return benchPage(
		withSiteIcon(
			renderSpeedPage({
				speedUrl: VIEWER.speedUrl,
				moduleUrl: VIEWER.speedModuleUrl,
				stylesheet: VIEWER.stylesheet,
			}),
		),
		"speed/index.html",
		rows,
	);
}

/** The editors-trial scorecard at /neurotic-docx-bench/editors/, from the pinned et facts. */
export function editorsPage(facts: Facts, rows: ReturnType<typeof benchRows>): string {
	return benchPage(withSiteIcon(scorecardHtml(facts)), "editors/index.html", rows);
}

/** The files the leaderboard needs beside it (the stylesheets its markup links). */
const LEADERBOARD_ASSETS = ["tokens.css", "arthur-law.css", "cases.css"];

/** The compiled modules the viewer pages import, from the bench-viewer package's dist. */
const MODULES = ["cases.js", "esc.js", "speed.js"];

function packageDir(): string {
	const req = createRequire(import.meta.url);
	return dirname(req.resolve("@jandira-tech/bench-viewer/package.json"));
}

/** Every file of the pinned release the viewer pages fetch: the cases index, one shard per group, speed.json. */
export function releaseFiles(site: string): string[] {
	const root = join(site, ".bench", NDB, "results/release");
	const index = JSON.parse(readFileSync(join(root, "cases/index.json"), "utf8")) as {
		groups: { path: string }[];
	};
	return [
		"release/cases/index.json",
		"release/speed.json",
		...index.groups.map((g) => `release/${g.path}`),
	];
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
 * skipping paths git still tracks there, and removing generated files an older pin left behind.
 * Returns the paths it wrote, relative to `dir`.
 */
export function writeBenchPages(site: string, dir = join("public", "neurotic-docx-bench")): string[] {
	const out = join(site, dir);
	const tracked = trackedUnder(site, dir);
	const rows = benchRows(site);
	const pages: [string, string][] = [
		["index.html", leaderboardHtml(pinnedScores(site), rows)],
		["cases/index.html", casesPage(rows)],
		["redlines/index.html", redlinesPage(rows)],
		["speed/index.html", speedPage(rows)],
		["editors/index.html", editorsPage(pinnedFacts(site), rows)],
	];
	const assets: [string, () => void][] = [
		...LEADERBOARD_ASSETS.map((css) => [css, () => copyFileSync(join(packageDir(), "themes", css), join(out, css))] as [string, () => void]),
		...MODULES.map((js) => [`js/${js}`, () => copyFileSync(join(packageDir(), "dist", js), join(out, "js", js))] as [string, () => void]),
		...releaseFiles(site).map(
			(rel) =>
				[
					rel,
					() => copyFileSync(join(site, ".bench", NDB, "results", rel), join(out, rel)),
				] as [string, () => void],
		),
	];
	const wanted = new Set([...pages.map(([p]) => p), ...assets.map(([p]) => p)]);
	// Drop what an older pin generated and this one does not want: files only, then the directories
	// they emptied. Never touch what git tracks - until the deletion commit, the old copy serves.
	for (const stale of walkFiles(out)) {
		const rel = relative(out, stale);
		if (!tracked.has(rel) && !wanted.has(rel)) rmSync(stale, { force: true });
	}
	for (const dir of dirsWith(out)) {
		try {
			rmdirSync(dir);
		} catch {
			/* not empty: something tracked or wanted is still in it */
		}
	}
	const written: string[] = [];
	for (const rel of wanted) {
		if (tracked.has(rel)) {
			console.warn(`bench pages: ${rel} is still tracked; the old copy serves until its deletion commit`);
			continue;
		}
		mkdirSync(dirname(join(out, rel)), { recursive: true });
		const page = pages.find(([p]) => p === rel);
		if (page) writeFileSync(join(out, rel), page[1], "utf8");
		else assets.find(([p]) => p === rel)?.[1]();
		written.push(rel);
	}
	return written;
}

/** Every file under `dir` (directories are never returned, so a removal cannot recurse). */
function walkFiles(dir: string): string[] {
	if (!existsSync(dir)) return [];
	return readdirSync(dir).flatMap((name) => {
		const p = join(dir, name);
		return statSync(p).isDirectory() ? walkFiles(p) : [p];
	});
}

/** Every directory under `dir`, deepest first, so an emptied tree prunes bottom-up. */
function dirsWith(dir: string): string[] {
	if (!existsSync(dir)) return [];
	const subs = readdirSync(dir)
		.map((name) => join(dir, name))
		.filter((p) => statSync(p).isDirectory());
	return [...subs.flatMap(dirsWith), ...subs];
}

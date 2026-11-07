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
import { appendFileSync, copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, relative } from "node:path";
import { buildLeaderboardPage, parseScores, renderCasesPage, renderSpeedPage, type Scores } from "@jandira-tech/bench-viewer";
import { benchPage, injectNavbar, navbarHtml } from "./navbar";
import { reportRows } from "./reports";
import { defectClassesIn, scorecardHtml, type Facts, type Release } from "./scorecard";

/** Where the pinned ndb release lands (.bench/ndb/, from `bench fetch`). */
export const NDB = "ndb";
/** Where the pinned editors_trial release lands (.bench/editors_trial/). */
export const ET = "editors_trial";

/** The scores.json of the pinned ndb release, parsed by the viewer that renders it. */
export function pinnedScores(site: string): Scores {
	const path = join(site, ".bench", NDB, "results/scores.json");
	if (!existsSync(path))
		throw new Error(`${path} is missing — run \`bench fetch --repo ${site}\` before building`);
	return parseScores(JSON.parse(readFileSync(path, "utf8")));
}

/** The out/facts.json of the pinned editors_trial release: every figure the scorecard prints. */
export function pinnedFacts(site: string): Facts {
	const path = join(site, ".bench", ET, "out/facts.json");
	if (!existsSync(path))
		throw new Error(`${path} is missing — run \`bench fetch --repo ${site}\` before building`);
	return JSON.parse(readFileSync(path, "utf8")) as Facts;
}

/** The out/release.json of the pinned editors_trial release: the dates the scorecard prints. */
export function pinnedRelease(site: string): Release {
	const path = join(site, ".bench", ET, "out/release.json");
	if (!existsSync(path))
		throw new Error(`${path} is missing — run \`bench fetch --repo ${site}\` before building`);
	return JSON.parse(readFileSync(path, "utf8")) as Release;
}

/** The bundle's Report B markdown: its per-defect matrix counts the classes Word refuses. */
export function pinnedReportB(site: string): string {
	const dir = join(site, ".bench", ET, "reports");
	const hit = existsSync(dir) ? readdirSync(dir).find((n) => /^Report B .*\.md$/.test(n)) : undefined;
	if (!hit)
		throw new Error(`${dir} carries no Report B markdown — the defect classes cannot be counted`);
	return readFileSync(join(dir, hit), "utf8");
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

/**
 * The case browser used to live at /neurotic-docx-bench/ itself, so its links are
 * /neurotic-docx-bench/#<group>/<case>. That address is the leaderboard now; a hash that
 * names a group and a case (it decodes to something with a slash, which no leaderboard
 * anchor has) is sent to the case browser, hash unchanged. Plain JS: the page inlines
 * this function's own source.
 */
export function oldCaseLink(hash: string): string | null {
	if (!hash || hash.length < 2) return null;
	let decoded = "";
	try {
		decoded = decodeURIComponent(hash.slice(1));
	} catch {
		return null;
	}
	return decoded.indexOf("/") > 0 ? `cases/${hash}` : null;
}

const OLD_LINK_SCRIPT = `<script>(function(){var oldCaseLink=${oldCaseLink.toString()};var to=oldCaseLink(location.hash);if(to)location.replace(to);})();</script>`;

/** The leaderboard page: bench-viewer's arthur-law page with the site navbar above it. */
export function leaderboardHtml(scores: Scores, rows: ReturnType<typeof benchRows>): string {
	const nav = navbarHtml({ crumb: "Scores", current: "benches", path: "/neurotic-docx-bench/", rows });
	// injectNavbar swaps the placeholder for the navbar and links /nav.css + /nav.js in the head.
	const page = buildLeaderboardPage(scores).replace("<body>", () => '<body>\n<header id="brand"></header>');
	return withSiteIcon(injectNavbar(page, nav)).replace("</head>", () => `${OLD_LINK_SCRIPT}\n</head>`);
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

/** The editors-trial scorecard at /neurotic-docx-bench/editors/, from the pinned et facts,
 * the bundle's Report B (the defect classes) and the release's own dates. */
export function editorsPage(
	facts: Facts,
	rows: ReturnType<typeof benchRows>,
	extra: { defectClasses: number; release: Release },
): string {
	return benchPage(withSiteIcon(scorecardHtml(facts, extra)), "editors/index.html", rows);
}

/** The files the leaderboard needs beside it (the stylesheets its markup links). */
const LEADERBOARD_ASSETS = ["tokens.css", "arthur-law.css"];

/** The site scoping appended to the generated cases.css (the speed page's stylesheet). The
 * theme constrains body.doc itself — the injected site navbar included — to a 1200px column,
 * which both narrows the navbar and makes it wrap; the navbar is full-bleed and sticky
 * (nav.css), so the constraint moves to the page's own landmarks, the way the copied bench
 * pages scoped it. Only the speed page is body.doc: the case browsers are body.viewer, the
 * leaderboard links no cases.css at all. */
export const SITE_DOC_SCOPE = `/* ---- benchmarks-law: the navbar and the footer span the viewport; the page keeps its column ---- */
body.doc{max-width:none;margin:0;padding:0}
body.doc > #brand{margin-bottom:28px}
body.doc > :not(#brand):not(#main):not(footer.site){max-width:1200px;margin-left:auto;margin-right:auto;padding-left:24px;padding-right:24px}
body.doc > #main{max-width:1200px;margin-left:auto;margin-right:auto}
body.doc footer.site{margin-top:48px;padding-left:24px;padding-right:24px}
`;

/** The arthur.law skin for the case browsers and the speed page (ndb#153): bench-viewer's
 * :root layer, appended after the theme so its palette and type win, with the site's own
 * @font-face rules (the theme declares Manrope and JetBrains Mono under _static/, which this
 * site does not serve; Libre Franklin and Roboto Mono live in public/fonts/). */
export function arthurLawCasesSkin(): string {
	return (
		"\n/* ---- benchmarks-law: arthur-law-cases.css (bench-viewer) and the site's fonts ---- */\n" +
		`@font-face{font-family:'Libre Franklin';font-style:normal;font-weight:100 900;font-display:swap;src:url("/fonts/libre-franklin.woff2") format('woff2');}\n` +
		`@font-face{font-family:'Roboto Mono';font-style:normal;font-weight:100 700;font-display:swap;src:url("/fonts/roboto-mono.woff2") format('woff2');}\n` +
		readFileSync(join(packageDir(), "themes", "arthur-law-cases.css"), "utf8")
	);
}

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
/** The pages that load the bundle's images; each needs the bundle's image origin in img-src. */
export const IMAGE_PAGES = [
	"/neurotic-docx-bench/cases/*",
	"/neurotic-docx-bench/redlines/*",
	"/neurotic-docx-bench/speed/*",
] as const;

/** The IMAGE_PAGES whose Content-Security-Policy in `headers` (public/_headers) does not list the
 * origin of `assetsBase` as an img-src source, a page with no CSP block included. */
export function cspGaps(headers: string, assetsBase: string): string[] {
	const origin = new URL(assetsBase).origin;
	const lines = headers.split("\n");
	return IMAGE_PAGES.filter((path) => {
		const at = lines.findIndex((l) => l.trim() === path && !/^\s/.test(l));
		if (at < 0) return true;
		const block: string[] = [];
		for (const l of lines.slice(at + 1)) {
			if (!/^\s/.test(l)) break;
			block.push(l);
		}
		const csp = block.find((l) => l.trim().startsWith("Content-Security-Policy:")) ?? "";
		const img = csp.split(";").find((d) => d.trim().startsWith("img-src")) ?? "";
		return !img.trim().split(/\s+/).slice(1).includes(origin);
	});
}

/** Refuse to build when the bundle's images would be blocked: `bench deploy` runs no tests, so a
 * release that moves its assets_base must fail here, not on the live site. */
function assertCspAllowsBundle(site: string): void {
	const index = join(site, ".bench", NDB, "results/release/cases/index.json");
	if (!existsSync(index)) return;
	const { assets_base } = JSON.parse(readFileSync(index, "utf8")) as { assets_base?: string };
	if (!assets_base) return;
	const gaps = cspGaps(readFileSync(join(site, "public/_headers"), "utf8"), assets_base);
	if (gaps.length)
		throw new Error(
			`public/_headers: img-src of ${gaps.join(", ")} does not allow ${new URL(assets_base).origin}, the bundle's assets_base — add it before building`,
		);
}

export function writeBenchPages(site: string, dir = join("public", "neurotic-docx-bench")): string[] {
	assertCspAllowsBundle(site);
	const out = join(site, dir);
	const tracked = trackedUnder(site, dir);
	const rows = benchRows(site);
	const pages: [string, string][] = [
		["index.html", leaderboardHtml(pinnedScores(site), rows)],
		["cases/index.html", casesPage(rows)],
		["redlines/index.html", redlinesPage(rows)],
		["speed/index.html", speedPage(rows)],
		[
			"editors/index.html",
			editorsPage(pinnedFacts(site), rows, {
				defectClasses: defectClassesIn(pinnedReportB(site)),
				release: pinnedRelease(site),
			}),
		],
	];
	const assets: [string, () => void][] = [
		...LEADERBOARD_ASSETS.map((css) => [css, () => copyFileSync(join(packageDir(), "themes", css), join(out, css))] as [string, () => void]),
		[
			"cases.css",
			() => {
				copyFileSync(join(packageDir(), "themes", "cases.css"), join(out, "cases.css"));
				appendFileSync(join(out, "cases.css"), arthurLawCasesSkin());
				appendFileSync(join(out, "cases.css"), SITE_DOC_SCOPE);
			},
		],
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

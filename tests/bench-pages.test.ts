import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative, resolve } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { parseScores, type Scores } from "@jandira-tech/bench-viewer";
import { type Row, leaderboardHtml } from "../src/lib/bench-pages";

const SITE = resolve(import.meta.dirname, "..");
/** The pinned ndb release (bench.lock → `bench fetch`); absent before the first fetch. */
const PINNED = join(SITE, ".bench/ndb/results/scores.json");
const PINNED_ET = join(SITE, ".bench/editors_trial/out/facts.json");
const scores: Scores | null = existsSync(PINNED)
	? parseScores(JSON.parse(readFileSync(PINNED, "utf8")))
	: null;

/** A one-table shape, for the rules that do not need the real release. */
const fixture: Scores = {
	version: "0.0.0-test",
	generated: "2026-01-01",
	repo: "https://github.com/jandira-tech/neurotic_docx_bench",
	viewer: "https://jandira-tech.github.io/neurotic_docx_bench/",
	provenance: { docsets: ["deadbeef"] },
	headlines: [{ label: "ours vs theirs", value: "99.99", vs: "theirs 1.00", sub: "the headline text" }],
	tables: [
		{ id: "full-table", title: "Full corpus", meta: "n=10", desc: "d", rows: [] },
		{ id: "conversion-sample", title: "Sample", meta: "n=1", desc: "d", rows: [] },
	],
	states: [],
	home_groups: [],
	method: [],
};

describe.skipIf(!existsSync(PINNED_ET))("the editors scorecard page", () => {
	const page = editorsPage(JSON.parse(readFileSync(PINNED_ET, "utf8")), []);

	it("wears the site navbar in place of its own header and marks its section", () => {
		expect(page).toContain('<header id="brand" class="site-nav">');
		expect(page).toContain('href="/neurotic-docx-bench/editors/" aria-current="page"');
		expect(page).toContain('<span class="crumb">/ Editors trial</span>');
	});
	it("takes its figures from the pinned et facts", () => {
		expect(page).toContain('<table class="score">');
		expect(page).toContain("SuperDoc V2");
		expect(page).toMatch(/LibreOffice \(baseline\)/);
	});
});

describe.skipIf(!scores)("the leaderboard page from the pinned scores", () => {
	const page = leaderboardHtml(scores as Scores, []);

	it("renders no headline text (plan 5 rev 3)", () => {
		for (const h of (scores as Scores).headlines) {
			expect(page).not.toContain(h.label);
			expect(page).not.toContain(h.vs);
			expect(page).not.toContain(h.sub);
		}
		expect(page).not.toContain('class="cell-pad headline"');
		expect(page).not.toContain('class="headline-v"');
	});
	it("marks no row as ours and carries no affiliation mark", () => {
		expect(page).not.toContain("†");
		expect(page).not.toMatch(/class="[^"]*\bours\b/);
	});
	it("contains every table id in scores.json", () => {
		for (const t of (scores as Scores).tables) expect(page).toContain(`id="${t.id}"`);
	});
	it("puts the full-corpus tables before the 600-document samples", () => {
		const full = (scores as Scores).tables.filter((t) => !t.id.endsWith("-sample"));
		const samples = (scores as Scores).tables.filter((t) => t.id.endsWith("-sample"));
		expect(full.length).toBeGreaterThan(0);
		expect(samples.length).toBeGreaterThan(0);
		const headingAt = page.indexOf('id="lb-samples"');
		expect(headingAt).toBeGreaterThan(-1);
		for (const t of full) expect(page.indexOf(`id="${t.id}"`)).toBeLessThan(headingAt);
		for (const t of samples) expect(page.indexOf(`id="${t.id}"`)).toBeGreaterThan(headingAt);
	});
	it("keeps the corpus states, the provenance and the version badge", () => {
		expect(page).toContain("By corpus state");
		expect(page).toContain((scores as Scores).provenance.docsets[0] ?? "");
		expect(page).toContain(`bench ${(scores as Scores).version}`);
	});
});

describe("the leaderboard page wears the site", () => {
	const page = leaderboardHtml(fixture, []);
	it("carries the shared navbar above the page's own header", () => {
		expect(page).toContain('<header id="brand" class="site-nav">');
		expect(page.indexOf('<header id="brand"')).toBeLessThan(page.indexOf('<main class="wrap">'));
	});
	it("lists the trial dropdown's rows", () => {
		const rows: Row[] = [{ slug: "report-a", data: { position: 10, code: "Report A", title: "Serialization" } }];
		expect(leaderboardHtml(fixture, rows)).toContain("Serialization");
	});
	it("still keeps the bench-viewer page intact around the injection", () => {
		expect(page).toContain('<link rel="stylesheet" href="./tokens.css">');
		expect(page).toContain("<!doctype html>");
		expect(page.trim().endsWith("</html>")).toBe(true);
	});
});

// ---- the case browsers and the speed page, from the same bundle (plan 5 rev 2) ------------

import { createHash } from "node:crypto";
import { casesPage, editorsPage, redlinesPage, speedPage } from "../src/lib/bench-pages";

describe("the viewer pages from the pinned bundle", () => {
	const rows: Row[] = [];
	const cases = casesPage(rows);
	const redlines = redlinesPage(rows);
	const speed = speedPage(rows);

	it.each([
		["cases", cases],
		["redlines", redlines],
		["speed", speed],
	])("%s wears the site navbar in place of the viewer's own header", (_n, page) => {
		expect(page).toContain('<header id="brand" class="site-nav">');
		expect(page).not.toMatch(/<header id="brand">(?!<a class="wm" href="\/neurotic-docx-bench\/)/);
	});
	it.each([
		["cases", cases, "/neurotic-docx-bench/cases/"],
		["redlines", redlines, "/neurotic-docx-bench/redlines/"],
		["speed", speed, "/neurotic-docx-bench/speed/"],
	])("%s marks its own section", (_n, page, href) => {
		expect(page).toContain(`href="${href}" aria-current="page"`);
	});
	it("the case browsers fetch the bundle's index and shards, not a copied data.json", () => {
		expect(cases).toContain('"../release/cases/index.json"');
		expect(redlines).toContain('"../release/cases/index.json"');
		expect(cases).toContain('from "../js/cases.js"');
		expect(cases).toContain('href="../cases.css"');
	});
	it("the speed page fetches the bundle's speed.json", () => {
		expect(speed).toContain('"../release/speed.json"');
		expect(speed).toContain('from "../js/speed.js"');
	});
	it("cross-links stay inside this site: cases → redlines, speed, the leaderboard", () => {
		expect(cases).toContain('../redlines/index.html');
		expect(cases).toContain('../speed/index.html');
		expect(cases).toContain('href="../index.html"');
	});
	it("every generated page names the site icon (no /favicon.ico 404)", () => {
		for (const page of [cases, redlines, speed]) {
			expect(page.match(/<link rel="icon"[^>]*href="\/b-law\.svg"/g)?.length).toBe(1);
		}
	});
});

// ---- the CSP: inline scripts pinned by sha256, images only from the site and the bench's R2 ----

/** One _headers block: the header lines that follow the `path` pattern line. */
function headers(path: string): string[] {
	const lines = readFileSync(new URL("../public/_headers", import.meta.url), "utf8").split("\n");
	const at = lines.findIndex((l) => l.trim() === path && !l.startsWith(" ") && !l.startsWith("#"));
	if (at < 0) throw new Error(`public/_headers has no block for ${path}`);
	const block: string[] = [];
	for (const line of lines.slice(at + 1)) {
		if (line.trim() && !line.startsWith("  ")) break;
		if (line.trim()) block.push(line.trim());
	}
	return block;
}

/** The base64 sha256 CSP hash of a page's inline <script> blocks. */
function inlineScriptHashes(page: string): string[] {
	return [...page.matchAll(/<script type="module">([\s\S]*?)<\/script>/g)].map((m) =>
		createHash("sha256").update(m[1], "utf8").digest("base64"),
	);
}

describe.skipIf(!scores)("the CSP of the inline-script pages", () => {
	const rows: Row[] = [];
	const pages: [string, string][] = [
		["/neurotic-docx-bench/cases/*", casesPage(rows)],
		["/neurotic-docx-bench/redlines/*", redlinesPage(rows)],
		["/neurotic-docx-bench/speed/*", speedPage(rows)],
	];
	it.each(pages)("%s allows its inline scripts by sha256 only", (path, page) => {
		const csp = headers(path).find((l) => l.includes("Content-Security-Policy")) ?? "";
		for (const hash of inlineScriptHashes(page)) expect(csp).toContain(`'sha256-${hash}'`);
		expect(csp).not.toContain("'unsafe-inline'");
		expect(csp).not.toContain("'unsafe-eval'");
	});
	it("images come from this site and the bench's R2 origin, as the bundle lists it", () => {
		const index = JSON.parse(
			readFileSync(join(SITE, ".bench/ndb/results/release/cases/index.json"), "utf8"),
		) as { assets_base: string };
		const origin = new URL(index.assets_base).origin;
		for (const [path] of pages) {
			const csp = headers(path).find((l) => l.includes("Content-Security-Policy")) ?? "";
			expect(csp).toContain("img-src 'self'");
			expect(csp).toContain(origin);
		}
	});
});

// ---- the old links ------------------------------------------------------------------------

describe("the old URLs", () => {
	it("redirect the deleted bench home to the leaderboard", () => {
		const text = readFileSync(new URL("../public/_redirects", import.meta.url), "utf8");
		expect(text).toMatch(/^\/neurotic-docx-bench\/home\s+\/neurotic-docx-bench\/\s+301$/m);
		expect(text).toMatch(/^\/neurotic-docx-bench\/home\/\*\s+\/neurotic-docx-bench\/\s+301$/m);
	});
});

// ---- the whole tree, written ----------------------------------------------------------------

describe.skipIf(!existsSync(join(SITE, ".bench/ndb/results/release/cases/index.json")))(
	"writeBenchPages writes the whole viewer from the bundle",
	async () => {
		const { writeBenchPages } = await import("../src/lib/bench-pages");
		const out = mkdtempSync(join(tmpdir(), "blaw-pages-"));
		afterAll(() => rmSync(out, { recursive: true, force: true }));
		const index = JSON.parse(
			readFileSync(join(SITE, ".bench/ndb/results/release/cases/index.json"), "utf8"),
		) as { groups: { path: string }[] };

		it("writes the leaderboard, the browsers, the speed page and the files they fetch", () => {
			writeBenchPages(SITE, relative(SITE, out));
			for (const rel of [
				"index.html",
				"editors/index.html",
				"tokens.css",
				"arthur-law.css",
				"cases.css",
				"cases/index.html",
				"redlines/index.html",
				"speed/index.html",
				"release/speed.json",
				...index.groups.map((g) => `release/${g.path}`),
			]) {
				expect(existsSync(join(out, rel)), rel).toBe(true);
			}
			for (const rel of ["js/cases.js", "js/esc.js", "js/speed.js"]) {
				expect(existsSync(join(out, rel)), rel).toBe(true);
			}
		});
	},
);

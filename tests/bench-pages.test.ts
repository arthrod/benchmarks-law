import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parseScores, type Scores } from "@jandira-tech/bench-viewer";
import { type Row, leaderboardHtml } from "../src/lib/bench-pages";

const SITE = resolve(import.meta.dirname, "..");
/** The pinned ndb release (bench.lock → `bench fetch`); absent before the first fetch. */
const PINNED = join(SITE, ".bench/ndb/results/scores.json");
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

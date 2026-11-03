import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { type Facts, scorecardHtml, scorecardRows } from "../src/lib/scorecard";

const SITE = resolve(import.meta.dirname, "..");
const PIN = join(SITE, ".bench/editors_trial/out/facts.json");

/** The shape of the pinned et release's out/facts.json: flat keys, every figure a fact. */
const facts: Facts = {
	"rt.superdoc.weighted": 100.0,
	"rt.superdoc.critical_passed": 29,
	"rt.superdoc.critical_total": 29,
	"rt.superdoc.text_pct": 100.0,
	"rt.superdoc.failed": 0,
	"rt.superdoc.total": 99,
	"rt.superdoc.bytes": 26033,
	"parts.superdoc.kept": 35,
	"parts.superdoc.total": 35,
	"p2.superdoc.identical": true,
	"p2.superdoc.weighted": 100.0,
	"word.superdoc.opens": true,
	"rt.genoffice.weighted": 98.5,
	"rt.genoffice.critical_passed": 28,
	"rt.genoffice.critical_total": 29,
	"rt.genoffice.text_pct": 98.8,
	"rt.genoffice.failed": 1,
	"parts.genoffice.kept": 35,
	"parts.genoffice.total": 35,
	"p2.genoffice.identical": true,
	"p2.genoffice.weighted": 100.0,
	"word.genoffice.opens": true,
	"rt.officeopen.weighted": 93.5,
	"rt.officeopen.critical_passed": 25,
	"rt.officeopen.critical_total": 29,
	"rt.officeopen.text_pct": 100.0,
	"rt.officeopen.failed": 5,
	"parts.officeopen.kept": 35,
	"parts.officeopen.total": 35,
	"p2.officeopen.identical": false,
	"p2.officeopen.weighted": 32.2,
	"word.officeopen.opens": false,
	"rt.wordcraft.weighted": 85.9,
	"rt.wordcraft.critical_passed": 21,
	"rt.wordcraft.critical_total": 29,
	"rt.wordcraft.text_pct": 97.0,
	"rt.wordcraft.failed": 12,
	"parts.wordcraft.kept": 32,
	"parts.wordcraft.total": 35,
	"p2.wordcraft.identical": false,
	"p2.wordcraft.weighted": 86.4,
	"word.wordcraft.opens": true,
	"rt.fidus.weighted": 23.6,
	"rt.fidus.critical_passed": 7,
	"rt.fidus.critical_total": 29,
	"rt.fidus.text_pct": 71.0,
	"rt.fidus.failed": 77,
	"parts.fidus.kept": 11,
	"parts.fidus.total": 35,
	"p2.fidus.identical": false,
	"p2.fidus.weighted": 23.6,
	"word.fidus.opens": false,
	"rt.lo_baseline.weighted": 86.9,
	"rt.lo_baseline.critical_passed": 23,
	"rt.lo_baseline.critical_total": 29,
	"rt.lo_baseline.text_pct": 100.0,
	"rt.lo_baseline.failed": 12,
	"parts.lo_baseline.kept": 25,
	"parts.lo_baseline.total": 35,
	"p2.lo_baseline.identical": false,
	"p2.lo_baseline.weighted": 86.9,
	"word.lo_baseline.opens": true,
	"checks.critical": 29,
	"rt.plate.weighted": 20.6,
};

/** The fixture's field: five tools plus the baseline, enough for every rule below. */
const FIELD = [
	{ key: "superdoc", name: "SuperDoc V2" },
	{ key: "genoffice", name: "GenOffice" },
	{ key: "officeopen", name: "office-open" },
	{ key: "wordcraft", name: "WordCraft" },
	{ key: "fidus", name: "Fidus Writer" },
];

describe("scorecardRows, from facts alone", () => {
	const rows = scorecardRows(facts, FIELD);

	it("ranks by weighted score, the baseline last", () => {
		expect(rows.map((r) => r.name)).toEqual([
			"SuperDoc V2",
			"GenOffice",
			"office-open",
			"WordCraft",
			"Fidus Writer",
			"LibreOffice (baseline)",
		]);
	});
	it("takes every measured cell from facts (no Markdown table anywhere)", () => {
		const top = rows[0];
		expect(top.weighted).toBe(100.0);
		expect(top.critical).toBe("29 / 29");
		expect(top.text).toBe("100.0%");
		expect(top.parts).toBe("35 / 35");
		expect(top.failed).toBe(0);
		expect(top.secondPass).toBe("byte-identical");
		expect(top.wordOpens).toBe(true);
		expect(top.baseline).toBe(false);
	});
	it("keeps the second pass honest: a collapse carries its score, stability says stable", () => {
		const office = rows.find((r) => r.name === "office-open");
		expect(office?.secondPass).toBe("32.2% on the second pass");
		const wordcraft = rows.find((r) => r.name === "WordCraft");
		expect(wordcraft?.secondPass).toBe("stable, not byte-identical");
	});
	it("marks the baseline row", () => {
		expect(rows.at(-1)?.baseline).toBe(true);
	});
	it("refuses to render a tool whose figures are missing (fail closed, naming the key)", () => {
		expect(() => scorecardRows({ ...facts, "rt.genoffice.weighted": "98.5%" }, FIELD)).toThrow(
			/rt\.genoffice\.weighted/,
		);
	});
});

describe("the scorecard page", () => {
	const page = scorecardHtml(facts, FIELD);

	it("keeps the trial's framing and links to the reports on this site", () => {
		expect(page).toContain("Thirteen DOCX editors, one");
		expect(page).toContain('href="/editors-trial/round-trip"');
		expect(page).toContain('href="/editors-trial/"');
	});
	it("prints the KPIs from facts, not from memory", () => {
		expect(page).toMatch(/<b>5<\/b><span>tools measured/);
		expect(page).toMatch(/<b>99<\/b><span>checks/);
		expect(page).toMatch(/<b>29<\/b><span>critical features/);
		expect(page).toMatch(/<b>35<\/b><span>package parts/);
		expect(page).toMatch(/<b>1<\/b><span>perfect round trips/);
	});
	it("renders the table the old page's CSS knows, with the bar and the Word cells", () => {
		expect(page).toContain('<table class="score">');
		expect(page).toContain('<td class="bar"><span class="b" style="width:98.5%"></span></td>');
		expect(page).toContain('<td class="ok">opened</td>');
		expect(page).toContain('<td class="no">refused</td>');
		expect(page).toContain('<tr class="base"><td>LibreOffice (baseline)</td>');
	});
	it("says where every figure comes from", () => {
		expect(page).toContain("editors_trial");
		expect(page).toContain("facts.json");
	});
	it("links the stylesheet it ships with", () => {
		expect(page).toContain('href="../../editors-score.css"');
	});
});

describe.skipIf(!existsSync(PIN))("the pinned et release", () => {
	const pinned = JSON.parse(readFileSync(PIN, "utf8")) as Facts;

	it("drives the page: the leaders and the floor are the release's own numbers", () => {
		const rows = scorecardRows(pinned);
		expect(rows[0].name).toBe("SuperDoc V2");
		expect(rows[0].weighted).toBe(pinned["rt.superdoc.weighted"]);
		expect(rows.at(-1)?.name).toBe("LibreOffice (baseline)");
		expect(rows.at(-1)?.weighted).toBe(pinned["rt.lo_baseline.weighted"]);
	});
	it("keeps every measured tool of the release in the table", () => {
		const rows = scorecardRows(pinned);
		expect(rows).toHaveLength(14); // the field of 13 plus the LibreOffice baseline
		expect(scorecardHtml(pinned)).toContain("Apryse WebViewer");
	});
});

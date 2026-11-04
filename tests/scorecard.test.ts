import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import {
	defectClassesIn,
	type Facts,
	scorecardHtml,
	scorecardRows,
} from "../src/lib/scorecard";

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
	"rt.eigenpal.weighted": 100.0,
	"word.version": "16.115",
	"count.editors": 5,
	"checks.total": 99,
	"fixture.parts": 35,
	"count.zero_failed": 1,
};

/** Every figure the page builds with, beyond the table: the release's own dates. */
const RELEASE = { date: "2026-11-01" };

/** The bundle's Report B, cut to its per-defect detection matrix (§4.3): d1..d12. */
const REPORT_B = `### 4.3 What each defect class does to Plate.js - the per-defect detection matrix

| # | Defect class | Plate's verdict | Diagnostic |
|---|---|---|---|
| d1 | \`w:documentProtection\` after \`w:evenAndOddHeaders\` | **accepted** | — |
| d2 | \`w:tcW\` after \`w:gridSpan\`/\`w:vMerge\` | **accepted** | — |
| d3 | \`w:cantSplit\` after \`w:tblHeader\` | **accepted** | — |
| d4 | \`w:spacing\` after \`w:jc\` in \`w:pPrChange\` | **accepted** | — |
| d5 | \`w:pgNumType\` after \`w:cols\` in the landscape \`w:sectPr\` | **accepted** | — |
| d6 | \`w16cid:durableId\` with ten hex digits | **accepted** | — |
| d7 | \`dgm:style\` as a direct child of \`dgm:styleDef\` | **accepted** | — |
| d8 | \`mc:Fallback\` nesting a \`w:r\` inside the outer \`w:r\` | **accepted** | — |
| d9 | the OLE object pointing at 64 bytes of filler | **accepted** | — |
| d10 | \`w:delText\` inside \`w:moveFrom\` | **accepted** | — |
| d11 | \`m:oMathPara\` as a direct child of \`w:body\` | **REFUSED** | \`decode-failed\` |
| d12 | \`w:dirty="true"\` on the TOC begin \`fldChar\` | **accepted** | — |

**One of twelve.**
`;

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
	const page = scorecardHtml(facts, { defectClasses: 12, release: RELEASE, tools: FIELD });

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
		expect(page).toMatch(/<b>12<\/b><span>defect classes Word refuses/);
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
	it("wraps the breadcrumb row in the page's column, not flush at the viewport edge", () => {
		const css = readFileSync(new URL("../public/editors-score.css", import.meta.url), "utf8");
		expect(css).toMatch(
			/body\.doc > nav\.crumbs\{[^}]*max-width:var\(--page-max\)[^}]*padding-left:var\(--px\)[^}]*padding-right:var\(--px\)/,
		);
	});
});

describe("the 2026-11-01 correction the old page carried", () => {
	const page = scorecardHtml(facts, { defectClasses: 12, release: RELEASE, tools: FIELD });

	it("prints the correction notice: the three checks, the credit, the rescored eigenpal, the link", () => {
		expect(page).toContain(
			'<p class="note"><b>Corrected 2026-11-01.</b> Three checks failed rewrites that Word itself makes on save: a text box\'s fallback copy rewritten from its DrawingML, simple fields saved as complex fields, and an embedded HTML chunk imported into the body. eigenpal\'s team traced the first one. The scorer was fixed and every editor rescored; eigenpal moves from 98.5% to 100.0%. <a href="/editors-trial/round-trip" rel="noopener">The correction</a> is in the main report.</p>',
		);
	});
	it("takes the rescored eigenpal figure from facts (rt.eigenpal.weighted), not from memory", () => {
		const other = scorecardHtml(
			{ ...facts, "rt.eigenpal.weighted": 99.9 },
			{ defectClasses: 12, release: RELEASE, tools: FIELD },
		);
		expect(other).toContain("eigenpal moves from 98.5% to 99.9%");
	});
	it("prints the edition line: the edition, the corrected date from the release, Word from facts", () => {
		expect(page).toContain(
			'<p class="meta"><span>Edition 2 · 2026-10-30, corrected 2026-11-01</span><span>Word 16.115 as validator</span><span>Every repo cloned at a pinned commit</span></p>',
		);
	});
	it("fails closed when the release carries no date", () => {
		expect(() => scorecardHtml(facts, { defectClasses: 12, release: {}, tools: FIELD })).toThrow(
			/release\.json/,
		);
	});
});

describe("the KPI strip: six tiles, every figure a key or the bundle's own count", () => {
	const page = scorecardHtml(facts, { defectClasses: 12, release: RELEASE, tools: FIELD });

	it("shows the six tiles the old page showed, in its order", () => {
		const tiles = [...page.matchAll(/<div><b>([^<]+)<\/b><span>([^<]+)<\/span><\/div>/g)].map(
			(m) => [m[1], m[2]] as const,
		);
		expect(tiles).toEqual([
			["5", "tools measured"],
			["99", "checks, weighted 3 / 2 / 1"],
			["35", "package parts in the corpus"],
			["29", "critical features"],
			["12", "defect classes Word refuses"],
			["1", "perfect round trips"],
		]);
	});
	it("counts the defect classes from the bundle's Report B, and says so on the tile", () => {
		expect(defectClassesIn(REPORT_B)).toBe(12);
		expect(scorecardHtml(facts, { defectClasses: 14, release: RELEASE, tools: FIELD })).toMatch(
			/<b>14<\/b><span>defect classes Word refuses/,
		);
	});
	it("takes the other five from facts keys: an edition that measures more says so", () => {
		const grown = scorecardHtml(
			{
				...facts,
				"count.editors": 14,
				"checks.total": 120,
				"fixture.parts": 40,
				"checks.critical": 31,
				"count.zero_failed": 4,
			},
			{ defectClasses: 12, release: RELEASE, tools: FIELD },
		);
		expect(grown).toMatch(/<b>14<\/b><span>tools measured/);
		expect(grown).toMatch(/<b>120<\/b><span>checks/);
		expect(grown).toMatch(/<b>40<\/b><span>package parts/);
		expect(grown).toMatch(/<b>31<\/b><span>critical features/);
		expect(grown).toMatch(/<b>4<\/b><span>perfect round trips/);
	});
});

describe("defectClassesIn: the twelve classes, counted from Report B's per-defect matrix", () => {
	it("counts the d-rows of the detection matrix, once each", () => {
		expect(defectClassesIn(REPORT_B)).toBe(12);
		expect(defectClassesIn(REPORT_B + REPORT_B)).toBe(12);
	});
	it("ignores the tier tables (numbered rows) and the survival table (d-columns, not rows)", () => {
		const decoys = `| # | Defect | Where | Sequence broken |
|---|---|---|---|
| 1 | \`w:documentProtection\` | \`word/settings.xml\` | \`CT_Settings\` |
| 2 | \`w:tcW\` | every \`w:tcPr\` | \`CT_TcPr\` |

| Editor | d1 order (settings) | d2 order (tcPr) | Word 16.115 |
|---|---|---|---|
| SuperDoc | YES | YES | **REFUSED** |
`;
		expect(defectClassesIn(decoys + REPORT_B)).toBe(12);
	});
	it("refuses a Report B that carries no per-defect table (fail closed)", () => {
		expect(() => defectClassesIn("## 7. Corrections to the first report\n\nNo matrix here.")).toThrow(
			/Report B/,
		);
	});
});

// Vitest runs a skipped suite's body during collection, so the pinned files are read in beforeAll.
describe.skipIf(!existsSync(PIN))("the pinned et release", () => {
	let pinned: Facts = {};
	let release = { date: "" };
	beforeAll(() => {
		pinned = JSON.parse(readFileSync(PIN, "utf8")) as Facts;
		release = JSON.parse(readFileSync(join(SITE, ".bench/editors_trial/out/release.json"), "utf8")) as {
			date: string;
		};
	});

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
		expect(scorecardHtml(pinned, { defectClasses: 12, release })).toContain("Apryse WebViewer");
	});
	it("prints the correction and the edition with the release's own date and figures", () => {
		const page = scorecardHtml(pinned, { defectClasses: 12, release });
		expect(page).toContain(`<b>Corrected ${release.date}.</b> Three checks failed rewrites`);
		expect(page).toContain(`corrected ${release.date}</span><span>Word ${pinned["word.version"]} as validator`);
		expect(page).toContain(
			`eigenpal moves from 98.5% to ${Number(pinned["rt.eigenpal.weighted"]).toFixed(1)}%.`,
		);
	});
	it("counts the twelve defect classes from the bundle's Report B itself", () => {
		const reportB = readFileSync(
			join(SITE, ".bench/editors_trial/reports/Report B - Malformed Parts, Causes and Repair (2026).md"),
			"utf8",
		);
		expect(defectClassesIn(reportB)).toBe(12);
	});
});

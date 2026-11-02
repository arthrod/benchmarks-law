/**
 * Bench 03 and Bench 04: the two legal-AI studies Arthur co-authored
 * (legalbenchmarks.ai Phase 1 and Phase 2), rewritten in the trial's report
 * style with the studies' own chart data (benchmarks-law#60, #62).
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { STUDIES, studyBody, studyBySlug } from "../src/lib/legalAi";
import { CHARTS, chartHtml, renderStudy } from "../src/lib/legalAiCharts";

const home = readFileSync(join(__dirname, "../src/pages/index.astro"), "utf8");

describe("legal-AI studies", () => {
	it("are the two co-authored studies, in order", () => {
		expect(STUDIES.map((s) => [s.code, s.slug])).toEqual([
			["Bench 03", "info-extraction"],
			["Bench 04", "contract-drafting"],
		]);
		expect(studyBySlug("contract-drafting")?.title).toBe("Benchmarking Humans & AI in Contract Drafting");
		expect(studyBySlug("nope")).toBeUndefined();
	});

	for (const s of STUDIES) {
		describe(s.slug, () => {
			const { html, toc } = renderStudy(studyBody(s.body));
			it("opens with its title and has a contents list of unique anchors", () => {
				expect(s.body.startsWith(`# ${s.title}\n`)).toBe(true);
				expect(toc.length).toBeGreaterThanOrEqual(6);
				const ids = toc.flatMap((t) => [t.id, ...t.children.map((c) => c.id)]);
				expect(new Set(ids).size).toBe(ids.length);
			});
			it("is written as a trial report: TL;DR first, then results, method and limits", () => {
				const h2 = toc.map((t) => t.text);
				expect(h2[0]).toBe("TL;DR");
				expect(h2).toContain("Method and its limits");
				expect(h2).toContain("About this copy");
				expect(studyBody(s.body)).toMatch(/\[DATA\]/);
			});
			it("credits every author and links to the canonical source", () => {
				for (const a of s.authors) expect(s.body).toContain(a);
				expect(s.source).toMatch(/^https:\/\/www\.legalbenchmarks\.ai\/research\/phase-[12]-research$/);
				expect(html).toContain(`href="${s.source}"`);
			});
			it("keeps no placeholder from the old copies", () => {
				expect(s.body).not.toMatch(/—%|Canonical (source )?link to be set|Back to prior work|could not capture|could not be captured/);
			});
			it("draws every chart it names, and only charts that exist", () => {
				const names = [...s.body.matchAll(/\]\(chart:([a-z0-9-]+)\)/g)].map((m) => m[1]);
				expect(names.length).toBeGreaterThanOrEqual(3);
				for (const n of names) expect(CHARTS[n], n).toBeDefined();
				expect(html).not.toContain('src="chart:');
				expect(html.match(/<figure class="lr-chart/g)?.length).toBe(names.length);
			});
			it("has a chart for its homepage card", () => {
				expect(CHARTS[s.cardChart]).toBeDefined();
			});
		});
	}

	it("studyBody drops the title, dek and byline the page header already shows", () => {
		expect(studyBody("# T\n\nDek.\n\nBy A & B\n\n## One\n\nx\n")).toBe("## One\n\nx\n");
		for (const s of STUDIES) expect(studyBody(s.body).startsWith("## TL;DR\n")).toBe(true);
	});

	it("Phase 2 prints the survey figures the old copy lost", () => {
		const b = studyBySlug("contract-drafting")?.body ?? "";
		for (const f of ["97%", "83%", "35%"]) expect(b).toContain(f);
		expect(b).toMatch(/12 min 43 sec/);
	});

	it("each has a homepage card linking to its page", () => {
		expect(home).toMatch(/STUDIES\.map/);
		expect(home).toContain("/legal-ai/${s.slug}");
		expect(home).toContain("chartHtml(");
	});
});

describe("chart data", () => {
	const rows = (n: string) => CHARTS[n].rows;

	it("Phase 1 accuracy: passes of 18, as the source dataset gives them", () => {
		expect(rows("p1-accuracy").map((r) => [r.label, r.values[0]])).toEqual([
			["NotebookLM", 14],
			["Oliver", 12],
			["ChatGPT", 12],
			["DeepSeek", 12],
			["GC AI", 10],
			["Copilot", 7],
		]);
	});

	it("Phase 1 overall points are accuracy plus usefulness, and accuracy is 12 points a pass", () => {
		const acc = new Map(rows("p1-accuracy").map((r) => [r.label, r.values[0]]));
		for (const r of rows("p1-overall")) {
			expect(r.values[0]).toBe((acc.get(r.label) ?? Number.NaN) * 12);
			expect(r.values[0] + r.values[1]).toBeLessThanOrEqual(CHARTS["p1-overall"].max);
		}
		expect(CHARTS["p1-overall"].max).toBe(432);
	});

	it("Phase 2 reliability: passes of 30, fourteen rows with the human baseline", () => {
		const r = rows("p2-reliability");
		expect(r).toHaveLength(14);
		expect(r[0]).toMatchObject({ label: "Gemini 2.5 Pro", values: [22] });
		expect(r.find((x) => x.label === "Human lawyers")?.values[0]).toBe(17);
		expect(r.at(-1)).toMatchObject({ label: "InstaSpace", values: [10] });
	});

	it("every chart's values fit its scale", () => {
		for (const [n, c] of Object.entries(CHARTS)) {
			for (const r of c.rows) {
				expect(r.values.length, n).toBe(c.series?.length ?? 1);
				const sum = r.values.reduce((a, b) => a + b, 0);
				expect(sum, `${n} ${r.label}`).toBeLessThanOrEqual(c.max);
				expect(Math.min(...r.values), `${n} ${r.label}`).toBeGreaterThanOrEqual(0);
			}
		}
	});
});

describe("chart rendering", () => {
	it("draws bars in proportion and marks the leader", () => {
		const html = chartHtml({
			title: "T",
			source: "S",
			max: 10,
			rows: [
				{ label: "A", values: [5] },
				{ label: "B", values: [10] },
			],
		});
		expect(html).toContain('style="width:50%"');
		expect(html).toContain('style="width:100%"');
		expect(html.match(/is-lead/g)?.length).toBe(1);
		expect(html).toMatch(/<li class="is-lead">[\s\S]*?B/);
	});

	it("escapes labels", () => {
		const html = chartHtml({ title: "<x>", source: "s", max: 1, rows: [{ label: "<script>", values: [1] }] });
		expect(html).not.toContain("<script>");
		expect(html).toContain("&lt;script&gt;");
	});

	it("refuses a chart that does not exist", () => {
		expect(() => renderStudy("## A\n\n![x](chart:nope)\n")).toThrow(/nope/);
	});
});

/**
 * Bench 03 and Bench 04: the two legal-AI studies Arthur co-authored
 * (legalbenchmarks.ai Phase 1 and Phase 2), published in the report-reader
 * layout (benchmarks-law#60).
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { STUDIES, studyBody, studyBySlug } from "../src/lib/legalAi";
import { renderMarkdown } from "../src/lib/reports";

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
			const { html, toc } = renderMarkdown(s.body);
			it("opens with its title and has a contents list of unique anchors", () => {
				expect(s.body.startsWith(`# ${s.title}\n`)).toBe(true);
				expect(toc.length).toBeGreaterThanOrEqual(6);
				const ids = toc.flatMap((t) => [t.id, ...t.children.map((c) => c.id)]);
				expect(new Set(ids).size).toBe(ids.length);
			});
			it("credits every author and links to the canonical source", () => {
				for (const a of s.authors) expect(s.body).toContain(a);
				expect(s.source).toMatch(/^https:\/\/www\.legalbenchmarks\.ai\/research\/phase-[12]-research$/);
				expect(html).toContain(`href="${s.source}"`);
			});
			it("keeps no placeholder from the old mirror", () => {
				expect(s.body).not.toMatch(/—%|Canonical (source )?link to be set|Back to prior work/);
				expect(s.body).not.toMatch(/\| *Human strengths/);
			});
			it("has figures for its homepage card", () => {
				expect(s.figures.length).toBeGreaterThanOrEqual(2);
				for (const f of s.figures) expect(s.body).toContain(f.value);
			});
		});
	}

	it("studyBody drops the title, dek and byline the page header already shows", () => {
		expect(studyBody("# T\n\nDek.\n\nBy A & B\n\n## One\n\nx\n")).toBe("## One\n\nx\n");
		for (const s of STUDIES) expect(studyBody(s.body).startsWith("## About this copy\n")).toBe(true);
	});

	it("Phase 2 reports the AI drafting time from the source", () => {
		expect(studyBySlug("contract-drafting")?.body).toMatch(/12 min 43 sec \| Under 1 minute/);
	});

	it("each has a homepage card linking to its page", () => {
		expect(home).toMatch(/STUDIES\.map/);
		expect(home).toContain("/legal-ai/${s.slug}");
	});
});

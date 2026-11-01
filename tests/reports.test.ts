import { describe, expect, it } from "vitest";
import {
	REPORT_FILES,
	extractDek,
	extractTitle,
	renderMarkdown,
	rewriteLinks,
	slugForPath,
	wordCount,
} from "../src/lib/reports";

const ctx = {
	fromPath: "reports/Report C - Rendering Versus Word (2026).md",
	blobBase: "https://github.com/arthrod/editors_trial/blob/benchmark-fairness-reports/",
};

describe("slugForPath", () => {
	it("maps every known report file to a short stable slug", () => {
		expect(slugForPath("reports/Report A - Serialization by Namespace (2026).md")).toBe("report-a");
		expect(slugForPath("reports/Report A2 - Pass-Through (2026).md")).toBe("report-a2");
		expect(slugForPath("reports/Report D1 - Jubarte on the Hostile Packages (2026).md")).toBe("report-d1-jubarte");
		expect(slugForPath("reports/Report D2 - What Word Protects Against (2026).md")).toBe("report-d2-word");
		expect(slugForPath("reports/Report E - What Word Protects Against (2026).md")).toBeNull();
		expect(
			slugForPath("Open-Source DOCX Editors Re-verified Against Code and Measured Round-Trip (2026).md"),
		).toBe("round-trip");
		expect(slugForPath("reports/extras/plate.md")).toBe("lane-plate");
	});
	it("returns null for files outside the set", () => {
		expect(slugForPath("README.md")).toBeNull();
	});
	it("has no duplicate slugs", () => {
		const slugs = REPORT_FILES.map((f) => f.slug);
		expect(new Set(slugs).size).toBe(slugs.length);
	});
});

describe("extractTitle / extractDek", () => {
	const md = "# Report D — Safety (2026)\n\n## TL;DR\n\nNo editor is **safe** on every [package](x.md).\n\nMore.";
	it("takes the first H1", () => {
		expect(extractTitle(md)).toBe("Report D — Safety (2026)");
	});
	it("takes the first prose paragraph as plain text, skipping headings and rules", () => {
		expect(extractDek(md)).toBe("No editor is safe on every package.");
	});
	it("drops emphasis markers that span lines or nest", () => {
		expect(extractDek("# T\n\n*Part C. This part\nanswers one question: **when you\nopen it?***")).toBe(
			"Part C. This part answers one question: when you open it?",
		);
	});
	it("skips a leading status line in italics as prose too", () => {
		expect(extractDek("# T\n\n---\n\n*Part C.* Body")).toBe("Part C. Body");
	});
});

describe("rewriteLinks", () => {
	it("points sibling report links at the rendered page, keeping the anchor", () => {
		const out = rewriteLinks("[D](Report%20D%20-%20Safety%2C%20Resource%20Bombs%20and%20Hostile%20Input%20(2026).md#tldr)", ctx);
		expect(out).toBe("[D](/editors-trial/report-d#tldr)");
	});
	it("resolves ../ links from a report into the root write-up", () => {
		const out = rewriteLinks(
			"[main](../Open-Source%20DOCX%20Editors%20Re-verified%20Against%20Code%20and%20Measured%20Round-Trip%20(2026).md)",
			ctx,
		);
		expect(out).toBe("[main](/editors-trial/round-trip)");
	});
	it("moves out/ figures to the static figures path", () => {
		expect(rewriteLinks("![p1](../out/render/figures/fig1_corpus_p1.png)", ctx)).toBe(
			"![p1](/editors-trial/figures/render/figures/fig1_corpus_p1.png)",
		);
	});
	it("sends other repo-relative links to GitHub", () => {
		expect(rewriteLinks("[s](../build/run_bombs.py)", ctx)).toBe(
			`[s](${ctx.blobBase}build/run_bombs.py)`,
		);
	});
	it("leaves absolute URLs and pure anchors alone", () => {
		const md = "[a](https://x.dev/a.md) [b](#sec) [c](mailto:a@b.c)";
		expect(rewriteLinks(md, ctx)).toBe(md);
	});
	it("does not touch links inside code spans or fenced code", () => {
		const md = "`[x](y.md)`\n\n```\n[x](../build/a.py)\n```";
		expect(rewriteLinks(md, ctx)).toBe(md);
	});
});

describe("renderMarkdown", () => {
	it("renders GFM tables wrapped for horizontal scroll", () => {
		const { html } = renderMarkdown("| a | b |\n|---|---|\n| 1 | 2 |");
		expect(html).toContain('<div class="table-wrap" tabindex="0" role="region" aria-label="Table"><table>');
	});
	it("gives headings stable unique ids and builds an H2/H3 contents tree", () => {
		const { html, toc } = renderMarkdown("# Title\n\n## One\n\n### Sub\n\n## One\n\ntext");
		expect(html).toContain('<h2 id="one">');
		expect(html).toContain('<h2 id="one-1">');
		expect(toc).toEqual([
			{ id: "one", text: "One", children: [{ id: "sub", text: "Sub", children: [] }] },
			{ id: "one-1", text: "One", children: [] },
		]);
	});
	it("drops the H1 (the page header shows the title)", () => {
		expect(renderMarkdown("# Title\n\nbody").html).not.toContain("<h1");
	});
	it("escapes raw HTML instead of passing it through", () => {
		const { html } = renderMarkdown('hi <script>alert(1)</script> <img src=x onerror="y">');
		expect(html).not.toContain("<script");
		expect(html).not.toContain("<img src=x");
	});
	it("neutralises javascript: links", () => {
		expect(renderMarkdown("[x](javascript:alert(1))").html).not.toContain("javascript:");
	});
	it("strips inline markup from contents text", () => {
		expect(renderMarkdown("## The **bold** `code` part").toc[0].text).toBe("The bold code part");
	});
});

describe("wordCount", () => {
	it("counts words in prose, ignoring markdown punctuation", () => {
		expect(wordCount("# Hi there\n\n| a | b |\n\n**two** words")).toBe(6);
	});
});

import { buildEntry } from "../src/lib/reports";

describe("buildEntry", () => {
	const file = REPORT_FILES.find((f) => f.slug === "report-d2-word")!;
	const md = "# Report D2 — What Word protects against (2026)\n\n**Status: INTERIM (2026-10-31, 11 of 28 fixtures run).** Rows marked *pending* are still running.\n\n## One\n\nSee [D](Report%20D%20-%20Safety%2C%20Resource%20Bombs%20and%20Hostile%20Input%20(2026).md).";
	const e = buildEntry(file, md, { blobBase: "https://g/", updated: "2026-10-31", docx: null });
	it("carries the slug, code, position and series", () => {
		expect(e.slug).toBe("report-d2-word");
		expect(e.data).toMatchObject({ code: "Report D2", position: 52, series: "editors-trial" });
	});
	it("stores rewritten markdown in the body", () => {
		expect(e.data.body).toContain("(/editors-trial/report-d)");
	});
	it("lifts an INTERIM status line into the notice field", () => {
		expect(e.data.notice).toBe("INTERIM (2026-10-31, 11 of 28 fixtures run)");
	});
	it("leaves notice empty for a final report", () => {
		expect(buildEntry(file, "# T\n\nBody.", { blobBase: "x", updated: "d", docx: null }).data.notice).toBe("");
	});
});

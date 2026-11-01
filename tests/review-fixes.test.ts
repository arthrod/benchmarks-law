import { describe, expect, it } from "vitest";
import { extractDek, renderMarkdown, rewriteLinks, wordCount, REPORT_FILES } from "../src/lib/reports";
import { patchNeuroticHtml } from "../src/lib/neurotic";
import { safeSiteUrl } from "../src/lib/vendors";

const ctx = { fromPath: "reports/x.md", blobBase: "https://github.com/a/b/blob/c/" };

describe("review fixes (#21)", () => {
	it("no report slug collides with a static route under /editors-trial/", () => {
		const statics = new Set(["vendors", "index", "figures", "files"]);
		for (const f of REPORT_FILES) expect(statics.has(f.slug), f.slug).toBe(false);
	});
	it("allows only https vendor sites", () => {
		expect(safeSiteUrl("https://superdoc.dev/")).toBe("https://superdoc.dev/");
		expect(safeSiteUrl("javascript:alert(1)")).toBeNull();
		expect(safeSiteUrl("http://x.test")).toBeNull();
		expect(safeSiteUrl("not a url")).toBeNull();
	});
	it("keeps the fragment on neurotic report links", () => {
		const html = '<a href="https://github.com/jandira-tech/editors_trial/blob/main/reports/Report%20D%20-%20Safety%2C%20Resource%20Bombs%20and%20Hostile%20Input%20(2026).md#tldr">D</a>';
		expect(patchNeuroticHtml(html, new Set())).toContain('href="/editors-trial/report-d#tldr"');
	});
	it("rewrites neurotic dead links only inside href attributes", () => {
		const html = "<p>See https://github.com/jandira-tech/editors_trial/blob/main/reports/x.md now</p>";
		expect(patchNeuroticHtml(html, new Set())).toContain("<p>See https://github.com/jandira-tech/editors_trial/blob/main/reports/x.md now</p>");
	});
	it("gives no empty heading ids", () => {
		expect(renderMarkdown("## <b></b>").html).not.toContain('id=""');
	});
	it("does not put a figure inside a paragraph, and does not repeat the alt as caption to AT", () => {
		const { html } = renderMarkdown("Some text ![alt](x.png) after");
		expect(html).not.toMatch(/<p>[^]*<figure>/);
		const solo = renderMarkdown("![A chart](x.png)").html;
		expect(solo).toContain("<figure>");
		expect(solo).toContain('<figcaption aria-hidden="true">A chart</figcaption>');
	});
	it("counts hyphenated words once", () => {
		expect(wordCount("round-trip well-known state-of-the-art")).toBe(3);
	});
	it("skips build notes and status lines in the dek", () => {
		expect(extractDek("# T\n\nbuild/score_all.py measures x from out/x.\n\nThe real summary.")).toBe("The real summary.");
		expect(extractDek("# T\n\n**Status: interim (2026-10-31).** Word column pending.\n\nThe real summary.")).toBe("The real summary.");
	});
	it("encodes figure paths", () => {
		expect(rewriteLinks("![a](../out/ui/figures/my%20fig.png)", ctx)).toContain("](/editors-trial/figures/ui/figures/my%20fig.png)");
	});
});

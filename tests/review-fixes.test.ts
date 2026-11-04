import { describe, expect, it } from "vitest";
import { extractDek, renderMarkdown, rewriteLinks, wordCount, REPORT_FILES } from "../src/lib/reports";
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

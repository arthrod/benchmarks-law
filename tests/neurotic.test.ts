import { describe, expect, it } from "vitest";
import { patchNeuroticHtml } from "../src/lib/neurotic";

describe("patchNeuroticHtml", () => {
	it("points markdown report links at the rendered report pages", () => {
		const html = '<a href="https://github.com/jandira-tech/editors_trial/blob/main/reports/Report%20D%20-%20Safety%2C%20Resource%20Bombs%20and%20Hostile%20Input%20(2026).md">D</a>';
		expect(patchNeuroticHtml(html)).toContain('href="/editors-trial/report-d"');
	});
	it("sends a report's .docx link to the report page, which builds the .docx live", () => {
		const html = '<a href="https://github.com/jandira-tech/editors_trial/blob/main/reports/Report%20A%20-%20Serialization%20by%20Namespace%20(2026).docx">A</a>';
		expect(patchNeuroticHtml(html)).toContain('href="/editors-trial/report-a"');
		expect(patchNeuroticHtml(html)).not.toContain("/editors-trial/files/");
	});
	it("sends every other dead jandira-tech/editors_trial link to the real repository", () => {
		const html = '<a href="https://github.com/jandira-tech/editors_trial/tree/main/reports/extras">x</a><a href="https://github.com/jandira-tech/editors_trial">r</a>';
		const out = patchNeuroticHtml(html);
		expect(out).toContain('href="/editors-trial/#lanes"');
		expect(out).toContain('href="https://github.com/arthrod/editors_trial"');
		expect(out).not.toContain("jandira-tech/editors_trial");
	});
	it("adds a benchmarks.law link to the site nav once", () => {
		const html = '<nav aria-label="Site"><a href="./index.html">DOCX</a></nav>';
		const once = patchNeuroticHtml(html);
		expect(once).toContain('<a class="home-link" href="/">benchmarks.law</a>');
		expect(patchNeuroticHtml(once).match(/home-link/g)?.length).toBe(1);
	});
	it("leaves the neurotic_docx_bench repository links alone", () => {
		const html = '<a href="https://github.com/jandira-tech/neurotic_docx_bench">b</a>';
		expect(patchNeuroticHtml(html)).toBe(html);
	});
});

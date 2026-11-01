import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { rewriteLinks } from "../src/lib/reports";

const src = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const SITE = resolve(import.meta.dirname, "..");
const REPORTS_ROOT = resolve(process.env.REPORTS_ROOT ?? join(SITE, "../../editors_trial"));

// 4434743500 (CodeRabbit, #31): the restored mobile header (z-index 60) covered the case drawer's controls
describe("mobile case drawer", () => {
	const css = src("public/neurotic-docx-bench/_static/bench.css");
	const z = (sel: RegExp) => Number(css.match(sel)?.[1]);
	const header = Number(src("public/nav.css").match(/#brand\.site-nav\{[^}]*z-index:(\d+)/)?.[1]);
	it("the drawer and its scrim sit above the site header, the drawer above the scrim", () => {
		const side = z(/body\.mobile #side\{[^}]*z-index:(\d+)/);
		const scrim = z(/body\.mobile\.drawer #scrim\{[^}]*z-index:(\d+)/);
		expect(header).toBe(60);
		expect(scrim).toBeGreaterThan(header);
		expect(side).toBeGreaterThan(scrim);
	});
});

// 4434743504 (CodeRabbit, #31): Word is the reference for the page benches only
describe("benches home page", () => {
	const html = src("public/neurotic-docx-bench/home/index.html");
	it("does not call Word the reference of every bench", () => {
		expect(html).not.toContain("Every bench here takes Word's output as the reference");
		expect(html).not.toContain("Every score is measured against what Microsoft Word produced");
		expect(html).not.toContain("the speed bench times the same call");
	});
	it("says what the speed bench and the trial compare against", () => {
		expect(html).toMatch(/speed bench[^.]*no reference/);
		expect(html).toMatch(/trial[^.]*against (its|the) input/);
	});
	it("counts the trial's 99 checks and seven companion reports", () => {
		expect(html).not.toMatch(/\b97\b/);
		expect(html).toContain("<b>99</b><span>checks per round trip</span>");
		expect(html).not.toContain("Five companion reports");
		expect(html).toContain("Seven companion reports");
	});
});

// 4434743508 (CodeRabbit, #31): arrow keys on a focused radio button must move the radio, not the case
describe("viewer keyboard shortcuts", () => {
	it.each(["public/neurotic-docx-bench/index.html", "public/neurotic-docx-bench/redlines/index.html"])("%s leaves radio buttons alone", (p) => {
		const guard = src(p).match(/e\.target\.tagName === 'INPUT' && \[([^\]]*)\]\.includes\(e\.target\.type\)/)?.[1] ?? "";
		expect(guard).toContain("'radio'");
	});
});

// 4434743512 (CodeRabbit, #31): 29 redline cases have no jubarte-rust pages; the overlay must show an engine the case has
describe("redlines overlay engine", () => {
	const html = src("public/neurotic-docx-bench/redlines/index.html");
	const body = html.match(/function ovlTop\(c, want\) \{([\s\S]*?)\n\}/)?.[1];
	const ovlTop = new Function("c", "want", body ?? "throw new Error('ovlTop is missing')") as (c: unknown, want: string) => string | null;
	const c = (pages: Record<string, string[]>, dropped: string[] = []) => ({ pages, dropped });
	it("keeps the chosen engine when the case has its pages", () => {
		expect(ovlTop(c({ reference: ["r"], "jubarte-rust": ["j"], superdoc: ["s"] }), "jubarte-rust")).toBe("jubarte-rust");
	});
	it("falls back to the first engine with pages when the chosen one has none", () => {
		expect(ovlTop(c({ reference: ["r"], "jubarte-rust": [], superdoc: ["s"] }), "jubarte-rust")).toBe("superdoc");
		expect(ovlTop(c({ reference: ["r"], superdoc: ["s"] }), "jubarte-rust")).toBe("superdoc");
	});
	it("never falls back to Word itself or to a dropped engine", () => {
		expect(ovlTop(c({ reference: ["r"], docxodus: ["d"], superdoc: ["s"] }, ["docxodus"]), "jubarte-rust")).toBe("superdoc");
		expect(ovlTop(c({ reference: ["r"] }), "jubarte-rust")).toBe(null);
	});
	it("the desktop overlay uses it", () => {
		expect(html).toContain("ovlB = MOBILE ? mSecond(c) : ovlTop(c, state.ovlB)");
	});
});

// The bench's "at a glance" page carried the 2026-10-30 numbers after the 2026-11-01 correction. Its
// scorecard must equal the main report's, row for row.
const mainReport = join(REPORTS_ROOT, "Open-Source DOCX Editors Re-verified Against Code and Measured Round-Trip (2026).md");
describe.skipIf(!existsSync(mainReport))("editors trial at-a-glance scorecard", () => {
	const strip = (t: string) => t.replace(/<[^>]+>/g, "").replace(/[*_]/g, "").replace(/\s+/g, " ").trim();
	const reportRows = () => {
		const md = readFileSync(mainReport, "utf8");
		const at = md.indexOf("| Editor | Weighted score | Critical features |");
		const lines = md.slice(at).split("\n");
		const end = lines.findIndex((l) => !l.startsWith("|"));
		return lines
			.slice(2, end)
			.map((l) => l.split("|").slice(1, -1).map(strip))
			.map(([name, w, crit, text, parts, failed]) => [name.replace(" (baseline)", ""), w, crit.match(/\((\d+\/\d+)\)/)?.[1].replace("/", " / "), text, parts, failed]);
	};
	const pageRows = () => {
		const html = src("public/neurotic-docx-bench/editors/index.html");
		const body = html.slice(html.indexOf('<table class="score">'), html.indexOf("</table>"));
		return [...body.matchAll(/<tr[^>]*>(<td[\s\S]*?)<\/tr>/g)].map((m) => {
			const c = [...m[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((x) => strip(x[1]));
			return [c[0].replace(" (baseline)", ""), c[1], c[3], c[4], c[5], c[6]];
		});
	};
	it("has every row of the main report, and no other", () => {
		const page = pageRows();
		const report = reportRows();
		expect(page.length).toBe(report.length);
		for (const r of report) expect(page).toContainEqual(r);
	});
	it("states the corrected counts", () => {
		const html = src("public/neurotic-docx-bench/editors/index.html");
		expect(html).not.toMatch(/\b97 checks|Score 97\b|\b31 \/ 31\b|>31<|\b(83\.0|86\.0|20\.5)%/);
		expect(html).toContain("99 checks");
		expect(html).toContain("<b>3</b><span>perfect round trips</span>");
		expect(html).toContain("corrected 2026-11-01");
	});
});

// #31 review 5726972304, outside-diff (CodeRabbit): inline code must not cross a CRLF blank line
describe("inline-code masking across paragraphs", () => {
	const ctx = { fromPath: "reports/Report C - Rendering Versus Word (2026).md", blobBase: "https://github.com/o/r/blob/b/" };
	const want = "[doc](https://github.com/o/r/blob/b/README.md)";
	it.each([
		["LF", "a `x\n\n[doc](../README.md) `y`"],
		["CRLF", "a `x\r\n\r\n[doc](../README.md) `y`"],
		["CRLF with a blank line of spaces", "a `x\r\n  \r\n[doc](../README.md) `y`"],
	])("%s: the link after the blank line is still rewritten", (_k, md) => {
		expect(rewriteLinks(md, ctx)).toContain(want);
	});
});

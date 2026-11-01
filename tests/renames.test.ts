import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import vendors from "../src/data/vendors.json";
import { REPORT_FILES, RENAMED_SLUGS } from "../src/lib/reports";

const SITE = resolve(__dirname, "..");
const REPORTS_ROOT = resolve(process.env.REPORTS_ROOT ?? join(SITE, "../../editors_trial"));

describe("Report E became Reports D1 and D2", () => {
	it("redirects each old slug to a report that exists", () => {
		expect(RENAMED_SLUGS).toEqual({ "report-e-jubarte": "report-d1-jubarte", "report-e-word": "report-d2-word" });
		const slugs = new Set(REPORT_FILES.map((f) => f.slug));
		for (const to of Object.values(RENAMED_SLUGS)) expect(slugs.has(to)).toBe(true);
		for (const from of Object.keys(RENAMED_SLUGS)) expect(slugs.has(from)).toBe(false);
	});

	it("files D1 and D2 between Report D and the notes", () => {
		const d1 = REPORT_FILES.find((f) => f.slug === "report-d1-jubarte")!;
		const d2 = REPORT_FILES.find((f) => f.slug === "report-d2-word")!;
		expect([d1.code, d1.position, d2.code, d2.position]).toEqual(["Report D1", 51, "Report D2", 52]);
	});
});

describe("the bench's editors page lists every report", () => {
	const html = readFileSync(join(SITE, "public/neurotic-docx-bench/editors/index.html"), "utf8");
	it.each(REPORT_FILES.filter((f) => f.group === "reports" && f.slug !== "round-trip").map((f) => [f.code, f.slug]))(
		"%s links to /editors-trial/%s",
		(_code, slug) => {
			expect(html).toContain(`href="/editors-trial/${slug}"`);
		},
	);
	it("has no link to a renamed slug", () => {
		for (const from of Object.keys(RENAMED_SLUGS)) expect(html).not.toContain(`/editors-trial/${from}"`);
	});
});

const reportC = join(REPORTS_ROOT, "reports/Report C - Rendering Versus Word (2026).md");
describe.skipIf(!existsSync(reportC))("vendor render sections", () => {
	const headings = new Set(
		readFileSync(reportC, "utf8")
			.split("\n")
			.filter((l) => l.startsWith("### "))
			.map((l) => l.slice(4).trim()),
	);
	it.each((vendors as { name: string; renderSection?: string }[]).filter((v) => v.renderSection).map((v) => [v.name, v.renderSection!]))(
		"%s points at a real Report C heading",
		(_name, section) => {
			expect(headings.has(section)).toBe(true);
		},
	);
});

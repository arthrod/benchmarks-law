import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { partitionReports } from "../src/lib/positions";
import { rewriteLinks } from "../src/lib/reports";
import { isLocalEmDash, reportsRoot } from "../src/lib/root";

const src = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const ctx = { fromPath: "reports/Report C - Rendering Versus Word (2026).md", blobBase: "https://github.com/o/r/blob/b/" };

// 4434725278 (gitar) and 4434730430 (CodeAnt): sync upserts but never deletes, so a renamed report's old
// CMS entry would be listed beside its replacement.
describe("a CMS entry under a renamed slug", () => {
	it("is not listed in any group", () => {
		const rows = [
			{ slug: "report-d", data: { position: 50 } },
			{ slug: "report-d1-jubarte", data: { position: 51 } },
			{ slug: "report-e-jubarte", data: { position: 60 } },
			{ slug: "report-e-word", data: { position: 61 } },
		];
		const p = partitionReports(rows);
		expect(p.rows.map((r) => r.slug)).toEqual(["report-d", "report-d1-jubarte"]);
		expect(p.reports.map((r) => r.slug)).toEqual(["report-d", "report-d1-jubarte"]);
	});
});

// 4434725411 (gitar): a backtick fence's info string cannot contain a backtick (GFM 4.5)
describe("a line that starts with three backticks and closes them", () => {
	it("is inline code, not a fence, so the links after it are still rewritten", () => {
		const md = "```a``` is code\n\n[doc](../README.md)";
		expect(rewriteLinks(md, ctx)).toContain("[doc](https://github.com/o/r/blob/b/README.md)");
	});
	it("a real fence with an info string still protects its contents", () => {
		const md = "```ts title\n[a](../README.md)\n```";
		expect(rewriteLinks(md, ctx)).toBe(md);
	});
	it("a tilde fence may still carry backticks in its info string", () => {
		const md = "~~~ `x`\n[a](../README.md)\n~~~";
		expect(rewriteLinks(md, ctx)).toBe(md);
	});
});

// 4434731010 (CodeAnt): only a loopback EmDash may skip the token
describe("isLocalEmDash", () => {
	it.each(["http://localhost:4321", "http://localhost", "http://127.0.0.1:4321/", "http://[::1]:4321"])("%s is local", (u) => {
		expect(isLocalEmDash(u)).toBe(true);
	});
	it.each(["http://localhost.attacker.example", "http://localhost@evil.example", "https://benchmarks.law", "not a url"])(
		"%s is not",
		(u) => {
			expect(isLocalEmDash(u)).toBe(false);
		},
	);
	it("is what sync.ts checks", () => {
		expect(src("scripts/sync.ts")).toContain("isLocalEmDash(URL_)");
		expect(src("scripts/sync.ts")).not.toContain("http:\\/\\/localhost");
	});
});

// 4434735441 (CodeAnt): an existing file or an empty folder is not a checkout
describe("reportsRoot rejects what is not an editors_trial checkout", () => {
	it("a file", () => {
		const f = join(mkdtempSync(join(tmpdir(), "rf-")), "x");
		writeFileSync(f, "");
		expect(() => reportsRoot({ REPORTS_ROOT: f }, "/x")).toThrow(/not an editors_trial checkout/);
	});
	it("an empty folder", () => {
		expect(() => reportsRoot({ REPORTS_ROOT: mkdtempSync(join(tmpdir(), "re-")) }, "/x")).toThrow(/not an editors_trial checkout/);
	});
	it("accepts a folder with reports/", () => {
		const d = mkdtempSync(join(tmpdir(), "ok-"));
		mkdirSync(join(d, "reports"));
		expect(reportsRoot({ REPORTS_ROOT: d }, "/x")).toBe(d);
	});
});

// 4434736488 (CodeAnt): the OFL must name the fonts' copyright holders
describe("OFL.txt", () => {
	it.each(["public/fonts/OFL.txt"])("%s has no template placeholders", (p) => {
		const s = src(p);
		expect(s).not.toMatch(/<dates>|<Copyright Holder>|<Reserved Font Name>/);
		expect(s).toContain("Copyright 2020 The Libre Franklin Project Authors");
		expect(s).toContain("Copyright 2015 The Roboto Mono Project Authors");
	});
});

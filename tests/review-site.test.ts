import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { partitionReports } from "../src/lib/positions";
import { renderMarkdown, rewriteLinks } from "../src/lib/reports";
import { reportsRoot } from "../src/lib/root";
import { switcherGroups } from "../src/lib/switcher";
import { fmtScore, safetyVerdict } from "../src/lib/vendors";

const src = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const ctx = {
	fromPath: "reports/Report C - Rendering Versus Word (2026).md",
	blobBase: "https://github.com/o/r/blob/b/",
};

// 4433971428 (cms.ts position) and 4434620740 (switcher fallback)
describe("a report without a position", () => {
	const rows = [
		{ slug: "b", data: { position: 30, code: "B", title: "B" } },
		{ slug: "nopos", data: { code: "X", title: "X" } as { position?: number; code: string; title: string } },
		{ slug: "lane", data: { position: 100, code: "Lane note", title: "L" } },
	];
	it("is kept in the reports group, first, instead of vanishing from every index group", () => {
		const p = partitionReports(rows);
		expect(p.rows.map((r) => r.slug)).toEqual(["nopos", "b", "lane"]);
		expect(p.reports.map((r) => r.slug)).toEqual(["nopos", "b"]);
		expect(p.rows.every((r) => typeof r.data.position === "number")).toBe(true);
	});
	it("lands in the same switcher group as on the index pages", () => {
		const { rows: normalised } = partitionReports(rows);
		const reports = switcherGroups(normalised, "b").find((g) => g.label === "Reports")!;
		expect(reports.items.map((i) => i.slug)).toEqual(["nopos", "b"]);
	});
});

// 4433974100, 4434279600, 4434666052: a missing REPORTS_ROOT must stop the sync before it writes anything
describe("reportsRoot", () => {
	it("throws a clear error when the checkout is absent", () => {
		expect(() => reportsRoot({ REPORTS_ROOT: "/nonexistent/editors_trial" }, "/x/site")).toThrow(/REPORTS_ROOT not found: \/nonexistent\/editors_trial/);
	});
	it("resolves the documented default next to the site's parent", () => {
		const base = mkdtempSync(join(tmpdir(), "root-"));
		const site = join(base, "a", "site");
		expect(() => reportsRoot({}, site)).toThrow(/REPORTS_ROOT not found/);
		expect(src("scripts/sync.ts")).toMatch(/REPORTS_ROOT\s+editors_trial checkout \(default \.\.\/\.\.\/editors_trial\)/);
	});
	it("returns an existing checkout", () => {
		const dir = mkdtempSync(join(tmpdir(), "et-"));
		expect(reportsRoot({ REPORTS_ROOT: dir }, "/x/site")).toBe(dir);
	});
	it("is checked before any sync command runs", () => {
		expect(src("scripts/sync.ts")).toMatch(/const ROOT = reportsRoot\(process\.env, SITE\);/);
	});
});

// 4433974102: rewrite only the figures that assets() publishes
describe("figure links", () => {
	it.each([
		["../out/ui/figures/fig_ui_folio_p3.png", "/editors-trial/figures/ui/figures/fig_ui_folio_p3.png"],
		["../out/render/figures/a.webp", "/editors-trial/figures/render/figures/a.webp"],
	])("publishes %s", (link, want) => {
		expect(rewriteLinks(`![x](${link})`, ctx)).toBe(`![x](${want})`);
	});
	it.each(["../out/ui/figures/a.svg", "../out/ui/figures/a.gif", "../out/ui/figures/A.PNG", "../out/ui/a.png"])(
		"sends %s, which sync does not copy, to GitHub",
		(link) => {
			expect(rewriteLinks(`![x](${link})`, ctx)).toBe(`![x](https://github.com/o/r/blob/b/${link.slice(3)})`);
		},
	);
});

// 4434537175: inline code is recognised before fences
describe("rewriteLinks and code", () => {
	it("does not open a fence at tildes inside inline code", () => {
		const md = "`~~~` [doc](../README.md)\n~~~\n[a](Report%20A%20-%20Serialization%20by%20Namespace%20(2026).md)\n~~~";
		const out = rewriteLinks(md, ctx);
		expect(out).toContain("[doc](https://github.com/o/r/blob/b/README.md)");
		expect(out).toContain("[a](Report%20A%20-%20Serialization%20by%20Namespace%20(2026).md)");
	});
	it("still leaves links in real fences alone and rewrites code-labelled links", () => {
		const md = "```\n[a](../README.md)\n```\n[`README`](../README.md) and `[b](../README.md)`";
		const out = rewriteLinks(md, ctx);
		expect(out).toContain("```\n[a](../README.md)\n```");
		expect(out).toContain("[`README`](https://github.com/o/r/blob/b/README.md)");
		expect(out).toContain("`[b](../README.md)`");
	});
	it("keeps a double-backtick span that contains a backtick", () => {
		const md = "``a ` [b](../README.md)`` [c](../README.md)";
		const out = rewriteLinks(md, ctx);
		expect(out).toContain("``a ` [b](../README.md)``");
		expect(out).toContain("[c](https://github.com/o/r/blob/b/README.md)");
	});
});

// 4433974073: XSS payloads, asserting active markup only
const ACTIVE_EVENT = /<[a-z][^>]*\son(?:error|load|click|mouseover)\s*=/i;
describe("renderMarkdown neutralises", () => {
	it.each([
		["script tag", "<script>alert(1)</script>"],
		["img onerror", '<img src=x onerror="alert(1)">'],
		["svg onload", "<svg onload=alert(1)>"],
		["iframe", '<iframe src="https://evil.example"></iframe>'],
		["javascript link", "[x](javascript:alert(1))"],
		["javascript link with whitespace", "[x](java\tscript:alert(1))"],
		["vbscript link", "[x](vbscript:msgbox(1))"],
		["data link", "[x](data:text/html,<script>alert(1)</script>)"],
		["javascript image", "![x](javascript:alert(1))"],
		["raw anchor", '<a href="javascript:alert(1)">x</a>'],
	])("%s", (_name, md) => {
		const { html } = renderMarkdown(md);
		expect(html).not.toMatch(/<(script|iframe|svg|img\s[^>]*onerror)/i);
		expect(html).not.toMatch(ACTIVE_EVENT);
		expect(html).not.toMatch(/<(a|img)\s[^>]*(href|src)="\s*(javascript|vbscript|data):/i);
	});
});

// 4434281671, 4434275980 and the two vendors.astro nitpicks (absent baseline round trip, ungraded baseline)
describe("vendor scores", () => {
	it("formats a present score and returns null for an absent one", () => {
		expect(fmtScore(98.5, 1)).toBe("98.5");
		expect(fmtScore(0, 2)).toBe("0.00");
		expect(fmtScore(null, 1)).toBeNull();
		expect(fmtScore(undefined, 2)).toBeNull();
	});
	it("treats an absent grade as ungraded", () => {
		expect(safetyVerdict(undefined)).toBe("ungraded");
	});
	const page = src("src/pages/editors-trial/vendors.astro");
	it("never calls toFixed on a score directly", () => {
		expect(page).not.toMatch(/\.(roundtrip|safety)\??\.toFixed/);
	});
	it("routes every vendor and baseline site link through safeSiteUrl", () => {
		expect(page).not.toMatch(/href=\{(v\.data|d)\.site\}/);
	});
	it("labels an ungraded baseline instead of calling it below the pass line", () => {
		const base = page.slice(page.indexOf("baseline.map"));
		expect(base).toContain('safetyVerdict(v.data.safety) === "ungraded"');
	});
	// 4433971429: the fineprint claim must match the links on the page
	it("links each measurement to its report", () => {
		expect(page).not.toContain("Every number links back to the");
		expect(page).toContain('href="/editors-trial/round-trip"');
		expect(page).toContain('href="/editors-trial/report-d"');
	});
});

// 4433971427: EmDashHead renders the description once
describe("Site.astro head", () => {
	it("has no hand-written description tag", () => {
		expect(src("src/layouts/Site.astro")).not.toContain('<meta name="description"');
	});
});

// 4433974110, 4434537174, 4434666063 and the CodeAnt cache-hint nitpicks
describe("pages that render the report list set its cache hint", () => {
	it.each(["src/pages/editors-trial/[slug].astro", "src/pages/editors-trial/vendors.astro", "src/pages/index.astro", "src/pages/editors-trial/index.astro"])(
		"%s",
		(p) => {
			const s = src(p);
			expect(s).toMatch(/cacheHint: ?(\w+) \} = await listReports\(\)|\{[^}]*cacheHint[^}]*\} = await listReports\(\)/);
			const name = s.match(/cacheHint(?:: ?(\w+))? [^}]*\} = await listReports\(\)/)?.[1] ?? "cacheHint";
			expect(s).toContain(`Astro.cache.set(${name})`);
		},
	);
});

// 4434537165, 4434537169, 4434537179, 4433974089
describe("astro.config.mjs", () => {
	const config = src("astro.config.mjs");
	it("caches public pages for 300 s, serves stale for an hour, and tags them with site settings", () => {
		expect(config).toMatch(/const PUBLIC_PAGE = \{\s*maxAge:\s*300,\s*swr:\s*3600,\s*tags:\s*\["emdash:settings"\]\s*\}/);
	});
	it("delivers the editor toolbar client-side, so cached pages stay editable", () => {
		expect(config).toMatch(/emdash\(\{[\s\S]*toolbar:\s*"client"/);
	});
	it("pre-bundles picomatch through a path pnpm resolves from the root", () => {
		expect(config).toContain('"astro > @astrojs/internal-helpers > picomatch"');
		expect(existsSync(new URL("../node_modules/astro/package.json", import.meta.url))).toBe(true);
	});
});

// review-body item on sync.ts:147 — vendors() writes to EmDash too
describe("sync token check", () => {
	it("runs before both CMS writers", () => {
		const s = src("scripts/sync.ts");
		expect(s).toMatch(/function vendors\(\) \{\n\trequireToken\(\);/);
		expect(s).toMatch(/async function content\(\) \{\n\trequireToken\(\);/);
	});
});

// CodeAnt #22 nitpick 2: a code span may run over a single line break
describe("multi-line code spans", () => {
	it("keeps a link inside a code span that wraps a line", () => {
		const md = "see `the [x](../README.md)\nfile` and [y](../README.md)";
		const out = rewriteLinks(md, ctx);
		expect(out).toContain("`the [x](../README.md)\nfile`");
		expect(out).toContain("[y](https://github.com/o/r/blob/b/README.md)");
	});
	it("does not let a lone backtick swallow the next paragraph", () => {
		const out = rewriteLinks("a ` b\n\n[y](../README.md) `", ctx);
		expect(out).toContain("[y](https://github.com/o/r/blob/b/README.md)");
	});
});

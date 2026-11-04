import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { injectNavbar, navbarHtml, trialGroups } from "../src/lib/navbar";

const rows = [
	{ slug: "round-trip", data: { position: 0, code: "Main report", title: "Main <title>" } },
	{ slug: "report-c", data: { position: 40, code: "Report C", title: "Rendering" } },
	{ slug: "lane-folio", data: { position: 106, code: "Lane note", title: "Folio" } },
];

describe("trialGroups", () => {
	it("puts the trial's own pages first, then reports, notes and lane notes", () => {
		const g = trialGroups(rows, "/editors-trial/report-c");
		expect(g.map((x) => x.label)).toEqual(["The trial", "Reports", "Lane notes"]);
		expect(g[0].items.map((i) => i.href)).toEqual(["/neurotic-docx-bench/editors/", "/editors-trial/", "/editors-trial/vendors"]);
	});

	it("marks the page being viewed, wherever it is", () => {
		const cur = (path: string) => trialGroups(rows, path).flatMap((g) => g.items).filter((i) => i.current).map((i) => i.href);
		expect(cur("/editors-trial/report-c")).toEqual(["/editors-trial/report-c"]);
		expect(cur("/editors-trial/")).toEqual(["/editors-trial/"]);
		expect(cur("/neurotic-docx-bench/editors/")).toEqual(["/neurotic-docx-bench/editors/"]);
		expect(cur("/neurotic-docx-bench/redlines/")).toEqual([]);
	});
});

describe("the wordmark is the way home; the links start at Scores (Arthur, 2026-11-03)", () => {
	const home = navbarHtml({ crumb: "benchmarks.law", current: "site", path: "/", rows });
	const scores = navbarHtml({ crumb: "Scores", current: "benches", path: "/neurotic-docx-bench/", rows });
	it("links the wordmark to the site's home, not the leaderboard", () => {
		for (const h of [home, scores]) expect(h).toContain('<a class="wm" href="/">');
	});
	it("drops the benchmarks.law link and names the leaderboard Scores", () => {
		for (const h of [home, scores]) {
			expect(h).not.toMatch(/<a[^>]*>benchmarks\.law<\/a>/);
			expect(h).not.toContain(">Benches<");
			expect(h).toContain('<nav id="site-links" aria-label="Site"><a href="/neurotic-docx-bench/"');
		}
		expect(scores).toContain('<a href="/neurotic-docx-bench/" aria-current="page">Scores</a>');
		expect(home).toContain('<a href="/neurotic-docx-bench/">Scores</a>');
	});
	it("keeps each page's crumb: benchmarks.law at home, Scores on the leaderboard", () => {
		expect(home).toContain('<span class="crumb">/ benchmarks.law</span>');
		expect(scores).toContain('<span class="crumb">/ Scores</span>');
	});
});

describe("navbarHtml", () => {
	const html = navbarHtml({ crumb: "Report C", current: "editors", path: "/editors-trial/report-c", rows });

	it("is the bench home navbar: wordmark, crumb and the same links in the same order", () => {
		expect(html).toMatch(/^<header id="brand"/);
		expect(html).toContain('<span class="del">CHILL</span><span class="ins">NEUROTIC</span>');
		expect(html).toContain('<span class="crumb">/ Report C</span>');
		const labels = [...html.matchAll(/<(?:a|summary|span class="nav-title")[^>]*>([^<]+)</g)].map((m) => m[1]).filter((t) => !/^(CHILL|NEUROTIC)$/.test(t));
		expect(labels.slice(0, 8)).toEqual(["Scores", "DOCX → PDF", "Redlines", "Speed", "Editors trial", "At a glance", "All reports", "The field"]);
		expect(html).toContain('href="https://github.com/jandira-tech/neurotic_docx_bench"');
		expect(html).toContain('class="nav-contact"');
	});

	it("has a MENU box that controls the site links, collapsed, before the nav (mobile)", () => {
		expect(html).toMatch(/<button type="button" class="nav-menu" aria-expanded="false" aria-controls="site-links">Menu<\/button><nav id="site-links" aria-label="Site">/);
	});

	it("keeps the links visible without JavaScript: only nav.js arms the menu", () => {
		const css = readFileSync(new URL("../public/nav.css", import.meta.url), "utf8");
		const js = readFileSync(new URL("../public/nav.js", import.meta.url), "utf8");
		expect(css).toMatch(/#brand\.site-nav\.has-menu:not\(\.menu-open\) nav\{display:none\}/);
		expect(css).toMatch(/\.nav-menu\{display:none/);
		expect(js).toContain('classList.add("has-menu")');
		expect(js).toContain('"aria-expanded"');
	});

	it("marks the current section and the current page", () => {
		expect(html).toContain('<details class="nav-dd is-current"');
		expect(html).toContain('href="/editors-trial/report-c" aria-current="page"');
		const other = navbarHtml({ crumb: "Speed", current: "speed", path: "/neurotic-docx-bench/speed/", rows });
		expect(other).toContain('href="/neurotic-docx-bench/speed/" aria-current="page"');
		expect(other).not.toContain("nav-dd is-current");
	});

	it("escapes titles", () => {
		expect(html).toContain("Main &lt;title&gt;");
		expect(html).not.toContain("Main <title>");
	});
});

describe("injectNavbar", () => {
	const nav = '<header id="brand">NEW</header>';
	const page = '<html><head><link rel="stylesheet" href="../_static/bench.css">\n</head><body><header id="brand"><a>old</a><nav>x</nav></header><main></main></body></html>';

	it("replaces the old header and adds the shared stylesheet and script once", () => {
		const once = injectNavbar(page, nav);
		expect(once).toContain('<body><header id="brand">NEW</header><main>');
		expect(once).not.toContain("old");
		const twice = injectNavbar(once, nav);
		expect(twice).toBe(once);
		expect(twice.match(/\/nav\.css/g)).toHaveLength(1);
		expect(twice.match(/\/nav\.js/g)).toHaveLength(1);
	});
});

describe("benchPage", async () => {
	const { benchPage } = await import("../src/lib/navbar");
	const page = (crumb: string) =>
		`<html><head>\n</head><body><header id="brand"><a class="wm">x</a><span class="crumb">/ ${crumb}</span><nav></nav></header></body></html>`;

	it("keeps the page's own crumb and marks its section, on every bench page", () => {
		const cases: [string, string, string][] = [
			["cases/index.html", "DOCX → PDF vs Microsoft Word", '/neurotic-docx-bench/cases/" aria-current="page"'],
			["redlines/index.html", "Redlines vs Microsoft Word", '/neurotic-docx-bench/redlines/" aria-current="page"'],
			["speed/index.html", "Speed on 10,000 inputs", '/neurotic-docx-bench/speed/" aria-current="page"'],
			["editors/index.html", "Editors trial", 'nav-dd is-current'],
		];
		for (const [rel, crumb, mark] of cases) {
			const out = benchPage(page(crumb), rel, rows);
			expect(out).toContain(`<span class="crumb">/ ${crumb}</span>`);
			expect(out).toContain(mark);
			expect(benchPage(out, rel, rows)).toBe(out);
		}
	});

	it("marks At a glance on the bench editors page", () => {
		expect(benchPage(page("Editors trial"), "editors/index.html", rows)).toContain('href="/neurotic-docx-bench/editors/" aria-current="page"');
	});
});

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
	API_CATALOG_LINK,
	DESCRIBEDBY_LINK,
	FEED_LINK,
	PUBLICATION_DESCRIPTION,
	SITE_ORIGIN,
	apiCatalog,
	breadcrumbJsonLd,
	breadcrumbs,
	organizationJsonLd,
	publicPaths,
	rfc822Date,
	rssXml,
	safeJsonLd,
	sitemapIndexXml,
	sitemapXml,
	withDocumentHeaders,
} from "../src/lib/discovery";

const src = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

describe("public discovery", () => {
	it("lists the public pages once, and omits the admin, the MCP endpoint and renamed slugs", () => {
		const paths = publicPaths();
		expect(new Set(paths).size).toBe(paths.length);
		expect(paths).toContain("/");
		expect(paths).toContain("/about");
		expect(paths).toContain("/editors-trial");
		expect(paths).toContain("/editors-trial/report-c");
		expect(paths).toContain("/editors-trial/demo/superdoc");
		expect(paths).toContain("/legal-ai/info-extraction");
		expect(paths).toContain("/neurotic-docx-bench/cases/");
		expect(paths.some((path) => path.includes("report-e-") || path.includes("/_emdash") || path === "/mcp")).toBe(false);
	});

	it("writes one sitemap and an index that points at it", () => {
		const xml = sitemapXml(["/", "/about"]);
		expect(xml).toContain(`<loc>${SITE_ORIGIN}/</loc>`);
		expect(xml).toContain(`<loc>${SITE_ORIGIN}/about</loc>`);
		expect(xml).not.toContain("example.com");
		expect(sitemapIndexXml()).toContain(`<loc>${SITE_ORIGIN}/sitemap.xml</loc>`);
	});

	it("robots.txt allows the site, hides the admin, and names the real sitemap", () => {
		const robots = src("public/robots.txt");
		expect(robots).toMatch(/^User-agent: \*$/m);
		expect(robots).toMatch(/^Allow: \/$/m);
		expect(robots).toMatch(/^Disallow: \/_emdash\/$/m);
		expect(robots).toContain("Sitemap: https://benchmarks.law/sitemap-index.xml");
		expect(robots).not.toContain("example.com");
	});

	it("publishes an install manifest and the head links it", () => {
		const manifest = JSON.parse(src("public/manifest.webmanifest")) as {
			name: string;
			lang: string;
			start_url: string;
			display: string;
			icons: { src: string }[];
		};
		expect(manifest.name).toBe("benchmarks.law");
		expect(manifest.lang).toBe("en");
		expect(manifest.start_url).toBe("/");
		expect(manifest.display).toBe("browser");
		expect(manifest.icons.map((icon) => icon.src)).toEqual(["/b-law.svg", "/apple-touch-icon.png"]);
		const head = src("src/layouts/Site.astro");
		expect(head).toContain('rel="manifest" href="/manifest.webmanifest"');
		expect(head).toContain('rel="apple-touch-icon" href="/apple-touch-icon.png"');
		expect(head).toContain('image: new URL("/og.png"');
	});

	it("adds an Organization and a breadcrumb trail without closing the script early", () => {
		const org = organizationJsonLd("measured");
		const graph = org["@graph"] as {
			"@type": string;
			logo?: string;
			description?: string;
			dataset?: { name: string; url: string }[];
			hasPart?: { headline: string; url: string; author: { name: string }[]; license?: string }[];
		}[];
		const organization = graph.find((node) => node["@type"] === "Organization");
		const catalog = graph.find((node) => node["@type"] === "DataCatalog");
		expect(organization?.logo).toBe(`${SITE_ORIGIN}/b-law.svg`);
		expect(organization?.description).toBe("measured");
		expect(graph.some((node) => node["@type"] === "WebSite")).toBe(false);
		expect(catalog?.dataset?.map((dataset) => dataset.url)).toEqual([
			`${SITE_ORIGIN}/editors-trial`,
			`${SITE_ORIGIN}/neurotic-docx-bench/`,
		]);
		expect(catalog?.hasPart?.map((part) => part.url)).toEqual([
			`${SITE_ORIGIN}/legal-ai/info-extraction`,
			`${SITE_ORIGIN}/legal-ai/contract-drafting`,
		]);
		expect(catalog?.hasPart?.[0]?.headline.length).toBeGreaterThan(0);
		expect(catalog?.hasPart?.[0]?.author.map((person) => person.name)).toContain("Arthur Souza Rodrigues");
		expect(catalog?.hasPart?.[0]?.license).toBe("https://creativecommons.org/licenses/by/4.0/");
		expect(catalog?.hasPart?.[1]?.license).toBeUndefined();
		const feed = graph.find((node) => node["@type"] === "DataFeed") as { url?: string } | undefined;
		expect(feed?.url).toBe(`${SITE_ORIGIN}/rss.xml`);
		expect(src("src/layouts/Site.astro")).toContain("organizationJsonLd(PUBLICATION_DESCRIPTION)");
		expect(breadcrumbs("/", undefined)).toEqual([{ name: "benchmarks.law", url: `${SITE_ORIGIN}/` }]);
		expect(breadcrumbs("/editors-trial/report-c", "Report C").map((item) => item.name)).toEqual([
			"benchmarks.law",
			"Editors trial",
			"Report C",
		]);
		const encoded = safeJsonLd(breadcrumbJsonLd([{ name: "a < b", url: `${SITE_ORIGIN}/` }]));
		expect(encoded).not.toContain("<");
		expect(encoded).toContain("\\u003c");
		expect(src("src/layouts/Site.astro")).toContain("organizationJsonLd");
		expect(src("src/layouts/Site.astro")).toContain("breadcrumbJsonLd");
		expect(src("src/layouts/Site.astro")).toContain('rel="alternate" type="application/rss+xml"');
		expect(src("src/pages/rss.xml.ts")).toContain("...reports, ...notes");
		expect(src("src/pages/rss.xml.ts")).toContain("Lane notes");
	});

	it("publishes an RSS feed of the reports and an API catalog for the MCP server", () => {
		expect(rfc822Date("2026-11-01")).toBe("Sun, 01 Nov 2026 00:00:00 GMT");
		expect(rfc822Date("2026-02-31")).toBeNull();
		const xml = rssXml([
			{ title: "Older <report>", url: `${SITE_ORIGIN}/editors-trial/report-a`, description: "A & B", date: "2026-01-02" },
			{ title: "Newer", url: `${SITE_ORIGIN}/editors-trial/report-c`, description: "c", date: "2026-03-04" },
			{ title: "Study", url: `${SITE_ORIGIN}/legal-ai/info-extraction`, description: "Early 2025. Measured." },
		]);
		expect(xml.indexOf("Newer")).toBeLessThan(xml.indexOf("Older"));
		expect(xml.indexOf("Older")).toBeLessThan(xml.indexOf("Study"));
		expect(xml).toContain("<lastBuildDate>Wed, 04 Mar 2026 00:00:00 GMT</lastBuildDate>");
		expect(xml).toContain("<title>Older &lt;report&gt;</title>");
		expect(xml).toContain("<description>A &amp; B</description>");
		expect(xml).toContain(`<description>${PUBLICATION_DESCRIPTION}</description>`);
		expect(xml.match(/<pubDate>/g)?.length).toBe(2);
		const catalog = apiCatalog();
		expect(catalog.linkset[0]?.anchor).toBe(`${SITE_ORIGIN}/mcp`);
		expect(catalog.linkset[0]?.["service-desc"][0]?.href).toBe(`${SITE_ORIGIN}/.well-known/mcp/server-card.json`);
		expect(catalog.linkset[0]?.["service-doc"][0]?.href).toBe(`${SITE_ORIGIN}/`);
	});

	it("sets nosniff and the sitemap link on HTML, and leaves an existing referrer policy", () => {
		const html = withDocumentHeaders(new Response("<html></html>", { headers: { "content-type": "text/html; charset=utf-8" } }));
		expect(html.headers.get("x-content-type-options")).toBe("nosniff");
		expect(html.headers.get("referrer-policy")).toBe("strict-origin-when-cross-origin");
		expect(html.headers.get("link")).toContain(DESCRIBEDBY_LINK);
		expect(html.headers.get("link")).toContain(API_CATALOG_LINK);
		expect(html.headers.get("link")).toContain(FEED_LINK);

		const pinned = withDocumentHeaders(
			new Response("{}", { headers: { "content-type": "application/json", "referrer-policy": "same-origin" } }),
		);
		expect(pinned.headers.get("referrer-policy")).toBe("same-origin");
		expect(pinned.headers.get("link")).toBeNull();
	});
});

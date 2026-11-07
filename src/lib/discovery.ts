import demos from "../data/demos.json" with { type: "json" };
import { STUDIES } from "./legalAi";
import { REPORT_FILES } from "./reports";

export const SITE_ORIGIN = "https://benchmarks.law";

/** The site-wide description. Page meta can be more specific. The catalog and the feed stay this. */
export const PUBLICATION_DESCRIPTION =
	"Open benchmarks for lawyers: DOCX editors and converters scored against Microsoft Word, with every input, output and log published, and legal AI tools tested against in-house lawyers.";

export const EDITORS_TRIAL_DESCRIPTION =
	"DOCX editors, open-source and commercial, measured by round trip. Each editor imports a purpose-built document and exports it again. The output is scored construct by construct and opened in Microsoft Word. A separate set of hostile packages tests what each editor refuses.";

export const DOCX_BENCH_DESCRIPTION =
	"DOCX to PDF conversion and redlines. Every engine converts the same corpus, or produces a tracked-changes document from the same pair, and each page is scored against Microsoft Word.";

/** Canonical public pages. Renamed report slugs are 301s, so they are not listed. */
export function publicPaths(): string[] {
	const paths = [
		"/",
		"/about",
		"/editors-trial",
		"/editors-trial/vendors",
		...REPORT_FILES.map((report) => `/editors-trial/${report.slug}`),
		...Object.keys(demos).map((slug) => `/editors-trial/demo/${slug}`),
		...STUDIES.map((study) => `/legal-ai/${study.slug}`),
		"/neurotic-docx-bench/",
		"/neurotic-docx-bench/cases/",
		"/neurotic-docx-bench/redlines/",
		"/neurotic-docx-bench/speed/",
		"/neurotic-docx-bench/editors/",
	];
	return [...new Set(paths)].sort((a, b) => a.localeCompare(b));
}

export function sitemapXml(paths: readonly string[], origin = SITE_ORIGIN): string {
	const urls = paths.map((path) => `  <url><loc>${origin}${path}</loc></url>`).join("\n");
	return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export function sitemapIndexXml(origin = SITE_ORIGIN): string {
	return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <sitemap><loc>${origin}/sitemap.xml</loc></sitemap>\n</sitemapindex>\n`;
}

const ORG_ID = `${SITE_ORIGIN}/#organization`;
const CATALOG_ID = `${SITE_ORIGIN}/#catalog`;

/**
 * Who publishes the site, and what the site is: a catalog of two measurement
 * datasets and the two legal-AI studies. EmDash already emits the WebSite node.
 */
export function organizationJsonLd(description: string) {
	const publisher = { "@id": ORG_ID };
	return {
		"@context": "https://schema.org",
		"@graph": [
			{
				"@type": "Organization",
				"@id": ORG_ID,
				name: "benchmarks.law",
				url: `${SITE_ORIGIN}/`,
				logo: `${SITE_ORIGIN}/b-law.svg`,
				description,
				sameAs: ["https://github.com/arthrod/editors_trial", "https://huggingface.co/arthrod", "https://arthur.law/"],
			},
			{
				"@type": "DataCatalog",
				"@id": CATALOG_ID,
				name: "benchmarks.law",
				description,
				url: `${SITE_ORIGIN}/`,
				publisher,
				dataset: [
					{
						"@type": "Dataset",
						name: "Editors trial",
						description: EDITORS_TRIAL_DESCRIPTION,
						url: `${SITE_ORIGIN}/editors-trial`,
						creator: publisher,
						isPartOf: { "@id": CATALOG_ID },
					},
					{
						"@type": "Dataset",
						name: "neurotic_docx_bench",
						description: DOCX_BENCH_DESCRIPTION,
						url: `${SITE_ORIGIN}/neurotic-docx-bench/`,
						creator: publisher,
						isPartOf: { "@id": CATALOG_ID },
					},
				],
				hasPart: STUDIES.map((study) => ({
					"@type": "ScholarlyArticle",
					headline: study.title,
					description: study.dek,
					url: `${SITE_ORIGIN}/legal-ai/${study.slug}`,
					author: study.authors.map((name) => ({ "@type": "Person", name })),
					...(study.license.startsWith("CC BY") ? { license: "https://creativecommons.org/licenses/by/4.0/" } : {}),
					sameAs: study.source,
					publisher,
					isPartOf: { "@id": CATALOG_ID },
				})),
			},
			{
				"@type": "DataFeed",
				"@id": `${SITE_ORIGIN}/rss.xml#feed`,
				name: "benchmarks.law",
				description,
				url: `${SITE_ORIGIN}/rss.xml`,
				encodingFormat: "application/rss+xml",
				publisher,
				isPartOf: { "@id": CATALOG_ID },
			},
		],
	};
}

export function breadcrumbJsonLd(items: readonly { name: string; url: string }[]) {
	return {
		"@context": "https://schema.org",
		"@type": "BreadcrumbList",
		itemListElement: items.map((item, index) => ({
			"@type": "ListItem",
			position: index + 1,
			name: item.name,
			item: item.url,
		})),
	};
}

/** Home is the site itself. Deeper pages add their section, then the page. */
export function breadcrumbs(pathname: string, title: string | undefined, origin = SITE_ORIGIN): { name: string; url: string }[] {
	const home = { name: "benchmarks.law", url: `${origin}/` };
	if (pathname === "/" || pathname === "") return [home];
	const items = [home];
	if (pathname.startsWith("/editors-trial")) items.push({ name: "Editors trial", url: `${origin}/editors-trial` });
	if (pathname.startsWith("/legal-ai")) items.push({ name: "Legal AI", url: `${origin}/#benches` });
	if (pathname.startsWith("/neurotic-docx-bench")) items.push({ name: "DOCX bench", url: `${origin}/neurotic-docx-bench/` });
	const pageUrl = new URL(pathname, origin).href;
	if (items[items.length - 1]?.url !== pageUrl) items.push({ name: title || pathname, url: pageUrl });
	return items;
}

/** Serialize JSON-LD without letting a `<` close the script tag. */
export function safeJsonLd(value: unknown): string {
	return JSON.stringify(value).replace(/</g, "\\u003c");
}

const RFC822_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const RFC822_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

/** RFC 822 date for an ISO day, or null when the day is not a real calendar date. */
export function rfc822Date(iso: string): string | null {
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
	if (!match) return null;
	const year = Number(match[1]);
	const month = Number(match[2]);
	const day = Number(match[3]);
	const date = new Date(Date.UTC(year, month - 1, day));
	if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
	return `${RFC822_DAYS[date.getUTCDay()]}, ${String(day).padStart(2, "0")} ${RFC822_MONTHS[month - 1]} ${year} 00:00:00 GMT`;
}

function xmlEscape(value: string): string {
	return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

export interface FeedItem {
	title: string;
	url: string;
	description: string;
	/** ISO day from the report record. Prose dates stay in the description. */
	date?: string;
}

/** RSS 2.0. Dated items lead, newest first. An item with no real day has no pubDate. */
export function rssXml(items: readonly FeedItem[], origin = SITE_ORIGIN, description = PUBLICATION_DESCRIPTION): string {
	const ordered = [...items].sort((a, b) => {
		const ad = a.date && rfc822Date(a.date) ? a.date : "";
		const bd = b.date && rfc822Date(b.date) ? b.date : "";
		if (ad && bd && ad !== bd) return bd.localeCompare(ad);
		if (ad && !bd) return -1;
		if (!ad && bd) return 1;
		return 0;
	});
	const newest = ordered.find((item) => item.date && rfc822Date(item.date))?.date;
	const lastBuild = newest ? `\n    <lastBuildDate>${rfc822Date(newest)}</lastBuildDate>` : "";
	const body = ordered
		.map((item) => {
			const pub = item.date ? rfc822Date(item.date) : null;
			const pubDate = pub ? `\n      <pubDate>${pub}</pubDate>` : "";
			return `    <item>\n      <title>${xmlEscape(item.title)}</title>\n      <link>${xmlEscape(item.url)}</link>\n      <guid isPermaLink="true">${xmlEscape(item.url)}</guid>\n      <description>${xmlEscape(item.description)}</description>${pubDate}\n    </item>`;
		})
		.join("\n");
	return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0">\n  <channel>\n    <title>benchmarks.law</title>\n    <link>${origin}/</link>\n    <description>${xmlEscape(description)}</description>\n    <language>en</language>${lastBuild}\n${body}\n  </channel>\n</rss>\n`;
}

/** RFC 9727 linkset. The API is the public MCP server. Its description is the server card. */
export function apiCatalog(origin = SITE_ORIGIN) {
	return {
		linkset: [
			{
				anchor: `${origin}/mcp`,
				"service-desc": [
					{
						href: `${origin}/.well-known/mcp/server-card.json`,
						type: "application/json",
						title: "MCP server card",
					},
				],
				"service-doc": [{ href: `${origin}/`, type: "text/html", title: "benchmarks.law" }],
			},
		],
	};
}

export const API_CATALOG_TYPE =
	'application/linkset+json; charset=utf-8; profile="https://www.rfc-editor.org/info/rfc9727"';

export const DESCRIBEDBY_LINK = '</sitemap-index.xml>; rel="describedby"; type="application/xml"';
export const API_CATALOG_LINK = '</.well-known/api-catalog>; rel="api-catalog"; type="application/linkset+json"';
export const FEED_LINK = '</rss.xml>; rel="alternate"; type="application/rss+xml"';

/** Security headers on every response. HTML also advertises the sitemap, the API catalog, and the feed. */
export function withDocumentHeaders(response: Response): Response {
	const headers = new Headers(response.headers);
	if (!headers.has("x-content-type-options")) headers.set("X-Content-Type-Options", "nosniff");
	if (!headers.has("referrer-policy")) headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
	const type = headers.get("content-type") ?? "";
	if (type.includes("text/html")) {
		const link = headers.get("link") ?? "";
		if (!link.includes('rel="describedby"')) headers.append("Link", DESCRIBEDBY_LINK);
		if (!link.includes('rel="api-catalog"')) headers.append("Link", API_CATALOG_LINK);
		if (!link.includes('rel="alternate"')) headers.append("Link", FEED_LINK);
	}
	return new Response(response.body, { headers, status: response.status, statusText: response.statusText });
}

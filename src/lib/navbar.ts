import { switcherGroups } from "./switcher";

/**
 * The one navbar for the whole site: the DOCX bench home's header (wordmark, crumb, links), with "Editors trial"
 * as a dropdown of every page of the trial. Astro pages render it in Site.astro; `sync:assets` injects it into the
 * static bench pages, so both read the same markup.
 */

export type NavSection = "site" | "benches" | "pdf" | "redlines" | "speed" | "editors";

interface Row {
	slug: string;
	data: { position: number; code: string; title: string };
}

export interface TrialItem {
	href: string;
	code: string;
	title: string;
	current: boolean;
}

export interface TrialGroup {
	label: string;
	items: TrialItem[];
}

const BENCH_REPO = "https://github.com/jandira-tech/neurotic_docx_bench";

const LINKS: { key: NavSection; href: string; label: string; cls?: string }[] = [
	{ key: "site", href: "/", label: "benchmarks.law", cls: "home-link" },
	{ key: "benches", href: "/neurotic-docx-bench/", label: "Benches" },
	{ key: "pdf", href: "/neurotic-docx-bench/cases/", label: "DOCX → PDF" },
	{ key: "redlines", href: "/neurotic-docx-bench/redlines/", label: "Redlines" },
	{ key: "speed", href: "/neurotic-docx-bench/speed/", label: "Speed" },
];

const TRIAL_PAGES = [
	{ href: "/neurotic-docx-bench/editors/", code: "", title: "At a glance" },
	{ href: "/editors-trial/", code: "", title: "All reports" },
	{ href: "/editors-trial/vendors", code: "", title: "The field" },
];

const norm = (p: string) => p.replace(/index\.html$/, "").replace(/\/+$/, "") || "/";

function esc(s: string): string {
	return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Every page of the editors trial, grouped, with the page at `path` marked current. */
export function trialGroups(rows: Row[], path: string): TrialGroup[] {
	const here = norm(path);
	const own: TrialGroup = {
		label: "The trial",
		items: TRIAL_PAGES.map((p) => ({ ...p, current: norm(p.href) === here })),
	};
	const slug = here.startsWith("/editors-trial/") ? here.slice("/editors-trial/".length) : "";
	const rest = switcherGroups(rows, slug).map((g) => ({
		label: g.label,
		items: g.items.map((i) => ({ href: i.href, code: i.code, title: i.title, current: i.current })),
	}));
	return [own, ...rest];
}

const cur = (on: boolean) => (on ? ' aria-current="page"' : "");

export function navbarHtml(o: { crumb: string; current: NavSection; path: string; rows: Row[] }): string {
	const groups = trialGroups(o.rows, o.path);
	const links = LINKS.map(
		(l) => `<a${l.cls ? ` class="${l.cls}"` : ""} href="${l.href}"${cur(o.current === l.key && norm(o.path) === norm(l.href))}>${esc(l.label)}</a>`,
	).join("");
	const panel = groups
		.map(
			(g) =>
				`<div class="nav-group"><p class="nav-glabel">${esc(g.label)}</p><ol>${g.items
					.map(
						(i) =>
							`<li><a href="${esc(i.href)}"${cur(i.current)}${i.current ? ' class="on"' : ""}>${i.code ? `<span class="nav-code">${esc(i.code)}</span>` : ""}<span class="nav-title">${esc(i.title)}</span></a></li>`,
					)
					.join("")}</ol></div>`,
		)
		.join("");
	const dd = `<details class="nav-dd${o.current === "editors" ? " is-current" : ""}"><summary>Editors trial</summary><div class="nav-panel">${panel}</div></details>`;
	return (
		`<header id="brand" class="site-nav">` +
		`<a class="wm" href="/neurotic-docx-bench/"><span class="logo"><span class="del">CHILL</span><span class="ins">NEUROTIC</span></span><span class="dot">.</span>DOCX<span class="dot">.</span>BENCH</a>` +
		`<span class="crumb">/ ${esc(o.crumb)}</span>` +
		`<button type="button" class="nav-menu" aria-expanded="false" aria-controls="site-links">Menu</button><nav id="site-links" aria-label="Site">${links}${dd}<a href="${BENCH_REPO}" rel="noopener">Bench repo →</a><a class="nav-contact" href="https://arthur.law/contact" rel="noopener">Contact</a></nav>` +
		`</header>`
	);
}

const HEAD_TAGS = '<link rel="stylesheet" href="/nav.css"><script src="/nav.js" defer></script>';

/** Swaps a static page's `<header id="brand">` for the shared navbar and links its stylesheet and script once. */
export function injectNavbar(html: string, nav: string): string {
	let out = html.replace(/<header id="brand"[\s\S]*?<\/header>/, () => nav);
	if (!out.includes('href="/nav.css"')) out = out.replace(/<\/head>/, () => `${HEAD_TAGS}\n</head>`);
	return out;
}

const BENCH_SECTIONS: Record<string, NavSection> = {
	"index.html": "benches",
	"cases/index.html": "pdf",
	"redlines/index.html": "redlines",
	"speed/index.html": "speed",
	"editors/index.html": "editors",
};

/** A static bench page with the shared navbar, keeping its own crumb. `rel` is relative to /neurotic-docx-bench/. */
export function benchPage(html: string, rel: string, rows: Row[]): string {
	const crumb = html.match(/<span class="crumb">\/\s*([^<]*)<\/span>/)?.[1]?.trim() ?? "";
	const unescaped = crumb.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&amp;/g, "&");
	const path = `/neurotic-docx-bench/${rel.replace(/index\.html$/, "")}`;
	return injectNavbar(html, navbarHtml({ crumb: unescaped, current: BENCH_SECTIONS[rel] ?? "benches", path, rows }));
}

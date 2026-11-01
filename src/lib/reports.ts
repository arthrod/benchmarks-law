import GithubSlugger from "github-slugger";
import { Marked, type Tokens } from "marked";

export interface TocItem {
	id: string;
	text: string;
	children: TocItem[];
}

export interface ReportFile {
	/** Path relative to the editors_trial repo root. */
	path: string;
	slug: string;
	code: string;
	position: number;
	group: "reports" | "lanes" | "notes";
}

const MAIN = "Open-Source DOCX Editors Re-verified Against Code and Measured Round-Trip (2026).md";

export const REPORT_FILES: ReportFile[] = [
	{ path: MAIN, slug: "round-trip", code: "Main report", position: 0, group: "reports" },
	{ path: "reports/Report A - Serialization by Namespace (2026).md", slug: "report-a", code: "Report A", position: 10, group: "reports" },
	{ path: "reports/Report A2 - Pass-Through (2026).md", slug: "report-a2", code: "Report A2", position: 20, group: "reports" },
	{ path: "reports/Report B - Malformed Parts, Causes and Repair (2026).md", slug: "report-b", code: "Report B", position: 30, group: "reports" },
	{ path: "reports/Report C - Rendering Versus Word (2026).md", slug: "report-c", code: "Report C", position: 40, group: "reports" },
	{ path: "reports/Report D - Safety, Resource Bombs and Hostile Input (2026).md", slug: "report-d", code: "Report D", position: 50, group: "reports" },
	{ path: "reports/Report E - Jubarte on the Hostile Packages (2026).md", slug: "report-e-jubarte", code: "Report E · Jubarte", position: 60, group: "reports" },
	{ path: "reports/Report E - What Word Protects Against (2026).md", slug: "report-e-word", code: "Report E · Word", position: 61, group: "reports" },
	{ path: "reports/vendors.md", slug: "vendor-notes", code: "Vendors", position: 70, group: "notes" },
	{ path: "reports/rendering-openability.md", slug: "rendering-openability", code: "Note", position: 71, group: "notes" },
	...[
		"canvas",
		"docen",
		"docsplus",
		"docxodus",
		"eigenpal",
		"fidus",
		"folio",
		"genoffice",
		"lo_baseline",
		"officeopen",
		"plate",
		"superdoc",
		"wordcraft",
	].map((n, i) => ({
		path: `reports/extras/${n}.md`,
		slug: `lane-${n.replace(/_/g, "-")}`,
		code: "Lane note",
		position: 100 + i,
		group: "lanes" as const,
	})),
];

const BY_PATH = new Map(REPORT_FILES.map((f) => [f.path, f]));

export function slugForPath(p: string): string | null {
	return BY_PATH.get(normalise(p))?.slug ?? null;
}

function normalise(p: string): string {
	const out: string[] = [];
	for (const seg of p.split("/")) {
		if (seg === "" || seg === ".") continue;
		if (seg === "..") out.pop();
		else out.push(seg);
	}
	return out.join("/");
}

function dirname(p: string): string {
	const i = p.lastIndexOf("/");
	return i === -1 ? "" : p.slice(0, i);
}

/** Plain text of inline markdown: drops emphasis, code ticks, links (keeps their text), images. */
export function plainInline(s: string): string {
	return s
		.replace(/\s+/g, " ")
		.replace(/!\[[^\]]*\]\([^)]*\)/g, "")
		.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
		.replace(/`([^`]*)`/g, "$1")
		.replace(/(\*\*|__)(.*?)\1/g, "$2")
		.replace(/(^|[^\w*])[*_]([^*_]+)[*_](?=[^\w*]|$)/g, "$1$2")
		.replace(/<[^>]+>/g, "")
		.replace(/(^|\s)[*_]{1,3}(?=\S)|(?<=\S)[*_]{1,3}(?=\s|$|[.,;:!?)])/g, "$1")
		.replace(/\s+/g, " ")
		.trim();
}

export function extractTitle(md: string): string {
	const m = md.match(/^#\s+(.+?)\s*#*\s*$/m);
	return m ? plainInline(m[1]) : "";
}

export function extractDek(md: string): string {
	const blocks = md.split(/\n\s*\n/);
	for (const raw of blocks) {
		const b = raw.trim();
		if (!b) continue;
		if (/^#{1,6}\s/.test(b)) continue;
		if (/^([-*_])\1{2,}$/.test(b)) continue;
		if (/^(\||```|~~~|>|!\[|<)/.test(b)) continue;
		if (/^([-*+]|\d+\.)\s/.test(b)) continue;
		if (/^\*\*Status:/.test(b)) continue;
		if (/^(`?)(build|harness|out|scripts|reports)\/|^\$ /.test(b)) continue;
		return plainInline(b.replace(/^([-*_])\1{2,}\s*\n/, ""));
	}
	return "";
}

export interface RewriteContext {
	fromPath: string;
	blobBase: string;
}

const LINK_RE = /(!?\[(?:[^\]\\]|\\.)*\])\(((?:[^()\s]|\([^()\s]*\))+)(\s+"[^"]*")?\)/g;

function rewriteTarget(target: string, ctx: RewriteContext): string {
	if (/^([a-z][a-z0-9+.-]*:|#|\/)/i.test(target)) return target;
	const hashAt = target.indexOf("#");
	const pathPart = hashAt === -1 ? target : target.slice(0, hashAt);
	const hash = hashAt === -1 ? "" : target.slice(hashAt);
	let decoded: string;
	try {
		decoded = decodeURIComponent(pathPart);
	} catch {
		decoded = pathPart;
	}
	const resolved = normalise(`${dirname(ctx.fromPath)}/${decoded}`);
	const slug = slugForPath(resolved);
	if (slug) return `/editors-trial/${slug}${hash}`;
	if (resolved.startsWith("out/") && /\.(png|jpe?g|webp|gif|svg)$/i.test(resolved)) {
		return `/editors-trial/figures/${resolved.slice(4).split("/").map(encodeURIComponent).join("/")}`;
	}
	const encoded = resolved.split("/").map(encodeURIComponent).join("/");
	return `${ctx.blobBase}${encoded}${hash}`;
}

/** Rewrites repo-relative links and figure paths; code spans and fences are left as written. */
export function rewriteLinks(md: string, ctx: RewriteContext): string {
	const parts = md.split(/(```[\s\S]*?```|~~~[\s\S]*?~~~|`[^`\n]*`)/g);
	return parts
		.map((part, i) => {
			if (i % 2 === 1) return part;
			return part.replace(LINK_RE, (_all, label: string, target: string, title = "") => {
				return `${label}(${rewriteTarget(target, ctx)}${title})`;
			});
		})
		.join("");
}

function escapeHtml(s: string): string {
	return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function safeHref(href: string): string | null {
	const h = href.trim();
	if (/^(javascript|vbscript|data):/i.test(h.replace(/[\s\u0000-\u001f]/g, ""))) return null;
	return h;
}

export function renderMarkdown(md: string): { html: string; toc: TocItem[] } {
	const slugger = new GithubSlugger();
	const toc: TocItem[] = [];
	const marked = new Marked({ gfm: true });
	marked.use({
		renderer: {
			html(token: Tokens.HTML | Tokens.Tag) {
				return escapeHtml(token.text);
			},
			heading(this: { parser: { parseInline: (t: Tokens.Generic[]) => string } }, token: Tokens.Heading) {
				if (token.depth === 1) return "";
				const text = plainInline(token.text);
				if (!text) return `<h${token.depth}>${this.parser.parseInline(token.tokens)}</h${token.depth}>\n`;
				const id = slugger.slug(text);
				const item: TocItem = { id, text, children: [] };
				if (token.depth === 2) toc.push(item);
				else if (token.depth === 3) {
					const parent = toc[toc.length - 1];
					if (parent) parent.children.push(item);
					else toc.push(item);
				}
				const inner = this.parser.parseInline(token.tokens);
				return `<h${token.depth} id="${id}">${inner}</h${token.depth}>\n`;
			},
			link(this: { parser: { parseInline: (t: Tokens.Generic[]) => string } }, token: Tokens.Link) {
				const inner = this.parser.parseInline(token.tokens);
				const href = safeHref(token.href);
				if (href === null) return inner;
				const external = /^https?:\/\//i.test(href);
				const title = token.title ? ` title="${escapeHtml(token.title)}"` : "";
				const rel = external ? ' rel="noopener" target="_blank"' : "";
				return `<a href="${escapeHtml(href)}"${title}${rel}>${inner}</a>`;
			},
			paragraph(this: { parser: { parseInline: (t: Tokens.Generic[]) => string } }, token: Tokens.Paragraph) {
				const only = token.tokens.filter((t) => !(t.type === "text" && !t.raw.trim()));
				if (only.length === 1 && only[0].type === "image") {
					const img = only[0] as Tokens.Image;
					const src = safeHref(img.href);
					if (src !== null) {
						const alt = escapeHtml(img.text);
						const cap = alt ? `<figcaption aria-hidden="true">${alt}</figcaption>` : "";
						return `<figure><img src="${escapeHtml(src)}" alt="${alt}" loading="lazy" decoding="async">${cap}</figure>\n`;
					}
				}
				return `<p>${this.parser.parseInline(token.tokens)}</p>\n`;
			},
			image(token: Tokens.Image) {
				const src = safeHref(token.href);
				if (src === null) return escapeHtml(token.text);
				return `<img src="${escapeHtml(src)}" alt="${escapeHtml(token.text)}" loading="lazy" decoding="async">`;
			},
		},
	});
	marked.use({
		hooks: {
			postprocess(html: string) {
				return html
					.replace(/<table>/g, '<div class="table-wrap" tabindex="0" role="region" aria-label="Table"><table>')
					.replace(/<\/table>/g, "</table></div>");
			},
		},
	});
	const html = marked.parse(md, { async: false }) as string;
	return { html, toc };
}

export function wordCount(md: string): number {
	const text = md
		.replace(/```[\s\S]*?```/g, " ")
		.replace(/[#|*_`>[\]()!:]+/g, " ")
		.trim();
	if (!text) return 0;
	return text.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
}

export interface ReportEntry {
	slug: string;
	data: {
		title: string;
		code: string;
		series: string;
		dek: string;
		body: string;
		position: number;
		notice: string;
		source_path: string;
		docx_path: string;
		updated: string;
	};
}

export function extractNotice(md: string): string {
	const m = md.match(/^\*\*Status:\s*([^*]+?)\.?\*\*/m);
	return m ? m[1].trim() : "";
}

export function buildEntry(
	file: ReportFile,
	md: string,
	opts: { blobBase: string; updated: string; docx: string | null },
): ReportEntry {
	const body = rewriteLinks(md, { fromPath: file.path, blobBase: opts.blobBase });
	return {
		slug: file.slug,
		data: {
			title: extractTitle(md) || file.slug,
			code: file.code,
			series: "editors-trial",
			dek: extractDek(md),
			body,
			position: file.position,
			notice: extractNotice(md),
			source_path: file.path,
			docx_path: opts.docx ?? "",
			updated: opts.updated,
		},
	};
}

/** Splits markdown into its H2 sections: heading text → body (trimmed). The preamble is dropped. */
export function splitSections(md: string): Map<string, string> {
	const out = new Map<string, string>();
	const parts = md.split(/^##\s+(.+?)\s*$/m);
	for (let i = 1; i < parts.length; i += 2) out.set(parts[i].trim(), (parts[i + 1] ?? "").trim());
	return out;
}

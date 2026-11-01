/**
 * Prepares a report's Markdown for jubarte-wasm's markdownToDocx, which the
 * browser runs when a reader downloads the report as .docx (benchmarks-law#56).
 *
 * - Figures: a browser has no files to resolve an image path against, so each
 *   figure is fetched and inlined as a data: URI, which jubarte embeds.
 * - Contents: a list of the H2 headings linking to their anchors. jubarte
 *   bookmarks a heading that a link targets, with the GitHub slug rule.
 *
 * Pure functions only: the WASM is loaded by src/scripts/docx-download.ts.
 */

/** GitHub's heading slug: the anchor jubarte gives a linked heading. */
export function headingSlug(text: string): string {
	return text
		.replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
		.replace(/[*_`~]/g, "")
		.trim()
		.toLowerCase()
		.replace(/[^\p{L}\p{N}\s-]/gu, "")
		.replace(/\s/g, "-");
}

function headings(md: string, level: number): string[] {
	const out: string[] = [];
	let fence: string | null = null;
	for (const line of md.split("\n")) {
		const f = line.match(/^\s*(```+|~~~+)/);
		if (f) {
			if (!fence) fence = f[1][0];
			else if (f[1][0] === fence) fence = null;
			continue;
		}
		if (fence) continue;
		const m = line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
		if (m && m[1].length === level) out.push(m[2]);
	}
	return out;
}

/** A "Contents" list of the H2 headings; repeats are numbered -1, -2 as GitHub does. */
export function contentsList(md: string): string {
	const seen = new Map<string, number>();
	const items = headings(md, 2).map((h) => {
		const base = headingSlug(h);
		const n = seen.get(base) ?? 0;
		seen.set(base, n + 1);
		const label = h.replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1");
		return `- [${label}](#${n ? `${base}-${n}` : base})`;
	});
	return items.length ? `**Contents**\n\n${items.join("\n")}\n` : "";
}

const MIME: Record<string, string> = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", gif: "image/gif" };

export function toBase64(bytes: Uint8Array): string {
	let s = "";
	for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
	return btoa(s);
}

/** Every `![alt](path)` becomes `![alt](data:…)`; a figure that cannot be loaded leaves its alt text. */
export async function inlineFigures(md: string, load: (src: string) => Promise<Uint8Array | null>): Promise<string> {
	const re = /!\[([^\]]*)\]\(([^)\s]+)\)/g;
	const found = [...md.matchAll(re)].filter((m) => !m[2].startsWith("data:"));
	const data = await Promise.all(found.map((m) => load(m[2])));
	const by = new Map(found.map((m, i) => [m.index, data[i]]));
	return md.replace(re, (whole, alt: string, src: string, at: number) => {
		if (src.startsWith("data:")) return whole;
		const bytes = by.get(at);
		if (!bytes) return alt;
		const ext = src.split("?")[0].split(".").pop()?.toLowerCase() ?? "";
		return `![${alt}](data:${MIME[ext] ?? "image/png"};base64,${toBase64(bytes)})`;
	});
}

/** Figures inlined, and the contents placed under the title (the first H1). */
export async function prepareMarkdown(md: string, load: (src: string) => Promise<Uint8Array | null>): Promise<string> {
	const toc = contentsList(md);
	let out = md;
	if (toc) {
		const m = out.match(/^# .*\n/m);
		const at = m ? (m.index ?? 0) + m[0].length : 0;
		out = `${out.slice(0, at)}\n${toc}${out.slice(at)}`;
	}
	return inlineFigures(out, load);
}

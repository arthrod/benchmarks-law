/**
 * Every report converted with the WASM the browser runs (jubarte-wasm, the
 * same markdownToDocx; node-slim here): each contents link lands on a
 * bookmark, every figure is embedded, and jubarte's own audit has no error.
 * Needs the editors_trial checkout and `pnpm sync:assets` (figures and
 * reference.docx under public/); skipped without them.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { unzipSync } from "fflate";
import { describe, expect, it } from "vitest";
import { prepareMarkdown } from "../src/lib/liveDocx";
import { REPORT_FILES, rewriteLinks } from "../src/lib/reports";

const TRIAL = process.env.TRIAL_ROOT ?? "/Users/arthrod/temp/T/editors_trial";
const PUBLIC = join(__dirname, "../public");
const REF = join(PUBLIC, "editors-trial/reference.docx");
const ready = existsSync(TRIAL) && existsSync(REF);

const load = async (src: string) => {
	const p = join(PUBLIC, decodeURIComponent(src));
	return existsSync(p) ? new Uint8Array(readFileSync(p)) : null;
};

describe.skipIf(!ready)("live .docx of every report", async () => {
	const w = await import("jubarte-wasm/node-slim");
	const reference = ready ? new Uint8Array(readFileSync(REF)) : new Uint8Array();
	for (const f of REPORT_FILES.filter((r) => existsSync(join(TRIAL, r.path)))) {
		it(f.slug, async () => {
			const raw = readFileSync(join(TRIAL, f.path), "utf8");
			const body = rewriteLinks(raw, { fromPath: f.path, blobBase: "https://github.com/arthrod/editors_trial/blob/main/" });
			const md = await prepareMarkdown(body, load);
			const docx = w.markdownToDocx(md, "{}", reference);
			const files = unzipSync(docx);
			const xml = new TextDecoder().decode(files["word/document.xml"]);
			const anchors = [...xml.matchAll(/<w:hyperlink w:anchor="([^"]+)"/g)].map((m) => m[1]);
			const marks = new Set([...xml.matchAll(/<w:bookmarkStart [^>]*w:name="([^"]+)"/g)].map((m) => m[1]));
			expect(anchors.filter((a) => !marks.has(a))).toEqual([]);
			const figures = [...body.matchAll(/!\[[^\]]*\]\(\/editors-trial\/figures\/[^)]+\)/g)].length;
			expect(Object.keys(files).filter((k) => k.startsWith("word/media/")).length).toBe(figures);
			const audit = JSON.parse(w.auditDocument(docx));
			expect(audit.findings.filter((x: { severity: string }) => x.severity === "error")).toEqual([]);
		});
	}
});

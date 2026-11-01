import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import demos from "../src/data/demos.json" with { type: "json" };
import vendors from "../src/data/vendors.json" with { type: "json" };
import { type DemoEntry, buildDemoEntry, parseSourceTxt } from "../src/lib/demos";

const src = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const here = (p: string) => existsSync(new URL(`../${p}`, import.meta.url));
const manifest = {
	editor: "superdoc",
	source: "fixture/complex.docx",
	source_sha256: "a".repeat(64),
	sha256: "b".repeat(64),
	removed: [{ step: "ole_to_picture", what: "the OLE-embedded document is replaced by its icon", why: "opaque binary" }],
};

// #32: one entry per demo, built from the sanitizer manifest, the bundle's SOURCE.txt and vendors.json
describe("buildDemoEntry", () => {
	const e = buildDemoEntry("superdoc", manifest, "https://github.com/superdoc-dev/superdoc\ncommit f52c959\n", {
		name: "SuperDoc",
		license: "AGPL-3.0",
	});
	it("names the editor, its licence, its source and the measured commit", () => {
		expect(e).toMatchObject({ slug: "superdoc", name: "SuperDoc", license: "AGPL-3.0", repo: "https://github.com/superdoc-dev/superdoc", commit: "f52c959" });
	});
	it("points at the bundle and the sanitized copy on this site", () => {
		expect(e.app).toBe("/demo-apps/superdoc/");
		expect(e.docx).toBe("/editors-trial/demo-files/superdoc.docx");
	});
	it("keeps what was removed and why", () => {
		expect(e.removed).toEqual([{ what: manifest.removed[0].what, why: "opaque binary" }]);
	});
	it("refuses a manifest for another editor", () => {
		expect(() => buildDemoEntry("plate", manifest, "https://x\ncommit 1\n", { name: "P", license: "MIT" })).toThrow(/manifest is for superdoc/);
	});
});

describe("parseSourceTxt", () => {
	it("finds the repository URL and the commit in any order", () => {
		expect(parseSourceTxt("Commit: 97c304f\nRepository: https://github.com/JSv4/Docxodus\n")).toEqual({
			repo: "https://github.com/JSv4/Docxodus",
			commit: "97c304f",
		});
	});
	it("throws when either is missing", () => {
		expect(() => parseSourceTxt("nothing here")).toThrow(/SOURCE.txt/);
	});
});

// Every published demo is complete: bundle, document, licence, source, and a vendor to hang off
describe("published demos", () => {
	const entries = Object.values(demos as Record<string, DemoEntry>);
	const slugs = new Set((vendors as { slug: string }[]).map((v) => v.slug));
	it.each(entries.map((e) => [e.slug, e]))("%s", (_s, e) => {
		expect(slugs.has(e.slug)).toBe(true);
		expect(here(`public${e.app}index.html`)).toBe(true);
		expect(here(`public${e.app}SOURCE.txt`)).toBe(true);
		expect(here(`public${e.app}document.docx`)).toBe(true);
		expect(here(`public${e.docx}`)).toBe(true);
		expect(e.commit).toMatch(/^[0-9a-f]{7,40}$/);
	});
});

describe("demo page and vendor links", () => {
	const page = src("src/pages/editors-trial/demo/[slug].astro");
	it("says the document is a sanitized copy, lists what was removed and links the scored original", () => {
		expect(page).toContain("sanitized copy");
		expect(page).toContain("demo.removed.map");
		expect(page).toContain("fixture/complex.docx");
	});
	it("iframes the bundle and links its source and licence", () => {
		expect(page).toMatch(/<iframe[^>]*src=\{demo\.app\}/);
		expect(page).toContain("demo.repo");
		expect(page).toContain("demo.license");
	});
	it("answers 404 for an editor without a demo", () => {
		expect(page).toMatch(/if \(!demo\)[\s\S]*status: 404/);
	});
	it("is cached like the other public pages", () => {
		expect(src("astro.config.mjs")).toContain('"/editors-trial/demo/[slug]": PUBLIC_PAGE');
	});
	it("the field links each editor that has a demo", () => {
		const v = src("src/pages/editors-trial/vendors.astro");
		expect(v).toMatch(/\(demos as Record<string, DemoEntry>\)\[v\.slug\] && <a class="v-demo" href=\{`\/editors-trial\/demo\/\$\{v\.slug\}`\}>Live demo/);
	});
});

// Nothing a demo loads may leave benchmarks.law: the browser enforces it through the CSP
describe("public/_headers", () => {
	const h = src("public/_headers");
	const block = h.slice(h.indexOf("/demo-apps/*"));
	it("gives every demo a CSP that only allows this origin", () => {
		expect(block).toMatch(/Content-Security-Policy: [^\n]*default-src 'self'/);
		expect(block).toMatch(/connect-src 'self' blob: data:/);
		expect(block).toMatch(/frame-ancestors 'self'/);
		expect(block).not.toMatch(/https?:\/\//);
	});
});

describe("sync:demos", () => {
	it("is a package script", () => {
		expect(JSON.parse(src("package.json")).scripts["sync:demos"]).toBe("tsx scripts/sync.ts demos");
	});
});

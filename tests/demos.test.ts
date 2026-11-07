import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import demos from "../src/data/demos.json" with { type: "json" };
import vendors from "../src/data/vendors.json" with { type: "json" };
import { type DemoEntry, buildDemoEntry, commitUrl, materializeDemos, parseSourceTxt } from "../src/lib/demos";

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

describe("commitUrl", () => {
	it("uses /tree/ on GitHub", () => {
		expect(commitUrl("https://github.com/udecode/plate/", "08b1571")).toBe("https://github.com/udecode/plate/tree/08b1571");
	});
	it("uses /src/commit/ on a Forgejo or Gitea host (Fidus Writer)", () => {
		expect(commitUrl("https://git.fiduswriter.org/fiduswriter/fiduswriter-document-ts", "dc0981d")).toBe(
			"https://git.fiduswriter.org/fiduswriter/fiduswriter-document-ts/src/commit/dc0981d",
		);
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
	const at = h.indexOf("/demo-apps/*");
	const next = h.indexOf("\n/", at);
	const block = h.slice(at, next < 0 ? undefined : next);
	it("gives every demo a CSP that only allows this origin", () => {
		expect(block).toMatch(/Content-Security-Policy: [^\n]*default-src 'self'/);
		expect(block).toMatch(/connect-src 'self' blob: data:/);
		expect(block).toMatch(/frame-ancestors 'self'/);
		expect(block).not.toMatch(/https?:\/\//);
	});
	it("tells Cloudflare not to inject its analytics beacon into the demos (no-transform)", () => {
		expect(block).toMatch(/Cache-Control: [^\n]*public[^\n]*no-transform/);
	});
});

// The sync token lives in .env (never committed); the scripts read it themselves
describe("sync secrets", () => {
	it("scripts/sync.ts loads .env when it exists", () => {
		expect(src("scripts/sync.ts")).toMatch(/existsSync\(ENV_FILE\)\) process\.loadEnvFile\(ENV_FILE\)/);
	});
	it(".env is ignored and .env.example names every variable without a value", () => {
		expect(src(".gitignore")).toMatch(/^\.env$/m);
		const ex = src(".env.example");
		for (const k of ["EMDASH_TOKEN", "EMDASH_URL", "REPORTS_ROOT"]) expect(ex).toMatch(new RegExp(`^${k}=`, "m"));
		expect(ex).toMatch(/^EMDASH_TOKEN=$/m);
		expect(ex).not.toMatch(/ec_pat_[A-Za-z0-9]/);
	});
});

describe("sync:demos", () => {
	it("is a package script", () => {
		expect(JSON.parse(src("package.json")).scripts["sync:demos"]).toBe("tsx scripts/sync.ts demos");
	});
	it("copies out/demos from the fetched bundle and does not need a full checkout", () => {
		const text = src("scripts/sync.ts");
		const body = text.slice(text.indexOf("function demos()"), text.indexOf("\nconst cmd"));
		expect(body).toContain('join(ROOT, "out/demos")');
		expect(body).toContain('join(ROOT, "out/demo-files")');
		expect(body).toContain("materializeDemos");
		expect(body).not.toContain("fullCheckout");
		expect(body).not.toContain("make_demo_docs");
		expect(body).not.toContain("DEMO_APPS");
	});
});

describe("materializeDemos", () => {
	it("copies a complete demo and refuses to replace anything when one slug is incomplete", () => {
		// .bench is git-ignored. /tmp can be over the machine quota (EDQUOT, errno -122).
		const scratch = join(import.meta.dirname, "../.bench");
		mkdirSync(scratch, { recursive: true });
		const dir = mkdtempSync(join(scratch, "blaw-demos-"));
		const app = join(dir, "out/demos/superdoc");
		const files = join(dir, "out/demo-files");
		mkdirSync(app, { recursive: true });
		mkdirSync(files, { recursive: true });
		writeFileSync(join(app, "index.html"), "<html>ok</html>");
		writeFileSync(join(app, "SOURCE.txt"), "Repository: https://example.test\nCommit: abcdef0\n");
		writeFileSync(join(app, "document.docx"), "PK-app");
		writeFileSync(join(files, "superdoc.docx"), "PK-file");
		const publicApps = join(dir, "public/demo-apps");
		const publicFiles = join(dir, "public/demo-files");
		mkdirSync(join(publicApps, "superdoc"), { recursive: true });
		writeFileSync(join(publicApps, "superdoc", "keep"), "sentinel");

		expect(() =>
			materializeDemos({
				demosDir: join(dir, "out/demos"),
				filesDir: files,
				publicApps,
				publicFiles,
				slugs: ["superdoc", "plate"],
			}),
		).toThrow(/plate/);
		expect(readFileSync(join(publicApps, "superdoc", "keep"), "utf8")).toBe("sentinel");

		materializeDemos({
			demosDir: join(dir, "out/demos"),
			filesDir: files,
			publicApps,
			publicFiles,
			slugs: ["superdoc"],
		});
		expect(readFileSync(join(publicApps, "superdoc", "index.html"), "utf8")).toContain("ok");
		expect(readFileSync(join(publicApps, "superdoc", "document.docx"), "utf8")).toBe("PK-app");
		expect(readFileSync(join(publicFiles, "superdoc.docx"), "utf8")).toBe("PK-file");
		expect(existsSync(join(publicApps, "superdoc", "keep"))).toBe(false);
		rmSync(dir, { recursive: true, force: true });
	});
});

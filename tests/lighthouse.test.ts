import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { patchNeuroticHtml } from "../src/lib/neurotic";

const src = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const BENCH = "public/neurotic-docx-bench";

// Lighthouse best-practices (errors-in-console): a bench page with no icon link makes the browser
// fetch /favicon.ico, which 404s.
describe("bench pages name the site icon", () => {
	it("patchNeuroticHtml adds the icon link once", () => {
		const html = "<head><title>x</title></head>";
		const once = patchNeuroticHtml(html, new Set());
		expect(once).toContain('<link rel="icon" type="image/svg+xml" href="/b-law.svg">');
		expect(patchNeuroticHtml(once, new Set()).match(/rel="icon"/g)?.length).toBe(1);
	});
	it.each(["index.html", "redlines/index.html", "home/index.html", "editors/index.html", "speed/index.html"])("%s", (p) => {
		expect(src(`${BENCH}/${p}`).match(/<link rel="icon"[^>]*href="\/b-law\.svg"/g)?.length).toBe(1);
	});
});

// Lighthouse accessibility (landmark-one-main) failed on the speed page.
describe("speed page", () => {
	it("has exactly one main landmark around its content", () => {
		const s = src(`${BENCH}/speed/index.html`);
		expect(s.match(/<main id="main">/g)?.length).toBe(1);
		expect(s.indexOf("<main")).toBeGreaterThan(s.indexOf("</header>"));
		expect(s.indexOf("</main>")).toBeLessThan(s.indexOf("<footer"));
	});
});

// Lighthouse performance (unsized-images, CLS 0.33 mobile / 0.77-0.87 desktop): page images
// were inserted without dimensions, so every column grew as its pages loaded.
describe("viewer page images reserve their space", () => {
	it.each(["index.html", "redlines/index.html"])("%s", (p) => {
		const s = src(`${BENCH}/${p}`);
		const tpl = s.match(/<img src="\$\{src\}"[^`]*>/)?.[0] ?? "";
		expect(tpl).toMatch(/width="1020" height="1320"/);
	});
});

/** The home hero covers all four benches, DOCX and legal AI (benchmarks-law#67). */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const home = readFileSync(join(__dirname, "../src/pages/index.astro"), "utf8");
const site = readFileSync(join(__dirname, "../src/layouts/Site.astro"), "utf8");
const hero = home.slice(home.indexOf('<section class="hero">'), home.indexOf("</section>"));

describe("home hero", () => {
	it("names both kinds of bench and both references", () => {
		expect(hero).toMatch(/Legal AI/);
		expect(hero).toMatch(/DOCX/);
		expect(hero).toMatch(/Microsoft Word/);
		expect(hero).toMatch(/lawyers/);
	});
	it("does not claim the legal-AI studies publish every input", () => {
		expect(hero).toMatch(/legal-AI studies publish their method/);
	});
	it("links to the legal-AI studies", () => {
		expect(hero).toContain('href="/legal-ai/');
	});
	it("counts thirteen editors", () => {
		expect(hero).toContain("<b>13</b>");
		expect(hero).not.toContain("<b>12</b>");
	});
	it("default title and description are not DOCX-only", () => {
		expect(site).not.toContain("DOCX tooling measured against Microsoft Word");
		expect(site).toMatch(/legal AI/i);
	});
});

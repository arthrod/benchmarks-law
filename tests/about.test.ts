// The About page (Arthur, 2026-11-03): who keeps the bench, how to contribute,
// where to reach him; linked from the navbar beside Contact.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { navbarHtml } from "../src/lib/navbar";

const page = readFileSync(new URL("../src/pages/about.astro", import.meta.url), "utf8");

describe("the navbar", () => {
	it("links About right before Contact", () => {
		const html = navbarHtml({ crumb: "x", current: "site", path: "/", rows: [] });
		expect(html).toMatch(/<a class="nav-about" href="\/about\/"[^>]*>About<\/a><a class="nav-contact"/);
	});
	it("marks About current on the About page", () => {
		const html = navbarHtml({ crumb: "About", current: "about", path: "/about/", rows: [] });
		expect(html).toContain('<a class="nav-about" href="/about/" aria-current="page">About</a>');
	});
});

describe("the About page", () => {
	it("wears the site layout with About current", () => {
		expect(page).toMatch(/<Site\s[^>]*current="about"/);
	});
	it("invites contributions through the bench repo", () => {
		expect(page).toContain("https://github.com/jandira-tech/neurotic_docx_bench/issues");
		expect(page).toMatch(/contribut/i);
	});
	it("names the maintainer's own engine (jubarte is one of the engines compared)", () => {
		expect(page).toMatch(/jubarte/);
	});
	it("links LinkedIn, GitHub, Hugging Face, email and the contact page", () => {
		for (const href of [
			"https://www.linkedin.com/in/arthrod",
			"https://github.com/arthrod",
			"https://huggingface.co/arthrod",
			"mailto:contact@arthur.law",
			"https://arthur.law/contact",
		]) {
			expect(page, href).toContain(href);
		}
	});
});

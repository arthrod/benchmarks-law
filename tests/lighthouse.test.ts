import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";
import {
	casesPage,
	editorsPage,
	leaderboardHtml,
	redlinesPage,
	speedPage,
	pinnedFacts,
	pinnedRelease,
	pinnedReportB,
	pinnedScores,
} from "../src/lib/bench-pages";
import { defectClassesIn } from "../src/lib/scorecard";

const SITE = resolve(import.meta.dirname, "..");
const PINNED = existsSync(join(SITE, ".bench/ndb/results/scores.json"));
const rows: never[] = [];

// Lighthouse best-practices (errors-in-console): a bench page with no icon link makes the
// browser fetch /favicon.ico, which 404s. The pages are generated (src/lib/bench-pages.ts),
// so the lesson pins the builders, not a copied file.
describe.skipIf(!PINNED)("bench pages name the site icon", () => {
	const pages: [string, string][] = [
		["the leaderboard", leaderboardHtml(pinnedScores(SITE), rows)],
		["the cases browser", casesPage(rows)],
		["the redlines browser", redlinesPage(rows)],
		["the speed page", speedPage(rows)],
		[
			"the editors scorecard",
			editorsPage(pinnedFacts(SITE), rows, {
				defectClasses: defectClassesIn(pinnedReportB(SITE)),
				release: pinnedRelease(SITE),
			}),
		],
	];
	it.each(pages)("%s links /b-law.svg exactly once", (_n, page) => {
		expect(page.match(/<link rel="icon"[^>]*href="\/b-law\.svg"/g)?.length).toBe(1);
	});

	// Lighthouse accessibility (landmark-one-main) failed on the speed page.
	describe("the speed page", () => {
		const s = pages[3][1];
		it("has exactly one main landmark around its content", () => {
			expect(s.match(/<main id="main">/g)?.length).toBe(1);
			expect(s.indexOf("<main")).toBeGreaterThan(s.indexOf("</header>"));
			expect(s.indexOf("</main>")).toBeLessThan(s.indexOf("<footer"));
		});
	});
});

// Lighthouse performance (unsized-images, CLS): page images reserve their space. The img
// markup lives in the module the pages import (bench-viewer's dist), so that is what the
// lesson pins now — whatever the pin resolves to, not a copy in this repo.
describe("the viewer module reserves the images' space", () => {
	// The package exports only its entry and themes; dist is reached beside package.json.
	const require = createRequire(import.meta.url);
	const pkg = require.resolve("@jandira-tech/bench-viewer/package.json");
	const js = readFileSync(join(dirname(pkg), "dist/cases.js"), "utf8");
	it("carries the Letter-size width and height on every page image", () => {
		expect(js).toContain('width="1020" height="1320"');
	});
});

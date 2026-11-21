import { describe, expect, it } from "vitest";
import { type BrowserPass, grades, scale } from "../src/lib/browserGrades";

const cell = (settledMs: number | null, rendererRss: number | null, bytes: number | null, extra = {}) => ({
	loadMs: settledMs,
	settledMs,
	settleTimedOut: 0,
	rendererRss,
	bytes,
	...extra,
});
const pass: BrowserPass = {
	source: "test",
	commit: "0",
	measuredAt: "2026-11-21",
	environment: "a test machine",
	samples: {
		showcase: {
			docxodus: cell(1230, 559 * 1048576, 7_500_000),
			docen: cell(317, 560 * 1048576, 1_500_000),
			wordcraft: cell(null, 551 * 1048576, 23_100_000, { loadMs: 646, settleTimedOut: 3 }),
			"canvas-editor": cell(427, 463 * 1048576, 700_000),
			univer: cell(469, 521 * 1048576, 2_400_000),
		},
		"lorem-500": {
			docxodus: cell(5167, 749 * 1048576, 8_000_000),
			docen: cell(null, null, null, { loadMs: null }),
			wordcraft: cell(null, 710 * 1048576, 23_500_000, { loadMs: 3809, settleTimedOut: 3 }),
			"canvas-editor": cell(18542, 4816 * 1048576, 1_100_000),
			univer: cell(29285, 2394 * 1048576, 3_200_000),
		},
	},
};

describe("a score is a place on a logarithmic scale between two printed anchors", () => {
	it("gives 10 at the best anchor, 0 at the worst, 5 at their geometric mean, and never leaves 0 to 10", () => {
		expect(scale(300, 300, 10_000)).toBe(10);
		expect(scale(10_000, 300, 10_000)).toBe(0);
		expect(scale(Math.sqrt(300 * 10_000), 300, 10_000)).toBe(5);
		expect(scale(50, 300, 10_000)).toBe(10);
		expect(scale(99_000, 300, 10_000)).toBe(0);
	});
});

describe("speed, data and memory scores come from the browser pass", () => {
	it("scores speed as the mean of the rich sample and the 500 pages, and says what it stands on", () => {
		const g = grades("docxodus", pass);
		expect(g.speed.score).toBe(7.3);
		expect(g.speed.basis).toBe("1.23 s on the rich sample, 5.17 s on the 500 pages");
		expect(g.data.score).toBe(4.1);
		expect(g.data.basis).toBe("7.5 MB to open the rich sample");
		expect(g.memory.score).toBe(8.2);
		expect(g.memory.basis).toBe("749 MB with the 500 pages open");
	});

	it("gives the 500-page half a zero when the file never became usable, and says so", () => {
		const g = grades("docen", pass);
		expect(g.speed.score).toBe(4.9);
		expect(g.speed.basis).toBe("317 ms on the rich sample; the 500 pages did not become usable in the time the test waits");
		expect(g.memory.score).toBeNull();
		expect(g.memory.why).toMatch(/500 pages/);
	});

	it("scores 0 for the half of a rich sample that never became usable, as the printed rule says", () => {
		const p = { ...pass, samples: { ...pass.samples, showcase: { ...pass.samples.showcase, docxodus: cell(null, 559 * 1048576, 7_500_000, { settleTimedOut: 3 }) } } };
		const g = grades("docxodus", p as never);
		expect(g.speed.score).toBeGreaterThan(0);
		expect(g.speed.score).toBeLessThanOrEqual(5);
		expect(g.speed.basis).toBe("the rich sample did not become usable in the time the test waits, 5.17 s on the 500 pages");
	});

	it("does not call an absent 500-page row a wait that ran out", () => {
		const { docxodus: _gone, ...rest } = pass.samples["lorem-500"];
		const p = { ...pass, samples: { ...pass.samples, "lorem-500": rest } };
		const g = grades("docxodus", p as never);
		expect(g.speed).toEqual({ score: null, why: "Not scored: the 500 pages were not measured for it" });
		expect(g.memory.score).toBeNull();
		expect(g.data.score).not.toBeNull();
	});

	it("says so when the memory figure was read from a page still busy", () => {
		const p = { ...pass, samples: { ...pass.samples, "lorem-500": { ...pass.samples["lorem-500"], docxodus: cell(null, 749 * 1048576, 8_000_000, { settleTimedOut: 3 }) } } };
		expect(grades("docxodus", p as never).memory.basis).toBe("749 MB with the 500 pages open, read while the page was still busy");
		expect(grades("docxodus", pass).memory.basis).toBe("749 MB with the 500 pages open");
	});

	it("does not score a rich-sample time taken on another machine; the bytes downloaded and the memory stay scored", () => {
		const p = { ...pass, samples: { ...pass.samples, showcase: { ...pass.samples.showcase, docxodus: { ...pass.samples.showcase.docxodus, elsewhere: "a MacBook Pro" } } } };
		const g = grades("docxodus", p as never);
		// The times are still said, as that machine's; only the score is withheld.
		expect(g.speed.score).toBeNull();
		// Its 500 pages were timed on the pass's machine, so that time is not said to be the MacBook's.
		expect(g.speed.why).toMatch(/^Not scored: it was timed on another machine, a MacBook Pro \([^,]+ on the rich sample\)$/);
		expect(g.data).toEqual(grades("docxodus", pass).data);
		expect(g.memory).toEqual(grades("docxodus", pass).memory);
	});

	it("scores the four tools that run through the trial's demo builds on data only: their times and memory are a Mac's", async () => {
		const live = (await import("../src/data/browser-pass.json")).default;
		for (const slug of ["genoffice", "office-open", "fidus-writer", "docs-plus"]) {
			const g = grades(slug, live as never);
			expect(g.data.score, slug).not.toBeNull();
			expect(g.speed.score, slug).toBeNull();
			expect(g.speed.why, slug).toMatch(/another machine, a MacBook Pro .*on the rich sample/);
			expect(g.memory.why, slug).toMatch(/MB\) was taken on another machine, a MacBook Pro/);
		}
	});

	it("does not score a reading taken on another machine than the rest of the table, and names the machine", () => {
		const mac = { ...pass, samples: { ...pass.samples, "lorem-500": { ...pass.samples["lorem-500"], docen: { loadMs: 2296, settledMs: null, rendererRss: 1781 * 1048576, bytes: 1_900_000, elsewhere: "a MacBook Pro" } } } };
		const g = grades("docen", mac as never);
		expect(g.memory).toEqual({ score: null, why: "Not scored: its 500-page reading (1781 MB) was taken on another machine, a MacBook Pro" });
		// A wait that ran out there is not this pass's finding: no half score for it.
		expect(g.speed).toEqual({ score: null, why: "Not scored: its 500 pages were timed on another machine, a MacBook Pro, where it was still busy when the test stopped waiting" });
		const settled = { ...mac, samples: { ...mac.samples, "lorem-500": { ...mac.samples["lorem-500"], docen: { ...mac.samples["lorem-500"].docen, settledMs: 9000 } } } };
		expect(grades("docen", settled as never).speed).toEqual({ score: null, why: "Not scored: its 500 pages were timed on another machine, a MacBook Pro" });
	});

	it("does not score an axis whose figure is the test machine's or the method's, and prints why", () => {
		expect(grades("wordcraft", pass).speed).toMatchObject({ score: null });
		expect(grades("wordcraft", pass).speed.why).toMatch(/graphics card/);
		expect(grades("wordcraft", pass).data.score).not.toBeNull();
		expect(grades("canvas-editor", pass).memory.why).toMatch(/graphics card/);
		expect(grades("canvas-editor", pass).speed.score).not.toBeNull();
		for (const axis of ["speed", "data", "memory"] as const) {
			expect(grades("univer", pass)[axis].score).toBeNull();
			expect(grades("univer", pass)[axis].why).toMatch(/plain text/);
		}
	});

	it("says a tool is not in the browser pass instead of scoring it", () => {
		const g = grades("fidus-writer", pass);
		for (const axis of ["speed", "data", "memory"] as const) {
			expect(g[axis].score).toBeNull();
			expect(g[axis].why).toBe("Not on editors.benchmarks.law, so it has no figure from that pass");
		}
	});
});

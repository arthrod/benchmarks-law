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
			expect(g[axis].why).toBe("Not on editors.benchmarks.law, so not timed in a browser");
		}
	});
});

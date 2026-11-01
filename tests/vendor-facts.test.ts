import { describe, expect, it } from "vitest";
import vendors from "../src/data/vendors.json" with { type: "json" };
import { REPORT_FILES } from "../src/lib/reports";
import { TOOL_OF, applyFacts } from "../src/lib/vendorFacts";

const facts = {
	"rt.superdoc.weighted": 100.0,
	"rt.superdoc.critical_passed": 29,
	"rt.superdoc.critical_total": 29,
	"bomb.superdoc.grade": 0.3,
	"rt.apryse.weighted": 89.9,
	"rt.apryse.critical_passed": 25,
	"rt.apryse.critical_total": 29,
	"bomb.apryse.grade": 0.32,
};

describe("vendor figures come from the trial's facts, never typed", () => {
	it("takes round trip, critical features and the hostile-input grade from facts.json", () => {
		const [s, a] = applyFacts(
			[
				{ slug: "superdoc", roundtrip: 1, critical: "0/0", safety: 9 },
				{ slug: "apryse", roundtrip: 1, critical: "0/0", safety: 9 },
			],
			facts,
		);
		expect(s).toMatchObject({ roundtrip: 100, critical: "29/29", safety: 0.3 });
		expect(a).toMatchObject({ roundtrip: 89.9, critical: "25/29", safety: 0.32 });
	});

	it("refuses to publish a vendor the facts do not measure", () => {
		expect(() => applyFacts([{ slug: "plate", roundtrip: 1, critical: "", safety: 1 }], facts)).toThrow(/plate/);
	});

	it("maps every vendor on the site to a trial tool", () => {
		for (const v of vendors) expect(TOOL_OF[v.slug], v.slug).toBeTruthy();
	});

	it("lists Apryse, closed-source, with its lane note", () => {
		const a = vendors.find((v) => v.slug === "apryse");
		expect(a).toMatchObject({ maker: "Apryse Software Inc.", lane: "lane-apryse" });
		expect(a?.license).toMatch(/proprietary/i);
		expect(REPORT_FILES.some((f) => f.slug === "lane-apryse")).toBe(true);
	});
});

describe("the field's counts are computed, not typed", () => {
	it("counts the tools, the open-source ones and the commercial ones, without the baseline", async () => {
		const { fieldCounts } = await import("../src/lib/vendorFacts");
		expect(fieldCounts(vendors)).toEqual({ tools: 13, open: 12, commercial: 1 });
	});
});

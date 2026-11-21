import { describe, expect, it } from "vitest";
import vendors from "../src/data/vendors.json" with { type: "json" };
import { RENAMED_SLUGS, REPORT_FILES } from "../src/lib/reports";
import { NOT_YET_IN_THE_TRIAL, TOOL_OF, applyFacts } from "../src/lib/vendorFacts";

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

	it("lists Apryse, closed-source, and its old lane note leads to its vendor section", () => {
		const a = vendors.find((v) => v.slug === "apryse");
		expect(a).toMatchObject({ maker: "Apryse Software Inc." });
		expect(a?.license).toMatch(/proprietary/i);
		expect(REPORT_FILES.some((f) => f.slug === "lane-apryse")).toBe(false);
		expect(RENAMED_SLUGS["lane-apryse"]).toBe("vendor-notes#apryse");
	});
});

describe("the field's counts are computed, not typed", () => {
	it("counts the tools, the open-source ones and the commercial ones, without the baseline", async () => {
		const { fieldCounts } = await import("../src/lib/vendorFacts");
		expect(fieldCounts(vendors)).toEqual({ tools: 19, open: 17, commercial: 2, measured: 13 });
	});
});

describe("tools the trial has not measured yet", () => {
	it("are on the field page with no round-trip or hostile-input figure, never a typed one", () => {
		const [o] = applyFacts([{ slug: "onlyoffice", roundtrip: 55, critical: "9/29", safety: 0.5 }], facts);
		expect(o).toMatchObject({ slug: "onlyoffice", roundtrip: null, critical: "", safety: null });
	});

	it("take their figures from the facts as soon as the trial has them", () => {
		const [o] = applyFacts([{ slug: "onlyoffice", roundtrip: null, critical: "", safety: null }], {
			...facts,
			"rt.onlyoffice.weighted": 88.1,
			"rt.onlyoffice.critical_passed": 24,
			"rt.onlyoffice.critical_total": 29,
			"bomb.onlyoffice.grade": 0.4,
		});
		expect(o).toMatchObject({ roundtrip: 88.1, critical: "24/29", safety: 0.4 });
	});

	it("still refuse a measured tool whose figure is missing", () => {
		expect(() => applyFacts([{ slug: "docen", roundtrip: 1, critical: "", safety: 1 }], facts)).toThrow(/docen/);
	});

	it("are the six that editors.benchmarks.law has and the trial's reports do not yet", () => {
		expect([...NOT_YET_IN_THE_TRIAL].sort()).toEqual(["betteroffice", "nutrient", "onlyoffice", "opendoc", "react-docx", "univer"]);
		for (const slug of NOT_YET_IN_THE_TRIAL) expect(vendors.some((v) => v.slug === slug), slug).toBe(true);
	});
});

import { describe, expect, it } from "vitest";
import vendors from "../src/data/vendors.json" with { type: "json" };
import { partitionReports } from "../src/lib/positions";
import { REPORT_FILES, RENAMED_SLUGS, vendorAnchor } from "../src/lib/reports";

describe("the vendor notes are the one page about each vendor", () => {
	it("publishes no separate lane note", () => {
		expect(REPORT_FILES.filter((f) => f.group === "lanes")).toEqual([]);
		expect(REPORT_FILES.some((f) => f.path.startsWith("reports/extras/"))).toBe(false);
	});

	it("answers every old lane address with that vendor's section of the vendor notes", () => {
		expect(RENAMED_SLUGS["lane-docen"]).toBe("vendor-notes#docen");
		expect(RENAMED_SLUGS["lane-plate"]).toBe("vendor-notes#platejs");
		expect(RENAMED_SLUGS["lane-lo-baseline"]).toBe("vendor-notes#libreoffice");
		expect(RENAMED_SLUGS["lane-superdoc"]).toBe("vendor-notes#superdoc");
		expect(Object.keys(RENAMED_SLUGS).filter((k) => k.startsWith("lane-"))).toHaveLength(14);
	});

	it("drops lane entries still in the CMS from the index and the switcher", () => {
		const parts = partitionReports([
			{ slug: "vendor-notes", data: { position: 70 } },
			{ slug: "lane-docen", data: { position: 102 } },
		]);
		expect(parts.rows.map((r) => r.slug)).toEqual(["vendor-notes"]);
	});

	it("gives every vendor on the field page an anchor in the notes", () => {
		for (const v of vendors) expect(vendorAnchor(v.slug), v.slug).toMatch(/^[a-z0-9-]+$/);
		expect(() => vendorAnchor("no-such-tool")).toThrow();
	});
});

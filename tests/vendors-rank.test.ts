import { describe, expect, it } from "vitest";
import { bestPlacement, ordinal, rankOn, type VendorData } from "../src/lib/vendors";

const v = (slug: string, roundtrip: number | null, safety: number | null, position = 10) => ({
	slug,
	data: { roundtrip, safety, position } as VendorData,
});
const field = [
	v("superdoc", 100, 0.3),
	v("folio", 98.5, 0.56),
	v("genoffice", 98.5, 0.24),
	v("fidus", 23, 0.72),
	v("docxodus", null, 0.2),
	v("libreoffice", 86, 0.6, 200),
];

describe("rankOn", () => {
	it("uses competition ranking with ties", () => {
		const r = rankOn(field, "roundtrip");
		expect(r.get("superdoc")).toEqual({ rank: 1, of: 4, tied: false });
		expect(r.get("folio")).toEqual({ rank: 2, of: 4, tied: true });
		expect(r.get("genoffice")).toEqual({ rank: 2, of: 4, tied: true });
		expect(r.get("fidus")).toEqual({ rank: 4, of: 4, tied: false });
	});
	it("does not rank the baseline or tools without a score on that axis", () => {
		const r = rankOn(field, "roundtrip");
		expect(r.has("libreoffice")).toBe(false);
		expect(r.has("docxodus")).toBe(false);
		expect(rankOn(field, "safety").get("docxodus")?.rank).toBe(5);
	});
});

describe("bestPlacement", () => {
	it("picks the axis where the tool places best", () => {
		const rt = rankOn(field, "roundtrip");
		const sf = rankOn(field, "safety");
		expect(bestPlacement("fidus", rt, sf)).toMatchObject({ axis: "hostile input", rank: 1 });
		expect(bestPlacement("superdoc", rt, sf)).toMatchObject({ axis: "round trip", rank: 1 });
		expect(bestPlacement("libreoffice", rt, sf)).toBeNull();
	});
});

describe("ordinal", () => {
	it("formats English ordinals", () => {
		expect([1, 2, 3, 4, 11, 12, 13, 21, 22].map(ordinal)).toEqual(["1st", "2nd", "3rd", "4th", "11th", "12th", "13th", "21st", "22nd"]);
	});
});

import { SAFETY_PASS, safetyVerdict } from "../src/lib/vendors";

describe("safetyVerdict", () => {
	it("passes at or above the generous pass line", () => {
		expect(SAFETY_PASS).toBe(0.2);
		expect(safetyVerdict(0.2)).toBe("pass");
		expect(safetyVerdict(0.72)).toBe("pass");
	});
	it("marks a grade under the line as below it, and a missing grade as ungraded", () => {
		expect(safetyVerdict(0.14)).toBe("below");
		expect(safetyVerdict(null)).toBe("ungraded");
	});
});

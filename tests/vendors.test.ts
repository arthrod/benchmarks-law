import { describe, expect, it } from "vitest";
import { splitSections } from "../src/lib/reports";

describe("splitSections", () => {
	const md = "# Vendors\n\nIntro.\n\n## Plate.js\n\nPlate is a framework.\n\nSecond para.\n\n## docs.plus\n\nEvery heading has a room.\n";
	it("maps each H2 to the markdown under it, trimmed", () => {
		const s = splitSections(md);
		expect(s.get("Plate.js")).toBe("Plate is a framework.\n\nSecond para.");
		expect(s.get("docs.plus")).toBe("Every heading has a room.");
	});
	it("ignores the preamble before the first H2", () => {
		expect([...splitSections(md).keys()]).toEqual(["Plate.js", "docs.plus"]);
	});
});

import { describe, expect, it } from "vitest";
import { switcherGroups } from "../src/lib/switcher";

const row = (slug: string, position: number, code = "Report X", title = slug) => ({ slug, data: { position, code, title } });
const rows = [row("round-trip", 0, "Main report"), row("report-c", 40, "Report C"), row("vendor-notes", 70, "Vendors"), row("lane-folio", 106, "Lane note", "Folio")];

describe("switcherGroups", () => {
	it("groups rows by position into reports, notes and lane notes, in order", () => {
		const g = switcherGroups(rows, "report-c");
		expect(g.map((x) => x.label)).toEqual(["Reports", "Notes", "Lane notes"]);
		expect(g.map((x) => x.items.map((i) => i.slug))).toEqual([["round-trip", "report-c"], ["vendor-notes"], ["lane-folio"]]);
	});

	it("marks only the current report", () => {
		const items = switcherGroups(rows, "report-c").flatMap((x) => x.items);
		expect(items.filter((i) => i.current).map((i) => i.slug)).toEqual(["report-c"]);
	});

	it("drops the repeated 'Lane note' code, and omits empty groups", () => {
		const g = switcherGroups([row("lane-folio", 106, "Lane note", "Folio")], "x");
		expect(g).toHaveLength(1);
		expect(g[0].items[0]).toMatchObject({ code: "", title: "Folio", href: "/editors-trial/lane-folio" });
	});

	it("drops a leading 'Report X —' from the title, which the code column already shows", () => {
		const [g] = switcherGroups([row("report-e-word", 61, "Report E · Word", "Report E — What Microsoft Word protects against (2026)")], "x");
		expect(g.items[0].title).toBe("What Microsoft Word protects against (2026)");
	});
});

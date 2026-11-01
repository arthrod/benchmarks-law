import { describe, expect, it } from "vitest";
import release from "../src/data/release.json" with { type: "json" };
import { sourceHref } from "../src/lib/cms";
import { patchNeuroticHtml } from "../src/lib/neurotic";
import { trialRef } from "../src/lib/trialRef";

// Source links name the editors_trial commit the site published (sync:content writes it), never a moving branch.
describe("editors_trial source links", () => {
	it("trialRef is the tag of the published checkout, or its commit", () => {
		expect(trialRef("v0.9.2", "3e4e0b6aaaa")).toBe("v0.9.2");
		expect(trialRef("", "3e4e0b6aaaa")).toBe("3e4e0b6aaaa");
	});
	it("the Markdown source link uses the published ref", () => {
		expect(sourceHref("reports/a.md")).toBe(`https://github.com/arthrod/editors_trial/blob/${release.trialRef}/reports/a.md`);
		expect(release.trialRef).not.toBe("benchmark-fairness-reports");
	});
	it("rewritten neurotic links use the published ref", () => {
		const out = patchNeuroticHtml('<a href="https://github.com/jandira-tech/editors_trial/blob/main/build/x.py">x</a>');
		expect(out).toContain(`/blob/${release.trialRef}/build/x.py`);
	});
});

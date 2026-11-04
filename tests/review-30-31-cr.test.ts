import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";
import { rewriteLinks } from "../src/lib/reports";

const require = createRequire(import.meta.url);
const casesCss = readFileSync(
  require.resolve("@jandira-tech/bench-viewer/themes/cases.css"),
  "utf8",
);

// 4434743500 (CodeRabbit, #31): the restored mobile header (z-index 60) covered the case drawer's
// controls. The drawer now ships in bench-viewer's cases.css; the lesson still guards what we serve.
describe("mobile case drawer", () => {
	const z = (sel: RegExp) => Number(casesCss.match(sel)?.[1]);  // cases.css is pretty-printed: rules span lines
	const header = Number(readFileSync(new URL("../public/nav.css", import.meta.url), "utf8").match(/#brand\.site-nav\{[^}]*z-index:(\d+)/)?.[1]);
	it("the drawer and its scrim sit above the site header, the drawer above the scrim", () => {
		const side = z(/body\.mobile #side\s*\{[^}]*z-index:\s*(\d+)/s);
		const scrim = z(/body\.mobile\.drawer #scrim\s*\{[^}]*z-index:\s*(\d+)/s);
		expect(header).toBe(60);
		expect(scrim).toBeGreaterThan(header);
		expect(side).toBeGreaterThan(scrim);
	});
});

// #31 review 5726972304, outside-diff (CodeRabbit): inline code must not cross a CRLF blank line
describe("inline-code masking across paragraphs", () => {
	const ctx = { fromPath: "reports/Report C - Rendering Versus Word (2026).md", blobBase: "https://github.com/o/r/blob/b/" };
	const want = "[doc](https://github.com/o/r/blob/b/README.md)";
	it.each([
		["LF", "a `x\n\n[doc](../README.md) `y`"],
		["CRLF", "a `x\r\n\r\n[doc](../README.md) `y`"],
		["CRLF with a blank line of spaces", "a `x\r\n  \r\n[doc](../README.md) `y`"],
	])("%s: the link after the blank line is still rewritten", (_k, md) => {
		expect(rewriteLinks(md, ctx)).toContain(want);
	});
});

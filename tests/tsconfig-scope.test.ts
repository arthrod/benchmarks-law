import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// astro check runs TypeScript with allowJs (astro/tsconfigs/base). With "**/*" and only
// dist excluded it parsed public/'s bundled demo apps (67 files, 68 MB of minified JS)
// and ran out of heap (benchmarks-law#53). Built and vendored output is never checked.
describe("tsconfig scope", () => {
	const config = JSON.parse(readFileSync(join(__dirname, "..", "tsconfig.json"), "utf8"));

	it("excludes every directory of built or vendored output", () => {
		for (const dir of ["dist", "public", ".wrangler", "node_modules"]) {
			expect(config.exclude).toContain(dir);
		}
	});
});

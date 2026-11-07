// GHSA-mrhx-c7xc-m3w5: zod < 4.6.6 can exhaust memory on an oversized array.
// emdash@1.4.0 depends on zod@4.5.4 exactly, so Dependabot cannot bump it.
// pnpm-workspace.yaml overrides every copy below 4.6.6. Astro already uses 4.6.7.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function atLeast466(version: string): boolean {
	const [major, minor, patch] = version.split(".").map(Number);
	return major > 4 || (major === 4 && (minor > 6 || (minor === 6 && patch >= 6)));
}

describe("zod (GHSA-mrhx-c7xc-m3w5)", () => {
	it("overrides every installed copy below 4.6.6", () => {
		const workspace = readFileSync(new URL("../pnpm-workspace.yaml", import.meta.url), "utf8");
		expect(workspace).toMatch(/["']zod@<4\.6\.6["']:\s*4\.6\.7/);

		const lock = readFileSync(new URL("../pnpm-lock.yaml", import.meta.url), "utf8");
		const versions = [...lock.matchAll(/^  zod@(\d+\.\d+\.\d+):/gm)].map((match) => match[1]);
		expect(versions.length).toBeGreaterThan(0);
		for (const version of versions) expect(atLeast466(version), version).toBe(true);
		expect(lock).not.toMatch(/zod@4\.[0-5]\./);
		expect(lock).not.toMatch(/zod@4\.6\.[0-5](?!\d)/);
	});
});

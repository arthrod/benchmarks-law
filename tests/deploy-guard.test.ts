// #82: public/demo-apps is git-ignored and nothing published rebuilds it, so a deploy
// from a checkout without it removes every live demo. The deploy checks first, and each
// step only runs when the one before it succeeded.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const scripts = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")).scripts as Record<
	string,
	string
>;
const steps = (scripts.deploy ?? "").split("&&").map((s) => s.trim());

describe("deploy (#82)", () => {
	it("is one chain of steps joined by &&, so a failure stops it", () => {
		for (const step of steps) expect(step, step).not.toMatch(/;|\|\||\n/);
	});

	it("checks every published demo before it builds or uploads anything", () => {
		const check = steps.indexOf("vitest run tests/demos.test.ts");
		expect(check).toBeGreaterThan(-1);
		expect(check).toBeLessThan(steps.indexOf("pnpm run build"));
		expect(check).toBeLessThan(steps.indexOf("wrangler deploy"));
	});
});

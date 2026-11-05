// #82: public/demo-apps is git-ignored and nothing published rebuilds it, so a deploy
// from a checkout without it removes every live demo. The deploy checks first.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const scripts = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")).scripts as Record<
	string,
	string
>;

describe("deploy (#82)", () => {
	it("checks every published demo is in public/ before it uploads anything", () => {
		const deploy = scripts.deploy ?? "";
		const check = deploy.indexOf("vitest run tests/demos.test.ts");
		expect(check).toBeGreaterThan(-1);
		expect(check).toBeLessThan(deploy.indexOf("wrangler deploy"));
	});
});

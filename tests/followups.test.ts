import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const root = new URL("../", import.meta.url);
const read = (p: string) => readFileSync(new URL(p, root), "utf8");
const jsonc = (s: string) => JSON.parse(s.replace(/^\s*\/\/.*$/gm, "").replace(/,(\s*[}\]])/g, "$1"));

describe("route cache (#21)", () => {
	const config = read("astro.config.mjs");

	it("uses the Cloudflare Worker cache provider, so no storage binding is needed", () => {
		expect(config).toMatch(/import \{ cacheCloudflare \} from "@astrojs\/cloudflare\/cache"/);
		expect(config).toMatch(/cache:\s*\{\s*provider:\s*cacheCloudflare\(\)\s*\}/);
	});

	it("gives every CMS-backed public route a max age, and nothing under the admin", () => {
		for (const route of ["/", "/editors-trial", "/editors-trial/vendors", "/editors-trial/[slug]"]) {
			expect(config).toContain(`"${route}": PUBLIC_PAGE`);
		}
		expect(config).not.toMatch(/"\/_emdash/);
	});

	it("turns the Worker cache on in wrangler", () => {
		expect(jsonc(read("wrangler.jsonc")).cache).toEqual({ enabled: true });
	});
});

describe("wrangler observability (#21)", () => {
	it("does not switch observability off while switching its logs and traces on", () => {
		const o = jsonc(read("wrangler.jsonc")).observability;
		expect(o.enabled).toBe(true);
		expect(o.logs.enabled).toBe(true);
		expect(o.traces.enabled).toBe(false);
	});
});

describe("old marketing template (#21)", () => {
	it("is gone: no plugin, no block components, no icon integration", () => {
		const config = read("astro.config.mjs");
		expect(config).not.toContain("marketing-blocks");
		expect(config).not.toContain("astro-iconset");
		for (const p of ["src/plugins/marketing-blocks", "src/components/MarketingBlocks.astro", "src/components/blocks"]) {
			expect(existsSync(new URL(p, root))).toBe(false);
		}
		const pkg = JSON.parse(read("package.json"));
		expect(pkg.dependencies["astro-iconset"]).toBeUndefined();
		expect(pkg.dependencies["@iconify-json/ph"]).toBeUndefined();
	});
});

describe("rewriteLinks with a code-span label", async () => {
	const { rewriteLinks } = await import("../src/lib/reports");
	const ctx = { fromPath: "reports/Report E.md", blobBase: "https://github.com/o/r/blob/b/" };

	it("rewrites a repo link whose label is inline code", () => {
		expect(rewriteLinks("in [`logs/word-exp/`](../logs/word-exp/) here", ctx)).toBe(
			"in [`logs/word-exp/`](https://github.com/o/r/blob/b/logs/word-exp) here",
		);
	});

	it("still leaves links written inside code spans and fences alone", () => {
		expect(rewriteLinks("`[a](../x.md)` and\n```\n[b](../y.md)\n```", ctx)).toBe("`[a](../x.md)` and\n```\n[b](../y.md)\n```");
	});
});

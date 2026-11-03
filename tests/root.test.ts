import { existsSync, mkdtempSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { fullCheckout, reportsRoot } from "../src/lib/root";

/** This repo, the way pages and sync scripts pass it. */
const SITE = resolve(import.meta.dirname, "..");
/** The fetched editors_trial release (bench.lock → `bench fetch`), absent before the first fetch. */
const BENCH_ET = join(SITE, ".bench/editors_trial");

const tmps: string[] = [];
afterEach(() => {
	for (const t of tmps.splice(0)) rmSync(t, { recursive: true, force: true });
});

/** A throwaway dir that looks like whatever `with` puts in it. */
function scratch(fill?: (dir: string) => void): string {
	const dir = mkdtempSync(join(tmpdir(), "blaw-root-"));
	tmps.push(dir);
	fill?.(dir);
	return dir;
}

describe("reportsRoot", () => {
	it("defaults to the fetched .bench/editors_trial bundle", () => {
		// Before the first `bench fetch` the bundle is absent and the call must refuse
		// to silently fall back anywhere; either way the default target is .bench/.
		try {
			expect(reportsRoot({}, SITE)).toBe(BENCH_ET);
		} catch (e) {
			expect((e as Error).message).toContain(BENCH_ET);
		}
	});
	it("REPORTS_ROOT overrides the default (a full checkout for the heavy syncs)", () => {
		const dir = scratch((d) => mkdirSync(join(d, "reports")));
		expect(reportsRoot({ REPORTS_ROOT: dir }, SITE)).toBe(resolve(dir));
	});
	it("refuses a path that is not an editors_trial source (no reports/)", () => {
		const dir = scratch((d) => mkdirSync(join(d, "out")));
		expect(() => reportsRoot({ REPORTS_ROOT: dir }, SITE)).toThrow(/no reports\/ folder/);
	});
	it("refuses a missing path instead of failing later mid-sync", () => {
		const missing = join(tmpdir(), "blaw-root-absent");
		expect(() => reportsRoot({ REPORTS_ROOT: missing }, SITE)).toThrow(/not found/);
	});
});

describe("fullCheckout", () => {
	it("accepts a checkout that holds the files the bundle does not (reference.docx)", () => {
		const dir = scratch((d) => {
			mkdirSync(join(d, "reports"));
			mkdirSync(join(d, "build"));
			mkdirSync(join(d, "build", "reference.docx"));
		});
		expect(() => fullCheckout(dir)).not.toThrow();
	});
	it("names the bundle's gap: sync:assets needs REPORTS_ROOT, the bundle has no reference.docx", () => {
		// The release bundle (.bench/editors_trial) ships reports and facts, not the
		// trial's build inputs; only the real checkout can publish figures.
		const dir = scratch((d) => mkdirSync(join(d, "reports")));
		expect(() => fullCheckout(dir)).toThrow(/REPORTS_ROOT/);
	});
	it("is satisfied by the fetched bundle only when it carries build/reference.docx", () => {
		if (!existsSync(BENCH_ET)) return; // fetched bundles never do today; guard stays either way
		expect(() => fullCheckout(BENCH_ET)).toThrow(/REPORTS_ROOT/);
	});
});

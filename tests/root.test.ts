import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { checkoutRef, fullCheckout, reportsRoot } from "../src/lib/root";

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
			writeFileSync(join(d, "build", "reference.docx"), "PK");
		});
		expect(() => fullCheckout(dir)).not.toThrow();
	});
	it("refuses a directory named build/reference.docx: the asset sync reads it as a file", () => {
		const dir = scratch((d) => mkdirSync(join(d, "build", "reference.docx"), { recursive: true }));
		expect(() => fullCheckout(dir)).toThrow(/REPORTS_ROOT/);
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

describe("checkoutRef", () => {
	// A fixture repository must not depend on the machine's git config: signing is off and every
	// setup command must succeed (CodeRabbit, #73).
	const git = (cwd: string, ...a: string[]) => {
		const r = spawnSync(
			"git",
			["-C", cwd, "-c", "commit.gpgSign=false", "-c", "tag.gpgSign=false", "-c", "user.name=t", "-c", "user.email=t@t", ...a],
			{ encoding: "utf8" },
		);
		if (r.status !== 0) throw new Error(`git ${a.join(" ")} failed: ${r.stderr}`);
		return r;
	};
	const repo = () =>
		scratch((d) => {
			git(d, "init", "-q");
			writeFileSync(join(d, "f"), "x");
			git(d, "add", "f");
			git(d, "commit", "-qm", "c");
		});
	it("returns the commit of a checkout that is its own repository", () => {
		const dir = repo();
		expect(checkoutRef(dir)).toBe(git(dir, "rev-parse", "HEAD").stdout.trim());
	});
	it("returns the exact tag when HEAD sits on one", () => {
		const dir = repo();
		git(dir, "tag", "v9.9.9");
		expect(checkoutRef(dir)).toBe("v9.9.9");
	});
	it("refuses a folder inside another repository: its HEAD is not the trial's (the bundle under .bench/)", () => {
		const dir = repo();
		mkdirSync(join(dir, "bundle"));
		expect(() => checkoutRef(join(dir, "bundle"))).toThrow(/REPORTS_ROOT/);
	});
	it("refuses a folder outside any repository", () => {
		const dir = scratch(() => {});
		expect(() => checkoutRef(dir)).toThrow(/REPORTS_ROOT/);
	});
});

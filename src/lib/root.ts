import { spawnSync } from "node:child_process";
import { existsSync, realpathSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { trialRef } from "./trialRef";

/**
 * The editors_trial source the site reads: REPORTS_ROOT (a full checkout, for the heavy sync
 * commands), or the pinned release bundle `bench fetch` materialised under .bench/editors_trial
 * (bench.lock). The bundle is the default so a fresh clone with no sibling checkouts builds:
 * `bench fetch` is the only thing it needs first. Throws when it is absent, because every sync
 * command deletes or rewrites published files before it would notice the gap.
 */
export function reportsRoot(env: { REPORTS_ROOT?: string }, site: string): string {
	const root = resolve(env.REPORTS_ROOT ?? join(site, ".bench/editors_trial"));
	if (!existsSync(root)) throw new Error(`REPORTS_ROOT not found: ${root}`);
	// An existing file or an empty folder would pass existsSync, and sync:assets would then clear
	// the published assets and copy nothing back.
	if (!statSync(root).isDirectory() || !existsSync(join(root, "reports")))
		throw new Error(`REPORTS_ROOT is not an editors_trial checkout (no reports/ folder): ${root}`);
	return root;
}

/**
 * `sync:assets` and `sync:demos` read files the release bundle does not carry (the reference
 * document, the figure renders, the demo manifests); only a real checkout holds them. Call this
 * before touching anything published, so a bundle-rooted run stops with the fix in the message
 * instead of wiping public/editors-trial/figures and copying nothing back.
 */
export function fullCheckout(root: string): void {
	const ref = join(root, "build/reference.docx");
	if (!existsSync(ref) || !statSync(ref).isFile())
		throw new Error(
			`${root} has no build/reference.docx — set REPORTS_ROOT to an editors_trial checkout for this command`,
		);
}

/** A loopback EmDash (local dev) is the only one a sync may write to without a token. */
export function isLocalEmDash(url: string): boolean {
	try {
		const u = new URL(url);
		return u.protocol === "http:" && !u.username && ["localhost", "127.0.0.1", "[::1]"].includes(u.hostname);
	} catch {
		return false;
	}
}

/**
 * The ref of the editors_trial checkout at `root`: its exact tag, else its commit. `git -C` walks
 * up to the nearest repository, so a folder that is not its own repository (the fetched bundle
 * under this site's .bench/) would report this site's HEAD and the report pages would link to a
 * commit editors_trial does not have. Only a root that is the top of its own work tree counts.
 */
export function checkoutRef(root: string): string {
	const git = (...a: string[]) =>
		(spawnSync("git", ["-C", root, ...a], { encoding: "utf8" }).stdout ?? "").trim();
	const top = git("rev-parse", "--show-toplevel");
	if (!top || realpathSync(top) !== realpathSync(root))
		throw new Error(`${root} is not a git checkout of its own — set REPORTS_ROOT to an editors_trial checkout`);
	const ref = trialRef(git("describe", "--tags", "--exact-match", "HEAD"), git("rev-parse", "HEAD"));
	if (!ref) throw new Error(`${root} carries no git ref — set REPORTS_ROOT to an editors_trial checkout`);
	return ref;
}

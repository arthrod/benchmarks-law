import { existsSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

/**
 * The editors_trial checkout the sync reads: REPORTS_ROOT, or ../../editors_trial from the site. Throws when it is
 * absent, because every sync command deletes or rewrites published files before it would notice the gap.
 */
export function reportsRoot(env: { REPORTS_ROOT?: string }, site: string): string {
	const root = resolve(env.REPORTS_ROOT ?? join(site, "../../editors_trial"));
	if (!existsSync(root)) throw new Error(`REPORTS_ROOT not found: ${root}`);
	// An existing file or an empty folder would pass existsSync, and sync:assets would then clear the published
	// assets and copy nothing back.
	if (!statSync(root).isDirectory() || !existsSync(join(root, "reports")))
		throw new Error(`REPORTS_ROOT is not an editors_trial checkout (no reports/ folder): ${root}`);
	return root;
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

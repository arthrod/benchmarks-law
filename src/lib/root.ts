import { existsSync } from "node:fs";
import { join, resolve } from "node:path";

/**
 * The editors_trial checkout the sync reads: REPORTS_ROOT, or ../../editors_trial from the site. Throws when it is
 * absent, because every sync command deletes or rewrites published files before it would notice the gap.
 */
export function reportsRoot(env: { REPORTS_ROOT?: string }, site: string): string {
	const root = resolve(env.REPORTS_ROOT ?? join(site, "../../editors_trial"));
	if (!existsSync(root)) throw new Error(`REPORTS_ROOT not found: ${root}`);
	return root;
}

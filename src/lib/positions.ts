import { RENAMED_SLUGS } from "./reports";

interface Positioned {
	slug: string;
	data: { position?: number };
}

/**
 * Rows in position order, split into the index groups. `position` is optional in EmDash, so a missing one is read
 * as 0 once, here; the groups and the report switcher then agree on where the entry belongs. An entry under a renamed
 * slug is dropped: sync never deletes, and its address now redirects to the new one.
 */
export function partitionReports<T extends Positioned>(entries: T[]) {
	const rows = entries
		.filter((e) => !Object.hasOwn(RENAMED_SLUGS, e.slug))
		.map((e) => ({ ...e, data: { ...e.data, position: e.data.position ?? 0 } }))
		.sort((a, b) => a.data.position - b.data.position);
	return {
		rows,
		reports: rows.filter((r) => r.data.position < 70),
		notes: rows.filter((r) => r.data.position >= 70 && r.data.position < 100),
		lanes: rows.filter((r) => r.data.position >= 100),
	};
}

export interface SwitcherItem {
	slug: string;
	href: string;
	code: string;
	title: string;
	current: boolean;
}

export interface SwitcherGroup {
	label: string;
	items: SwitcherItem[];
}

interface Row {
	slug: string;
	data: { position: number; code: string; title: string };
}

/** Position bands, the same as listReports(): reports < 70, notes < 100, lane notes after. */
const GROUPS: { label: string; test: (p: number) => boolean }[] = [
	{ label: "Reports", test: (p) => p < 70 },
	{ label: "Notes", test: (p) => p >= 70 && p < 100 },
	{ label: "Lane notes", test: (p) => p >= 100 },
];

/** The report switcher's groups, in position order, with the current report marked. Empty groups are dropped. */
export function switcherGroups(rows: Row[], current: string): SwitcherGroup[] {
	const sorted = [...rows].sort((a, b) => (a.data.position ?? 0) - (b.data.position ?? 0));
	return GROUPS.map(({ label, test }) => ({
		label,
		items: sorted
			.filter((r) => test(r.data.position ?? 0))
			.map((r) => ({
				slug: r.slug,
				href: `/editors-trial/${r.slug}`,
				code: r.data.code === "Lane note" ? "" : r.data.code,
				title: r.data.title.replace(/^Report [A-Z]\d?\s*[—–-]\s*/, ""),
				current: r.slug === current,
			})),
	})).filter((g) => g.items.length > 0);
}

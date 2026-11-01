export interface VendorData {
	title: string;
	maker: string;
	license: string;
	kind: string;
	leads: string;
	detail: string;
	roundtrip: number | null;
	critical: string;
	safety: number | null;
	site: string;
	render_section: string;
	lane: string;
	about: string;
	position: number;
}

export interface Placement {
	axis: "round trip" | "hostile input";
	rank: number;
	of: number;
	tied: boolean;
}

/** Competition ranking ("1, 2, 2, 4") among candidates; baselines (position >= 200) are not ranked. */
export function rankOn(
	vendors: { slug: string; data: VendorData }[],
	key: "roundtrip" | "safety",
): Map<string, { rank: number; of: number; tied: boolean }> {
	const field = vendors.filter((v) => v.data.position < 200 && typeof v.data[key] === "number");
	const scores = field.map((v) => v.data[key] as number);
	const out = new Map<string, { rank: number; of: number; tied: boolean }>();
	for (const v of field) {
		const s = v.data[key] as number;
		const rank = 1 + scores.filter((x) => x > s).length;
		const tied = scores.filter((x) => x === s).length > 1;
		out.set(v.slug, { rank, of: field.length, tied });
	}
	return out;
}

/** The better of a vendor's two placements; on equal rank, round trip first. */
export function bestPlacement(
	slug: string,
	rt: ReturnType<typeof rankOn>,
	safety: ReturnType<typeof rankOn>,
): Placement | null {
	const a = rt.get(slug);
	const b = safety.get(slug);
	const opts: Placement[] = [];
	if (a) opts.push({ axis: "round trip", ...a });
	if (b) opts.push({ axis: "hostile input", ...b });
	if (!opts.length) return null;
	return opts.sort((x, y) => x.rank - y.rank)[0];
}

export function ordinal(n: number): string {
	const s = ["th", "st", "nd", "rd"];
	const v = n % 100;
	return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/**
 * Editorial pass line for the hostile-input grade (not part of Report D). Deliberately generous: the editor is one
 * layer among several (upload scanning, size limits, sandboxed or server-side opening), so it does not have to stop
 * every package on its own to pass.
 */
export const SAFETY_PASS = 0.2;

export function safetyVerdict(grade: number | null | undefined): "pass" | "below" | "ungraded" {
	if (grade === null || grade === undefined) return "ungraded";
	return grade >= SAFETY_PASS ? "pass" : "below";
}

/** A vendor's site link, or null unless it is a well-formed https URL (CMS fields are admin-editable). */
export function safeSiteUrl(u: string | null | undefined): string | null {
	if (!u) return null;
	try {
		const url = new URL(u);
		return url.protocol === "https:" ? url.href : null;
	} catch {
		return null;
	}
}

/** A score with fixed decimals, or null when the field is absent (CMS score fields are optional). */
export function fmtScore(v: number | null | undefined, digits: number): string | null {
	return v === null || v === undefined ? null : v.toFixed(digits);
}

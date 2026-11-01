/**
 * The measured figures on the vendors page come from editors_trial's out/facts.json (`pnpm sync:vendors`),
 * so a release cannot leave a typed number behind. Prose fields (leads, detail) stay in vendors.json.
 */

/** Site slug → the trial's tool name in facts.json. */
export const TOOL_OF: Record<string, string> = {
	superdoc: "superdoc",
	folio: "folio",
	genoffice: "genoffice",
	eigenpal: "eigenpal",
	"office-open": "officeopen",
	docen: "docen",
	wordcraft: "wordcraft",
	"fidus-writer": "fidus",
	plate: "plate",
	"docs-plus": "docsplus",
	"canvas-editor": "canvas",
	docxodus: "docxodus",
	apryse: "apryse",
	libreoffice: "lo_baseline",
};

type Measured = { slug: string; roundtrip: number; critical: string; safety: number };

export function applyFacts<T extends Measured>(vendors: T[], facts: Record<string, unknown>): T[] {
	return vendors.map((v) => {
		const t = TOOL_OF[v.slug];
		const get = (k: string) => {
			const x = facts[k];
			if (typeof x !== "number") throw new Error(`${v.slug}: facts.json has no number for ${k}`);
			return x;
		};
		if (!t) throw new Error(`${v.slug}: no trial tool mapped`);
		return {
			...v,
			roundtrip: get(`rt.${t}.weighted`),
			critical: `${get(`rt.${t}.critical_passed`)}/${get(`rt.${t}.critical_total`)}`,
			safety: get(`bomb.${t}.grade`),
		};
	});
}

/** Positions from 200 up are the baseline (LibreOffice), not a tool in the field. */
export function fieldCounts(vendors: { position: number; license: string }[]) {
	const field = vendors.filter((v) => v.position < 200);
	const commercial = field.filter((v) => /proprietary|commercial/i.test(v.license)).length;
	return { tools: field.length, open: field.length - commercial, commercial };
}

const WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty"];
export const word = (n: number) => WORDS[n] ?? String(n);
export const Word = (n: number) => word(n).charAt(0).toUpperCase() + word(n).slice(1);

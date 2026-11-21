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
	// On editors.benchmarks.law since 2026-11-18; the names are the trial's lane names for them.
	"react-docx": "reactdocx",
	univer: "univer",
	opendoc: "opendoc",
	betteroffice: "betteroffice",
	onlyoffice: "onlyoffice",
	nutrient: "nutrient",
};

/**
 * Tools on the field page with no round-trip score in the trial, each for a measured reason (et-v0.11.0):
 * OnlyOffice's browser build wrote no output from the test document, Univer has no .docx path in its
 * open-source packages, and Nutrient is a viewer. Their round-trip cell reads "not measured"; a hostile-input
 * grade is shown when the facts hold one (OnlyOffice has one). Every other tool must have its figures or
 * the sync stops.
 */
export const NOT_YET_IN_THE_TRIAL = new Set(["univer", "onlyoffice", "nutrient"]);

/**
 * Vendors whose section is not in the vendor notes being published. Every card's "About" link and every
 * old lane address lands on that section, so a sync against notes that lack one must stop.
 */
export function missingSections(vendors: { slug: string; section: string }[], sections: { has(name: string): boolean }): string[] {
	return vendors.filter((v) => !sections.has(v.section)).map((v) => `${v.slug} ("${v.section}")`);
}

type Measured = { slug: string; roundtrip: number | null; critical: string; safety: number | null };

export function applyFacts<T extends Measured>(vendors: T[], facts: Record<string, unknown>): T[] {
	return vendors.map((v) => {
		const t = TOOL_OF[v.slug];
		const get = (k: string) => {
			const x = facts[k];
			if (typeof x !== "number") throw new Error(`${v.slug}: facts.json has no number for ${k}`);
			return x;
		};
		if (!t) throw new Error(`${v.slug}: no trial tool mapped`);
		const has = (k: string) => typeof facts[k] === "number";
		if (NOT_YET_IN_THE_TRIAL.has(v.slug)) {
			// Each axis on its own: a tool may have a round trip before it has a hostile-input grade.
			const rt = has(`rt.${t}.weighted`) && has(`rt.${t}.critical_passed`) && has(`rt.${t}.critical_total`);
			return {
				...v,
				roundtrip: rt ? get(`rt.${t}.weighted`) : null,
				critical: rt ? `${get(`rt.${t}.critical_passed`)}/${get(`rt.${t}.critical_total`)}` : "",
				safety: has(`bomb.${t}.grade`) ? get(`bomb.${t}.grade`) : null,
			};
		}
		return {
			...v,
			roundtrip: get(`rt.${t}.weighted`),
			critical: `${get(`rt.${t}.critical_passed`)}/${get(`rt.${t}.critical_total`)}`,
			safety: get(`bomb.${t}.grade`),
		};
	});
}

/** Positions from 200 up are the baseline (LibreOffice), not a tool in the field. */
export function fieldCounts(vendors: { position: number; license: string; roundtrip?: number | null }[]) {
	const field = vendors.filter((v) => v.position < 200);
	const commercial = field.filter((v) => /proprietary|commercial/i.test(v.license)).length;
	// `measured`: tools with a round-trip figure, i.e. run through the trial's own lanes.
	const measured = field.filter((v) => typeof v.roundtrip === "number").length;
	return { tools: field.length, open: field.length - commercial, commercial, measured };
}

const WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty"];
export const word = (n: number) => WORDS[n] ?? String(n);
export const Word = (n: number) => word(n).charAt(0).toUpperCase() + word(n).slice(1);

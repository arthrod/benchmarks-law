/**
 * Speed, data and memory scores on the field page. They come from the browser pass of
 * editors.benchmarks.law (src/data/browser-pass.json, `pnpm sync:browser`): the same three files opened
 * in every engine, in a real Chrome, on one machine. A score is a place on a logarithmic scale between
 * two anchors that the page prints, so a reader can work any of them out from the figure beside it.
 */

export interface PassCell {
	loadMs: number | null;
	settledMs: number | null;
	/** Runs in which the page never went idle for two seconds within the 180 s the test waits. */
	settleTimedOut?: number | null;
	rendererRss: number | null;
	/** Set when this row was measured on another machine than the rest of its table: which one. */
	elsewhere?: string;
	bytes: number | null;
	/** Set only when some runs failed: the figures are the median of `runsOk` of `runsOf` runs. */
	runsOk?: number;
	runsOf?: number;
}

export interface BrowserPass {
	/** Where the figures were copied from, and at which commit. */
	source: string;
	commit: string;
	measuredAt: string;
	environment: string;
	samples: Record<string, Record<string, PassCell>>;
}

export type Axis = "speed" | "data" | "memory";
export interface Grade {
	/** 0 to 10, one decimal; null when the axis is not scored for this tool. */
	score: number | null;
	/** The measured figures the score stands on. */
	basis?: string;
	/** Why there is no score. */
	why?: string;
}

/** The anchors: the figure that scores 10 and the figure that scores 0. */
export const ANCHORS = {
	richMs: [300, 10_000],
	longMs: [3_000, 120_000],
	bytes: [1_000_000, 30_000_000],
	rss: [500 * 1048576, 5000 * 1048576],
} as const;

/** Field-page slug → engine id on editors.benchmarks.law. A tool that is not there has no entry. */
export const ENGINE_OF: Record<string, string> = {
	superdoc: "superdoc",
	folio: "folio",
	eigenpal: "eigenpal",
	docen: "docen",
	wordcraft: "wordcraft",
	plate: "plate",
	"canvas-editor": "canvas-editor",
	docxodus: "docxodus",
	apryse: "apryse",
	"react-docx": "react-docx",
	univer: "univer",
	opendoc: "opendoc",
	betteroffice: "betteroffice",
	onlyoffice: "onlyoffice",
	nutrient: "nutrient",
	// Through the trial's own demo builds of them, on editors.benchmarks.law since 2026-11-21.
	genoffice: "genoffice",
	"office-open": "office-open",
	"fidus-writer": "fidus-writer",
	"docs-plus": "docs-plus",
};

const NO_GPU = "the test machine has no graphics card";
/**
 * Axes that are not scored, with the reason. Each is a figure the two sites list under "Figures to
 * distrust" as the machine's or the method's, not the engine's: scoring it would blame the engine.
 */
export const NOT_SCORED: Record<string, Partial<Record<Axis, string>>> = {
	wordcraft: { speed: `Not scored: ${NO_GPU}, and WordCraft draws through one. There its drawing never went idle; on a Mac it settled in 3 to 4 s` },
	"canvas-editor": { memory: `Not scored: ${NO_GPU}, so Chrome kept every page canvas in memory (4.8 GB there, 0.5 to 1.8 GB on a Mac)` },
	// The editors site lists folio's 2,389 MB beside canvas-editor's under "This machine, not the engine".
	folio: { memory: `Not scored: ${NO_GPU}, so Chrome kept its page canvases in memory (2.4 GB there)` },
	apryse: { speed: "Not scored: its engine works in a background thread that the timing cannot see" },
	univer: Object.fromEntries(
		(["speed", "data", "memory"] as const).map((a) => [a, "Not scored: its open-source packages cannot open a .docx, so it was handed plain text"]),
	),
};

export const NOT_IN_PASS = "Not on editors.benchmarks.law, so it has no figure from that pass";

/** 10 at `best` or better, 0 at `worst` or worse, logarithmic between; one decimal. */
export function scale(value: number, best: number, worst: number): number {
	const x = (Math.log(worst) - Math.log(value)) / (Math.log(worst) - Math.log(best));
	return Math.round(Math.min(1, Math.max(0, x)) * 100) / 10;
}

const time = (ms: number) => (ms < 1000 ? `${Math.round(ms)} ms` : `${(ms / 1000).toFixed(ms < 10_000 ? 2 : 1)} s`);
const megabytes = (b: number) => `${(b / 1_000_000).toFixed(b < 10_000_000 ? 1 : 0)} MB`;
const mebibytes = (b: number) => `${Math.round(b / 1048576)} MB`;
/** " (2 of 3 runs)" when the figure is the median of fewer runs than were tried: the editors site calls those weak. */
const runs = (c: PassCell | undefined) => (c?.runsOk != null && c.runsOf != null && c.runsOk < c.runsOf ? ` (${c.runsOk} of ${c.runsOf} runs)` : "");

/** The three scores of one tool on the field page. */
export function grades(slug: string, pass: BrowserPass): Record<Axis, Grade> {
	const engine = ENGINE_OF[slug];
	const rich = engine ? pass.samples.showcase?.[engine] : undefined;
	const long = engine ? pass.samples["lorem-500"]?.[engine] : undefined;
	if (!engine || !rich) return { speed: { score: null, why: NOT_IN_PASS }, data: { score: null, why: NOT_IN_PASS }, memory: { score: null, why: NOT_IN_PASS } };
	const skip = NOT_SCORED[slug] ?? {};

	const speed = (): Grade => {
		if (skip.speed) return { score: null, why: skip.speed };
		// A time is the machine's as much as the engine's: one taken on another machine than the table's is not scored against it.
		if (rich.elsewhere) {
			// The figures are still said: they are what that machine measured, and only the comparison is withheld.
			const there = [rich.settledMs == null ? null : `${time(rich.settledMs)} on the rich sample`, // Only when the 500 pages were timed on that same machine: another machine's time is not this sentence's.
				long?.settledMs == null || long.elsewhere !== rich.elsewhere ? null : `${time(long.settledMs)} on the 500 pages`].filter(Boolean).join(", ");
			return { score: null, why: `Not scored: it was timed on another machine, ${rich.elsewhere}${there ? ` (${there})` : ""}` };
		}
		// The printed rule: a file that did not become usable in the time the test waits scores 0 for its half.
		const short = rich.settledMs == null ? 0 : scale(rich.settledMs, ...ANCHORS.richMs);
		const richSaid = rich.settledMs == null ? "the rich sample did not become usable in the time the test waits" : `${time(rich.settledMs)} on the rich sample${runs(rich)}`;
		// No 500-page row at all is not a wait that ran out: there is nothing to score that half on.
		if (!long) return { score: null, why: "Not scored: the 500 pages were not measured for it" };
		// Before the "never went idle" case: a wait that ran out on another machine is not this pass's finding either.
		if (long.elsewhere) {
			return { score: null, why: `Not scored: its 500 pages were timed on another machine, ${long.elsewhere}${long.settledMs == null ? ", where it was still busy when the test stopped waiting" : ""}` };
		}
		if (long.settledMs == null) {
			return { score: Math.round(short * 5) / 10, basis: `${richSaid}; the 500 pages did not become usable in the time the test waits` };
		}
		return {
			score: Math.round((short + scale(long.settledMs, ...ANCHORS.longMs)) * 5) / 10,
			basis: `${richSaid}, ${time(long.settledMs)} on the 500 pages${runs(long)}`,
		};
	};
	const data = (): Grade => {
		if (skip.data) return { score: null, why: skip.data };
		if (rich.bytes == null) return { score: null, why: "Not scored: the transfer was not recorded" };
		return { score: scale(rich.bytes, ...ANCHORS.bytes), basis: `${megabytes(rich.bytes)} to open the rich sample${runs(rich)}` };
	};
	const memory = (): Grade => {
		if (skip.memory) return { score: null, why: skip.memory };
		if (long?.rendererRss == null) return { score: null, why: "Not scored: no memory reading with the 500 pages open" };
		if (long.elsewhere) return { score: null, why: `Not scored: its 500-page reading (${mebibytes(long.rendererRss)}) was taken on another machine, ${long.elsewhere}` };
		// A page still busy when the wait ended was read mid-work: the figure is what it held then, and says so.
		const busy = long.settledMs == null ? ", read while the page was still busy" : "";
		return { score: scale(long.rendererRss, ...ANCHORS.rss), basis: `${mebibytes(long.rendererRss)} with the 500 pages open${runs(long)}${busy}` };
	};
	return { speed: speed(), data: data(), memory: memory() };
}

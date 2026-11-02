/**
 * Charts for Bench 03 and Bench 04 (benchmarks-law#62).
 *
 * The figures are the datasets behind the charts on legalbenchmarks.ai, read
 * from the pages' own JavaScript bundles on 2026-11-01. The source pages draw
 * them client-side, so a text copy of the page has none of them.
 *
 * A study's Markdown names a chart as an image, `![alt](chart:name)`. The
 * report renderer escapes raw HTML, so the chart is not written in the
 * Markdown: `renderStudy` swaps each placeholder figure for the bars drawn
 * here, in the site's tokens.
 */
import { escapeHtml, renderMarkdown, type TocItem } from "./reports";

export interface ChartRow {
	label: string;
	/** One value per series; a stacked bar when there are several. */
	values: number[];
	/** Printed after the bar; defaults to the summed value. */
	display?: string;
	/** A baseline, not a contestant (the human lawyers): drawn hollow. */
	baseline?: boolean;
	/** A short note under the label. */
	note?: string;
}

export interface Chart {
	title: string;
	/** Where the figures come from, printed under the chart. */
	source: string;
	max: number;
	/** Series names for a stacked bar; one unnamed series when absent. */
	series?: string[];
	rows: ChartRow[];
}

const P1 = "legalbenchmarks.ai, Phase 1, dataset behind the page's chart [DATA]";
const P2 = "legalbenchmarks.ai, Phase 2, dataset behind the page's chart [DATA]";

const pct = (passes: number, of: number) => `${passes} / ${of} · ${((passes / of) * 100).toFixed(1)}%`;

export const CHARTS: Record<string, Chart> = {
	"p1-accuracy": {
		title: "Accuracy: tasks that met the accuracy standard, of 18",
		source: P1,
		max: 18,
		rows: [
			{ label: "NotebookLM", values: [14], display: pct(14, 18) },
			{ label: "Oliver", values: [12], display: pct(12, 18) },
			{ label: "ChatGPT", values: [12], display: pct(12, 18) },
			{ label: "DeepSeek", values: [12], display: pct(12, 18) },
			{ label: "GC AI", values: [10], display: pct(10, 18) },
			{ label: "Copilot", values: [7], display: pct(7, 18) },
		],
	},
	"p1-overall": {
		title: "Overall points: accuracy plus usefulness, of 432",
		source: P1,
		max: 432,
		series: ["Accuracy points", "Usefulness points"],
		rows: [
			{ label: "Oliver", values: [144, 171] },
			{ label: "GC AI", values: [120, 193] },
			{ label: "NotebookLM", values: [168, 145] },
			{ label: "DeepSeek", values: [144, 107] },
			{ label: "ChatGPT", values: [144, 101] },
			{ label: "Copilot", values: [84, 83] },
		],
	},
	"p1-usefulness": {
		title: "Usefulness points alone: helpfulness, length and feature support, of 216",
		source: P1,
		max: 216,
		rows: [
			{ label: "GC AI", values: [193] },
			{ label: "Oliver", values: [171] },
			{ label: "NotebookLM", values: [145] },
			{ label: "DeepSeek", values: [107] },
			{ label: "ChatGPT", values: [101] },
			{ label: "Copilot", values: [83] },
		],
	},
	"p2-reliability": {
		title: "Output reliability: drafts that passed, of 30",
		source: P2,
		max: 30,
		rows: [
			{ label: "Gemini 2.5 Pro", values: [22], display: pct(22, 30) },
			{ label: "GPT-5", values: [20], display: pct(20, 30) },
			{ label: "GC AI", values: [19], display: pct(19, 30) },
			{ label: "Brackets", values: [19], display: pct(19, 30) },
			{ label: "August", values: [19], display: pct(19, 30) },
			{ label: "SimpleDocs", values: [19], display: pct(19, 30) },
			{ label: "Opus 4.1", values: [18], display: pct(18, 30) },
			{ label: "GPT-4.1", values: [17], display: pct(17, 30) },
			{ label: "Human lawyers", values: [17], display: pct(17, 30), baseline: true },
			{ label: "Anon", values: [17], display: pct(17, 30) },
			{ label: "Copilot", values: [15], display: pct(15, 30) },
			{ label: "Magistral Medium", values: [15], display: pct(15, 30) },
			{ label: "Qwen3-235B", values: [13], display: pct(13, 30) },
			{ label: "InstaSpace", values: [10], display: pct(10, 30) },
		],
	},
	"p2-usefulness": {
		title: "Output usefulness: clarity + helpfulness + length, average of 9",
		source: P2,
		max: 9,
		series: ["Clarity", "Helpfulness", "Length"],
		rows: [
			{ label: "August", values: [2.83, 2.53, 2.77], display: "8.13" },
			{ label: "GC AI", values: [2.8, 2.5, 2.73], display: "8.03" },
			{ label: "Gemini 2.5 Pro", values: [2.8, 2.6, 2.5], display: "7.90" },
			{ label: "SimpleDocs", values: [2.67, 2.2, 2.77], display: "7.63" },
			{ label: "GPT-4.1", values: [2.63, 2.17, 2.77], display: "7.57" },
			{ label: "Human lawyers", values: [2.63, 2.23, 2.67], display: "7.53", baseline: true },
			{ label: "Brackets", values: [2.43, 2.13, 2.6], display: "7.17" },
			{ label: "Qwen3-235B", values: [2.6, 2.33, 2.23], display: "7.17" },
			{ label: "Copilot", values: [2.37, 2, 2.77], display: "7.13" },
			{ label: "InstaSpace", values: [2.5, 2.2, 2.33], display: "7.03" },
			{ label: "Opus 4.1", values: [2.6, 2.23, 2.13], display: "6.97" },
			{ label: "GPT-5", values: [2.67, 2.2, 2.07], display: "6.93" },
			{ label: "Magistral Medium", values: [2.43, 2.2, 2.27], display: "6.90" },
			{ label: "Anon", values: [2.1, 1.73, 2.3], display: "6.13" },
		],
	},
	"p2-workflow": {
		title: "Platform workflow support: draft generation + quality assurance, of 10",
		source: P2,
		max: 10,
		series: ["Draft generation (of 5)", "Quality assurance (of 5)"],
		rows: [
			{ label: "Brackets", values: [4, 4] },
			{ label: "GC AI", values: [4, 3] },
			{ label: "SimpleDocs", values: [4, 3] },
			{ label: "August", values: [3, 2] },
			{ label: "Copilot", values: [3, 1] },
			{ label: "ChatGPT", values: [3, 1] },
			{ label: "Claude", values: [3, 1] },
			{ label: "Le Chat (Mistral)", values: [3, 1] },
			{ label: "Gemini", values: [3, 1] },
			{ label: "Qwen", values: [1, 1] },
			{ label: "InstaSpace", values: [1, 1] },
		],
	},
	"p2-survey-use": {
		title: "Survey: how lawyers use AI (72 responses)",
		source: P2,
		max: 100,
		rows: [
			{ label: "Use AI tools for legal work", values: [97], display: "97%" },
			{ label: "Use two or more AI tools", values: [83], display: "83%" },
			{ label: "Use legal AI tools", values: [35], display: "35%" },
		],
	},
	"p2-survey-driver": {
		title: "Survey: which improvement would most increase your use next quarter?",
		source: P2,
		max: 100,
		rows: [
			{ label: "Easier verification (shows work, citations, rationale)", values: [35], display: "35%" },
			{ label: "Bigger, smarter context memory", values: [23], display: "23%" },
			{ label: "Higher output accuracy", values: [21], display: "21%" },
			{ label: "Deeper workflow integration (Word, Outlook)", values: [18], display: "18%" },
			{ label: "Other", values: [3], display: "3%" },
		],
	},
	"p2-survey-illegal": {
		title: "Survey: how should an AI tool handle a request to draft an unenforceable or illegal clause?",
		source: P2,
		max: 100,
		rows: [
			{ label: "Draft it, but add a risk warning", values: [64], display: "64%" },
			{ label: "Draft a compliant alternative instead", values: [19], display: "19%" },
			{ label: "Refuse, and explain the legal reason", values: [17], display: "17%" },
			{ label: "Draft as requested, no warning", values: [0], display: "0%" },
		],
	},
};

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/0$/, ""));
const width = (v: number, max: number) => `${Math.round((v / max) * 1000) / 10}%`;

/** The bars for one chart; `compact` drops the caption and legend (homepage card). */
export function chartHtml(c: Chart, opts: { compact?: boolean; limit?: number } = {}): string {
	const total = (r: ChartRow) => r.values.reduce((a, b) => a + b, 0);
	const lead = Math.max(...c.rows.filter((r) => !r.baseline).map(total));
	const rows = opts.limit ? c.rows.slice(0, opts.limit) : c.rows;
	const stacked = (c.series?.length ?? 1) > 1;
	const items = rows
		.map((r) => {
			const cls = [total(r) === lead && !r.baseline ? "is-lead" : "", r.baseline ? "is-base" : ""].filter(Boolean).join(" ");
			const segs = r.values
				.map((v, i) => `<span class="seg s${i}" style="width:${width(v, c.max)}"></span>`)
				.join("");
			const shown = r.display ?? fmt(total(r));
			const note = r.note ? `<small>${escapeHtml(r.note)}</small>` : "";
			return `<li${cls ? ` class="${cls}"` : ""}><span class="lbl">${escapeHtml(r.label)}${note}</span><span class="bar">${segs}</span><span class="val">${escapeHtml(shown)}</span></li>`;
		})
		.join("");
	const legend =
		stacked && !opts.compact
			? `<p class="legend">${(c.series ?? []).map((s, i) => `<span><i class="seg s${i}"></i>${escapeHtml(s)}</span>`).join("")}</p>`
			: "";
	const head = opts.compact ? "" : `<p class="ttl">${escapeHtml(c.title)}</p>`;
	const foot = opts.compact ? "" : `<figcaption>${escapeHtml(c.source)}</figcaption>`;
	const label = escapeHtml(c.title);
	return `<figure class="lr-chart${stacked ? " is-stacked" : ""}${opts.compact ? " is-compact" : ""}" role="group" aria-label="${label}">${head}${legend}<ol>${items}</ol>${foot}</figure>`;
}

const PLACEHOLDER = /<figure><img src="chart:([a-z0-9-]+)"[^>]*>(?:<figcaption[^>]*>[\s\S]*?<\/figcaption>)?<\/figure>/g;

/** renderMarkdown, with each `chart:` figure drawn. An unknown chart is an error. */
export function renderStudy(md: string): { html: string; toc: TocItem[] } {
	const { html, toc } = renderMarkdown(md);
	const out = html.replace(PLACEHOLDER, (_m, name: string) => {
		const c = CHARTS[name];
		if (!c) throw new Error(`unknown chart: ${name}`);
		return chartHtml(c);
	});
	if (/src="chart:/.test(out)) throw new Error("a chart placeholder was not drawn");
	return { html: out, toc };
}

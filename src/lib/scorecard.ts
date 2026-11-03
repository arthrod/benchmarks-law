/**
 * The editors-trial scorecard (public/neurotic-docx-bench/editors/), generated at build time
 * from the pinned release's out/facts.json — the same file `bench fetch` verified against the
 * bench.lock manifest. Every measured cell (weighted, critical, text, parts, failed, second
 * pass, Word opens) and every KPI number is a facts key, so the page cannot drift from the
 * trial again; the prose (lede, findings, notes) is authored here. It replaces the copied
 * editors/index.html that sync:assets rebuilt by parsing the main report's Markdown tables
 * (rebuildScoreTable): the release bundle is the source of truth now, and it does not even
 * carry that Markdown.
 */

/** The trial's facts: flat keys to numbers, strings or booleans. */
export type Facts = Record<string, number | string | boolean>;

/** One measured tool as the page shows it. */
export interface ScorecardRow {
	name: string;
	note?: string;
	weighted: number;
	critical: string;
	text: string;
	parts: string;
	failed: number;
	secondPass: string;
	wordOpens: boolean | null;
	baseline: boolean;
}

/** The field, in the order ties keep. The baseline is rendered last, apart. */
const TOOLS: { key: string; name: string; note?: string }[] = [
	{ key: "superdoc", name: "SuperDoc V2" },
	{ key: "docxodus", name: "Docxodus" },
	{ key: "eigenpal", name: "eigenpal" },
	{ key: "genoffice", name: "GenOffice" },
	{ key: "folio", name: "Folio" },
	{ key: "officeopen", name: "office-open" },
	{ key: "docen", name: "Docen" },
	{ key: "wordcraft", name: "WordCraft" },
	{ key: "canvas", name: "canvas-editor + plugin" },
	{ key: "fidus", name: "Fidus Writer" },
	{ key: "docsplus", name: "docs.plus" },
	{ key: "plate", name: "Plate.js" },
	{ key: "apryse", name: "Apryse WebViewer 12.2.1", note: "closed source, trial key" },
];

const BASELINE = { key: "lo_baseline", name: "LibreOffice (baseline)" };

/** A facts key's number, or a throw that names the key: no figure, no page. */
function num(facts: Facts, key: string): number {
	const v = facts[key];
	if (typeof v !== "number") throw new Error(`facts.json has no number for ${key}`);
	return v;
}

/** A facts key's boolean, or null when the trial did not measure it. */
function maybeBool(facts: Facts, key: string): boolean | null {
	const v = facts[key];
	return typeof v === "boolean" ? v : null;
}

/** The second-pass cell: byte-identical, stable, or the score it collapsed to. */
function secondPass(facts: Facts, key: string, weighted: number): string {
	const again = num(facts, `p2.${key}.weighted`);
	if (maybeBool(facts, `p2.${key}.identical`) === true) return "byte-identical";
	if (again >= weighted - 1) return "stable, not byte-identical";
	return `${again.toFixed(1)}% on the second pass`;
}

/** The table rows, ranked by weighted score with the baseline last. */
export function scorecardRows(
	facts: Facts,
	tools: { key: string; name: string; note?: string }[] = TOOLS,
	baseline: { key: string; name: string } = BASELINE,
): ScorecardRow[] {
	const row = (t: { key: string; name: string; note?: string }, isBaseline = false): ScorecardRow => ({
		name: t.name,
		...(t.note ? { note: t.note } : {}),
		weighted: num(facts, `rt.${t.key}.weighted`),
		critical: `${num(facts, `rt.${t.key}.critical_passed`)} / ${num(facts, `rt.${t.key}.critical_total`)}`,
		text: `${num(facts, `rt.${t.key}.text_pct`).toFixed(1)}%`,
		parts: `${num(facts, `parts.${t.key}.kept`)} / ${num(facts, `parts.${t.key}.total`)}`,
		failed: num(facts, `rt.${t.key}.failed`),
		secondPass: secondPass(facts, t.key, num(facts, `rt.${t.key}.weighted`)),
		wordOpens: maybeBool(facts, `word.${t.key}.opens`),
		baseline: isBaseline,
	});
	return [...tools.map((t) => row(t)), row(baseline, true)].sort((a, b) =>
		a.baseline === b.baseline ? b.weighted - a.weighted : a.baseline ? 1 : -1,
	);
}

/** The KPI strip: counted from facts, so an edition that measures more says so. */
function kpis(
	facts: Facts,
	tools: { key: string; name: string; note?: string }[] = TOOLS,
): [string, string][] {
	const rows = scorecardRows(facts, tools);
	return [
		[String(rows.filter((r) => !r.baseline).length), "tools measured"],
		[String(num(facts, "rt.superdoc.total")), "checks, weighted 3 / 2 / 1"],
		[String(num(facts, "rt.superdoc.critical_total")), "critical features"],
		[String(num(facts, "parts.superdoc.total")), "package parts in the corpus"],
		[String(rows.filter((r) => r.weighted === 100).length), "perfect round trips"],
	];
}

const esc = (s: string) =>
	s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function table(rows: ScorecardRow[]): string {
	const body = rows
		.map((r) => {
			const cls = r.baseline ? ' class="base"' : r.weighted === 100 ? ' class="top"' : "";
			const name = r.note ? `${esc(r.name)} <small>(${esc(r.note)})</small>` : esc(r.name);
			const word =
				r.wordOpens === null
					? "<td>not measured</td>"
					: r.wordOpens
						? '<td class="ok">opened</td>'
						: '<td class="no">refused</td>';
			const second = r.secondPass.startsWith("byte") ? `<td>${r.secondPass}</td>` : `<td class="no">${esc(r.secondPass)}</td>`;
			return `<tr${cls}><td>${name}</td><td class="n">${r.weighted.toFixed(1)}%</td><td class="bar"><span class="b" style="width:${r.weighted}%"></span></td><td class="n">${esc(r.critical)}</td><td class="n">${esc(r.text)}</td><td class="n">${esc(r.parts)}</td><td class="n">${r.failed}</td>${second}${word}</tr>`;
		})
		.join("\n");
	return `<div class="tbl"><table class="score"><thead><tr><th>Tool</th><th class="n">Weighted</th><th></th><th class="n">Critical</th><th class="n">Text kept</th><th class="n">Parts</th><th class="n">Failed</th><th>Second pass</th><th>Word opens</th></tr></thead><tbody>
${body}
</tbody></table></div>`;
}

/** The whole page (before the site navbar is injected). */
export function scorecardHtml(
	facts: Facts,
	tools: { key: string; name: string; note?: string }[] = TOOLS,
): string {
	const rows = scorecardRows(facts, tools);
	return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>neurotic_docx_bench: Open-source DOCX editors, round-trip trial (2026)</title>
<meta name="description" content="Thirteen open-source DOCX editors driven through their own import → export path over one 35-part adversarial document, scored on 99 checks, re-fed for idempotence and re-opened in Microsoft Word. Results, reports and vendors.">
<link rel="stylesheet" href="../../editors-score.css">
</head>
<body class="doc">
<header id="brand"><span class="crumb">/ Editors trial</span></header>
<nav class="crumbs" aria-label="Breadcrumb"><a href="../index.html">Benches</a> &middot; Editors trial</nav>
<main id="main">
<p class="meta"><span>Editors trial &middot; et release</span><span>Word 16.115 as validator</span><span>Every repo cloned at a pinned commit</span></p>
<h1>Thirteen DOCX editors, one <span class="mk">hostile</span> document, 99 checks.</h1>
<p class="lede">Every editor's code was downloaded, its own import → export path was run headlessly over a purpose-built 35-part adversarial DOCX, and the output was diffed against the input at part, element, attribute and text level. Then the output was fed back through the same editor, re-opened in LibreOffice, and opened in Microsoft Word. No claim below rests on a README.</p>
<p class="note"><b>Read the reports first.</b> This page is the trial's scorecard, generated from the editors_trial release's own facts (out/facts.json, verified against the release manifest). The method, the corpus and every finding are in <a href="/editors-trial/round-trip" rel="noopener">the main report</a>; the field and its context are on <a href="/editors-trial/" rel="noopener">the trial hub</a> and <a href="/editors-trial/vendors" rel="noopener">the vendors page</a>.</p>
<div class="ctas"><a class="cta ink" href="/editors-trial/round-trip" rel="noopener">Read the main report</a><a class="cta" href="https://github.com/arthrod/editors_trial" rel="noopener">Corpus, harnesses &amp; scorer on GitHub</a></div>
<div class="kpis">${kpis(facts, tools)
		.map(([v, l]) => `<div><b>${esc(v)}</b><span>${esc(l)}</span></div>`)
		.join("")}</div>
<section id="scorecard"><h2>Round-trip scorecard</h2>
<p>Weighted score across the 99 checks; critical features are the 29 constructs a legal or publishing workflow cannot lose. "Second pass" feeds each output back through the same editor and scores it against its own first pass. "Word opens" is the raw first-pass output opened in Word 16.115, before any repair. LibreOffice is the calibration floor, not a candidate.</p>
${table(rows)}
<p class="note"><b>Read the floor first.</b> LibreOffice, converting headlessly, scores ${num(facts, "rt.lo_baseline.weighted").toFixed(1)}%. An open-source editor that cannot beat LibreOffice on a Word-authored document is not a fidelity tool, whatever its star count says.</p></section>
<section id="findings"><h2>What the trial found</h2>
<ol class="steps">
<li><b>Three tools lose nothing.</b> SuperDoc V2, Docxodus and eigenpal pass all 99 checks, keep all 35 parts, and reproduce their own output byte for byte on a second pass. Docxodus gets there with 25 parts untouched and 10 re-serialised, none changed, none dropped.</li>
<li><b>Four outputs cannot be opened by Word.</b> Folio, office-open, Docen and Fidus Writer produce files Word 16.115 refuses. Three of them fail a static check: Fidus Writer has eleven schema violations, and office-open and Docen leave five dangling relationship ids each, so the chart never draws. Folio passes every static check and Word still refuses it.</li>
<li><b>Two editors corrupt their own output.</b> office-open and Docen are not idempotent: re-importing their first pass yields <code>word/document.xml</code> with an unbound <code>a:</code> prefix. The file looks fine, opens in LibreOffice, and breaks only when fed back in.</li>
<li><b>Two editors say what they lost.</b> SuperDoc names a diagnostic code for each drawing family it fails closed on. Plate.js scores last but emits 38 typed diagnostics and, under its default <code>lossPolicy: 'reject'</code>, refuses a document it cannot carry losslessly. It is also the only editor that refuses the malformed corpus instead of reproducing the damage.</li>
<li><b>Nobody repairs anything.</b> Handed a corpus carrying all twelve defect classes, every editor either reproduced the damage or dropped the part that carried it. Docxodus ships a repair funnel, and it repairs a different set of defects.</li>
<li><b>Stars predict nothing.</b> The two most-starred projects, WordCraft and Plate, score ${num(facts, "rt.wordcraft.weighted").toFixed(1)}% and ${num(facts, "rt.plate.weighted").toFixed(1)}%, both below the LibreOffice floor of ${num(facts, "rt.lo_baseline.weighted").toFixed(1)}%.</li>
</ol></section>
</main>
<footer class="site"><span class="mono">neurotic_docx_bench · editors trial · © MMXXVI</span><span>Maintained by <a href="https://arthur.law/" rel="noopener">Arthur Souza Rodrigues</a>, author of jubarte. jubarte is not an editor and is not in this trial.</span><a href="https://github.com/arthrod/editors_trial" rel="noopener">Trial repo →</a><a href="https://arthur.law/contact" rel="noopener">Contact</a><span>Attorney advertising.</span></footer>
</body>
</html>
`;
}

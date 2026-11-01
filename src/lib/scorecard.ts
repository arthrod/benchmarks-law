/**
 * The bench's "at a glance" scorecard (public/neurotic-docx-bench/editors/index.html) is rebuilt from the main
 * report on every sync:assets, so a participant or a figure cannot drift from the report again.
 *
 * Measured cells (name, weighted, critical, text, parts, failed) come from the report's scorecard. The
 * "Second pass" and "Word opens" cells of a row the page already had are kept; a new participant takes the
 * verdict of the report's second-pass table and Word's verdict from out/word_verdicts.json.
 */
const strip = (t: string) => t.replace(/<[^>]+>/g, "").replace(/[*_]/g, "").replace(/\s+/g, " ").trim();

function mdTable(md: string, header: string): string[][] {
	const at = md.indexOf(header);
	if (at < 0) return [];
	const lines = md.slice(at).split("\n");
	const end = lines.findIndex((l) => !l.startsWith("|"));
	return lines.slice(2, end < 0 ? undefined : end).map((l) => l.split("|").slice(1, -1).map(strip));
}

const key = (name: string) => name.replace(" (baseline)", "").split(" ")[0].toLowerCase();

export function rebuildScoreTable(html: string, mainMd: string, wordVerdicts: Record<string, string>): string {
	const start = html.indexOf('<table class="score">');
	if (start < 0) return html;
	const bodyAt = html.indexOf("<tbody>", start) + "<tbody>".length;
	const bodyEnd = html.indexOf("</tbody>", bodyAt);
	const old = new Map<string, { cls: string; tail: string }>();
	for (const m of html.slice(bodyAt, bodyEnd).matchAll(/<tr( class="[^"]*")?>([\s\S]*?)<\/tr>/g)) {
		const cells = [...m[2].matchAll(/<td[^>]*>[\s\S]*?<\/td>/g)].map((x) => x[0]);
		old.set(key(strip(cells[0])), { cls: m[1] ?? "", tail: cells.slice(7).join("") });
	}
	const second = new Map(mdTable(mainMd, "| Editor | First pass |").map((r) => [key(r[0]), r]));
	const rows = mdTable(mainMd, "| Editor | Weighted score |").map(([name, w, crit, text, parts, failed]) => {
		const k = key(name);
		const base = name.includes("(baseline)");
		const prev = old.get(k);
		let tail = prev?.tail;
		if (!tail) {
			const p2 = second.get(k);
			const v = p2 ? (p2[3] === "yes" ? "byte-identical" : p2[4].charAt(0).toLowerCase() + p2[4].slice(1)) : "not measured";
			const word = wordVerdicts[k];
			const wcell = word === "OPENED" ? '<td class="ok">opened</td>' : word ? "<td>refused</td>" : "<td>not measured</td>";
			tail = `<td>${v}</td>${wcell}`;
		}
		const cls = base ? ' class="base"' : (prev?.cls ?? "");
		const width = String(Number.parseFloat(w));
		const c = crit.match(/\((\d+)\/(\d+)\)/);
		return `<tr${cls}><td>${name}</td><td class="n">${w}</td><td class="bar"><span class="b" style="width:${width}%"></span></td><td class="n">${c ? `${c[1]} / ${c[2]}` : crit}</td><td class="n">${text}</td><td class="n">${parts}</td><td class="n">${failed}</td>${tail}</tr>`;
	});
	return `${html.slice(0, bodyAt)}\n${rows.join("\n")}\n${html.slice(bodyEnd)}`;
}

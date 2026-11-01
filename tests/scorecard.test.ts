import { describe, expect, it } from "vitest";
import { rebuildScoreTable } from "../src/lib/scorecard";

const md = `| Editor | Weighted score | Critical features | Text retention | Package parts kept | Failed checks |
|---|---|---|---|---|---|
| **SuperDoc V2** | **100.0%** | **100.0%** (29/29) | **100.0%** | 35 / 35 | **0** |
| Apryse WebViewer 12.2.1 (closed source, trial key) | 89.9% | 86.2% (25/29) | 100.0% | 30 / 35 | 9 (1 cannot be separated from the trial stamp) |
| *LibreOffice (baseline)* | *86.9%* | *79.3% (23/29)* | *100.0%* | *25 / 35* | *12* |

| Editor | First pass | Second pass (scored against its own first pass) | Byte-identical? | Verdict |
|---|---|---|---|---|
| Apryse WebViewer | 89.9% | 89.9% | no | Trial-stamped on both passes |
`;
const html = `<table class="score"><thead><tr><th>Tool</th></tr></thead><tbody>
<tr class="top"><td>SuperDoc V2</td><td class="n">99.0%</td><td class="bar"><span class="b" style="width:99%"></span></td><td class="n">28 / 29</td><td class="n">100.0%</td><td class="n">35 / 35</td><td class="n">1</td><td>byte-identical</td><td class="ok">opened</td></tr>
</tbody></table>`;

describe("rebuildScoreTable", () => {
	const out = rebuildScoreTable(html, md, { apryse: "OPENED" });
	it("takes every measured cell from the main report", () => {
		expect(out).toContain('<td>SuperDoc V2</td><td class="n">100.0%</td><td class="bar"><span class="b" style="width:100%"></span></td><td class="n">29 / 29</td>');
		expect(out).not.toContain("99.0%");
	});
	it("keeps a row's second-pass and Word cells", () => {
		expect(out).toContain('<td class="n">0</td><td>byte-identical</td><td class="ok">opened</td>');
	});
	it("adds a new participant with its second-pass verdict and Word's", () => {
		expect(out).toContain("<td>Apryse WebViewer 12.2.1 (closed source, trial key)</td>");
		expect(out).toContain('<td class="n">9 (1 cannot be separated from the trial stamp)</td><td>trial-stamped on both passes</td><td class="ok">opened</td>');
	});
	it("marks the baseline row", () => {
		expect(out).toContain('<tr class="base"><td>LibreOffice (baseline)</td>');
	});
});

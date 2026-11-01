import { readFileSync } from "node:fs";
import { renderMarkdown, wordCount } from "../src/lib/reports";
const md = readFileSync("/tmp/reports/report-a.md", "utf8");
for (let i = 0; i < 3; i++) {
	const t0 = performance.now();
	const { html, toc } = renderMarkdown(md);
	const t1 = performance.now();
	const w = wordCount(md);
	const t2 = performance.now();
	console.log(`renderMarkdown ${(t1-t0).toFixed(1)}ms  wordCount ${(t2-t1).toFixed(1)}ms  html=${(html.length/1024).toFixed(0)}KB toc=${toc.length}`);
}

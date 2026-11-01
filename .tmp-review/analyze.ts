import { readFileSync, readdirSync, existsSync } from "node:fs";
import GithubSlugger from "github-slugger";
import { renderMarkdown, plainInline } from "../src/lib/reports";

const dir = "/tmp/reports";
const files = readdirSync(dir).filter((f) => f.endsWith(".md"));
const STATIC_IDS = ["main", "toc", "toc-details", "progress", "root"];

for (const f of files) {
	const md = readFileSync(`${dir}/${f}`, "utf8");
	const { html, toc } = renderMarkdown(md);
	const ids = [...html.matchAll(/<h[2-6] id="([^"]+)"/g)].map((m) => m[1]);
	const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
	const collide = ids.filter((id) => STATIC_IDS.includes(id));
	const figLinks = [...html.matchAll(/src="(\/editors-trial\/figures\/[^"]+)"/g)].map((m) => m[1]);
	const missing = [...new Set(figLinks)].filter((u) => !existsSync(`public${u}`));
	const rawHtml = [...html.matchAll(/<(script|iframe|object|embed|style|form|svg)/gi)].map((m) => m[1]);
	const relLinks = [...html.matchAll(/<a href="([^"]*)"/g)].map((m) => m[1]).filter((h) => h && !/^(\/|#|https?:|mailto:|tel:)/.test(h));
	console.log(`\n### ${f}  (${(md.length/1024).toFixed(0)}KB html ${(html.length/1024).toFixed(0)}KB)`);
	console.log(`  headings=${ids.length} dupIds=${JSON.stringify([...new Set(dupes)])} staticIdCollisions=${JSON.stringify(collide)}`);
	console.log(`  missingFigures=${missing.length} ${JSON.stringify(missing.slice(0,4))}`);
	console.log(`  rawHtmlTags=${JSON.stringify([...new Set(rawHtml)])} relativeLinks=${JSON.stringify([...new Set(relLinks)].slice(0,8))}`);
}

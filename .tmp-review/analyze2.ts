import { readFileSync, readdirSync, existsSync } from "node:fs";
import GithubSlugger from "github-slugger";
import { renderMarkdown } from "../src/lib/reports";
import vendors from "../src/data/vendors.json" with { type: "json" };

const dir = "/tmp/reports";
// 1. all image sources in the bodies
for (const f of readdirSync(dir).filter((f) => f.endsWith(".md"))) {
	const md = readFileSync(`${dir}/${f}`, "utf8");
	const srcs = [...md.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)].map((m) => m[1]);
	if (srcs.length) {
		const { html } = renderMarkdown(md);
		const rendered = [...html.matchAll(/<img src="([^"]+)"/g)].map((m) => m[1]);
		const missing = rendered.filter((u) => !u.startsWith("http") && !existsSync(`public${u}`));
		console.log(`${f}: md-images=${srcs.length} rendered=${rendered.length} missing=${missing.length}`);
		console.log("   sample md:", srcs.slice(0, 3));
		console.log("   sample rendered:", rendered.slice(0, 3));
		if (missing.length) console.log("   MISSING:", [...new Set(missing)].slice(0, 10));
	}
}

// 2. vendors.astro anchor() vs report-c heading ids
const rc = readFileSync(`${dir}/report-c.md`, "utf8");
const { html } = renderMarkdown(rc);
const ids = new Set([...html.matchAll(/<h[2-6] id="([^"]+)"/g)].map((m) => m[1]));
console.log("\n--- vendors.astro anchor(render_section) vs report-c ids ---");
for (const v of vendors) {
	const a = new GithubSlugger().slug(v.renderSection);
	const target = `report-c#${a}`;
	console.log(`${v.slug.padEnd(16)} anchor=${a.padEnd(60)} existsInReportC=${ids.has(a)}`);
}
// 3. what are report-c's real headings around 2.x
console.log("\n--- report-c headings (first 30) ---");
console.log([...html.matchAll(/<h([2-6]) id="([^"]+)">([\s\S]*?)<\/h\1>/g)].slice(0, 30).map((m) => `${m[1]}:${m[2]}`).join("\n"));

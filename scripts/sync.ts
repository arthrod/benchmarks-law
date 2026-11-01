/**
 * Publishes the editors_trial reports and the neurotic_docx_bench viewer into this site.
 *
 *   pnpm sync:assets    # figures, .docx downloads, neurotic link fixes → public/
 *   pnpm sync:content   # upsert every report into the EmDash `reports` collection
 *
 * REPORTS_ROOT  editors_trial checkout (default ../../temp/T/editors_trial)
 * EMDASH_URL    EmDash instance (default https://benchmarks.law)
 * EMDASH_TOKEN  personal access token with content:write
 */
import { cpSync, existsSync, rmSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { benchPage } from "../src/lib/navbar";
import { patchNeuroticHtml } from "../src/lib/neurotic";
import vendorsData from "../src/data/vendors.json" with { type: "json" };
import { REPORT_FILES, buildEntry, extractTitle, splitSections } from "../src/lib/reports";

const SITE = resolve(import.meta.dirname, "..");
const ROOT = resolve(process.env.REPORTS_ROOT ?? join(SITE, "../../editors_trial"));
const URL_ = process.env.EMDASH_URL ?? "https://benchmarks.law";
const BLOB = "https://github.com/arthrod/editors_trial/blob/benchmark-fairness-reports/";

function walk(dir: string): string[] {
	if (!existsSync(dir)) return [];
	return readdirSync(dir).flatMap((n) => {
		const p = join(dir, n);
		return statSync(p).isDirectory() ? walk(p) : [p];
	});
}

/** The date of the last commit that touched the file; null when it is untracked or uncommitted-only. */
function lastCommitDate(rel: string): string | null {
	const dirty = spawnSync("git", ["status", "--porcelain", "--", rel], { cwd: ROOT, encoding: "utf8" });
	if (dirty.status === 0 && dirty.stdout.trim()) return null;
	const r = spawnSync("git", ["log", "-1", "--format=%cs", "--", rel], { cwd: ROOT, encoding: "utf8" });
	return r.status === 0 && r.stdout.trim() ? r.stdout.trim() : null;
}

function docxFor(mdPath: string): string | null {
	const d = mdPath.replace(/\.md$/, ".docx");
	return existsSync(join(ROOT, d)) ? d : null;
}

function assets() {
	const figs = join(SITE, "public/editors-trial/figures");
	rmSync(figs, { recursive: true, force: true });
	rmSync(join(SITE, "public/editors-trial/files"), { recursive: true, force: true });
	let n = 0;
	for (const f of walk(join(ROOT, "out"))) {
		if (!/\/figures\/[^/]+\.(png|jpe?g|webp)$/.test(f)) continue;
		const dest = join(figs, f.slice(join(ROOT, "out").length + 1));
		mkdirSync(dirname(dest), { recursive: true });
		cpSync(f, dest);
		n++;
	}
	const files = join(SITE, "public/editors-trial/files");
	mkdirSync(files, { recursive: true });
	const published = new Set<string>();
	for (const r of REPORT_FILES) {
		const d = docxFor(r.path);
		if (!d) continue;
		cpSync(join(ROOT, d), join(files, d.slice(d.lastIndexOf("/") + 1)));
		published.add(d);
	}
	const neurotic = join(SITE, "public/neurotic-docx-bench");
	// The navbar's trial dropdown lists the same reports, with the same titles, as the CMS.
	const rows = REPORT_FILES.filter((r) => existsSync(join(ROOT, r.path))).map((r) => ({
		slug: r.slug,
		data: { position: r.position, code: r.code, title: extractTitle(readFileSync(join(ROOT, r.path), "utf8")) || r.slug },
	}));
	for (const f of walk(neurotic).filter((p) => p.endsWith(".html"))) {
		const rel = f.slice(neurotic.length + 1);
		writeFileSync(f, benchPage(patchNeuroticHtml(readFileSync(f, "utf8"), published), rel, rows));
	}
	console.log(`figures ${n} · docx ${published.size} · neurotic pages patched · navbar on ${rows.length} reports`);
}


function cli(args: string[], input?: string): string {
	const p = spawnSync("pnpm", ["exec", "emdash", ...args, "--url", URL_, "--json"], {
		cwd: SITE,
		input,
		env: process.env,
		encoding: "utf8",
		maxBuffer: 64 * 1024 * 1024,
	});
	const out = p.stdout ?? "";
	if (p.status !== 0) throw new Error(`emdash ${args.join(" ")} failed: ${p.stderr}${out}`);
	return out;
}

const FIELDS: [string, string, string, boolean?][] = [
	["title", "string", "Title", true],
	["code", "string", "Code"],
	["series", "string", "Series"],
	["dek", "text", "Dek"],
	["body", "text", "Body (markdown)"],
	["position", "integer", "Position"],
	["notice", "string", "Notice (e.g. INTERIM)"],
	["source_path", "string", "Source path"],
	["docx_path", "string", "DOCX path"],
	["updated", "string", "Updated"],
];

const VENDOR_FIELDS: [string, string, string, boolean?][] = [
	["title", "string", "Name", true],
	["maker", "string", "Maker"],
	["license", "string", "License"],
	["kind", "string", "What it is"],
	["leads", "string", "Where it leads"],
	["detail", "text", "Why (from the reports)"],
	["roundtrip", "number", "Round-trip weighted score (%)"],
	["critical", "string", "Critical features"],
	["safety", "number", "Hostile-input grade (0-1)"],
	["site", "string", "Site"],
	["render_section", "string", "Report C section heading"],
	["lane", "string", "Lane note slug"],
	["about", "text", "About (markdown, from vendors.md)"],
	["position", "integer", "Position"],
];

function ensureSchema(collection: string, label: string, singular: string, fields: [string, string, string, boolean?][]) {
	let have: string[] = [];
	try {
		have = (JSON.parse(cli(["schema", "get", collection])).fields ?? []).map((f: { slug: string }) => f.slug);
	} catch {
		cli(["schema", "create", collection, "--label", label, "--label-singular", singular]);
		console.log(`created collection ${collection}`);
	}
	for (const [slug, type, flabel, required] of fields) {
		if (have.includes(slug)) continue;
		cli(["schema", "add-field", collection, slug, "--type", type, "--label", flabel, ...(required ? ["--required"] : [])]);
		console.log(`added field ${collection}.${slug}`);
	}
}

function upsert(collection: string, slug: string, data: Record<string, unknown>, bySlug: Map<string, string>) {
	const payload = JSON.stringify(data);
	const id = bySlug.get(slug);
	if (!id) {
		cli(["content", "create", collection, "--slug", slug, "--stdin"], payload);
		console.log(`created ${collection}/${slug}`);
		return;
	}
	const got = JSON.parse(cli(["content", "get", collection, id, "--raw"]));
	const rev = got._rev ?? got.rev ?? got.revision;
	const tmp = join(SITE, `.emdash-${collection}-${slug}.json`);
	writeFileSync(tmp, payload);
	try {
		cli(["content", "update", collection, id, "--rev", rev, "--file", tmp]);
	} finally {
		rmSync(tmp, { force: true });
	}
	console.log(`updated ${collection}/${slug}`);
}

function existing(collection: string): Map<string, string> {
	const listed = JSON.parse(cli(["content", "list", collection, "--limit", "100"]));
	const items: { id: string; slug: string }[] = listed.items ?? listed;
	return new Map(items.map((i) => [i.slug, i.id]));
}

function vendors() {
	ensureSchema("vendors", "Vendors", "Vendor", VENDOR_FIELDS);
	const about = splitSections(readFileSync(join(ROOT, "reports/vendors.md"), "utf8"));
	const bySlug = existing("vendors");
	for (const v of vendorsData) {
		upsert("vendors", v.slug, {
			title: v.name,
			maker: v.maker,
			license: v.license,
			kind: v.kind,
			leads: v.leads,
			detail: v.detail,
			roundtrip: v.roundtrip,
			critical: v.critical ?? "",
			safety: v.safety,
			site: v.site,
			render_section: v.renderSection,
			lane: v.lane ?? "",
			about: about.get(v.section) ?? "",
			position: v.position,
		}, bySlug);
	}
}

async function content() {
	if (!process.env.EMDASH_TOKEN && !/^http:\/\/localhost/.test(URL_)) throw new Error("EMDASH_TOKEN is not set");
	ensureSchema("reports", "Reports", "Report", FIELDS);
	const bySlug = existing("reports");
	for (const file of REPORT_FILES) {
		const abs = join(ROOT, file.path);
		if (!existsSync(abs)) {
			console.log(`skip ${file.slug} (missing ${file.path})`);
			continue;
		}
		const md = readFileSync(abs, "utf8");
		const updated = lastCommitDate(file.path) ?? statSync(abs).mtime.toLocaleDateString("en-CA");
		const entry = buildEntry(file, md, { blobBase: BLOB, updated, docx: docxFor(file.path) });
		upsert("reports", entry.slug, { ...entry.data }, bySlug);
	}
}

const cmd = process.argv[2];
if (cmd === "assets") assets();
else if (cmd === "content") await content();
else if (cmd === "vendors") vendors();
else {
	console.error("usage: sync.ts assets|content|vendors");
	process.exit(2);
}

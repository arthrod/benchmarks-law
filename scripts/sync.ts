/**
 * Publishes the editors_trial reports and the neurotic_docx_bench viewer into this site.
 *
 *   pnpm sync:assets    # figures, the .docx reference (styles for the live download), neurotic link fixes → public/
 *   pnpm sync:content   # upsert every report into the EmDash `reports` collection
 *   pnpm sync:vendors   # upsert the field's vendors into the EmDash `vendors` collection
 *   pnpm sync:demos     # live editor demos: bundles → public/demo-apps/, sanitized copies, src/data/demos.json
 *
 * REPORTS_ROOT  editors_trial checkout (default ../../editors_trial); every command stops if it is absent
 * EMDASH_URL    EmDash instance (default https://benchmarks.law)
 * DEMO_APPS     folder holding one built demo per editor, <slug>/dist/ (default /tmp/demos)
 * EMDASH_TOKEN  personal access token with content:write
 */
import { cpSync, existsSync, rmSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { benchPage } from "../src/lib/navbar";
import { patchNeuroticHtml } from "../src/lib/neurotic";
import vendorsData from "../src/data/vendors.json" with { type: "json" };
import { type DemoEntry, type DemoManifest, buildDemoEntry } from "../src/lib/demos";
import { REPORT_FILES, buildEntry, extractTitle, splitSections } from "../src/lib/reports";
import { isLocalEmDash, fullCheckout, reportsRoot } from "../src/lib/root";
import { trialRef } from "../src/lib/trialRef";
import { rebuildScoreTable } from "../src/lib/scorecard";
import { applyFacts } from "../src/lib/vendorFacts";

const SITE = resolve(import.meta.dirname, "..");
/** EMDASH_TOKEN and the other variables above can live in .env (git-ignored; see .env.example). The shell wins. */
const ENV_FILE = join(SITE, ".env");
if (existsSync(ENV_FILE)) process.loadEnvFile(ENV_FILE);
const ROOT = reportsRoot(process.env, SITE);
const URL_ = process.env.EMDASH_URL ?? "https://benchmarks.law";
/** Pin every source link to the commit being published (src/data/release.json, read by the pages too). */
function writeTrialRef(): string {
	const git = (...a: string[]) => spawnSync("git", ["-C", ROOT, ...a], { encoding: "utf8" }).stdout ?? "";
	const tag = git("describe", "--tags", "--exact-match", "HEAD");
	const sha = git("rev-parse", "HEAD");
	// The fetched release bundle is not a git checkout: without a ref the report pages would link at
	// .../blob//, so a bundle-rooted run stops here and names the fix.
	if (!tag && !sha)
		throw new Error(`${ROOT} carries no git ref — set REPORTS_ROOT to an editors_trial checkout`);
	writeFileSync(join(SITE, "src/data/release.json"), `${JSON.stringify({ trialRef: trialRef(tag, sha) }, null, "\t")}\n`);
	return trialRef(tag, sha);
}
const BLOB = () => `https://github.com/arthrod/editors_trial/blob/${writeTrialRef()}/`;

/** Writes to a remote EmDash need a token; a local dev instance does not. */
function requireToken() {
	if (!process.env.EMDASH_TOKEN && !isLocalEmDash(URL_)) throw new Error("EMDASH_TOKEN is not set");
}

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

function assets() {
	// Figures, the reference document and the scorecard inputs come from the checkout, not the
	// bundle; refuse before the first rmSync below would empty the published folders.
	fullCheckout(ROOT);
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
	// No .docx is published: each report page builds it live with jubarte-wasm from its Markdown,
	// taking styles and the landscape page from the trial's reference document (benchmarks-law#56).
	cpSync(join(ROOT, "build/reference.docx"), join(SITE, "public/editors-trial/reference.docx"));
	const neurotic = join(SITE, "public/neurotic-docx-bench");
	// The navbar's trial dropdown lists the same reports, with the same titles, as the CMS.
	const rows = REPORT_FILES.filter((r) => existsSync(join(ROOT, r.path))).map((r) => ({
		slug: r.slug,
		data: { position: r.position, code: r.code, title: extractTitle(readFileSync(join(ROOT, r.path), "utf8")) || r.slug },
	}));
	const mainMd = readFileSync(join(ROOT, "Open-Source DOCX Editors Re-verified Against Code and Measured Round-Trip (2026).md"), "utf8");
	const wv = join(ROOT, "out/word_verdicts.json");
	const verdicts: Record<string, string> = existsSync(wv) ? JSON.parse(readFileSync(wv, "utf8")).verdicts : {};
	for (const f of walk(neurotic).filter((p) => p.endsWith(".html"))) {
		const rel = f.slice(neurotic.length + 1);
		let html = patchNeuroticHtml(readFileSync(f, "utf8"));
		if (rel === "editors/index.html") html = rebuildScoreTable(html, mainMd, verdicts);
		writeFileSync(f, benchPage(html, rel, rows));
	}
	console.log(`figures ${n} · reference.docx · neurotic pages patched · navbar on ${rows.length} reports`);
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
	requireToken();
	ensureSchema("vendors", "Vendors", "Vendor", VENDOR_FIELDS);
	const about = splitSections(readFileSync(join(ROOT, "reports/vendors.md"), "utf8"));
	// Measured figures come from the trial's facts; vendors.json is rewritten so the repo never holds a stale one.
	const facts = JSON.parse(readFileSync(join(ROOT, "out/facts.json"), "utf8"));
	const measured = applyFacts(vendorsData, facts);
	writeFileSync(join(SITE, "src/data/vendors.json"), `${JSON.stringify(measured, null, "\t")}\n`);
	const bySlug = existing("vendors");
	for (const v of measured) {
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
	requireToken();
	const blobBase = BLOB();
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
		const entry = buildEntry(file, md, { blobBase, updated, docx: null });
		upsert("reports", entry.slug, { ...entry.data }, bySlug);
	}
}

/**
 * Publishes every editor whose demo is built: DEMO_APPS/<slug>/dist/ (with its SOURCE.txt) is copied to
 * public/demo-apps/<slug>/, the sanitized copy from editors_trial (out/demo/<slug>.docx, made by
 * build/make_demo_docs.py) is placed beside it and under /editors-trial/demo-files/, and src/data/demos.json
 * lists what was published. An editor without a built bundle is left out, never half-published.
 */
function demos() {
	// make_demo_docs.py and the demo manifests live in the checkout, not the bundle.
	fullCheckout(ROOT);
	const apps = resolve(process.env.DEMO_APPS ?? "/tmp/demos");
	const made = spawnSync("python3", ["-I", join(ROOT, "build/make_demo_docs.py"), join(ROOT, "out/demo")], { stdio: "inherit" });
	if (made.status !== 0) throw new Error("build/make_demo_docs.py failed");
	const out: Record<string, DemoEntry> = {};
	const files = join(SITE, "public/editors-trial/demo-files");
	mkdirSync(files, { recursive: true });
	for (const v of vendorsData as { slug: string; name: string; license: string }[]) {
		const dist = join(apps, v.slug, "dist");
		const manifestPath = join(ROOT, "out/demo", `${v.slug}.json`);
		if (!existsSync(join(dist, "index.html")) || !existsSync(join(dist, "SOURCE.txt")) || !existsSync(manifestPath)) continue;
		const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as DemoManifest;
		const entry = buildDemoEntry(v.slug, manifest, readFileSync(join(dist, "SOURCE.txt"), "utf8"), v);
		const target = join(SITE, "public/demo-apps", v.slug);
		rmSync(target, { recursive: true, force: true });
		cpSync(dist, target, { recursive: true, dereference: true });
		const docx = join(ROOT, "out/demo", `${v.slug}.docx`);
		cpSync(docx, join(target, "document.docx"));
		cpSync(docx, join(files, `${v.slug}.docx`));
		out[v.slug] = entry;
	}
	writeFileSync(join(SITE, "src/data/demos.json"), `${JSON.stringify(out, null, "\t")}\n`);
	console.log(`demos ${Object.keys(out).length}: ${Object.keys(out).join(", ") || "none"}`);
}

const cmd = process.argv[2];
if (cmd === "assets") assets();
else if (cmd === "content") await content();
else if (cmd === "vendors") vendors();
else if (cmd === "demos") demos();
else {
	console.error("usage: sync.ts assets|content|vendors|demos");
	process.exit(2);
}

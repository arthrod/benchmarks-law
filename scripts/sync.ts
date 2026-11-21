/**
 * Publishes the editors_trial reports into this site (the bench pages under /neurotic-docx-bench/
 * are generated from the pinned releases by pnpm bench:pages, not by this script).
 *
 *   pnpm sync:assets    # figures and the .docx reference (styles for the live download) → public/
 *   pnpm sync:content   # upsert every report into the EmDash `reports` collection
 *   pnpm sync:vendors   # upsert the field's vendors into the EmDash `vendors` collection
 *   pnpm sync:demos     # live editor demos from the bundle's out/demos and out/demo-files → public/
 *   pnpm sync:browser   # the browser pass of editors.benchmarks.law → src/data/browser-pass.json (field-page scores)
 *
 * REPORTS_ROOT  editors_trial checkout, or the fetched bundle (default .bench/editors_trial).
 *               sync:assets still needs a real checkout (build/reference.docx). sync:demos does not.
 * OPEN_DOCS_ROOT a checkout of arthrod/open-docs, committed and clean (sync:browser reads docs/samples/latest.json)
 * EMDASH_URL    EmDash instance (default https://benchmarks.law)
 * EMDASH_TOKEN  personal access token with content:write
 */
import { cpSync, existsSync, rmSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import vendorsData from "../src/data/vendors.json" with { type: "json" };
import demosData from "../src/data/demos.json" with { type: "json" };
import { materializeDemos } from "../src/lib/demos";
import { REPORT_FILES, buildEntry, splitSections } from "../src/lib/reports";
import { checkoutRef, isLocalEmDash, fullCheckout, reportsRoot } from "../src/lib/root";
import { applyFacts, missingSections } from "../src/lib/vendorFacts";

const SITE = resolve(import.meta.dirname, "..");
/** EMDASH_TOKEN and the other variables above can live in .env (git-ignored; see .env.example). The shell wins. */
const ENV_FILE = join(SITE, ".env");
if (existsSync(ENV_FILE)) process.loadEnvFile(ENV_FILE);
const ROOT = reportsRoot(process.env, SITE);
const URL_ = process.env.EMDASH_URL ?? "https://benchmarks.law";
/** Pin every source link to the commit being published (src/data/release.json, read by the pages too). */
function writeTrialRef(): string {
	// checkoutRef refuses a ROOT that is not its own repository (the fetched bundle is not a git
	// checkout, and git -C would report this site's HEAD), so the report pages never link .../blob//
	// or to a commit editors_trial does not have.
	const ref = checkoutRef(ROOT);
	writeFileSync(join(SITE, "src/data/release.json"), `${JSON.stringify({ trialRef: ref }, null, "\t")}\n`);
	return ref;
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
	console.log(`figures ${n} · reference.docx`);
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
	const absent = missingSections(vendorsData, about);
	if (absent.length) throw new Error(`reports/vendors.md in ${ROOT} has no section for: ${absent.join(", ")}. The cards' "About" links and the lane redirects point at those sections: publish a trial release that has them first.`);
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
 * Copies the release bundle's live demos into public/. The catalog stays src/data/demos.json:
 * a slug listed there and missing from out/demos or out/demo-files aborts before any app is replaced.
 */
function demos() {
	const slugs = Object.keys(demosData as Record<string, unknown>);
	materializeDemos({
		demosDir: join(ROOT, "out/demos"),
		filesDir: join(ROOT, "out/demo-files"),
		publicApps: join(SITE, "public/demo-apps"),
		publicFiles: join(SITE, "public/editors-trial/demo-files"),
		slugs,
	});
	console.log(`demos ${slugs.length}: ${slugs.join(", ") || "none"}`);
}

/**
 * The figures the field page scores speed, data and memory from: one pass of editors.benchmarks.law,
 * copied with the commit it was read at so the page can be traced to the runs. Only the fields the
 * scores use are kept (src/lib/browserGrades.ts).
 */
const LOAD = "; machine load (1-minute average) ";
const machineOf = (env: string) => (env ?? "").split(LOAD)[0];
/** "<browser and method>; <the machine>": the machine. */
const placeOf = (env: string) => machineOf(env).split("; ").slice(1).join("; ") || machineOf(env);

function browser() {
	const root = process.env.OPEN_DOCS_ROOT;
	if (!root) throw new Error("OPEN_DOCS_ROOT is not set (a checkout of arthrod/open-docs)");
	const git = (...args: string[]) => {
		const r = spawnSync("git", ["-C", root, ...args], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
		if (r.status !== 0) throw new Error(`git ${args.join(" ")} failed in ${root}: ${r.stderr}`);
		return r.stdout.trim();
	};
	const rel = "docs/samples/latest.json";
	if (git("status", "--porcelain", "--", rel)) throw new Error(`${rel} has uncommitted changes in ${root}: commit it first, so the page names a commit that holds these figures`);
	// Read from the commit that is named on the page, not from the working tree: an edit made
	// after the check above cannot put figures on the page that the commit does not hold.
	const commit = git("rev-parse", "HEAD");
	const latest = JSON.parse(git("show", `${commit}:${rel}`));
	const keep = ["loadMs", "settledMs", "settleTimedOut", "rendererRss", "bytes"];
	const samples = Object.fromEntries(
		Object.entries(latest.samples as Record<string, Record<string, Record<string, unknown>>>).map(([sample, rows]) => [
			sample,
			Object.fromEntries(
				Object.entries(rows).map(([engine, row]) => [
					engine,
					{
						...Object.fromEntries(keep.map((k) => [k, row[k] ?? null])),
						// A row measured on another machine than its table (the text before the load of the step): its
						// seconds and megabytes are not comparable with the others', so it is not scored on them.
						...(typeof row.environment === "string" && machineOf(row.environment) !== machineOf(latest.environment) ? { elsewhere: placeOf(row.environment) } : {}),
					},
				]),
			),
		]),
	);
	const out = {
		source: `https://github.com/arthrod/open-docs/blob/${commit}/${rel}`,
		commit,
		measuredAt: latest.measuredAt,
		environment: latest.environment,
		samples,
	};
	writeFileSync(join(SITE, "src/data/browser-pass.json"), `${JSON.stringify(out, null, "\t")}\n`);
	console.log(`browser pass ${out.measuredAt} at ${out.commit.slice(0, 9)}: ${Object.keys(samples).join(", ")}`);
}

const cmd = process.argv[2];
if (cmd === "assets") assets();
else if (cmd === "content") await content();
else if (cmd === "vendors") vendors();
else if (cmd === "demos") demos();
else if (cmd === "browser") browser();
else {
	console.error("usage: sync.ts assets|content|vendors|demos|browser");
	process.exit(2);
}

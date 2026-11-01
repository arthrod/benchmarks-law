import release from "../data/release.json" with { type: "json" };
import { slugForPath } from "./reports";

const DEAD = /(href=["'])https:\/\/github\.com\/jandira-tech\/editors_trial(?:\/(?:blob|tree)\/main\/([^"'\s<>#]*))?(#[^"'\s<>]*)?/g;
const REPO = "https://github.com/arthrod/editors_trial";
const BRANCH = release.trialRef;

function decode(p: string): string {
	try {
		return decodeURIComponent(p);
	} catch {
		return p;
	}
}

/**
 * The neurotic_docx_bench drop-in links its editors-trial page to a repository that does not
 * resolve (jandira-tech/editors_trial). Point those links at the reports published on this site,
 * add a way back to the hub, and name the site icon (without one the browser asks for a
 * /favicon.ico that does not exist). Idempotent.
 */
export function patchNeuroticHtml(html: string): string {
	let out = html.replace(DEAD, (_all, attr: string, rawPath: string | undefined, hash = "") => attr + target(rawPath, hash));
	if (!out.includes('class="home-link"')) {
		out = out.replace(
			/(<nav aria-label="Site">)/,
			'$1<a class="home-link" href="/">benchmarks.law</a>',
		);
	}
	if (!/rel=["']icon["']/.test(out)) {
		out = out.replace(/(\n?<\/head>)/, '\n<link rel="icon" type="image/svg+xml" href="/b-law.svg">$1');
	}
	return out;
}

function target(rawPath: string | undefined, hash: string): string {
	{
		if (!rawPath) return REPO + hash;
		const path = decode(rawPath).replace(/\/$/, "");
		if (path.endsWith(".md")) {
			const slug = slugForPath(path);
			if (slug) return `/editors-trial/${slug}${hash}`;
		}
		// A report's .docx is built live on its page (jubarte-wasm); no file is published.
		if (path.endsWith(".docx")) {
			const slug = slugForPath(path.replace(/\.docx$/, ".md"));
			if (slug) return `/editors-trial/${slug}${hash}`;
		}
		if (path === "reports/extras") return "/editors-trial/#lanes";
		return `${REPO}/blob/${BRANCH}/${rawPath}${hash}`;
	}
}

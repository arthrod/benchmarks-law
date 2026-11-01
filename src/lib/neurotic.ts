import { slugForPath } from "./reports";

const DEAD = /(href=["'])https:\/\/github\.com\/jandira-tech\/editors_trial(?:\/(?:blob|tree)\/main\/([^"'\s<>#]*))?(#[^"'\s<>]*)?/g;
const REPO = "https://github.com/arthrod/editors_trial";
const BRANCH = "benchmark-fairness-reports";

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
 * and add a way back to the hub. Idempotent.
 */
export function patchNeuroticHtml(html: string, docx: Set<string>): string {
	let out = html.replace(DEAD, (_all, attr: string, rawPath: string | undefined, hash = "") => attr + target(rawPath, hash, docx));
	if (!out.includes('class="home-link"')) {
		out = out.replace(
			/(<nav aria-label="Site">)/,
			'$1<a class="home-link" href="/">benchmarks.law</a>',
		);
	}
	return out;
}

function target(rawPath: string | undefined, hash: string, docx: Set<string>): string {
	{
		if (!rawPath) return REPO + hash;
		const path = decode(rawPath).replace(/\/$/, "");
		if (path.endsWith(".md")) {
			const slug = slugForPath(path);
			if (slug) return `/editors-trial/${slug}${hash}`;
		}
		if (path.endsWith(".docx") && docx.has(path)) {
			const name = path.slice(path.lastIndexOf("/") + 1);
			return `/editors-trial/files/${encodeURIComponent(name).replace(/%28/g, "(").replace(/%29/g, ")")}${hash}`;
		}
		if (path === "reports/extras") return "/editors-trial/#lanes";
		return `${REPO}/blob/${BRANCH}/${rawPath}${hash}`;
	}
}

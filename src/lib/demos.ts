/** A live, client-side demo of one editor, as listed in src/data/demos.json (written by `pnpm sync:demos`). */
export interface DemoEntry {
	slug: string;
	name: string;
	license: string;
	repo: string;
	commit: string;
	/** The static bundle, served from public/demo-apps/<slug>/ and iframed by /editors-trial/demo/<slug>. */
	app: string;
	/** The sanitized copy of the fixture the demo opens. */
	docx: string;
	removed: { what: string; why: string }[];
}

export interface DemoManifest {
	editor: string;
	source: string;
	source_sha256: string;
	sha256: string;
	removed: { step: string; what: string; why: string }[];
}

/** Each bundle ships a SOURCE.txt naming its repository and the commit the trial measured. */
export function parseSourceTxt(txt: string): { repo: string; commit: string } {
	const repo = txt.match(/https?:\/\/\S+/)?.[0];
	const commit = txt.match(/\bcommit\b[^0-9a-f]*([0-9a-f]{7,40})\b/i)?.[1];
	if (!repo || !commit) throw new Error("SOURCE.txt must name the repository URL and the commit");
	return { repo: repo.replace(/[.,;)]+$/, ""), commit };
}

/** A link to the measured commit's tree: GitHub uses /tree/, Forgejo and Gitea (Fidus Writer's host) /src/commit/. */
export function commitUrl(repo: string, commit: string): string {
	const base = repo.replace(/\/$/, "");
	return new URL(base).hostname === "github.com" ? `${base}/tree/${commit}` : `${base}/src/commit/${commit}`;
}

export function buildDemoEntry(slug: string, manifest: DemoManifest, sourceTxt: string, vendor: { name: string; license: string }): DemoEntry {
	if (manifest.editor !== slug) throw new Error(`manifest is for ${manifest.editor}, not ${slug}`);
	return {
		slug,
		name: vendor.name,
		license: vendor.license,
		...parseSourceTxt(sourceTxt),
		app: `/demo-apps/${slug}/`,
		docx: `/editors-trial/demo-files/${slug}.docx`,
		removed: manifest.removed.map(({ what, why }) => ({ what, why })),
	};
}

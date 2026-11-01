/** The editors_trial ref the site links to: the checkout's exact tag when it sits on one, else its commit. */
export function trialRef(tag: string, sha: string): string {
	return tag.trim() || sha.trim();
}

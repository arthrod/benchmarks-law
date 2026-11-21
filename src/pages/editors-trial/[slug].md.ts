import type { APIRoute } from "astro";
import { getEmDashEntry } from "emdash";
import type { ReportData } from "../../lib/cms";
import { RENAMED_SLUGS } from "../../lib/reports";

/**
 * A report's Markdown (links rewritten for this site), for the live .docx
 * download: src/scripts/docx-download.ts converts it with jubarte-wasm.
 */
export const GET: APIRoute = async (context) => {
	// A report that moved has no Markdown of its own any more (the CMS may still hold its old entry: the sync never deletes).
	if (Object.hasOwn(RENAMED_SLUGS, context.params.slug!)) return new Response("Not found", { status: 404 });
	const { entry, cacheHint } = await getEmDashEntry("reports", context.params.slug!);
	if (!entry) return new Response("Not found", { status: 404 });
	context.cache.set(cacheHint);
	const d = entry.data as unknown as ReportData;
	return new Response(d.body ?? "", { headers: { "content-type": "text/markdown; charset=utf-8" } });
};

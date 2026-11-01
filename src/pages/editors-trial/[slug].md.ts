import type { APIRoute } from "astro";
import { getEmDashEntry } from "emdash";
import type { ReportData } from "../../lib/cms";

/**
 * A report's Markdown (links rewritten for this site), for the live .docx
 * download: src/scripts/docx-download.ts converts it with jubarte-wasm.
 */
export const GET: APIRoute = async (context) => {
	const { entry, cacheHint } = await getEmDashEntry("reports", context.params.slug!);
	if (!entry) return new Response("Not found", { status: 404 });
	context.cache.set(cacheHint);
	const d = entry.data as unknown as ReportData;
	return new Response(d.body ?? "", { headers: { "content-type": "text/markdown; charset=utf-8" } });
};

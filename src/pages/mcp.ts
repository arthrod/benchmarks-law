import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { getEmDashCollection } from "emdash";
import { listReports } from "../lib/cms";
import { STUDIES, studyBody } from "../lib/legalAi";
import { handleMcp, type McpData, type RateLimit } from "../lib/mcp";
import { RENAMED_SLUGS } from "../lib/reports";
import { safeSiteUrl, type VendorData } from "../lib/vendors";

// The rate limiter has to see every call. Do not cache this route.
export const prerender = false;

async function loadData(): Promise<McpData> {
	const { rows } = await listReports();
	const { entries } = await getEmDashCollection("vendors", { limit: 100 });
	return {
		renames: RENAMED_SLUGS,
		reports: rows.map((row) => ({
			body: row.data.body ?? "",
			code: row.data.code ?? "",
			dek: row.data.dek ?? "",
			position: row.data.position ?? 0,
			series: row.data.series ?? "",
			slug: row.slug,
			title: row.data.title ?? "",
		})),
		studies: STUDIES.map((study) => ({
			authors: study.authors,
			body: studyBody(study.body),
			code: study.code,
			date: study.date,
			dek: study.dek,
			grading: study.grading,
			license: study.license,
			slug: study.slug,
			source: study.source,
			title: study.title,
		})),
		vendors: entries.map((entry) => {
			const data = entry.data as unknown as VendorData;
			return {
				critical: data.critical ?? "",
				detail: data.detail ?? "",
				kind: data.kind ?? "",
				leads: data.leads ?? "",
				license: data.license ?? "",
				maker: data.maker ?? "",
				name: data.title || entry.id,
				position: data.position ?? 0,
				roundtrip: data.roundtrip ?? null,
				safety: data.safety ?? null,
				site: safeSiteUrl(data.site),
				slug: entry.id,
			};
		}),
	};
}

function limiterFrom(): RateLimit | undefined {
	// Astro 6 removed the locals runtime env. The binding is absent in local dev.
	return (env as Env & { MCP_RATE_LIMITER?: RateLimit }).MCP_RATE_LIMITER;
}

const respond: APIRoute = ({ request }) => handleMcp(request, limiterFrom(), loadData);

export const GET = respond;
export const POST = respond;
export const OPTIONS = respond;

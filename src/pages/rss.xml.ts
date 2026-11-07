import type { APIRoute } from "astro";
import { listReports } from "../lib/cms";
import { DOCX_BENCH_DESCRIPTION, PUBLICATION_DESCRIPTION, rssXml, SITE_ORIGIN, type FeedItem } from "../lib/discovery";
import { STUDIES } from "../lib/legalAi";

export const prerender = false;

/** Lane notes (position >= 100) are per-tool appendices. The feed carries the reports, the notes, the DOCX bench, and the studies. */
function isoDay(value: string): string | undefined {
	return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined;
}

export const GET: APIRoute = async () => {
	const { reports, notes } = await listReports();
	const items: FeedItem[] = [
		...[...reports, ...notes].map((row) => ({
			title: row.data.title,
			url: `${SITE_ORIGIN}/editors-trial/${row.slug}`,
			description: row.data.dek,
			date: isoDay(row.data.updated),
		})),
		{
			title: "neurotic_docx_bench",
			url: `${SITE_ORIGIN}/neurotic-docx-bench/`,
			description: DOCX_BENCH_DESCRIPTION,
		},
		...STUDIES.map((study) => ({
			title: study.title,
			url: `${SITE_ORIGIN}/legal-ai/${study.slug}`,
			description: `${study.date}. ${study.dek}`,
		})),
	];
	return new Response(rssXml(items, SITE_ORIGIN, PUBLICATION_DESCRIPTION), {
		headers: { "content-type": "application/rss+xml; charset=utf-8" },
	});
};

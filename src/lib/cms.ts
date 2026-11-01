import { getEmDashCollection } from "emdash";

export interface ReportData {
	title: string;
	code: string;
	series: string;
	dek: string;
	body: string;
	position: number;
	notice: string;
	source_path: string;
	docx_path: string;
	updated: string;
}

export interface ReportRow {
	slug: string;
	data: ReportData;
}

export async function listReports() {
	const { entries, cacheHint } = await getEmDashCollection("reports", { limit: 100 });
	const rows: ReportRow[] = entries
		.map((e) => ({ slug: e.id, data: e.data as unknown as ReportData }))
		.sort((a, b) => (a.data.position ?? 0) - (b.data.position ?? 0));
	return {
		rows,
		cacheHint,
		reports: rows.filter((r) => r.data.position < 70),
		notes: rows.filter((r) => r.data.position >= 70 && r.data.position < 100),
		lanes: rows.filter((r) => r.data.position >= 100),
	};
}

export function docxHref(docxPath: string): string | null {
	if (!docxPath) return null;
	const name = docxPath.slice(docxPath.lastIndexOf("/") + 1);
	return `/editors-trial/files/${encodeURIComponent(name)}`;
}

export function sourceHref(path: string): string {
	return `https://github.com/arthrod/editors_trial/blob/benchmark-fairness-reports/${path.split("/").map(encodeURIComponent).join("/")}`;
}

export function shortDate(iso: string): string {
	return iso || "";
}

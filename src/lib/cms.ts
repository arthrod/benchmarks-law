import release from "../data/release.json" with { type: "json" };
import { getEmDashCollection } from "emdash";
import { partitionReports } from "./positions";

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
	const parts = partitionReports(entries.map((e) => ({ slug: e.id, data: e.data as unknown as ReportData })));
	return { ...parts, rows: parts.rows as ReportRow[], cacheHint };
}

export function sourceHref(path: string): string {
	return `https://github.com/arthrod/editors_trial/blob/${release.trialRef}/${path.split("/").map(encodeURIComponent).join("/")}`;
}

export function shortDate(iso: string): string {
	return iso || "";
}

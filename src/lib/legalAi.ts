/**
 * Bench 03 and Bench 04: the two legal-AI studies the maintainer co-authored
 * at legalbenchmarks.ai, published in the report-reader layout
 * (benchmarks-law#60), rewritten in the trial's report style (#62). The text lives in src/data/legal-ai/*.md.
 */
import contractDrafting from "../data/legal-ai/contract-drafting.md?raw";
import infoExtraction from "../data/legal-ai/info-extraction.md?raw";
import { extractTitle } from "./reports";

export interface Study {
	slug: string;
	code: string;
	/** Short line under the tag on the homepage card. */
	kind: string;
	title: string;
	dek: string;
	date: string;
	authors: string[];
	license: string;
	grading: string;
	source: string;
	/** The chart drawn on the homepage card (a key of CHARTS). */
	cardChart: string;
	body: string;
}

function study(s: Omit<Study, "title">): Study {
	return { ...s, title: extractTitle(s.body) };
}

export const STUDIES: Study[] = [
	study({
		slug: "info-extraction",
		code: "Bench 03",
		kind: "Legal AI · info extraction · 2025",
		dek: "On 18 real in-house extraction tasks, the most accurate of six AI assistants was not a legal tool, and the two legal tools gave the most useful answers. Lawyers graded all 108 answers blind; no model graded anything.",
		date: "Early 2025",
		authors: ["Anna Guo", "Arthur Souza Rodrigues"],
		license: "CC BY 4.0",
		grading: "Human-judged · 2–4 lawyers",
		source: "https://www.legalbenchmarks.ai/research/phase-1-research",
		cardChart: "p1-accuracy",
		body: infoExtraction,
	}),
	study({
		slug: "contract-drafting",
		code: "Bench 04",
		kind: "Legal AI · contract drafting · 2025",
		dek: "On 30 real drafting tasks, nine of thirteen AI tools were at least as reliable as experienced in-house lawyers, and legal AI drafted no better than general AI. 450 outputs, 72 survey responses, 12 interviews.",
		date: "September 2025",
		authors: ["Anna Guo", "Arthur Souza Rodrigues", "Mohamed Al Mamari", "Sakshi Udeshi", "Marc Astbury"],
		license: "Free for professional use",
		grading: "Mixed · LLM jury + human review",
		source: "https://www.legalbenchmarks.ai/research/phase-2-research",
		cardChart: "p2-reliability",
		body: contractDrafting,
	}),
];

export function studyBySlug(slug: string): Study | undefined {
	return STUDIES.find((s) => s.slug === slug);
}

/** The study from its first H2 on: the page header shows the title, dek and byline. */
export function studyBody(md: string): string {
	const m = md.match(/^## /m);
	return m ? md.slice(m.index) : md;
}

/**
 * Bench 03 and Bench 04: the two legal-AI studies the maintainer co-authored
 * at legalbenchmarks.ai, published in the report-reader layout
 * (benchmarks-law#60). The text lives in src/data/legal-ai/*.md.
 */
import contractDrafting from "../data/legal-ai/contract-drafting.md?raw";
import infoExtraction from "../data/legal-ai/info-extraction.md?raw";
import { extractTitle } from "./reports";

export interface StudyFigure {
	/** The figure as the study prints it; the body must contain it verbatim. */
	value: string;
	label: string;
}

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
	figures: StudyFigure[];
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
		dek: "Six AI assistants, legal and general-purpose, answer eighteen extraction questions that in-house counsel asked of their own documents. Every output was graded blind by two to four lawyers; no model graded anything.",
		date: "Early 2025",
		authors: ["Anna Guo", "Arthur Souza Rodrigues"],
		license: "CC BY 4.0",
		grading: "Human-judged · 2–4 lawyers",
		source: "https://www.legalbenchmarks.ai/research/phase-1-research",
		figures: [
			{ value: "108", label: "outputs graded by lawyers" },
			{ value: "38.9%", label: "lowest accuracy (Copilot)" },
			{ value: "6", label: "failure modes" },
		],
		body: infoExtraction,
	}),
	study({
		slug: "contract-drafting",
		code: "Bench 04",
		kind: "Legal AI · contract drafting · 2025",
		dek: "Thirteen AI tools and a baseline of in-house lawyers draft the same thirty contract tasks. The drafts are scored for reliability, usefulness and workflow support, over 450 outputs.",
		date: "September 2025",
		authors: ["Anna Guo", "Arthur Souza Rodrigues", "Mohamed Al Mamari", "Sakshi Udeshi", "Marc Astbury"],
		license: "Free for professional use",
		grading: "Mixed · LLM jury + human review",
		source: "https://www.legalbenchmarks.ai/research/phase-2-research",
		figures: [
			{ value: "56.7%", label: "humans reliable" },
			{ value: "73.3%", label: "top AI tool reliable" },
			{ value: "12 min 43 sec", label: "human time per task" },
		],
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

# Putting AI to the Test in Real-World Legal Work

An AI evaluation report for in-house counsel. Six AI tools, eighteen information-extraction tasks submitted by in-house counsel, and every output graded blind by practising lawyers. No language model graded anything.

By [Anna Guo](https://www.linkedin.com/in/anna-guo-255ba7b0/) & [Arthur Souza Rodrigues](https://www.linkedin.com/in/arthrod/) · legalbenchmarks.ai · first report in a series, early 2025

## About this copy

This is Phase 1 of the legalbenchmarks.ai series, co-authored by the maintainer of benchmarks.law. It is published under the Creative Commons Attribution 4.0 International License (CC BY 4.0) and is reproduced here in full, with attribution. The canonical version is at [legalbenchmarks.ai](https://www.legalbenchmarks.ai/research/phase-1-research).

This study is where benchmarks.law began. Every output was reviewed blind by two to four lawyers, and no language model graded anything. The authors recorded that choice in their own limitations: they declined LLM-based review, citing inconsistent judgments, prompt sensitivity and limited legal-domain expertise, and they did not accept results that vendors had collected themselves. benchmarks.law keeps the same approach, graded by humans and reviewed by practitioners, and takes it further.

## Overview

This AI benchmarking project aims to answer the question: **Is AI ready to handle in-house legal work, or is it all marketing hype?** Our goal is to promote a transparent understanding of how these AI tools perform in real-world conditions and to encourage responsible adoption of AI in legal work.

This is the first report in a series examining AI tools across common in-house legal workflows. In this edition, we focus on information extraction tasks — questions lawyers often ask of their own document sets (**Info Extraction Tasks**). We tested 6 AI tools using real-world queries submitted by in-house counsel and compared the outputs of purpose-built legal AI tools with general-purpose AI tools.

| Figure | What it counts |
|---|---|
| **6** | AI tools tested, covering both legal-domain and general-purpose tools |
| **108** | AI outputs reviewed and scored by legal domain experts |
| **6** | Common AI failure modes identified, revealing where AI struggles with legal tasks |

## 1. Introduction

**AI is entering the in-house legal domain quickly, but it's still unclear how well it performs on the work lawyers actually do.** Most resources available to in-house lawyers today on AI performance in the legal domain are polished vendor demos, academic papers, or ideal-condition benchmarks, which don't reflect everyday workflows. And they rarely answer the question: can the tool do the job, and how much human input does it need?

This report is a step in that direction. We focused on putting AI to the test on Information Extraction Tasks first because it underpins much of legal work — from contract review to issue spotting — and is often a starting point for legal AI adoption. We designed the evaluation around two principles:

- **Real-world inputs.** Tasks were submitted by in-house counsel, using documents with redactions and formatting issues.
- **Practical usefulness.** We assessed not just accuracy, but whether the output was usable — clear, scoped appropriately, and supported by features like citations or multi-document processing.

The key findings are as follows:

| Finding | |
|---|---|
| **38.9%** | Copilot scored the lowest in overall accuracy, underscoring the need for caution when relying on AI assistants, even for seemingly simple extraction tasks. |
| **66.7%** | Legal AI tools did not outperform general-purpose chatbots in accuracy. ChatGPT and DeepSeek answered 12 of 18 tasks accurately, matching or exceeding the overall accuracy of legal AI tools. |
| **#1** | Legal AI tools ranked highest on qualitative usefulness. Across helpfulness, adequate length, and feature support, they outperformed all general-purpose tools for daily in-house work. |

## 2. The AI Assistants We Evaluated

We tested 6 different AI tools that fall into three broad categories: legal AI assistants, productivity AI assistants, and general-purpose AI chatbots (together, the **AI Assistants**).

### Legal AI Assistants

**GC AI** — a legal AI assistant designed specifically for in-house counsel, offering a suite of assistants to streamline legal workflows with a multi-model approach. It provides first drafts, counseling documents, and real-time legal guidance with citations and web search. Accessed through a free trial.

**Vecflow's Oliver** — an AI-powered legal assistant tailored for legal work, integrating with knowledge bases and external data sources to enhance research and analysis. Accessed through a free trial.

### Productivity AI Assistants

**Google's NotebookLM** — powered by Gemini, an assistant that lets users upload documents and ask questions about them, acting as a virtual research notebook. Accessed via the free online version.

**Microsoft Copilot** — powered by OpenAI's GPTs, a general-purpose assistant integrated into Microsoft Office. Accessed via the free web version.

### General-Purpose LLM Chatbots

**DeepSeek** — a general-purpose LLM offering a free, private interaction experience. Accessed via the free online DeepSeek-V3 model.

**OpenAI's ChatGPT** — powered by GPT models, with broad capabilities in content generation and question answering. Accessed via a paid subscription for full GPT-4o access.

## 3. Task Dataset

In-house counsel working in the United States, the United Kingdom, Singapore, and China submitted real-world Info Extraction Tasks to this evaluation. Each task contribution consisted of: (1) a user query, in the lawyer's own words; (2) one or more source documents — contracts, privacy policies, terms & conditions, or regulations — from which the answer must be extracted; and (3) attributes for an accurate answer (**Accuracy Attributes**).

We selected a diverse mix of 18 Info Extraction Tasks from these submissions. Key dimensions of variation included:

| Labels | Tags |
|---|---|
| Query Scope | Open-Ended; Narrow / Binary |
| Query Clarity | Clear; Ambiguous |
| Document Quality | High Quality; Low Quality |
| Document Scope | Single Document; Multiple Documents |
| Information Match | Clear Single Match; Multiple Matches; Ambiguous / Partial Match; No Match; Contradictory Matches |
| Extraction Complexity | Non-interpretative (simple data extraction); Interpretative (requiring legal / contextual understanding) |

This variety was intentional. It lets us observe how each AI Assistant handles easy vs. hard questions, clear vs. vague instructions, single vs. multiple documents — similar to how real queries vary in legal practice.

## 4. Methodology

We developed a human evaluation framework to assess each AI Assistant's performance on each task. Two evaluators with in-house legal backgrounds reviewed the outputs. The evaluation ran in two rounds — an Accuracy Assessment and a Qualitative Assessment.

### Accuracy Assessment (Pass / Fail)

For each output, evaluators independently and blindly assessed whether the response met the minimum quality a competent in-house lawyer would expect (**Accuracy Standard**), based on the Accuracy Attributes. The standard has three factors:

- **Factual Correctness:** the response must be accurate and free from material errors.
- **Relevance to the Query:** the response must directly address the query.
- **Completeness:** the response must provide enough information to address the query.

If evaluators disagreed on whether the output met the standard, they discussed their reasoning, and the decision was escalated to another evaluator — also a legal practitioner — for final judgment. In total, each task was reviewed by a minimum of two and up to four lawyers with diverse legal backgrounds, to ensure fairness and reduce individual bias.

### Qualitative Assessment

In addition to the binary pass/fail, each output was reviewed by two evaluators and scored on quality dimensions that matter in practice:

- **Helpfulness** (0–2 points): did the answer help solve the lawyer's problem, beyond copy-pasting text?
- **Adequate Length** (0–2 points): was the answer appropriately detailed — not too terse, not overly verbose?
- **Feature Support** (0–2 points): did the Assistant effectively leverage special features in input handling or output generation to make the response more useful, accurate, or trustworthy?

These three dimensions — Helpfulness, Adequate Length, and Feature Support — together comprise the **Usefulness Factors**. Each Assistant was assessed across all tasks using two metrics: the number of tasks answered accurately (both evaluators marked Pass), used to compute an accuracy rate; and an overall performance score combining accuracy and qualitative metrics, where each passed task earned 6 points and up to 6 additional points came from the Usefulness Factors — a maximum of 12 points per task. This gives accuracy the greatest weight, reflecting feedback from the in-house counsel we spoke to.

## 5. Results

### Accuracy Assessment Ranking

NotebookLM, an Assistant specifically designed for analyzing user-provided documents, came out on top, meeting the Accuracy Standard for 14 of the 18 extractions. Close behind were ChatGPT, DeepSeek, and Oliver, each answering 12 tasks correctly. GC AI was a bit lower with 10 passes, and Copilot lagged with only 7 correct tasks.

### Overall Performance Ranking

**Looking at accuracy alone is not the full story.** A simple pass/fail doesn't capture how the answer was given. Two Assistants might both be correct, but one might phrase its answer far more clearly or provide useful citations, making it more valuable in daily work. Factoring in the Usefulness Factors shifts the ranking significantly. Out of a theoretical maximum of ~432 points, Oliver and GC AI — the two legal AI Assistants — ranked highest overall, despite NotebookLM achieving the most accuracy passes. Their advantage lay in clear, concise answers, pinpoint citations, and robust handling of multi-file queries. ChatGPT and DeepSeek lost points for verbose or generic outputs lacking legal-specific framing. Copilot, though powered by GPT models, underperformed on both accuracy and quality.

### AI Assistant Strengths

Across tasks, all Assistants showed two clear strengths:

- **Enhanced Search Capabilities** — acting like a supercharged Ctrl+F, finding answers quickly when questions are clear and narrow and the answer sits in one document, even matching semantically similar phrases a keyword search would miss.
- **Consistent Formatting** — producing structured first drafts that let lawyers skip drafting and jump straight to review.

For example: in Task 1, asked to extract the contract term clause in an MSA, all six Assistants correctly identified the “Term and Termination” clause. In Task 16, asked to extract governing law for multiple contracts in a table, the Assistants that processed all 11 documents presented structured tables and accurately identified applicable law even where explicit “governing law” language was absent — an interpretive strength that becomes a risk when it overreaches and infers answers not grounded in the text.

## 6. Six Failure Modes

While Assistants can streamline certain workflows, they frequently fail in six scenarios legal teams should anticipate.

### 1. AI struggles with open-ended questions

When prompts are vague, broad, or lack clear boundaries, AI often returns incomplete answers. Example (Task 13): asked to “identify all the commitments the Agent makes regarding regulatory compliance and conduct,” only two of six tools (NotebookLM and ChatGPT) extracted all relevant clauses; the others omitted at least one major section. **Why it matters:** AI may miss key clauses if the task isn't narrowly scoped, leading counsel to overlook important rights or obligations.

### 2. AI hallucinates when the answer is missing

When required information isn't present but the question suggests it should be, some tools fabricate rather than admit uncertainty. Example (Task 9): four tools fabricated or misclassified the definition for “Critical Data,” a term not defined in the source regulation. Example (Task 10): two tools fabricated the liability-cap amount and/or the time-based qualifier, despite the actual figures being redacted. **Why it matters:** confident, fabricated answers can slip past review and lead to incorrect legal advice or risk assessments.

### 3. AI is error-prone across multiple documents

Despite marketing claims, most Assistants cannot consistently analyze or extract across multiple files, even when documents are short and the task is simple. Example (Task 16): none succeeded in accurately extracting the governing laws from 11 contracts; even where documents fit the context window, answers were incomplete or partially inaccurate. **Why it matters:** multi-doc review is standard legal work, and unreliability here limits real-world usefulness.

### 4. AI mirrors user assumptions in leading questions

If a question contains a false premise, Assistants tend to reinforce it rather than verify against the document. Example (Task 6): asked “What are LinkedIn's indemnity obligations?” in a LinkedIn MSA, only GC AI and Oliver correctly answered that LinkedIn had none; others described vendor indemnities as LinkedIn's. Asked a neutral version (“What are the indemnification obligations of the parties?”), all answered correctly. **Why it matters:** leading prompts can steer AI toward convincing but incorrect interpretations.

### 5. AI fails on technical or file-handling issues

Some Assistants fail not from poor reasoning but from technical constraints — file-format issues, OCR failures, upload limits, content filters. Example (Task 16): tools hit upload limits (Copilot one file per query, GPT up to ten) when 11 contracts were required; DeepSeek processed only 84% of the combined input. Example (Task 14): Copilot refused a file entirely, likely from content filters misclassifying it as sensitive. Example (Task 7): faced with low-quality scanned PDFs, some tools confidently returned incorrect answers instead of flagging OCR errors. **Why it matters:** tools may silently skip unreadable content or refuse a file without explanation, leaving lawyers unsure whether content was ever reviewed.

### 6. AI struggles with contradictory information

When conflicting references appear in the source, Assistants may extract one and ignore the other, failing to flag the discrepancy. Example (Task 11): asked for the effective date of a contract that mentioned two different dates in separate sections, some returned only one without acknowledging the other. **Why it matters:** if an Assistant doesn't flag conflicting information, a lawyer might take the answer at face value and miss a critical ambiguity.

## 7. General AI vs. Legal AI

Do “purpose-built” legal AI Assistants outperform general-purpose ones? **Our findings suggest that while general-purpose tools can match legal AI tools in raw accuracy, purpose-built legal AI assistants often deliver more value where it matters most: usability and workflow integration.** General-purpose chatbots like ChatGPT and DeepSeek performed just as well as the legal Assistants on accuracy, and NotebookLM — not legal-specific — achieved the highest accuracy overall. But legal Assistants like GC AI and Oliver stood out with source-linked answers, multi-document support, and structured outputs tailored for review. As accuracy gaps narrow, usability and integration will drive the next wave of adoption — interface, integration with email or document systems, data security, and responsive support.

## 8. Conclusion

In a legal industry where AI is said to be replacing lawyers, where legal-tech companies raise record rounds, and where marketing often outpaces reality, most in-house counsel are simply trying to keep up. That's why we ran this independent evaluation: to offer a grounded, practical view of how legal AI tools actually perform on real in-house tasks, and how much human oversight they still require. **So can AI do the job? In many cases, yes — and sometimes surprisingly well.** But it still needs legal professionals to frame queries clearly, interpret ambiguous answers, and verify outputs. Human judgment remains essential, but AI is increasingly capable of lightening the load.

## Limitations of the Study

**Narrow Task Scope.** We tested only 18 Info Extraction Tasks; broader tasks like research, drafting, or redlining were not assessed.

**English-Only Evaluation.** All tasks used English documents; we did not test multilingual capabilities.

**Snapshot in Time.** Results reflect AI performance as of early 2025; accuracy and features may evolve within months.

**Subjectivity in Human Evaluation.** To ensure objectivity, each output was blind-reviewed by two independent human evaluators using a standardized rubric, with disagreements resolved by a third reviewer. **We did not conduct LLM-based reviews** due to resource constraints and their known limitations — inconsistent judgments, prompt sensitivity, and limited legal domain expertise.

**Broader Factors Not Assessed.** This evaluation did not assess Security & Privacy, Governance & Assurance, Pricing & Value, Support & Reliability, or Trust & Safety — all critical for enterprise adoption and reserved for future reviews.

**No Multi-Turn Dialogue.** Each Assistant had one shot per task; results may improve with iteration. Our findings reflect a “cold start.”

**Limited Legal AI Vendor Coverage.** We focused on two legal AI vendors, GC AI and Vecflow (Oliver), and are grateful to both for supporting an independent review. While many other vendors were keen to provide demos, several declined to participate in a structured evaluation — preferring to self-publish performance results, or offering only results they collected themselves, which we did not accept. We are practicing lawyers and real users. While this assessment doesn't replicate the formality of a “Michelin-style” review or an academic paper, we remain committed to transparency, independence, and practical relevance.

## Next Steps

This benchmarking exercise is a starting point. Going forward, we plan to expand the evaluation to cover other legal functions and new Assistants, and to gather additional tasks — the next category being summarization. We welcome feedback and collaboration with legal practitioners, researchers, and vendors. If a vendor believes their assistant would excel in our tasks, we welcome the opportunity to evaluate it. A more open and transparent benchmarking culture in the legal industry will benefit everyone.

## Contributors & Core Team

This project was made possible by legal professionals and AI engineering experts who generously contributed their time, expertise, and feedback — many on a volunteer basis, shaping methodology, participating in evaluations, and reviewing outputs.

Gabriel Saunders · Marc Astbury · Hui Xin Tan · Mariette Clardy · Mathias Bock · Patrick Gong · Rachel Chew · Rodney Yap · Tan Xuan Ming · Uri Barak · Wei Yee Tan. Advisors: Chris Holland · Jason Tamara Widjaja · Jordan Dea-Mattson.

**Anna Guo, co-author.** Anna is legal counsel at a health-tech startup based in Singapore, with private-practice and in-house experience in both Chinese (Ant Group) and US tech companies (Google), plus a stint as a startup founder. She is interested in how technology is transforming the legal profession.

**Arthur Souza Rodrigues, co-author.** Arthur is a securities and technology attorney based in New York. He's the author of Prompting Techniques for Lawyers and several other AI-related projects, advising legal-tech entrepreneurs. Formerly at Carta, O'Melveny, and USP, he currently serves as sole counsel for an education platform. A proud Wolverine with a passion for Portuguese language and Lusophone culture.

## Notes

1. Co-authored by Anna Guo and Arthur Souza Rodrigues, both practicing lawyers, not affiliated with or paid by any vendor, law firm, or corporate buyer. The project was undertaken independently alongside their work.
2. Luminance, Robin AI, and Wordsmith are legal AI assistants that provided demos but did not participate in this phase. Spellbook currently offers free trials only to active law firms and in-house teams.
3. Copilot's lower accuracy score was partially due to technical constraints that prevented it from handling some documents.

The content of this report is made available under the [Creative Commons Attribution 4.0 International License (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/).

**Cite this report (APA).** Guo, A., & Rodrigues, A. (2025). *Putting AI to the Test in Real-World Legal Work: An AI evaluation report for in-house counsel.* legalbenchmarks.ai. https://www.legalbenchmarks.ai/research/phase-1-research

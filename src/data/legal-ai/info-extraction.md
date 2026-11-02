# Putting AI to the Test in Real-World Legal Work

Six AI assistants, two of them built for lawyers, answered 18 extraction questions that in-house counsel asked of their own documents. Two to four lawyers graded each of the 108 answers, blind. No language model graded anything.

By [Anna Guo](https://www.linkedin.com/in/anna-guo-255ba7b0/) & [Arthur Souza Rodrigues](https://www.linkedin.com/in/arthrod/) · legalbenchmarks.ai · Phase 1, early 2025

## TL;DR

- **The most accurate tool was not a legal tool.** NotebookLM met the accuracy standard on **14 of 18 tasks (77.8%)**. Oliver, ChatGPT and DeepSeek passed 12 (66.7%), GC AI 10 (55.6%), and Copilot 7 (38.9%). [DATA]
- **The two legal tools were the most useful, not the most accurate.** Usefulness counts helpfulness, length and feature support. On it GC AI scored **193 of 216** points and Oliver 171. The best of the rest, NotebookLM, scored 145. With accuracy added, Oliver leads at **315 of 432**, and GC AI and NotebookLM tie at 313. [DATA]
- **By kind of tool, accuracy does not follow the label.** The two legal tools passed 22 of 36 tasks (61.1%). The two general chatbots passed 24 of 36 (66.7%). The two productivity assistants passed 21 of 36 (58.3%). [DERIVED]
- **Every tool failed where a careful lawyer would not.** The study names six failure modes, each from a real task:
  - Asked to define a term the regulation never defines, four of six tools made one up or misclassified it (Task 9).
  - Asked about indemnities "LinkedIn" owes under a contract where LinkedIn owes none, four of six described the supplier's indemnities as LinkedIn's (Task 6).
  - Asked for the governing law of 11 contracts, no tool got all 11 (Task 16).
- **Some failures are invented facts.** On a liability clause whose cap is redacted, Copilot answered "$1,000,000" and "12 months" (Task 10). Neither figure is in the contract. [DATA]
- **Copilot's low score is partly not reasoning.** It took one file per query, and it refused two files outright, one of them as too large. [STUDY]

## Results

### Accuracy

A pass means the answer met the minimum a competent in-house lawyer would accept. It had to be factually correct, answer the question asked, and be complete enough to act on. Both evaluators had to mark it a pass.

![Accuracy by tool](chart:p1-accuracy)

### Accuracy plus usefulness

A pass earned 6 points and usefulness up to 6 more, so a task was worth at most 12. The totals in the study's own dataset are consistent with the two evaluators' points being added together. That gives 24 points a task and 432 over 18 tasks; NotebookLM's 14 passes are 168 points. [DERIVED]

![Overall points by tool](chart:p1-overall)

Accuracy is half the scale on purpose. The in-house counsel the authors consulted said a wrong answer costs more than a clumsy one. [STUDY]

### Usefulness alone

![Usefulness points by tool](chart:p1-usefulness)

GC AI passed 10 tasks, fewer than any tool but Copilot, and had the highest usefulness score of all six. The study credits its answers with the most appropriate length and the most helpful content. Oliver and GC AI gave pinpoint citations and handled several files in one query. NotebookLM also cited its sources, but some of its answers were long or loosely structured. ChatGPT and DeepSeek lost points for long, generic answers without a legal frame. [STUDY]

### By kind of tool

| Kind | Tools | Passes | Accuracy | Usefulness, mean of 216 |
|---|---|---|---|---|
| Legal AI assistants | GC AI, Oliver | 22 / 36 | 61.1% | 182 |
| Productivity assistants | NotebookLM, Copilot | 21 / 36 | 58.3% | 114 |
| General chatbots | ChatGPT, DeepSeek | 24 / 36 | 66.7% | 104 |

Computed here from the per-tool rows above. [DERIVED]

## Six failure modes

These are the study's own six. The per-tool answers for Tasks 6, 7 and 10 are in the source page's dataset; they are reproduced in short below.

### 1. Open-ended questions get partial answers

Task 13 asked for "all the commitments the Agent makes regarding regulatory compliance and conduct". Two of six tools, NotebookLM and ChatGPT, found every relevant clause. The other four each left out at least one major section. **What it means:** a broad question gets an answer that looks complete and is not. Scope the question. [STUDY]

### 2. A missing answer gets invented

Task 9 asked for the definition of "Critical Data". The regulation does not define it. Four tools gave a definition anyway, or put the term in the wrong category. [STUDY]

Task 10 asked for the liability cap and any time-based rule in a clause whose amounts are redacted. [DATA]

| Tool | Answer, in short | Result |
|---|---|---|
| ChatGPT | the cap is redacted; a claim in an initial period is capped at that period's projected payments | pass |
| DeepSeek | the same, marking each redaction | pass |
| NotebookLM | the same | pass |
| Oliver | the same | pass |
| GC AI | the redacted period is "the first year" | fail |
| Copilot | the cap is the charges of the 12 months before the incident, or "$1,000,000" | fail |

**What it means:** the wrong answers are confident and specific, which is what makes them pass a quick review.

### 3. Several documents at once go wrong

Task 16 asked for the governing law of 11 contracts in one table. No tool got all 11 right, including tools whose context window held every document. [STUDY]

### 4. A false premise is repeated, not checked

Task 6 asked for "the clauses that detail LinkedIn's indemnity obligations" in LinkedIn's master services agreement. LinkedIn has none: section 7 has only the supplier indemnifying LinkedIn. [DATA]

| Tool | Answer, in short | Result |
|---|---|---|
| GC AI | LinkedIn has no indemnity obligations; section 7 binds the supplier | pass |
| Oliver | the same | pass |
| ChatGPT | they are in the Indemnity section | fail |
| DeepSeek | they are in Section 7 | fail |
| Copilot | listed "key points" of LinkedIn's obligations | fail |
| NotebookLM | they are in the section on dispute resolution and force majeure | fail |

Asked the neutral question, "What are the indemnification obligations of the parties?", all six answered correctly. **What it means:** the way the question is worded decides the answer. [STUDY]

### 5. A file that was not read is not reported

Task 7 asked for the total value of a contract. Its pages are a poor scan. [DATA]

| Tool | Answer, in short | Result |
|---|---|---|
| ChatGPT | $1,860,561, Article B.2 | pass |
| NotebookLM | $1,860,561 | pass |
| GC AI | "$1,300.00", Article B.2 | fail |
| DeepSeek | the document does not state it | fail |
| Oliver | the excerpt does not include it | fail |
| Copilot | "This file is too large" | fail |

On Task 16 Copilot took one file per query and ChatGPT ten, and DeepSeek read 84% of the input. On Task 14 Copilot refused the file entirely, probably because a content filter took it for sensitive material. **What it means:** a tool can skip what it cannot read and still answer. The lawyer cannot tell whether the document was reviewed. [STUDY]

### 6. Two answers in the source, one in the reply

Task 11 asked for the effective date of a contract that names two dates in different sections, and defines neither as the effective date. Some tools returned one date and did not mention the other. **What it means:** the ambiguity a lawyer most needs to see is the one the tool removes. [STUDY]

### Where every tool did well

Narrow questions with the answer in one document went well. Task 1 asked for the term clause of a master services agreement, and all six found "Term and Termination". On Task 16, the tools that read all 11 contracts set the results out in a table and inferred the governing law where the contract has no clause that says so. That inference is a strength when it is right, and failure mode 2 when it is not. [STUDY]

## Method and its limits

### What was done

1. **In-house counsel in the United States, the United Kingdom, Singapore and China submitted real tasks.** Each task had a question in the lawyer's own words, one or more source documents (contracts, privacy policies, terms, regulations), and the elements a correct answer must contain.
2. **18 tasks were chosen to vary on purpose.** They differ in scope (open or narrow), clarity, document quality, and one or many documents. They also differ in whether the answer is there once, several times, partly, not at all, or twice with a contradiction. And some answers need interpretation.
3. **Each of six tools answered each task once**, with no follow-up prompt: 108 answers. Each tool was used as a lawyer would get it in early 2025:
   - GC AI and Oliver on free trials,
   - NotebookLM, Copilot and DeepSeek-V3 in their free web versions,
   - ChatGPT on a paid GPT-4o subscription.
4. **Two lawyers graded each answer blind and independently**, pass or fail against the accuracy standard. When they disagreed, they discussed it, and a third lawyer decided. Each task was seen by two to four lawyers.
5. **Two lawyers scored usefulness** on three axes of 0–2 points each: helpfulness, adequate length, and feature support (citations, multi-file input).
6. **No language model graded anything.** The authors gave the reasons themselves: inconsistent judgments, sensitivity to the prompt, and limited legal expertise.

### What it does not show

- **18 tasks, of one kind.** Extraction only, not research, drafting or redlining.
- **English documents only.**
- **One attempt per task.** A lawyer who rephrases may do better; this is a cold start.
- **Early 2025.** Every tool tested has been updated since.
- **Two legal vendors.** Several others gave demos but declined a structured evaluation, or offered only results they had collected themselves. The authors did not accept those. Luminance, Robin AI and Wordsmith gave demos and did not take part.
- **Not assessed:** security and privacy, governance, price, support, trust and safety.

### Evidence tags

`[STUDY]` stated in the study's text · `[DATA]` the dataset behind the source page's charts and answer panels, read from the page on 2026-11-01 · `[DERIVED]` computed here from `[DATA]`.

## What this means for in-house counsel

- **Pick the tool by the work, not the label.** A tool that answers from your own documents was the most accurate here. A legal tool gave the most usable answer.
- **Narrow the question.** Name the clause, the party and the document. Open questions and leading questions are where most tools failed: four of six on each.
- **Ask about absence directly.** "Does this contract define X?" is safer than "What is the definition of X?"
- **Check what was read.** When a tool says the document "does not state" something, check that it opened the document at all.
- **Verify every figure.** In this study, the wrong numbers were the confident ones.

## About this copy

This is an adapted version of Phase 1 of the legalbenchmarks.ai series, co-authored by the maintainer of benchmarks.law. It is published under the [Creative Commons Attribution 4.0 International License (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/). The [canonical report](https://www.legalbenchmarks.ai/research/phase-1-research) is on legalbenchmarks.ai.

**What changed.**
- The text is rewritten and reordered in the form of the other benchmarks.law reports.
- The charts, the per-tool totals and the per-task answers come from the data on the source page. The page draws them in the browser, and an earlier copy here left them out.
- Figures marked `[DERIVED]` are computed here.
- The study's findings and grades are unchanged.

This study is where benchmarks.law began. benchmarks.law keeps its rule that people, not models, grade, and goes further: tools are tested without vendor consent, and a result stays published once it is run.

**Team.** The reviewers were Gabriel Saunders, Marc Astbury, Hui Xin Tan, Mariette Clardy, Mathias Bock, Patrick Gong, Rachel Chew, Rodney Yap, Tan Xuan Ming, Uri Barak and Wei Yee Tan. They reviewed outputs and shaped the method, many as volunteers. The advisors were Chris Holland, Jason Tamara Widjaja and Jordan Dea-Mattson. The authors are practising lawyers, and no vendor, firm or buyer paid them. GC AI and Vecflow supported an independent review.

**Cite the original (APA).** Guo, A., & Rodrigues, A. (2025). *Putting AI to the Test in Real-World Legal Work: An AI evaluation report for in-house counsel.* legalbenchmarks.ai. https://www.legalbenchmarks.ai/research/phase-1-research

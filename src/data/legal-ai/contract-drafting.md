# Benchmarking Humans & AI in Contract Drafting

Thirteen published AI tools and a group of in-house lawyers drafted the same 30 real contract tasks. Every draft was scored for reliability and usefulness, and every named platform for workflow support. 450 outputs, 72 survey responses and 12 interviews.

By [Anna Guo](https://www.linkedin.com/in/anna-guo-255ba7b0/), [Arthur Souza Rodrigues](https://www.linkedin.com/in/arthrod/), [Mohamed Al Mamari](https://www.linkedin.com/in/mhmalmamari/), [Sakshi Udeshi](https://www.linkedin.com/in/sakshiudeshi/) & [Marc Astbury](https://www.linkedin.com/in/marc-astbury/) · legalbenchmarks.ai · Phase 2, September 2025

## TL;DR

- **Most AI tools drafted as reliably as the lawyers.** The in-house lawyers produced a reliable first draft on **17 of 30 tasks (56.7%)**. Nine of the thirteen AI tools matched or beat that. **Gemini 2.5 Pro led with 22 of 30 (73.3%)**, and InstaSpace was last with 10 (33.3%). [DATA]
- **The best tool beat the best lawyer, narrowly.** The best single lawyer was reliable 70% of the time, and Gemini 2.5 Pro 73.3%. Lawyers working with AI reached 61.5%, which is still below six of the AI tools alone. [STUDY]
- **The lawyers' drafts were more useful than the average AI draft, and less useful than the best.** The lawyers averaged 7.53 of 9 on usefulness and the AI tools 7.28. August (8.13), GC AI (8.03), Gemini 2.5 Pro (7.90), SimpleDocs and GPT-4.1 scored higher than the lawyers. [DATA] [DERIVED]
- **Legal AI tools and general AI tools drafted about equally well.** From the published rows, legal tools average 57.2% reliable and general tools 57.1%. On usefulness, legal tools average 7.35 and general tools 7.22. The study's printed averages differ slightly; see "Where the source disagrees with itself". [DERIVED]
- **Where legal tools did differ was risk and workflow.** In high-risk tasks, legal AI warned of the risk in 83% of its outputs, general AI in 55%, and the lawyers in none. The three platforms with the best workflow support, Brackets (8 of 10), GC AI and SimpleDocs (7), all work inside Microsoft Word. [STUDY] [DATA]
- **Lawyers already use AI, and more than one tool.** Of the 72 lawyers surveyed, 97% use AI tools for legal work, 83% use two or more, and 35% use a legal AI tool. The improvement that would most increase their use is easier verification (35%), not accuracy (21%). [DATA]
- **An LLM jury graded reliability.** Human reviewers decided the borderline and inconsistent cases, and scored usefulness and workflow. Phase 1 used no model at all. See "Method and its limits". [STUDY]

## Results

### Output reliability

A draft passed when it contained every element the contributing lawyer listed as essential, followed the instruction, stated the law correctly, and introduced no factual error.

![Reliability by tool](chart:p2-reliability)

The lawyers sit in the middle of the field, tied with GPT-4.1 and Anon. The six tools above 63% include two general models (Gemini 2.5 Pro and GPT-5) and four legal platforms (GC AI, Brackets, August and SimpleDocs). [DATA]

**Example: Task 22, jury trial waiver under New York law.** The instruction asked for a clause that would "renounce" the jury trial. Gemini 2.5 Pro wrote a "waiver", the accepted term, put it in the dispute-resolution section and stayed within scope. Qwen kept the user's "renouncement of a jury trial". [STUDY]

### Output usefulness

Reviewers scored clarity, helpfulness and length from 1 to 3 each, double-blind, so a draft scored 3 to 9.

![Usefulness by tool](chart:p2-usefulness)

**Example: Task 15, a late-payment penalty under New York law.** The instruction asked for a 10% fine if a debt is not paid by the 5th of each month. GC AI drafted a clean clause and flagged that a 10% fee could be challenged as a penalty rather than compensation. Anon drafted an accurate clause and did not raise the issue. Every AI tool kept the 10%; one lawyer wrote 9%. [STUDY]

### Platform workflow support

In-house lawyers used each platform on several tasks and scored two things, from 1 to 5 each. Draft generation covers context, templates and clause libraries. Quality assurance covers checking, redlining and risk review. Anon is not scored: its vendor did not allow its name to be published.

![Workflow support by platform](chart:p2-workflow)

| Platform | What stood out |
|---|---|
| Brackets | reads the document's stage and suggests the next drafting or review step, inside Word |
| GC AI | a Word add-in and a web app that keep the same context across devices; an "Easy Prompt" mode that improves the request |
| SimpleDocs | clause similarity scoring against Law Insider, for market-standard alternatives |
| August | a "Prompt Improver" and optional agentic and deep-research modes |
| Copilot | the organisation's own context across Microsoft apps |
| Gemini | long, multimodal context tied to Google Workspace |

From the source dataset. Most general assistants scored 4 of 10, Qwen 2, because a lawyer has to carry the draft in and out of them by hand. [DATA] [STUDY]

### Humans and AI

| | Lawyers | AI tools, average |
|---|---|---|
| Reliable drafts | 56.7% | 57.2% (study: 57%) |
| Usefulness, of 9 | 7.53 | 7.28 (study: 7.25) |
| Time per task | 12 min 43 sec | under 1 minute |

**What the lawyers did better.** They read intent without conceding what the client did not have to concede, and they used commercial judgment. They also handled mixed inputs. One task gave a template, a term sheet and an email thread with a screenshot of the company's details, and only the lawyer got the parties' details complete and right. On Task 37 (the study numbers tasks from a larger pool), a licence clause from the licensee's side, Mistral conceded "as is" language that favours the licensor. [STUDY]

**What the AI did better.** Speed and consistency on routine drafting, and fewer drafts that were too short. Several lawyers' drafts were "way too brief". [STUDY]

### What lawyers say they want

![How lawyers use AI](chart:p2-survey-use)

![What would increase use](chart:p2-survey-driver)

Only 6% of the lawyers surveyed require 100% accuracy before they use AI, and 55% accept less than 90%. [STUDY]

![How AI should handle an illegal clause](chart:p2-survey-illegal)

Not one lawyer wants an AI tool to draft an unenforceable clause without a warning. Most want the draft with a warning. [DATA]

## Where the source disagrees with itself

The study's text and its own data do not always agree. These are the differences, with the numbers recomputed from the published per-tool rows.

| The study says | Its data says |
|---|---|
| reliability "ranged from 44% to 73.3%" | 33.3% (InstaSpace) to 73.3%; Qwen3-235B is 43.3% |
| the top six average 66.1% | 65.6% |
| the overall average is 57.3% | 57.2% for the 13 AI tools, 57.1% with the lawyers |
| general AI 58.3%, legal AI 57.6% reliable | general 57.1%, legal 57.2% |
| usefulness: general 7.24, legal 7.27, AI 7.25 | general 7.22, legal 7.35, AI 7.28 |

The likely cause is Wordsmith. The study tested it, and at Wordsmith's request did not publish its results. 450 outputs is 15 participants times 30 tasks: thirteen published AI tools, Wordsmith and the lawyers. Averages that count Wordsmith's 30 unpublished drafts cannot be recomputed from the published rows. No conclusion changes: the legal and general averages are within a point of each other either way. [DERIVED]

## Method and its limits

### What was done

1. **30 drafting tasks came from in-house and private-practice lawyers.** They span partnerships, marketing, financing and employment, and three kinds of work:
   - basic clauses in a widely accepted form,
   - adapting a template to given facts,
   - bespoke drafting for a specific deal.

   Each kept its contributor's words, shorthand and misspellings included.
2. **Each contributor wrote an answer key**: the elements an acceptable draft must contain.
3. **Fourteen AI tools drafted every task once**, from a standardised prompt, in July and August 2025. Thirteen are published:
   - Legal platforms: Anon, August, Brackets, GC AI, InstaSpace and SimpleDocs. Wordsmith was also tested, from its homepage assistant, and at its request its results are not published.
   - General models, scored for reliability and usefulness on outputs from each provider's API: GPT-4.1, GPT-5, Claude Opus 4.1, Copilot (free), Gemini 2.5 Pro, Mistral Magistral Medium and Qwen3-235B.
4. **In-house commercial lawyers drafted the same tasks** under the same instructions, averaging ten years' experience.
5. **Round 1, reliability, pass or fail.** An LLM jury checked each draft against its answer key on instruction compliance, legal adequacy and factual accuracy. Borderline cases and inconsistent verdicts went to expert reviewers for the final decision.
6. **Round 2, usefulness.** Expert reviewers scored clarity, helpfulness and length, double-blind.
7. **Round 3, workflow support.** In-house lawyers tested each platform's interface and agreed a joint score.
8. **72 lawyers answered a survey, and 12 in-house legal leaders were interviewed.**

### What it does not show

- **The reliability round was graded by models first.** Phase 1 refused LLM grading, citing inconsistent judgments, prompt sensitivity and limited legal expertise. benchmarks.law does not use it either. The method's own literature documents [position, verbosity and self-enhancement bias](https://arxiv.org/abs/2306.05685) and [self-preference](https://arxiv.org/abs/2410.21819). Bias audits also report that judges [miss logical errors](https://llm-judge-bias.github.io/) in the text they score.
- **One attempt, baseline features.** No re-prompting, and no vendor's full feature set switched on.
- **30 tasks, mostly junior to mid-level.**
- **Bands are a simplification.** The study groups tools into three bands; small gaps between neighbours are not meaningful.
- **July–August 2025.** GPT-5 was released after the legal platforms' outputs were collected.
- **A voluntary survey.** 72 self-selected respondents show a trend, not a statistic.
- **Sponsorship came after the results.** Vendors could add a sponsored link to their name after the results were final and shared. The study says this had no effect on them.

### Evidence tags

`[STUDY]` stated in the study's text · `[DATA]` the dataset behind the source page's charts, read from the page on 2026-11-01 · `[DERIVED]` computed here from `[DATA]`.

## What this means for in-house counsel

- **Use AI for the first draft, and read it as you would a junior's.** On reliability, most tools now match an experienced in-house lawyer. None is reliable on even three tasks in four.
- **Ask for the risk, not only the clause.** The useful drafts were the ones that said why a term might fail. Prompt for that.
- **Buy legal AI for the workflow, not for better drafting.** On these tasks, legal and general tools drafted about equally well. The legal platforms differ in working inside Word, in templates, and in quality-assurance checks.
- **Keep the lawyer on the judgment calls.** Mixed inputs, the client's side of a concession, commercial context: that is where the lawyers beat every tool.

## About this copy

This is an adapted version of Phase 2 of the legalbenchmarks.ai series, co-authored by the maintainer of benchmarks.law. The [canonical report](https://www.legalbenchmarks.ai/research/phase-2-research) is on legalbenchmarks.ai, which makes it free for professional use.

**What changed.**
- The text is rewritten and reordered in the form of the other benchmarks.law reports.
- The charts, the per-tool rows and the survey figures come from the data on the source page. The page draws them in the browser, and an earlier copy here left them out. The page also shows its three survey counters as "0%" until they animate; they are 97%, 83% and 35%.
- Figures marked `[DERIVED]` are computed here, and the differences from the printed figures are listed above.
- The study's grades are unchanged.

**From the authors.**
- **Anna Guo:** benchmarking is how she keeps close to the tools reshaping law, to see both the opportunities and the risks.
- **Arthur Souza Rodrigues:** "We are your future users, regardless of will … Shouldn't we at least kick the tires?"
- **Mohamed Al Mamari:** junior lawyers should spend more time with the business; relying on AI too much dulls critical thinking.
- **Sakshi Udeshi:** evaluations are imperfect but essential, and the advantage is moving from model quality to workflow and domain-aware design.
- **Marc Astbury:** the most effective humans have always been the best tool callers.

**Thanks.** HumanSignal's platform ran the review of the outputs. The advisors were Nada Alnajafi, Nate Kostelnik, Jason Tamara Widjaja and Gabriel Saunders. Contributors around the world supplied tasks, reviews and feedback.

**Cite the original (APA).** Guo, A., Rodrigues, A., Mamari, M., Udeshi, S., & Astbury, M. (2025). *Benchmarking Humans & AI in Contract Drafting.* legalbenchmarks.ai. https://www.legalbenchmarks.ai/research/phase-2-research

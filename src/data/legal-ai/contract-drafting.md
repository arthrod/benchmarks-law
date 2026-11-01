# Benchmarking Humans & AI in Contract Drafting

Preliminary findings. Thirteen AI tools and a baseline of in-house lawyers each drafted the same 30 real-world contract tasks, and every draft was scored on reliability, usefulness and workflow support. 450 outputs, 72 survey responses, 12 interviews.

By [Anna Guo](https://www.linkedin.com/in/anna-guo-255ba7b0/), [Arthur Souza Rodrigues](https://www.linkedin.com/in/arthrod/), [Mohamed Al Mamari](https://www.linkedin.com/in/mhmalmamari/), [Sakshi Udeshi](https://www.linkedin.com/in/sakshiudeshi/) & [Marc Astbury](https://www.linkedin.com/in/marc-astbury/) · legalbenchmarks.ai · September 2025

## About this copy

This is Phase 2 of the legalbenchmarks.ai series, co-authored by the maintainer of benchmarks.law. It is reproduced here in full, with attribution; the source makes it freely available for professional use. The canonical version is at [legalbenchmarks.ai](https://www.legalbenchmarks.ai/research/phase-2-research).

**On the grading method.** Phase 2 grades the reliability round with a mixed approach: an LLM jury scores each draft against the answer key, and borderline or inconsistent cases go to human reviewers. Phase 1 used human review only, and its limitations give the reason: it declined LLM grading because of inconsistent judgments, prompt sensitivity and limited legal-domain expertise.

benchmarks.law keeps a model out of the scoring loop, because LLM-as-judge has measured, systematic errors that disqualify it for a binary legal benchmark. The reference study of the method documents [position, verbosity and self-enhancement bias](https://arxiv.org/abs/2306.05685) (Zheng et al., 2023). Later work measures [self-preference](https://arxiv.org/abs/2410.21819): a judge rates its own lower-perplexity text more highly. Bias audits report [fallacy oversight](https://llm-judge-bias.github.io/): judges fail to flag logical errors in the text they score. A system shown to miss reasoning errors cannot score a benchmark whose one question is whether a tool caught a wrong citation. On this site, code detects the errors and a person confirms each pass or fail.

## 1. Executive Summary

Many legal teams today face an undeniable challenge: how to deliver more with less. Contract drafting — a cornerstone of legal value — remains one of the most time-intensive parts of legal work, and lawyers have already turned to AI to extend their capacity. The community survey asked how many lawyers use AI tools for legal work, how many use two or more, and how many use legal AI tools; the answers showed AI use is nearly universal in the profession, with active experimentation across platforms and limited, fragmented adoption of legal AI in a crowded market. Among lawyers using AI for legal work, 83% use more than one tool.

*The source page shows the survey's three headline percentages as animated counters, which this copy could not capture. See the [canonical report](https://www.legalbenchmarks.ai/research/phase-2-research) for them.*

With lawyers experimenting across general and legal AI, the critical question is how these tools actually perform in contract drafting. The answer is not straightforward. Contract drafting is both an art and a science: there is rarely a single “correct” draft, only one that is “fit for purpose” in context. Yet within that subjectivity, lawyers share common unspoken standards for what makes a draft robust, or “way off.” This report introduces a framework for measuring those standards, translating subjective judgments about draft quality into quantifiable metrics. We focus on three dimensions of a tool's usability: whether outputs are legally and factually sound (**Output Reliability**), the extent to which they aid lawyers in delivering a good working draft (**Output Usefulness**), and how well the platform supports context, verification, and day-to-day workflow (**Platform Workflow Support**).

### Key Findings

Based on evaluations of 450 task outputs, 72 community survey responses, and 12 interviews with in-house legal leaders:

- **AI tools matched and sometimes outperformed lawyers in producing reliable first drafts.** Humans were reliable in 56.7% of tasks; several AI solutions met or exceeded this baseline.
- **The top AI tool marginally outperformed the top human.** The top human lawyer produced a reliable first draft 70% of the time; the top AI tool, 73.3%.
- **Legal AI tools surfaced material risks lawyers missed entirely.** In high-risk scenarios, legal AI raised explicit risk warnings in 83% of outputs, versus 55% for general-purpose AI. Humans raised none.
- **Specialized legal AI did not meaningfully outperform general-purpose AI** in reliability or usefulness. General tools had a slight edge in reliability; legal tools scored marginally higher on usefulness.
- **Platform Workflow Support is the key differentiator for specialized tools** — not output performance. Two-thirds (66.7%) integrate into Microsoft Word, and most provide context handling general tools lack.

## 2. What We Benchmarked

This benchmark directly compares AI legal drafting vs. human drafting across the same set of in-house legal tasks. We evaluated 13 AI tools — purpose-built legal platforms and general-purpose assistants — plus a Human Baseline, measuring accuracy rates, output reliability, and workflow support. Selection prioritized global accessibility, category coverage, market maturity, and practical relevance. Platform and model performance were evaluated in July–August 2025; capabilities evolve constantly.

### Legal AI Platforms

**Anon** — an anonymized, long-standing enterprise legal-AI platform, included to broaden comparison to more mature options. We did not receive permission to name the product; to respect confidentiality while retaining comparative value, we assessed drafting outputs only and excluded it from the round-3 workflow scoring.

**August** — a web-based legal AI platform offering modular workflows that adapt to each organization's playbooks and standards.

**Brackets** — a generative-AI Microsoft Word add-in that helps legal teams draft, review, and redline contracts, leveraging templates, model clauses, and playbooks.

**GC AI** — legal AI for in-house counsel, with source citations, AI in Word, and security/compliance, serving 650+ legal teams.

**InstaSpace** — an AI-native contract management platform for drafting, review, negotiation, signing, and tracking in Arabic and English (Alpha release).

**SimpleDocs** — an AI-native contract automation platform combining drafting, redlining, and review with configurable playbooks and an AI-first repository.

**Wordsmith** — an Edinburgh-based legal-tech startup building AI tools for in-house teams. At Wordsmith's request, its individual results are not published in this report.

### General AI Assistants

ChatGPT (GPT-4.1 & GPT-5) · Claude (Opus 4.1) · Copilot (free version) · Gemini (2.5 Pro) · Le Chat (Mistral magistral-medium-2506) · Qwen (qwen3-235b-a22b).

### Human Lawyers

A group of in-house commercial lawyers averaging 10 years' experience completed the same tasks under the same instructions given to the AI solutions, scored under the same criteria, forming a reference point for the average in-house lawyer.

### Evaluation Framework: three rounds

| Dimension | What it answers | How it was scored |
|---|---|---|
| Output Reliability | Is the output accurate and legally adequate as a starting point? | Instruction compliance, factual accuracy, and legal adequacy on a Pass/Fail basis per task. |
| Output Usefulness | Does the draft ease the reviewer's workload while elevating quality? | Clarity (1–3), Helpfulness (1–3), Appropriate Length (1–3), summed to max 9. |
| Platform Workflow Support | How well does the solution support the full drafting workflow? | Draft Generation Support (1–5) and Quality Assurance Support (1–5), summed to max 10. |

## 3. Results & Analysis

**The story of applied AI is still being written:** legal-specific platforms are not far ahead of general-purpose assistants in output quality, but they are beginning to distinguish themselves through platform functionality built for lawyers. Overall, AI tools match — and sometimes surpass — human lawyers in producing reliable, useful first drafts.

**Output Reliability:** top performers were Gemini 2.5 Pro, GPT-5, GC AI, Brackets, August, and SimpleDocs. Gemini 2.5 Pro led at 73.3%, 16 points above the overall average of 57.3%. Humans achieved 56.7% (rising to 61.5% with AI assistance). **Output Usefulness:** August led on average total score (8.13/9); humans scored 7.53/9. **Platform Workflow Support:** Brackets, GC AI, and SimpleDocs led, with Brackets highest at 8/10. General-purpose assistants trailed because they required more manual “glue work” to fit into workflows.

> Accuracy is only one of several factors we consider. Every lawyer is responsible for reviewing the work product they produce, with or without AI. — a Fortune 500 GC

### Output Reliability

The assessment establishes whether a draft is factually accurate, relevant, and legally adequate enough to trust without second-guessing every clause. Reliability ranged widely across tools, from 44% to 73.3%. **Tool choice directly changes how much early verification and rework a lawyer faces.** An AI's imperfections are not a reason to dismiss its value — they are a reality to be managed.

**Output snapshot: Task 22, Jury Trial Waiver (NY).** Query: modify a Governing Law / Dispute Resolution clause incorporating governing law, dispute resolution, “renounce of jury trial,” and arbitration.

- ✓ Gemini 2.5 Pro converted the colloquial “renounce/renunciation” to the accepted legal term “waiver,” placed it in the right section, and stayed within scope.
- ✗ Qwen echoed the user's non-standard “renouncement of a jury trial” instead of converting to the accepted term.

> I wouldn't fire an intern, junior, or an AI over citing a wrong fact. The draft still saves me more time than doing it myself. I'm a scared user who always checks the key points, and I'll often cross-check an output with multiple other AIs. — a senior legal counsel

### Output Usefulness

The most useful AI outputs make lawyers faster, sharper, and more confident in their judgment. August, GC AI, and Gemini were the top performers. Lawyers perceive utility mainly through efficiency gains (less time to verify and edit) and quality gains (uplift in clarity, structure, traceable reasoning, and targeted risk flags).

**Output snapshot: Task 15, NY Late Payment Penalty.** Query: “Draft a clause that adds a 10% fine if the debt is not paid by the 5th of each month under NY law.”

- ✓ High usefulness (GC AI) — clean clause in standard form plus a concise enforceability flag: the 10% fee is high and could be challenged as punitive rather than compensatory. The flag provided targeted guidance enhancing legal judgment.
- ✗ Low usefulness (Anon) — accurate and responsive, but offered no insight that the clause could be legally problematic.

AI value is usually defined by efficiency because it is easier to measure. But the harder, overlooked value is quality: outputs that sharpen reasoning, clarify assumptions, and flag risks the lawyer would otherwise overlook. Community surveys echo this — lawyers universally expect AI to exercise legal judgment, improving reasoning rather than blindly executing directions.

### Platform Workflow Support

Legal AI tools are moving the battleground from competing on outputs to deep integration into the lawyer's workflow. The top performers — Brackets, GC AI, and SimpleDocs — all integrate within Microsoft Word and combine template/clause storage with drafting-and-redlining capabilities, minimizing app-switching.

| Tool | Standout feature |
|---|---|
| Brackets | Native Word integration with adaptive workflow guidance — analyzes an open contract and proactively suggests next drafting or review actions. |
| GC AI | Cross-device continuity linking a Word add-in and a web app — start in Word on desktop, continue on phone or browser, context preserved. |
| SimpleDocs | Built-in clause library & benchmarking via Law Insider — surfaces market-standard clause alternatives as you draft. |

As accuracy becomes table stakes, legal teams will evaluate AI less on “what it can draft” and more on how seamlessly and scalably it supports the drafting workflow.

## 4. Humans vs. AI

Overall, AI outputs were more reliable than human outputs, but human outputs were more useful. Humans excel at interpreting legal instruction, exercising commercial and legal judgment, context-heavy drafting, and avoiding unneeded concessions. AI is both a valuable collaborator and a competitive challenger.

| Metric | Human Lawyers | AI Tools |
|---|---|---|
| Average Output Reliability Rate | 56.7% | 57% |
| Average Output Usefulness Score (3–9) | 7.53 | 7.25 |
| Avg. Drafting Time per Task | 12 min 43 sec | Under 1 minute |

### Human strengths

Humans were consistently more reliable at interpreting intent without unnecessary concessions, exercising commercial judgment, managing multi-form inputs, and producing legally precise, polished text. Example: in an MOU task combining a template, term sheet, and an email thread with a screenshot of company details, only the human lawyer extracted the complete and correct party information. In Task 37 (license clause from a licensee-friendly perspective), Mistral's draft conceded “as is” language favoring the licensor; another AI draft was “licensor-friendly without rationale.”

### AI strengths

AI excelled in speed, consistency, and routine drafting. In Task 15, every AI reproduced the 10% figure correctly, while one human mistakenly wrote “9%” — a slip reviewers jokingly called a “human hallucination.” AI was also less prone to underdrafting; several human drafts were “way too brief” or insufficiently developed.

> I would not hire the 25-year-old me today. AI is much faster and its work is more verifiable. — a senior in-house counsel

### Separating Hype from Reality

**“AI may replace juniors in low-level work, but not judgment work.”** Mostly true, but incomplete — AI outperformed humans on routine tasks and also showed judgment in some high-risk tasks, flagging enforceability issues humans missed.

**“Humans will not be replaced by AI.”** True, with limits — lawyers focused only on routine, low-risk, standardized work face the highest replacement risk.

**“Humans working with AI will always outperform AI alone.”** False — Human + AI beat humans alone, but not several of the best AI tools.

**“Humans must always be in the loop.”** True, but bidirectional — AI avoided simple errors humans made and surfaced complex oversights humans missed. One reviewer admitted “I felt like the AI is smarter than me.”

## 5. Legal AI vs. General AI

Specialized legal AI did not meaningfully outperform general AI in reliability or usefulness, but it was much stronger at advisory and workflow support. Among lawyers using AI for legal work, 83% use more than one tool.

| Metric | General AI Tools | Legal AI Tools |
|---|---|---|
| Average Output Reliability Rate | 58.3% | 57.6% |
| Average Output Usefulness Score | 7.24 | 7.27 |

In high-risk drafting, legal AI raised explicit risk warnings in 83% of outputs vs. 55% for general AI. Yet only 6% of lawyers surveyed require 100% accuracy before using AI; 55% are comfortable below 90%. 35% cited easier output verification as the top driver of increased usage, 23% context management, and just 21% accuracy gains. **For many lawyers, practical usability outweighs the pursuit of perfect accuracy.**

> Why isn't the [enterprise-grade legal AI solution] as smart as ChatGPT? It often misses points that ChatGPT can find. — an in-house counsel

## 6. Conclusion

Contract-drafting AI has crossed an important threshold: it is no longer an experiment, but a practical tool with measurable strengths and weaknesses. Our data is a snapshot of a story still unfolding. Specialized platforms are not far ahead on output quality, but stand apart in workflow integration and risk-aware features. Lawyers continue to excel in judgment-heavy, context-rich tasks. The future of drafting will be shaped by orchestration — combining the speed of general AI, the workflow fit of legal AI, and the judgment of lawyers. The advantage will belong to teams that learn to design and manage this collaboration.

## 7. Notes from the Authors

**Anna Guo.** All of us — vendors, human lawyers, advisors, community members — are small actors within one of the most exciting and fast-moving technological shifts of our time. The saying goes: keep your friends close, and your enemies closer. Through benchmarking, I try to do exactly that: keep close to the tools reshaping law, so I can see both the opportunities and the risks they bring to my profession.

**Arthur Souza Rodrigues.** Who are these folks evaluating Round Z legal tech? My answer: we are your future users, regardless of will. We will endure glacial loading times, “I can't do that, I'm a language model,” and verbose emoji-riddled responses. We are all burning gigantic quantities of cash, time, and — more (← en-dash beautifully added by the AI →) critically — the future of the legal profession. Shouldn't we at least kick the tires?

**Mohamed Al Mamari.** Junior lawyers should spend more time with the business: listen, learn, and build relationships. AI can help, but relying on it too much will dull your ability to think critically. What sets you apart is blending people skills, business acumen, and thoughtful use of technology.

**Sakshi Udeshi, AI trust & safety expert.** **Evaluations are imperfect, but essential.** Today's evals are still a weak signal — not because they're futile, but because they must evolve with the systems they measure. **Competitive advantage is shifting beyond model quality** toward workflow integration, domain-aware UX, and purpose-built features. **Industry–academia collaboration must deepen** — industry grounds problem definitions and real workflows; academia builds methods, datasets, and open baselines.

**Marc Astbury, CPO at Jenni AI.** The most effective humans have always been the best tool callers.

## 8. Acknowledgements

This benchmark was a collective effort. Our thanks to **HumanSignal**, whose platform powered the task review process and made it possible to evaluate 400+ AI & human outputs at scale. Thanks to our advisors — Nada Alnajafi, Nate Kostelnik, Jason Tamara Widjaja, and Gabriel Saunders — and to the global community of contributors who supplied tasks, reviews, and feedback.

## Appendix A.1: Task Dataset

The dataset comprised 30 real-world drafting tasks contributed by in-house and private-practice lawyers across industries — partnerships, marketing, financing, and employment. Each task was provided in the contributor's original words, including shorthand, misspellings, and incomplete instructions, to reflect the messy realities of practice.

| Task Type | Description |
|---|---|
| Basic Clause Drafting | Generating basic clauses that follow widely accepted forms. |
| Template-based Drafting | Adapting an existing contract template based on provided facts. |
| Bespoke Drafting | Drafting bespoke clauses/agreements based on specific commercial arrangements. |

## Appendix A.2: Methodology

### Round 1: Output Reliability

This checked whether each draft met minimum legal and factual requirements, on three criteria: **Instruction Compliance** (stays within scope, interpreting unclear instructions reasonably), **Legal Adequacy** (correctly applies legal principles and terminology), and **Factual Accuracy** (all details correctly incorporated, no new errors). The contributing lawyer supplied an answer key of basic elements an acceptable draft must include (**Key Elements**). **An LLM jury evaluated each AI- and human-generated draft against these Key Elements and criteria.** A draft received a Pass only if all Key Elements were present and all three criteria satisfied. To mitigate errors, borderline cases or inconsistent AI evaluations were escalated to expert reviewers for a final decision.

*benchmarks.law note: this is the LLM-jury step. This site's standard, under which code detects the errors, a person confirms each pass or fail, and no model is in the scoring loop, answers the LLM-as-judge failure modes set out in "About this copy" above.*

### Round 2: Output Usefulness

Expert reviewers scored each draft in a double-blind process on Clarity, Helpfulness, and Adequate Length (each 1–3). Per-output totals were averaged across tasks.

### Round 3: Platform Workflow Support

A qualitative assessment on two factors — Draft Generation Support (1–5) and Quality Assurance Support (1–5). In-house lawyers independently tested every platform on multiple drafting tasks, then consolidated observations into a joint score.

## Appendix A.3: Limitations

- **Clusters & threshold effects:** tools were grouped into three bands for comparison; bands simplify a continuous spectrum and should not be over-interpreted.
- **No feature maximization:** outputs were collected without enabling each vendor's full feature set, so scores reflect baseline use rather than optimized potential.
- **Sample size:** 30 tasks and 13 AI solutions, primarily junior-to-mid-level complexity — cannot capture the full diversity of drafting scenarios.
- **Subjectivity in human scoring:** usefulness and workflow judgments involve some reviewer subjectivity even with guidelines.
- **Evolution of models:** a July–August 2025 snapshot; rankings could shift as technology evolves.
- **Prompting style:** single-pass outputs from standardized prompts; results may differ with skilled re-prompting.
- **Survey limitations:** 72 voluntary, self-reported responses, subject to selection bias; indicative of adoption trends rather than statistically representative.

## Notes

1. Legal AI Platform outputs were collected in July 2025, prior to GPT-5's release. After results were finalised, reviewed by community members, and shared, legal AI vendors were offered the option to add a sponsored link to their brand name. This had no impact on the results.
2. Wordsmith outputs were collected from its homepage AI chat assistant without enabling the contract-drafting feature. At Wordsmith's request, its individual results are not published. We hope to collaborate again.
3. Reliability and Usefulness were assessed on outputs collected via each foundational model provider's API, while Platform Workflow Support was evaluated at the platform's chat-interface level.

**Cite this report (APA).** Guo, A., Rodrigues, A., Mamari, M., Udeshi, S., & Astbury, M. (2025). *Benchmarking Humans & AI in Contract Drafting.* legalbenchmarks.ai. https://www.legalbenchmarks.ai/research/phase-2-research

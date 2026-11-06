/**
 * Public MCP server for benchmarks.law.
 *
 * Stateless Streamable HTTP, same shape as Live Contracts: POST JSON-RPC,
 * read-only tools, and a Workers rate-limit binding of 60 requests per 60
 * seconds per client IP. The binding is optional so local dev still answers.
 */

const SITE = "https://benchmarks.law";
const PROTOCOL_VERSION = "2025-06-18";
const SERVER_INFO = {
	name: "benchmarks-law",
	title: "benchmarks.law",
	version: "1.0.0",
};
const INSTRUCTIONS =
	"Read-only access to the published benchmarks.law reports, DOCX editor scores, and legal-AI studies. " +
	"Use search_reports or list_reports for the editors trial, get_report for one report, " +
	"list_vendors and get_vendor for round-trip and hostile-input scores, " +
	"and list_studies and get_study for the legal-AI benches. " +
	"Scores are the published measurements. This is not legal advice.";

/** Long reports are capped so one call cannot fill an agent's context. */
export const BODY_CAP = 20_000;

const DISCOVERY_LINK =
	'</.well-known/mcp/server-card.json>; rel="service-desc"; type="application/json"';

const CORS: Record<string, string> = {
	"Access-Control-Allow-Headers": "content-type, mcp-session-id, mcp-protocol-version",
	"Access-Control-Allow-Methods": "POST, OPTIONS",
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Max-Age": "86400",
};

export interface RateLimit {
	limit(options: { key: string }): Promise<{ success: boolean }>;
}

export interface McpReport {
	body: string;
	code: string;
	dek: string;
	position: number;
	series: string;
	slug: string;
	title: string;
}

export interface McpVendor {
	critical: string;
	detail: string;
	kind: string;
	leads: string;
	license: string;
	maker: string;
	name: string;
	position: number;
	roundtrip: number | null;
	safety: number | null;
	site: string | null;
	slug: string;
}

export interface McpStudy {
	authors: string[];
	body: string;
	code: string;
	date: string;
	dek: string;
	grading: string;
	license: string;
	slug: string;
	source: string;
	title: string;
}

export interface McpData {
	renames: Record<string, string>;
	reports: McpReport[];
	studies: McpStudy[];
	vendors: McpVendor[];
}

type Json = Record<string, unknown>;

const TOOLS = [
	{
		name: "search_reports",
		description: "Search editors-trial reports by title, code, dek, or slug.",
		inputSchema: {
			type: "object",
			properties: {
				query: { type: "string", description: "Words from a report title or code." },
				limit: { type: "integer", minimum: 1, maximum: 50, default: 20 },
			},
			required: ["query"],
		},
	},
	{
		name: "list_reports",
		description: "List the editors-trial reports, notes, and lane notes in reading order.",
		inputSchema: {
			type: "object",
			properties: { limit: { type: "integer", minimum: 1, maximum: 50, default: 50 } },
		},
	},
	{
		name: "get_report",
		description: "Fetch one report by slug, including its text up to a cap. A renamed slug returns the new address.",
		inputSchema: {
			type: "object",
			properties: { slug: { type: "string", description: "Report slug, e.g. report-c." } },
			required: ["slug"],
		},
	},
	{
		name: "list_vendors",
		description: "List the DOCX editors in the trial with round-trip and hostile-input scores.",
		inputSchema: {
			type: "object",
			properties: { limit: { type: "integer", minimum: 1, maximum: 50, default: 50 } },
		},
	},
	{
		name: "get_vendor",
		description: "Fetch one editor by slug, including its scores and the line on where it leads.",
		inputSchema: {
			type: "object",
			properties: { slug: { type: "string", description: "Editor slug, e.g. superdoc." } },
			required: ["slug"],
		},
	},
	{
		name: "list_studies",
		description: "List the legal-AI studies (info extraction and contract drafting).",
		inputSchema: { type: "object", properties: {} },
	},
	{
		name: "get_study",
		description: "Fetch one legal-AI study by slug, including its text up to a cap.",
		inputSchema: {
			type: "object",
			properties: { slug: { type: "string", description: "info-extraction or contract-drafting." } },
			required: ["slug"],
		},
	},
];

const ok = (id: unknown, result: Json): Json => ({ id: id ?? null, jsonrpc: "2.0", result });
const fail = (id: unknown, code: number, message: string): Json => ({
	error: { code, message },
	id: id ?? null,
	jsonrpc: "2.0",
});

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
	const parsed = Number(value);
	if (!Number.isFinite(parsed)) return fallback;
	return Math.min(max, Math.max(min, Math.trunc(parsed)));
}

function textArg(value: unknown): string {
	return value == null ? "" : String(value).trim();
}

function byPosition<T extends { position: number }>(rows: T[]): T[] {
	return [...rows].sort((a, b) => a.position - b.position);
}

function cap(text: string): { body: string; truncated: boolean } {
	if (text.length <= BODY_CAP) return { body: text, truncated: false };
	return { body: text.slice(0, BODY_CAP), truncated: true };
}

function reportSummary(report: McpReport): Json {
	return {
		code: report.code,
		dek: report.dek,
		position: report.position,
		series: report.series,
		slug: report.slug,
		title: report.title,
		url: `${SITE}/editors-trial/${report.slug}`,
	};
}

function vendorSummary(vendor: McpVendor): Json {
	return {
		critical: vendor.critical,
		kind: vendor.kind,
		leads: vendor.leads,
		license: vendor.license,
		maker: vendor.maker,
		name: vendor.name,
		position: vendor.position,
		roundtrip: vendor.roundtrip,
		safety: vendor.safety,
		slug: vendor.slug,
		url: `${SITE}/editors-trial/vendors#${vendor.slug}`,
	};
}

function studySummary(study: McpStudy): Json {
	return {
		code: study.code,
		date: study.date,
		dek: study.dek,
		slug: study.slug,
		title: study.title,
		url: `${SITE}/legal-ai/${study.slug}`,
	};
}

function toolResult(data: McpData, name: string, args: Json): Json | null {
	if (name === "search_reports") {
		const query = textArg(args.query).toLowerCase();
		if (!query) throw new Error("query is required");
		const limit = clampInt(args.limit, 1, 50, 20);
		const items = byPosition(data.reports)
			.filter((report) =>
				`${report.title}\n${report.code}\n${report.dek}\n${report.slug}`.toLowerCase().includes(query),
			)
			.slice(0, limit);
		return { count: items.length, items: items.map(reportSummary) };
	}
	if (name === "list_reports") {
		const items = byPosition(data.reports).slice(0, clampInt(args.limit, 1, 50, 50));
		return { count: items.length, items: items.map(reportSummary) };
	}
	if (name === "get_report") {
		const slug = textArg(args.slug);
		if (!slug) throw new Error("slug is required");
		const report = data.reports.find((row) => row.slug === slug);
		if (!report) {
			const moved = data.renames[slug];
			if (!moved) return null;
			return { moved_to: moved, slug, url: `${SITE}/editors-trial/${moved}` };
		}
		return { ...reportSummary(report), ...cap(report.body) };
	}
	if (name === "list_vendors") {
		const items = byPosition(data.vendors).slice(0, clampInt(args.limit, 1, 50, 50));
		return { count: items.length, items: items.map(vendorSummary) };
	}
	if (name === "get_vendor") {
		const slug = textArg(args.slug);
		if (!slug) throw new Error("slug is required");
		const vendor = data.vendors.find((row) => row.slug === slug);
		if (!vendor) return null;
		return { ...vendorSummary(vendor), detail: vendor.detail, site: vendor.site };
	}
	if (name === "list_studies") {
		return { count: data.studies.length, items: data.studies.map(studySummary) };
	}
	if (name === "get_study") {
		const slug = textArg(args.slug);
		if (!slug) throw new Error("slug is required");
		const study = data.studies.find((row) => row.slug === slug);
		if (!study) return null;
		return {
			...studySummary(study),
			authors: study.authors,
			grading: study.grading,
			license: study.license,
			source: study.source,
			...cap(study.body),
		};
	}
	throw new Error(`unknown tool: ${name}`);
}

function toolError(id: unknown, text: string): Json {
	return ok(id, { content: [{ text, type: "text" }], isError: true });
}

async function handleMessage(message: Json, load: () => Promise<McpData>): Promise<Json | null> {
	const { id, method, params } = message as { id?: unknown; method?: string; params?: Json };
	if (!method) return fail(id, -32600, "Invalid Request");
	if (method === "initialize") {
		return ok(id, {
			capabilities: { tools: { listChanged: false } },
			instructions: INSTRUCTIONS,
			protocolVersion: PROTOCOL_VERSION,
			serverInfo: SERVER_INFO,
		});
	}
	if (method.startsWith("notifications/")) return null;
	if (method === "ping") return ok(id, {});
	if (method === "tools/list") return ok(id, { tools: TOOLS });
	if (method === "tools/call") {
		const name = textArg((params as Json | undefined)?.name);
		const args = ((params as Json | undefined)?.arguments as Json) ?? {};
		try {
			const data = toolResult(await load(), name, args);
			if (data === null) return toolError(id, "Nothing found for that slug.");
			return ok(id, { content: [{ text: JSON.stringify(data, null, 2), type: "text" }] });
		} catch (error) {
			const messageText = error instanceof Error ? error.message : String(error);
			return toolError(id, `Error: ${messageText}`);
		}
	}
	return fail(id, -32601, `Method not found: ${method}`);
}

function json(body: unknown, status = 200, extra: Record<string, string> = {}): Response {
	return new Response(JSON.stringify(body), {
		headers: { "content-type": "application/json", ...CORS, ...extra },
		status,
	});
}

/** Link relation on HTML documents, so an agent can find the server card. */
export function withAgentLinks(response: Response): Response {
	const contentType = response.headers.get("content-type") ?? "";
	if (!contentType.includes("text/html")) return response;
	const headers = new Headers(response.headers);
	headers.append("Link", DISCOVERY_LINK);
	return new Response(response.body, { headers, status: response.status, statusText: response.statusText });
}

async function limited(request: Request, limiter: RateLimit | undefined): Promise<Response | null> {
	if (!limiter) return null;
	const key = request.headers.get("cf-connecting-ip") ?? "anon";
	const { success } = await limiter.limit({ key });
	if (success) return null;
	return json(fail(null, -32029, "Rate limit exceeded — slow down and retry shortly."), 429, {
		"retry-after": "10",
	});
}

export async function handleMcp(
	request: Request,
	limiter: RateLimit | undefined,
	load: () => Promise<McpData>,
): Promise<Response> {
	if (request.method === "OPTIONS") return new Response(null, { headers: CORS, status: 204 });
	if (request.method === "GET") {
		return new Response(
			"benchmarks.law MCP server. POST JSON-RPC (MCP Streamable HTTP) to this endpoint.",
			{ headers: { Allow: "POST, OPTIONS", ...CORS }, status: 405 },
		);
	}
	if (request.method !== "POST") {
		return new Response("Method not allowed", { headers: { Allow: "POST, OPTIONS", ...CORS }, status: 405 });
	}

	const blocked = await limited(request, limiter);
	if (blocked) return blocked;

	let message: unknown;
	try {
		message = await request.json();
	} catch {
		return json(fail(null, -32700, "Parse error"), 400);
	}

	let cached: Promise<McpData> | null = null;
	const once = () => {
		cached ??= load();
		return cached;
	};

	if (Array.isArray(message)) {
		const replies = (await Promise.all(message.map((item) => handleMessage(item as Json, once)))).filter(
			(reply): reply is Json => reply !== null,
		);
		return replies.length ? json(replies) : new Response(null, { headers: CORS, status: 202 });
	}
	const reply = await handleMessage(message as Json, once);
	return reply === null ? new Response(null, { headers: CORS, status: 202 }) : json(reply);
}

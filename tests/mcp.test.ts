import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { BODY_CAP, handleMcp, withAgentLinks, type McpData, type RateLimit } from "../src/lib/mcp";

const DATA: McpData = {
	renames: { "report-e-jubarte": "report-d1-jubarte" },
	reports: [
		{
			body: "C".repeat(BODY_CAP + 5),
			code: "Report C",
			dek: "Rendering versus Word",
			position: 40,
			series: "editors",
			slug: "report-c",
			title: "Rendering Versus Word",
		},
		{
			body: "Main text",
			code: "Main report",
			dek: "Round trip",
			position: 0,
			series: "editors",
			slug: "round-trip",
			title: "Open-source DOCX editors",
		},
	],
	studies: [
		{
			authors: ["Anna Guo", "Arthur Souza Rodrigues"],
			body: "Study body",
			code: "Bench 03",
			date: "Early 2025",
			dek: "Info extraction",
			grading: "Human-judged",
			license: "CC BY 4.0",
			slug: "info-extraction",
			source: "https://www.legalbenchmarks.ai/research/phase-1-research",
			title: "Info extraction",
		},
	],
	vendors: [
		{
			critical: "29/29",
			detail: "Highest round-trip fidelity.",
			kind: "Document engine",
			leads: "Highest round-trip fidelity in the trial",
			license: "AGPL-3.0",
			maker: "superdoc.dev",
			name: "SuperDoc",
			position: 10,
			roundtrip: 100,
			safety: 0.3,
			site: "https://superdoc.dev/",
			slug: "superdoc",
		},
	],
};

function post(body: unknown, headers: Record<string, string> = {}) {
	return new Request("https://benchmarks.law/mcp", {
		body: JSON.stringify(body),
		headers: { "content-type": "application/json", ...headers },
		method: "POST",
	});
}

const load = () => Promise.resolve(DATA);

describe("MCP JSON-RPC", () => {
	it("GET is 405 and initialize names the server", async () => {
		const got = await handleMcp(new Request("https://benchmarks.law/mcp"), undefined, load);
		expect(got.status).toBe(405);
		expect(got.headers.get("allow")).toBe("POST, OPTIONS");

		const response = await handleMcp(
			post({ id: 1, jsonrpc: "2.0", method: "initialize", params: {} }),
			undefined,
			load,
		);
		const body = (await response.json()) as { result: { protocolVersion: string; serverInfo: { name: string } } };
		expect(body.result.serverInfo.name).toBe("benchmarks-law");
		expect(body.result.protocolVersion).toBe("2025-06-18");
	});

	it("tools/list matches the server card", async () => {
		const response = await handleMcp(post({ id: 2, jsonrpc: "2.0", method: "tools/list" }), undefined, load);
		const body = (await response.json()) as { result: { tools: { name: string }[] } };
		const names = body.result.tools.map((tool) => tool.name);
		const card = JSON.parse(
			readFileSync(new URL("../public/.well-known/mcp/server-card.json", import.meta.url), "utf8"),
		) as { tools: { name: string }[] };
		expect(names).toEqual(card.tools.map((tool) => tool.name));
	});

	it("list_reports is in reading order and omits the body", async () => {
		const response = await handleMcp(
			post({
				id: 3,
				jsonrpc: "2.0",
				method: "tools/call",
				params: { arguments: {}, name: "list_reports" },
			}),
			undefined,
			load,
		);
		const body = (await response.json()) as { result: { content: { text: string }[] } };
		const data = JSON.parse(body.result.content[0]?.text ?? "{}") as { items: { slug: string; body?: string }[] };
		expect(data.items.map((item) => item.slug)).toEqual(["round-trip", "report-c"]);
		expect(data.items[0]?.body).toBeUndefined();
	});

	it("get_report caps the body and a renamed slug points at the new one", async () => {
		const full = await handleMcp(
			post({
				id: 4,
				jsonrpc: "2.0",
				method: "tools/call",
				params: { arguments: { slug: "report-c" }, name: "get_report" },
			}),
			undefined,
			load,
		);
		const fullBody = (await full.json()) as { result: { content: { text: string }[] } };
		const report = JSON.parse(fullBody.result.content[0]?.text ?? "{}") as { body: string; truncated: boolean };
		expect(report.truncated).toBe(true);
		expect(report.body).toHaveLength(BODY_CAP);

		const moved = await handleMcp(
			post({
				id: 5,
				jsonrpc: "2.0",
				method: "tools/call",
				params: { arguments: { slug: "report-e-jubarte" }, name: "get_report" },
			}),
			undefined,
			load,
		);
		const movedBody = (await moved.json()) as { result: { content: { text: string }[]; isError?: boolean } };
		expect(movedBody.result.isError).toBeUndefined();
		expect(JSON.parse(movedBody.result.content[0]?.text ?? "{}")).toMatchObject({
			moved_to: "report-d1-jubarte",
			url: "https://benchmarks.law/editors-trial/report-d1-jubarte",
		});
	});

	it("get_vendor returns the scores", async () => {
		const response = await handleMcp(
			post({
				id: 6,
				jsonrpc: "2.0",
				method: "tools/call",
				params: { arguments: { slug: "superdoc" }, name: "get_vendor" },
			}),
			undefined,
			load,
		);
		const body = (await response.json()) as { result: { content: { text: string }[] } };
		expect(JSON.parse(body.result.content[0]?.text ?? "{}")).toMatchObject({
			name: "SuperDoc",
			roundtrip: 100,
			url: "https://benchmarks.law/editors-trial/vendors#superdoc",
		});
	});

	it("a notification is 202 and does not load the CMS", async () => {
		let loaded = false;
		const response = await handleMcp(
			post({ jsonrpc: "2.0", method: "notifications/initialized" }),
			undefined,
			() => {
				loaded = true;
				return Promise.resolve(DATA);
			},
		);
		expect(response.status).toBe(202);
		expect(loaded).toBe(false);
	});
});

describe("the rate limit", () => {
	it("a refused key is 429 and the data loader does not run", async () => {
		let loaded = false;
		const limiter: RateLimit = { limit: () => Promise.resolve({ success: false }) };
		const response = await handleMcp(
			post({ id: 1, jsonrpc: "2.0", method: "initialize" }, { "cf-connecting-ip": "203.0.113.4" }),
			limiter,
			() => {
				loaded = true;
				return Promise.resolve(DATA);
			},
		);
		expect(response.status).toBe(429);
		expect(response.headers.get("retry-after")).toBe("10");
		const body = (await response.json()) as { error: { code: number } };
		expect(body.error.code).toBe(-32029);
		expect(loaded).toBe(false);
	});

	it("the key is the client IP", async () => {
		const keys: string[] = [];
		const limiter: RateLimit = {
			limit: ({ key }) => {
				keys.push(key);
				return Promise.resolve({ success: true });
			},
		};
		await handleMcp(post({ id: 1, jsonrpc: "2.0", method: "ping" }, { "cf-connecting-ip": "203.0.113.5" }), limiter, load);
		expect(keys).toEqual(["203.0.113.5"]);
	});

	it("wrangler caps MCP at 60 requests per 60 seconds", () => {
		const config = readFileSync(new URL("../wrangler.jsonc", import.meta.url), "utf8");
		expect(config).toContain('"name": "MCP_RATE_LIMITER"');
		expect(config).toContain('"namespace_id": "3101"');
		expect(config).toMatch(/"limit":\s*60/);
		expect(config).toMatch(/"period":\s*60/);
	});
});

describe("discovery", () => {
	it("adds the server-card link to HTML and leaves JSON alone", () => {
		const html = withAgentLinks(new Response("<html></html>", { headers: { "content-type": "text/html" } }));
		expect(html.headers.get("link")).toContain('</.well-known/mcp/server-card.json>; rel="service-desc"');
		const json = withAgentLinks(new Response("{}", { headers: { "content-type": "application/json" } }));
		expect(json.headers.get("link")).toBeNull();
	});
});

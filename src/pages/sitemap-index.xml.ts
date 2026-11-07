import type { APIRoute } from "astro";
import { sitemapIndexXml } from "../lib/discovery";

export const prerender = false;

export const GET: APIRoute = () =>
	new Response(sitemapIndexXml(), {
		headers: { "content-type": "application/xml; charset=utf-8" },
	});

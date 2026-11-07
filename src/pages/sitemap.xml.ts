import type { APIRoute } from "astro";
import { publicPaths, sitemapXml } from "../lib/discovery";

export const prerender = false;

export const GET: APIRoute = () =>
	new Response(sitemapXml(publicPaths()), {
		headers: { "content-type": "application/xml; charset=utf-8" },
	});

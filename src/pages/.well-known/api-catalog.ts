import type { APIRoute } from "astro";
import { API_CATALOG_TYPE, apiCatalog } from "../../lib/discovery";

export const prerender = false;

export const GET: APIRoute = () =>
	new Response(JSON.stringify(apiCatalog()), {
		headers: { "content-type": API_CATALOG_TYPE },
	});

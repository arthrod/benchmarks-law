import { defineMiddleware } from "astro:middleware";
import { withDocumentHeaders } from "./lib/discovery";
import { withAgentLinks } from "./lib/mcp";

export const onRequest = defineMiddleware(async (_context, next) => withDocumentHeaders(withAgentLinks(await next())));

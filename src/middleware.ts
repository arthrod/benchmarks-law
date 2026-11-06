import { defineMiddleware } from "astro:middleware";
import { withAgentLinks } from "./lib/mcp";

export const onRequest = defineMiddleware(async (_context, next) => withAgentLinks(await next()));

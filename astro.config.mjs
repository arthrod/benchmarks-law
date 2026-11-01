import cloudflare from "@astrojs/cloudflare";
import { cacheCloudflare } from "@astrojs/cloudflare/cache";
import react from "@astrojs/react";
import { d1, r2 } from "@emdash-cms/cloudflare";
import { defineConfig } from "astro/config";
import emdash from "emdash/astro";

// CMS-backed public pages. EmDash purges a page's tags whenever its content is
// written, so the max age only bounds staleness after a deploy changes markup.
// Every page renders the site title from settings (Site.astro), hence the tag.
const PUBLIC_PAGE = { maxAge: 300, swr: 3600, tags: ["emdash:settings"] };

export default defineConfig({
	site: "https://benchmarks.law",
	output: "server",
	adapter: cloudflare(),
	// Cloudflare's Worker cache (Cloudflare-CDN-Cache-Control + Cache-Tag). No KV or R2.
	cache: { provider: cacheCloudflare() },
	routeRules: {
		"/": PUBLIC_PAGE,
		"/editors-trial": PUBLIC_PAGE,
		"/editors-trial/vendors": PUBLIC_PAGE,
		"/editors-trial/[slug]": PUBLIC_PAGE,
	},
	image: {
		layout: "constrained",
		responsiveStyles: true,
	},
	vite: {
		ssr: {
			optimizeDeps: {
				// Pre-bundle so it isn't discovered mid-render, which would trigger
				// a Vite dep re-optimization and break in-flight worker imports
				// under the Cloudflare dev runner (workerd).
				include: ["astro > @astrojs/internal-helpers > picomatch"],
			},
		},
	},
	integrations: [
		react(),
		emdash({
			database: d1({ binding: "DB", session: "auto" }),
			storage: r2({ binding: "MEDIA" }),
			// Shared caching would otherwise hand signed-in editors the anonymous page, toolbar-less.
			toolbar: "client",
		}),
	],
	devToolbar: { enabled: false },
});

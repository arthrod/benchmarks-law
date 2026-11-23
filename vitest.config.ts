import { configDefaults, defineConfig } from "vitest/config";

// .scratch/ holds throwaway checkouts (review worktrees, release trees) with their own tests/;
// collecting those runs another commit's tests against this one's files.
export default defineConfig({
	test: {
		exclude: [...configDefaults.exclude, ".scratch/**"],
	},
});

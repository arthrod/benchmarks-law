/**
 * The report's .docx, built in the browser when the reader asks for it
 * (benchmarks-law#56): the page's Markdown, its figures inlined and a
 * contents list added (src/lib/liveDocx.ts), converted by jubarte-wasm's
 * markdownToDocx with the editors trial's reference document for styles and
 * the landscape page. The WASM (~9 MB compressed) loads on the first click.
 */
import { prepareMarkdown } from "../lib/liveDocx";

async function bytes(url: string): Promise<Uint8Array | null> {
	const r = await fetch(url);
	return r.ok ? new Uint8Array(await r.arrayBuffer()) : null;
}

let engine: Promise<typeof import("jubarte-wasm/web-slim")> | null = null;
function load() {
	engine ??= (async () => {
		const [w, { default: wasm }] = await Promise.all([
			import("jubarte-wasm/web-slim"),
			import("jubarte-wasm/web-slim/jubarte_wasm_bg.wasm?url"),
		]);
		await w.default({ module_or_path: wasm });
		return w;
	})();
	return engine;
}

async function build(button: HTMLButtonElement) {
	const { slug, name } = button.dataset;
	const label = button.textContent;
	button.disabled = true;
	button.setAttribute("aria-busy", "true");
	button.textContent = "building .docx…";
	try {
		const [w, md, reference] = await Promise.all([
			load(),
			fetch(`/editors-trial/${slug}.md`).then((r) => (r.ok ? r.text() : Promise.reject(new Error(`report ${r.status}`)))),
			bytes("/editors-trial/reference.docx"),
		]);
		const text = await prepareMarkdown(md, (src) => (src.startsWith("/") ? bytes(src) : Promise.resolve(null)));
		const docx = w.markdownToDocx(text, "{}", reference);
		const url = URL.createObjectURL(new Blob([new Uint8Array(docx)], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }));
		const a = Object.assign(document.createElement("a"), { href: url, download: `${name}.docx` });
		document.body.appendChild(a);
		a.click();
		a.remove();
		setTimeout(() => URL.revokeObjectURL(url), 60_000);
		button.textContent = label;
	} catch (e) {
		console.error("[docx] live build failed", e);
		button.textContent = "couldn't build the .docx; try again";
	} finally {
		button.disabled = false;
		button.removeAttribute("aria-busy");
	}
}

for (const b of document.querySelectorAll<HTMLButtonElement>("button[data-docx]")) {
	b.addEventListener("click", () => build(b));
}

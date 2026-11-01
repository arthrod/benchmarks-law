/**
 * The report reader: the contents list (moved into a <details> on narrow
 * screens, the current section marked while scrolling), the reading progress
 * bar and the "All reports" switcher. Shared by the editors-trial reports and
 * the legal-AI studies.
 */
const bar = document.getElementById("progress");
const article = document.querySelector<HTMLElement>(".prose");
const links = [...document.querySelectorAll<HTMLAnchorElement>("#toc a[data-id]")];
const toc = document.getElementById("toc");
const details = document.getElementById("toc-details") as HTMLDetailsElement | null;
const aside = document.querySelector(".lr-aside");
const mq = matchMedia("(max-width: 960px)");
const reduce = matchMedia("(prefers-reduced-motion: reduce)");
function placeToc() {
	if (!toc || !details || !aside) return;
	if (mq.matches && toc.parentElement !== details) details.appendChild(toc);
	if (!mq.matches && toc.parentElement !== aside) aside.appendChild(toc);
}
placeToc();
const sw = document.getElementById("r-switch") as HTMLDetailsElement | null;
if (sw) {
	sw.addEventListener("toggle", () => {
		if (!sw.open) return;
		// Scroll the panel only: scrollIntoView would also move the page when the item is off screen.
		const on = sw.querySelector<HTMLElement>("a.on");
		const panel = sw.querySelector<HTMLElement>(".r-panel");
		if (on && panel) {
			const d = on.getBoundingClientRect().top - panel.getBoundingClientRect().top;
			panel.scrollTop += d - (panel.clientHeight - on.offsetHeight) / 2;
		}
	});
	document.addEventListener("click", (e) => {
		if (sw.open && !sw.contains(e.target as Node)) sw.open = false;
	});
	document.addEventListener("keydown", (e) => {
		if (e.key === "Escape" && sw.open) {
			sw.open = false;
			sw.querySelector("summary")?.focus();
		}
	});
}
mq.addEventListener("change", placeToc);
for (const a of links) {
	a.addEventListener("click", () => {
		if (mq.matches && details) details.open = false;
	});
}
const heads = links.map((a) => document.getElementById(a.dataset.id ?? "")).filter(Boolean) as HTMLElement[];
let ticking = false;
function update() {
	ticking = false;
	if (bar && article) {
		const r = article.getBoundingClientRect();
		const total = r.height - innerHeight;
		const p = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 1;
		bar.style.width = `${p * 100}%`;
	}
	let cur: HTMLElement | undefined;
	for (const h of heads) {
		if (h.getBoundingClientRect().top < 120) cur = h;
		else break;
	}
	for (const a of links) {
		const active = !!cur && a.dataset.id === cur.id;
		a.classList.toggle("on", active);
		if (active) a.setAttribute("aria-current", "location");
		else a.removeAttribute("aria-current");
	}
	const on = links.find((a) => a.classList.contains("on"));
	if (on && !mq.matches && aside) {
		const ar = aside.getBoundingClientRect();
		const lr = on.getBoundingClientRect();
		if (lr.top < ar.top || lr.bottom > ar.bottom) on.scrollIntoView({ block: "nearest", behavior: reduce.matches ? "auto" : "smooth" });
	}
}
addEventListener(
	"scroll",
	() => {
		if (!ticking) {
			ticking = true;
			requestAnimationFrame(update);
		}
	},
	{ passive: true },
);
addEventListener("resize", update);
update();

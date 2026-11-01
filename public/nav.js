// MENU (small screens): the links fold behind it once this script runs, so without JavaScript they stay visible.
(() => {
	const header = document.getElementById("brand");
	const btn = header?.querySelector(".nav-menu");
	if (!header || !btn) return;
	header.classList.add("has-menu");
	const set = (open) => {
		header.classList.toggle("menu-open", open);
		btn.setAttribute("aria-expanded", String(open));
	};
	btn.addEventListener("click", () => set(btn.getAttribute("aria-expanded") !== "true"));
	document.addEventListener("click", (e) => {
		if (header.classList.contains("menu-open") && !header.contains(e.target)) set(false);
	});
	document.addEventListener("keydown", (e) => {
		if (e.key === "Escape" && header.classList.contains("menu-open") && !header.querySelector(".nav-dd[open]")) {
			set(false);
			btn.focus();
		}
	});
})();

// The navbar's Editors trial dropdown: close on Escape or an outside click; show the current page when opened.
(() => {
	const dd = document.querySelector("#brand .nav-dd");
	if (!dd) return;
	dd.addEventListener("toggle", () => {
		if (dd.open) dd.querySelector(".nav-panel a.on")?.scrollIntoView({ block: "nearest" });
	});
	document.addEventListener("click", (e) => {
		if (dd.open && !dd.contains(e.target)) dd.open = false;
	});
	document.addEventListener("keydown", (e) => {
		if (e.key === "Escape" && dd.open) {
			dd.open = false;
			dd.querySelector("summary")?.focus();
		}
	});
})();

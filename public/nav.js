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

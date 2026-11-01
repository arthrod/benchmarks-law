import { describe, expect, it } from "vitest";
import { contentsList, headingSlug, inlineFigures, prepareMarkdown, toBase64 } from "../src/lib/liveDocx";

describe("headingSlug", () => {
	it("follows the GitHub rule jubarte bookmarks headings with", () => {
		expect(headingSlug("Second part")).toBe("second-part");
		expect(headingSlug("5.3 SmartArt — Word's band")).toBe("53-smartart--words-band");
		expect(headingSlug("The `w14` namespace")).toBe("the-w14-namespace");
		expect(headingSlug("**Bold** and [a link](https://x.y)")).toBe("bold-and-a-link");
	});
});

describe("contentsList", () => {
	const md = "# Title\n\nIntro.\n\n## First\n\n```\n## not a heading\n```\n\n### Sub\n\n## First\n";
	it("lists the H2 headings, skips code, and numbers repeats as GitHub does", () => {
		expect(contentsList(md)).toBe("**Contents**\n\n- [First](#first)\n- [First](#first-1)\n");
	});
	it("is empty when there is no H2", () => {
		expect(contentsList("# Only a title\n\ntext\n")).toBe("");
	});
});

describe("inlineFigures", () => {
	it("replaces every figure path with a data: URI and leaves data: images alone", async () => {
		const seen: string[] = [];
		const md = "![a](/editors-trial/figures/x.png)\n\n![b](data:image/png;base64,AA==)\n\n![c](/editors-trial/figures/y.jpg)";
		const out = await inlineFigures(md, async (src) => {
			seen.push(src);
			return new Uint8Array([1, 2, 3]);
		});
		expect(seen).toEqual(["/editors-trial/figures/x.png", "/editors-trial/figures/y.jpg"]);
		expect(out).toBe("![a](data:image/png;base64,AQID)\n\n![b](data:image/png;base64,AA==)\n\n![c](data:image/jpeg;base64,AQID)");
	});
	it("keeps the alt text when a figure cannot be loaded", async () => {
		expect(await inlineFigures("![lost](/f/z.png)", async () => null)).toBe("lost");
	});
});

describe("prepareMarkdown", () => {
	it("puts the contents under the title", async () => {
		const out = await prepareMarkdown("# T\n\nDek.\n\n## A\n\nx\n", async () => null);
		expect(out).toBe("# T\n\n**Contents**\n\n- [A](#a)\n\nDek.\n\n## A\n\nx\n");
	});
});

describe("toBase64", () => {
	it("encodes bytes past the 64 KiB argument limit of String.fromCharCode", () => {
		const big = new Uint8Array(200_000).fill(65);
		expect(toBase64(big)).toBe(Buffer.from(big).toString("base64"));
	});
});

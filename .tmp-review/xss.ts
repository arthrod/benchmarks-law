import { renderMarkdown } from "../src/lib/reports";
const payloads: [string, string][] = [
	["inline html", 'hi <script>alert(1)</script>'],
	["img onerror", '<img src=x onerror="alert(1)">'],
	["block html", '<div onclick="alert(1)">x</div>'],
	["js link", '[x](javascript:alert(1))'],
	["js link mixed case", '[x](JaVaScRiPt:alert(1))'],
	["js link with tab entity", '[x](java&#09;script:alert(1))'],
	["js link with newline entity", '[x](java&#10;script:alert(1))'],
	["js link leading space", '[x](  javascript:alert(1))'],
	["js link with tab char", '[x](java\tscript:alert(1))'],
	["vbscript", '[x](vbscript:msgbox(1))'],
	["data uri", '[x](data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==)'],
	["title attr inject", '[x](https://e.com " onmouseover="alert(1) x=")'],
	["title quote", '[x](https://e.com \'onmouseover=alert(1)\')'],
	["img title inject", '![alt](https://e.com/a.png " onerror="alert(1))'],
	["angle bracket url", '[x](<javascript:alert(1)>)'],
	["protocol relative", '[x](//evil.example/x)'],
	["svg onload", '<svg/onload=alert(1)>'],
	["iframe", '<iframe src="javascript:alert(1)"></iframe>'],
	["style", '<style>body{background:url("javascript:alert(1)")}</style>'],
	["a href entity js", '[x](&#106;avascript:alert(1))'],
	["autolink", 'javascript:alert(1)'],
	["raw html in table", '| a |\n|---|\n| <b>bold</b> |'],
	["comment", '<!--[if IE]><script>alert(1)</script><![endif]-->'],
	["form", '<form action="javascript:alert(1)"><input type=submit></form>'],
];
for (const [name, md] of payloads) {
	const { html } = renderMarkdown(md);
	const danger = /<\s*(script|iframe|object|embed|svg|form|style)/i.test(html) ||
		/onerror|onload|onclick|onmouseover/i.test(html) ||
		/href="javascript:/i.test(html) || /src="javascript:/i.test(html) ||
		/href="&#106;|href="&amp;#106;/i.test(html);
	console.log(`${danger ? "!!! DANGER" : "ok   "} ${name.padEnd(26)} ${html.replace(/\n/g, " ").slice(0, 190)}`);
}

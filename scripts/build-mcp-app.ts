import { $ } from 'bun';
import { mkdir, rm } from 'node:fs/promises';

// builds the MCP app view into one self-contained HTML document and writes it where the server can
// import it. the host receives that document as the ui:// resource, so nothing may stay external:
// script and stylesheet are inlined, and no font or image is fetched at runtime.

const ROOT = new URL('..', import.meta.url).pathname;
const ENTRY = `${ROOT}src/features/mcp-app/view/index.tsx`;
const STYLESHEET = `${ROOT}src/features/mcp-app/view/view.css`;
const OUTPUT = `${ROOT}src/features/mcp-app/generated/mcp-app.json`;
const WORK = `${ROOT}.mcp-app-build`;

// an inline script ends at the first literal </script; the sequence only ever occurs inside a
// string literal in bundled code, where the escaped form means exactly the same thing
function inlineSafe(script: string): string {
	return script.replaceAll('</script', String.raw`<\/script`);
}

function document(script: string, styles: string): string {
	return `<!doctype html>
<html lang="de">
	<head>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
		<title>Events und Einladungen</title>
		<style>${styles}</style>
	</head>
	<body>
		<div id="root"></div>
		<script type="module">${inlineSafe(script)}</script>
	</body>
</html>
`;
}

async function buildScript(): Promise<string> {
	const built = await Bun.build({
		define: { 'process.env.NODE_ENV': '"production"' },
		entrypoints: [ENTRY],
		minify: true,
		target: 'browser',
	});

	if (!built.success) {
		throw new AggregateError(built.logs, 'Das Bundle der MCP App konnte nicht gebaut werden.');
	}

	return await built.outputs[0]!.text();
}

async function buildStyles(): Promise<string> {
	await mkdir(WORK, { recursive: true });
	await $`bun x @tailwindcss/cli --input ${STYLESHEET} --output ${WORK}/view.css --minify`.quiet();

	return await Bun.file(`${WORK}/view.css`).text();
}

const [script, styles] = await Promise.all([buildScript(), buildStyles()]);
const html = document(script, styles);

await rm(WORK, { force: true, recursive: true });
await mkdir(`${ROOT}src/features/mcp-app/generated`, { recursive: true });
await Bun.write(OUTPUT, `${JSON.stringify({ html }, null, '\t')}\n`);

console.log(`mcp app: ${(html.length / 1024).toFixed(1)} kB html → src/features/mcp-app/generated/mcp-app.json`);

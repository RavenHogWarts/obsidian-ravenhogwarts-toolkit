import esbuild from "esbuild";
import process from "process";
import builtins from "builtin-modules";
import fs from "fs";
import path from "path";

const banner =
`/*
THIS IS A GENERATED/BUNDLED FILE BY ESBUILD
if you want to view the source, please visit the github repository of this plugin
*/
`;

const prod = (process.argv[2] === "production");

const renamePlugin = () => ({
	name: "rename-plugin",
	setup(build) {
		build.onEnd(async (result) => {
			const file = build.initialOptions.outfile;
			const parent = path.dirname(file);
			const cssFileName = parent + "/main.css";
			const newCssFileName = parent + "/styles.css";
			try {
				fs.renameSync(cssFileName, newCssFileName);
			} catch (e) {
				console.error("Failed to rename file:", e);
			}
		});
	},
});

const context = await esbuild.context({
	banner: {
		js: banner,
	},
	entryPoints: ["src/main.ts"],
	bundle: true,
	plugins: [renamePlugin()],
	external: [
		"obsidian",
		"electron",
		"@codemirror/autocomplete",
		"@codemirror/collab",
		"@codemirror/commands",
		"@codemirror/language",
		"@codemirror/lint",
		"@codemirror/search",
		"@codemirror/state",
		"@codemirror/view",
		"@lezer/common",
		"@lezer/highlight",
		"@lezer/lr",
		...builtins],
	format: "cjs",
	target: "es2018",
	logLevel: "info",
	sourcemap: prod ? false : "inline",
	treeShaking: true,
	outfile: "main.js",
	minify: prod,
	drop: prod ? ["console"] : [],
});

if (prod) {
	await context.rebuild();
	process.exit(0);
} else {
	await context.watch();
}
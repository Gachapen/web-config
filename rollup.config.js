import path from "path";
import pkg from "./package.json";
import {isProd, isServe, isLibrary, defaultOutputConfig, defaultPlugins, defaultServePlugins, defaultProdPlugins, defaultExternals} from "./src/lib/create-rollup-config.js";

const folders = {
	dist: path.resolve(__dirname, "dist"),
	src: path.resolve(__dirname, "src/demo"),
	src_assets: path.resolve(__dirname, "src/demo/assets"),
	dist_assets: path.resolve(__dirname, "dist/assets")
};

const files = {
	main: path.join(folders.src, "main.ts"),
	src_index: path.join(folders.src, "index.html"),
	dist_index: path.join(folders.dist, "index.html")
};

export default {
	input: {
		main: files.main
	},
	output: [
		defaultOutputConfig({
			format: "esm",
			dist: folders.dist
		})
	],
	plugins: [
		...defaultPlugins({
			dist: folders.dist,
			scssGlobals: ["main.scss"],
			resources: [[folders.src_assets, folders.dist_assets]],
			htmlTemplateConfig: {
				template: files.src_index,
				target: files.dist_index,
				include: /main-.*\.js$/
			}
		}),

		// Serve
		...(isServe ? [
			...defaultServePlugins({
				port: 1338,
				dist: folders.dist
			})
		] : []),

		// Production
		...(isProd ? [
			...defaultProdPlugins({
				dist: folders.dist
			})
		] : [])

	],
	external: [
		...(isLibrary ? [
			...defaultExternals(pkg)
		] : [])
	],
	experimentalCodeSplitting: true,
	treeshake: isProd,
	context: "window"
}
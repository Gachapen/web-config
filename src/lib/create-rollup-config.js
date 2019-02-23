import ts from "@wessberg/rollup-plugin-ts";
import autoprefixer from "autoprefixer";
import cssnano from "cssnano";
import path from "path";
import precss from 'precss';
import cleaner from 'rollup-plugin-cleaner';
import commonjs from 'rollup-plugin-commonjs';
import json from 'rollup-plugin-json';
import license from "rollup-plugin-license";
import resolve from 'rollup-plugin-node-resolve';
import progress from 'rollup-plugin-progress';
import serve from 'rollup-plugin-serve'
import {terser} from "rollup-plugin-terser";
import visualizer from 'rollup-plugin-visualizer';
import {copy} from './rollup-plugins/copy/rollup-plugin-copy'
import {compress} from "./rollup-plugins/compress/rollup-plugin-compress";
import {htmlTemplate} from "./rollup-plugins/html-template/rollup-plugin-html-template";
import {importStyles} from "./rollup-plugins/import-styles/rollup-plugin-import-styles";
import {livereload} from './rollup-plugins/live-reload/rollup-plugin-livereload'
import {minifyLitHTML} from "./rollup-plugins/minify-lit-html/rollup-plugin-minify-lit-html";
import {replace} from "./rollup-plugins/replace/rollup-plugin-replace";
import {budget} from "./rollup-plugins/budget/rollup-plugin-budget";

// Information about the environment.
export const isProd = process.env.NODE_ENV === "prod" || process.env.NODE_ENV === "production";
export const isDev = process.env.NODE_ENV === "dev" || process.env.NODE_ENV === "development";
export const isLibrary = process.env.NODE_ENV === "lib" || process.env.NODE_ENV === "library";
export const isServe = process.env.ROLLUP_WATCH || false;

/**
 * Returns the config or an empty default.
 * @param config
 * @returns {*|{}}
 */
const configOrDefault = (config) => {
	return config || {}
};

/**
 * The default scss plugins.
 */
export const postcssPlugins = [
	precss(),
	autoprefixer(),

	...(isProd ? [
		// Currently there's an issue with nested calcs and custom variables.
		// It can be reproduces by entering the following in https://cssnano.co/playground/: font-size: calc(var(--padding, calc(24 * var(--base-size, 1px))) + 1);
		// cssnano uses the following postcss plugins: https://cssnano.co/guides/optimisations.
		// https://cssnano.co/optimisations/calc is therefore probably the cause for this issue.
		// Read here for configuration: https://cssnano.co/guides/presets
		cssnano({preset: ["default", {
			calc: false
		}]})
	] : [])
];

/**
 * Default configuration for the output.
 */
export const defaultOutputConfig = (config = {}) => {
	// format: (system, amd, cjs, esm, iife, umd)
	return {
		entryFileNames: "[name]-[hash].js",
		chunkFileNames: "[name]-[hash].js",
		sourcemap: true,
		...configOrDefault(config)
	}
};

/**
 * Default plugins for resolve.
 **/
export const defaultResolvePlugins = ({importStylesConfig, jsonConfig, resolveConfig, tsConfig, commonjsConfig, replaceConfig} = {}) => [

	// Teaches Rollup what files should be replaced
	replace({
		...configOrDefault(replaceConfig)
	}),

	// Teaches Rollup how to find external modules
	resolve({
		module: true,
		browser: true,
		jsnext: true,
		main: false,
		modulesOnly: false,
		...configOrDefault(resolveConfig)
	}),

	// Teaches Rollup how to import styles when using the "import css from "./styles.scss" syntax.
	importStyles({
		plugins: postcssPlugins,
		...configOrDefault(importStylesConfig)
	}),

	// Teaches Rollup how to import json files
	json({
		preferConst: true,
		compact: true,
		...configOrDefault(jsonConfig)
	}),

	// Teaches Rollup how to transpile Typescript
	// https://github.com/wessberg/rollup-plugin-ts
	ts({
		transpiler: "babel",
		...configOrDefault(tsConfig)
	}),

	// At the moment, the majority of packages on NPM are exposed as CommonJS modules
	commonjs({
		include: "**/node_modules/**",
		...configOrDefault(commonjsConfig)
	})
];

/**
 * Default configuration for the plugins that runs every time the bundle is created.
 */
export const defaultPlugins = ({cleanerConfig, copyConfig, importStylesConfig, jsonConfig, htmlTemplateConfig, resolveConfig, progressConfig, tsConfig, commonjsConfig, replaceConfig} = {}) => [

	// Shows a progress indicator while building
	progress({
		...configOrDefault(progressConfig)
	}),

	// Cleans the dist folder to get rid of files from the previous build
	cleaner({
		...configOrDefault(cleanerConfig)
	}),

	...defaultResolvePlugins({
		importStylesConfig,
		jsonConfig,
		resolveConfig,
		tsConfig,
		commonjsConfig,
		replaceConfig
	}),

	// Copies resources
	copy({
		...configOrDefault(copyConfig)
	}),

	// Creates a HTML template with the injected scripts from the entry points
	htmlTemplate({
		...configOrDefault(htmlTemplateConfig)
	})
];

/**
 * Default plugins that only run when the bundle is being served.
 */
export const defaultServePlugins = ({dist, serveConfig, livereloadConfig} = {}) => [

	// Serves the application files
	serve({
		open: true,
		port: 1337,
		historyApiFallback: true,
		host: "localhost",
		headers: {
			"Access-Control-Allow-Origin": "*",
		},
		...(dist != null ? {contentBase: dist} : {}),
		...configOrDefault(serveConfig)
	}),

	// Reloads the page when run in watch mode
	livereload({
		...(dist != null ? {watch: dist} : {}),
		...configOrDefault(livereloadConfig)
	})
];

/**
 * Default plugins that only run when the bundle is being created in prod mode.
 */
export const defaultProdPlugins = ({dist, minifyLitHtmlConfig, licenseConfig, terserConfig, budgetConfig, visualizerConfig, gzipConfig: compressConfig} = {}) => [

	// Minifies the lit-html files
	minifyLitHTML({
		...configOrDefault(minifyLitHtmlConfig)
	}),

	// Collects all the license files
	license({
		sourcemap: true,
		...(dist != null ? {thirdParty: {output: path.join(dist, "licenses.txt")}} : {}),
		...configOrDefault(licenseConfig)
	}),

	// Minifies the code
	terser({
		...configOrDefault(terserConfig)
	}),

	// Prints the budget and sizes of the files to the console
	budget({
		...configOrDefault(budgetConfig)
	}),

	// Create a HTML file visualizing the size of each module
	visualizer({
		sourcemap: true,
		...(dist != null ? {filename: path.join(dist, "stats.html")} : {}),
		...configOrDefault(visualizerConfig)
	}),

	// Compresses all of the files
	compress({
		...configOrDefault(compressConfig)
	})
];

/**
 * Default external dependencies.
 */
export const defaultExternals = (pkg = {}) => [
	...Object.keys(configOrDefault(pkg.dependencies)),
	...Object.keys(configOrDefault(pkg.devDependencies))
];
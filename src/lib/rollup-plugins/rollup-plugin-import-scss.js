import MagicString from "magic-string";
import path from "path";
import postcss from "postcss";

/**
 * Default configuration for the import SCSS plugin.
 * @type {{plugins: Array, extensions: string[]}}
 */
const defaultConfig = {

	// Postcss plugins.
	plugins: [],

	// File types handled by this plugin.
	extensions: [".css", ".scss"],

	// Global files that are injected into the DOM.
	globals: []
};

/**
 * Overwrites the css file with "export default".
 * @param css
 * @returns {string}
 */
function exportDefaultOverwrite (css) {
	return `export default \`${css}\``;
}

/**
 * Overwrites the css file with a global inject into the head.
 * @param css
 * @returns {string}
 */
function exportGlobalOverwrite (css) {
	return `
		const css = \`${css}\`;
		const $styles = document.createElement("style");
		$styles.innerText = css;
		document.head.appendChild($styles);
		export default css;
	`;
}

/**
 * Processes a SCSS file by running it through a processor and generating the code and its corresponding sourcemap.
 * @param code
 * @param id
 * @param processor
 * @param overwrite
 * @returns {Promise<{code: string, map: string}>}
 */
function processFile ({code, id, processor, overwrite}) {
	return new Promise(res => {

		// The magic strings cannot handle empty code, therefore we already abort now.
		if (code.trim() === "") {
			return res({
				code: overwrite("")
			});
		}

		const container = new MagicString(code);
		const processOptions = {from: id, to: id, map: {inline: false, annotation: false}};

		processor.process(container.toString(), processOptions).then(result => {
			const css = result.css;
			container.overwrite(0, container.length(), overwrite(css));
			res({
				code: container.toString(),
				map: container.generateMap()
			})
		});
	});
}

/**
 * A Rollup plugin that makes it possible to import SCSS and CSS files using the "import css from 'styles.scss'" syntax.
 * @param config
 * @returns {{name: string, resolveId: resolveId, transform: transform}}
 */
export default function importSCSS (config = defaultConfig) {
	const {plugins, extensions, globals} = {...defaultConfig, ...config};

	// Determines whether the file should be handled by the plugin or not.
	const filter = (id) => extensions.find(ext => id.endsWith(ext)) != null;

	// Determines whether the file is global or not
	const isGlobal = (id) => globals.find(name => id.endsWith(name)) != null;

	// Create the postcss processor based on the plugins.
	const processor = postcss(plugins);

	return {
		name: 'importSCSS',
		resolveId: (id, importer) => {
			if (!importer || !filter(id)) return;
			return path.resolve(path.dirname(importer), id);
		},
		transform: (code, id) => {
			if (!filter(id)) return;

			if (isGlobal(id)) {
				console.log(`"${code}"`);
				return processFile({code, id, processor, overwrite: exportGlobalOverwrite});
			}

			return processFile({code, id, processor, overwrite: exportDefaultOverwrite});
		}
	}
};
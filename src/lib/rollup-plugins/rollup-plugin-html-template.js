import {readFile} from 'fs';
import fse from "fs-extra";
import {createFilter} from 'rollup-pluginutils';
import colors from "colors";

/**
 * Default configuration for the html template plugin.
 * Note that both template and target are required.
 * @type {{template: null, target: null}}
 */
const defaultConfig = {

	// HTML template (needs to contain a body tag)
	template: null,

	// The target destination for the generated file
	target: null,

	verbose: true,
	include: [],
	exclude: [],
	scriptType: "module"
};

/**
 * Injects the sources for the bundle entrypoints and generates a HTML file.
 * Inspired by https://github.com/bengsfort/rollup-plugin-generate-html-template/blob/master/src/index.js
 * @param bundle
 * @param template
 * @param target
 * @param filter
 * @param scriptType
 * @param verbose
 * @param include
 * @param exclude
 * @returns {Promise<any>}
 */
function generateFile ({bundle, template, target, filter, scriptType, verbose, include, exclude}) {
	return new Promise((res, rej) => {
		readFile(template, (err, buffer) => {

			// If the file could not be read, abort!
			if (err) {
				return rej(err);
			}

			// Convert the buffer into a string
			const template = buffer.toString("utf8");

			// Grab the index of the body close tag
			const bodyCloseTagIndex = template.lastIndexOf('</body>');

			// Grab fileNames of the entry points
			const unfilteredFilenames = Object.entries(bundle).map(([key, value]) => value.fileName);
			const fileNames = unfilteredFilenames.filter(name => filter(name));

			// Error handling
			if (verbose && fileNames.length === 0) {
				console.log(colors.yellow(`[htmlTemplate] - No files were included in the "${target}" file. Make sure to specify the files that should be included using the include option. Currently the include option has been set to "${include}" and the exclude option to "${exclude}". The filenames passed to the plugin are "${unfilteredFilenames.join(", ")}"\n`));
			}

			// TODO: Make it so the script type is based on the module type (eg. type="module", type="text/javascript" nomodule etc).

			// Inject the script tag before the body close tag.
			const html = [
				template.slice(0, bodyCloseTagIndex),
				...fileNames.map(filename => `<script src="${filename}" type="${scriptType}"></script>\n`),
				template.slice(bodyCloseTagIndex, template.length)
			].join('');

			// Write the injected template to a file.
			try {
				fse.outputFileSync(target, html);
				res();

			} catch (err) {
				rej(err);
			}
		})
	});
}

/**
 * A Rollup plugin that injects the bundle entry points into a HTML file.
 * @param config
 * @returns {{name: string, generateBundle: (function(*, *, *): Promise<any>)}}
 */
export function htmlTemplate (config = defaultConfig) {
	const {template, target, include, exclude, scriptType, verbose} = {...defaultConfig, ...config};
	const filter = createFilter(include, exclude);

	// Throw error if neither the template nor the target has been defined
	if (template == null || target == null) {
		throw new Error(`The htmlTemplate plugin needs both a template and a target`);
	}

	return {
		name: 'htmlTemplate',
		generateBundle: (outputOptions, bundle, isWrite) => {
			if (!isWrite) return;
			return generateFile({bundle, template, target, filter, scriptType, verbose, include, exclude});
		},
	}
}
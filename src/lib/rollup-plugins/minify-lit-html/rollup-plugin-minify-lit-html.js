import * as escodegen from "escodegen";
import * as esprima from "esprima";
import * as estraverse from "estraverse";
import * as htmlMinifier from "html-minifier";
import path from "path";
import {createFilter} from "rollup-pluginutils";
import {emptySourcemap} from "../util.js";
import colors from "colors";

/**
 * #########################################
 * Parts of this code is heavily inspired by https://github.com/edge0701/minify-lit-html-loader.
 * The license has therefore been included.
 * #########################################
 */

/**
 * The default configuration for the minify-lit-html plugin.
 * @type {{include: RegExp[], exclude: Array, esprima: {sourceType: string, loc: boolean, range: boolean}, htmlMinifier: {caseSensitive: boolean, collapseWhitespace: boolean, minifyCSS: boolean, preventAttributesEscaping: boolean, removeComments: boolean, ignoreCustomFragments: RegExp[]}}}
 */
const defaultConfig = {
	include: [/\.js$/, /\.ts$/],
	exclude: [],
	verbose: true,
	esprima: {
		attachComment: false,
		loc: true,
		range: true,
		tolerant: true,
		tokens: false
	},
	htmlMinifier: {
		caseSensitive: true,
		minifyCSS: false, /* Should be set as true, but the HTML minifier won't allow the <style>${css}</style> syntax, so I disabled it */
		preventAttributesEscaping: true,
		preserveLineBreaks: false,
		collapseWhitespace: true,
		conservativeCollapse: true,
		removeComments: true,
		ignoreCustomFragments: [
			/<\s/,
			/<=/,
			/\$\{/,
			/\}/,
			/* The HTML minifier won't parse parts with double quote inside (eg. @click="${() => alert("Hello World")}") */
			/"\${[^}]+"[^}]+}"/
		]
	}
};

/**
 * Creates a transformer that traverses an ast, minifying the html`...` parts from lit-html.
 * This function is heavily inspired by https://github.com/edge0701/minify-lit-html-loader/blob/master/src/index.ts.
 * @param code
 * @param config
 * @returns {function(*=): *}
 */
function createTransformer ({code, config}) {
	const chunks = code.split("");
	return (ast) => {
		return estraverse.replace(ast, {
			enter: (node) => {

				// If the node type is a TaggedTemplateExpression we know we are looking at a TemplateResult.
				if (node.type === "TaggedTemplateExpression") {

					// If the tag name or property name is html we know we are looking at a html`...` part.
					if ((node.tag.type === "Identifier" && node.tag.name === "html")
						|| (node.tag.type === "MemberExpression"
							&& node.tag.property.type === "Identifier"
							&& node.tag.property.name === "html")) {

						// Minify the HTML inside the html tagged template literals.
						const mini = htmlMinifier.minify(
							chunks.slice(node.quasi.range[0] + 1, node.quasi.range[1] - 1).join(''),
							config.htmlMinifier
						);

						// Return the new node
						return {
							...node,
							quasi: {
								...node.quasi,
								quasis: [{
									type: "TemplateElement",
									value: {
										raw: mini
									},
									range: [node.quasi.range[0], mini.length]
								}]
							}
						};
					}
				}
			},
			fallback: "iteration",
		});
	}
}

/**
 * Figures out whether the code is a script type or module type.
 * @param code
 * @returns {string}
 */
function deduceSourceType(code) {
	let type = 'module';

	try {
		esprima.parse(code, { sourceType: 'script' });
		type = 'script';
	} catch (e) {
	}

	return type;
}

/**
 * Processes the code by minifying the html using in the tagged template literals.
 * @param code
 * @param id
 * @param config
 * @returns {Promise<void>}
 */
function processFile ({code, id, config}) {
	return new Promise(res => {

		try {
			// Create transformer that traverses the ast and minifies the html`...` parts.
			const transform = createTransformer({code, config, sourceType: deduceSourceType(code)});

			// Build an ast from the current config
			const ast = esprima.parse(code, config.esprima);

			// Create new ast using the transformer
			const newAst = transform(ast);

			// Regenerate the code based on the new ast.
			const gen = escodegen.generate(newAst, {
				sourceMap: id,
				sourceMapWithCode: true,
				sourceContent: code,
			});

			res({
				code: gen.code,
				map: gen.map.toString(),
			})
		} catch (err) {
			if (config.verbose) {
				console.log(colors.yellow(`[minifyLitHTML] - Could not parse "${err.toString()}" in "${id}"\n`));
			}

			// Sometimes we cannot parse the file. This should however not stop the build from finishing.
			res({
				code,
				map: emptySourcemap
			});
		}
	});
}

/**
 * A Rollup plugin that minifies lit-html templates.
 * @param config
 * @returns {{name: string, resolveId: (function(*=, *=): *), transform: (function(*, *=): Promise<void>)}}
 */
export function minifyLitHTML (config = defaultConfig) {
	const {include, exclude, esprima, htmlMinifier, verbose} = {...defaultConfig, ...config};

	// Generate a filter that determines whether the file should be handled by the plugin or not.
	const filter = createFilter(include, exclude);

	return {
		name: 'minifyLitHTML',
		resolveId: (id, importer) => {
			if (!importer || !filter(id)) return;
			return path.resolve(path.dirname(importer), id);
		},
		transform: (code, id) => {
			if (!filter(id)) return;
			return processFile({code, id, config: {esprima, htmlMinifier, verbose}});
		}
	}
}
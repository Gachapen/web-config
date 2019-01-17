import fse from "fs-extra";
import colors from "colors";

/**
 * Default configuration for the copy plugin.
 * @type {{resources: Array}}
 */
const defaultConfig = {
	resources: [],
	verbose: true,
	overwriteFolder: true
};

/**
 * Plugin that copies resources.
 * @param config
 * @param config
 * @returns {{name: string, generateBundle: generateBundle}}
 */
export function copy (config) {
	const {resources, verbose, overwriteFolder} = {...defaultConfig, ...config};

	return {
		name: "copy",
		generateBundle: async (outputOptions, bundle, isWrite) => {
			if (!isWrite) return;
			for (const [from, to] of resources) {
				try {
					if (overwriteFolder || !fse.existsSync(to)) {
						await fse.copy(from, to);
					}
				} catch (ex) {
					if (verbose) {
						console.log(colors.yellow(`[copy] - The file "${from}" could not be copied to "${to}"\n`, ex.message));
					}
				}
			}

		}
	};
}


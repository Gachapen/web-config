import brotli from "brotli";
import colors from "colors";
import fse from "fs-extra";
import readdir from "recursive-readdir-sync";
import {createFilter} from 'rollup-pluginutils';
import targz from "targz";

// Types of compression algorithms
const Algorithm = {
	GZIP: "gzip",
	BROTLI: "brotli"
};

const defaultConfig = {
	verbose: true,
	gzipOptions: {},
	brotliOptions: {},
	include: [],
	exclude: [],
	algorithms: [Algorithm.GZIP, Algorithm.BROTLI],

	// We need a timeout to make sure all files have been bundled
	timeout: 2000
};

/**
 * Compresses a file using gzip.
 * @param src
 * @param gzipOptions
 * @param verbose
 */
function compressGzip ({src, gzipOptions, verbose}) {
	const dest = `${src}.gz`;
	targz.compress({
		src, dest,
		...gzipOptions
	}, ex => {
		if (verbose && ex != null) {
			console.log(colors.yellow(`[gzip] - Could not compress "${src}" to "${dest}"\n`, ex));
		}
	});
}

/**
 * Compresses a file using brotli.
 * @param src
 * @param brotliOptions
 * @param verbose
 */
function compressBrotli ({src, brotliOptions, verbose}) {
	const buffer = brotli.compress(fse.readFileSync(src), brotliOptions);
	const dest = `${src}.br`;

	fse.appendFile(dest, buffer, (ex) => {
		if (verbose && ex != null) {
			console.log(colors.yellow(`[brotli] - Could not compress "${src}" to "${dest}"\n`, ex));
		}
	});
}

/**
 * Compresses all files in the dist folder.
 * @param config
 * @returns {{name: string, generateBundle: generateBundle}}
 */
export function compress (config) {
	const {verbose, dir, timeout, algorithms, gzipOptions, brotliOptions, include, exclude} = {...defaultConfig, ...config};
	const filter = createFilter(include, exclude);

	return {
		name: "compress",
		generateBundle: async (outputOptions, bundle, isWrite) => {
			if (!isWrite) return;

			// Start the timeout to make sure the rollup bundle and all of the files
			// will be in the target folder when we are compressing.
			setTimeout(() => {

				// Grab the files from the build folder
				const target = dir || outputOptions.dir;
				const files = readdir(target).filter(path => !path.endsWith(".gz") && filter(path));

				// Compress all files
				for (const src of files) {
					if (algorithms.indexOf(Algorithm.GZIP) >= 0) compressGzip({src, gzipOptions, verbose});
					if (algorithms.indexOf(Algorithm.BROTLI) >= 0) compressBrotli({src, verbose, brotliOptions});
				}

				// Tell the user that everything went fine
				if (verbose) {
					console.log(colors.green(`[compress] - Successfully compressed ${files.length} files`));
				}

			}, timeout);
		}
	};
}


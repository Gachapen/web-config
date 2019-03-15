const rimraf = require("rimraf");
const path = require("path");
const fs = require("fs-extra");
const rollup = require('rollup');
const pkg = require("./package.json");

const distPath = "dist/lib";

/**
 * Builds the library.
 * @returns {Promise<void>}
 */
async function postBuild () {

	// Copy the lib files
	await copyFiles("src/lib", distPath, [
		"tsconfig.json",
		"tslint.json",
		"typings.d.ts"
	]);

	// Copy the root files
	await copyFiles("", distPath, [
		".gitignore",
		".npmignore",
		".browserslistrc",
		"README.md",
		"package.json"
	]);
}

/**
 * Copies an array of files.
 * @param inSrc
 * @param outSrc
 * @param files
 * @returns {Promise<void>}
 */
function copyFiles (inSrc, outSrc, files) {
	return new Promise((res, rej) => {
		for (const file of files) {
			copySync(`./${inSrc}/${file}`, `./${outSrc}/${file}`);
		}
		res();
	});
}

/**
 * Copies a file.
 * @param src
 * @param dest
 */
function copySync (src, dest) {
	fs.copySync(path.resolve(__dirname, src), path.resolve(__dirname, dest));
}

postBuild().then(_ => {
	console.log("Done!");
});


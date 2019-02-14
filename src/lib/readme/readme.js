const {readFile} = require("fs");
const fse = require("fs-extra");
const path = require("path");
const {hasKey, getKey, validateObject, replace} = require("./helpers.js");
const {LINE_BREAK} = require("./config.js");
const {
	readmeTitleTemplate,
	titleTemplate,
	licenseTemplate,
	badgesTemplate,
	lineTemplate,
	descriptionTemplate,
	bulletsTemplate,
	sectionTemplate

} = require("./templates.js");

/**
 * Defaults.
 * @type {{PKG_NAME: string, BADGES: *[]}}
 */
const DEFAULTS = {
	PKG_NAME: "package.json",
	REQUIRED_PKG_FIELDS: [
		"name",
		"license",
		"description",
		"readme",
		"readme.ids.npm",
		"readme.ids.github"
	],
	TARGET: path.resolve("README_TEST.md"),
	BADGES: [
		{
			"text": "Downloads per month",
			"url": "https://npmcharts.com/compare/{{ readme.ids.npm }}?minimal=true",
			"img": "https://img.shields.io/npm/dm/{{ readme.ids.npm }}.svg"
		},
		{
			"text": "Dependencies",
			"url": "https://david-dm.org/{{ readme.ids.github }}",
			"img": "https://img.shields.io/david/{{ readme.ids.github }}.svg"
		},
		{
			"text": "NPM Version",
			"url": "https://www.npmjs.com/package/{{ readme.ids.npm }}",
			"img": "https://img.shields.io/npm/v/{{ readme.ids.npm }}.svg"
		},
		{
			"text": "Contributors",
			"url": "https://github.com/{{ readme.ids.github }}/graphs/contributors",
			"img": "https://img.shields.io/github/contributors/{{ readme.ids.github }}.svg"
		}
	],
	LICENSE_URL_MAP: {
		MIT: "https://opensource.org/licenses/MIT"
	},
	BULLETS: [],
	SECTIONS: []
};

const GENERATORS = [
	(pkg => {
		const name = pkg.name;
		return readmeTitleTemplate(name);
	}),
	(pkg => {
		const badges = pkg.readme.badges || DEFAULTS.BADGES;
		return badgesTemplate(badges, pkg);
	}),
	(pkg => {
		const description = pkg.description;
		const demo = pkg.readme.demo;
		const text = pkg.readme.text;
		return descriptionTemplate(description, text, demo);
	}),
	(pkg => {
		const bullets = pkg.readme.bullets || DEFAULTS.BULLETS;
		return bulletsTemplate(bullets);
	}),
	(pkg => {
		const sections = (pkg.readme.sections || DEFAULTS.SECTIONS).map(({content, title}) => {
			content = fse.readFileSync(path.resolve(content)).toString("utf8");
			return {content, title};
		});

		return sections.map(sectionTemplate).join(`${LINE_BREAK}${LINE_BREAK}`);
	}),
	(pkg => {
		const license = pkg.license;
		return licenseTemplate(license, DEFAULTS.LICENSE_URL_MAP);
	})
];

/**
 * Generates a readme.
 * @param pkgName
 * @param generators
 */
function generateReadme (pkgName, generators) {

	// Read the content from the package.json file
	const pkgContent = fse.readFileSync(path.resolve(pkgName)).toString("utf8");

	// Parse the package and validate it
	const pkg = JSON.parse(pkgContent);
	validateObject(pkg, DEFAULTS.REQUIRED_PKG_FIELDS, pkgName);

	// Generate the readme string
	return generators.map(generator => generator(pkg)).join(`${LINE_BREAK}${LINE_BREAK}`);
}

/**
 * Writes a file to a path.
 * @param path
 * @param content
 */
function writeFile (path, content) {
	const stream = fse.createWriteStream(path);

}

// Grab the user arguments
const userArgs = process.argv.slice(2);
const pkgName = userArgs[0] || DEFAULTS.PKG_NAME;

const readme = generateReadme(pkgName, GENERATORS);
console.log(readme);


writeFile(DEFAULTS.TARGET, readme);

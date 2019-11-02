module.exports = {
	"env": {
		"es6": true,
		"browser": true
	},
	"extends": [
		"eslint:recommended",
		"plugin:@typescript-eslint/recommended",
		"prettier",
		"prettier/@typescript-eslint"
	],
	"parser": "@typescript-eslint/parser",
	"plugins": [
		"@typescript-eslint"
	],
	"rules": {
		"@typescript-eslint/no-use-before-define": "off",
		"@typescript-eslint/explicit-function-return-type": "off",
		"@typescript-eslint/no-object-literal-type-assertion": "off",
		"@typescript-eslint/explicit-member-accessibility": "off",
		"@typescript-eslint/no-parameter-properties": "off",
		"@typescript-eslint/no-var-requires": "off",
		"@typescript-eslint/interface-name-prefix": "off",
		"@typescript-eslint/no-unused-vars": "off",
		"@typescript-eslint/ban-types": "off",
		"@typescript-eslint/no-non-null-assertion": "off",
		"@typescript-eslint/prefer-interface": "off",
		"@typescript-eslint/no-empty-interface": "off",
		"no-dupe-class-members": "off"
	}
};

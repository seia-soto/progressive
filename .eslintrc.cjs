module.exports = {
	env: {
		browser: true,
		es2021: true,
	},
	extends: [
		'xo',
	],
	parser: '@typescript-eslint/parser',
	parserOptions: {
		ecmaVersion: 'latest',
		sourceType: 'module',
	},
	plugins: [
		'@typescript-eslint',
	],
	rules: {
		'new-cap': 0,
		camelcase: 0,
		'no-await-in-loop': 0,
		'default-case': 0,
		'no-bitwise': 0,
	},
};

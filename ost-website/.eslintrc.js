module.exports = {
	root: true,
	parser: '@typescript-eslint/parser',
	extends: [
		'eslint:recommended',
		'next/core-web-vitals',
		'plugin:@typescript-eslint/recommended',
		'prettier'
	],
	plugins: ['@typescript-eslint'],
	ignorePatterns: ['*.js'],
	parserOptions: {
		sourceType: 'module',
		ecmaVersion: 2020
	},
	env: {
		es2017: true,
		node: true
	}
};

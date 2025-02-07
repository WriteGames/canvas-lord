const { resolve } = require('node:path');

const project = resolve(__dirname, 'tsconfig.json');
console.log(project);

module.exports = {
	extends: [
		'@vercel/style-guide/eslint/browser',
		'@vercel/style-guide/eslint/node',
		'@vercel/style-guide/eslint/react',
		'@vercel/style-guide/eslint/next',
		'@vercel/style-guide/eslint/typescript',
		'../.eslintrc.cjs',
	].map((config) => require.resolve(config)),
	overrides: [],
	parser: '@typescript-eslint/parser',
	parserOptions: {
		project,
		ecmaVersion: 'latest',
	},
	settings: {
		'import/resolver': {
			typescript: {
				project,
			},
		},
	},
	rules: {},
};

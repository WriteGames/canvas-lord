const { resolve } = require('node:path');

const project = resolve(__dirname, 'tsconfig.json');

module.exports = {
	extends: [
		'@vercel/style-guide/eslint/browser',
		'@vercel/style-guide/eslint/node',
		'@vercel/style-guide/eslint/react',
		'@vercel/style-guide/eslint/next',
		'@vercel/style-guide/eslint/typescript',
		// '../.eslintrc.js',
	].map((config) => require.resolve(config)),
	parser: '@typescript-eslint/parser',
	ignorePatterns: ['node_modules/'],
	parserOptions: {
		project,
		// ecmaVersion: 'latest',
	},
	settings: {
		'import/resolver': {
			typescript: {
				project,
			},
		},
	},
	rules: {
		'react/jsx-no-useless-fragment': 'error',
		'react/jsx-sort-props': 0,
	},
	overrides: [
		{
			files: ['app/**/{head,layout,page}.tsx'],
			rules: {
				'import/no-default-export': 0,
			},
		},
	],
};

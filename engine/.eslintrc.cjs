const { fileURLToPath } = require('node:url');
const { resolve, dirname } = require('node:path');

// const __filename = fileURLToPath(import.meta.url);
// const curDirname = dirname(__filename);

const project = resolve(__dirname, 'tsconfig.json');
// const project = 'tsconfig.json';

const baseESLintConfig = require('../.eslintrc.cjs');

// canvas-lord
module.exports = {
	...baseESLintConfig,
	extends: baseESLintConfig.extends.concat(
		['@vercel/style-guide/eslint/typescript'].map(require.resolve),
	),
	parser: '@typescript-eslint/parser',
	parserOptions: {
		...baseESLintConfig.parserOptions,
		project,
	},
	ignorePatterns: ['**/*.js'],
	rules: {
		...baseESLintConfig.rules,
		'@typescript-eslint/array-type': [
			'error',
			{
				default: 'array-simple',
				readonly: 'array-simple',
			},
		],

		'@typescript-eslint/naming-convention': [
			'error',
			{
				format: ['PascalCase'],
				selector: ['typeLike', 'enumMember'],
			},
		],

		'@typescript-eslint/prefer-for-of': 0,

		// revisit
		'@typescript-eslint/method-signature-style': 0,
		'@typescript-eslint/unified-signatures': 0,
		'@typescript-eslint/no-non-null-assertion': 0,

		'import/order': 0,

		// temporary
		'@typescript-eslint/no-unsafe-declaration-merging': 0,
		'@typescript-eslint/no-shadow': 0,
		'@typescript-eslint/non-nullable-type-assertion-style': 0,
	},
	overrides: [
		{
			files: ['core/CL.ts'],
			rules: {
				'unicorn/filename-case': 'off',
			},
		},
	],
};

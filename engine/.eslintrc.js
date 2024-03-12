const { resolve } = require('node:path');

const project = resolve(process.cwd(), 'src/tsconfig.json');

const baseESLintConfig = require('../.eslintrc');

// canvas-lord
module.exports = {
	...baseESLintConfig,
	extends: baseESLintConfig.extends.concat(
		['@vercel/style-guide/eslint/typescript'].map(require.resolve),
	),
	parserOptions: {
		...baseESLintConfig.parserOptions,
		project,
	},
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

		// temporary
		'@typescript-eslint/no-unsafe-declaration-merging': 0,
		'@typescript-eslint/no-shadow': 0,
		'@typescript-eslint/non-nullable-type-assertion-style': 0,
	},
};

module.exports = {
	extends: [
		'@vercel/style-guide/eslint/browser',
		'@vercel/style-guide/eslint/node',
	].map(require.resolve),
	env: {
		es2022: true,
	},
	parserOptions: {
		ecmaVersion: 'latest',
		sourceType: 'module',
	},
	ignorePatterns: ['node_modules/', 'website/'],
	rules: {
		curly: 0, // ['error', 'multi'],
		'no-bitwise': 0,
		'no-multi-assign': 0,
		'no-implicit-coercion': [
			'error',
			{
				allow: ['~', '+'],
			},
		],

		// Revisit
		'@typescript-eslint/no-confusing-void-expression': 0,

		// Temporary
		'no-console': 0,
		'no-constant-condition': 0,
		'no-extend-native': 0,
		'no-lonely-if': 0,
		'no-unused-vars': 0,
	},
};

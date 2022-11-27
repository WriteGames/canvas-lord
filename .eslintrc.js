module.exports = {
	extends: [
		'@vercel/style-guide/eslint/browser',
		'@vercel/style-guide/eslint/node',
	].map((config) => require.resolve(config)),
	env: {
		es2022: true,
	},
	parserOptions: {
		ecmaVersion: 'latest',
		sourceType: 'script',
	},
	ignorePatterns: ['node_modules/'],
	rules: {
		'curly': 0, // ['error', 'multi'],
		'no-bitwise': 0,
		'no-multi-assign': 0,
		'no-implicit-coercion': [
			'error', {
				allow: ['~', '+'],
			},
		],
		
		// Formatting
		// 'arrow-body-style': 'error',
		'array-bracket-newline': ['error', { multiline: true }],
		'array-bracket-spacing': 'error',
		// 'arrow-parens': 'error',
		'arrow-spacing': 'error',
		'block-spacing': 'error',
		'brace-style': ['error', '1tbs', { allowSingleLine: true }],
		'comma-dangle': ['error', 'always-multiline'],
		'comma-spacing': 'error',
		'comma-style': 'error',
		'computed-property-spacing': 'error',
		'dot-location': ['error', 'property'],
		'eol-last': 'error',
		'func-call-spacing': ['error', 'never'],
		'function-call-argument-newline': ['error', 'consistent'],
		'function-paren-newline': ['error', 'multiline-arguments'],
		'generator-star-spacing': [
			'error', {
				before: false,
				after: true,
			},
		],
		'implicit-arrow-linebreak': 'error',
		'indent': [
			'error', 'tab', {
				SwitchCase: 1,
			},
		],
		'key-spacing': 'error',
		'keyword-spacing': 'error',
		'linebreak-style': ['error', 'windows'],
		'lines-between-class-members': ['error', 'always', { exceptAfterSingleLine: true }],
		// 'max-len': 'error',
		'new-parens': 'error',
		'no-extra-parens': [
			'error', 'all', {
				conditionalAssign: false,
				nestedBinaryExpressions: false,
				returnAssign: false,
			},
		],
		'no-mixed-spaces-and-tabs': 'error',
		'no-multi-spaces': 'error',
		'no-multiple-empty-lines': ['error', { max: 3 }],
		'no-trailing-spaces': [
			'error', {
				skipBlankLines: true,
				ignoreComments: true,
			},
		],
		'no-whitespace-before-property': 'error',
		'object-curly-newline': [
			'error', {
				multiline: true,
				consistent: true,
			},
		],
		'object-curly-spacing': ['error', 'always'],
		'object-property-newline': [
			'error', {
				allowAllPropertiesOnSameLine: true,
			},
		],
		'operator-linebreak': 'error',
		'padded-blocks': ['error', 'never'],
		'quotes': ['error', 'single'],
		'quote-props': ['error', 'consistent-as-needed'],
		'rest-spread-spacing': 'error',
		'semi': ['error', 'always'],
		'semi-spacing': 'error',
		'semi-style': 'error',
		'space-before-blocks': ['error', 'always'],
		'space-before-function-paren': ['error', 'never'],
		'space-in-parens': 'error',
		'spaced-comment': ['error', 'always', { markers: ['/'] }],
		'space-infix-ops': 'error',
		'space-unary-ops': 'error',
		'switch-colon-spacing': 'error',
		'template-curly-spacing': 'error',
		'template-tag-spacing': 'error',
		'wrap-iife': ['error', 'inside'],
		'yield-star-spacing': [
			'error', {
				before: false,
				after: true,
			},
		],
		
		// Temporary
		'no-console': 0,
		'no-constant-condition': 0,
		'no-extend-native': 0,
		'no-lonely-if': 0,
		'no-unused-vars': 0,
	},
};

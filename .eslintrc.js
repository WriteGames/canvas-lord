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
	rules: {}
  }
  
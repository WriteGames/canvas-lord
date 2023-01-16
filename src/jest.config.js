/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'jsdom',
	testEnvironmentOptions: {
		resources: 'usable',
		runScripts: 'dangerously',
	},
	setupFiles: ['jest-canvas-mock'],
};

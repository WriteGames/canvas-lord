import { defineConfig } from 'vitest/config';

// eslint-disable-next-line import/no-default-export -- this is how vite wants it
export default defineConfig({
	test: {
		environment: 'jsdom',
	},
});

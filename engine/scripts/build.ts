import { build } from 'vite';
// @ts-expect-error - we want to import a json file here
import pkg from '../package.json' with { type: 'json' };

const { version } = pkg as { version: string };

await build({
	build: {
		lib: {
			entry: 'bin/main.js',
			formats: ['es'],
			fileName: () => `canvas-lord-${version}.js`,
		},
		minify: false,
		rollupOptions: {
			treeshake: false,
		},
		outDir: 'dist',
		emptyOutDir: true,
	},
});

await build({
	build: {
		lib: {
			entry: 'bin/main.js',
			formats: ['es'],
			fileName: () => `canvas-lord-${version}.min.js`,
		},
		minify: 'esbuild',
		rollupOptions: {
			treeshake: false,
		},
		outDir: 'dist',
		emptyOutDir: false,
	},
});

import fs from 'node:fs';
import path from 'node:path';
import * as prettier from 'prettier';
import { ESLint } from 'eslint';
// eslint-disable-next-line import/no-extraneous-dependencies -- i don't know why we're getting this error
import { globby } from 'globby';

import { createClass, printFile, readTSFile, System } from './shared.js';

const testOutputPath = './out3/boo.ts';

if (true as boolean) {
	// console.log(component, componentName);
	const inDir = `./in`;
	const filePath = path.join(inDir, 'test.ts');
	console.time('readTSFile');
	const fileData = readTSFile(filePath);
	console.timeEnd('readTSFile');
	// const contents = fileData.components.find((c) => c.name === componentName);

	const components = [
		// 'horizontalMovementComponent',
		'testComponent',
	];
	const systems: System[] = [
		// { name: 'horizontalMovementSystem', outputType: 'inline' },
		{ name: 'moveLeftSystem', outputType: 'inline' },
		{ name: 'moveRightSystem', outputType: 'inline' },
		{
			name: 'deleteSelfSystem',
			outputType: 'function',
			alias: 'deleteSelf',
		},
	];

	console.time('createClass');
	const c = createClass(fileData, { name: 'Player', components, systems });
	console.timeEnd('createClass');

	console.time('printFile');
	const output = printFile(c);
	console.timeEnd('printFile');

	// new one
	fs.writeFileSync(testOutputPath, output, 'utf-8');
	console.log('TS: done');
}

if (true as boolean) {
	const eslint = new ESLint({ fix: true });
	const results = await eslint.lintFiles([testOutputPath]);
	await ESLint.outputFixes(results);
	// console.log(results);
	const formatter = await eslint.loadFormatter('stylish');
	const resultText = formatter.format(results);
	console.log(resultText);
}

if (true as boolean) {
	const dir = 'C:\\xampp\\apps\\canvas-lord\\transpiler\\out3';
	const ignorePath = '../.prettierignore';

	const filePaths = await globby(['**/*.{js,ts}'], {
		cwd: dir,
		gitignore: true,
		ignore: [],
		absolute: true,
		dot: true,
	});

	console.log(filePaths);

	await prettier.resolveConfig('../.prettierrc.json');

	await Promise.all(
		filePaths.map(async (filePath) => {
			const fileInfo = await prettier.getFileInfo(filePath, {
				ignorePath,
			});
			if (fileInfo.ignored || fileInfo.inferredParser === null) return;

			console.log(filePath);
			const content = await fs.promises.readFile(filePath, 'utf-8');
			const config = await prettier.resolveConfig(filePath);
			const formatted = await prettier.format(content, {
				...config,
				filepath: filePath,
			});
			console.log(formatted);

			await fs.promises.writeFile(filePath, formatted, 'utf-8');
			console.log(`Formatted: ${filePath}`);
		}),
	);
}

// TODO(bret): Run ESLint
// TODO(bret): Run prettier

/*                                                                  */
/*                                                                  */
/*                            SCENE                                 */
/*                                                                  */
/*                                                                  */

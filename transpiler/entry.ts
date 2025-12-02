import fs from 'node:fs';
import path from 'node:path';
import { select } from '@inquirer/prompts';
import { runTranspile } from './transpile.js';

const projectRoot = path.join(import.meta.dirname);
// const repoRoot = path.join(projectRoot, '..');

const inDir = path.join(projectRoot, 'in');

const items = await fs.promises.readdir(inDir);
const jsonFiles = items.filter((filePath) => filePath.endsWith('.json'));

const selectedFile = await select({
	message: 'Enter your name',
	choices: jsonFiles.map((value) => ({
		name: value,
		value,
	})),

	default: 'tut2.json',
});

const jsonFilePath = path.join(inDir, selectedFile);

// filePath needs to come from JSON
// testOutputPath is brittle
// destDir

await runTranspile({
	jsonFilePath,
	// outDir: path.join(projectRoot, './out3'),
	outDir: path.join('C:\\xampp\\apps\\write-games-blog\\js\\tutorials'),
});

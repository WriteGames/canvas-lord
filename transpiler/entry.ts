import { Command } from 'commander';
import { fileSelector } from 'inquirer-file-selector';
import path from 'node:path';
import { runTranspile } from './transpile.js';

const projectRoot = path.join(import.meta.dirname);
// const repoRoot = path.join(projectRoot, '..');

const inDir = path.join(projectRoot, 'in');

let selectedFile: string | undefined;

const program = new Command();
program.argument('[source]').action((source: string | undefined) => {
	selectedFile = source;
});
program.parse();

let jsonFilePath: string;
if (selectedFile) {
	// TODO(bret): double check to ensure that we're not using an absolute path or relative path, etc
	jsonFilePath = path.join(inDir, selectedFile);
} else {
	const selection = await fileSelector({
		message: 'Select a file or directory:',
		basePath: inDir,
		filter: (item) => item.isDirectory || /\.json$/i.test(item.name),
		type: 'file',
	});

	selectedFile = selection.path;
	jsonFilePath = selectedFile;
}

// filePath needs to come from JSON
// testOutputPath is brittle
// destDir

await runTranspile({
	jsonFilePath,
	outDir: path.join(projectRoot, './out3'),
	// outDir: path.join('C:\\xampp\\apps\\write-games-blog\\js\\tutorials'),
});

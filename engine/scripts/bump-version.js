import fs from 'fs/promises';
import path from 'path';
import readline from 'readline/promises';

const root = '.';

const ignore = [
	path.join(root, 'bin'),
	path.join(root, 'node_modules'),
	path.join(root, 'sandbox', 'tincan-2'),
];

const packageDir = path.join(root, 'package.json');
const packageJson = JSON.parse(await fs.readFile(packageDir, 'utf-8'));

const { version } = packageJson;

const bump = (versionType) => {
	const versionInfo = version.split('.').map(Number);
	++versionInfo[versionType];
	for (let i = versionType + 1; i < 3; ++i) {
		versionInfo[i] = 0;
	}
	return versionInfo.join('.');
};

const nextVersions = [0, 1, 2].map(bump);

console.log(`Current version: ${version}`);
console.log('Next versions:');
nextVersions.forEach((version, i) => console.log(`  ${i + 1}) ${version}`));

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});
let answer;
let validAnswer = false;
while (!validAnswer) {
	answer = await rl.question(
		'\nWhich version would you like to use?\nIndex: ',
	);
	switch (+answer) {
		case 1:
		case 2:
		case 3:
			validAnswer = true;
			break;
		default:
			console.log('Invalid option. Please try again');
	}
}
rl.close();

const nextVersion = nextVersions[answer - 1];
packageJson.version = nextVersion;
const data = JSON.stringify(packageJson, null, '\t');
await fs.writeFile(packageDir, data + '\n');

const comment = `/* Canvas Lord v${nextVersion} */`;

const upgradeTsFile = async (tsFileName) => {
	let contents = await fs.readFile(tsFileName, 'utf8');
	if (contents.startsWith('/*') && !contents.startsWith('/* eslint')) {
		// remove comment
		contents = contents.slice(contents.indexOf('*/') + 2);
		// remove newline
		const rest = contents.slice(contents.indexOf('\n') + 1);
		contents = rest.startsWith('\n') ? rest : '\n' + rest;
	}
	contents = [comment, contents].join('\n');
	await fs.writeFile(tsFileName, contents);
	console.log('Updated ', tsFileName);
};

const handleDir = async (dir) => {
	console.log('handle dir', dir);
	const files = (await fs.readdir(dir)).map((file) => path.join(dir, file));
	const tsFiles = await Promise.all(
		files
			.filter((file) => {
				return (
					file.split('.').at(-1) === 'ts' &&
					!file.includes('.config') &&
					!file.includes('.spec') &&
					!file.includes('.test')
				);
			})
			.map(upgradeTsFile),
	);

	const directories = (
		await Promise.all(
			files.map(async (name) => {
				const stat = await fs.stat(name);
				return {
					name,
					stat,
				};
			}),
		)
	)
		.filter(({ stat }) => stat.isDirectory())
		.map(({ name }) => name)
		.filter((folder) => !ignore.includes(folder));

	await Promise.all(directories.map(handleDir));
};
await handleDir(root);

console.log(`Updated version to ${nextVersion}`);

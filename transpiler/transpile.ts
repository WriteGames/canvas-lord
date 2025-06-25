import { ESLint } from 'eslint';
import fs from 'node:fs';
import path from 'node:path';
import * as prettier from 'prettier';
import { globby } from 'globby';

import tsm, { Project, SyntaxKind } from 'ts-morph';
import type { System } from './shared.js';
import { createClass, printFile, readTSFile } from './shared.js';

const testOutputPath = './out3/boo.ts';

if (true as boolean) {
	// console.log(component, componentName);
	const inDir = `./in`;
	const filePath = path.join(inDir, 'test.ts');

	console.time('project');
	const project = new Project({
		tsConfigFilePath: './tsconfig.json',
	});
	const typeChecker = project.getTypeChecker();
	console.timeEnd('project');

	console.time('addSource');
	project.addSourceFileAtPath(filePath);
	console.timeEnd('addSource');
	console.time('getSource');
	const file = project.getSourceFile(filePath);
	if (!file) throw new Error('file not found');
	console.timeEnd('getSource');

	console.time('fff');
	const fff = file.getExportedDeclarations();
	console.timeEnd('fff');

	console.time('find systems');
	const foundComponents = new Map<string, tsm.ExportedDeclarations>();
	const foundSystems = new Map<string, tsm.ExportedDeclarations>();
	// const exports = ;
	for (const [name, declarations] of fff) {
		for (const decl of declarations) {
			const type = typeChecker.getTypeAtLocation(decl);
			switch (type.getSymbol()?.getName()) {
				case 'IEntityComponentType':
					foundComponents.set(name, decl);
					break;
				case 'IEntitySystem':
					foundSystems.set(name, decl);
					break;
				default:
					break;
			}
		}
	}
	console.timeEnd('find systems');
	console.log(foundComponents.size, foundSystems.size);

	console.time('createSourceFile');
	const sourceFile = project.createSourceFile(testOutputPath, '', {
		overwrite: true,
	});
	console.timeEnd('createSourceFile');

	const components = [
		// 'horizontalMovementComponent',
		'testComponent',
	];
	const systems: System[] = [
		{
			name: 'moveXSystem',
			outputType: 'function',
			alias: 'moveX',
			omitFromOutput: true,
		},
		{ name: 'horizontalMovementSystem', outputType: 'inline' },
		{ name: 'moveRightSystem', outputType: 'inline' },
		{ name: 'moveLeftSystem', outputType: 'inline' },
		{
			name: 'deleteSelfSystem',
			outputType: 'function',
			alias: 'deleteSelf',
		},
	];
	const classData = { name: 'Player', components, systems };

	// create the class
	const entityClass = sourceFile.addClass({
		name: classData.name,
	});

	entityClass.setIsExported(true);
	entityClass.setExtends('Entity');

	// add components
	const componentsToUse = components
		.flatMap((name) => {
			const comp = foundComponents.get(name);
			if (!comp) return null;

			const [obj] = comp.getDescendantsOfKind(
				SyntaxKind.ObjectLiteralExpression,
			);

			// const obj = comp.forEachDescendant((node) => {
			// 	switch (node.getKind()) {
			// 		case SyntaxKind.ObjectLiteralExpression:
			// 			return node;
			// 		default:
			// 			console.log(node.getKind());
			// 			break;
			// 	}
			// 	return undefined;
			// });
			return obj
				.getDescendantsOfKind(SyntaxKind.SyntaxList)
				.flatMap((node) => node.getChildren())
				.filter((n) => n.getKind() === SyntaxKind.PropertyAssignment)
				.map((node) => {
					const children = node.getChildren();

					const name = children[0].getSymbol()?.getName();
					if (!name) throw new Error('could not read name');

					const v = children[2] as tsm.LiteralExpression;
					const numericValue = v
						.asKind(SyntaxKind.NumericLiteral)
						?.getLiteralValue();

					let stringValue = v
						.asKind(SyntaxKind.StringLiteral)
						?.getLiteralValue();
					if (stringValue) {
						stringValue = `"${stringValue}"`;
					}

					// TODO(bret): figure out how to extract this
					const objectValue = v.asKind(
						SyntaxKind.ObjectLiteralExpression,
					);
					if (objectValue) {
						throw new Error('objects are not yet supported');
					}

					// TODO(bret): figure out how to extract this
					const arrayValue = v.asKind(
						SyntaxKind.ArrayLiteralExpression,
					);
					if (arrayValue) {
						throw new Error('arrays are not yet supported');
					}

					const nullValue = v.asKind(SyntaxKind.NullKeyword);
					if (nullValue) return [name, null] as const;

					const undefinedValue = v
						.asKind(SyntaxKind.Identifier)
						?.getSymbol()
						?.getName();

					return [
						name,
						numericValue ??
							stringValue ??
							objectValue ??
							undefinedValue,
					] as const;
				});
		})
		.filter((node) => node !== null);

	console.log(componentsToUse);

	componentsToUse.forEach(([name, value]) => {
		entityClass.addProperty({
			name,
			initializer: JSON.stringify(value),
		});
		console.log(name, value);
	});

	const systemsToUse = systems
		.map((data) => {
			const system = foundSystems.get(data.name);
			if (!system) return null;

			return [data, system] as const;
		})
		.filter((s) => s !== null);

	console.table(systemsToUse);

	const types = ['update', 'render'] as const;
	const update = entityClass.addMethod({
		name: 'update',
		parameters: [{ name: 'input', type: 'Input' }],
		returnType: 'void',
	});

	const addToMethod = (
		method: tsm.MethodDeclaration,
		options: System,
		block: tsm.Block,
	): void => {
		const body = block.getChildAtIndex(1).getText();
		if (options.outputType === 'inline') {
			update.addStatements([body]);
		} else {
			const parameters = [];
			if (body.includes('input.'))
				parameters.push({ name: 'input', type: 'Input' });
			if (!options.omitFromOutput)
				update.addStatements(
					`this.${options.alias}(${parameters.map(({ name }) => name).join(', ')});`,
				);
			entityClass.addMethod({
				name: options.alias,
				statements: [body],
				// TODO(bret): make this more robust
				parameters,
				returnType: 'void',
			});
		}
	};

	systemsToUse.forEach((system) => {
		const methods = system[1].getDescendantsOfKind(
			SyntaxKind.MethodDeclaration,
		);
		methods.forEach((m) => {
			const methodName = m.getChildAtIndex(0).getSymbol()?.getName();
			const blocks = m.getDescendantsOfKind(SyntaxKind.Block);
			switch (methodName) {
				case 'update':
					addToMethod(update, system[0], blocks[0]);
					break;
				case 'render':
					break;
				default:
					throw new Error('invalid method');
			}
		});
	});

	// systemsToUse.forEach(([data]) => {
	// 	// const { name } = data;
	// 	if (data.outputType === 'function') {
	// 		// data.alias

	// 		entityClass.addMethod({
	// 			name: data.alias,
	// 		});
	// 	}
	// });

	// TODO(bret): clean up update()
	entityClass.getMethods().forEach((m) => {
		m.getDescendantsOfKind(SyntaxKind.Identifier).forEach((id) => {
			if (id.getText() === 'entity') {
				id.replaceWithText('this');
				console.log('found an enitty');
			}
		});

		m.getDescendantsOfKind(SyntaxKind.PropertyAccessExpression).forEach(
			(p) => {
				const str = p
					.getChildren()
					.map((c) => c.getText())
					.join('');
				if (str === 'this.component') {
					const varState = p.getFirstAncestorByKind(
						SyntaxKind.VariableStatement,
					);
					console.log('a component');
					varState?.remove();
				}
			},
		);

		// for all thods
		m.getDescendantsOfKind(SyntaxKind.Identifier).forEach((id) => {
			if (id.getText() === 'component') {
				id.replaceWithText('this');
				console.log('found a component');
			}
		});
	});

	// TODO: imports
	sourceFile.addImportDeclaration({
		moduleSpecifier: 'canvas-lord',
		namedImports: ['Entity', 'Input', 'Keys'],
	});

	console.time('save');
	await sourceFile.save();
	console.timeEnd('save');

	// console.log(foundSystems[0][1]);
	//
	// process.exit(0);

	if (false) {
		console.time('readTSFile');
		const fileData = readTSFile(filePath);
		console.timeEnd('readTSFile');
		// const contents = fileData.components.find((c) => c.name === componentName);
		console.log('yo');
		// process.exit(0);

		console.time('createClass');
		const c = createClass(fileData, classData);
		console.timeEnd('createClass');

		console.time('printFile');
		const output = printFile(c);
		console.timeEnd('printFile');

		// new one
		fs.writeFileSync(testOutputPath, output, 'utf-8');
		console.log('TS: done');
	}
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

import { ESLint } from 'eslint';
import fs from 'node:fs';
import path from 'node:path';
import * as prettier from 'prettier';
import { globby } from 'globby';

import tsm, { Project, SyntaxKind } from 'ts-morph';
import type { System } from './shared.js';
import { createClass, printFile, readTSFile } from './shared.js';

const getValue = (initializer: tsm.Expression): unknown => {
	const kind = initializer.getKind();
	switch (kind) {
		case SyntaxKind.NumericLiteral:
			return initializer
				.asKind(SyntaxKind.NumericLiteral)
				?.getLiteralValue();

		case SyntaxKind.StringLiteral:
			return initializer
				.asKind(SyntaxKind.StringLiteral)
				?.getLiteralValue();

		case SyntaxKind.TrueKeyword:
			return true;

		case SyntaxKind.FalseKeyword:
			return false;

		case SyntaxKind.NullKeyword:
			return null;

		case SyntaxKind.ObjectLiteralExpression: {
			const expr = initializer.asKind(SyntaxKind.ObjectLiteralExpression);
			if (!expr) throw new Error('???');
			return traverseObject(expr);
		}

		case SyntaxKind.ArrayLiteralExpression: {
			const arr = initializer.asKind(SyntaxKind.ArrayLiteralExpression);
			if (!arr) throw new Error('???');
			return traverseArray(arr);
		}

		// TODO(bret): revisit this - do we want to resolve these values or what?
		case SyntaxKind.Identifier: {
			const id = initializer.asKind(SyntaxKind.Identifier);
			if (id) {
				const def = id.getDefinitions();
				const v = def[0].getNode().getNextSiblings().at(-1);
				if (!v) throw new Error('???');
				return getValue(v as tsm.Expression);
			}
			return initializer.getText();
		}

		default:
			return initializer.getText();
	}
};

const traverseArray = (arr: tsm.ArrayLiteralExpression): unknown[] => {
	return arr.getElements().map((elem) => getValue(elem));
};

const traverseObject = (obj: tsm.ObjectLiteralExpression): object => {
	const result: Record<string, unknown> = {};
	obj.getProperties().forEach((_prop) => {
		const prop = _prop.asKind(SyntaxKind.PropertyAssignment);
		if (!prop) return;

		const name = prop.getName();
		const initializer = prop.getInitializer();
		if (!initializer) return;

		result[name] = getValue(initializer);
	});
	return result;
};

const testOutputPath = './out3/boo.ts';

console.time('whole thang');

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

	console.time('exported Declaration');
	const exportedDecls = file.getExportedDeclarations();
	console.timeEnd('exported Declaration');

	console.time('find systems');
	const foundComponents = new Map<string, tsm.ExportedDeclarations>();
	const foundSystems = new Map<string, tsm.ExportedDeclarations>();
	// const exports = ;
	for (const [name, declarations] of exportedDecls) {
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
		{ name: 'moveLeftSystem', outputType: 'inline' },
		{ name: 'moveRightSystem', outputType: 'inline' },
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
		isExported: true,
		extends: 'Entity',
	});

	// add components
	const entityProperties = components
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
				.getChildrenOfKind(SyntaxKind.SyntaxList)
				.flatMap((node) => node.getChildren())
				.filter((n) => n.getKind() === SyntaxKind.PropertyAssignment)
				.map((node) => {
					const children = node.getChildren();

					const name = children[0].getSymbol()?.getName();
					if (!name) throw new Error('could not read name');

					const v = children[2] as tsm.LiteralExpression;
					return [name, getValue(v)] as const;
				});
		})
		.filter((node) => node !== null);

	entityProperties.forEach(([name, value]) => {
		entityClass.addProperty({
			name,
			initializer: JSON.stringify(value),
		});
	});

	const systemsToUse = systems
		.map((data) => {
			const system = foundSystems.get(data.name);
			if (!system) return null;

			return [data, system] as const;
		})
		.filter((s) => s !== null);

	console.table(systemsToUse);

	// TODO(bret): Use `types` to generate the methods
	const methodsToUse = [
		{
			name: 'update',
			parameters: [{ name: 'input', type: 'Input' }],
			returnType: 'void',
		} as tsm.MethodDeclarationStructure,
		{
			name: 'render',
			parameters: [
				{ name: 'ctx', type: 'Ctx' },
				{ name: 'camera', type: 'Camera' },
			],
			returnType: 'void',
		} as tsm.MethodDeclarationStructure,
	] as const;

	const nameToMethodMap = new Map(
		methodsToUse.map((m) => [m.name, entityClass.addMethod(m)] as const),
	);

	const addToMethod = (
		method: tsm.MethodDeclaration,
		options: System,
		block: tsm.Block,
	): void => {
		const body = block.getChildAtIndex(1).getText();
		if (options.outputType === 'inline') {
			method.addStatements([body]);
		} else {
			const parameters = [];
			if (body.includes('input.'))
				parameters.push({ name: 'input', type: 'Input' });
			if (!options.omitFromOutput)
				method.addStatements(
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
			if (!methodName) throw new Error('missing method name');
			const blocks = m.getDescendantsOfKind(SyntaxKind.Block);
			const method = nameToMethodMap.get(methodName);
			if (!method) throw new Error('invalid method');
			addToMethod(method, system[0], blocks[0]);
		});
	});

	// TODO(bret): clean up update()
	entityClass.getMethods().forEach((m) => {
		// `entity` -> `this`
		m.getDescendantsOfKind(SyntaxKind.Identifier).forEach((id) => {
			if (id.getText() === 'entity') {
				id.replaceWithText('this');
			}
		});

		// Remove references to `this.component`
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
					varState?.remove();
				}
			},
		);

		// `component` -> `this`
		m.getDescendantsOfKind(SyntaxKind.Identifier).forEach((id) => {
			if (id.getText() === 'component') {
				id.replaceWithText('this');
			}
		});
	});

	// old way of doing imports, keep using `fixMissingImports` until it doesn't work
	if (false as boolean) {
		const imports = file.getImportDeclarations().map((i) => {
			const moduleSpecifier = i.getModuleSpecifier().getLiteralText();
			console.log(moduleSpecifier);
			const namedImports = i.getNamedImports().map((ni) => {
				return ni.getText();
			});
			// TODO(bret): handle `* as Default` case
			return {
				moduleSpecifier,
				namedImports,
			} as const;
		});
		sourceFile.addImportDeclarations(imports);
	}
	sourceFile.fixMissingImports();

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

console.timeEnd('whole thang');

/*                                                                  */
/*                                                                  */
/*                            SCENE                                 */
/*                                                                  */
/*                                                                  */

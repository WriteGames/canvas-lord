/* eslint-disable @typescript-eslint/explicit-function-return-type -- blah */
import type {
	IEntitySystem,
	IEntityComponentType,
} from 'canvas-lord/util/types';
import ts from 'typescript';

export const isExportKeyword = (m: ts.ModifierLike) =>
	m.kind === ts.SyntaxKind.ExportKeyword;

export interface SystemDataFunc {
	args: unknown;
	body: string;
}

export interface SystemDataFuncAcc {
	args: string[];
	body: string[];
}

export interface SystemData {
	update?: SystemDataFunc;
	render?: SystemDataFunc;
}

export type SystemDataType = keyof SystemData;

export type SystemInput =
	| {
			outputType: 'inline';
			system: IEntitySystem;
	  }
	| {
			outputType: 'function';
			alias: string;
			system: IEntitySystem;
	  };

interface PropertyWithType {
	name: string;
	type: string;
	initialValue?: unknown;
}

type ComponentProperty = PropertyWithType;

export interface ComponentDataPropertiesOnly {
	properties: ComponentProperty[];
}

export interface ComponentData {
	name: string;
	content: string;
	type: string;
	properties?: ComponentProperty[];
}

export interface SystemFunc {
	name: string;
	arguments: PropertyWithType[];
	body: string;
}

export interface SystemFunctions {
	update?: SystemFunc;
	render?: SystemFunc;
}

export interface SystemData2 {
	name: string;
	content: string;
	type: string;
	functions: SystemFunctions;
}

interface TSFileData {
	program: ts.Program;
	checker: ts.TypeChecker;
	sourceFile: ts.SourceFile | undefined;
}

const map = new Map<string, TSFileData>();
export const prepareTSFile = (filePath: string) => {
	if (!map.has(filePath)) {
		console.time('program');
		const program = ts.createProgram([filePath], {});
		const checker = program.getTypeChecker();
		const sourceFile = program.getSourceFile(filePath);
		map.set(filePath, { program, checker, sourceFile });
	}
	return map.get(filePath) as TSFileData;
};

export interface ImportData {
	moduleSpecifier: string;
	defaultImport?: string;
	namedImports: string[];
	namespaceImport?: string;
}

export const getFileImports = (filePath: string): ImportData[] => {
	const { sourceFile } = prepareTSFile(filePath);
	if (!sourceFile) throw new Error();

	const imports: ImportData[] = [];

	ts.forEachChild(sourceFile, (node) => {
		if (!ts.isImportDeclaration(node)) return;

		if (!ts.isStringLiteral(node.moduleSpecifier)) return;
		const moduleSpecifier = node.moduleSpecifier.text;

		const importClause = node.importClause;
		const entry: ImportData = {
			moduleSpecifier,
			namedImports: [],
		};

		if (importClause) {
			if (importClause.name) entry.defaultImport = importClause.name.text;

			if (importClause.namedBindings) {
				if (ts.isNamedImports(importClause.namedBindings)) {
					entry.namedImports =
						importClause.namedBindings.elements.map((e) =>
							e.propertyName
								? `${e.propertyName.text} as ${e.name.text}`
								: e.name.text,
						);
				} else if (ts.isNamespaceImport(importClause.namedBindings)) {
					entry.namespaceImport = `* as ${importClause.namedBindings.name.text}`;
				}
			}
		}

		imports.push(entry);
	});

	return imports;
};

export const readTSFile = (filePath: string): FileData => {
	console.time('prepare');
	const { checker, sourceFile } = prepareTSFile(filePath);
	console.timeEnd('prepare');

	if (!sourceFile) throw new Error('oh no');

	const exports: FileData = {
		sourceFile,
		imports: getFileImports(filePath),
		components: [],
		systems: [],
	};

	const saveExport = (
		node: ts.Node,
		name: string,
		symbol: ts.Symbol | undefined,
	) => {
		if (!symbol?.valueDeclaration) return;

		const content = sourceFile.text
			.slice(node.getFullStart(), node.getEnd())
			.trim();

		const type = checker.getTypeOfSymbolAtLocation(
			symbol,
			symbol.valueDeclaration,
		);
		const typeStr = checker.typeToString(type);
		switch (true) {
			case typeStr.startsWith('IEntitySystem'): {
				const s: SystemData2 = {
					name,
					content,
					type: typeStr,
					functions: {},
				};
				s.functions = getSystemContents(exports, name);
				exports.systems.push(s);
				break;
			}
			case typeStr.startsWith('IEntityComponentType'): {
				const c: ComponentData = { name, content, type: typeStr };
				c.properties = getComponentProperties(exports, name);
				exports.components.push(c);
				break;
			}
			default:
				break;
		}
	};

	ts.forEachChild(sourceFile, (node) => {
		if (ts.isVariableStatement(node)) {
			if (!node.modifiers?.some(isExportKeyword)) return;

			node.declarationList.declarations.forEach((decl) => {
				const name = decl.name.getText();
				const symbol = checker.getSymbolAtLocation(decl.name);
				saveExport(node, name, symbol);
			});
		}

		if (ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node)) {
			if (!node.modifiers?.some(isExportKeyword)) return;

			const name = node.name?.text;
			if (!name) return;

			const symbol = checker.getSymbolAtLocation(node.name);
			saveExport(node, name, symbol);
		}
	});

	return exports;
};

// Internals

interface FileData {
	readonly sourceFile: ts.SourceFile;
	readonly imports: ImportData[];
	readonly components: ComponentData[];
	readonly systems: SystemData2[];
}

// TODO(bret): use TOut like the below to get the return type
//  function visitNode<TIn extends Node | undefined, TVisited extends Node | undefined, TOut extends Node>(node: TIn, visitor: Visitor<NonNullable<TIn>, TVisited>, test: (node: Node) => node is TOut, lift?: (node: readonly Node[]) => Node): TOut | (TIn & undefined) | (TVisited & undefined);

const findNode = <T extends ts.Node>(
	root: ts.Node,
	predicate: (node: ts.Node) => boolean,
): T | undefined => {
	if (predicate(root)) return root as T;

	return ts.forEachChild(root, (child) => findNode(child, predicate));
};

const getType = (
	checker: ts.TypeChecker,
	name: ts.PropertyName | ts.BindingName,
): string => {
	const symbol = checker.getSymbolAtLocation(name);
	if (!symbol?.valueDeclaration) throw new Error();

	const type = checker.getTypeOfSymbolAtLocation(
		symbol,
		symbol.valueDeclaration,
	);

	// TODO(bret): Fix this, this is a hack to remove template arguments, but we only want to remove _default_ template arguments
	return type.getSymbol()?.getName() ?? checker.typeToString(type);
};

const getComponentProperties = (
	fileData: FileData,
	componentName: string,
): ComponentProperty[] => {
	const { checker, sourceFile } = prepareTSFile(fileData.sourceFile.fileName);
	if (!sourceFile) throw new Error();

	let compNode: ts.VariableStatement;
	ts.forEachChild(sourceFile, (node) => {
		if (ts.isVariableStatement(node)) {
			const decl = node.declarationList.declarations.find((decl) => {
				return decl.name.getText() === componentName;
			});
			if (!decl) return;

			compNode = node;
		}
	});

	// @ts-expect-error -- we do assign this
	// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- blah
	if (!compNode) return;
	const node = compNode;
	const decl = node.declarationList.declarations.find((decl) => {
		return decl.name.getText() === componentName;
	});
	if (!decl) throw new Error();

	const componentData = findNode(compNode, (node) =>
		ts.isObjectLiteralExpression(node),
	);
	if (!componentData) throw new Error();

	const properties: ComponentProperty[] = [];

	ts.forEachChild(componentData, (prop) => {
		if (!ts.isPropertyAssignment(prop)) return;

		properties.push({
			name: prop.getChildAt(0).getText().trim(),
			type: getType(checker, prop.name),
			initialValue: prop.getChildAt(2).getText().trim(),
		});
	});

	return properties;
};

const getSystemContents = (
	fileData: FileData,
	systemName: string,
): SystemFunctions => {
	const { checker, sourceFile } = prepareTSFile(fileData.sourceFile.fileName);
	if (!sourceFile) throw new Error();

	let systemNode: ts.VariableStatement;
	ts.forEachChild(sourceFile, (node) => {
		if (ts.isVariableStatement(node)) {
			const decl = node.declarationList.declarations.find((decl) => {
				return decl.name.getText() === systemName;
			});
			if (!decl) return;

			systemNode = node;
		}
	});

	// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- blah
	if (!systemNode!) throw new Error();

	const object = findNode(systemNode, (node) =>
		ts.isObjectLiteralExpression(node),
	);
	if (!object) throw new Error();

	const systemFuncs: SystemFunctions = {};

	ts.forEachChild(object, (methodNode) => {
		if (!ts.isMethodDeclaration(methodNode)) return;

		let firstArg = true; // NOTE(bret): we want to skip `entity: Entity`
		const _arguments: PropertyWithType[] = [];
		ts.forEachChild(methodNode, (child) => {
			if (!ts.isParameter(child)) return;
			if (firstArg) {
				firstArg = false;
				return;
			}
			const p: PropertyWithType = {
				name: child.name.getText(),
				type: getType(checker, child.name),
				// initialValue: null,
			};
			_arguments.push(p);
		});

		const block = findNode<ts.Block>(methodNode, (node) =>
			ts.isBlock(node),
		);
		if (!block) throw new Error();

		// TODO(bret): remove entity.component() calls
		// TODO(bret): replace entity. with this.

		const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
		const body = block.statements
			.map((stmt) =>
				printer.printNode(ts.EmitHint.Unspecified, stmt, sourceFile),
			)
			.join('\n');

		const func: SystemFunc = {
			name: methodNode.name.getText(),
			arguments: _arguments,
			body,
		};

		switch (func.name) {
			case 'update':
			case 'render':
				systemFuncs[func.name] = func;
				break;
			default:
				break;
		}

		// console.log(node.name!);
	});

	return systemFuncs;

	// const scope = findNode(systemNode!, (node) => ts.isMethodDeclaration(node));

	// ts.forEachChild(scope, (child) => {
	// 	//
	// });
	// console.log(scope?.getText());

	// switch (systemName) {
	// 	case 'update':
	// 		break;
	// 	case 'render':
	// 		break;
	// 	default:
	// 		console.log({ systemName });
	// 		throw new Error('not a valid system');
	// }
};

export const getComponentFromFile = (
	filePath: string,
	componentName: string,
): ComponentData | null => {
	const component = readTSFile(filePath).components.find(({ name }) => {
		return name === componentName;
	});
	return component ?? null;
};

/** @deprecated old code */
export const parseComponent = (component: IEntityComponentType) => {
	return component.data;
};

function createImportDeclaration(
	namedImports: string[],
	moduleSpecifier: string,
	defaultImport?: string,
	namespaceImport?: string,
): ts.ImportDeclaration {
	let importClause: ts.ImportClause | undefined;

	if (namespaceImport) {
		importClause = ts.factory.createImportClause(
			false,
			undefined,
			ts.factory.createNamespaceImport(
				ts.factory.createIdentifier(namespaceImport.split(' as ')[1]),
			),
		);
	} else {
		const namedBindings =
			namedImports.length > 0
				? ts.factory.createNamedImports(
						namedImports.map((name) => {
							const [orig, alias] = name.split(' as ');
							return ts.factory.createImportSpecifier(
								false,
								alias
									? ts.factory.createIdentifier(orig)
									: undefined,
								ts.factory.createIdentifier(alias || orig),
							);
						}),
					)
				: undefined;

		importClause = ts.factory.createImportClause(
			false,
			defaultImport
				? ts.factory.createIdentifier(defaultImport)
				: undefined,
			namedBindings,
		);
	}

	return ts.factory.createImportDeclaration(
		undefined,
		importClause,
		ts.factory.createStringLiteral(moduleSpecifier),
	);
}

// interface ClassData {
// 	imports: ts.ImportDeclaration[];
// 	body: ts.ClassDeclaration; // | ts.ExportAssignment;
// }

const transformerRemoveComponentDeclarations: ts.TransformerFactory<
	ts.ClassDeclaration
> = (context) => {
	const componentIdentifier = ts.factory.createIdentifier('component');
	return (sourceFile) => {
		const visitor = (node: ts.Node): ts.Node | undefined => {
			if (ts.isVariableStatement(node)) {
				const id = findNode<ts.Identifier>(node, (n) =>
					ts.isIdentifier(n),
				);
				// TODO(bret): Make this more robust
				if (id && id.text === componentIdentifier.text) {
					return undefined;
				}
			}

			return ts.visitEachChild(node, visitor, context);
		};

		const classDeclarationVisitor = (
			classDeclaration: ts.ClassDeclaration,
		): ts.ClassDeclaration => {
			return ts.visitEachChild(classDeclaration, visitor, context);
		};

		return ts.visitNode(
			sourceFile,
			classDeclarationVisitor,
			ts.isClassDeclaration,
		);
	};
};

const transformerReplaceEntity: ts.TransformerFactory<ts.ClassDeclaration> = (
	context,
) => {
	// TODO(bret): make this more robust
	const entityIdentifier = ts.factory.createIdentifier('entity');
	const componentIdentifier = ts.factory.createIdentifier('component');
	return (sourceFile) => {
		const visitor = (node: ts.Node): ts.Node | undefined => {
			// if (
			// 	ts.isPropertyAccessExpression(node) &&
			// 	ts.isIdentifier(node.expression)
			// ) {
			// 	switch (node.expression.text) {
			// 		case entityIdentifier.text:
			// 		case componentIdentifier.text:
			// 			return ts.factory.createPropertyAccessExpression(
			// 				ts.factory.createThis(),
			// 				node.name,
			// 			);
			// 	}
			// }

			if (ts.isIdentifier(node)) {
				let match = false;
				switch (node.text) {
					case entityIdentifier.text:
					case componentIdentifier.text:
						match = true;
						break;
				}

				if (
					match &&
					!ts.isVariableDeclaration(node.parent) &&
					!(
						ts.isPropertyAccessExpression(node.parent) &&
						node.parent.name === node
					)
				) {
					return ts.factory.createThis();
				}
			}

			return ts.visitEachChild(node, visitor, context);
		};

		const classDeclarationVisitor = (
			classDeclaration: ts.ClassDeclaration,
		): ts.ClassDeclaration => {
			return ts.visitEachChild(classDeclaration, visitor, context);
		};

		return ts.visitNode(
			sourceFile,
			classDeclarationVisitor,
			ts.isClassDeclaration,
		);
	};
};

const transformerRemoveUnusedImports: ts.TransformerFactory<ts.SourceFile> = (
	context,
) => {
	return (sourceFile) => {
		const usedIdentifiers = new Set<string>();
		const collectSymbols = (node: ts.Node): void => {
			if (ts.isImportDeclaration(node)) return;

			if (ts.isIdentifier(node)) {
				usedIdentifiers.add(node.text);
			}

			ts.forEachChild(node, collectSymbols);
		};
		collectSymbols(sourceFile);

		const visit = (node: ts.Node): ts.VisitResult<ts.Node> => {
			if (ts.isImportDeclaration(node)) {
				const { importClause } = node;
				if (!importClause) return node;

				const elements: ts.ImportSpecifier[] = [];
				const { namedBindings } = importClause;
				let keepDefault = false;
				if (
					importClause.name &&
					usedIdentifiers.has(importClause.name.text)
				) {
					keepDefault = true;
				}

				if (namedBindings && ts.isNamedImports(namedBindings)) {
					for (const spec of namedBindings.elements) {
						const name = spec.name.text;
						if (usedIdentifiers.has(name)) {
							elements.push(spec);
						}
					}
				}

				const keepSome = keepDefault || elements.length > 0;
				// @ts-expect-error - blah
				if (!keepSome) return undefined;

				const updatedNamedBindings = elements.length
					? ts.factory.updateNamedImports(
							namedBindings as ts.NamedImports,
							elements,
						)
					: undefined;

				const updatedImportClause = ts.factory.updateImportClause(
					importClause,
					importClause.isTypeOnly,
					keepDefault ? importClause.name : undefined,
					updatedNamedBindings,
				);

				return ts.factory.updateImportDeclaration(
					node,
					node.modifiers,
					updatedImportClause,
					node.moduleSpecifier,
					node.assertClause,
				);
			}

			return ts.visitEachChild(node, visit, context);
		};

		return ts.visitNode(sourceFile, visit, ts.isSourceFile);
	};
};

export const createClass = (fileData: FileData): ts.Statement[] => {
	const extendsClass = ts.factory.createIdentifier('Entity');
	const expr = ts.factory.createExpressionWithTypeArguments(
		extendsClass,
		undefined,
	);
	const heritageClause = ts.factory.createHeritageClause(
		ts.SyntaxKind.ExtendsKeyword,
		[expr],
	);

	const properties: ts.ClassElement[] = fileData.components.flatMap((c) => {
		return (
			c.properties?.map((p) => {
				const ref = ts.factory.createTypeReferenceNode(p.type, []);

				const sf = ts.createSourceFile(
					'temp',
					// eslint-disable-next-line @typescript-eslint/no-explicit-any -- okay
					`(${p.initialValue as any})`,
					ts.ScriptTarget.Latest,
					false,
					ts.ScriptKind.TS,
				);

				let expr;
				const stmt = sf.statements[0];
				if (
					ts.isExpressionStatement(stmt) &&
					ts.isParenthesizedExpression(stmt.expression)
				) {
					expr = stmt.expression.expression;
				}

				return ts.factory.createPropertyDeclaration(
					undefined,
					p.name,
					undefined,
					ref,
					expr,
					// ts.factory.createStringLiteral(p.initialValue),
				);
			}) ?? []
		);
	});

	const imports = fileData.imports.map(
		({ namedImports, moduleSpecifier, defaultImport, namespaceImport }) =>
			createImportDeclaration(
				namedImports,
				moduleSpecifier,
				defaultImport,
				namespaceImport,
			),
	);

	const updateStatements: ts.Statement[] = [];
	// const renderStatements: ts.Statement[] = [];

	// TODO(bret): merge params?
	fileData.systems.forEach((system) => {
		const {
			update,
			// render
		} = system.functions;
		if (update) {
			const wrapped = update.body;
			const file = ts.createSourceFile(
				'temp2.ts',
				wrapped,
				ts.ScriptTarget.Latest,
				true,
				ts.ScriptKind.TS,
			);
			updateStatements.push(...file.statements);
		}
	});

	const updateBody = ts.factory.createBlock(updateStatements, true);

	const typeInput = ts.factory.createTypeReferenceNode('Input');
	const param = ts.factory.createParameterDeclaration(
		undefined,
		undefined,
		ts.factory.createIdentifier('input'),
		undefined,
		typeInput, // type
		//
	);

	const _update = ['update', updateBody] as const;
	// const _render = ['render', renderBody] as const;
	const [updateMethod] = [_update].map(([methodName, updateBody]) => {
		return ts.factory.createMethodDeclaration(
			undefined,
			undefined,
			methodName,
			undefined,
			[],
			[param],
			ts.factory.createTypeReferenceNode('void'),
			updateBody,
		);
	});

	const _body = ts.factory.createClassDeclaration(
		[ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
		'MyEntity',
		undefined,
		[heritageClause],
		[...properties, updateMethod],
	);

	const body = ts.transform(_body, [
		transformerRemoveComponentDeclarations,
		transformerReplaceEntity,
	]).transformed[0];

	// const createNewline = () => {
	// 	const id = ts.factory.createIdentifier('__');
	// 	const newlineSpacer = ts.factory.createNotEmittedStatement(id);
	// 	return ts.addSyntheticLeadingComment(
	// 		newlineSpacer,
	// 		ts.SyntaxKind.SingleLineCommentTrivia,
	// 		'',
	// 		true,
	// 	);
	// };

	return [...imports, body];
};

export const printFile = (statements: ts.Statement[]) => {
	const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });

	const _sourceFile = ts.factory.createSourceFile(
		statements,
		ts.factory.createToken(ts.SyntaxKind.EndOfFileToken),
		ts.NodeFlags.None,
	);

	const [sourceFile] = ts.transform(_sourceFile, [
		transformerRemoveUnusedImports,
	]).transformed;

	return printer.printFile(sourceFile);
};

const regexComponentVar =
	/\s*const (?<varName>\w+) = entity\.component\?\.\(\w+\);\n/g;
export const generateTokenRegex = (token: string) => {
	return new RegExp(`([^w])${token}([^w])`, 'g');
};

/** @deprecated old code */
export const parseSystem = (system: IEntitySystem) => {
	return Object.fromEntries(
		Object.entries(system)
			.filter(([_, v]) => typeof v === 'function')
			.map(([k, v]: [k: string, v: () => void]) => {
				const updateStr = v.toString();
				const args = updateStr
					.substring(
						updateStr.indexOf('(') + 1,
						updateStr.indexOf(')'),
					)
					.split(', ');

				const bodyExt = updateStr.substring(
					updateStr.indexOf('{'),
					updateStr.lastIndexOf('}') + 1,
				);
				let body = bodyExt.substring(
					bodyExt.indexOf('\n') + 1,
					bodyExt.lastIndexOf('\n'),
				);
				const vars = [...body.matchAll(regexComponentVar)];
				vars.forEach((v) => {
					if (!v.groups) return;
					body = body
						.replace(v[0], '')
						.replaceAll(v.groups.varName, 'this');
				});
				body = body
					.replaceAll(generateTokenRegex('entity'), '$1this$2')
					.replaceAll(/ {4}/g, '\t');
				return [k, { args, body }];
			}),
	);
};

export const vitestOnly = {
	getComponentProperties,
};

/* eslint-enable @typescript-eslint/explicit-function-return-type -- blah */

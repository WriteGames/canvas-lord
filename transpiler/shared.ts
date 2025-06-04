import type {
	IEntitySystem,
	IEntityComponentType,
} from 'canvas-lord/util/types';
import ts from 'typescript';

export const isExportKeyword = (m: ts.ModifierLike) =>
	m.kind === ts.SyntaxKind.ExportKeyword;

export interface SystemDataFunc {
	args: any;
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
	initialValue?: any;
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

export const prepareTSFile = (filePath: string) => {
	// TODO(bret): Add some sort of caching
	const program = ts.createProgram([filePath], {});
	const checker = program.getTypeChecker();
	const sourceFile = program.getSourceFile(filePath);
	return { program, checker, sourceFile };
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
	const { checker, sourceFile } = prepareTSFile(filePath);

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

/** @deprecated */
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

interface ClassData {
	imports: ts.ImportDeclaration[];
	body: ts.ClassDeclaration; // | ts.ExportAssignment;
}

export const createClass = (fileData: FileData): ClassData => {
	const _body = ts.factory.createClassExpression(
		undefined,
		'MyEntity',
		undefined,
		undefined,
		[],
	);

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
					`(${p.initialValue})`,
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

	const body = ts.factory.createClassDeclaration(
		[ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
		'MyEntity',
		undefined,
		[heritageClause],
		properties,
	);

	return {
		body,
		imports: fileData.imports.map(
			({
				namedImports,
				moduleSpecifier,
				defaultImport,
				namespaceImport,
			}) =>
				createImportDeclaration(
					namedImports,
					moduleSpecifier,
					defaultImport,
					namespaceImport,
				),
		),
	};
};

export const printFile = (statements: ts.Statement[]) => {
	const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
	const sourceFile = ts.factory.createSourceFile(
		statements,
		ts.factory.createToken(ts.SyntaxKind.EndOfFileToken),
		ts.NodeFlags.None,
	);
	return printer.printFile(sourceFile);
};

const regexComponentVar =
	/\s*const (?<varName>\w+) = entity\.component\?\.\(\w+\);\n/g;
export const generateTokenRegex = (token: string) => {
	return new RegExp(`([^\w])${token}([^\w])`, 'g');
};

export const parseSystem = (system: IEntitySystem) => {
	return Object.fromEntries(
		Object.entries(system)
			.filter(([_, v]) => typeof v === 'function')
			.map(([k, v]) => {
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
						.replaceAll(v.groups.varName!, 'this');
				});
				body = body
					.replaceAll(generateTokenRegex('entity'), '$1this$2')
					.replaceAll(/    /g, '\t');
				return [k, { args, body }];
			}),
	);
};

export const vitestOnly = {
	getComponentProperties,
};

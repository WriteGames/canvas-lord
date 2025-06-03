import fs from 'node:fs';

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

export interface Data {
	name: string;
	content: string;
	type: string;
	properties?: ComponentProperty[];
}

export const prepareTSFile = (filePath: string) => {
	const program = ts.createProgram([filePath], {});
	const checker = program.getTypeChecker();
	const sourceFile = program.getSourceFile(filePath);
	return { program, checker, sourceFile };
};

export const readTSFile = (filePath: string): FileData => {
	const { checker, sourceFile } = prepareTSFile(filePath);

	if (!sourceFile) throw new Error('oh no');

	const exports = {
		sourceFile,
		components: [] as Data[],
		systems: [] as Data[],
	} as const;

	if (!sourceFile) return exports;

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
			case typeStr.startsWith('IEntitySystem'):
				exports.systems.push({ name, content, type: typeStr });
				break;
			case typeStr.startsWith('IEntityComponentType'): {
				const c: Data = { name, content, type: typeStr };
				const d = extractComponent({ sourceFile } as FileData, c);
				c.properties = d.properties;
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

	// console.log(exports);

	return exports;
};

// Internals

interface FileData {
	readonly sourceFile: ts.SourceFile;
	readonly components: Data[];
	readonly systems: Data[];
}

// TODO(bret): make sure imports are added to ComponentData as well
interface ComponentProperty {
	name: string;
	type: string;
	initialValue: any;
}

export interface ComponentData {
	properties: ComponentProperty[];
}

const findNode = (
	root: ts.Node,
	predicate: (node: ts.Node) => boolean,
): ts.Node | undefined => {
	if (predicate(root)) return root;

	return ts.forEachChild(root, (child) => findNode(child, predicate));
};

const extractComponent = (fileData: FileData, comp: Data): ComponentData => {
	const { checker, sourceFile } = prepareTSFile(fileData.sourceFile.fileName);
	if (!sourceFile) throw new Error();

	let compNode: ts.VariableStatement;
	ts.forEachChild(sourceFile, (node) => {
		if (ts.isVariableStatement(node)) {
			const decl = node.declarationList.declarations.find((decl) => {
				return decl.name.getText() === comp.name;
			});
			if (!decl) return;

			compNode = node;
		}
	});

	// @ts-expect-error -- we do assign this
	if (!compNode) return;
	const node = compNode;
	const decl = node.declarationList.declarations.find((decl) => {
		return decl.name.getText() === comp.name;
	});
	if (!decl) throw new Error();

	const componentData = findNode(compNode, (node) =>
		ts.isObjectLiteralExpression(node),
	);
	if (!componentData) throw new Error();

	const data: ComponentData = {
		properties: [],
	};

	ts.forEachChild(componentData, (prop) => {
		if (!ts.isPropertyAssignment(prop)) return;

		const symbol = checker.getSymbolAtLocation(prop.name);
		if (!symbol?.valueDeclaration) return;

		const type = checker.getTypeOfSymbolAtLocation(
			symbol,
			symbol.valueDeclaration,
		);

		data.properties.push({
			name: prop.getChildAt(0).getText(sourceFile).trim(),
			type: checker.typeToString(type),
			initialValue: prop.getChildAt(2).getText(sourceFile).trim(),
		});
	});

	return data;
};

export const getComponentFromFile = (
	filePath: string,
	componentName: string,
): ComponentData | null => {
	const fileData = readTSFile(filePath);
	const comp = fileData.components.find(({ name }) => name === componentName);
	if (!comp) return null;

	return extractComponent(fileData, comp);
};

/** @deprecated */
export const parseComponent = (component: IEntityComponentType) => {
	return component.data;
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

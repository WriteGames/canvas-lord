import ts from 'typescript';
export const isExportKeyword = (m) => m.kind === ts.SyntaxKind.ExportKeyword;
export const prepareTSFile = (filePath) => {
    // TODO(bret): Add some sort of caching
    const program = ts.createProgram([filePath], {});
    const checker = program.getTypeChecker();
    const sourceFile = program.getSourceFile(filePath);
    return { program, checker, sourceFile };
};
export const getFileImports = (filePath) => {
    const { sourceFile } = prepareTSFile(filePath);
    if (!sourceFile)
        throw new Error();
    const imports = [];
    ts.forEachChild(sourceFile, (node) => {
        if (!ts.isImportDeclaration(node))
            return;
        if (!ts.isStringLiteral(node.moduleSpecifier))
            return;
        const moduleSpecifier = node.moduleSpecifier.text;
        const importClause = node.importClause;
        const entry = {
            moduleSpecifier,
            namedImports: [],
        };
        if (importClause) {
            if (importClause.name)
                entry.defaultImport = importClause.name.text;
            if (importClause.namedBindings) {
                if (ts.isNamedImports(importClause.namedBindings)) {
                    entry.namedImports =
                        importClause.namedBindings.elements.map((e) => e.propertyName
                            ? `${e.propertyName.text} as ${e.name.text}`
                            : e.name.text);
                }
                else if (ts.isNamespaceImport(importClause.namedBindings)) {
                    entry.namespaceImport = `* as ${importClause.namedBindings.name.text}`;
                }
            }
        }
        imports.push(entry);
    });
    return imports;
};
export const readTSFile = (filePath) => {
    const { checker, sourceFile } = prepareTSFile(filePath);
    if (!sourceFile)
        throw new Error('oh no');
    const exports = {
        sourceFile,
        imports: getFileImports(filePath),
        components: [],
        systems: [],
    };
    const saveExport = (node, name, symbol) => {
        if (!symbol?.valueDeclaration)
            return;
        const content = sourceFile.text
            .slice(node.getFullStart(), node.getEnd())
            .trim();
        const type = checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration);
        const typeStr = checker.typeToString(type);
        switch (true) {
            case typeStr.startsWith('IEntitySystem'): {
                const s = {
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
                const c = { name, content, type: typeStr };
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
            if (!node.modifiers?.some(isExportKeyword))
                return;
            node.declarationList.declarations.forEach((decl) => {
                const name = decl.name.getText();
                const symbol = checker.getSymbolAtLocation(decl.name);
                saveExport(node, name, symbol);
            });
        }
        if (ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node)) {
            if (!node.modifiers?.some(isExportKeyword))
                return;
            const name = node.name?.text;
            if (!name)
                return;
            const symbol = checker.getSymbolAtLocation(node.name);
            saveExport(node, name, symbol);
        }
    });
    return exports;
};
const findNode = (root, predicate) => {
    if (predicate(root))
        return root;
    return ts.forEachChild(root, (child) => findNode(child, predicate));
};
const getType = (checker, name) => {
    const symbol = checker.getSymbolAtLocation(name);
    if (!symbol?.valueDeclaration)
        throw new Error();
    const type = checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration);
    // TODO(bret): Fix this, this is a hack to remove template arguments, but we only want to remove _default_ template arguments
    return type.getSymbol()?.getName() ?? checker.typeToString(type);
};
const getComponentProperties = (fileData, componentName) => {
    const { checker, sourceFile } = prepareTSFile(fileData.sourceFile.fileName);
    if (!sourceFile)
        throw new Error();
    let compNode;
    ts.forEachChild(sourceFile, (node) => {
        if (ts.isVariableStatement(node)) {
            const decl = node.declarationList.declarations.find((decl) => {
                return decl.name.getText() === componentName;
            });
            if (!decl)
                return;
            compNode = node;
        }
    });
    // @ts-expect-error -- we do assign this
    if (!compNode)
        return;
    const node = compNode;
    const decl = node.declarationList.declarations.find((decl) => {
        return decl.name.getText() === componentName;
    });
    if (!decl)
        throw new Error();
    const componentData = findNode(compNode, (node) => ts.isObjectLiteralExpression(node));
    if (!componentData)
        throw new Error();
    const properties = [];
    ts.forEachChild(componentData, (prop) => {
        if (!ts.isPropertyAssignment(prop))
            return;
        properties.push({
            name: prop.getChildAt(0).getText().trim(),
            type: getType(checker, prop.name),
            initialValue: prop.getChildAt(2).getText().trim(),
        });
    });
    return properties;
};
const getSystemContents = (fileData, systemName) => {
    const { checker, sourceFile } = prepareTSFile(fileData.sourceFile.fileName);
    if (!sourceFile)
        throw new Error();
    let systemNode;
    ts.forEachChild(sourceFile, (node) => {
        if (ts.isVariableStatement(node)) {
            const decl = node.declarationList.declarations.find((decl) => {
                return decl.name.getText() === systemName;
            });
            if (!decl)
                return;
            systemNode = node;
        }
    });
    if (!systemNode)
        throw new Error();
    const object = findNode(systemNode, (node) => ts.isObjectLiteralExpression(node));
    if (!object)
        throw new Error();
    const systemFuncs = {};
    ts.forEachChild(object, (methodNode) => {
        if (!ts.isMethodDeclaration(methodNode))
            return;
        let firstArg = true; // NOTE(bret): we want to skip `entity: Entity`
        const _arguments = [];
        ts.forEachChild(methodNode, (child) => {
            if (!ts.isParameter(child))
                return;
            if (firstArg) {
                firstArg = false;
                return;
            }
            const p = {
                name: child.name.getText(),
                type: getType(checker, child.name),
                // initialValue: null,
            };
            _arguments.push(p);
        });
        const block = findNode(methodNode, (node) => ts.isBlock(node));
        if (!block)
            throw new Error();
        // TODO(bret): remove entity.component() calls
        // TODO(bret): replace entity. with this.
        const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
        const body = block.statements
            .map((stmt) => printer.printNode(ts.EmitHint.Unspecified, stmt, sourceFile))
            .join('\n');
        const func = {
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
export const getComponentFromFile = (filePath, componentName) => {
    const component = readTSFile(filePath).components.find(({ name }) => {
        return name === componentName;
    });
    return component ?? null;
};
/** @deprecated */
export const parseComponent = (component) => {
    return component.data;
};
function createImportDeclaration(namedImports, moduleSpecifier, defaultImport, namespaceImport) {
    let importClause;
    if (namespaceImport) {
        importClause = ts.factory.createImportClause(false, undefined, ts.factory.createNamespaceImport(ts.factory.createIdentifier(namespaceImport.split(' as ')[1])));
    }
    else {
        const namedBindings = namedImports.length > 0
            ? ts.factory.createNamedImports(namedImports.map((name) => {
                const [orig, alias] = name.split(' as ');
                return ts.factory.createImportSpecifier(false, alias
                    ? ts.factory.createIdentifier(orig)
                    : undefined, ts.factory.createIdentifier(alias || orig));
            }))
            : undefined;
        importClause = ts.factory.createImportClause(false, defaultImport
            ? ts.factory.createIdentifier(defaultImport)
            : undefined, namedBindings);
    }
    return ts.factory.createImportDeclaration(undefined, importClause, ts.factory.createStringLiteral(moduleSpecifier));
}
export const createClass = (fileData) => {
    const _body = ts.factory.createClassExpression(undefined, 'MyEntity', undefined, undefined, []);
    const extendsClass = ts.factory.createIdentifier('Entity');
    const expr = ts.factory.createExpressionWithTypeArguments(extendsClass, undefined);
    const heritageClause = ts.factory.createHeritageClause(ts.SyntaxKind.ExtendsKeyword, [expr]);
    const properties = fileData.components.flatMap((c) => {
        return (c.properties?.map((p) => {
            const ref = ts.factory.createTypeReferenceNode(p.type, []);
            const sf = ts.createSourceFile('temp', `(${p.initialValue})`, ts.ScriptTarget.Latest, false, ts.ScriptKind.TS);
            let expr;
            const stmt = sf.statements[0];
            if (ts.isExpressionStatement(stmt) &&
                ts.isParenthesizedExpression(stmt.expression)) {
                expr = stmt.expression.expression;
            }
            return ts.factory.createPropertyDeclaration(undefined, p.name, undefined, ref, expr);
        }) ?? []);
    });
    const body = ts.factory.createClassDeclaration([ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)], 'MyEntity', undefined, [heritageClause], properties);
    return {
        body,
        imports: fileData.imports.map(({ namedImports, moduleSpecifier, defaultImport, namespaceImport, }) => createImportDeclaration(namedImports, moduleSpecifier, defaultImport, namespaceImport)),
    };
};
export const printFile = (statements) => {
    const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
    const sourceFile = ts.factory.createSourceFile(statements, ts.factory.createToken(ts.SyntaxKind.EndOfFileToken), ts.NodeFlags.None);
    return printer.printFile(sourceFile);
};
const regexComponentVar = /\s*const (?<varName>\w+) = entity\.component\?\.\(\w+\);\n/g;
export const generateTokenRegex = (token) => {
    return new RegExp(`([^\w])${token}([^\w])`, 'g');
};
export const parseSystem = (system) => {
    return Object.fromEntries(Object.entries(system)
        .filter(([_, v]) => typeof v === 'function')
        .map(([k, v]) => {
        const updateStr = v.toString();
        const args = updateStr
            .substring(updateStr.indexOf('(') + 1, updateStr.indexOf(')'))
            .split(', ');
        const bodyExt = updateStr.substring(updateStr.indexOf('{'), updateStr.lastIndexOf('}') + 1);
        let body = bodyExt.substring(bodyExt.indexOf('\n') + 1, bodyExt.lastIndexOf('\n'));
        const vars = [...body.matchAll(regexComponentVar)];
        vars.forEach((v) => {
            if (!v.groups)
                return;
            body = body
                .replace(v[0], '')
                .replaceAll(v.groups.varName, 'this');
        });
        body = body
            .replaceAll(generateTokenRegex('entity'), '$1this$2')
            .replaceAll(/    /g, '\t');
        return [k, { args, body }];
    }));
};
export const vitestOnly = {
    getComponentProperties,
};
//# sourceMappingURL=shared.js.map
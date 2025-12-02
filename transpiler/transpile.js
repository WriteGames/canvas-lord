import { ESLint } from 'eslint';
import fs from 'node:fs';
import path from 'node:path';
import * as prettier from 'prettier';
import { globby } from 'globby';
// import tsm from 'ts-morph';
import tsm, { Project, SyntaxKind } from 'ts-morph';
// import { createClass, printFile, readTSFile } from './shared.js';
const transpileProject = true;
const runEslint = true;
const runPrettier = true;
const copyFiles = true;
const wholeThang = true;
const oldImportFix = false;
const printClass = false;
const constructorMethodName = 'init';
const outDir = './out3';
const getValue = (initializer) => {
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
            if (!expr)
                throw new Error('???');
            return traverseObject(expr);
        }
        case SyntaxKind.ArrayLiteralExpression: {
            const arr = initializer.asKind(SyntaxKind.ArrayLiteralExpression);
            if (!arr)
                throw new Error('???');
            return traverseArray(arr);
        }
        // TODO(bret): revisit this - do we want to resolve these values or what?
        case SyntaxKind.Identifier: {
            const id = initializer.asKind(SyntaxKind.Identifier);
            if (id) {
                const def = id.getDefinitions();
                const v = def[0].getNode().getNextSiblings().at(-1);
                if (!v)
                    throw new Error('???');
                return getValue(v);
            }
            return initializer.getText();
        }
        case SyntaxKind.PrefixUnaryExpression: {
            const kk = initializer.asKind(SyntaxKind.PrefixUnaryExpression);
            if (!kk)
                throw new Error('not a prefix unary');
            let value = getValue(kk.getOperand());
            switch (kk.getOperatorToken()) {
                case SyntaxKind.MinusToken:
                    if (typeof value === 'number')
                        value *= -1;
                    else
                        throw new Error('cannot negate a non-number');
                    break;
                default:
                    throw new Error(`We do not yet support unary operator ${kk.getOperatorToken()}`);
            }
            return value;
        }
        default:
            return initializer.getText();
    }
};
const traverseArray = (arr) => {
    return arr.getElements().map((elem) => getValue(elem));
};
const traverseObject = (obj) => {
    const result = {};
    obj.getProperties().forEach((_prop) => {
        const prop = _prop.asKind(SyntaxKind.PropertyAssignment);
        if (!prop)
            return;
        const name = prop.getName();
        const initializer = prop.getInitializer();
        if (!initializer)
            return;
        result[name] = getValue(initializer);
    });
    return result;
};
if (wholeThang) {
    console.time('whole thang');
    console.time('read json');
    // console.log(component, componentName);
    const inDir = `./in`;
    const filePath = path.join(inDir, 'platformer', 'player.ts');
    // const filePath = path.join(inDir, 'test.ts');
    const jsonFilePath = path.join(inDir, 'tut2.json');
    const json = fs.readFileSync(jsonFilePath, 'utf-8');
    const classData = JSON.parse(json);
    const { out, fileName, name, components, systems, extendsClass = 'Entity', steps, } = classData;
    console.timeEnd('read json');
    const cleanUpClass = (_class) => {
        [..._class.getConstructors(), ..._class.getMethods()].forEach((m) => {
            // Remove empty method
            if (m.getBody()?.getChildAtIndex(1).getChildCount() === 0) {
                m.remove();
                return;
            }
            // `entity` -> `this`
            m.getDescendantsOfKind(SyntaxKind.Identifier).forEach((id) => {
                if (id.getText() === 'entity') {
                    id.replaceWithText('this');
                }
            });
            // Remove references to `this.component`
            m.getDescendantsOfKind(SyntaxKind.PropertyAccessExpression).forEach((p) => {
                const str = p
                    .getChildren()
                    .map((c) => c.getText())
                    .join('');
                if (str === 'this.component') {
                    const varState = p.getFirstAncestorByKind(SyntaxKind.VariableStatement);
                    varState?.remove();
                }
            });
            // `component` -> `this`
            m.getDescendantsOfKind(SyntaxKind.Identifier).forEach((id) => {
                if (id.getText() === 'component') {
                    id.replaceWithText('this');
                }
            });
        });
    };
    const testOutputPath = `${outDir}/${out}/${fileName}`;
    const getComponentProperties = (foundComponents, components) => {
        return components
            .flatMap((name) => {
            const comp = foundComponents.get(name);
            if (!comp)
                return null;
            const [obj] = comp.getDescendantsOfKind(SyntaxKind.ObjectLiteralExpression);
            return obj
                .getChildrenOfKind(SyntaxKind.SyntaxList)
                .flatMap((node) => node.getChildren())
                .filter((n) => n.getKind() === SyntaxKind.PropertyAssignment)
                .map((node) => {
                const children = node.getChildren();
                const name = children[0].getSymbol()?.getName();
                if (!name)
                    throw new Error('could not read name');
                const v = children[2];
                return [name, getValue(v)];
            });
        })
            .filter((node) => node !== null)
            .map(([name, value]) => ({
            name,
            initializer: JSON.stringify(value),
        }));
    };
    const addComponents = (target, foundComponents, components) => {
        const firstMethodIndex = target.getMethods()[0]?.getChildIndex();
        getComponentProperties(foundComponents, components).forEach((prop) => {
            if (firstMethodIndex) {
                target.insertProperty(firstMethodIndex, prop);
            }
            else {
                target.addProperty(prop);
            }
        });
    };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- keeping for now
    const removeComponents = (target, foundComponents, components) => {
        getComponentProperties(foundComponents, components).forEach(({ name }) => {
            target.getProperty(name)?.remove();
        });
    };
    const addToMethod = (target, method, options, block) => {
        const body = block.getChildAtIndex(1).getText();
        if (options.outputType === 'inline') {
            method.addStatements([body]);
        }
        else {
            const parameters = [];
            // TODO(bret): do a better job of finding out if parameters are needed
            if (body.includes('input.'))
                parameters.push({ name: 'input', type: 'Input' });
            if (!options.omitFromOutput)
                method.addStatements(`this.${options.alias}(${parameters.map(({ name }) => name).join(', ')});`);
            target.addMethod({
                name: options.alias,
                statements: [body],
                // TODO(bret): make this more robust
                parameters,
                // TODO(bret): This should be provided
                returnType: 'void',
            });
        }
    };
    const strip = (str) => {
        return str.replaceAll(/\s+/g, ' ');
    };
    const removeFromMethod = (target, method, options, block) => {
        if (options.outputType === 'inline') {
            let body = block
                .getChildAtIndex(1)
                .getText()
                .replaceAll('entity.', 'this.');
            // TODO(bret): get this part working
            let toRemove;
            const getNextStmt = () => method.getStatements().find((s) => {
                return strip(body).startsWith(strip(s.getText()));
            });
            while ((toRemove = getNextStmt())) {
                body = body.replace(toRemove.getText(), '');
                body = body.replace(/^[\r\n]+/g, '').trim();
                toRemove.remove();
            }
            // method.addStatements([body]);
        }
        else {
            const stmt = method.getStatement((s) => {
                return s.getText().includes(`this.${options.alias}(`);
            });
            stmt?.remove();
            target.getMethod(options.alias)?.remove();
        }
    };
    const addSystems = (target, foundSystems, systems) => {
        const systemsToUse = systems
            .map((data) => {
            const system = foundSystems.get(data.name);
            return system ? [data, system] : null;
        })
            .filter((s) => s !== null);
        systemsToUse.forEach((system) => {
            const methods = system[1].getDescendantsOfKind(SyntaxKind.MethodDeclaration);
            methods.forEach((m) => {
                const methodName = m.getChildAtIndex(0).getSymbol()?.getName();
                if (!methodName)
                    throw new Error('missing method name');
                const blocks = m.getDescendantsOfKind(SyntaxKind.Block);
                let method = target.getMethod(methodName);
                if (methodName === constructorMethodName) {
                    method = target.getConstructors()[0];
                }
                if (!method)
                    throw new Error(`invalid method: ${methodName}`);
                addToMethod(target, method, system[0], blocks[0]);
            });
        });
    };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- keeping for now
    const removeSystems = (target, foundSystems, systems) => {
        const systemsToUse = systems
            .map((data) => {
            const system = foundSystems.get(data.name);
            return system ? [data, system] : null;
        })
            .filter((s) => s !== null);
        systemsToUse.forEach((system) => {
            const methods = system[1].getDescendantsOfKind(SyntaxKind.MethodDeclaration);
            methods.forEach((m) => {
                const methodName = m.getChildAtIndex(0).getSymbol()?.getName();
                if (!methodName)
                    throw new Error('missing method name');
                const blocks = m.getDescendantsOfKind(SyntaxKind.Block);
                let method = target.getMethod(methodName);
                if (methodName === constructorMethodName) {
                    method = target.getConstructors()[0];
                }
                if (!method)
                    throw new Error('invalid method');
                removeFromMethod(target, method, system[0], blocks[0]);
            });
        });
    };
    const filesToFormat = [];
    if (transpileProject) {
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
        if (!file)
            throw new Error('file not found');
        console.timeEnd('getSource');
        console.time('exported Declaration');
        const exportedDecls = file.getExportedDeclarations();
        console.timeEnd('exported Declaration');
        console.time('find components & systems');
        const foundComponents = new Map();
        const foundSystems = new Map();
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
        console.timeEnd('find components & systems');
        console.log(foundComponents.size, foundSystems.size);
        console.time('createSourceFile');
        const sourceFile = project.createSourceFile(testOutputPath, '', {
            overwrite: true,
        });
        console.timeEnd('createSourceFile');
        // TODO(bret): Use `types` to generate the methods
        const methodsToUse = [
            {
                name: 'update',
                parameters: [{ name: 'input', type: 'Input' }],
                returnType: 'void',
            },
            {
                name: 'render',
                parameters: [
                    { name: 'ctx', type: 'Ctx' },
                    { name: 'camera', type: 'Camera' },
                ],
                returnType: 'void',
            },
        ];
        console.log('start pre');
        console.time('pre');
        // create the class
        const createClass = (sourceFile, components, systems) => {
            const baseEntityClass = sourceFile.addClass({
                name,
                isExported: true,
                extends: extendsClass,
            });
            // add properties
            addComponents(baseEntityClass, foundComponents, components);
            // create constructor
            const constr = baseEntityClass.addConstructor({
                parameters: [
                    { name: 'x', type: 'number' },
                    { name: 'y', type: 'number' },
                ],
            });
            // create basic methods
            methodsToUse.forEach((m) => {
                baseEntityClass.addMethod(m);
            });
            // populate constructor
            constr.addStatements(['super(x, y);']);
            // populate methods
            addSystems(baseEntityClass, foundSystems, systems);
            return baseEntityClass;
        };
        const curComponents = [...components];
        const curSystems = [...systems];
        steps.unshift({});
        const sourceFiles = steps.map((step, i) => {
            const timeStr = `generate step ${i}`;
            console.time(timeStr);
            const ext = i === 0 ? 'base' : `step-${i}`;
            const sourceFile = project.createSourceFile(testOutputPath.replace('.ts', `.${ext}.ts`), '', {
                overwrite: true,
            });
            if (step.add) {
                if (step.add.components) {
                    curComponents.push(...step.add.components);
                }
                if (step.add.systems) {
                    curSystems.push(...step.add.systems);
                }
            }
            if (step.remove) {
                step.remove.components?.forEach((c) => {
                    const index = curComponents.indexOf(c);
                    if (index > -1) {
                        curComponents.splice(index, 1);
                    }
                });
                step.remove.systems?.forEach((s) => {
                    const index = curSystems.findIndex((sy) => sy.name === s.name);
                    if (index > -1) {
                        curSystems.splice(index, 1);
                    }
                });
            }
            const entityClass = createClass(sourceFile, curComponents, curSystems);
            methodsToUse.forEach((m) => {
                if (!entityClass.getMethod(m.name))
                    entityClass.addMethod(m);
            });
            // TODO(bret): Make sure `not_used` gets removed
            cleanUpClass(entityClass);
            console.timeEnd(timeStr);
            sourceFile.fixMissingImports();
            return sourceFile;
        });
        // old way of doing imports, keep using `fixMissingImports` until it doesn't work
        if (oldImportFix) {
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
                };
            });
            sourceFile.addImportDeclarations(imports);
        }
        // sourceFile.fixMissingImports();
        console.timeEnd('pre');
        console.time('save');
        // await sourceFile.save();
        await Promise.all(sourceFiles.map((s) => s.save()));
        console.timeEnd('save');
        // baseEntityClass.remove();
        filesToFormat.push(...sourceFiles.map((s) => s.getFilePath()));
        console.time('remove source file');
        project.removeSourceFile(sourceFile);
        console.timeEnd('remove source file');
        // console.log(foundSystems[0][1]);
        //
        // process.exit(0);
        if (printClass) {
            // console.time('readTSFile');
            // const fileData = readTSFile(filePath);
            // console.timeEnd('readTSFile');
            // // const contents = fileData.components.find((c) => c.name === componentName);
            // console.log('yo');
            // // process.exit(0);
            // console.time('createClass');
            // const c = createClass(fileData, classData);
            // console.timeEnd('createClass');
            // console.time('printFile');
            // const output = printFile(c);
            // console.timeEnd('printFile');
            // // new one
            // fs.writeFileSync(testOutputPath, output, 'utf-8');
            // console.log('TS: done');
        }
    }
    if (runEslint) {
        const eslint = new ESLint({ fix: true });
        const results = await eslint.lintFiles([
            // testOutputPath,
            ...filesToFormat,
        ]);
        await ESLint.outputFixes(results);
        // console.log(results);
        // const formatter = await eslint.loadFormatter('stylish');
        // const resultText = formatter.format(results);
        // console.log(resultText);
    }
    if (runPrettier) {
        const dir = 'C:\\xampp\\apps\\canvas-lord\\transpiler\\out3\\platformer';
        const ignorePath = 'C:\\xampp\\apps\\canvas-lord\\.prettierignore';
        const filePaths = await globby(['**/*.{js,ts}'], {
            cwd: dir,
            gitignore: true,
            ignore: [],
            absolute: true,
            dot: true,
        });
        const commentStr = `// <<newline>>`;
        const project = new tsm.Project({
            tsConfigFilePath: './tsconfig.json',
            compilerOptions: {
                alwaysStrict: false,
                strict: false,
                sourceMap: false,
            },
        });
        await Promise.all(filePaths.map(async (filePath) => {
            const content = await fs.promises.readFile(filePath, 'utf-8');
            const newContent = content.replaceAll('\n\n', `\n${commentStr}\n`);
            await fs.promises.writeFile(filePath, newContent, 'utf-8');
        }));
        project.addSourceFilesAtPaths(filePaths);
        await project.emit();
        const prettierFiles = filePaths;
        console.log('prettier files:', prettierFiles);
        await prettier.resolveConfig('C:\\xampp\\apps\\canvas-lord\\.prettierrc.json');
        await Promise.all(prettierFiles.map(async (filePath) => {
            const fileInfo = await prettier.getFileInfo(filePath, {
                ignorePath,
            });
            if (fileInfo.ignored || fileInfo.inferredParser === null)
                return;
            const content = await fs.promises.readFile(filePath, 'utf-8');
            const config = await prettier.resolveConfig(filePath);
            let newContent = content.replaceAll(commentStr, '');
            if (filePath.endsWith('.js')) {
                newContent = newContent
                    .replaceAll(/from ["'](?<group>[\w\-./]+)["'];/g, (_, p1) => {
                    const name = p1 === 'canvas-lord' ? `/js/${p1}` : p1;
                    return `from '${name}.js';`;
                })
                    .replaceAll('../../in/platformer', '.');
            }
            const formatted = await prettier.format(newContent, {
                ...config,
                filepath: filePath,
            });
            await fs.promises.writeFile(filePath, formatted, 'utf-8');
            console.log(`Formatted: ${filePath}`);
        }));
    }
    // copy files
    if (copyFiles) {
        console.log('copying files');
        const dir = 'C:\\xampp\\apps\\canvas-lord\\transpiler\\out3\\platformer';
        const filePaths = await globby(['**/*.js'], {
            cwd: dir,
            gitignore: true,
            ignore: [],
            absolute: true,
            dot: true,
        });
        const destDir = 'C:\\xampp\\apps\\write-games-blog\\js\\tutorials\\platformer';
        await Promise.all(filePaths.map(async (filePath) => {
            const dest = path.join(destDir, path.basename(filePath));
            await fs.promises.copyFile(filePath, dest);
        }));
    }
    console.timeEnd('whole thang');
}
/*                                                                  */
/*                                                                  */
/*                            SCENE                                 */
/*                                                                  */
/*                                                                  */

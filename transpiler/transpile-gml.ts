/* eslint-disable camelcase -- boo */

import { ESLint } from 'eslint';
import fs from 'node:fs';
import path from 'node:path';
import * as prettier from 'prettier';
import { globby } from 'globby';

// import tsm from 'ts-morph';
import tsm, { Project, SyntaxKind } from 'ts-morph';
import type { ClassOptions, System } from './shared.js';
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

interface ObjectId {
	name: string;
	path: string;
}
const createInstance = (
	objectId: ObjectId,
	x: number,
	y: number,
	inst: number,
) => {
	const name = `inst_${inst.toString(16).toUpperCase()}`;
	return {
		$GMRInstance: 'v3',
		'%Name': name,
		colour: 4294967295,
		frozen: false,
		hasCreationCode: false,
		ignore: false,
		imageIndex: 0,
		imageSpeed: 1.0,
		inheritCode: false,
		inheritedItemId: null,
		inheritItemSettings: false,
		isDnd: false,
		name,
		objectId,
		properties: [],
		resourceType: 'GMRInstance',
		resourceVersion: '2.0',
		rotation: 0.0,
		scaleX: 1.0,
		scaleY: 1.0,
		x,
		y,
	};
};

// const transformGMJS_DrawRect = (
// 	traversal: tsm.TransformTraversalControl,
// ): tsm.ts.Node => {
// 	const node = traversal.visitChildren();
// 	switch (true) {
// 		case tsm.ts.isCallExpression(node):
// 			// draw_set_color(this.color);
// 			// draw_rectangle(x1, y1, x2, y2, outline);
// 			console.log(node);

// 			return traversal.factory.createExpressionStatement(
// 				traversal.factory.createCallExpression('test', [], []),
// 			);

// 			return traversal.factory.createBlock([
// 				traversal.factory.createExpressionStatement(
// 					traversal.factory.createCallExpression('test', [], []),
// 				),
// 				// traversal.factory.createIdentifier('bar'),
// 				// 'draw_set_color();',
// 				// 'draw_rectangle();',
// 			]);
// 			// return traversal.factory.createIdentifier('draw_rectangle');
// 			break;
// 		default:
// 			break;
// 	}
// 	return node;
// };

const transformGMJS_Colors = (
	traversal: tsm.TransformTraversalControl,
): tsm.ts.Node => {
	const node = traversal.visitChildren();
	switch (true) {
		case tsm.ts.isStringLiteral(node): {
			switch (node.text) {
				case 'red':
					return traversal.factory.createIdentifier('c_red');
			}
			break;
		}

		default:
			break;
	}

	return node;
};

const transformGMJS = (file: tsm.SourceFile): void => {
	console.time('transform 1');
	file.transform(transformGMJS_Colors);
	console.timeEnd('transform 1');

	console.time('transform 2');
	const calls = file.getDescendantsOfKind(tsm.SyntaxKind.CallExpression);
	calls.forEach((c) => {
		// TODO(bret): figure out if it's a Draw.rect
		// TODO(bret): Draw.rect -> draw_rectangle()
		// TODO(bret): add a previous line

		switch (c.getExpression().getText()) {
			case 'Draw.rect': {
				c.setExpression('draw_rectangle');

				const [ctx, options, x, y, w, h] = c.getArguments();
				const obj = traverseObject(
					options as tsm.ObjectLiteralExpression,
				) as {
					color?: string;
					type: 'fill' | 'stroke';
				};
				const { color, type = 'fill' } = obj;
				c.removeArgument(ctx);
				c.removeArgument(options);

				const ww = w.getText();
				const hh = h.getText();

				c.removeArgument(w);
				c.removeArgument(h);

				c.addArguments([`${x.getText()} + ${ww}`]);
				c.addArguments([`${y.getText()} + ${hh}`]);

				c.addArgument(type === 'fill' ? 'false' : 'true');

				if (color) {
					const index = c.getChildIndex();
					file.insertStatements(index, [`draw_set_color(${color})`]);
				}
				break;
			}
		}
	});

	// file.transform(transformGMJS_DrawRect);
	console.timeEnd('transform 2');
};

const EVENT_TYPE = {
	Create: 0,
	Destroy: 1,
	Step: 3,
	//
	Draw: 8,
} as const;

type EventType = (typeof EVENT_TYPE)[keyof typeof EVENT_TYPE];

if (false as boolean) {
	console.time('gamemaker');
	const projectName = 'TestingJS';
	const gmProjectPath = `C:/Projects/GameMaker/${projectName}`;
	const projectRootFileName = `${projectName}.yyp`;
	const projectRootPath = path.join(gmProjectPath, projectRootFileName);

	const createObject = (name: string) => ({
		$GMObject: '',
		'%Name': name,
		eventList: [],
		managed: true,
		name,
		overriddenProperties: [],
		parent: {
			name: projectName,
			path: projectRootFileName,
		},
		parentObjectId: null,
		persistent: false,
		physicsAngularDamping: 0.1,
		physicsDensity: 0.5,
		physicsFriction: 0.2,
		physicsGroup: 1,
		physicsKinematic: false,
		physicsLinearDamping: 0.1,
		physicsObject: false,
		physicsRestitution: 0.1,
		physicsSensor: false,
		physicsShape: 1,
		physicsShapePoints: [],
		physicsStartAwake: true,
		properties: [],
		resourceType: 'GMObject',
		resourceVersion: '2.0',
		solid: false,
		spriteId: null,
		spriteMaskId: null,
		visible: true,
	});

	const objPath = path.join(gmProjectPath, 'objects');

	const name = 'oPlayer';

	const oPlayerPath = path.join(objPath, name);

	if (fs.existsSync(oPlayerPath))
		await fs.promises.rm(oPlayerPath, { recursive: true, force: true });

	await fs.promises.mkdir(oPlayerPath);

	const getRelative = (_path: string) =>
		path.relative(gmProjectPath, _path).replaceAll('\\', '/');

	const oPlayer = createObject(name);
	const oPlayerYYPath = path.join(oPlayerPath, `${name}.yy`);
	const oPlayerResource = {
		id: {
			name,
			path: getRelative(oPlayerYYPath),
		},
	};

	console.time('project');
	const project = new Project({
		tsConfigFilePath: './tsconfig.json',
		compilerOptions: {
			alwaysStrict: false,
			strict: false,
			sourceMap: false,
		},
	});

	project.compilerOptions.set({
		alwaysStrict: false,
		strict: false,
		sourceMap: false,
	});
	// const typeChecker = project.getTypeChecker();
	console.timeEnd('project');

	const filePath = path.join('./out3', 'boo-step-0.ts');

	console.time('addSource');
	project.addSourceFileAtPath(filePath);
	console.timeEnd('addSource');
	console.time('getSource');
	const file = project.getSourceFile(filePath);
	if (!file) throw new Error('file not found');
	console.timeEnd('getSource');

	const playerClass = file.getClass('Player');
	if (!playerClass) throw new Error('no player class');

	const properties = playerClass.getProperties();
	const methods = playerClass.getMethods();

	{
		// create an event
		const createNewEvent = (eventType: EventType) => {
			const name = Object.entries(EVENT_TYPE).find(
				([_, v]) => v === eventType,
			)?.[0];
			const scriptSource = `${name}_0.js`;
			return {
				$GMEvent: 'v1',
				'%Name': '',
				collisionObjectId: null,
				eventNum: 0,
				eventType,
				isDnD: false,
				name: '',
				resourceType: 'GMEvent',
				resourceVersion: '2.0',
				scriptSource,
			};
		};

		const createEvent = createNewEvent(EVENT_TYPE.Create);
		const createEventPath = path.join(
			oPlayerPath,
			createEvent.scriptSource,
		);
		{
			const createFile = project.createSourceFile(
				createEventPath.replace('.js', '.ts'),
				undefined,
				{
					overwrite: true,
				},
			);

			createFile.addStatements(
				properties.map((p) => {
					return `this.${p.getName()} = ${p.getInitializer()?.getText()};`;
				}),
			);

			transformGMJS(createFile);

			await createFile.emit();
			// @ts-expect-error -- bleh
			oPlayer.eventList.push(createEvent);
		}

		const update = methods.find((m) => m.getName() === 'update');
		if (update) {
			const stepEvent = createNewEvent(EVENT_TYPE.Step);
			const stepEventPath = path.join(
				oPlayerPath,
				stepEvent.scriptSource,
			);

			const stepFile = project.createSourceFile(
				stepEventPath.replace('.js', '.ts'),
				undefined,
				{
					overwrite: true,
				},
			);

			const [block] = update.getDescendantsOfKind(tsm.SyntaxKind.Block);
			const body = block.getChildAtIndex(1).getText();

			stepFile.addStatements([body]);

			transformGMJS(stepFile);

			await stepFile.emit();

			// @ts-expect-error -- bleh
			oPlayer.eventList.push(stepEvent);
		}

		const render = methods.find((m) => m.getName() === 'render');
		if (render) {
			const drawEvent = createNewEvent(EVENT_TYPE.Draw);
			const drawEventPath = path.join(
				oPlayerPath,
				drawEvent.scriptSource,
			);

			const drawFile = project.createSourceFile(
				drawEventPath.replace('.js', '.ts'),
				undefined,
				{
					overwrite: true,
				},
			);

			const [block] = render.getDescendantsOfKind(tsm.SyntaxKind.Block);
			const body = block.getChildAtIndex(1).getText();

			drawFile.addStatements([body]);

			transformGMJS(drawFile);

			await drawFile.emit();
			// @ts-expect-error -- bleh
			oPlayer.eventList.push(drawEvent);
		}
	}

	const json = JSON.stringify(oPlayer, null, 2);
	await fs.promises.writeFile(oPlayerYYPath, json, 'utf-8');

	// add to room
	{
		const roomName = 'Room1';
		const roomPath = path.join(gmProjectPath, 'rooms', roomName);
		const roomFilePath = path.join(roomPath, `${roomName}.yy`);
		const data = await fs.promises.readFile(roomFilePath, 'utf-8');
		// eslint-disable-next-line prefer-const -- blah
		let roomData = {};
		// eslint-disable-next-line no-eval -- blah
		eval(`roomData = ${data};`);

		let highestInst = parseInt('inst_1443CBE3'.split('_')[1], 16);
		console.log({ highestInst });
		const inst = createInstance(
			oPlayerResource.id,
			100,
			100,
			++highestInst,
		);

		const { instanceCreationOrder } = roomData as {
			instanceCreationOrder: ObjectId[];
		};

		// @ts-expect-error -- shhhh
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- blah
		const { instances } = roomData.layers[0] as {
			instances: Array<{ objectId: ObjectId }>;
		};

		const existingCO = instanceCreationOrder.findIndex(({ name }) => {
			return name === inst.name;
		});
		if (existingCO) {
			instanceCreationOrder.splice(existingCO, 1);
		}

		instanceCreationOrder.push({
			name: inst.name,
			path: getRelative(roomFilePath),
		});

		const existing = instances.findIndex(
			({ objectId }) => objectId.name === oPlayerResource.id.name,
		);
		if (existing > -1) instances.splice(existing, 1);

		instances.push(inst);

		await fs.promises.writeFile(
			roomFilePath,
			JSON.stringify(roomData, null, 2),
			'utf-8',
		);
	}

	// update project
	const projectRootJson = await fs.promises.readFile(
		projectRootPath,
		'utf-8',
	);
	// eslint-disable-next-line prefer-const -- this gets reassigned in eval
	let projectRootData = {
		resources: [
			{
				id: {
					name: 'string',
					path: 'string',
				},
			},
		],
	};
	// eslint-disable-next-line no-eval -- gonna need it for a moment
	eval(`projectRootData = ${projectRootJson}`);
	const existing = projectRootData.resources.findIndex(
		({ id }) => id.name === name,
	);
	if (existing > -1) {
		projectRootData.resources.splice(existing, 1);
	}
	projectRootData.resources.push(oPlayerResource);
	await fs.promises.writeFile(
		projectRootPath,
		JSON.stringify(projectRootData, null, 2),
		'utf-8',
	);
	console.timeEnd('gamemaker');
}

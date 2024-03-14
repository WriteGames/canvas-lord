import fs from 'fs';
import * as Components from 'canvas-lord/util/components.js';
import { type IEntitySystem } from 'canvas-lord';
import { type IEntityComponentType } from 'canvas-lord/util/types';

// components & systems
import { testComponent, moveRightSystem, moveLeftSystem } from './in/test.js';
import {
	horizontalMovementComponent,
	verticalMovementComponent2,
	horizontalMovementSystem,
	verticalMovementSystem2,
	moveXSystem,
	moveYSystem,
} from './in/player.js';

interface SystemDataFunc {
	args: any;
	body: string;
}

interface SystemDataFuncAcc {
	args: string[];
	body: string[];
}

interface SystemData {
	update?: SystemDataFunc;
	render?: SystemDataFunc;
}

type SystemDataType = keyof SystemData;

const parseComponent = (component: IEntityComponentType) => {
	return component.data;
};

const regexComponentVar =
	/\s*const (?<varName>\w+) = entity\.component\?\.\(\w+\);\n/g;
const generateTokenRegex = (token: string) => {
	return new RegExp(`([^\w])${token}([^\w])`, 'g');
};

const parseSystem = (system: IEntitySystem) => {
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

const componentMap = new Map();
const systemsMap = new Map();

const nonNull = <T>(u: unknown): u is T => Boolean(u);

const consolidateSystemItems = (
	systems: IEntitySystem[],
	type: SystemDataType,
) => {
	return systems
		.map((s) => systemsMap.get(s)?.[type])
		.filter<SystemDataFunc>(nonNull)
		.reduce<SystemDataFuncAcc>(
			(acc, componentFunc) => {
				const args = [componentFunc.args, acc.args]
					.sort((a, b) => b.length - a.length)
					.at(0);
				return {
					args,
					body: acc.body.concat(componentFunc.body),
				};
			},
			{
				args: [],
				body: [],
			},
		);
};

const generateEntity = ({
	fileName,
	entityName,
	components,
	systems,
}: {
	fileName: string;
	entityName: string;
	components: IEntityComponentType[];
	systems: IEntitySystem[];
}) => {
	components.forEach((c) => {
		if (!componentMap.has(c)) componentMap.set(c, parseComponent(c));
	});
	systems.forEach((s) => {
		if (!systemsMap.has(s)) systemsMap.set(s, parseSystem(s));
	});

	const update = consolidateSystemItems(systems, 'update');
	const render = consolidateSystemItems(systems, 'render');

	const updateArgs = update.args.filter((a) => a !== 'entity').join(', ');
	const updateBody = update.body.join('\n\t\t\n');
	const renderArgs = render.args.filter((a) => a !== 'entity').join(', ');
	const renderBody = render.body.join('\n\t\t\n');
	const properties = components
		.flatMap((c) => {
			return Object.entries(componentMap.get(c));
		})
		.filter(([k]) => {
			const regex = generateTokenRegex(k);
			return regex.test(updateBody) || regex.test(renderBody);
		});

	const propertiesStr = properties
		.map(([k, v]) => {
			return `${k} = ${v};`;
		})
		.join('\n\t');

	const entityContents = [
		propertiesStr,
		updateBody ? `update(${updateArgs}) {\n${updateBody}\n\t}` : '',
		renderBody ? `render(${renderArgs}) {\n${renderBody}\n\t}` : '',
	]
		.filter(Boolean)
		.join('\n\t\n\t');

	const contents = `import { Entity } from 'canvas-lord';\n\nexport class ${entityName} extends Entity {\n\t${entityContents}\n}`;

	fs.writeFileSync(fileName, contents);
};

generateEntity({
	fileName: 'out/test.js',
	entityName: 'Test',
	components: [testComponent],
	systems: [moveLeftSystem, moveRightSystem],
});

generateEntity({
	fileName: 'out/player.js',
	entityName: 'GenPlayer',
	components: [horizontalMovementComponent, verticalMovementComponent2],
	systems: [
		// horizontalMovementSystem,
		// @ts-expect-error
		horizontalMovementSystem,
		// @ts-expect-error
		verticalMovementSystem2,
		// @ts-expect-error
		moveXSystem,
		// @ts-expect-error
		moveYSystem,
	],
});

// TODO: be able to mark systems as functions
//	- any system that is marked as a function would be added as a method of the entity and called `this.moveX()` or w/e
// TODO: probably remove all logger stuff :)
// TODO: grouping would be sweet! (ie put all input checks together)

import fs from 'fs';

import * as Components from 'canvas-lord/util/components.js';
import type {
	IEntitySystem,
	IEntityComponentType,
} from 'canvas-lord/util/types';

// // components & systems
import {
	testComponent,
	moveRightSystem,
	moveLeftSystem,
	deleteSelfSystem,
} from './in/test.js';
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

type SystemInput =
	| {
			outputType: 'inline';
			system: IEntitySystem;
	  }
	| {
			outputType: 'function';
			alias: string;
			system: IEntitySystem;
	  };

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

interface EntityData {
	entityName: string;
	components: IEntityComponentType[];
	systems: SystemInput[];
}

const generateEntity = ({ entityName, components, systems }: EntityData) => {
	components.forEach((c) => {
		if (!componentMap.has(c)) componentMap.set(c, parseComponent(c));
	});
	systems.forEach((s) => {
		if (!systemsMap.has(s.system))
			systemsMap.set(s.system, parseSystem(s.system));
	});

	const [update, render] = (
		['update', 'render'] as const
	).map<SystemDataFuncAcc>((type) => {
		const item = consolidateSystemItems(
			systems
				.filter((s) => s.outputType === 'inline')
				.map((s) => s.system),
			type,
		);
		// TODO: allow for aliases to work for render
		if (type === 'update') {
			const aliases = systems
				.map((s) => (s.outputType === 'function' ? s.alias : null))
				.filter(nonNull<string>);
			item.body = item.body.concat(
				aliases.map((a) => `\t\tthis.${a}();`),
			);
		}
		return item;
	}) as [SystemDataFuncAcc, SystemDataFuncAcc];

	// const render = consolidateSystemItems(
	// 	systems.filter((s) => s.type === 'inline').map((s) => s.system),
	// 	'render',
	// );
	// TODO: render.body.concat();

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

	const functions = systems
		.filter((s) => s.outputType === 'function')
		.map((s) =>
			'alias' in s
				? [s.alias, systemsMap.get(s.system).update.body]
				: null,
		)
		.filter(nonNull<[string, string]>)
		.map(([alias, body]) => {
			return `${alias}() {\n${body}\n\t}`;
		});

	const entityContents = [
		propertiesStr,
		updateBody ? `update(${updateArgs}) {\n${updateBody}\n\t}` : '',
		renderBody ? `render(${renderArgs}) {\n${renderBody}\n\t}` : '',
		...functions,
	]
		.filter(Boolean)
		.join('\n\t\n\t');

	const imports = [`import { Entity } from 'canvas-lord/core/entity.js';`];
	const classDefinition = `export class ${entityName} extends Entity {\n\t${entityContents}\n}`;

	return {
		imports,
		classDefinition,
	};
};

const entityToFile = (
	fileName: string,
	entityData: ReturnType<typeof generateEntity>,
) => {
	fs.writeFileSync(
		fileName,
		`${entityData.imports.join('\n')}\n\n${entityData.classDefinition}`,
	);
};

const testOutput = generateEntity({
	entityName: 'Test',
	components: [testComponent],
	systems: [
		{ outputType: 'inline', system: moveLeftSystem },
		{ outputType: 'inline', system: moveRightSystem },
		{
			outputType: 'function',
			alias: 'deleteRoutine',
			system: deleteSelfSystem,
		},
	],
});

entityToFile('out/test.js', testOutput);

const playerOutput = generateEntity({
	entityName: 'GenPlayer',
	components: [horizontalMovementComponent, verticalMovementComponent2],
	systems: [
		{
			outputType: 'inline',
			// @ts-expect-error
			system: horizontalMovementSystem,
		},
		{
			outputType: 'inline',
			// @ts-expect-error
			system: verticalMovementSystem2,
		},
		{
			outputType: 'function',
			alias: 'moveX',
			// @ts-expect-error
			system: moveXSystem,
		},
		{
			outputType: 'function',
			// TODO: allow for aliases to work for render
			alias: 'moveY',
			// @ts-expect-error
			system: moveYSystem,
		},
	],
});

entityToFile('out/player.js', playerOutput);
entityToFile('../website/examples/out/player.js', playerOutput);

// TODO: be able to mark systems as functions
//	- any system that is marked as a function would be added as a method of the entity and called `this.moveX()` or w/e
// TODO: probably remove all logger stuff :)
// TODO: grouping would be sweet! (ie put all input checks together)

const platformerTutorial = {
	name: 'Platformer Tutorial',
	slug: 'platformer-tutorial',
	blocks: [
		{
			file: 'in/platformer-tut.js',
		},
		{
			file: 'in/player-scene.js',
		},
		{
			file: 'in/player.js',
		},
	],
	steps: [
		{
			name: 'Step One',
			slug: 'one',
			dynamic: [
				{
					file: 'in/player.js',
					entityName: 'GenPlayer',
					components: [
						horizontalMovementComponent,
						verticalMovementComponent2,
					],
					systems: [
						{
							outputType: 'inline',
							system: horizontalMovementSystem,
						},
						{
							outputType: 'inline',
							system: verticalMovementSystem2,
						},
						{
							outputType: 'function',
							alias: 'moveX',
							system: moveXSystem,
						},
						{
							outputType: 'function',
							// TODO: allow for aliases to work for render
							alias: 'moveY',
							system: moveYSystem,
						},
					],
				},
			],
		},
		{
			name: 'Step Tne',
			slug: 'two',
			dynamic: [
				{
					file: 'in/player.js',
					entityName: 'GenPlayer',
					components: [horizontalMovementComponent],
					systems: [
						{
							outputType: 'inline',
							system: horizontalMovementSystem,
						},
					],
				},
			],
		},
	],
} as const;

const makeDir = (dir: string) => {
	if (fs.existsSync(dir)) return;
	fs.mkdirSync(dir, { recursive: true });
};

const generateTutorial = (tutorial: typeof platformerTutorial) => {
	const dest = '../website/out';
	const folder = `${dest}/${tutorial.slug}`;
	makeDir(folder);

	const createTutorialDir = (fileName: string) => `${folder}/${fileName}`;

	const { blocks, steps } = tutorial;

	const dynamic = steps.flatMap((step) => {
		return step.dynamic.map((d) => d.file);
	}) as string[];

	const staticFiles = blocks.filter(({ file }) => !dynamic.includes(file));
	staticFiles.forEach(({ file }) => {
		const contents = fs.readFileSync(file, 'utf8');
		const fileName = file.split('/').at(-1) as string;
		fs.writeFileSync(createTutorialDir(fileName), contents);
	});

	const dynamicFiles = blocks.filter(({ file }) => dynamic.includes(file));
	steps.forEach((step) => {
		const stepDir = createTutorialDir(step.slug);
		makeDir(stepDir);
		const createStepPath = (fileName: string) => `${stepDir}/${fileName}`;
		step.dynamic.forEach((entityData) => {
			const _entityData = entityData as unknown as EntityData & {
				file: string;
			};
			const entity = generateEntity({
				entityName: entityData.entityName,
				components: _entityData.components,
				systems: _entityData.systems,
			});
			entityToFile(createStepPath('player.js'), entity);
		});
	});

	const genSteps = steps.map((step) => {
		const files = blocks.map(({ file }) => {
			const fileName = file.split('/').at(-1) as string;
			const rootFile = createTutorialDir(fileName);
			if (fs.existsSync(rootFile)) return rootFile;
			const stepFile = createTutorialDir(`${step.slug}/${fileName}`);
			if (fs.existsSync(stepFile)) return stepFile;
			return null;
		});

		return {
			name: step.name,
			files,
		};
	});

	const genTutorial = {
		steps: genSteps,
	};

	fs.writeFileSync(
		createTutorialDir('data.json'),
		JSON.stringify(genTutorial),
	);

	const markdown = fs.readFileSync('in/content.md', 'utf8');
	fs.writeFileSync(createTutorialDir('content.mdx'), markdown);
};

generateTutorial(platformerTutorial);

/*                                                                  */
/*                                                                  */
/*                            SCENE                                 */
/*                                                                  */
/*                                                                  */

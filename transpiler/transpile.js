import fs from 'fs';

const playerSrc = fs.readFileSync('../src/player.js', 'utf-8');

const regexComponent =
	/(?:export)? const (?<name>\w+)\s=\sComponents\.createComponent\((?<data>\{(?:.|\s)*?\})\)\;/gm;
const regexProperty = /(?<key>\w+)\: (?<value>\w+)/g;

const componentPropertyMap = new Map();

const rawComponents = [...playerSrc.matchAll(regexComponent)];
rawComponents.forEach(({ groups }) => {
	const { name, data } = groups;
	const properties = [...data.matchAll(regexProperty)].map((m) => [
		m.groups.key,
		JSON.parse(m.groups.value),
	]);

	componentPropertyMap.set(name, properties);
});

// update\([\w,\s]*?\)\s{(?:.|\s)*?[\r\n]\t}
// export const\s\w+\s=\s{\s*(?<update>update\([\w,\s]*?\)\s{(?:.|\s)*?[\r\n]\t})?,\s};

const regexSystem =
	/export const\s(?<name>\w+)\s=\s{\s*(?<update>update\((?<updateArgs>[\w,\s]*?)\)\s{[\r\n](?<updateCode>(?:.|\s)*?)[\r\n]\t})?,\s};/gm;
const regexComponentVar =
	/\s*const (?<varName>\w+) = entity.component\?\.\(\w+\);\n/g;

const systemMap = new Map();

const generateTokenRegex = (token) => {
	return new RegExp(`([^\w])${token}([^\w])`, 'g');
};

const rawSystems = [...playerSrc.matchAll(regexSystem)];
rawSystems.forEach(({ groups }) => {
	const { name, update, updateArgs, updateCode, render, renderArgs } = groups;

	const data = {};
	if (update) {
		let body = updateCode;

		const vars = [...updateCode.matchAll(regexComponentVar)];
		vars.forEach((v) => {
			body = body.replace(v[0], '').replaceAll(v.groups.varName, 'this');
		});
		body = body
			.replace(/update\(entity(?:, )?/, 'update(')
			.replaceAll(generateTokenRegex('entity'), '$1this$2');

		data.update = { args: updateArgs, body };
	}
	if (render) {
		data.render = { args: renderArgs };
	}

	systemMap.set(name, data);
});

// TODO: need to get archtypes data, but let's hardcode for now
const createEntity = (name, components, systems) => {
	const update = systems
		.map((s) => systemMap.get(s)?.update)
		.filter(Boolean)
		.reduce(
			(acc, update) => {
				const args = [update.args.split(', '), acc.args].sort(
					(a, b) => b.length - a.length,
				)[0];
				return {
					args,
					body: acc.body.concat(update.body),
				};
			},
			{
				args: [],
				body: [],
			},
		);

	const render = systems
		.map((s) => systemMap.get(s)?.render)
		.filter(Boolean)
		.reduce(
			(acc, render) => {
				const args = [render.args.split(', '), acc.args].sort(
					(a, b) => b.length - a.length,
				)[0];
				return {
					args,
					body: acc.body.concat(render.body),
				};
			},
			{
				args: [],
				body: [],
			},
		);

	const updateArgs = update.args.filter((a) => a !== 'entity').join(', ');
	const updateBody = update.body.join('\n\t\t\n');
	const renderArgs = render.args.filter((a) => a !== 'entity').join(', ');
	const renderBody = render.body.join('\n\t\t\n');

	const properties = components
		.flatMap((key) => {
			return componentPropertyMap
				.get(key)
				.filter(([k]) => {
					const regex = generateTokenRegex(k);
					return regex.test(updateBody) || regex.test(renderBody);
				})
				.map(([k, v]) => `${k} = ${v};`);
		})
		.filter(Boolean)
		.join('\n\t');

	const contents = [
		properties,
		updateBody ? `update(${updateArgs}) {\n${updateBody}\n\t}` : '',
		renderBody ? `render(${renderArgs}) {\n${renderBody}\n\t}` : '',
	]
		.filter(Boolean)
		.join('\n\t\n\t');
	return `class ${name} extends Entity {\n\t${contents}\n}`;
};

// TODO: check to make sure the component's properties are actually used by the systems!

// TODO: be able to mark systems as functions
//	- any system that is marked as a function would be added as a method of the entity and called `this.moveX()` or w/e
// TODO: probably remove all logger stuff :)
// TODO: grouping would be sweet! (ie put all input checks together)
const genPlayer = createEntity(
	'GenPlayer',
	['horizontalMovementComponent', 'verticalMovementComponent2'],
	[
		// 'horizontalMovementSystem',
		'horizontalMovementSystem',
		'verticalMovementSystem2',
	],
);

const genPlayer2 = createEntity(
	'GenPlayer',
	['testComponent'],
	['moveLeftSystem', 'moveRightSystem'],
);

fs.writeFileSync('out/player.js', genPlayer2.trim());
console.log('Generated player');

// TODO: run prettier on the file, and maybe ESLint too

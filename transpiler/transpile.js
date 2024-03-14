import fs from 'fs';
// components & systems
import { testComponent, moveRightSystem, moveLeftSystem } from './in/test.js';
import { horizontalMovementComponent, verticalMovementComponent2, horizontalMovementSystem, verticalMovementSystem2, moveXSystem, moveYSystem, } from './in/player.js';
const parseComponent = (component) => {
    return component.data;
};
const regexComponentVar = /\s*const (?<varName>\w+) = entity\.component\?\.\(\w+\);\n/g;
const generateTokenRegex = (token) => {
    return new RegExp(`([^\w])${token}([^\w])`, 'g');
};
const parseSystem = (system) => {
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
const componentMap = new Map();
const systemsMap = new Map();
const nonNull = (u) => Boolean(u);
const consolidateSystemItems = (systems, type) => {
    return systems
        .map((s) => systemsMap.get(s)?.[type])
        .filter(nonNull)
        .reduce((acc, componentFunc) => {
        const args = [componentFunc.args, acc.args]
            .sort((a, b) => b.length - a.length)
            .at(0);
        return {
            args,
            body: acc.body.concat(componentFunc.body),
        };
    }, {
        args: [],
        body: [],
    });
};
const generateEntity = ({ fileName, entityName, components, systems, }) => {
    components.forEach((c) => {
        if (!componentMap.has(c))
            componentMap.set(c, parseComponent(c));
    });
    systems.forEach((s) => {
        if (!systemsMap.has(s.system))
            systemsMap.set(s.system, parseSystem(s.system));
    });
    const [update, render] = ['update', 'render'].map((type) => {
        const item = consolidateSystemItems(systems
            .filter((s) => s.outputType === 'inline')
            .map((s) => s.system), type);
        // TODO: allow for aliases to work for render
        if (type === 'update') {
            const aliases = systems
                .map((s) => (s.outputType === 'function' ? s.alias : null))
                .filter((nonNull));
            item.body = item.body.concat(aliases.map((a) => `\t\tthis.${a}();`));
        }
        return item;
    });
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
        .map((s) => 'alias' in s
        ? [s.alias, systemsMap.get(s.system).update.body]
        : null)
        .filter((nonNull))
        .map(([alias, body]) => {
        return `${alias}() {\n${body}\n\t}`;
    });
    console.log(functions);
    const entityContents = [
        propertiesStr,
        updateBody ? `update(${updateArgs}) {\n${updateBody}\n\t}` : '',
        renderBody ? `render(${renderArgs}) {\n${renderBody}\n\t}` : '',
        ...functions,
    ]
        .filter(Boolean)
        .join('\n\t\n\t');
    const contents = `import { Entity } from 'canvas-lord/util/entity.js';\n\nexport class ${entityName} extends Entity {\n\t${entityContents}\n}`;
    fs.writeFileSync(fileName, contents);
};
generateEntity({
    fileName: 'out/test.js',
    entityName: 'Test',
    components: [testComponent],
    systems: [
        { outputType: 'inline', system: moveLeftSystem },
        { outputType: 'inline', system: moveRightSystem },
    ],
});
generateEntity({
    fileName: 'out/player.js',
    entityName: 'GenPlayer',
    components: [horizontalMovementComponent, verticalMovementComponent2],
    systems: [
        // horizontalMovementSystem,
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
// TODO: be able to mark systems as functions
//	- any system that is marked as a function would be added as a method of the entity and called `this.moveX()` or w/e
// TODO: probably remove all logger stuff :)
// TODO: grouping would be sweet! (ie put all input checks together)
//# sourceMappingURL=transpile.js.map
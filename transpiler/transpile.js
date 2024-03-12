import fs from 'fs';
// TODO: check to make sure the component's properties are actually used by the systems!
// TODO: be able to mark systems as functions
//	- any system that is marked as a function would be added as a method of the entity and called `this.moveX()` or w/e
// TODO: probably remove all logger stuff :)
// TODO: grouping would be sweet! (ie put all input checks together)
const generate = (src, name, components, systems) => {
    const regexComponent = /(?:export)? const (?<name>\w+)\s=\sComponents\.createComponent\((?<data>\{(?:.|\s)*?\})\)\;/gm;
    const regexProperty = /(?<key>\w+)\: (?<value>\w+)/g;
    const componentPropertyMap = new Map();
    const r = new RegExp('');
    const rawComponents = [...src.matchAll(regexComponent)];
    rawComponents.forEach(({ groups }) => {
        if (!groups)
            return;
        const { name, data } = groups;
        if (!name || !data)
            return;
        const properties = [...data.matchAll(regexProperty)].map((m) => [m.groups?.key, JSON.parse(m.groups?.value)]);
        componentPropertyMap.set(name, properties);
    });
    // update\([\w,\s]*?\)\s{(?:.|\s)*?[\r\n]\t}
    // export const\s\w+\s=\s{\s*(?<update>update\([\w,\s]*?\)\s{(?:.|\s)*?[\r\n]\t})?,\s};
    const regexSystem = /export const\s(?<name>\w+)\s=\s{\s*(?<update>update\((?<updateArgs>[\w,\s]*?)\)\s{[\r\n](?<updateCode>(?:.|\s)*?)[\r\n]\t})?,\s};/gm;
    const regexComponentVar = /\s*const (?<varName>\w+) = entity.component\?\.\(\w+\);\n/g;
    const systemMap = new Map();
    const generateTokenRegex = (token) => {
        return new RegExp(`([^\w])${token}([^\w])`, 'g');
    };
    const rawSystems = [...src.matchAll(regexSystem)];
    rawSystems.forEach(({ groups }) => {
        if (!groups)
            return;
        const { name, update, updateArgs, updateCode, render, renderArgs } = groups;
        if (!name ||
            !update ||
            !updateArgs ||
            !updateCode
        // !render ||
        // !renderArgs
        ) {
            return;
        }
        const data = {};
        if (update) {
            let body = updateCode;
            const vars = [...updateCode.matchAll(regexComponentVar)];
            vars.forEach((v) => {
                if (!v.groups)
                    return;
                body = body
                    .replace(v[0], '')
                    .replaceAll(v.groups.varName, 'this');
            });
            body = body
                .replace(/update\(entity(?:, )?/, 'update(')
                .replaceAll(generateTokenRegex('entity'), '$1this$2');
            data.update = { args: updateArgs, body };
        }
        if (render) {
            data.render = { args: renderArgs, body: '' };
        }
        systemMap.set(name, data);
    });
    const nonNull = (u) => Boolean(u);
    // TODO: need to get archtypes data, but let's hardcode for now
    const createEntity = (name, components, systems) => {
        const consolidateSystemItems = (type) => {
            return systems
                .map((s) => systemMap.get(s)?.[type])
                .filter(nonNull)
                .reduce((acc, componentFunc) => {
                const args = [componentFunc.args.split(', '), acc.args]
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
        const update = consolidateSystemItems('update');
        const render = consolidateSystemItems('render');
        const updateArgs = update.args.filter((a) => a !== 'entity').join(', ');
        const updateBody = update.body.join('\n\t\t\n');
        const renderArgs = render.args.filter((a) => a !== 'entity').join(', ');
        const renderBody = render.body.join('\n\t\t\n');
        const properties = components
            .flatMap((key) => {
            return componentPropertyMap
                .get(key)
                ?.filter(([k]) => {
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
    // TODO: run prettier on the file, and maybe ESLint too
    return createEntity(name, components, systems);
};
const playerSrc = fs.readFileSync('../engine/player.js', 'utf-8');
const genPlayer = generate(playerSrc, 'GenPlayer', ['horizontalMovementComponent', 'verticalMovementComponent2'], [
    // 'horizontalMovementSystem',
    'horizontalMovementSystem',
    'verticalMovementSystem2',
]);
fs.writeFileSync('out/player.js', genPlayer.trim());
const testSrc = fs.readFileSync('./in/test.js', 'utf-8');
const genPlayer2 = generate(testSrc, 'Test', ['testComponent'], ['moveLeftSystem', 'moveRightSystem']);
fs.writeFileSync('out/test.js', genPlayer2.trim());
//# sourceMappingURL=transpile.js.map
import { promises as fs } from 'fs';
import { Transpiler } from './transpile.js';
const transform = async (data, file) => {
    const playerModule = await import(file);
    return {
        name: data.name,
        components: data.components.map((c) => playerModule[c]),
        systems: data.systems.map((s) => 'alias' in s
            ? {
                system: playerModule[s.name],
                outputType: s.outputType,
                alias: s.alias,
            }
            : {
                system: playerModule[s.name],
                outputType: s.outputType,
            }),
    };
};
{
    const transpiler = new Transpiler({
        inDir: 'in',
        outDir: 'out',
    });
    const settings = JSON.parse(await fs.readFile('./in/player-config.json', 'utf-8'));
    // generate a game and a scene
    const data = await transform(settings, './in/player.js');
    await transpiler.transpileEntityData(data, 'player3.js');
    await transpiler.generateGame();
}
console.log('Done');
//# sourceMappingURL=index.js.map
import { AssetManager, Game } from 'canvas-lord';
import { Inspector } from 'canvas-lord/inspector';
import { PlayerScene } from './player-scene';
export let assetManager;
export const initGame = (Player, properties) => (id, src = '') => {
    const game = new Game(id);
    game.backgroundColor = '#87E1A3';
    assetManager = new AssetManager(`${src}img/`);
    const inspector = new Inspector(game);
    if (properties.includes('x'))
        inspector.watch('x', {});
    if (properties.includes('y'))
        inspector.watch('y', {});
    if (properties.includes('coyoteLimit')) {
        inspector.watch('coyoteLimit', {
            min: 0,
            max: 60,
        });
    }
    if (properties.includes('jumpInputLimit')) {
        inspector.watch('jumpInputLimit', {
            min: 0,
            max: 60,
        });
    }
    assetManager.addImage('grid.bmp');
    assetManager.addImage('radiohead_spritesheet.png');
    assetManager.addImage('tileset.png');
    assetManager.onLoad(() => {
        console.log('== AssetManager::onLoad()');
        const splitScreen = true;
        const sceneLeft = new PlayerScene(Player, game, assetManager);
        const scenes = [sceneLeft];
        if (splitScreen) {
            const sceneRight = new PlayerScene(Player, game, assetManager);
            scenes.push(sceneRight);
            const sceneWidth = game.canvas.width / 2;
            sceneRight.screenPos[0] = sceneWidth;
            sceneLeft.setCanvasSize(sceneWidth, game.canvas.height);
            sceneRight.setCanvasSize(sceneWidth, game.canvas.height);
        }
        else {
            sceneLeft.setCanvasSize(game.canvas.width, game.canvas.height);
        }
        scenes.forEach((scene) => {
            scene.player.x = 40;
        });
        game.pushScenes(...scenes);
        game.render();
        inspector.onUpdate();
    });
    assetManager.loadAssets();
};
//# sourceMappingURL=platformer-tut.js.map
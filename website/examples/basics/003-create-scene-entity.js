import { Game, Scene, Entity } from 'canvas-lord';
import { Sprite } from 'canvas-lord/graphic';
const game = new Game('my-game');

const scene = new Scene();
game.pushScene(scene);

const entity = new Entity(20, 20);
entity.addGraphic(Sprite.createRect(32, 32, 'red'));
scene.addEntity(entity);

game.start();

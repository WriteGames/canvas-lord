import { Entity, Game, Scene } from 'canvas-lord/canvas-lord.js';
const game = new Game('my-game');
const scene = new Scene();
const player = new Entity();
scene.addEntity(player);
game.start();

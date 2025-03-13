import { Entity, Scene } from '../../bin/canvas-lord.js';
import { init } from '../sandbox.js';
import { Ease } from '../../bin/util/ease.js';
import { Tween } from '../../bin/util/tween.js';
import { Sprite } from '../../bin/graphic/sprite.js';
import { Text } from '../../bin/graphic/text.js';
import { Draw } from '../../bin/util/draw.js';

class TweenEntity extends Entity {
	constructor(x, y) {
		super(x, y);

		this.graphic = Sprite.createRect(32, 32, 'red');
		this.graphic.centerOO();
	}

	added() {
		console.log('added?');
		this.tween = new Tween();
		const dur = 1;
		this.tween.tweenProperty(this, 'x', 350, dur);
		this.tween.parallel().tweenProperty(this, 'y', 350, dur);
		this.tween.tweenProperty(this, 'x', 100, dur).asRelative();
		this.tween.tweenProperty(this.graphic, 'scale', 3, dur);
	}

	update() {
		this.tween.update();
	}
}

class TweenScene extends Scene {
	myEntities = [];

	constructor(engine) {
		super(engine);

		this.myEntities.push(new TweenEntity(32, 32));

		this.myEntities.forEach((e) => {
			this.addEntity(e);
		});
	}

	begin() {
		this.myEntities.forEach((e) => {
			e.added();
		});
	}
	
	render(gameCtx) {
		
	}
}

const gameSettings = {
	backgroundColor: '#202020',
	gameLoopSettings: {
		updateMode: 'always',
	},
};

const onStart = (game) => {
	window.requestAnimationFrame(() => {
		game.render();
	});
};

const gameOptions = {
	gameSettings,
	onStart,
};

init({
	games: [init.game('tweens', TweenScene, gameOptions)],
});

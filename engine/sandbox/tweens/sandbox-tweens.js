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

		let x = 0;
		let y = 0;
		let yDiff = 20;
		this.texts = ['One', 'Two', '333'].map((str) => {
			return new Text(str, x, y++ * yDiff);
		});
		this.texts.forEach((text) => this.addGraphic(text));

		this.updateStrings();
	}

	updateStrings() {
		const [e] = this.myEntities;
		const step = e.tween?.step !== undefined ? e.tween.step + 1 : undefined;
		this.texts[0].str =
			'Step: ' +
			step +
			' / ' +
			e.tween?.queue.length +
			` (index: ${e.tween?.step})`;
		this.texts[1].str =
			'Elapsed: ' +
			e.tween?.current?.map((t) => t.elapsed.toFixed(2)).join(', ');
		this.texts[2].str = 'Current: ' + e.tween?.current;
	}

	begin() {
		this.myEntities.forEach((e) => {
			e.added();
		});
	}

	update() {
		super.update(...arguments);
		this.updateStrings();
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

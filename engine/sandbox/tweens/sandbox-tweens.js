import { Entity, Scene } from '../../bin/canvas-lord.js';
import { init } from '../sandbox.js';
import { Ease } from '../../bin/util/ease.js';
import { EaseType, Tween } from '../../bin/util/tween.js';
import { Sprite } from '../../bin/graphic/sprite.js';
import { Text } from '../../bin/graphic/text.js';
import { Draw } from '../../bin/util/draw.js';

class TweenEntity extends Entity {
	constructor(x, y) {
		super(x, y);

		this.graphic = Sprite.createRect(32, 32, 'red');
		this.graphic.centerOO();
	}

	update(input) {
		if (input.mousePressed(0)) {
			// TODO(bret): this.tween.kill()

			const tween = new Tween().setTrans(7).setEase(EaseType.EaseInOut);
			const dur = 1;

			tween.tweenProperty(this, 'x', input.mouse.x, 1);
			tween.parallel().tweenProperty(this, 'y', input.mouse.y, 1);

			// do a rotate bc cool

			// tween.tweenProperty(this, 'x', 350, dur).setTrans(3);

			// tween
			// 	.parallel()
			// 	.tweenProperty(this, 'y', 350, dur)
			// 	.setTrans(3);

			// tween
			// 	.tweenProperty(this, 'x', 100, dur)
			// 	.asRelative()
			// 	.setDelay(1);
			// tween.tweenProperty(this.graphic, 'scale', 3, dur);

			this.tween = tween;
		}

		this.tween?.update();
		if (this.tween?.finished) this.tween = null;
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
			e.added?.();
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

import { CL, Entity, Scene } from '../../bin/canvas-lord.js';
import { init } from '../sandbox.js';
import { EaseType, Tween } from '../../bin/util/tween.js';
import { Sprite } from '../../bin/graphic/sprite.js';
import { Text } from '../../bin/graphic/text.js';
import { Vec2 } from '../../bin/math/index.js';
import { RAD_TO_DEG } from '../../bin/math/misc.js';

class TweenEntity extends Entity {
	constructor(x, y) {
		super(x, y);

		this.graphic = Sprite.createRect(32, 32, 'red');
		this.graphic.centerOO();

		this.pos = new Vec2(10, 10);
	}

	update(input) {
		if (input.mousePressed(0)) {
			// TODO(bret): this.tween.kill()
			const tween = new Tween().setTrans(7).setEase(EaseType.EaseInOut);
			const target = input.mouse.pos.clone();
			tween.tweenProperty(this, 'pos', target, 1);
			const delta = target.sub(this.pos);

			const angle = Math.atan2(delta.y, delta.x) * RAD_TO_DEG;

			tween
				.parallel()
				.tweenProperty(this.graphic, 'angle', angle, 0.5)
				.asAngle();

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

class Card extends Entity {
	constructor(x, y) {
		super(x, y);

		this.graphic = Sprite.createRect(60, 100, 'purple');
		this.graphic.centerOO();
	}

	update() {
		this.tween?.update();
		if (this.tween?.finished) this.tween = null;
	}
}

class CardScene extends Scene {
	constructor() {
		super();
	}

	begin() {
		const { width, height } = CL.engine;
		const hWidth = width >> 1;
		const hHeight = height >> 1;

		const spacingX = 100;
		const spacingY = 140;

		for (let i = 0; i < 8; ++i) {
			const card = new Card(hWidth, hHeight);

			const x = hWidth + (i % 4) * spacingX - spacingX * 1.5;
			const y = hHeight + Math.floor(i / 4) * spacingY - spacingY * 0.5;
			const delay = 0.5 + i * (3 / 60) + Math.floor(i / 4) * 0.12;

			const duration = 0.5;
			const scaleDur = duration - 0.2;

			card.graphic.scale = 0.5;

			// TODO(bret): Perfect opportunity to work on subtween
			const tween = new Tween().setTrans(7);

			const subtween = new Tween().setParallel(true).setTrans(7);
			subtween.tweenProperty(card.graphic, 'scale', 0.8, scaleDur);
			subtween
				.tweenProperty(card.graphic, 'angle', 0, duration)
				.from(-180);
			subtween.tweenProperty(card, 'x', x, duration);
			subtween.tweenProperty(card, 'y', y, duration);

			tween.tweenProperty(card.graphic, 'alpha', 1, 0.3).from(0);
			tween.tweenSubtween(subtween).setDelay(delay);
			tween.tweenProperty(card.graphic, 'scale', 1, 0.2);
			card.tween = tween;

			this.addEntity(card);
		}
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
	games: [
		init.game('tweens', TweenScene, gameOptions),
		init.game('cards', CardScene, gameOptions),
	],
});

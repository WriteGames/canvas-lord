import { Scene, Entity } from '../../bin/canvas-lord.js';
import { Sprite, Emitter } from '../../bin/graphic/index.js';
import { init } from '../sandbox.js';

class EmitterEntity extends Entity {
	constructor(x, y, easing) {
		super(x, y);

		// const sprite = Sprite.createRect(8, 8, '#888');
		const sprite = new Sprite(assetManager.sprites.get('particle.png'));

		const emitter = new Emitter(sprite, 0, 0);
		this.graphic = emitter;

		// emitter = new Emitter(new BitmapData(3, 3), 3, 3);

		const c = (n) => '#' + n.toString(16).padStart(6, '0');

		emitter.newType('sparkA', [0]);
		emitter.setAlpha('sparkA', 1, 0);
		emitter.setAngle('sparkA', 0, 360);
		emitter.setRotation('sparkA', 180, 360);
		emitter.setColor('sparkA', 'white', 'yellow');
		emitter.setMotion('sparkA', 270 - 45, 60, 60, 90, 60, 30, easing);

		this.emitter = emitter;

		// emitter.newType("sparkB", [0]);
		// emitter.setAlpha("sparkB", 1, 0);
		// emitter.setColor("sparkB", convert(8978431), convert(16777215));
		// emitter.setMotion("sparkB", 100, 20, 30, 160, 10, 15);

		// this.emitter.emit("sparkB", width - 2, 3);

		this.frame = 0;
	}

	update(input) {
		if (++this.frame % 2 === 0) this.emitter.emit('sparkA', 0, 3);
	}
}

class ParticleScene extends Scene {
	constructor(engine, easing) {
		super(engine);

		this.addEntity(new EmitterEntity(640 >> 2, 320 >> 1, easing));
	}
}

function easeOutBounce(x) {
	const n1 = 7.5625;
	const d1 = 2.75;

	if (x < 1 / d1) {
		return n1 * x * x;
	} else if (x < 2 / d1) {
		return n1 * (x -= 1.5 / d1) * x + 0.75;
	} else if (x < 2.5 / d1) {
		return n1 * (x -= 2.25 / d1) * x + 0.9375;
	} else {
		return n1 * (x -= 2.625 / d1) * x + 0.984375;
	}
}

function easeInBounce(x) {
	return 1 - easeOutBounce(1 - x);
}

const easing = [undefined, easeOutBounce, easeInBounce];

const { assetManager } = init({
	games: easing.map((ease, i) => {
		return init.game(`emitter-${i + 1}`, ParticleScene, {
			sceneArgs: [ease],
			gameSettings: {
				backgroundColor: '#353',
			},
		});
	}),
	assetSrc: '../../img/',
	assets: {
		images: ['particle.png'],
	},
});

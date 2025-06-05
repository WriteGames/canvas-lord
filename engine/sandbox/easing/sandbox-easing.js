import { Entity, Scene } from '../../bin/canvas-lord.js';
import { init } from '../sandbox.js';
import { Ease as FPEase } from './flashpunk-ease.js';
import { Ease as EASEYBOY } from '../../bin/util/ease.js';
import { Keys } from '../../bin/core/input.js';
import { Sprite } from '../../bin/graphic/sprite.js';
import { Text } from '../../bin/graphic/text.js';
import { Delegate } from '../../bin/util/delegate.js';
import { Draw } from '../../bin/util/draw.js';

const startX = 150;
const endX = 550;
const spanX = endX - startX;

const colors = [
	'red',
	'lime',
	'magenta',
	'yellow',
	'cyan',
	'pink',
	'white',
	'orange',
	'silver',
	'gold',
	'green',
];

let color = 0;

class EaseEntity extends Entity {
	constructor(x, y, ease) {
		super(x, y + 8);
		if (ease) this.ease = FPEase[ease] ?? EASEYBOY[ease];
		else this.ease = (x) => x;

		this.graphic = Sprite.createRect(16, 16, colors[color]);
		this.graphic.centerOO();
	}

	setT(t) {
		this.x = startX + spanX * this.ease(t);
	}
}

class EaseEntity2 extends Entity {
	constructor(x, y, ease) {
		super(x, y + 8);
		if (ease) this.ease = EASEYBOY[ease];
		else this.ease = (x) => x;

		this.graphic = Sprite.createRect(20, 20, colors[color + 1]);
		this.graphic.centerOO();
	}

	setT(t) {
		this.x = startX + spanX * this.ease(t);
	}
}

const toPrefix = (k) => k.slice(0, 3);

class BaseScene extends Scene {
	frame = 0;
	frameDur = 60 * 3;
	easeEntities = [];

	xPos = startX;
	yPos = 12;
	yPad = 20;

	update(...args) {
		super.update(...args);

		const t = Math.min(1, this.frame / this.frameDur);
		this.easeEntities.forEach((e) => e.setT(t));

		if (++this.frame > this.frameDur * 1.25) {
			this.frame = 0;
		}
	}

	render(gameCtx, ...args) {
		const ctx = this.ctx ?? gameCtx;
		const options = {
			color: 'white',
		};
		const { height } = this.engine;
		Draw.line(ctx, options, startX, 0, startX, height);
		Draw.line(ctx, options, endX, 0, endX, height);

		super.render(gameCtx, ...args);
	}
}

class EaseScene extends BaseScene {
	constructor(engine) {
		super(engine);

		color = 0;

		this.addEase(null);

		let lastKey = 'null';
		const keys = Object.keys(FPEase);
		for (let i = 0; i < keys.length; ++i) {
			const prefix = toPrefix(keys[i]);
			if (keys[i].endsWith('OutIn')) continue;
			if (lastKey !== prefix) {
				this.yPos += this.yPad;
				lastKey = prefix;
				++color;
			}
			this.addEase(keys[i]);
		}
	}

	addEase(ease) {
		const e = new EaseEntity(this.xPos, this.yPos, ease);
		this.easeEntities.push(e);
		this.addEntity(e);

		const text = new Text(ease, 12, this.yPos);
		this.addGraphic(text);

		this.yPos += this.yPad;
	}
}

class EaseScene2 extends BaseScene {
	constructor(engine, include) {
		super(engine);

		color = 0;

		this.addEase(null);

		const includePrefixes = include.map(toPrefix);

		let lastKey = 'null';
		const keys = Object.keys(EASEYBOY);
		for (let i = 0; i < keys.length; ++i) {
			const prefix = toPrefix(keys[i]);
			if (!includePrefixes.includes(prefix)) continue;

			if (lastKey !== prefix) {
				this.yPos += this.yPad;
				lastKey = prefix;
				++color;
			}
			this.addEase(keys[i]);
		}
	}

	addEase(ease) {
		const e2 = new EaseEntity2(this.xPos, this.yPos, ease);
		this.easeEntities.push(e2);
		this.addEntity(e2);

		const e = new EaseEntity(this.xPos, this.yPos, ease);
		this.easeEntities.push(e);
		this.addEntity(e);

		const text = new Text(ease, 12, this.yPos);
		this.addGraphic(text);

		this.yPos += this.yPad;
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

// #######################

const boxSize = 96;
class Box extends Entity {
	// NOTE(bret): see Box2 for a way I often abstract this logic to make variable
	// management easier when multiple animations exist on a single box
	isAnimating = false; // whether or not we are animating
	animT = 0; // current frame/time in the animation
	animDur = 30; // in frames, so 2 seconds (60fps)

	constructor(x, y) {
		super(x, y, Sprite.createRect(boxSize, boxSize, 'red'));

		// make the origin the center bottom
		this.graphic.originX = this.graphic.width / 2;
		this.graphic.originY = this.graphic.height;
	}

	update(input) {
		// only the frame space is pressed
		if (input.keyPressed(Keys.Space)) {
			// initialize animation
			this.isAnimating = true;
			this.animT = 0;
			console.warn('start');
		}

		if (this.isAnimating) {
			// have we gotten to the end?
			if (this.animT >= this.animDur) {
				this.animT = this.animDur;
				this.isAnimating = false;
				console.warn('end');
			}

			// normalize to 0 to 1 for use in easing functions
			const t = this.animT / this.animDur;

			// easing from start to end
			// this.x = boxStartX + 240 * EASEYBOY.bounceInOut(t);

			// Math.sin expects the range 0 to 2pi for a full rotation
			// We want half a rotation, so multiply t * pi
			const sin = Math.sin(t * Math.PI);
			this.graphic.scaleX = 1 + sin * 0.4;
			this.graphic.scaleY = 1 - sin * 0.3;

			// increment this at the end
			this.animT += 1;
		}
	}
}

class AnimationTiming {
	active = false;
	elapsed = 0;
	duration = -1;
	name = undefined;

	// NOTE(bret): Delegate is a class I made based off of C# delegates
	// https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/delegates/using-delegates
	// essentially you can add callbacks to them and then invoke them :)
	onStart = new Delegate();
	onComplete = new Delegate();

	constructor(duration, name = undefined) {
		if (duration <= 0)
			throw new Error(
				'AnimationTiming duration must be a non-zero positive value',
			);
		this.duration = duration;
		this.name = name;
	}

	get t() {
		return this.elapsed / this.duration;
	}

	update(dt) {
		// exit out early if it is not active
		if (!this.active) return;

		this.elapsed += dt;
		if (this.elapsed >= this.duration) {
			this.#finish();
		}
	}

	start() {
		this.active = true;
		this.elapsed = 0;

		this.onStart.invoke(this.name);
	}

	#finish() {
		this.active = false;

		this.onComplete.invoke(this.name);
	}
}

class Box2 extends Entity {
	pauseInputs = false;

	constructor(x, y) {
		super(x, y, Sprite.createRect(boxSize, boxSize, 'red'));

		// make the origin the center bottom
		this.graphic.originX = this.graphic.width / 2;
		this.graphic.originY = this.graphic.height;

		this.anim = new AnimationTiming(30, 'scale-anim');
		console.log(this.anim);
		this.anim.onStart.add((name) => {
			console.log(`Started "${name}" animation`);
			this.pauseInputs = true;
		});
		this.anim.onStart.add((name) => {
			console.log(`Finished "${name}" animation`);
			this.pauseInputs = false;
		});

		this.postUpdate.add(() => {
			// update this after we've processed the frame
			// pass in your engine's delta time
			this.anim.update(1);
		});
	}

	update(input) {
		if (!this.pauseInputs && input.keyPressed(Keys.Space)) {
			// NOTE(bret): feel free to replace 1 with your engine's delta time variable
			this.anim.start();
		}

		const sin = Math.sin(this.anim.t * Math.PI);
		this.graphic.scaleX = 1 + sin * 0.4;
		this.graphic.scaleY = 1 - sin * 0.3;

		// you can also put the postUpdate callback here :)
		// this.anim.update(1);
	}
}

class GameScene extends Scene {
	begin() {
		// this.engine.width;
		// this.addEntity(new Box(boxStartX, 240));

		const x1 = this.engine.width / 3; // 1/3 across screen
		const x2 = x1 * 2; // 2/3 across screen

		let y = this.engine.height / 2; // center of screen
		// since the origin is at the BOTTOM of the box, we have to offset it for proper centering
		y += boxSize / 2;

		this.addEntity(new Box(x1, y + boxSize / 2));
		this.addEntity(new Box2(x2, y + boxSize / 2));
	}
}

// #######################

const gameOptions = {
	gameSettings,
	onStart,
};

init({
	games: [
		init.game('squash', GameScene, gameOptions),
		// init.game('easing', EaseScene, gameOptions),
		init.game('easing-2', EaseScene2, {
			...gameOptions,
			sceneArgs: [['quad', 'cube', 'quart', 'quint', 'sine']],
		}),
		init.game('easing-3', EaseScene2, {
			...gameOptions,
			sceneArgs: [['bounce', 'circ', 'expo', 'back']],
		}),
	],
});

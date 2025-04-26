import { Entity, Scene } from '../../bin/canvas-lord.js';
import { init } from '../sandbox.js';
import { Ease as FPEase } from './flashpunk-ease.js';
import { Ease as EASEYBOY } from '../../bin/util/ease.js';
import { Sprite } from '../../bin/graphic/sprite.js';
import { Text } from '../../bin/graphic/text.js';
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

const gameOptions = {
	gameSettings,
	onStart,
};

init({
	games: [
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

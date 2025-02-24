import { Scene, Entity, Draw } from '../../bin/canvas-lord.js';
import {
	Sprite,
	AnimatedSprite,
	GraphicList,
} from '../../bin/graphic/index.js';
import { init } from '../sandbox.js';

class GraphicEntity extends Entity {
	constructor(x, y, moveOffset, rotateSpeed) {
		super(x, y);
		this.startX = x;
		this.startY = y;

		this.inc = 0;
		this.moveOffset = moveOffset;
		this.rotateSpeed = rotateSpeed;
	}

	reposition() {
		const t = (this.inc / 75) * 2 * this.rotateSpeed;
		const m = this.moveOffset;
		this.x = this.startX + Math.cos(t / 2) * 2 * m;
		this.y = this.startY + Math.sin(t) * m;

		this.graphic.angle += this.rotateSpeed;
		this.graphic.scale = 1 + Math.cos(this.graphic.angle / 20) * 0.15;

		if (this.graphic instanceof GraphicList) {
			this.graphic.graphics.forEach((gfx) => {
				gfx.x =
					Math.sign(gfx.x) *
					(30 + Math.cos(this.graphic.angle / 30) * 10);
				gfx.angle -= this.rotateSpeed * 1.75;
			});
		}
	}

	update() {
		this.reposition();

		++this.inc;
	}
}

class GraphicScene extends Scene {
	constructor(engine) {
		super(engine);

		const assetParticle = assetManager.sprites.get('particle.png');
		const assetParticle2 = assetManager.sprites.get('particle-2.png');
		const assetParticle3 = assetManager.sprites.get('particle-3.png');

		const halfW = engine.canvas.width >> 1;
		const quarW = engine.canvas.width >> 2;
		const yPos = engine.canvas.height >> 1;
		const yOffset = engine.canvas.height >> 2;

		const left = new GraphicEntity(quarW, yPos - yOffset, 20, 2.5);
		left.graphic = new Sprite(assetParticle);
		left.graphic.color = 'lime';

		const center = new GraphicEntity(halfW, yPos, 0, 1);
		const graphicList = new GraphicList();
		{
			const graphicOuterA = new Sprite(assetParticle);
			const graphicOuterB = new Sprite(assetParticle);
			const graphicOuterC = new Sprite(assetParticle3);
			graphicOuterA.x = 10;
			graphicOuterB.x = -graphicOuterA.x;
			graphicOuterC.color = 'yellow';
			graphicOuterC.blend = true;
			graphicList.add(graphicOuterA);
			graphicList.add(graphicOuterB);
			graphicList.add(graphicOuterC);
		}
		center.graphic = graphicList;

		const right = new GraphicEntity(
			engine.canvas.width - quarW,
			yPos + yOffset,
			15,
			-1,
		);
		right.graphic = new Sprite(assetParticle2);
		right.graphic.color = 'red';
		[left, center, right].forEach((entity) => {
			entity.graphic.centerOO();
			entity.reposition();
			this.addEntity(entity);
		});
	}
}

class RadioHead extends Entity {
	constructor(x, y, options = {}, label = '') {
		super(x, y);

		const { loop = true } = options;

		this.label = label;

		const anim = new AnimatedSprite(
			assetManager.sprites.get('radiohead_spritesheet.png'),
			32,
			32,
		);

		anim.add('walk', [0, 1, 2, 3], 15, loop);
		anim.play('walk');

		this.graphic = anim;
		this.graphic.centerOO();
	}

	render(ctx, camera) {
		super.render(ctx, camera);

		[
			`loop: ${this.graphic.currentAnimation?.loop}`,
			//
			this.label,
		].forEach((str, i) => {
			Draw.text(
				ctx,
				{ type: 'fill', color: 'white', align: 'center' },
				this.x,
				this.y - 8 - 10 * (i + 1),
				str,
			);
		});
	}
}

class AnimationScene extends Scene {
	constructor(engine) {
		super(engine);
		const xx = 16;
		const centerX = engine.canvas.width >> 1;
		const centerY = engine.canvas.height >> 1;

		const radioHead1 = new RadioHead(0, centerY);
		const radioHead2 = new RadioHead(0, centerY, {}, '.play() repeat');
		const radioHead3 = new RadioHead(0, centerY, {
			loop: false,
		});

		// this is so hacky, please don't do this!
		radioHead2.update = (input) => {
			// testing to make sure it doesn't restart
			radioHead2.graphic.play('walk');
		};

		const titles = ['Anim', 'update -> .play()'];

		const radioHeads = [radioHead1, radioHead2, radioHead3];
		const padding = 50;
		// TODO(bret): This is handy math! Move it to math.ts
		const offsetX = padding * ((radioHeads.length - 1) / 2);
		radioHeads.forEach((entity, i) => {
			entity.x = centerX - offsetX + padding * i;
		});

		this.addEntities(radioHeads);
	}
}

class Anim extends Entity {
	frame = 0;

	constructor(x, y, play, options = {}) {
		super(x, y);

		const { loop = true, useCallback = false, frame = undefined } = options;

		const asset = assetManager.sprites.get('../sandbox/img/animation.png');

		const _callback = (name) => {
			switch (name) {
				case '1':
					gfx.play('2');
					break;
				case '2':
					gfx.play('3');
					break;
				case '3':
					gfx.play('1');
					break;
			}
		};
		const callback = useCallback ? _callback : undefined;

		const gfx = new AnimatedSprite(asset, 32, 32, callback);

		const anim1 = [0, 1, 2, 3];
		const anim2 = [5, 6, 7];
		const anim3 = [10, 11, 12, 13, 14];

		const fr = 10;

		gfx.add('all', [...anim1, ...anim2, ...anim3], fr, loop);
		gfx.add('1', anim1, fr, loop, callback);
		gfx.add('2', anim2, fr, loop, callback);
		gfx.add('3', anim3, fr, loop, callback);

		gfx.play(play, false, frame);

		this.graphic = gfx;
	}

	update() {
		super.update();
		++this.frame;
	}
}

class AnimationScene2 extends Scene {
	constructor(engine) {
		super(engine);

		const spacing = 48;

		let x = 0;
		let y = 0;
		const animAll = new Anim(x, y, 'all');
		x += spacing;
		const animCallback = new Anim(x, y, '1', {
			loop: false,
			useCallback: true,
		});

		y += spacing;
		x = 0;
		const anim1 = new Anim(x, y, '1');
		x += spacing;
		const anim2 = new Anim(x, y, '2');
		x += spacing;
		const anim3 = new Anim(x, y, '3');

		y += spacing;
		x = 0;
		const noLoopOptions = { loop: false };
		const anim1Stop = new Anim(x, y, '1', noLoopOptions);
		x += spacing;
		const anim2Stop = new Anim(x, y, '2', noLoopOptions);
		x += spacing;
		const anim3Stop = new Anim(x, y, '3', noLoopOptions);

		y += spacing;
		x = 0;
		const anim1_1 = new Anim(x, y, '1', {
			loop: false,
			frame: 0,
		});
		x += spacing;
		const anim1_2 = new Anim(x, y, '1', {
			loop: false,
			frame: 1,
		});
		x += spacing;
		const anim1_3 = new Anim(x, y, '1', {
			loop: false,
			frame: 2,
		});
		x += spacing;
		const anim1_4 = new Anim(x, y, '1', {
			loop: false,
			frame: 3,
		});

		this.addEntities(
			animAll,
			animCallback,
			anim1,
			anim2,
			anim3,
			anim1Stop,
			anim2Stop,
			anim3Stop,
			anim1_1,
			anim1_2,
			anim1_3,
			anim1_4,
		);
	}
}

const { assetManager } = init({
	games: [
		init.game('animation-2', AnimationScene2),
		init.game('animation', AnimationScene),
		init.game('graphics', GraphicScene),
	],
	assetSrc: '../../img/',
	assets: {
		images: [
			'radiohead_spritesheet.png',
			'particle.png',
			'particle-2.png',
			'particle-3.png',
			'../sandbox/img/animation.png',
		],
	},
});

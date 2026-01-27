import { Entity } from '../../bin/core/entity.js';
import { Scene } from '../../bin/core/scene.js';
import {
	AnimatedSprite,
	GraphicList,
	Sprite,
	Tileset,
} from '../../bin/graphic/index.js';
import { Draw } from '../../bin/util/draw.js';
import { Grid } from '../../bin/util/grid.js';
import { init } from '../sandbox.js';

import { Vec2 } from '../../bin/math/index.js';
import {
	cardinalNorms,
	filterWithinBounds,
	globalSetTile,
	mapByOffset,
	mapFindOffset,
	normToBitFlagMap,
	reduceBitFlags,
} from '../../bin/math/misc.js';

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

class TilesetScene extends Scene {
	grid;
	tileset;

	constructor() {
		super();
		this.backgroundColor = '#90e0a6';
		this.grid = Grid.fromBitmap(assetManager, 'grid.bmp', 16, 16);
		const tileset = this.initTileset(this.grid, assetManager);
		tileset.update = () => {};
		tileset.x = -16;
		tileset.y = -16;
		tileset.originX = -32;
		tileset.originY = -32;
		this.addGraphic(tileset);
	}

	initTileset(grid, assetManager) {
		const img = assetManager.sprites.get('tileset.png');
		if (!img) throw new Error();
		const tileset = new Tileset(img, grid.width, grid.height, 16, 16, {
			startX: 1,
			startY: 1,
			separation: 1,
		});
		const setCloud1 = (x, y) => tileset.setTile(x, y, 4, 3);
		const setCloud2 = (x, y) =>
			[0, 1].forEach((v) => tileset.setTile(x + v, y, 5 + v, 3));
		const setCloud3 = (x, y) =>
			[0, 1, 2].forEach((v) => tileset.setTile(x + v, y, 4 + v, 4));
		setCloud1(7, 1);
		setCloud1(14, 2);
		setCloud2(4, 3);
		setCloud2(9, 7);
		setCloud2(0, 8);
		setCloud3(5, 5);
		setCloud3(15, 6);
		setCloud3(-1, 2);
		const filterWithinGridBounds = filterWithinBounds(
			new Vec2(0, 0),
			new Vec2(grid.columns, grid.rows),
		);
		for (let y = 0; y < grid.rows; ++y) {
			for (let x = 0; x < grid.columns; ++x) {
				const pos = new Vec2(x, y);
				if (grid.getTile(x, y) === 0) continue;
				const val = cardinalNorms
					.map(mapByOffset(pos))
					.filter(filterWithinGridBounds)
					.filter(([x, y]) => grid.getTile(x, y))
					.map(mapFindOffset(pos))
					.map((norm) => normToBitFlagMap.get(norm))
					.reduce(reduceBitFlags, 0);
				globalSetTile(tileset, x, y, val);
			}
		}
		return tileset;
	}
}

const { assetManager } = init({
	games: [
		init.game('tileset', TilesetScene),
		init.game('animation-2', AnimationScene2),
		init.game('animation', AnimationScene),
		init.game('graphics', GraphicScene),
	],
	assetSrc: '../../img/',
	assets: {
		images: [
			'radiohead_spritesheet.png',
			'tileset.png',
			'grid.bmp',
			'particle.png',
			'particle-2.png',
			'particle-3.png',
			'../sandbox/img/animation.png',
		],
	},
});

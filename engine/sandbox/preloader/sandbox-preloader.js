import { Game } from '../../bin/core/engine.js';
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
import { AssetManager } from '../../bin/main.js';

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
		const img = assetManager.getImage('tileset.png');
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

const assetSrc = '../../img/';
const assets = {
	images: [
		'radiohead_spritesheet.png',
		'tileset.png',
		'grid.bmp',
		'particle.png',
		'particle-2.png',
		'particle-3.png',
		'../sandbox/img/animation.png',
		'https://upload.wikimedia.org/wikipedia/commons/f/ff/Pizigani_1367_Chart_10MB.jpg',
	],
};

const assetManager = new AssetManager(assetSrc);
assets?.images?.forEach((asset) => assetManager.addImage(asset));
assets?.audio?.forEach((asset) => assetManager.addAudio(asset));

const game = new Game('preloader', {
	assetManager,
	gameLoopSettings: {
		updateMode: 'always',
		renderMode: 'onUpdate',
	},
});

game.preload(() => {
	game.pushScene(new TilesetScene());
});

// init({
// 	games: [init.game('preloader', TilesetScene)],
// 	assetSrc,
// 	assets,
// });

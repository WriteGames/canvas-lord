import { Tileset } from './bin/main.js';

import {
	cardinalNorms,
	globalSetTile,
	mapByOffset,
	mapFindOffset,
	normToBitFlagMap,
	reduceBitFlags,
} from './bin/math/misc.js';
import { Grid, GridOutline } from './bin/util/grid.js';
import { ButtonsOverlay } from './bin/util/buttons-overlay.js';

export const initTileset = (assetManager, grid) => {
	const tileset = new Tileset(
		assetManager.getImage('tileset.png'),
		grid.width,
		grid.height,
		16,
		16,
	);

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
		[0, 0],
		[grid.columns, grid.rows],
	);
	for (let y = 0; y < grid.rows; ++y) {
		for (let x = 0; x < grid.columns; ++x) {
			const pos = [x, y];

			if (grid.getTile(...pos) === 0) continue;

			const val = cardinalNorms
				.map(mapByOffset(pos))
				.filter(filterWithinGridBounds)
				.filter((pos) => grid.getTile(...pos))
				.map(mapFindOffset(pos))
				.map((norm) => normToBitFlagMap.get(norm))
				.reduce(reduceBitFlags, 0);

			globalSetTile(tileset, x, y, val);
		}
	}

	return tileset;
};

export const createSceneGrid = (scene, assetManager) => {
	scene.grid = Grid.fromBitmap(assetManager, 'grid.bmp', 16, 16);

	const padding = scene.grid.height;
	scene.bounds = [0, -padding, scene.grid.width, scene.grid.height + padding];

	scene.tileset = initTileset(assetManager, scene.grid);
	scene.gridOutline = new GridOutline();
	scene.gridOutline.computeOutline(scene.grid);

	scene.addRenderable(new Entity(0, 0, scene.tileset));
	scene.addRenderable(new Entity(0, 0, scene.gridOutline));
};

export const createButtons = (scene, { leftKeys, rightKeys, jumpKeys }) => {
	return scene.addEntity(
		new ButtonsOverlay(50, 168, {
			left: leftKeys,
			right: rightKeys,
			jump: jumpKeys,
		}),
	);
};

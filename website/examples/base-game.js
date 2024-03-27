import {
	AssetManager,
	cardinalNorms,
	filterWithinBounds,
	Game,
	globalSetTile,
	Grid,
	GridOutline,
	mapByOffset,
	mapFindOffset,
	normToBitFlagMap,
	reduceBitFlags,
	Scene,
	Tileset,
} from 'canvas-lord';
import { Inspector } from 'canvas-lord/inspector';

const initGrid = () => {
	const grid = new Grid(320, 180, 16, 16);

	for (let y = 1; y < grid.rows; ++y) {
		grid.setTile(0, y, 1);
		grid.setTile(grid.columns - 1, y, 1);
	}

	grid.setTile(1, 4, 1);
	grid.setTile(1, 5, 1);

	for (let x = 0; x < grid.columns; ++x) {
		grid.setTile(x, 10, 1);
		grid.setTile(x, 11, 1);
	}

	for (let x = 8; x <= 11; ++x) {
		grid.setTile(x, 9, 1);
	}

	for (let x = 4; x <= 5; ++x) {
		grid.setTile(x, 7, 1);
		grid.setTile(x, 8, 1);
		// grid.setTile(x, 9, 1);
	}

	for (let y = 6; y <= 9; ++y) {
		for (let x = 17; x <= 18; ++x) {
			grid.setTile(x, y, 1);
		}
	}

	grid.setTile(15, 8, 1);
	grid.setTile(15, 9, 1);

	for (let y = 3, yn = y + 2; y < yn; ++y) {
		for (let x = 9, n = x + 4; x < n; ++x) {
			grid.setTile(x, y, 1);
		}
	}
	grid.setTile(9, 5, 1);
	grid.setTile(12, 5, 1);

	return grid;
};

const initGrid2 = () => {
	const grid = initGrid();

	Array.from({ length: 4 }, (_, i) => grid.setTile(9 + i, 6, 1));

	grid.setTile(8, 5, 1);
	grid.setTile(8 + 5, 5, 1);

	return grid;
};

const initTileset = (grid) => {
	const tileset = new Tileset(
		assetManager.images.get('tileset.png'),
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

const updateCamera = (scene, player) => {
	const newX = player.x + player.width / 2 - scene.canvas.width / 2;
	scene.camera.x = Math.clamp(newX, 0, scene.width - scene.canvas.width);
};

class PlayerScene extends Scene {
	constructor(Player, engine) {
		super(engine);

		// this.player = this.addEntity(new Player(160, 120));
		this.player = this.addEntity(new Player(40, 144));

		this.grid = Grid.fromBitmap(assetManager, 'grid.bmp', 16, 16);
		// this.grid = Grid.fromBinary([
		// 	20,
		// 	12,
		// 	2048,
		// 	25165848,
		// 	125943928,
		// 	470598016,
		// 	2021179399,
		// 	2348906511,
		// 	402653183,
		// 	4294901760
		// ], 16, 16);
		this.width = this.grid.width;
		this.height = this.grid.height;

		this.boundsX = [0, this.width];

		this.tileset = initTileset(this.grid);
		this.gridOutline = new GridOutline();
		this.gridOutline.computeOutline(this.grid);

		this.addRenderable(this.tileset);
		// this.addRenderable(this.grid);
		this.addRenderable(this.gridOutline);
		this.addRenderable(this.player);
	}

	setCanvasSize(width, height) {
		super.setCanvasSize(width, height);

		updateCamera(this, this.player);
	}

	update(input) {
		super.update(input);

		updateCamera(this, this.player);
	}
}

export let assetManager;
export const initGamesBase =
	(Player, properties) =>
	(id, src = '') => {
		const game1 = new Game(id);
		const games = [game1];
		assetManager = new AssetManager(`${src}img/`);

		const inspector = new Inspector(game1);
		if (properties.includes('x')) inspector.watch('x', {});
		if (properties.includes('y')) inspector.watch('y', {});
		if (properties.includes('coyoteLimit')) {
			inspector.watch('coyoteLimit', {
				min: 0,
				max: 60,
			});
		}
		if (properties.includes('jumpInputLimit')) {
			inspector.watch('jumpInputLimit', {
				min: 0,
				max: 60,
			});
		}

		assetManager.addImage('grid.bmp');
		assetManager.addImage('radiohead_spritesheet.png');
		assetManager.addImage('tileset.png');
		assetManager.onLoad(() => {
			console.log('== AssetManager::onLoad()');

			const splitScreen = false;

			games.forEach((game) => {
				game.backgroundColor = '#87E1A3';

				const sceneWidth = game.canvas.width / 2;

				const sceneLeft = new PlayerScene(Player, game);
				sceneLeft.backgroundColor = '#87E1A3';
				sceneLeft.player.x = 40;
				if (splitScreen === true) {
					sceneLeft.setCanvasSize(sceneWidth, game.canvas.height);
				} else {
					sceneLeft.setCanvasSize(game.canvas.width, game.canvas.height);
				}

				if (splitScreen === true) {
					const sceneRight = new PlayerScene(Player, game);
					sceneRight.backgroundColor = '#87E1A3';
					sceneRight.player.x = 40;
					sceneRight.screenPos[0] = sceneWidth;
					sceneRight.setCanvasSize(sceneWidth, game.canvas.height);
					// sceneRight.shouldUpdate = false;

					game.pushScenes(sceneLeft, sceneRight);
				} else {
					game.pushScenes(sceneLeft);
				}

				game.render();
			});

			inspector.onUpdate();
		});
		assetManager.loadAssets();
	};

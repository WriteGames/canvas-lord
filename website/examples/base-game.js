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

class PlayerScene extends Scene {
	constructor(Player, engine) {
		super(engine);

		this.player = this.addEntity(new Player(40, 144));

		this.grid = Grid.fromBitmap(assetManager, 'grid.bmp', 16, 16);

		const padding = this.grid.height;
		this.bounds = [0, -padding, this.grid.width, this.grid.height + padding];

		this.tileset = initTileset(this.grid);
		this.gridOutline = new GridOutline();
		this.gridOutline.computeOutline(this.grid);

		this.addRenderable(this.tileset);
		this.addRenderable(this.gridOutline);
		this.addRenderable(this.player);
	}

	updateCamera() {
		const newX = this.player.x + this.player.width / 2 - this.canvas.width / 2;
		const x0 = this.bounds[0];
		const x1 = x0 + this.bounds[2];
		this.camera.x = Math.clamp(newX, x0, x1 - this.canvas.width);
	}

	setCanvasSize(width, height) {
		super.setCanvasSize(width, height);

		this.updateCamera();
	}

	update(input) {
		super.update(input);

		this.updateCamera();
	}
}

export let assetManager;
export const initGamesBase =
	(Player, properties) =>
	(id, src = '') => {
		assetManager = new AssetManager(`${src}img/`);

		assetManager.addImage('grid.bmp');
		assetManager.addImage('radiohead_spritesheet.png');
		assetManager.addImage('tileset.png');

		assetManager.onLoad(() => {
			console.log('== AssetManager::onLoad()');

			const splitScreen = true;

			const sceneLeft = new PlayerScene(Player, game);

			const scenes = [sceneLeft];

			if (splitScreen) {
				const sceneRight = new PlayerScene(Player, game);
				scenes.push(sceneRight);

				const sceneWidth = game.canvas.width / 2;
				sceneRight.screenPos[0] = sceneWidth;

				sceneLeft.setCanvasSize(sceneWidth, game.canvas.height);
				sceneRight.setCanvasSize(sceneWidth, game.canvas.height);
			} else {
				sceneLeft.setCanvasSize(game.canvas.width, game.canvas.height);
			}

			scenes.forEach((scene) => {
				scene.player.x = 40;
			});
			game.pushScenes(...scenes);

			game.render();

			inspector.onUpdate();
		});

		const game = new Game(id);
		game.backgroundColor = '#87E1A3';
		const inspector = new Inspector(game);
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

		game.load(assetManager);
	};

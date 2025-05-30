import type { AssetManager } from 'canvas-lord/core/asset-manager';
import type { Engine } from 'canvas-lord/core/engine';
import { Entity } from 'canvas-lord/core/entity';
import type { Input } from 'canvas-lord/core/input';
import { Scene } from 'canvas-lord/core/scene';
import { Vec2 } from 'canvas-lord/math/index';
import {
	cardinalNorms,
	filterWithinBounds,
	globalSetTile,
	mapByOffset,
	mapFindOffset,
	normToBitFlagMap,
	reduceBitFlags,
} from 'canvas-lord/math/misc';
import { Tileset } from 'canvas-lord/graphic';
import { Grid, GridOutline } from 'canvas-lord/util/grid';

export interface PlayerClass extends Entity {
	// width: number;
	// height: number;
}

export class PlayerClass extends Entity {}

export class PlayerScene<P extends PlayerClass> extends Scene {
	player: P;
	grid: Grid;
	tileset: Tileset;
	gridOutline: GridOutline;
	bounds: [number, number, number, number];

	constructor(
		Player: typeof PlayerClass,
		engine: Engine,
		assetManager: AssetManager,
	) {
		super(engine);

		this.player = this.addEntity(new Player(40, 144) as P);

		this.grid = Grid.fromBitmap(assetManager, 'grid.bmp', 16, 16);

		const padding = this.grid.height;
		this.bounds = [
			0,
			-padding,
			this.grid.width,
			this.grid.height + padding,
		];

		this.tileset = this.initTileset(this.grid, assetManager);
		this.gridOutline = new GridOutline();
		this.gridOutline.computeOutline(this.grid);

		this.addRenderable(this.tileset);
		this.addRenderable(this.gridOutline);
	}

	initTileset(grid: Grid, assetManager: AssetManager) {
		const img = assetManager.sprites.get('tileset.png');
		if (!img) throw new Error();

		const tileset = new Tileset(img, grid.width, grid.height, 16, 16);

		const setCloud1 = (x: number, y: number) => tileset.setTile(x, y, 4, 3);
		const setCloud2 = (x: number, y: number) =>
			[0, 1].forEach((v) => tileset.setTile(x + v, y, 5 + v, 3));
		const setCloud3 = (x: number, y: number) =>
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
				const pos: Vec2 = new Vec2(x, y);

				if (grid.getTile(x, y) === 0) continue;

				const val = cardinalNorms
					.map(mapByOffset(pos))
					.filter(filterWithinGridBounds)
					.filter(([x, y]) => grid.getTile(x, y))
					.map(mapFindOffset(pos))
					.map<number>((norm) => normToBitFlagMap.get(norm)!)
					.reduce(reduceBitFlags, 0);

				globalSetTile(tileset, x, y, val);
			}
		}

		return tileset;
	}

	updateCamera() {
		const newX =
			this.player.x + this.player.width / 2 - this.canvas.width / 2;
		const x0 = this.bounds[0];
		const x1 = x0 + this.bounds[2];
		this.camera.x = Math.clamp(newX, x0, x1 - this.canvas.width);
	}

	setCanvasSize(width: number, height: number) {
		super.setCanvasSize(width, height);

		this.updateCamera();
	}

	update(input: Input) {
		super.update(input);

		this.updateCamera();
	}
}

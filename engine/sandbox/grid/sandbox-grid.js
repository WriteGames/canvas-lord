import { Scene, Grid } from '../../bin/main.js';
import { init } from '../sandbox.js';

class GridScene extends Scene {
	constructor(...args) {
		super(...args);
	}

	render(ctx) {
		this.grid?.render(ctx, this.camera);
	}
}

class GridBitmapScene extends GridScene {
	constructor(...args) {
		super(...args);

		this.grid = Grid.fromBitmap(
			this.engine.assetManager,
			'grid.bmp',
			16,
			16,
		);

		/// default is BOXES :)
		// this.grid.renderMode = Grid.RenderMode.OUTLINE;
		// this.grid.renderMode = Grid.RenderMode.BOXES_OUTLINE;
		// this.grid.renderMode = Grid.RenderMode.BOXES;
	}
}

class GridArrayScene extends GridScene {
	constructor(...args) {
		super(...args);

		const data = [
			0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0,
			0, 0, 0, 0, 1, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0,
			1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1, 0, 1, 0, 0, 0, 0, 1, 1, 1,
			0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 1, 1, 1, 1, 0,
			0, 1, 0, 1, 0, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 1, 0, 1, 0, 0,
			0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 0,
			0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0,
			1, 1, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 1, 0, 0, 1, 1,
			1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 1, 0,
			1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0,
		];
		this.grid = Grid.fromArray(data, 240, 240, 16, 16);
	}
}

class GridBinaryScene extends GridScene {
	constructor(...args) {
		super(...args);

		// each binary number is a bitmask for the next 32 cells
		const binary = [
			20, 12, 2048, 25165848, 125943928, 470598016, 2021179399,
			2348906511, 402653183, 4294901760,
		];
		this.grid = Grid.fromBinary(binary, 16, 16);
	}
}

class GridManualScene extends GridScene {
	constructor(...args) {
		super(...args);

		// pixelW, pixelH, tileW, tileH
		this.grid = new Grid(320, 192, 16, 16);
		// x, y, value
		this.grid.setTile(1, 1, 1); // 0 = empty, 1 = filled
		this.grid.setTile(2, 1, 1);
		this.grid.setTile(3, 2, 1);
	}
}

const gameSettings = {
	backgroundColor: '#003300',
};
init({
	games: [
		init.game('grid-bitmap', GridBitmapScene, { gameSettings }),
		init.game('grid-array', GridArrayScene, { gameSettings }),
		init.game('grid-binary', GridBinaryScene, { gameSettings }),
		init.game('grid-manual', GridManualScene, { gameSettings }),
	],
	assetSrc: '../../img/',
	assets: {
		images: ['grid.bmp'],
	},
});

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
	Tuple,
	v2zero,
	addPos,
	subPos,
	dirND,
	findAllPolygonsInGrid,
	drawLine,
	checkLineSegmentIntersection,
	getLineSegmentIntersection,
	isPointOnLine,
	isPointInsidePath,
} from './canvas-lord.js';

/* eslint-disable no-undef */
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
		Tuple(0, 0),
		Tuple(grid.columns, grid.rows),
	);
	for (let y = 0; y < grid.rows; ++y) {
		for (let x = 0; x < grid.columns; ++x) {
			const pos = Tuple(x, y);

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

class LineSegmentScene extends Scene {
	constructor() {
		super();

		this.origin = [0, 0];
		this.target = [0, 0];

		const shapes = [
			[
				[0, 16],
				[0, 191],
				[319, 191],
				[319, 16],
				[304, 16],
				[304, 96],
				[272, 96],
				[272, 160],
				[255, 160],
				[255, 128],
				[240, 128],
				[240, 160],
				[191, 160],
				[191, 144],
				[128, 144],
				[128, 160],
				[15, 160],
				[15, 95],
				[31, 95],
				[31, 64],
				[15, 64],
				[15, 16],
			],
			[
				[64, 16],
				[64, 47],
				[79, 47],
				[79, 16],
			],
			[
				[240, 16],
				[240, 31],
				[255, 31],
				[255, 16],
			],
			[
				[144, 48],
				[144, 80],
				[128, 80],
				[128, 95],
				[144, 95],
				[144, 111],
				[207, 111],
				[207, 95],
				[223, 95],
				[223, 80],
				[207, 80],
				[207, 48],
			],
			[
				[159, 79],
				[159, 96],
				[192, 96],
				[192, 79],
			],
			[
				[64, 112],
				[64, 143],
				[95, 143],
				[95, 112],
			],
		];

		this.shapes = shapes;

		this.square = shapes[shapes.length - 1];
		this.innerSquare = shapes[shapes.length - 2];

		this.windingPoint = v2zero;
		this.windingPointInsideShape = false;

		this.points = shapes.flat();

		this.lines = shapes.flatMap((shape) => {
			return shape.map((point, i, arr) => [
				point,
				arr[(i + 1) % arr.length],
			]);
		});

		this.intersecting = this.lines.map((line) => false);
		this.intersections = this.lines.map((line) => null);
	}

	update(input) {
		super.update(input);

		const { mouse } = input;

		const record = input.mousePressed();

		if (record === true) console.time('intersection');
		this.target = [...mouse.pos];

		this.intersecting = this.lines.map((line) => {
			return checkLineSegmentIntersection(
				[this.origin, this.target],
				line,
			);
		});

		this.intersections = this.lines.map((line) => {
			return getLineSegmentIntersection([this.origin, this.target], line);
		});
		if (record === true) console.timeEnd('intersection');

		if (input.mousePressed()) {
			console.time('winding');
			this.windingPoint = [...mouse.pos];

			const shapesInside = this.shapes.filter((shape) =>
				isPointInsidePath(this.windingPoint, shape),
			);

			if (shapesInside.length % 2 === 1) {
				this.windingPointInsideShape = true;
			} else {
				// Whether or not we're overlapping any edges
				this.windingPointInsideShape = this.shapes.some((shape) =>
					shape.some((vertex, i, arr) => {
						return isPointOnLine(
							this.windingPoint,
							vertex,
							arr[(i + 1) % arr.length],
						);
					}),
				);
			}

			console.timeEnd('winding');
		}
	}

	render(ctx) {
		ctx.lineWidth = 1;

		const correction = [0.5, 0.5];

		this.lines.forEach((line, i) => {
			ctx.strokeStyle = this.intersecting[i] ? 'red' : 'white';
			ctx.beginPath();
			ctx.moveTo(...addPos(line[0], correction));
			ctx.lineTo(...addPos(line[1], correction));
			ctx.closePath();
			ctx.stroke();
		});

		const inside = this.intersecting.filter((v) => v).length % 2 === 1;
		ctx.strokeStyle = inside ? 'lime' : 'white';

		ctx.beginPath();
		ctx.moveTo(...addPos(this.origin, correction));
		ctx.lineTo(...addPos(this.target, correction));
		ctx.closePath();
		ctx.stroke();

		this.intersections.forEach((i) => {
			if (i !== null) {
				ctx.strokeStyle = 'lime';
				ctx.beginPath();
				ctx.arc(...addPos(i, correction), 5, 0, 2 * Math.PI);
				ctx.closePath();
				ctx.stroke();
			}
		});

		const pointColor = this.windingPointInsideShape ? '#00E0A7' : '#FF2C55';
		ctx.fillStyle = pointColor;
		ctx.beginPath();
		ctx.arc(...addPos(this.windingPoint, correction), 0.5, 0, 2 * Math.PI);
		ctx.closePath();
		ctx.fill();

		if (true) {
			ctx.strokeStyle = pointColor;
			ctx.beginPath();
			ctx.arc(
				...addPos(this.windingPoint, correction),
				8,
				0,
				2 * Math.PI,
			);
			ctx.closePath();
			ctx.stroke();
		}
	}
}

class ContourTracingScene extends Scene {
	constructor() {
		super();

		this.columns = 20;
		this.rows = 12;

		this.tileW = 16;
		this.tileH = 16;

		// prettier-ignore
		this.gridData = [
			0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
			1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1,
			1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
			1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1,
			1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1,
			1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 1,
			1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1,
			1, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1,
			1, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 1, 1,
			1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 1, 0, 1, 1, 1,
			1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
			1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
		];

		this.crawler = {
			pos: [0, 0],
			dir: dirND,
		};

		this.polygons = findAllPolygonsInGrid(
			this.gridData,
			this.columns,
			this.rows,
		);

		this.timer = 0;
		this.timeout = 60;
	}

	update(input) {
		super.update(input);

		if (++this.timer < this.timeout) return;
		this.timer = 0;

		// Do shit
		console.log('y0oooo');
	}

	isSolidAt(x, y) {
		return this.gridData[y * this.columns + x] > 0;
	}

	render(ctx) {
		ctx.strokeStyle = 'gray';

		const correction = [0.5, 0.5];

		for (let y = 0; y < this.rows; ++y) {
			let yy = y * this.tileH + 0.5;
			drawLine(ctx, 0.5, yy, this.columns * this.tileW + 0.5, yy);
			yy += this.tileH - 1;
			drawLine(ctx, 0.5, yy, this.columns * this.tileW + 0.5, yy);
		}

		for (let x = 0; x < this.columns; ++x) {
			let xx = x * this.tileW + 0.5;
			drawLine(ctx, xx, 0.5, xx, this.rows * this.tileH + 0.5);
			xx += this.tileW - 1;
			drawLine(ctx, xx, 0, xx, this.rows * this.tileH);
		}

		for (let y = 0; y < this.rows; ++y) {
			for (let x = 0; x < this.columns; ++x) {
				if (this.isSolidAt(x, y)) {
					ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
					ctx.fillRect(
						x * this.tileW + 0.5,
						y * this.tileH + 0.5,
						this.tileW - 1,
						this.tileH - 1,
					);
				} else if (false) {
					// ctx.strokeStyle = 'gray';
				}
			}
		}

		this.polygons.forEach((polygon) => {
			ctx.beginPath();
			ctx.strokeStyle = 'red';
			ctx.moveTo(
				...subPos(addPos(polygon.points[0], [0.5, 0.5]), this.camera),
			);
			polygon.points
				.slice(1)
				.map((p) => subPos(p, this.camera))
				.forEach(([x, y]) => {
					ctx.lineTo(x + 0.5, y + 0.5);
				});
			ctx.closePath();
			ctx.stroke();
		});
	}
}

class PlayerScene extends Scene {
	constructor(Player, engine) {
		super(engine);

		// this.player = this.addEntity(new Player(160, 120));
		this.player = this.addEntity(new Player(160 + 100, 120));

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

		this.renderables.push(this.tileset);
		// this.renderables.push(this.grid);
		this.renderables.push(this.gridOutline);
		this.renderables.push(this.player);
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

class Player {
	constructor(x, y) {
		this.x = x;
		this.y = y;

		this.scene = null;

		this.facing = 1;

		this.xspeed = 0;
		this.xRemainder = 0;
		this.yspeed = 0;
		this.yRemainder = 0;

		this.width = 12;
		this.height = 16;

		this.aspeed = 0.05; // acceleration
		this.fspeed = 0.05; // friction

		this.mspeed = 2.5; // max speed
		this.gspeed = 0.12; // gravity
		this.jspeed = -3.95; // initial jump velocity

		this.image = assetManager.images.get('radiohead_spritesheet.png');

		this.coyote = 0;
		this.coyoteLimit = 6;

		this.jumpInput = 0;
		this.jumpInputLimit = 8;

		this.timer = 0;
		this.timeout = 5;
		this.frame = 0;
	}

	update(input) {
		const leftKeys = ['ArrowLeft', 'a', 'A'];
		const rightKeys = ['ArrowRight', 'd', 'D'];
		const jumpKeys = [' ', 'ArrowUp', 'w', 'W', 'z', 'Z'];

		const keyLeftCheck = input.keyCheck(leftKeys);
		const keyRightCheck = input.keyCheck(rightKeys);
		const keyJumpCheck = input.keyCheck(jumpKeys);

		const keyJumpPressed = input.keyPressed(jumpKeys);

		const grounded = this.collide(this.x, this.y + 1);

		// See if the player is trying to move left or right
		const xdir = keyRightCheck - keyLeftCheck;
		this.facing = xdir || this.facing;

		if (this.coyote > 0) --this.coyote;
		if (this.jumpInput > 0) --this.jumpInput;

		// Either increase xspeed or apply friction
		if (xdir !== 0) {
			if (Math.sign(this.xspeed) === Math.sign(xdir)) {
				this.xspeed += this.aspeed * xdir;
			} else {
				this.xspeed += this.aspeed * xdir * 2;
			}
		} else {
			if (Math.abs(this.xspeed) < this.fspeed) {
				this.xspeed = 0;
			} else {
				this.xspeed -= this.fspeed * Math.sign(this.xspeed);
			}
		}

		// Make sure xspeed does not exceed mspeed;
		this.xspeed = Math.clamp(this.xspeed, -this.mspeed, this.mspeed);

		// See if we're on the ground
		if (grounded === true) {
			// Set coyote to the limit!
			this.coyote = this.coyoteLimit;
		}

		if (keyJumpPressed) {
			// Set jumpInput to the limit!
			this.jumpInput = this.jumpInputLimit;
		}

		// Try jumping
		if (this.coyote > 0 && this.jumpInput > 0) {
			this.yspeed = this.jspeed;
			this.coyote = 0;
			this.jumpInput = 0;
		}

		// Apply gravity
		this.yspeed += this.gspeed;

		// Variable jump height
		if (this.yspeed < 0 && !keyJumpCheck) this.yspeed += this.gspeed;

		// Actually move
		this.moveX();
		this.moveY();

		// Handle animation
		this.updateSprite(xdir);
	}

	moveX() {
		const grounded = this.collide(this.x, this.y + 1);
		const ledgeBoostHeights = Array.from({ length: 2 }, (_, i) => i + 1);

		this.xRemainder += this.xspeed;

		let moveX = Math.round(this.xRemainder);

		if (moveX !== 0) {
			this.xRemainder -= moveX;

			const sign = Math.sign(moveX);
			for (let xx = 0, n = Math.abs(moveX); xx < n; ++xx) {
				if (this.collide(this.x + sign, this.y)) {
					const yy =
						grounded === false &&
						this.yspeed >= 0 &&
						(ledgeBoostHeights.find(
							(y) => !this.collide(this.x + sign, this.y - y),
						) ??
							false);

					if (yy === false) {
						moveX = 0;
						this.xspeed =
							Math.min(Math.abs(this.xspeed), 1.0) * sign;
						this.xRemainder = 0;
						break;
					}

					this.y -= yy;
				}

				this.x += sign;
			}
		}
	}

	moveY() {
		this.yRemainder += this.yspeed;
		let moveY = Math.round(this.yRemainder);

		if (moveY !== 0) {
			this.yRemainder -= moveY;

			const sign = Math.sign(moveY);
			for (let yy = 0, n = Math.abs(moveY); yy < n; ++yy) {
				if (this.collide(this.x, this.y + sign)) {
					moveY = 0;
					this.yspeed = 0;
				} else {
					this.y += sign;
				}
			}
		}
	}

	// TODO(bret): See if you could write this functionally :)
	collide(_x, _y) {
		const { width: w, height: h, scene } = this;

		const { grid } = scene;

		const x = Math.round(_x);
		const y = Math.round(_y);

		// TODO(bret): Should this exist as part of the Scene, or part of the grid?
		if (
			scene.boundsX !== null &&
			(x < scene.boundsX[0] || x + w > scene.boundsX[1])
		)
			return true;

		if (
			scene.boundsY !== null &&
			(y < scene.boundsY[0] || y + h > scene.boundsY[1])
		)
			return true;

		const minX = Math.clamp(
			Math.floor(x / grid.tileW),
			0,
			grid.columns - 1,
		);
		const minY = Math.clamp(Math.floor(y / grid.tileH), 0, grid.rows - 1);

		const maxX = Math.clamp(
			Math.floor((x + w - 1) / grid.tileW),
			0,
			grid.columns - 1,
		);
		const maxY = Math.clamp(
			Math.floor((y + h - 1) / grid.tileH),
			0,
			grid.rows - 1,
		);

		for (let yy = minY; yy <= maxY; ++yy) {
			for (let xx = minX; xx <= maxX; ++xx) {
				if (grid.getTile(xx, yy) === 1) {
					return true;
				}
			}
		}

		return false;
	}

	updateSprite(xdir) {
		const numFrames = 4;
		if (xdir !== 0 || this.xspeed !== 0) {
			this.timer += Math.abs(this.xspeed * 0.5);
			if (this.timer >= this.timeout) {
				this.timer = 0;
				this.frame = (this.frame + 1) % numFrames;
			}
		} else {
			this.frame = 0;
			this.timer = this.timeout - 1;
		}
	}

	render(ctx, camera = v2zero) {
		const flipped = this.facing === -1;
		const scaleX = flipped ? -1 : 1;

		const [cameraX, cameraY] = camera;

		const drawX = this.x - cameraX;
		const drawY = this.y - cameraY;

		const drawW = this.image.width / 4;
		const drawH = this.image.height;

		const offsetX = -10;

		if (flipped) {
			ctx.save();
			ctx.scale(-1, 1);
		}

		ctx.drawImage(
			this.image,
			this.frame * 32,
			0,
			32,
			32,
			scaleX * (drawX + offsetX),
			drawY - 11,
			scaleX * drawW,
			drawH,
		);

		if (flipped) ctx.restore();

		const drawHitbox = false;
		if (drawHitbox === true) {
			ctx.strokeStyle = 'red';
			ctx.strokeRect(
				drawX + 0.5,
				drawY + 0.5,
				this.width - 1,
				this.height - 1,
			);
		}
	}
}

let assetManager;
export const initGames = () => {
	const game1 = new Game('basic');
	// const game2 = new Game('second');
	const lineSegmentGame = new Game('line-segment');
	const contourTracingGame = new Game('contour-tracing');
	const games = [game1];
	assetManager = new AssetManager('img/');

	assetManager.addImage('grid.bmp');
	assetManager.addImage('radiohead_spritesheet.png');
	assetManager.addImage('tileset.png');
	assetManager.onLoad(() => {
		console.log('== AssetManager::onLoad()');

		const splitScreen = true;

		games.forEach((game) => {
			game.backgroundColor = '#87E1A3';

			const sceneWidth = game.canvas.width / 2;

			const sceneLeft = new PlayerScene(Player, game);
			sceneLeft.player.x = 40;
			if (splitScreen === true) {
				sceneLeft.setCanvasSize(sceneWidth, game.canvas.height);
			} else {
				sceneLeft.setCanvasSize(game.canvas.width, game.canvas.height);
			}

			if (splitScreen === true) {
				const sceneRight = new PlayerScene(Player, game);
				sceneRight.screenPos[0] = sceneWidth;
				sceneRight.setCanvasSize(sceneWidth, game.canvas.height);
				sceneRight.shouldUpdate = false;

				game.pushScenes(sceneLeft, sceneRight);
			} else {
				game.pushScenes(sceneLeft);
			}

			game.render();
		});

		if (true) {
			const lineSegmentScene = new LineSegmentScene(lineSegmentGame);
			lineSegmentGame.pushScenes(lineSegmentScene);
			lineSegmentGame.render();
		}

		if (true) {
			const contourTracingScene = new ContourTracingScene(
				contourTracingGame,
			);
			contourTracingGame.pushScenes(contourTracingScene);
			contourTracingGame.render();
		}
	});
	assetManager.loadAssets();
};
/* eslint-enable no-undef */

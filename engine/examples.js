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
	checkLineSegmentIntersection,
	getLineSegmentIntersection,
	isPointOnLine,
	isPointInsidePath,
} from './canvas-lord.js';

import { Entity } from './util/entity.js';

import { createSceneGrid, createButtons } from './shared.js';

import {
	Player,
	EVENT_TYPE,
	leftKeys,
	rightKeys,
	jumpKeys,
	// components
	horizontalMovementComponent,
	horizontalMovementSystem,
	verticalMovementComponent,
	verticalMovementSystem,
	verticalMovementComponent2,
	verticalMovementSystem2,
	baseHorizontalMovementComponent,
	baseHorizontalMovementSystem,
	baseVerticalMovementComponent,
	baseVerticalMovementSystem,
} from './player.js';

import * as Components from './util/components.js';
import * as Systems from './util/systems.js';
import { Draw } from './util/draw.js';
import { Logger, YesNoLogParser } from './util/logger.js';
import { Inspector } from './inspector.js';

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
			let yy = y * this.tileH;
			Draw.line(ctx, {}, 0, yy, this.columns * this.tileW + 0, yy);
			yy += this.tileH - 1;
			Draw.line(ctx, {}, 0, yy, this.columns * this.tileW + 0, yy);
		}

		for (let x = 0; x < this.columns; ++x) {
			let xx = x * this.tileW;
			Draw.line(ctx, {}, xx, 0, xx, this.rows * this.tileH);
			xx += this.tileW - 1;
			Draw.line(ctx, {}, xx, 0, xx, this.rows * this.tileH);
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

export const LOG_TYPE = {
	JUMP_ELAPSED: 'Jump Elapsed',
	JUMP_ACTIVE: 'Jump Active', // is technically computed
	CAN_JUMP: 'Can Jump',
	COYOTE: 'Coyote Frames',
};

class ComponentScene extends Scene {
	constructor(engine) {
		super(engine);

		this.componentSystemMap.set(
			Components.moveEightComponent,
			Systems.moveEightSystem,
		);
		this.componentSystemMap.set(Components.rect, Systems.rectSystem);
		this.componentSystemMap.set(Components.circle, Systems.circleSystem);
		this.componentSystemMap.set(Components.image, Systems.imageSystem);

		this.addEntity(new Square(30, 90)).component(Components.rect).color =
			'red';
		this.addEntity(new Square(0, 0)).component(Components.rect).color =
			'blue';

		const c1 = this.addEntity(new Circle(60, 90));
		const c2 = this.addEntity(new Circle(0, 0));
		c1.component(Components.circle).color = 'purple';
		c2.component(Components.circle).color = 'magenta';
	}
}

class PlayerScene extends Scene {
	constructor(Player, engine, components, logTypes) {
		super(engine);

		// register components
		// TODO: (maybe make this its own function? either Scene.init() or more specifically Scene.initComponents() - have a Scene._init() behind the scenes)
		{
			// input-related
			// velocity clean-up
			this.componentSystemMap.set(
				horizontalMovementComponent,
				horizontalMovementSystem,
			);

			this.componentSystemMap.set(
				verticalMovementComponent,
				verticalMovementSystem,
			);

			this.componentSystemMap.set(
				verticalMovementComponent2,
				verticalMovementSystem2,
			);

			// actual movement
			this.componentSystemMap.set(
				baseHorizontalMovementComponent,
				baseHorizontalMovementSystem,
			);

			this.componentSystemMap.set(
				baseVerticalMovementComponent,
				baseVerticalMovementSystem,
			);
		}

		// this.player = this.addEntity(new Player(160, 120));
		this.player = this.addEntity(new Player(40, 144, assetManager));
		if (components?.length) {
			[
				baseHorizontalMovementComponent,
				baseVerticalMovementComponent,
				...components,
			].forEach((c) => this.player.addComponent(c));
		}

		const _logger = new Logger(10, 10);
		_logger.setLogDefault('visible', false);
		this.logger = this.addEntity(_logger);
		const validRenderer = (ctx, log, drawX, drawY) => {
			ctx.fillStyle = log.value ? 'white' : '#ccc';
			ctx.fillText(log.str, drawX, drawY);
		};

		// TODO: this.logger.setVisibility(logType, visible)

		// TODO: this.logger.watchComponent(entity, component);
		//	- would get all properties by key
		//	- could pass in an object with an exclude or include array for which keys to care about

		this.logger.watch(LOG_TYPE.JUMP_ACTIVE, true, {
			visible: logTypes.includes(LOG_TYPE.JUMP_ACTIVE),
			parser: YesNoLogParser,
			renderer: validRenderer,
		});
		this.logger.watch(LOG_TYPE.JUMP_ELAPSED, 0, {
			visible: logTypes.includes(LOG_TYPE.JUMP_ACTIVE),
			renderer: validRenderer, // FIXME: flip the
		});

		this.logger.watch(LOG_TYPE.COYOTE, 0, {
			visible: logTypes.includes(LOG_TYPE.COYOTE),
			renderer: validRenderer,
		});
		this.logger.watch(LOG_TYPE.CAN_JUMP, true, {
			visible: logTypes.includes(LOG_TYPE.CAN_JUMP),
			parser: YesNoLogParser,
			renderer: validRenderer,
		});

		this.messages.subscribe(
			{
				receive: (message, payload) => {
					switch (message) {
						case EVENT_TYPE.UPDATE_CAN_JUMP:
							this.logger.set(LOG_TYPE.CAN_JUMP, payload);
							break;
						case EVENT_TYPE.UPDATE_COYOTE:
							this.logger.set(LOG_TYPE.COYOTE, payload);
							break;
						case EVENT_TYPE.JUMP:
							this.logger.log('Jumped!');
							break;
					}
				},
			},
			EVENT_TYPE.UPDATE_CAN_JUMP,
			EVENT_TYPE.UPDATE_COYOTE,
			EVENT_TYPE.JUMP,
		);

		createSceneGrid(this, assetManager);
		createButtons(this, { leftKeys, rightKeys, jumpKeys });
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

class Square extends Entity {
	constructor(x, y) {
		super(x, y);

		const moveEight = this.addComponent(Components.moveEightComponent);
		moveEight.originX = x;
		moveEight.originY = y;
		const r = this.addComponent(Components.rect);
		r.width = 10;
		r.height = 10;
		r.originX = r.width >> 1;
		r.originY = r.width >> 1;
	}
}

class Circle extends Entity {
	constructor(x, y) {
		super(x, y);

		const moveEight = this.addComponent(Components.moveEightComponent);
		moveEight.originX = x;
		moveEight.originY = y;
		const r = this.addComponent(Components.circle);
		r.radius = 5;
	}
}

let assetManager;
export const initGames = (src = '', gamesMap = []) => {
	const game1 = new Game('basic');
	// const game2 = new Game('second');
	const games = gamesMap.map(({ id }) => new Game(id)).concat(game1);
	assetManager = new AssetManager(`${src}img/`);

	const inspector = new Inspector(game1);
	inspector.watch('x', {});
	inspector.watch('y', {});
	inspector.watch('coyoteLimit', {
		min: 0,
		max: 60,
	});

	assetManager.addImage('grid.bmp');
	assetManager.addImage('radiohead_spritesheet.png');
	assetManager.addImage('tileset.png');
	assetManager.onLoad(() => {
		console.log('== AssetManager::onLoad()');

		const splitScreen = false;

		games.forEach((game, gameIndex) => {
			game.backgroundColor = '#87E1A3';

			const sceneWidth = game.canvas.width / 2;

			const PlayerClass = gamesMap[gameIndex]?.player ?? Player;
			const components = gamesMap[gameIndex]?.components ?? [];
			const logTypes = gamesMap[gameIndex]?.logTypes ?? [
				// CLEANUP: Delete this
				LOG_TYPE.COYOTE,
				LOG_TYPE.CAN_JUMP,
			];

			const sceneLeft = new PlayerScene(
				PlayerClass,
				game,
				components,
				logTypes,
			);
			if (splitScreen === true) {
				sceneLeft.setCanvasSize(sceneWidth, game.canvas.height);
			} else {
				sceneLeft.setCanvasSize(game.canvas.width, game.canvas.height);
			}

			if (splitScreen === true) {
				const sceneRight = new PlayerScene(
					PlayerClass,
					game,
					components,
				);
				sceneRight.screenPos[0] = sceneWidth;
				sceneRight.setCanvasSize(sceneWidth, game.canvas.height);
				// sceneRight.shouldUpdate = false;

				game.pushScenes(sceneLeft, sceneRight);
			} else {
				game.pushScenes(sceneLeft);
			}

			game.render();
		});

		if (true && document.querySelector('#line-segment')) {
			const lineSegmentGame = new Game('line-segment');
			const lineSegmentScene = new LineSegmentScene(lineSegmentGame);
			lineSegmentGame.pushScenes(lineSegmentScene);
			lineSegmentGame.render();
		}

		if (true && document.querySelector('#contour-tracing')) {
			const contourTracingGame = new Game('contour-tracing');
			const contourTracingScene = new ContourTracingScene(
				contourTracingGame,
			);
			contourTracingGame.pushScenes(contourTracingScene);
			contourTracingGame.render();
		}

		inspector.onUpdate();
	});
	assetManager.loadAssets();
};
/* eslint-enable no-undef */

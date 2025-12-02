import { Collision, Draw, Scene, Entity } from '/bin/main.js';
import * as Collide from '/bin/collider/collide.js';
import { addPos, Vec2 } from '/bin/math/index.js';
import {
	LineCollider,
	PointCollider,
	CircleCollider,
	PolygonCollider,
	RightTriangleCollider,
	BoxCollider,
} from '/bin/collider/index.js';
import { EntityCollisionScene } from './entity-collision-scene.js';
import { Keys } from '../../bin/main.js';
import { init } from '../sandbox.js';
import { Sprite, Text } from '../../bin/graphic/index.js';

const drawRect = (ctx, fill, ...args) =>
	fill ? ctx.fillRect(...args) : ctx.strokeRect(...args);

const drawPolygon = (ctx, polygon, color, type = 'stroke', map = false) => {
	let verts = [...polygon.vertices];
	// if (map) verts = verts.map(([x, y]) => [x + polygon.x, y + polygon.y]);

	Draw.polygon(ctx, { type, color }, 0, 0, verts);
};

const drawRightTriangle = (ctx, rt, color, x = 0, y = 0, style) => {
	const TL = new Vec2(x + rt.left, y + rt.top);
	const TR = new Vec2(x + rt.right, y + rt.top);
	const BR = new Vec2(x + rt.right, y + rt.bottom);
	const BL = new Vec2(x + rt.left, y + rt.bottom);
	let points;
	switch (rt.orientation) {
		case 'NE': {
			points = [TL, BR, BL];
			break;
		}
		case 'SE': {
			points = [TR, BL, TL];
			break;
		}
		case 'SW': {
			points = [BR, TL, TR];
			break;
		}
		case 'NW': {
			points = [BL, TR, BR];
			break;
		}
		default:
			const msg = `Orientation "${rt.orientation}" not supported`;
			throw new Error(msg);
	}
	drawPolygon(
		ctx,
		{ x: 0, y: 0, vertices: points.map(({ x, y }) => [x, y]) },
		color,
		style,
	);
};

const COL_GAP = 50;
const COL_1 = 30;
const COL_2 = COL_1 + COL_GAP;
const COL_3 = COL_2 + COL_GAP;

const ROW_GAP = 50;
const ROW_1 = 30;
const ROW_2 = ROW_1 + ROW_GAP;
const ROW_3 = ROW_2 + ROW_GAP;

const RADIUS_S = 5;
const RADIUS_L = 15;

const createBox = (point, size) => {
	return new BoxCollider(
		size << 1,
		size << 1,
		point[0] - size,
		point[1] - size,
	);
};

const createCircle = (point, size) => {
	return new CircleCollider(size, point[0], point[1]);
};

const createRightTriangle = (point, size) => {
	return new RightTriangleCollider(
		size << 1,
		size << 1,
		'NW',
		point[0] - size,
		point[1] - size,
	);
};

const resizePolygon = (polygon, point, size) => {
	polygon.x = point[0];
	polygon.y = point[1];
	polygon.setPoints([
		[0, -size * 0.8],
		[size, size * 0.8],
		[-size, size * 0.8],
	]);
};

const createPolygon = (point, size) => {
	const polygon = new PolygonCollider([
		[0, 0],
		[10, 10],
		[20, 20],
	]);
	resizePolygon(polygon, point, size);
	return polygon;
};

const createFromType = (point, type, size) => {
	switch (type) {
		case 'box':
			return createBox(point, size);
		case 'circle':
			return createCircle(point, size);
		case 'right-triangle':
			return createRightTriangle(point, size);
		case 'polygon':
			return createPolygon(point, size);
		case 'point':
			return new PointCollider();
		default:
			throw new Error(`createFromType(): "${type}" not yet supported`);
	}
};

const createPair = (col, row, largeType, smallType) => {
	const point = [col, row];
	const res = {
		point,
		large: createFromType(point, largeType, RADIUS_L),
		small: createFromType(point, smallType, RADIUS_S),
	};
	const e1 = new Entity();
	e1.collider = res.large;
	const e2 = new Entity();
	e2.collider = res.small;
	return res;
};

class ShapeCollisionScene extends Scene {
	updates = 0;

	points = [
		[COL_1, ROW_1], // top left
		[COL_2, ROW_1], // top center
		[COL_3, ROW_1], // top right

		[COL_1, ROW_2], // middle left
		[COL_2, ROW_2], // middle center
		[COL_3, ROW_2], // middle right

		[COL_1, ROW_3], // bottom left
		[COL_2, ROW_3], // bottom center
		[COL_3, ROW_3], // bottom right
	];

	pairs = [];

	constructor(engine) {
		super(engine);

		const types = ['box', 'circle', 'right-triangle', 'polygon', 'point'];
		for (let i = 0; i < types.length - 1; ++i) {
			const largeType = types[i];
			for (let j = 0; j < types.length; ++j) {
				const smallType = types[j];
				this.pairs.push(
					createPair(
						COL_1 + COL_GAP * j,
						ROW_1 + ROW_GAP * i,
						largeType,
						smallType,
					),
				);
			}
		}

		let point = 0;

		++point;

		++point;
		this.rect4 = createBox(this.points[point], RADIUS_L);

		++point;
		++point;
		this.circle5 = createCircle(this.points[point], RADIUS_S);
		this.circle6 = createCircle(this.points[point], RADIUS_L);

		++point;
		this.circle8 = createCircle(this.points[point], RADIUS_L);

		this.updatePos();
	}

	updatePos(input) {
		const periodX = 30;
		const periodY = 50;
		// const OFFSET = RADIUS_S;
		const OFFSET = 5;
		let offsetX = -Math.cos(this.updates / periodX) * OFFSET * 4;
		let offsetY = -Math.cos(this.updates / periodY) * OFFSET * 3;

		if (input?.keyCheck(Keys.Space)) {
			offsetX = input.mouse.x - this.engine.canvas.width / 2;
			offsetY = input.mouse.y - this.engine.canvas.height / 2;
		}

		const signs = ['NE', 'SE', 'SW', 'NW'];
		const periodS = 200;
		const periodL = periodS * 4;
		const indexL = Math.floor(this.updates / periodL) % 4;
		const orientationL = signs[indexL];
		const indexS = (Math.floor(this.updates / periodS) + 2 + indexL) % 4;
		const orientationS = signs[indexS];

		this.pairs.forEach(({ point, large, small }) => {
			const x = offsetX + point[0];
			const y = offsetY + point[1];
			if (large.type === 'right-triangle')
				large.orientation = orientationL;
			switch (small.type) {
				case 'point':
					if (!input) break;
					small.x = input.mouse.x;
					small.y = input.mouse.y;
					break;
				case 'box':
					small.x = x - (small.w >> 1);
					small.y = y - (small.h >> 1);
					break;
				case 'circle':
					small.x = x;
					small.y = y;
					break;
				case 'right-triangle':
					small.x = x - (small.w >> 1);
					small.y = y - (small.h >> 1);
					small.orientation = orientationS;
					break;
				case 'polygon':
					const oo = addPos(point, [offsetX, offsetY]);
					resizePolygon(small, oo, RADIUS_S);
					break;
				default:
					throw new Error(`updatePos(): ${small.type} unimplemented`);
			}

			let colliding;
			try {
				colliding = Collide.collide(small, large);
			} catch (e) {
				colliding = undefined;
			}
			small.colliding = colliding;
			large.colliding = colliding;
		});

		if (input) {
			// const overlap = aabb(this.rect3, this.rect4);
			// pointInRect(
			const overlap = Collision.collidePointBox(
				input.mouse.x,
				input.mouse.y,
				this.rect4,
			);
			// this.rect3.colliding = overlap;
			this.rect4.colliding = overlap;
		}

		if (input) {
			const overlap = Collision.collidePointCircle(
				input.mouse.x,
				input.mouse.y,
				this.circle8,
			);
			this.circle8.colliding = overlap;
		}
	}

	update(input) {
		++this.updates;
		this.updatePos(input);
	}

	render(ctx) {
		ctx.fillStyle = 'white';

		ctx.strokeStyle = 'white';

		const shapes = this.pairs.flatMap(({ small, large }) => [small, large]);

		shapes.forEach((shape) => {
			ctx.strokeStyle = shape.colliding ? 'red' : 'lime';
			if (shape.colliding === undefined) ctx.strokeStyle = 'yellow';
			switch (shape.type) {
				case 'point':
					break;
				case 'box':
					// TODO: shouldn't have to + .5...
					drawRect(
						ctx,
						false,
						shape.left + 0.5,
						shape.top + 0.5,
						shape.w - 1,
						shape.h - 1,
					);
					break;
				case 'circle':
					Draw.circle(
						ctx,
						{ type: 'stroke', color: ctx.strokeStyle },
						shape.centerX - shape.radius,
						shape.centerY - shape.radius,
						shape.radius,
					);
					break;
				case 'right-triangle':
					drawRightTriangle(ctx, shape, ctx.strokeStyle);
					break;
				case 'polygon':
					// drawPolygon(ctx, shape, ctx.strokeStyle, 'stroke', true);
					Draw.polygon(
						ctx,
						{ type: 'stroke', color: ctx.strokeStyle },
						0,
						0,
						shape.vertices,
					);
					break;
			}
		});

		const points = shapes.filter(({ type }) => type === 'point');
		const colliding = points.some(({ colliding }) => colliding);
		ctx.strokeStyle = colliding ? 'red' : 'lime';
		drawRect(ctx, false, points[0].x, points[0].y, 1, 1);
	}
}

class LineCollisionScene extends Scene {
	updates = 0;

	points = [
		//
		[COL_1, ROW_1], // top left
		[COL_1, ROW_2], // middle left
		[COL_2, ROW_1], // top right
		[COL_2, ROW_2], // middle right
		[COL_1, ROW_3], // bottom left
		[COL_2, ROW_3], // bottom right
	];

	lines = [];

	box = new BoxCollider(RADIUS_L, RADIUS_L, 20, 20);
	circle = new CircleCollider(RADIUS_S, 190, 40);
	line = new LineCollider(0, 0, 0, 0);
	rightTriangle = new RightTriangleCollider(RADIUS_L, RADIUS_L, 'NW', 20, 20);
	polygon = new PolygonCollider([
		[0, RADIUS_L * 0.8],
		[RADIUS_L, RADIUS_L * 0.8],
		[RADIUS_L >> 1, 0],
	]);

	constructor(engine) {
		super(engine);

		new Entity().collider = this.box;
		new Entity().collider = this.circle;
		new Entity().collider = this.line;
		new Entity().collider = this.rightTriangle;
		new Entity().collider = this.polygon;

		const inv = 1 / Math.sqrt(2);
		const lineRadius = RADIUS_S * 3;
		const lines = [
			[-lineRadius, 0, lineRadius, 0],
			[0, -lineRadius, 0, lineRadius],
			[-lineRadius, -lineRadius, lineRadius, lineRadius].map(
				(v) => v * inv,
			),
			[lineRadius, -lineRadius, -lineRadius, lineRadius].map(
				(v) => v * inv,
			),
		];
		this.lines = this.points.map(() => {
			return lines.map((points) => ({
				points,
				colliding: false,
			}));
		});

		new Entity().collider = this.box;
		this.addEntity(this.box.parent);
		new Entity().collider = this.circle;
		this.addEntity(this.circle.parent);
		new Entity().collider = this.line;
		this.addEntity(this.line.parent);
		new Entity().collider = this.rightTriangle;
		this.addEntity(this.rightTriangle.parent);
		new Entity().collider = this.polygon;
		this.addEntity(this.polygon.parent);

		this.updatePos();
	}

	updatePos(input) {
		const offsetX = -Math.cos(this.updates / 30) * RADIUS_S * 4;
		const offsetY = -Math.cos(this.updates / 50) * RADIUS_S * 3;

		const collideAgainstLines = (shape, origin, func, destructure) => {
			if (!destructure) {
				shape.colliding = true;
				return;
			}

			shape.colliding = false;
			const index = this.points.indexOf(origin);
			const lines = this.lines[index];
			lines.forEach((line, i) => {
				const intersect = func(
					line.points[0] + origin[0],
					line.points[1] + origin[1],
					line.points[2] + origin[0],
					line.points[3] + origin[1],
					...destructure(shape),
				);
				line.colliding = intersect;
				if (intersect) shape.colliding = true;
			});
		};

		{
			const origin = this.points[0];

			this.box.x = offsetX + origin[0] - (this.box.w >> 1);
			this.box.y = offsetY + origin[1] - (this.box.h >> 1);

			collideAgainstLines(
				this.box,
				origin,
				Collision.collideLineBox,
				(box) => [box.left, box.top, box.right, box.bottom],
			);
		}

		{
			const origin = this.points[1];

			const xx = RADIUS_S * 0.5;
			this.line.x1 = offsetX + origin[0] + xx;
			this.line.y1 = offsetY + origin[1] - xx * 3;
			this.line.x2 = offsetX + origin[0] - xx;
			this.line.y2 = offsetY + origin[1] + xx * 3;

			collideAgainstLines(
				this.line,
				origin,
				Collision.collideLineLine,
				(line) => [line.xStart, line.yStart, line.xEnd, line.yEnd],
			);
		}

		{
			const origin = this.points[2];

			this.circle.x = offsetX + origin[0];
			this.circle.y = offsetY + origin[1];

			collideAgainstLines(
				this.circle,
				origin,
				Collision.collideLineCircle,
				(circle) => [circle.centerX, circle.centerY, circle.radius],
			);
		}

		{
			const origin = this.points[3];

			const yy = -RADIUS_S * 0.2;
			this.polygon.x = offsetX + origin[0];
			this.polygon.y = offsetY + origin[1];
			this.polygon.x1 = RADIUS_S;
			this.polygon.y1 = RADIUS_S * 0.8 + yy;
			this.polygon.x2 = 0;
			this.polygon.y2 = -RADIUS_S * 0.8 + yy;
			this.polygon.x3 = -RADIUS_S;
			this.polygon.y3 = RADIUS_S * 0.8 + yy;

			collideAgainstLines(
				this.polygon,
				origin,
				Collision.collideLinePolygon,
				(polygon) => [polygon],
			);
		}

		{
			const origin = this.points[4];

			this.rightTriangle.x =
				offsetX + origin[0] - (this.rightTriangle.w >> 1);
			this.rightTriangle.y =
				offsetY + origin[1] - (this.rightTriangle.h >> 1);

			collideAgainstLines(
				this.rightTriangle,
				origin,
				Collision.collideLineRightTriangle,
				(rt) => [rt],
			);
		}

		if (input) {
			const origin = this.points[5];
			const mouse = {
				pos: input.mouse.pos,
				colliding: false,
			};

			collideAgainstLines(mouse, origin, (line, point) => {
				return Collision.collidePointLine(
					point.pos.x,
					point.pos.y,
					line,
				);
			});
		}
	}

	update(input) {
		++this.updates;
		this.updatePos(input);
	}

	render(ctx) {
		ctx.fillStyle = 'white';

		ctx.strokeStyle = 'white';

		[this.box, this.circle, this.line].forEach((shape) => {
			ctx.strokeStyle = shape.colliding ? 'red' : 'lime';
			switch (shape.type) {
				case 'line':
					Draw.line(
						ctx,
						{ color: ctx.strokeStyle },
						shape.x1,
						shape.y1,
						shape.x2,
						shape.y2,
					);
					break;
				case 'circle':
					Draw.circle(
						ctx,
						{ type: 'stroke', color: ctx.strokeStyle },
						shape.x - shape.radius,
						shape.y - shape.radius,
						shape.radius,
					);
					break;
				case 'box':
					drawRect(
						ctx,
						false,
						shape.x + 0.5,
						shape.y + 0.5,
						shape.w - 1,
						shape.h - 1,
					);
					break;
			}
		});

		this.points.forEach(([x, y], i) => {
			this.lines[i].forEach((line) => {
				ctx.strokeStyle = line.colliding ? 'red' : 'lime';
				Draw.line(
					ctx,
					{},
					...line.points.map((v, i) => v + (i % 2 === 0 ? x : y)),
				);
			});
		});

		ctx.strokeStyle = this.polygon.colliding ? 'red' : 'lime';
		Draw.polygon(
			ctx,
			{ type: 'stroke', color: ctx.strokeStyle },
			0,
			0,
			this.polygon.vertices,
		);
		ctx.strokeStyle = this.rightTriangle.colliding ? 'red' : 'lime';
		drawRightTriangle(ctx, this.rightTriangle, ctx.strokeStyle);
	}
}

const colliderTag = 'tag';
class EntityMethodCollisionScene extends Scene {
	constructor(...args) {
		super(...args);

		const createEntity = (x, y) => {
			const w = 70;
			const h = 70;
			const entity = this.addGraphic(
				Sprite.createRect(w, h, '#ff0000'),
				x,
				y,
			);
			entity.graphic.centerOrigin();

			entity.collider = new BoxCollider(w, h, -w >> 1, -h >> 1);
			// entity.collider.centerOrigin();
			return entity;
		};

		this.taggedEntity = createEntity(100, 100);
		this.taggedEntity.collider.tag = colliderTag;
		this.targetEntity = createEntity(300, 150);

		this.doubleEntity = createEntity(200, 200);
		this.doubleEntity.collider.tag = colliderTag;

		this.mouseEntity = createEntity(0, 0);

		this.collidingText = this.addGraphic(
			new Text('Colliding: false', 20, 300 + 0),
		).graphic;
		this.collidingTagText = this.addGraphic(
			new Text('Colliding with tag: false', 20, 300 + 50),
		).graphic;
		this.collidingEntityText = this.addGraphic(
			new Text('Colliding with target entity: false', 20, 300 + 100),
		).graphic;
		this.collidingSpecialEntitiesText = this.addGraphic(
			new Text(
				'Colliding with target or double entity: false',
				20,
				300 + 150,
			),
		).graphic;

		// lil' hack
		window.requestAnimationFrame(() => {
			this.engine.render();
		});
	}

	update(input) {
		super.update(input);

		this.mouseEntity.x = input.mouse.x;
		this.mouseEntity.y = input.mouse.y;

		const transform = (text, value) => {
			text.str = text.str.split(':')[0] + ': ' + value;
		};

		const { x, y } = this.mouseEntity;
		transform(this.collidingText, this.mouseEntity.collide(x, y));
		transform(
			this.collidingTagText,
			this.mouseEntity.collide(x, y, [colliderTag]),
		);
		transform(
			this.collidingEntityText,
			this.mouseEntity.collide(x, y, [this.targetEntity]),
		);
		transform(
			this.collidingSpecialEntitiesText,
			this.mouseEntity.collide(x, y, [
				this.targetEntity,
				this.doubleEntity,
			]),
		);
	}

	render(ctx, camera) {
		super.render(ctx, camera);

		this.mouseEntity.renderCollider(ctx, camera);
	}
}

const args = {
	attr: {
		width: 640,
		height: 480,
	},
	onStart: (game) => {
		const drawOverlay = () => {
			const { width, height } = game.canvas;
			game.ctx.fillStyle = 'rgba(32, 32, 32, 0.5)';
			game.ctx.fillRect(0, 0, width, height);
		};

		game.listeners.blur.add(drawOverlay);
		drawOverlay();
	},
};

init({
	games: [
		init.game('entity-methods', EntityMethodCollisionScene, args),
		init.game('entities', EntityCollisionScene, args),
		init.game('shapes', ShapeCollisionScene, args),
		init.game('lines', LineCollisionScene, args),
	],
});

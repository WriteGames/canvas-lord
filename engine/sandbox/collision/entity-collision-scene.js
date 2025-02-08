import { Draw, Scene, Entity } from '/bin/canvas-lord.js';
import { Vec2 } from '/bin/math/index.js';
import {
	LineCollider,
	PointCollider,
	CircleCollider,
	PolygonCollider,
	RightTriangleCollider,
	BoxCollider,
} from '/bin/collider/index.js';
import { Keys } from '/bin/core/input.js';

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

const COLLIDER_TAG = {
	SLOPE: 'slope',
	YELLOW: 'yellow',
	ORANGE: 'orange',
	MOUSE: 'mouse',
	BG: 'background',
};

class CollisionEntity extends Entity {
	hover = false;

	constructor(x, y, type) {
		super(x, y);
		switch (type) {
			case COLLIDER_TAG.YELLOW:
				this.color = 'yellow';
				break;
			case COLLIDER_TAG.ORANGE:
				this.color = 'orange';
				break;
			case COLLIDER_TAG.SLOPE:
				this.color = 'black';
				break;
			case COLLIDER_TAG.MOUSE:
				this.color = 'green';
				break;
			case COLLIDER_TAG.BG:
				this.color = '#10101066';
				this.color = '#88008822';
				break;
			default:
				this.color = 'magenta';
				break;
		}
	}

	update() {
		// this.hover = this.collideMouse(this.x, this.y);
		this.hover = this.collide(this.x, this.y, COLLIDER_TAG.MOUSE);
	}

	render(ctx) {
		const x = this.x + this.collider.x;
		const y = this.y + this.collider.y;
		const color = this.hover ? 'magenta' : this.color;
		ctx.fillStyle = color;
		ctx.strokeStyle = 'red';
		switch (this.collider.type) {
			case 'box': {
				drawRect(ctx, true, x, y, this.collider.w, this.collider.h);
				break;
			}
			case 'circle': {
				Draw.circle(
					ctx,
					{ ...this, type: 'fill', color },
					x - this.collider.radius,
					y - this.collider.radius,
					this.collider.radius,
				);
				break;
			}
			case 'point': {
				const radius = color === 'magenta' ? 8 : 3;
				Draw.circle(
					ctx,
					{ ...this, type: 'fill', color },
					x - radius,
					y - radius,
					radius,
				);
				break;
			}
			case 'line': {
				ctx.save();
				ctx.lineWidth = 10;
				Draw.line(
					ctx,
					{ ...this, color },
					this.collider.xStart,
					this.collider.yStart,
					this.collider.xEnd,
					this.collider.yEnd,
				);
				ctx.restore();
				break;
			}
			case 'right-triangle': {
				drawRightTriangle(ctx, this.collider, color, 0, 0, 'fill');
				break;
			}
			case 'polygon': {
				// drawPolygon(ctx, this.collider, color, 'fill');
				Draw.polygon(
					ctx,
					{ type: 'fill', color },
					0,
					0,
					this.collider.vertices,
				);
				break;
			}
		}
		this.renderCollider(ctx);
	}
}

class MovingEntity extends CollisionEntity {
	constructor(...args) {
		super(...args);

		this.vel = new Vec2(3, 2);
	}

	moveAxis(axis) {
		let sign = Math.sign(this.vel[axis]);
		const side = axis === 'x' ? 'w' : 'h';
		const offset = axis === 'x' ? 0 : 1;
		const min = this.scene.bounds[offset];
		const max = this.scene.bounds[offset + 2];
		for (let i = 0, n = Math.abs(this.vel[axis]); i < n; ++i) {
			let left = this[axis] + sign;
			let right = this[axis] + sign;
			switch (this.collider.type) {
				case 'box': {
					right += this.collider[side];
					break;
				}
				case 'circle': {
					left -= this.collider.radius;
					right += this.collider.radius;
					break;
				}
			}
			try {
				const other = this.collideEntity(
					this.x + (axis === 'x' ? sign : 0),
					this.y + (axis === 'y' ? sign : 0),
					[COLLIDER_TAG.SLOPE, this.collider.tag],
				);
				if (other !== null) {
					this.vel[axis] *= -1;
					sign *= -1;
					if (other.vel && this.vel[axis] === other.vel[axis])
						other.vel[axis] *= -1;
				}
			} catch (e) {}

			if (left < min) {
				sign = 1;
				this.vel[axis] = Math.abs(this.vel[axis]) * sign;
			}
			if (right >= max) {
				sign = -1;
				this.vel[axis] = Math.abs(this.vel[axis]) * sign;
			}
			this[axis] += sign;
		}
	}

	update() {
		this.moveAxis('x');
		this.moveAxis('y');
		super.update();
	}
}

class SquareEntity extends MovingEntity {
	constructor(...args) {
		super(...args);
		this.collider = new BoxCollider(20, 20);
		this.collider.tag = args[2];
	}
}

class CircleEntity extends MovingEntity {
	constructor(...args) {
		super(...args);
		this.collider = new CircleCollider(10);
		this.x += this.collider.radius;
		this.y += this.collider.radius;
		this.collider.tag = args[2];
	}
}

class PolygonEntity extends MovingEntity {
	static size = 30;

	constructor(x, y, type) {
		super(x, y, type);
		this.collider = new PolygonCollider([
			[0, 0],
			[PolygonEntity.size, (PolygonEntity.size >> 1) + 3],
			[-3, PolygonEntity.size + 2],
		]);
		this.collider.tag = type;
	}
}

class RightTriangleEntity extends CollisionEntity {
	static size = 50;

	constructor(x, y, orientation, type) {
		super(x, y, type);
		this.collider = new RightTriangleCollider(
			RightTriangleEntity.size,
			RightTriangleEntity.size,
			'NW',
		);
		this.collider.orientation = orientation;
		this.collider.tag = type;
	}
}

class BackgroundCollider extends CollisionEntity {
	constructor(x, y, collider) {
		super(x, y, COLLIDER_TAG.BG);
		this.collider = collider;
		this.collider.tag = COLLIDER_TAG.BG;
	}
}

class MouseEntity extends CollisionEntity {
	// TODO(bret): PointCollider :)

	constructor() {
		super(-100, -100, COLLIDER_TAG.MOUSE);

		this.colliders = [
			new BoxCollider(16, 16, -8, -8),
			//
			new CircleCollider(8),
			new PointCollider(),
			new LineCollider(-10, -10, 10, 10),
			new RightTriangleCollider(20, 20, 'NE', -10, -10),
			new PolygonCollider([
				[10, 10],
				[-10, 7],
				[-7, -5],
				[5, -10],
			]),
		];

		this.changeCollider(this.colliders[5]);
	}

	changeCollider(c) {
		this.collider = c;
		this.collider.tag = COLLIDER_TAG.MOUSE;
	}

	update(input) {
		this.x = input.mouse.x;
		this.y = input.mouse.y;

		let index;
		switch (true) {
			case input.keyPressed(Keys.Digit1):
				index = 0;
				break;
			case input.keyPressed(Keys.Digit2):
				index = 1;
				break;
			case input.keyPressed(Keys.Digit3):
				index = 2;
				break;
			case input.keyPressed(Keys.Digit4):
				index = 3;
				break;
			case input.keyPressed(Keys.Digit5):
				index = 4;
				break;
			case input.keyPressed(Keys.Digit6):
				index = 5;
				break;
		}

		if (index !== undefined) this.changeCollider(this.colliders[index]);
	}
}

export class EntityCollisionScene extends Scene {
	constructor(engine) {
		super(engine);

		const { canvas } = engine;
		this.bounds = [0, 0, canvas.width, canvas.height];

		const rectBG = new BackgroundCollider(40, 30, new BoxCollider(50, 50));
		const circleBG = new BackgroundCollider(
			140,
			30,
			new CircleCollider(25),
		);
		const pointBG = new BackgroundCollider(115, 70, new PointCollider());
		this.addEntities(rectBG, circleBG, pointBG);
		const lineBG = new BackgroundCollider(
			185,
			40,
			new LineCollider(50, 0, 0, 30),
		);
		const polygonBG = new BackgroundCollider(
			100,
			100,
			new PolygonCollider([
				[0, 0],
				[120, 30],
				[100, 70],
				[50, 100],
			]),
		);
		// TODO: GridCollider
		this.addEntities(rectBG, circleBG, pointBG, lineBG, polygonBG);

		const triLT = new RightTriangleEntity(0, 0, 'SE', COLLIDER_TAG.SLOPE);

		const triRT = new RightTriangleEntity(
			this.bounds[2] - RightTriangleEntity.size,
			0,
			'SW',
			COLLIDER_TAG.SLOPE,
		);

		const triLB = new RightTriangleEntity(
			0,
			this.bounds[3] - RightTriangleEntity.size,
			'NE',
			COLLIDER_TAG.SLOPE,
		);

		const triRB = new RightTriangleEntity(
			this.bounds[2] - RightTriangleEntity.size,
			this.bounds[3] - RightTriangleEntity.size,
			'NW',
			COLLIDER_TAG.SLOPE,
		);

		const yellowPoly = new PolygonEntity(50, 50, COLLIDER_TAG.YELLOW);
		const orangePoly = new PolygonEntity(150, 50, COLLIDER_TAG.ORANGE);

		this.addEntities(
			triLT,
			triRT,
			triLB,
			triRB,
			// yellowPoly, orangePoly
		);

		const shapes = [];
		shapes.push(new SquareEntity(120, 40, COLLIDER_TAG.YELLOW));
		shapes.push(new SquareEntity(200, 0, COLLIDER_TAG.YELLOW));
		shapes.push(new CircleEntity(30, 30, COLLIDER_TAG.ORANGE));
		shapes.push(new CircleEntity(0, 140, COLLIDER_TAG.ORANGE));
		shapes.push(new CircleEntity(200, 170, COLLIDER_TAG.ORANGE));

		// shapes.push(new SquareEntity(0, 0, COLLIDER_TAG.YELLOW));
		// shapes.push(new SquareEntity(20, 20, COLLIDER_TAG.YELLOW));
		// shapes.push(new SquareEntity(100, 70, COLLIDER_TAG.YELLOW));
		// shapes.push(new SquareEntity(20, 140, COLLIDER_TAG.YELLOW));
		this.addEntities(shapes);

		if (true) {
			this.addEntity(new MouseEntity());
		}
	}
}

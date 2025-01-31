import { Collision, Draw, Game, Scene, Entity } from '/bin/canvas-lord.js';
import * as Collide from '/bin/collider/collide.js';
import { addPos, Vec2 } from '/bin/math/index.js';
import {
	LineCollider,
	PointCollider,
	CircleCollider,
	PolygonCollider,
	RightTriangleCollider,
	RectCollider,
} from '/bin/collider/index.js';
import { Keys } from '/bin/core/input.js';

const drawRect = (ctx, fill, ...args) =>
	fill ? ctx.fillRect(...args) : ctx.strokeRect(...args);

const drawPolygon = (ctx, tri, color, type = 'stroke', map = false) => {
	let points = [...tri.points];
	if (map) points = points.map(([x, y]) => [x + tri.x, y + tri.y]);

	Draw.polygon(ctx, { type, color }, 0, 0, points);
};

const drawRightTriangle = (ctx, rt, color, x = 0, y = 0, style) => {
	const TL = new Vec2(x + rt.x, y + rt.y);
	const TR = new Vec2(x + rt.x + rt.w, y + rt.y);
	const BR = new Vec2(x + rt.x + rt.w, y + rt.y + rt.h);
	const BL = new Vec2(x + rt.x, y + rt.y + rt.h);
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
		{ x: 0, y: 0, points: points.map(({ x, y }) => [x, y]) },
		color,
		style,
	);
};

const COLLIDER_TAG = {
	SLOPE: 'slope',
	YELLOW: 'yellow',
	ORANGE: 'orange',
	MOUSE: 'mouse',
};

class CollisionEntity extends Entity {
	hover = false;

	constructor(x, y, type) {
		super(x, y);
		if (type === COLLIDER_TAG.YELLOW) {
			this.color = 'yellow';
		} else if (type === COLLIDER_TAG.ORANGE) {
			this.color = 'orange';
		} else if (type === COLLIDER_TAG.SLOPE) {
			this.color = 'black';
		} else if (type === COLLIDER_TAG.MOUSE) {
			this.color = 'green';
		} else {
			this.color = 'magenta';
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
			case 'rect': {
				drawRect(
					ctx,
					true,
					this.x,
					this.y,
					this.collider.w,
					this.collider.h,
				);
				break;
			}
			case 'circle': {
				Draw.circle(
					ctx,
					{ ...this, type: 'fill', color },
					this.x - this.collider.radius,
					this.y - this.collider.radius,
					this.collider.radius,
				);
				break;
			}
			case 'right-triangle': {
				drawRightTriangle(
					ctx,
					this.collider,
					color,
					this.x,
					this.y,
					'fill',
				);
				break;
			}
			case 'polygon': {
				this.collider.x = this.x;
				this.collider.y = this.y;
				drawPolygon(ctx, this.collider, color, 'fill', true);
				this.collider.x = 0;
				this.collider.y = 0;
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
				case 'rect': {
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
		this.collider = new RectCollider(20, 20);
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

class MouseEntity extends CollisionEntity {
	// TODO(bret): PointCollider :)

	constructor() {
		super(-100, -100, COLLIDER_TAG.MOUSE);

		this.rect = new RectCollider(20, 20);
		this.circle = new CircleCollider(10);

		this.changeCollider(this.circle);
	}

	changeCollider(c) {
		this.collider = c;
		this.collider.tag = COLLIDER_TAG.MOUSE;
	}

	update(input) {
		this.x = input.mouse.x;
		this.y = input.mouse.y;

		switch (true) {
			case input.keyPressed(Keys.Digit1):
				this.changeCollider(this.rect);
				break;
			case input.keyPressed(Keys.Digit2):
				this.changeCollider(this.circle);
				break;
		}
	}
}

export class EntityCollisionScene extends Scene {
	constructor(engine) {
		super(engine);

		const { canvas } = engine;
		this.bounds = [0, 0, canvas.width, canvas.height];

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

		[
			triLT,
			triRT,
			triLB,
			triRB,
			// yellowPoly, orangePoly
		].forEach((tri) => {
			this.addEntity(tri);
			this.addRenderable(tri);
		});

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
		shapes.forEach((shape) => {
			this.addEntity(shape);
			this.addRenderable(shape);
		});

		if (true) {
			const mouse = new MouseEntity();
			this.addEntity(mouse);
			this.addRenderable(mouse);
		}
	}
}

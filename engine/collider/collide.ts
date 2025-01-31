import {
	collideCircleCircle,
	collideCircleRightTriangle,
	collideCircleTriangle,
	collideLineCircle,
	collideLineLine,
	collideLineRect,
	collideLineRightTriangle,
	collideLineTriangle,
	collidePointCircle,
	collidePointGrid,
	collidePointLine,
	collidePointPoint,
	collidePointRect,
	collidePointRightTriangle,
	collidePointTriangle,
	collideRectCircle,
	collideRectGrid,
	collideRectRect,
	collideRectRightTriangle,
	collideRectTriangle,
	collideRightTriangleRightTriangle,
	collideRightTriangleTriangle,
	collideTriangleTriangle,
} from './collision.js';

import type { Collider, ColliderTag, ColliderType } from './collider.js';
import { PointCollider } from './point-collider.js';
import { LineCollider } from './line-collider.js';
import { RectCollider } from './rect-collider.js';
import { CircleCollider } from './circle-collider.js';
import { RightTriangleCollider } from './right-triangle-collider.js';
import { GridCollider } from './grid-collider.js';
import { TriangleCollider } from './triangle-collider.js';

const collisionMap = {
	point: {
		point: (p1: PointCollider, p2: PointCollider) =>
			collidePointPoint(p1.x, p1.y, p2.x, p2.y),
		line: (p: PointCollider, l: LineCollider) =>
			collidePointLine(p.x, p.y, l),
		rect: (p: PointCollider, r: RectCollider) =>
			collidePointRect(p.x, p.y, r),
		circle: (p: PointCollider, c: CircleCollider) =>
			collidePointCircle(p.x, p.y, c),
		'right-triangle': (p: PointCollider, rt: RightTriangleCollider) =>
			collidePointRightTriangle(p.x, p.y, rt),
		triangle: (p: PointCollider, t: TriangleCollider) =>
			collidePointTriangle(p.x, p.y, t),
		grid: (p: PointCollider, g: GridCollider) =>
			collidePointGrid(p.x, p.y, g),
	},
	line: {
		point: (l: LineCollider, p: PointCollider) =>
			collidePointLine(p.x, p.y, l),
		line: collideLineLine,
		rect: collideLineRect,
		circle: collideLineCircle,
		'right-triangle': collideLineRightTriangle,
		triangle: collideLineTriangle,
		grid: undefined,
	},
	rect: {
		point: (r: RectCollider, p: PointCollider) =>
			collidePointRect(p.x, p.y, r),
		line: (r: RectCollider, l: LineCollider) => collideLineRect(l, r),
		rect: collideRectRect,
		circle: collideRectCircle,
		'right-triangle': collideRectRightTriangle,
		triangle: collideRectTriangle,
		grid: collideRectGrid,
	},
	circle: {
		point: (c: CircleCollider, p: PointCollider) =>
			collidePointCircle(p.x, p.y, c),
		line: (c: CircleCollider, l: LineCollider) => collideLineCircle(l, c),
		rect: (c: CircleCollider, r: RectCollider) => collideRectCircle(r, c),
		circle: collideCircleCircle,
		'right-triangle': collideCircleRightTriangle,
		triangle: collideCircleTriangle,
		grid: undefined,
	},
	'right-triangle': {
		point: (rt: RightTriangleCollider, p: PointCollider) =>
			collidePointRightTriangle(p.x, p.y, rt),
		line: (rt: RightTriangleCollider, l: LineCollider) =>
			collideLineRightTriangle(l, rt),
		rect: (rt: RightTriangleCollider, r: RectCollider) =>
			collideRectRightTriangle(r, rt),
		circle: (rt: RightTriangleCollider, c: CircleCollider) =>
			collideCircleRightTriangle(c, rt),
		'right-triangle': collideRightTriangleRightTriangle,
		triangle: collideRightTriangleTriangle,
		grid: undefined,
	},
	triangle: {
		point: (t: TriangleCollider, p: PointCollider) =>
			collidePointTriangle(p.x, p.y, t),
		line: (t: TriangleCollider, l: LineCollider) =>
			collideLineTriangle(l, t),
		rect: (t: TriangleCollider, r: RectCollider) =>
			collideRectTriangle(r, t),
		circle: (t: TriangleCollider, c: CircleCollider) =>
			collideCircleTriangle(c, t),
		'right-triangle': (t: TriangleCollider, rt: RightTriangleCollider) =>
			collideRightTriangleTriangle(rt, t),
		triangle: collideTriangleTriangle,
		grid: undefined,
	},
	grid: {
		point: (g: GridCollider, p: PointCollider) =>
			collidePointGrid(p.x, p.y, g),
		line: (g: GridCollider, l: LineCollider) => () => {},
		//collideLineGrid(l, g),
		rect: (g: GridCollider, r: RectCollider) => collideRectGrid(r, g),
		circle: (g: GridCollider, c: CircleCollider) => () => {},
		//collideCircleGrid(c, g),
		'right-triangle':
			(g: GridCollider, rt: RightTriangleCollider) => () => {},
		// collideRightTriangleGrid(rt, g),
		triangle: (g: GridCollider, t: TriangleCollider) => () => {},
		//collideTriangleGrid(t, g),
		grid: () => {},
		//collideGridGrid,
	},
} as const;

export const collide = (shapeA: Collider, shapeB: Collider): boolean => {
	// @ts-expect-error
	return collisionMap[shapeA.type][shapeB.type](shapeA, shapeB);
};

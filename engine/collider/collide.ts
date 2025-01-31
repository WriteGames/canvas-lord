import {
	collideCircleCircle,
	collideCircleRightTriangle,
	collideCirclePolygon,
	collideLineCircle,
	collideLineLine,
	collideLineRect,
	collideLineRightTriangle,
	collideLinePolygon,
	collidePointCircle,
	collidePointGrid,
	collidePointLine,
	collidePointPoint,
	collidePointRect,
	collidePointRightTriangle,
	collidePointPolygon,
	collideRectCircle,
	collideRectGrid,
	collideRectRect,
	collideRectRightTriangle,
	collideRectPolygon,
	collideRightTriangleRightTriangle,
	collideRightTrianglePolygon,
	collidePolygonPolygon,
} from './collision.js';

import type { Collider } from './collider.js';
import { PointCollider } from './point-collider.js';
import { LineCollider } from './line-collider.js';
import { RectCollider } from './rect-collider.js';
import { CircleCollider } from './circle-collider.js';
import { RightTriangleCollider } from './right-triangle-collider.js';
import { GridCollider } from './grid-collider.js';
import { PolygonCollider } from './polygon-collider.js';

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
		polygon: (pt: PointCollider, p: PolygonCollider) =>
			collidePointPolygon(pt.x, pt.y, p),
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
		polygon: collideLinePolygon,
		grid: undefined,
	},
	rect: {
		point: (r: RectCollider, p: PointCollider) =>
			collidePointRect(p.x, p.y, r),
		line: (r: RectCollider, l: LineCollider) => collideLineRect(l, r),
		rect: collideRectRect,
		circle: collideRectCircle,
		'right-triangle': collideRectRightTriangle,
		polygon: collideRectPolygon,
		grid: collideRectGrid,
	},
	circle: {
		point: (c: CircleCollider, p: PointCollider) =>
			collidePointCircle(p.x, p.y, c),
		line: (c: CircleCollider, l: LineCollider) => collideLineCircle(l, c),
		rect: (c: CircleCollider, r: RectCollider) => collideRectCircle(r, c),
		circle: collideCircleCircle,
		'right-triangle': collideCircleRightTriangle,
		polygon: collideCirclePolygon,
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
		polygon: collideRightTrianglePolygon,
		grid: undefined,
	},
	polygon: {
		point: (p: PolygonCollider, pt: PointCollider) =>
			collidePointPolygon(pt.x, pt.y, p),
		line: (p: PolygonCollider, l: LineCollider) => collideLinePolygon(l, p),
		rect: (p: PolygonCollider, r: RectCollider) => collideRectPolygon(r, p),
		circle: (p: PolygonCollider, c: CircleCollider) =>
			collideCirclePolygon(c, p),
		'right-triangle': (p: PolygonCollider, rt: RightTriangleCollider) =>
			collideRightTrianglePolygon(rt, p),
		polygon: collidePolygonPolygon,
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
		polygon: (g: GridCollider, p: PolygonCollider) => () => {},
		//collidePolygonGrid(t, g),
		grid: () => {},
		//collideGridGrid,
	},
} as const;

export const collide = (shapeA: Collider, shapeB: Collider): boolean => {
	// @ts-expect-error
	return collisionMap[shapeA.type][shapeB.type](shapeA, shapeB);
};

/* Canvas Lord v0.5.3 */

import {
	collideCircleCircle,
	collideCircleRightTriangle,
	collideCirclePolygon,
	collideLineCircle,
	collideLineLine,
	collideLineBox,
	collideLineRightTriangle,
	collideLinePolygon,
	collidePointCircle,
	collidePointGrid,
	collidePointLine,
	collidePointPoint,
	collidePointBox,
	collidePointRightTriangle,
	collidePointPolygon,
	collideBoxCircle,
	collideBoxGrid,
	collideBoxBox,
	collideBoxRightTriangle,
	collideBoxPolygon,
	collideRightTriangleRightTriangle,
	collideRightTrianglePolygon,
	collidePolygonPolygon,
} from './collision.js';

import type { Collider } from './collider.js';
import type { PointCollider } from './point-collider.js';
import type { LineCollider } from './line-collider.js';
import type { BoxCollider } from './box-collider.js';
import type { CircleCollider } from './circle-collider.js';
import type { RightTriangleCollider } from './right-triangle-collider.js';
import type { GridCollider } from './grid-collider.js';
import type { PolygonCollider } from './polygon-collider.js';

const dePoint = (p: PointCollider) => [p.left, p.top] as const;
const deLine = (l: LineCollider) =>
	[l.xStart, l.yStart, l.xEnd, l.yEnd] as const;
const deBox = (b: BoxCollider) => [b.left, b.top, b.right, b.bottom] as const;
const deCircle = (c: CircleCollider) =>
	[c.centerX, c.centerY, c.radius] as const;
const deRT = (rt: RightTriangleCollider) => [rt] as const;
const dePolygon = (p: PolygonCollider) => [p] as const;
const deGrid = (g: GridCollider) => [g] as const;

const collisionMap = {
	point: {
		point: (a: PointCollider, b: PointCollider) =>
			collidePointPoint(...dePoint(a), ...dePoint(b)),
		line: (pt: PointCollider, l: LineCollider) =>
			collidePointLine(...dePoint(pt), ...deLine(l)),
		box: (pt: PointCollider, b: BoxCollider) =>
			collidePointBox(...dePoint(pt), ...deBox(b)),
		circle: (pt: PointCollider, c: CircleCollider) =>
			collidePointCircle(...dePoint(pt), ...deCircle(c)),
		'right-triangle': (pt: PointCollider, rt: RightTriangleCollider) =>
			collidePointRightTriangle(...dePoint(pt), ...deRT(rt)),
		polygon: (pt: PointCollider, p: PolygonCollider) =>
			collidePointPolygon(...dePoint(pt), ...dePolygon(p)),
		grid: (pt: PointCollider, g: GridCollider) =>
			collidePointGrid(...dePoint(pt), ...deGrid(g)),
	},
	line: {
		point: (l: LineCollider, pt: PointCollider) =>
			collidePointLine(...dePoint(pt), ...deLine(l)),
		line: (a: LineCollider, b: LineCollider) =>
			collideLineLine(...deLine(a), ...deLine(b)),
		box: (l: LineCollider, b: BoxCollider) =>
			collideLineBox(...deLine(l), ...deBox(b)),
		circle: (l: LineCollider, c: CircleCollider) =>
			collideLineCircle(...deLine(l), ...deCircle(c)),
		'right-triangle': (l: LineCollider, rt: RightTriangleCollider) =>
			collideLineRightTriangle(...deLine(l), ...deRT(rt)),
		polygon: (l: LineCollider, p: PolygonCollider) =>
			collideLinePolygon(...deLine(l), ...dePolygon(p)),
		grid: (_l: LineCollider, _g: GridCollider) => undefined,
	},
	box: {
		point: (b: BoxCollider, pt: PointCollider) =>
			collidePointBox(...dePoint(pt), ...deBox(b)),
		line: (b: BoxCollider, l: LineCollider) =>
			collideLineBox(...deLine(l), ...deBox(b)),
		box: (a: BoxCollider, b: BoxCollider) =>
			collideBoxBox(...deBox(a), ...deBox(b)),
		circle: (b: BoxCollider, c: CircleCollider) =>
			collideBoxCircle(...deBox(b), ...deCircle(c)),
		'right-triangle': (b: BoxCollider, rt: RightTriangleCollider) =>
			collideBoxRightTriangle(...deBox(b), ...deRT(rt)),
		polygon: (b: BoxCollider, p: PolygonCollider) =>
			collideBoxPolygon(...deBox(b), ...dePolygon(p)),
		grid: (b: BoxCollider, g: GridCollider) =>
			collideBoxGrid(...deBox(b), ...deGrid(g)),
	},
	circle: {
		point: (c: CircleCollider, pt: PointCollider) =>
			collidePointCircle(...dePoint(pt), ...deCircle(c)),
		line: (c: CircleCollider, l: LineCollider) =>
			collideLineCircle(...deLine(l), ...deCircle(c)),
		box: (c: CircleCollider, b: BoxCollider) =>
			collideBoxCircle(...deBox(b), ...deCircle(c)),
		circle: (a: CircleCollider, b: CircleCollider) =>
			collideCircleCircle(...deCircle(a), ...deCircle(b)),
		'right-triangle': (c: CircleCollider, rt: RightTriangleCollider) =>
			collideCircleRightTriangle(...deCircle(c), ...deRT(rt)),
		polygon: (c: CircleCollider, p: PolygonCollider) =>
			collideCirclePolygon(...deCircle(c), ...dePolygon(p)),
		grid: (_c: CircleCollider, _g: GridCollider) => undefined,
	},
	'right-triangle': {
		point: (rt: RightTriangleCollider, pt: PointCollider) =>
			collidePointRightTriangle(...dePoint(pt), ...deRT(rt)),
		line: (rt: RightTriangleCollider, l: LineCollider) =>
			collideLineRightTriangle(...deLine(l), ...deRT(rt)),
		box: (rt: RightTriangleCollider, b: BoxCollider) =>
			collideBoxRightTriangle(...deBox(b), ...deRT(rt)),
		circle: (rt: RightTriangleCollider, c: CircleCollider) =>
			collideCircleRightTriangle(...deCircle(c), ...deRT(rt)),
		'right-triangle': (
			a: RightTriangleCollider,
			b: RightTriangleCollider,
		) => collideRightTriangleRightTriangle(...deRT(a), ...deRT(b)),
		polygon: (rt: RightTriangleCollider, p: PolygonCollider) =>
			collideRightTrianglePolygon(...deRT(rt), ...dePolygon(p)),
		grid: (_rt: RightTriangleCollider) => undefined,
	},
	polygon: {
		point: (p: PolygonCollider, pt: PointCollider) =>
			collidePointPolygon(...dePoint(pt), ...dePolygon(p)),
		line: (p: PolygonCollider, l: LineCollider) =>
			collideLinePolygon(...deLine(l), ...dePolygon(p)),
		box: (p: PolygonCollider, b: BoxCollider) =>
			collideBoxPolygon(...deBox(b), ...dePolygon(p)),
		circle: (p: PolygonCollider, c: CircleCollider) =>
			collideCirclePolygon(...deCircle(c), ...dePolygon(p)),
		'right-triangle': (p: PolygonCollider, rt: RightTriangleCollider) =>
			collideRightTrianglePolygon(...deRT(rt), ...dePolygon(p)),
		polygon: (a: PolygonCollider, b: PolygonCollider) =>
			collidePolygonPolygon(...dePolygon(a), ...dePolygon(b)),
		grid: (_p: PolygonCollider, _g: GridCollider) => undefined,
	},
	grid: {
		point: (g: GridCollider, pt: PointCollider) =>
			collidePointGrid(...dePoint(pt), ...deGrid(g)),
		line: (_g: GridCollider, _l: LineCollider) => undefined,
		//collideLineGrid(l, g),
		box: (g: GridCollider, b: BoxCollider) =>
			collideBoxGrid(...deBox(b), ...deGrid(g)),
		circle: (_g: GridCollider, _c: CircleCollider) => undefined,
		//collideCircleGrid(c, g),
		'right-triangle': (_g: GridCollider, _rt: RightTriangleCollider) =>
			undefined,
		// collideRightTriangleGrid(rt, g),
		polygon: (_g: GridCollider, _p: PolygonCollider) => undefined,
		//collidePolygonGrid(t, g),
		grid: (_a: GridCollider, _b: GridCollider) => undefined,
		//collideGridGrid,
	},
} as const;

export const collide = (shapeA: Collider, shapeB: Collider): boolean => {
	// TODO(bret): well, remove the error supression :)
	// @ts-expect-error -- no idea how to fix this lol
	return collisionMap[shapeA.type][shapeB.type](shapeA, shapeB);
};

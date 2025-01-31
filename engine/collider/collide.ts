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

const dePoint = (p: PointCollider) => [p.left, p.top] as const;
const deLine = (l: LineCollider) =>
	[l.xStart, l.yStart, l.xEnd, l.yEnd] as const;
const deRect = (r: RectCollider) => [r.left, r.top, r.right, r.bottom] as const;
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
		rect: (pt: PointCollider, r: RectCollider) =>
			collidePointRect(...dePoint(pt), ...deRect(r)),
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
		rect: (l: LineCollider, r: RectCollider) =>
			collideLineRect(...deLine(l), ...deRect(r)),
		circle: (l: LineCollider, c: CircleCollider) =>
			collideLineCircle(...deLine(l), ...deCircle(c)),
		'right-triangle': (l: LineCollider, rt: RightTriangleCollider) =>
			collideLineRightTriangle(...deLine(l), ...deRT(rt)),
		polygon: (l: LineCollider, p: PolygonCollider) =>
			collideLinePolygon(...deLine(l), ...dePolygon(p)),
		grid: (l: LineCollider, g: GridCollider) => undefined,
	},
	rect: {
		point: (r: RectCollider, pt: PointCollider) =>
			collidePointRect(...dePoint(pt), ...deRect(r)),
		line: (r: RectCollider, l: LineCollider) =>
			collideLineRect(...deLine(l), ...deRect(r)),
		rect: (a: RectCollider, b: RectCollider) =>
			collideRectRect(...deRect(a), ...deRect(b)),
		circle: (r: RectCollider, c: CircleCollider) =>
			collideRectCircle(...deRect(r), ...deCircle(c)),
		'right-triangle': (r: RectCollider, rt: RightTriangleCollider) =>
			collideRectRightTriangle(...deRect(r), ...deRT(rt)),
		polygon: (r: RectCollider, p: PolygonCollider) =>
			collideRectPolygon(...deRect(r), ...dePolygon(p)),
		grid: (r: RectCollider, g: GridCollider) =>
			collideRectGrid(...deRect(r), ...deGrid(g)),
	},
	circle: {
		point: (c: CircleCollider, pt: PointCollider) =>
			collidePointCircle(...dePoint(pt), ...deCircle(c)),
		line: (c: CircleCollider, l: LineCollider) =>
			collideLineCircle(...deLine(l), ...deCircle(c)),
		rect: (c: CircleCollider, r: RectCollider) =>
			collideRectCircle(...deRect(r), ...deCircle(c)),
		circle: (a: CircleCollider, b: CircleCollider) =>
			collideCircleCircle(...deCircle(a), ...deCircle(b)),
		'right-triangle': (c: CircleCollider, rt: RightTriangleCollider) =>
			collideCircleRightTriangle(...deCircle(c), ...deRT(rt)),
		polygon: (c: CircleCollider, p: PolygonCollider) =>
			collideCirclePolygon(...deCircle(c), ...dePolygon(p)),
		grid: (c: CircleCollider, g: GridCollider) => undefined,
	},
	'right-triangle': {
		point: (rt: RightTriangleCollider, pt: PointCollider) =>
			collidePointRightTriangle(...dePoint(pt), ...deRT(rt)),
		line: (rt: RightTriangleCollider, l: LineCollider) =>
			collideLineRightTriangle(...deLine(l), ...deRT(rt)),
		rect: (rt: RightTriangleCollider, r: RectCollider) =>
			collideRectRightTriangle(...deRect(r), ...deRT(rt)),
		circle: (rt: RightTriangleCollider, c: CircleCollider) =>
			collideCircleRightTriangle(...deCircle(c), ...deRT(rt)),
		'right-triangle': (
			a: RightTriangleCollider,
			b: RightTriangleCollider,
		) => collideRightTriangleRightTriangle(...deRT(a), ...deRT(b)),
		polygon: (rt: RightTriangleCollider, p: PolygonCollider) =>
			collideRightTrianglePolygon(...deRT(rt), ...dePolygon(p)),
		grid: (rt: RightTriangleCollider) => undefined,
	},
	polygon: {
		point: (p: PolygonCollider, pt: PointCollider) =>
			collidePointPolygon(...dePoint(pt), ...dePolygon(p)),
		line: (p: PolygonCollider, l: LineCollider) =>
			collideLinePolygon(...deLine(l), ...dePolygon(p)),
		rect: (p: PolygonCollider, r: RectCollider) =>
			collideRectPolygon(...deRect(r), ...dePolygon(p)),
		circle: (p: PolygonCollider, c: CircleCollider) =>
			collideCirclePolygon(...deCircle(c), ...dePolygon(p)),
		'right-triangle': (p: PolygonCollider, rt: RightTriangleCollider) =>
			collideRightTrianglePolygon(...deRT(rt), ...dePolygon(p)),
		polygon: (a: PolygonCollider, b: PolygonCollider) =>
			collidePolygonPolygon(...dePolygon(a), ...dePolygon(b)),
		grid: (p: PolygonCollider, g: GridCollider) => undefined,
	},
	grid: {
		point: (g: GridCollider, pt: PointCollider) =>
			collidePointGrid(...dePoint(pt), ...deGrid(g)),
		line: (g: GridCollider, l: LineCollider) => undefined,
		//collideLineGrid(l, g),
		rect: (g: GridCollider, r: RectCollider) =>
			collideRectGrid(...deRect(r), ...deGrid(g)),
		circle: (g: GridCollider, c: CircleCollider) => undefined,
		//collideCircleGrid(c, g),
		'right-triangle': (g: GridCollider, rt: RightTriangleCollider) =>
			undefined,
		// collideRightTriangleGrid(rt, g),
		polygon: (g: GridCollider, p: PolygonCollider) => undefined,
		//collidePolygonGrid(t, g),
		grid: (a: GridCollider, b: GridCollider) => undefined,
		//collideGridGrid,
	},
} as const;

export const collide = (shapeA: Collider, shapeB: Collider): boolean => {
	// @ts-expect-error
	return collisionMap[shapeA.type][shapeB.type](shapeA, shapeB);
};

/* Canvas Lord v0.5.3 */

import {
	Vec2,
	EPSILON,
	addPos,
	scalePos,
	subPos,
	crossProduct2D,
	dotProduct2D,
	type Line2D,
} from '../math/index.js';

import type {
	GridCollider,
	PolygonCollider,
	RightTriangleCollider,
} from './index.js';

// TODO: bounds!

const getSideOfLine = (
	x: number,
	y: number,
	lineA: Vec2,
	lineB: Vec2,
): number => {
	const d =
		(lineB.y - lineA.y) * (x - lineA.x) -
		(lineB.x - lineA.x) * (y - lineA.y);
	return Math.sign(d);
};

// TODO: clean these up (would break some non-TS files unfortunately)
const _lineSegmentIntersection = ([a, b]: Line2D, [c, d]: Line2D): Vec2 => {
	const r = subPos(b, a);
	const s = subPos(d, c);

	const rxs = crossProduct2D(r, s);

	const t = crossProduct2D(subPos(c, a), s) / rxs;
	const u = crossProduct2D(subPos(a, c), r) / -rxs;

	return new Vec2(t, u);
};
export const checkLineSegmentIntersection = (a: Line2D, b: Line2D): boolean => {
	const [t, u] = _lineSegmentIntersection(a, b);
	return t >= 0 && t <= 1 && u >= 0 && u <= 1;
};
export const getLineSegmentIntersection = (
	a: Line2D,
	b: Line2D,
): Vec2 | null => {
	const [t, u] = _lineSegmentIntersection(a, b);

	return t >= 0 && t <= 1 && u >= 0 && u <= 1
		? addPos(a[0], scalePos(subPos(a[1], a[0]), t))
		: null;
};

/// ### Point vs X ###

export const collidePointPoint = (
	aX: number,
	aY: number,
	bX: number,
	bY: number,
): boolean => {
	return Math.abs(aX - bX) < EPSILON && Math.abs(aY - bY) < EPSILON;
};

export const collidePointLine = (
	x: number,
	y: number,
	x1: number,
	y1: number,
	x2: number,
	y2: number,
): boolean => {
	return collideLineCircle(x1, y1, x2, y2, x, y, 0.5);
};

export const collidePointBox = (
	x: number,
	y: number,
	left: number,
	top: number,
	right: number,
	bottom: number,
): boolean => {
	return x >= left && y >= top && x <= right && y <= bottom;
};

export const collidePointCircle = (
	x: number,
	y: number,
	cX: number,
	cY: number,
	radius: number,
): boolean => {
	const distanceSq = (cX - x) ** 2 + (cY - y) ** 2;
	return distanceSq <= radius ** 2;
};

export const collidePointRightTriangle = (
	x: number,
	y: number,
	rt: RightTriangleCollider,
): boolean => {
	if (collidePointBox(x, y, rt.left, rt.top, rt.right, rt.bottom)) {
		const TL = new Vec2(rt.left, rt.top);
		const TR = new Vec2(rt.right, rt.top);
		const BR = new Vec2(rt.right, rt.bottom);
		const BL = new Vec2(rt.left, rt.bottom);
		let side;
		switch (rt.orientation) {
			case 'NE':
				side = getSideOfLine(x, y, TL, BR);
				break;
			case 'SE':
				side = getSideOfLine(x, y, TR, BL);
				break;
			case 'SW':
				side = getSideOfLine(x, y, BR, TL);
				break;
			case 'NW':
				side = getSideOfLine(x, y, BL, TR);
				break;
			default:
				// eslint-disable-next-line @typescript-eslint/restrict-template-expressions -- for the JS users
				throw new Error(`Invalid orientation (${rt.orientation})`);
		}
		return side <= 0;
	}
	return false;
};

export const collidePointPolygon = (
	x: number,
	y: number,
	p: PolygonCollider,
): boolean => {
	let inside = false;
	const { vertices } = p;
	const n = vertices.length;
	for (let i = 0, j = n - 1; i < n; j = i++) {
		const a = vertices[i];
		const b = vertices[j];

		if (
			a[1] > y !== b[1] > y &&
			x < ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]) + a[0]
		)
			inside = !inside;
	}
	return inside;
};

// TODO(bret): make sure this is still working
export const collidePointGrid = (
	x: number,
	y: number,
	g: GridCollider,
): boolean => {
	if (!collidePointBox(x, y, g.left, g.top, g.right, g.bottom)) return false;

	const xx = Math.floor((x - g.left) / g.grid.tileW);
	const yy = Math.floor((y - g.top) / g.grid.tileH);
	return g.grid.getTile(xx, yy) === 1;
};

/// ### Line vs X ###

export const collideLineLine = (
	aX1: number,
	aY1: number,
	aX2: number,
	aY2: number,
	bX1: number,
	bY1: number,
	bX2: number,
	bY2: number,
): boolean => {
	const A: Line2D = [new Vec2(aX1, aY1), new Vec2(aX2, aY2)];
	const B: Line2D = [new Vec2(bX1, bY1), new Vec2(bX2, bY2)];
	return checkLineSegmentIntersection(A, B);
};

export const collideLineBox = (
	x1: number,
	y1: number,
	x2: number,
	y2: number,
	left: number,
	top: number,
	right: number,
	bottom: number,
): boolean => {
	if (
		collidePointBox(x1, y1, left, top, right, bottom) ||
		collidePointBox(x2, y2, left, top, right, bottom)
	)
		return true;

	const collideLine = collideLineLine.bind(null, x1, y1, x2, y2);
	return (
		collideLine(left, top, right, top) ||
		collideLine(right, top, right, bottom) ||
		collideLine(right, bottom, left, bottom) ||
		collideLine(left, bottom, left, top)
	);
};

export const collideLineCircle = (
	x1: number,
	y1: number,
	x2: number,
	y2: number,
	cX: number,
	cY: number,
	radius: number,
): boolean => {
	const pointA = new Vec2(x1, y1);
	const pointB = new Vec2(x2, y2);

	const circlePos = new Vec2(cX, cY);

	const line = pointB.sub(pointA);
	const lineLength = pointB.sub(pointA).magnitude;
	const norm = line.invScale(lineLength);
	const segmentToCircle = circlePos.sub(pointA);
	const closestPoint = dotProduct2D(segmentToCircle, line) / lineLength;

	let closest: Vec2;
	if (closestPoint < 0) closest = pointA;
	else if (closestPoint > lineLength) closest = pointB;
	else closest = pointA.add(norm.scale(closestPoint));

	return circlePos.sub(closest).magnitude <= radius;
};

export const collideLineRightTriangle = (
	x1: number,
	y1: number,
	x2: number,
	y2: number,
	rt: RightTriangleCollider,
): boolean => {
	return (
		collideLineLine(x1, y1, x2, y2, rt.x1, rt.y1, rt.x2, rt.y2) ||
		collideLineLine(x1, y1, x2, y2, rt.x2, rt.y2, rt.x3, rt.y3) ||
		collideLineLine(x1, y1, x2, y2, rt.x3, rt.y3, rt.x1, rt.y1) ||
		collidePointRightTriangle(x1, y1, rt) ||
		collidePointRightTriangle(x2, y2, rt)
	);
};

export const collideLinePolygon = (
	x1: number,
	y1: number,
	x2: number,
	y2: number,
	p: PolygonCollider,
): boolean => {
	// TODO: test if using barycentric coords would be faster!
	const { vertices } = p;
	const n = vertices.length;
	for (let i = 0, j = n - 1; i < n; j = i++) {
		if (
			collideLineLine(
				x1,
				y1,
				x2,
				y2,
				vertices[j][0],
				vertices[j][1],
				vertices[i][0],
				vertices[i][1],
			)
		)
			return true;
	}
	return false;
};

/// ### Box vs X ###

export const collideBoxBox = (
	aLeft: number,
	aTop: number,
	aRight: number,
	aBottom: number,
	bLeft: number,
	bTop: number,
	bRight: number,
	bBottom: number,
): boolean => {
	return (
		aRight >= bLeft && aBottom >= bTop && aLeft <= bRight && aTop <= bBottom
	);
};

export const collideBoxCircle = (
	left: number,
	top: number,
	right: number,
	bottom: number,
	cX: number,
	cY: number,
	radius: number,
): boolean => {
	const x = Math.clamp(cX, left, right);
	const y = Math.clamp(cY, top, bottom - 1);
	const distanceSq = (cX - x) ** 2 + (cY - y) ** 2;
	return distanceSq < radius ** 2;
};

export const collideBoxRightTriangle = (
	left: number,
	top: number,
	right: number,
	bottom: number,
	rt: RightTriangleCollider,
): boolean => {
	// TODO(bret): write a better version of this
	// NOTE(bret): Found this online https://seblee.me/2009/05/super-fast-trianglerectangle-intersection-test/

	const centerX = (right - left) / 2 + left;
	const centerY = (bottom - top) / 2 + top;

	return (
		collidePointRightTriangle(centerX, centerY, rt) ||
		collideLineBox(rt.x1, rt.y1, rt.x2, rt.y2, left, top, right, bottom) ||
		collideLineBox(rt.x2, rt.y2, rt.x3, rt.y3, left, top, right, bottom) ||
		collideLineBox(rt.x3, rt.y3, rt.x1, rt.y1, left, top, right, bottom)
	);
};

export const collideBoxPolygon = (
	left: number,
	top: number,
	right: number,
	bottom: number,
	p: PolygonCollider,
): boolean => {
	// check if we're even within the bounds
	if (
		!collideBoxBox(
			left,
			top,
			right,
			bottom,
			p.left,
			p.top,
			p.right,
			p.bottom,
		)
	)
		return false;

	// TODO(bret): revisit
	// this won't check if it's fully submerged :/ we would need SAT for that!
	const { vertices } = p;
	const n = vertices.length;
	for (let i = 0, j = n - 1; i < n; j = i++) {
		if (
			collideLineBox(
				vertices[j][0],
				vertices[j][1],
				vertices[i][0],
				vertices[i][1],
				left,
				top,
				right,
				bottom,
			)
		)
			return true;
	}
	return false;
};

export const collideBoxGrid = (
	left: number,
	top: number,
	right: number,
	bottom: number,
	g: GridCollider,
): boolean => {
	if (
		!collideBoxBox(
			left,
			top,
			right,
			bottom,
			g.left,
			g.top,
			g.right,
			g.bottom,
		)
	) {
		return false;
	}

	const x = left - g.left;
	const y = top - g.top;

	// NOTE(bret): these already have -1 applied
	const boxW = right - left;
	const boxH = bottom - top;

	// TODO(bret): uncertain if a clamp here is correct
	const minX = Math.clamp(
		Math.floor(x / g.grid.tileW),
		0,
		g.grid.columns - 1,
	);
	const minY = Math.clamp(Math.floor(y / g.grid.tileH), 0, g.grid.rows - 1);

	const maxX = Math.clamp(
		Math.floor((x + boxW) / g.grid.tileW),
		0,
		g.grid.columns - 1,
	);
	const maxY = Math.clamp(
		Math.floor((y + boxH) / g.grid.tileH),
		0,
		g.grid.rows - 1,
	);

	for (let yy = minY; yy <= maxY; ++yy) {
		for (let xx = minX; xx <= maxX; ++xx) {
			if (g.grid.getTile(xx, yy) === 1) return true;
		}
	}

	return false;
};

/// ### Circle vs X ###

export const collideCircleCircle = (
	aX: number,
	aY: number,
	aRadius: number,
	bX: number,
	bY: number,
	bRadius: number,
): boolean => {
	const distanceSq = (aX - bX) ** 2 + (aY - bY) ** 2;
	return distanceSq <= (aRadius + bRadius) ** 2;
};

export const collideCircleRightTriangle = (
	cX: number,
	cY: number,
	radius: number,
	rt: RightTriangleCollider,
): boolean => {
	// TODO(bret): Revisit
	// need to also check if the points are in the circle
	return (
		collidePointRightTriangle(cX, cY, rt) ||
		collideLineCircle(rt.x1, rt.y1, rt.x2, rt.y2, cX, cY, radius) ||
		collideLineCircle(rt.x2, rt.y2, rt.x3, rt.y3, cX, cY, radius) ||
		collideLineCircle(rt.x3, rt.y3, rt.x1, rt.y1, cX, cY, radius)
	);
};

export const collideCirclePolygon = (
	cX: number,
	cY: number,
	radius: number,
	p: PolygonCollider,
): boolean => {
	if (collidePointPolygon(cX, cY, p)) return true;

	const { vertices } = p;
	const n = vertices.length;
	for (let i = 0, j = n - 1; i < n; j = i++) {
		if (
			collideLineCircle(
				vertices[j][0],
				vertices[j][1],
				vertices[i][0],
				vertices[i][1],
				cX,
				cY,
				radius,
			)
		)
			return true;
	}
	return false;
};

/// ### Right Triangle vs X ###
export const collideRightTriangleRightTriangle = (
	a: RightTriangleCollider,
	b: RightTriangleCollider,
): boolean => {
	for (let i = 0; i < 3; ++i) {
		const aPoint = a.points[i];
		const bPoint = b.points[i];
		if (collidePointRightTriangle(aPoint.x, aPoint.y, b)) return true;
		if (collidePointRightTriangle(bPoint.x, bPoint.y, a)) return true;
	}
	return false;
};

// TODO(bret): need to do SAT here!! edges can collide w/o vertices
export const collideRightTrianglePolygon = (
	rt: RightTriangleCollider,
	p: PolygonCollider,
): boolean => {
	const vertices = p.vertices;
	for (let i = 0; i < vertices.length; ++i) {
		const vertex = vertices[i];
		if (collidePointRightTriangle(vertex[0], vertex[1], rt)) return true;
	}

	return (
		collidePointPolygon(rt.x1, rt.y1, p) ||
		collidePointPolygon(rt.x2, rt.y2, p) ||
		collidePointPolygon(rt.x3, rt.y3, p)
	);
};

/// ### Polygon vs X ###

const project = (
	p: PolygonCollider,
	axis: Vec2,
): { min: number; max: number } => {
	const { vertices } = p;
	let min = axis.dot(new Vec2(vertices[0][0], vertices[0][1]));
	let max = min;
	for (let i = 1; i < vertices.length; ++i) {
		const p = axis.dot(new Vec2(vertices[i][0], vertices[i][1]));
		if (p < min) {
			min = p;
		} else if (p > max) {
			max = p;
		}
	}
	return { min, max };
};

export const collidePolygonPolygon = (
	a: PolygonCollider,
	b: PolygonCollider,
): boolean => {
	const _axes = [a.axes, b.axes];

	for (let i = 0; i < 2; ++i) {
		const axes = _axes[i];
		for (let j = 0; j < axes.length; ++j) {
			const axis = axes[j];
			const aa = project(a, axis);
			const bb = project(b, axis);
			if (aa.min - bb.max > 0 || bb.min - aa.max > 0) return false;
		}
	}

	return true;
};

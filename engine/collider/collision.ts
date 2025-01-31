/* Canvas Lord v0.4.4 */
import {
	Vec2,
	EPSILON,
	addPos,
	scalePos,
	subPos,
	crossProduct2D,
	dotProduct2D,
	Line2D,
} from '../math/index.js';

import { GridCollider } from './grid-collider.js';
import {
	CircleCollider,
	LineCollider,
	PointCollider,
	PolygonCollider,
	RectCollider,
	RightTriangleCollider,
} from './index.js';

type Point = PointCollider;
type Line = LineCollider;
type Rect = RectCollider;
type Circle = CircleCollider;
type Polygon = PolygonCollider;
type RightTriangle = RightTriangleCollider;
type Grid = GridCollider;

// TODO: bounds!

// type AlwaysOmit =
// 	| 'type'
// 	| 'collide'
// 	| 'render'
// 	| 'options'
// 	| 'tag'
// 	| 'collidable'
// 	| 'parent';
// type RawCollider<T, O extends keyof Omit<T, AlwaysOmit>> = Omit<
// 	Line,
// 	AlwaysOmit | O
// >;
// type RawLine = RawCollider<Line, 'x' | 'y'>;
// type RawRightTriangle = RawCollider<RightTriangle, 'width' | 'height'>;
// type RawGrid = Omit<GridShape, AlwaysOmit>;
// type RawRect = RawCollider<Rect, 'width' | 'height'>;
// type RawCircle = RawCollider<Circle, 'r'>;
// type RawPolygon = Omit<Polygon, AlwaysOmit>;

const getSideOfLine = (x: number, y: number, lineA: Vec2, lineB: Vec2) => {
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

const getLineLength = (l: Line): number =>
	Math.sqrt((l.x1 - l.x2) ** 2 + (l.y1 - l.y2) ** 2);

// TODO(bret): Gonna be able to get this from the collider itself :)
const constructPolygonFromRightTriangle = (rt: RightTriangle) => {
	const TL = new Vec2(rt.left, rt.top);
	const TR = new Vec2(rt.right, rt.top);
	const BR = new Vec2(rt.right, rt.bottom);
	const BL = new Vec2(rt.left, rt.bottom);
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
			throw new Error(`Invalid orientation (${rt.orientation})`);
	}

	// console.log(points[0][0], rt.points[0][0]);

	const lines: Line[] = [];
	const n = points.length;
	for (let i = 0, j = n - 1; i < n; j = i++) {
		const x1 = points[j][0];
		const y1 = points[j][1];
		const x2 = points[i][0];
		const y2 = points[i][1];
		// @ts-expect-error
		lines.push({
			x1,
			y1,
			x2,
			y2,
			xStart: x1,
			yStart: y1,
			xEnd: x2,
			yEnd: y2,
		});
	}

	const polygon: Omit<
		Polygon,
		'render' | 'collide' | 'options' | 'parent' | 'assignParent'
	> = {
		type: 'polygon',
		points: points.map((v) => [v.x, v.y] as const) as Polygon['points'],
		lines: lines,
		edges: [],
		axes: [],
		collidable: true,
		// x: 0,
		// y: 0,
		x: (rt.x ?? 0) + (rt.parent?.x ?? 0),
		y: (rt.y ?? 0) + (rt.parent?.y ?? 0),
	};
	return polygon;
};

/// ### Point vs X ###

export const collidePointPoint = (
	aX: number,
	aY: number,
	bX: number,
	bY: number,
) => {
	return Math.abs(aX - bX) < EPSILON && Math.abs(aY - bY) < EPSILON;
};

export const collidePointLine = (
	x: number,
	y: number,
	x1: number,
	y1: number,
	x2: number,
	y2: number,
) => {
	return collideLineCircle(x1, y1, x2, y2, x, y, 0.5);
};

export const collidePointRect = (
	x: number,
	y: number,
	left: number,
	top: number,
	right: number,
	bottom: number,
) => {
	return x >= left && y >= top && x <= right && y <= bottom;
};

export const collidePointCircle = (
	x: number,
	y: number,
	cX: number,
	cY: number,
	radius: number,
) => {
	const distanceSq = (cX - x) ** 2 + (cY - y) ** 2;
	return distanceSq <= radius ** 2;
};

export const collidePointRightTriangle = (
	x: number,
	y: number,
	rt: RightTriangle,
) => {
	if (collidePointRect(x, y, rt.left, rt.top, rt.right, rt.bottom)) {
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
				throw new Error(`Invalid orientation (${rt.orientation})`);
		}
		return side <= 0;
	}
	return false;
};

export const collidePointPolygon = (x: number, y: number, p: Polygon) => {
	let inside = false;
	const points = p.points.map(([_x, _y]) => [_x + p.x, _y + p.y]);
	const n = points.length;
	for (let i = 0, j = n - 1; i < n; j = i++) {
		const a = points[i];
		const b = points[j];

		if (
			a[1] > y !== b[1] > y &&
			x < ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]) + a[0]
		)
			inside = !inside;
	}
	return inside;
};

// TODO(bret): make sure this is still working
export const collidePointGrid = (x: number, y: number, g: Grid) => {
	const left = g.x + g.parent.x;
	const top = g.y + g.parent.y;
	const right = g.x + g.parent.x + g.grid.width - 1;
	const bottom = g.y + g.parent.y + g.grid.height - 1;

	if (!collidePointRect(x, y, left, top, right, bottom)) return false;

	const xx = Math.floor(x / g.grid.tileW);
	const yy = Math.floor(y / g.grid.tileH);
	console.assert(xx === Math.clamp(xx, 0, g.grid.columns - 1));
	console.assert(yy === Math.clamp(yy, 0, g.grid.rows - 1));
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
) => {
	const A: Line2D = [new Vec2(aX1, aY1), new Vec2(aX2, aY2)];
	const B: Line2D = [new Vec2(bX1, bY1), new Vec2(bX2, bY2)];
	return checkLineSegmentIntersection(A, B);
};

export const collideLineRect = (
	x1: number,
	y1: number,
	x2: number,
	y2: number,
	left: number,
	top: number,
	right: number,
	bottom: number,
) => {
	if (
		collidePointRect(x1, y1, left, top, right, bottom) ||
		collidePointRect(x2, y2, left, top, right, bottom)
	)
		return true;

	const edge: Line = {
		x1: left,
		y1: top,
		x2: left,
		y2: top,
		xStart: left,
		yStart: top,
		xEnd: left,
		yEnd: top,
	};
	const edgeT: Line = {
		...edge,
		x2: right,
		xEnd: right,
	};
	const edgeR: Line = {
		...edge,
		x1: right,
		x2: right,
		y2: bottom,
		xStart: right,
		xEnd: right,
		yEnd: bottom,
	};
	const edgeB: Line = {
		...edge,
		x1: right,
		y1: bottom,
		y2: bottom,
		xStart: right,
		yStart: bottom,
		yEnd: bottom,
	};
	const edgeL: Line = {
		...edge,
		y1: bottom,
		yStart: bottom,
	};
	if (
		collideLineLine(l, edgeT) ||
		collideLineLine(l, edgeR) ||
		collideLineLine(l, edgeB) ||
		collideLineLine(l, edgeL)
	)
		return true;
	return false;
};

export const collideLineCircle = (
	x1: number,
	y1: number,
	x2: number,
	y2: number,
	cX: number,
	cY: number,
	radius: number,
) => {
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
	rt: RightTriangle,
) => {
	return collideLinePolygon(
		x1,
		y1,
		x2,
		y2,
		constructPolygonFromRightTriangle(rt),
	);
};

export const collideLinePolygon = (
	x1: number,
	y1: number,
	x2: number,
	y2: number,
	p: Polygon,
) => {
	// TODO: test if using barycentric coords would be faster!
	const { edges } = p;
	if (!edges) return false;
	const n = edges.length;
	for (let i = 0; i < n; ++i) {
		if (collideLineLine(x1, y1, x2, y2, edges[i])) return true;
	}
	return false;
};

/// ### Rect vs X ###

export const collideRectRect = (
	aLeft: number,
	aTop: number,
	aRight: number,
	aBottom: number,
	bLeft: number,
	bTop: number,
	bRight: number,
	bBottom: number,
) => {
	return (
		aRight >= bLeft && aBottom >= bTop && aLeft <= bRight && aTop <= bBottom
	);
};

export const collideRectCircle = (
	left: number,
	top: number,
	right: number,
	bottom: number,
	cX: number,
	cY: number,
	radius: number,
) => {
	const x = Math.clamp(cX, left, right);
	const y = Math.clamp(cY, top, bottom - 1);
	const distanceSq = (cX - x) ** 2 + (cY - y) ** 2;
	return distanceSq < radius ** 2;
};

export const collideRectRightTriangle = (
	left: number,
	top: number,
	right: number,
	bottom: number,
	rt: RightTriangle,
) => {
	// TODO(bret): write a better version of this
	// NOTE(bret): Found this online https://seblee.me/2009/05/super-fast-trianglerectangle-intersection-test/

	return collideRectPolygon(
		left,
		top,
		right,
		bottom,
		constructPolygonFromRightTriangle(rt),
	);
};

export const collideRectPolygon = (
	left: number,
	top: number,
	right: number,
	bottom: number,
	p: Polygon,
) => {
	// TODO(bret): revisit
	// this won't check if it's fully submerged :/ we would need SAT for that!
	const { lines } = p;
	const n = lines.length;
	for (let i = 0; i < n; ++i) {
		if (collideLineRect(lines[i], left, top, right, bottom)) return true;
	}
	return false;
};

export const collideRectGrid = (
	left: number,
	top: number,
	right: number,
	bottom: number,
	g: Grid,
) => {
	// are we within the bounds of the grid???

	const gLeft = g.x + g.parent.x;
	const gTop = g.y + g.parent.y;
	const gRight = g.x + g.parent.x + g.grid.width - 1;
	const gBottom = g.y + g.parent.y + g.grid.height - 1;

	if (
		!collideRectRect(left, right, top, bottom, gLeft, gTop, gRight, gBottom)
	)
		return false;

	const x = left - gLeft;
	const y = top - gTop;

	// TODO(bret): uncertain if a clamp here is correct
	const minX = Math.clamp(
		Math.floor(x / g.grid.tileW),
		0,
		g.grid.columns - 1,
	);
	const minY = Math.clamp(Math.floor(y / g.grid.tileH), 0, g.grid.rows - 1);

	// NOTE(bret): these already have -1 applied
	const rectW = right - left;
	const rectH = bottom - top;

	const maxX = Math.clamp(
		Math.floor((x + rectW) / g.grid.tileW),
		0,
		g.grid.columns - 1,
	);
	const maxY = Math.clamp(
		Math.floor((y + rectH) / g.grid.tileH),
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
) => {
	const distanceSq = (aX - bX) ** 2 + (aY - bY) ** 2;
	return distanceSq <= (aRadius + bRadius) ** 2;
};

export const collideCircleRightTriangle = (
	cX: number,
	cY: number,
	radius: number,
	rt: RightTriangle,
) => {
	// TODO(bret): Revisit
	return false;
	return (
		collideLineCircle(rt.x1, rt.y1, rt.x2, rt.y2, cX, cY, radius) ||
		collideLineCircle(rt.x2, rt.y2, rt.x3, rt.y3, cX, cY, radius) ||
		collideLineCircle(rt.x3, rt.y3, rt.x1, rt.y1, cX, cY, radius)
	);
};

export const collideCirclePolygon = (
	cX: number,
	cY: number,
	radius: number,
	p: Polygon,
) => {
	// TODO(bret): revisit
	// this won't check if it's the circle is fully inside the polygon :/ might need SAT for that
	const { edges: lines } = p;
	const n = lines.length;
	for (let i = 0; i < n; ++i) {
		if (collideLineCircle(lines[i], cX, cY, radius)) return true;
	}
	return false;
};

/// ### Right Triangle vs X ###
export const collideRightTriangleRightTriangle = (
	a: RightTriangle,
	b: RightTriangle,
) => {
	// TODO: revisit
	return collidePolygonPolygon(
		constructPolygonFromRightTriangle(a),
		constructPolygonFromRightTriangle(b),
	);
};

export const collideRightTrianglePolygon = (rt: RightTriangle, p: Polygon) => {
	// TODO: revisit
	return collidePolygonPolygon(constructPolygonFromRightTriangle(rt), p);
};

/// ### Polygon vs X ###

const project = (p: Polygon, axis: Vec2) => {
	const { points } = p;
	let min = axis.dot(new Vec2(points[0][0], points[0][1]));
	let max = min;
	for (let i = 1; i < points.length; ++i) {
		let p = axis.dot(new Vec2(points[i][0], points[i][1]));
		if (p < min) {
			min = p;
		} else if (p > max) {
			max = p;
		}
	}
	return { min, max };
};

export const collidePolygonPolygon = (a: Polygon, b: Polygon) => {
	// TODO(bret): revisit
	// we need proper SAT for when shapes are engulfed in their parent
	const axesA = a.axes;
	const axesB = b.axes;

	for (let i = 0; i < axesA.length; ++i) {
		const axis = axesA[i];
		const aa = project(a, axis);
		const bb = project(b, axis);
		if (aa.max >= bb.min && aa.min <= bb.max) {
			return false;
		}
	}

	for (let i = 0; i < axesB.length; ++i) {
		const axis = axesB[i];
		const aa = project(a, axis);
		const bb = project(b, axis);
		if (aa.max >= bb.min && aa.min <= bb.max) {
			return false;
		}
	}

	return true;
};

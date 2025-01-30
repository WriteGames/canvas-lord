/* Canvas Lord v0.4.4 */
import { Engine } from './core/engine.js';
import {
	V4,
	type Vector,
	addPos,
	subPos,
	scalePos,
	posToIndex,
	indexToPos,
	hashPos,
	posEqual,
	Vec2,
	EPSILON,
} from './util/math.js';

import { CSSColor } from './util/types.js';

import type { Camera } from './util/camera.js';
import { Tileset } from './util/graphic.js';
import { Grid } from './util/grid.js';

// exports
export * from './core/asset-manager.js';
export * from './core/engine.js';
export { Input, Keys, type Key } from './core/input.js';
export { Entity } from './core/entity.js';
export { Scene } from './core/scene.js';

// TODO: only export these from math.js
export {
	V2,
	type Vector,
	addPos,
	subPos,
	scalePos,
	EPSILON,
} from './util/math.js';
export { Draw } from './util/draw.js';
export { Camera } from './util/camera.js';
export * as Collision from './util/collision.js';
export {
	checkLineSegmentIntersection,
	getLineSegmentIntersection,
} from './util/collision.js';
export { Grid } from './util/grid.js';
export { Tileset } from './util/graphic.js';

declare global {
	interface HTMLCanvasElement {
		_engine: Engine;
		_actualWidth: number;
		_actualHeight: number;
		_offsetX: number;
		_offsetY: number;
		_scaleX: number;
		_scaleY: number;
	}

	interface Math {
		clamp: (val: number, min: number, max: number) => number;
		lerp: (a: number, b: number, t: number) => number;
	}
}

type Writeable<T> = {
	-readonly [P in keyof T]: T[P];
};

type FuncReduceVector = <A extends Vector, B extends Vector>(
	a: Vec2,
	b: Vec2,
) => number;

type FuncReduceNumber = (acc: number, v: number) => number;

type VectorToObjectVectorHybrid<A extends readonly PropertyKey[]> = Pick<
	{
		[TIndex in A[number] | keyof A]: number;
	},
	Exclude<keyof A, keyof unknown[]> | A[number]
>;

const reduceSum: FuncReduceNumber = (acc, v) => acc + v;
const reduceProduct: FuncReduceNumber = (acc, v) => acc * v;

const distance = (dimensions: Vec2): number =>
	Math.abs(Math.sqrt(dimensions.map((d) => d * d).reduce(reduceSum, 0)));
const distanceSq = (dimensions: Vec2): number =>
	Math.abs(dimensions.map((d) => d * d).reduce(reduceSum, 0));

const isDefined = <T>(v: T | undefined): v is T => Boolean(v);

const interlaceArrays = <T, U>(
	a: Readonly<T[]>,
	b: Readonly<U[]>,
): Array<T | U> => a.flatMap((v, i) => [v, b[i]]).filter(isDefined);

export const mapByOffset = <V extends Vector>(
	offset: Vec2,
): ((pos: Vec2) => Vec2) => {
	return (pos: Vec2): Vec2 => addPos(offset, pos);
};
export const mapFindOffset = <V extends Vector>(
	origin: Vec2,
): ((pos: Vec2) => Vec2) => {
	return (pos: Vec2): Vec2 => subPos(pos, origin);
};
export const flatMapByOffsets = <V extends Vector>(
	offsets: Vec2[],
): ((pos: Vec2) => Vec2[]) => {
	return (pos: Vec2): Vec2[] => offsets.map((offset) => addPos(offset, pos));
};
export const posDistance: FuncReduceVector = (a, b) => distance(subPos(b, a));
export const posDistanceSq: FuncReduceVector = (a, b) =>
	distanceSq(subPos(b, a));

// const pathToSegments = (path) =>
// 	path.map((vertex, i, vertices) => [
// 		vertex,
// 		vertices[(i + 1) % vertices.length],
// 	]);

const RAD_TO_DEG = 180.0 / Math.PI;
const radToDeg = (rad: number): number => rad * RAD_TO_DEG;
const DEG_TO_RAD = Math.PI / 180.0;
const degToRad = (deg: number): number => deg * DEG_TO_RAD;

const RAD_45 = 45 * DEG_TO_RAD;
const RAD_90 = 90 * DEG_TO_RAD;
const RAD_180 = 180 * DEG_TO_RAD;
const RAD_270 = 270 * DEG_TO_RAD;
const RAD_360 = 360 * DEG_TO_RAD;
const RAD_540 = 540 * DEG_TO_RAD;
const RAD_720 = 720 * DEG_TO_RAD;

// const getAngle = (a, b) => Math.atan2(...subPos(b, a)) * 180 / Math.PI;
const getAngle: FuncReduceVector = (a, b) =>
	Math.atan2(b[1] - a[1], b[0] - a[0]);
const getAngleBetween: FuncReduceNumber = (a, b) =>
	((b - a + RAD_540) % RAD_360) - RAD_180;

export const isPointOnLine = <V extends Vector>(
	point: Vec2,
	a: Vec2,
	b: Vec2,
): boolean =>
	Math.abs(
		posDistance(a, point) + posDistance(point, b) - posDistance(a, b),
	) < EPSILON;

// TODO(bret): Would be fun to make this work with any dimensions
export const isWithinBounds = (
	[x, y]: Vec2,
	[x1, y1]: Vec2,
	[x2, y2]: Vec2,
): boolean => x >= x1 && y >= y1 && x < x2 && y < y2;

export const filterWithinBounds =
	<V extends Vector>(a: Vec2, b: Vec2): ((pos: Vec2) => boolean) =>
	(pos: Vec2): boolean =>
		a.every((p, i) => ([...pos][i] ?? -Infinity) >= p) &&
		b.every((p, i) => ([...pos][i] ?? Infinity) < p);

type Path = Vec2[];

export const isPointInsidePath = (point: Vec2, path: Path): boolean => {
	const wind = path
		.map((vertex) => getAngle(point, vertex))
		.map((angle, i, arr) =>
			getAngleBetween(angle, arr[(i + 1) % arr.length] as number),
		)
		.reduce(reduceSum, 0);
	return Math.abs(wind) > EPSILON;
};

const createBitEnum = <T extends readonly string[]>(
	..._names: T
): VectorToObjectVectorHybrid<T> => {
	const names = _names.flat();
	const bitEnumObj = {} as VectorToObjectVectorHybrid<T>;
	names.forEach((name, i) => {
		const val = 1 << i;
		bitEnumObj[i as keyof typeof bitEnumObj] = val;
		bitEnumObj[name.toUpperCase() as keyof typeof bitEnumObj] = val;
	});
	return bitEnumObj;
};

export const dirNN = 0;
export const [dirRN, dirNU, dirLN, dirND] = Object.freeze(
	Array.from({ length: 4 }).map((_, i) => 1 << i),
) as V4;
// prettier-ignore
export const [
	dirLU, dirRU,
	dirLD, dirRD,
] = [
	dirLN | dirNU, dirRN | dirNU,
	dirLN | dirND, dirRN | dirND,
];

let nnn;
{
	// prettier-ignore
	const [
		normLU, normNU, normRU,
		normLN, normNN, normRN,
		normLD, normND, normRD,
	] = [
		new Vec2(-1, -1),
		new Vec2(0, -1),
		new Vec2(1, -1),

		new Vec2(-1, 0),
		new Vec2(0, 0),
		new Vec2(1, 0),

		new Vec2(-1, 1),
		new Vec2(0, 1),
		new Vec2(1, 1),
	];

	// prettier-ignore
	nnn = {
		LU: normLU, NU: normNU, RU: normRU,
		LN: normLN, NN: normNN, RN: normRN,
		LD: normLD, ND: normND, RD: normRD,
	}
}

export const norm = nnn;

const orthogonalNorms = [norm.RN, norm.NU, norm.LN, norm.ND] as const;
const diagonalNorms = [norm.RU, norm.LU, norm.LD, norm.RD] as const;
export const cardinalNorms = interlaceArrays(orthogonalNorms, diagonalNorms);

// TODO: also allow for non-readonly versions :)
type V2OrthogonalNorm = (typeof orthogonalNorms)[number];
type V2DiagonalNorm = (typeof diagonalNorms)[number];
type V2CardinalNorm = V2OrthogonalNorm | V2DiagonalNorm;

// Starts right, goes counter-clockwise
export const reduceBitFlags = (acc: number, val: number): number => acc | val;
const cardinalNormStrs = [
	'RN',
	'RU',
	'NU',
	'LU',
	'LN',
	'LD',
	'ND',
	'RD',
] as const;
type CardinalNormStr = (typeof cardinalNormStrs)[number];
const CARDINAL_NORM = createBitEnum(...cardinalNormStrs);
const mapStrToCardinalDirBitFlag = (str: CardinalNormStr): number =>
	CARDINAL_NORM[str];

class V2Map<K extends Vec2, V> {
	#map = new Map<string, V>();

	constructor() {
		this.#map = new Map();
	}
	delete(key: K): boolean {
		return this.#map.delete(hashPos(key));
	}
	get(key: K): V | undefined {
		return this.#map.get(hashPos(key));
	}
	has(key: K): boolean {
		return this.#map.has(hashPos(key));
	}
	set(key: K, value: V): this {
		this.#map.set(hashPos(key), value);
		return this;
	}
}

export const normToBitFlagMap = new V2Map<V2CardinalNorm, number>();
[
	[norm.RN, CARDINAL_NORM.RN] as const, // 1
	[norm.RU, CARDINAL_NORM.RU] as const, // 2
	[norm.NU, CARDINAL_NORM.NU] as const, // 4
	[norm.LU, CARDINAL_NORM.LU] as const, // 8
	[norm.LN, CARDINAL_NORM.LN] as const, // 16
	[norm.LD, CARDINAL_NORM.LD] as const, // 32
	[norm.ND, CARDINAL_NORM.ND] as const, // 64
	[norm.RD, CARDINAL_NORM.RD] as const, // 128
].forEach(([dir, bitFlag]) => normToBitFlagMap.set(dir, bitFlag));

const orTogetherCardinalDirs = (...dirs: CardinalNormStr[]): number =>
	dirs.map(mapStrToCardinalDirBitFlag).reduce(reduceBitFlags, 0);

export const globalSetTile = (
	tileset: Tileset,
	x: number,
	y: number,
	bitFlag: number,
): void => {
	switch (bitFlag & ~orTogetherCardinalDirs('LD', 'RD', 'LU', 'RU')) {
		case 0:
			tileset.setTile(x, y, 0, 5);
			break;

		case orTogetherCardinalDirs('NU'):
			tileset.setTile(x, y, 0, 7);
			break;

		case orTogetherCardinalDirs('ND'):
			tileset.setTile(x, y, 0, 6);
			break;

		case orTogetherCardinalDirs('LN'):
			tileset.setTile(x, y, 3, 4);
			break;

		case orTogetherCardinalDirs('RN'):
			tileset.setTile(x, y, 1, 4);
			break;

		case orTogetherCardinalDirs('LN', 'RN'):
			tileset.setTile(x, y, 0, 2);
			break;

		case orTogetherCardinalDirs('ND', 'NU'):
			tileset.setTile(x, y, 0, 3);
			break;

		case orTogetherCardinalDirs('RN', 'NU', 'ND'):
			tileset.setTile(x, y, 1, 6);
			break;

		case orTogetherCardinalDirs('NU', 'LN', 'ND'):
			tileset.setTile(x, y, 3, 6);
			break;

		case orTogetherCardinalDirs('RN', 'NU', 'LN', 'ND'):
			tileset.setTile(x, y, 2, 6);
			break;

		case orTogetherCardinalDirs('LN', 'ND'):
			tileset.setTile(x, y, 2, 5);
			break;

		case orTogetherCardinalDirs('LN', 'NU'):
			tileset.setTile(x, y, 3, 7);
			break;

		case orTogetherCardinalDirs('RN', 'ND'):
			tileset.setTile(x, y, 2, 3);
			break;

		case orTogetherCardinalDirs('LN', 'RN', 'ND'):
			tileset.setTile(x, y, 2, 2);
			break;

		case orTogetherCardinalDirs('RN', 'NU'):
			tileset.setTile(x, y, 1, 7);
			break;

		case orTogetherCardinalDirs('RN', 'NU', 'LN'):
			tileset.setTile(x, y, 2, 7);
			break;

		case orTogetherCardinalDirs('NU', 'LN'):
			tileset.setTile(x, y, 3, 7);
			break;
	}
};

// TODO(bret): Rewrite these to use Vectors once those are implemented :)
const rotateNormBy45Deg = (
	curDir: V2CardinalNorm,
	turns: number,
): V2CardinalNorm => {
	const norms = cardinalNorms; // .flatMap(v => [v, v]);
	const index = cardinalNorms.indexOf(curDir);
	if (index === -1) {
		console.error('rotateNormBy45Deg expects a norm array');
		return curDir;
	}

	const n = cardinalNorms.length;
	return cardinalNorms[(index - turns + n) % n] as V2CardinalNorm;
};

// NOTE: The generic allows it to use V2's orthogonal or diagonal norm types, depending on the `curDir`
const rotateNormBy90Deg = <V extends V2CardinalNorm>(
	curDir: V,
	turns: number,
): V => rotateNormBy45Deg(curDir, 2 * turns) as V;

type GridOrData = Grid | Grid['data'];

interface Polygon {
	points: Path;
}

function getGridData(
	_grid: GridOrData,
	_columns?: number,
	_rows?: number,
): [Grid['data'], number, number] {
	if (_grid instanceof Grid) {
		const { data: grid, columns, rows } = _grid;
		return [grid, columns, rows];
	}
	return [_grid, _columns as number, _rows as number];
}

export const findAllPolygonsInGrid = (
	_grid: GridOrData,
	_columns?: number,
	_rows?: number,
): Polygon[] => {
	const [grid, columns, rows] = getGridData(_grid, _columns, _rows);

	const polygons: Polygon[] = [];

	const offsets = {
		[hashPos(norm.NU)]: [norm.RU, norm.NU],
		[hashPos(norm.ND)]: [norm.LD, norm.ND],
		[hashPos(norm.RN)]: [norm.RD, norm.RN],
		[hashPos(norm.LN)]: [norm.LU, norm.LN],
	} as const;

	const shapes = findAllShapesInGrid(grid, columns, rows);
	shapes.forEach((shape) => {
		const [first] = shape.shapeCells;
		if (first === undefined) return;

		const { gridType } = shape;

		let curDir = norm.ND as V2OrthogonalNorm;
		let lastDir = curDir;

		const points: Path = [];
		const polygon = { points };
		polygons.push(polygon);

		const addPointsToPolygon = (
			points: Path,
			pos: Vec2,
			interior: boolean,
		): void => {
			const origin = interior ? 0 : -1;
			const size = 16;
			const m1 = size - 1;
			const basePos = scalePos(pos, size);

			const [lastX, lastY] = points.length
				? subPos(points[points.length - 1]!, basePos)
				: [origin, origin];

			const offset = new Vec2(0, 0);
			switch (curDir) {
				case norm.ND:
					offset[0] = origin;
					offset[1] = lastY;
					break;

				case norm.NU:
					offset[0] = m1 - origin;
					offset[1] = lastY;
					break;

				case norm.RN:
					offset[0] = lastX;
					offset[1] = m1 - origin;
					break;

				case norm.LN:
					offset[0] = lastX;
					offset[1] = origin;
					break;
			}

			points.push(addPos(basePos, offset));
		};

		addPointsToPolygon(points, first, gridType === 1);

		for (
			let next = first, firstIter = true;
			firstIter || !posEqual(curDir, norm.ND) || !posEqual(next, first);
			firstIter = false
		) {
			const [p1, p2] = (
				offsets[hashPos(curDir)] as [V2CardinalNorm, V2CardinalNorm]
			)
				.map((o) => addPos(next, o))
				.map((p) => {
					return isWithinBounds(p, Vec2.zero, new Vec2(columns, rows))
						? (grid[posToIndex(p, columns)] as number)
						: 0;
				});

			if (p2 === gridType) {
				if (p1 === gridType) {
					next = addPos(next, curDir);
					curDir = rotateNormBy90Deg(curDir, 1);
				}

				next = addPos(next, curDir);

				if (lastDir !== curDir)
					addPointsToPolygon(points, next, gridType === 1);
			} else {
				curDir = rotateNormBy90Deg(curDir, -1);
				addPointsToPolygon(points, next, gridType === 1);
			}

			lastDir = curDir;

			// if (curDir === normND && next === first) break;
		}
	});

	return polygons;
};

interface Shape {
	gridType: number;
	shapeCells: Vec2[];
	minX: number;
	maxX: number;
	minY: number;
	maxY: number;
}

const findAllShapesInGrid = (
	_grid: GridOrData,
	_columns?: number,
	_rows?: number,
): Shape[] => {
	const [grid, columns, rows] = getGridData(_grid, _columns, _rows);

	const shapes = [];
	const checked = Array.from({ length: columns * rows }, () => false);

	let nextIndex;
	while ((nextIndex = checked.findIndex((v) => !v)) > -1) {
		const shape = fillShape(
			indexToPos(nextIndex, columns),
			checked,
			grid,
			columns,
			rows,
		);

		// Empty shapes must be enclosed
		if (
			shape.gridType === 0 &&
			(shape.minX === 0 ||
				shape.minY === 0 ||
				shape.maxX >= columns ||
				shape.maxY >= rows)
		)
			continue;

		shapes.push(shape);
	}

	return shapes;
};

const fillShape = (
	start: Vec2,
	checked: boolean[],
	_grid: GridOrData,
	_columns?: number,
	_rows?: number,
): {
	gridType: number;
	shapeCells: Vec2[];
	minX: number;
	maxX: number;
	minY: number;
	maxY: number;
} => {
	const [grid, columns, rows] = getGridData(_grid, _columns, _rows);

	const stride = columns;

	const gridType = grid[posToIndex(start, columns)] as number;

	const queue = [start];
	const visited: string[] = [];

	let next;
	while ((next = queue.pop())) {
		const hash = hashPos(next);
		if (visited.includes(hash)) continue;

		const index = posToIndex(next, stride);
		visited.push(hash);
		if (grid[posToIndex(next, columns)] !== gridType) continue;

		checked[index] = true;

		const [x, y] = next;
		if (x > 0) queue.push(new Vec2(x - 1, y));
		if (x < columns - 1) queue.push(new Vec2(x + 1, y));
		if (y > 0) queue.push(new Vec2(x, y - 1));
		if (y < rows - 1) queue.push(new Vec2(x, y + 1));
	}

	const shapeCells = visited.map(
		(v) => new Vec2(...v.split(',').map((c) => +c)),
	);

	const shapeBounds = shapeCells.reduce(
		(acc, cell) => {
			const [x, y] = cell;
			return {
				minX: Math.min(x, acc.minX),
				maxX: Math.max(x, acc.maxX),
				minY: Math.min(y, acc.minY),
				maxY: Math.max(y, acc.maxY),
			};
		},
		{
			minX: Number.POSITIVE_INFINITY,
			maxX: Number.NEGATIVE_INFINITY,
			minY: Number.POSITIVE_INFINITY,
			maxY: Number.NEGATIVE_INFINITY,
		},
	);

	return {
		...shapeBounds,
		gridType,
		shapeCells,
	};
};

export interface GridOutline {
	grid: Grid | null;
	polygons: Polygon[];
	show: boolean;

	renderOutline: boolean;
	outlineColor: CSSColor;

	renderPoints: boolean;
	pointsColor: CSSColor;
}

export class GridOutline {
	constructor() {
		this.grid = null;
		this.polygons = [];
		this.show = false;

		this.renderOutline = true;
		this.outlineColor = 'red';

		this.renderPoints = true;
		this.pointsColor = 'red';
	}

	computeOutline(grid: Grid): void {
		this.grid = grid;
		this.polygons = findAllPolygonsInGrid(grid);
	}

	render(ctx: CanvasRenderingContext2D, camera: Camera): void {
		if (!this.show) return;

		// Draw edges
		if (this.renderOutline) {
			this.polygons.forEach((polygon) => {
				ctx.beginPath();
				ctx.strokeStyle = this.outlineColor;
				const start = addPos(polygon.points[0]!, [0.5, 0.5]);
				const cameraPos = new Vec2(camera[0], camera[1]);
				const [_x, _y] = subPos(start, cameraPos);
				ctx.moveTo(_x, _y);
				polygon.points
					.slice(1)
					.map((p) => subPos(p, camera))
					.forEach(([x, y]) => {
						ctx.lineTo(x + 0.5, y + 0.5);
					});
				ctx.closePath();
				ctx.stroke();
			});
		}

		// Draw points
		if (this.renderPoints) {
			ctx.fillStyle = this.pointsColor;
			this.polygons.forEach((polygon) => {
				polygon.points
					.map((p) => subPos(p, camera))
					.forEach(([x, y]) => {
						ctx.fillRect(x - 1, y - 1, 3, 3);
					});
			});
		}
	}
}

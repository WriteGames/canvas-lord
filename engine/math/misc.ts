/* Canvas Lord v0.6.0 */

// TODO(bret): This file is a bunch of random stuff, will need to clean up
import {
	addPos,
	EPSILON,
	hashPos,
	subPos,
	type V4,
	Vec2,
	// type Vector,
} from './index.js';
import type { Tileset } from '../graphic/index.js';

// type Writeable<T> = {
// 	-readonly [P in keyof T]: T[P];
// };

// type FuncReduceVector = <A extends Vector, B extends Vector>(
type FuncReduceVector = (a: Vec2, b: Vec2) => number;
type FuncReduceNumber = (acc: number, v: number) => number;

type VectorToObjectVectorHybrid<A extends readonly PropertyKey[]> = Pick<
	{
		[TIndex in A[number] | keyof A]: number;
	},
	Exclude<keyof A, keyof unknown[]> | A[number]
>;

const reduceSum: FuncReduceNumber = (acc, v) => acc + v;
const _reduceProduct: FuncReduceNumber = (acc, v) => acc * v;

const distance = (dimensions: Vec2): number =>
	Math.abs(Math.sqrt(dimensions.map((d) => d * d).reduce(reduceSum, 0)));
const distanceSq = (dimensions: Vec2): number =>
	Math.abs(dimensions.map((d) => d * d).reduce(reduceSum, 0));

const isDefined = <T>(v: T | undefined): v is T => Boolean(v);

const interlaceArrays = <T, U>(
	a: Readonly<T[]>,
	b: Readonly<U[]>,
): Array<T | U> => a.flatMap((v, i) => [v, b[i]]).filter(isDefined);

// export const mapByOffset = <V extends Vector>(
export const mapByOffset = (offset: Vec2): ((pos: Vec2) => Vec2) => {
	return (pos: Vec2): Vec2 => addPos(offset, pos);
};
// export const mapFindOffset = <V extends Vector>(
export const mapFindOffset = (origin: Vec2): ((pos: Vec2) => Vec2) => {
	return (pos: Vec2): Vec2 => subPos(pos, origin);
};
// export const flatMapByOffsets = <V extends Vector>(
export const flatMapByOffsets = (offsets: Vec2[]): ((pos: Vec2) => Vec2[]) => {
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

export const RAD_TO_DEG = 180.0 / Math.PI;
export const radToDeg = (rad: number): number => rad * RAD_TO_DEG;
export const DEG_TO_RAD = Math.PI / 180.0;
export const degToRad = (deg: number): number => deg * DEG_TO_RAD;

export const RAD_45 = 45 * DEG_TO_RAD;
export const RAD_90 = 90 * DEG_TO_RAD;
export const RAD_180 = 180 * DEG_TO_RAD;
export const RAD_270 = 270 * DEG_TO_RAD;
export const RAD_360 = 360 * DEG_TO_RAD;
export const RAD_540 = 540 * DEG_TO_RAD;
export const RAD_720 = 720 * DEG_TO_RAD;

// const getAngle = (a, b) => Math.atan2(...subPos(b, a)) * 180 / Math.PI;
const getAngle: FuncReduceVector = (a, b) =>
	Math.atan2(b[1] - a[1], b[0] - a[0]);
const getAngleBetween: FuncReduceNumber = (a, b) =>
	((b - a + RAD_540) % RAD_360) - RAD_180;

// export const isPointOnLine = <V extends Vector>(
export const isPointOnLine = (point: Vec2, a: Vec2, b: Vec2): boolean =>
	Math.abs(
		posDistance(a, point) + posDistance(point, b) - posDistance(a, b),
	) < EPSILON;

// TODO(bret): Would be fun to make this work with any dimensions
export const isWithinBounds = (
	[x, y]: Vec2,
	[x1, y1]: Vec2,
	[x2, y2]: Vec2,
): boolean => x >= x1 && y >= y1 && x < x2 && y < y2;

// <V extends Vector>(a: Vec2, b: Vec2): ((pos: Vec2) => boolean) =>
export const filterWithinBounds =
	(a: Vec2, b: Vec2): ((pos: Vec2) => boolean) =>
	(pos: Vec2): boolean =>
		a.every((p, i) => ([...pos][i] ?? -Infinity) >= p) &&
		b.every((p, i) => ([...pos][i] ?? Infinity) < p);

export type Path = Vec2[];

export const isPointInsidePath = (point: Vec2, path: Path): boolean => {
	const wind = path
		.map((vertex) => getAngle(point, vertex))
		.map((angle, i, arr) =>
			getAngleBetween(
				angle,
				arr[(i + 1) % arr.length] as unknown as number,
			),
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
export type V2OrthogonalNorm = (typeof orthogonalNorms)[number];
export type V2DiagonalNorm = (typeof diagonalNorms)[number];
// eslint-disable-next-line @typescript-eslint/no-duplicate-type-constituents -- this might change in the future, we'll see
export type V2CardinalNorm = V2OrthogonalNorm | V2DiagonalNorm;

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
export const rotateNormBy45Deg = (
	curDir: V2CardinalNorm,
	turns: number,
): V2CardinalNorm => {
	// const norms = cardinalNorms; // .flatMap(v => [v, v]);
	const index = cardinalNorms.indexOf(curDir);
	if (index === -1) {
		console.error('rotateNormBy45Deg expects a norm array');
		return curDir;
	}

	const n = cardinalNorms.length;
	return cardinalNorms[(index - turns + n) % n] as unknown as V2CardinalNorm;
};

// NOTE: The generic allows it to use V2's orthogonal or diagonal norm types, depending on the `curDir`
export const rotateNormBy90Deg = <V extends V2CardinalNorm>(
	curDir: V,
	turns: number,
): V => rotateNormBy45Deg(curDir, 2 * turns) as V;

// CLEANUP(bret): This file is a bunch of random stuff, will need to clean up
import type { Tileset } from '../graphic/index.js';
import type { Vector } from './index.js';
import {
	addVec,
	clamp,
	hashVec,
	lerp,
	RAD_180,
	RAD_360,
	RAD_540,
	Random,
	reduceSum,
	subVec,
	Vec2,
} from './index.js';

type FuncReduceNumber = (acc: number, v: number) => number;
type FuncReduceVector<T extends Vector = Vector> = (a: T, b: T) => number;

// type Writeable<T> = {
// 	-readonly [P in keyof T]: T[P];
// };

type VectorToObjectVectorHybrid<A extends readonly PropertyKey[]> = Pick<
	{
		[TIndex in A[number] | keyof A]: number;
	},
	Exclude<keyof A, keyof unknown[]> | A[number]
>;

const isDefined = <T>(v: T | undefined): v is T => Boolean(v);

const interlaceArrays = <T, U>(
	a: Readonly<T[]>,
	b: Readonly<U[]>,
): Array<T | U> => a.flatMap((v, i) => [v, b[i]]).filter(isDefined);

// export const mapByOffset = <V extends Vector>(
export const mapByOffset = (offset: Vec2): ((pos: Vec2) => Vec2) => {
	return (pos: Vec2): Vec2 => addVec(offset, pos);
};
// export const mapFindOffset = <V extends Vector>(
export const mapFindOffset = (origin: Vec2): ((pos: Vec2) => Vec2) => {
	return (pos: Vec2): Vec2 => subVec(pos, origin);
};
// export const flatMapByOffsets = <V extends Vector>(
export const flatMapByOffsets = (offsets: Vec2[]): ((pos: Vec2) => Vec2[]) => {
	return (pos: Vec2): Vec2[] => offsets.map((offset) => addVec(offset, pos));
};

// const pathToSegments = (path) =>
// 	path.map((vertex, i, vertices) => [
// 		vertex,
// 		vertices[(i + 1) % vertices.length],
// 	]);

// const getAngle = (a, b) => Math.atan2(...subVec(b, a)) * 180 / Math.PI;
const getAngle: FuncReduceVector = (a, b) =>
	Math.atan2(b[1] - a[1], b[0] - a[0]);
const getAngleBetween: FuncReduceNumber = (a, b) =>
	((b - a + RAD_540) % RAD_360) - RAD_180;

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
	return Math.abs(wind) > Number.EPSILON;
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

// CLEANUP(bret): I'm not sure we need these anymore, we could probably move this logic to Vec2
let nnn;
{
	// prettier-ignore
	const [
		normLU, normNU, normRU,
		normLN, normNN, normRN,
		normLD, normND, normRD,
	] = [
		new Vec2(-1, -1),
		Vec2.up,
		new Vec2(1, -1),

		Vec2.left,
		Vec2.zero,
		Vec2.right,

		new Vec2(-1, 1),
		Vec2.down,
		Vec2.one,
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
		return this.#map.delete(hashVec(key));
	}
	get(key: K): V | undefined {
		return this.#map.get(hashVec(key));
	}
	has(key: K): boolean {
		return this.#map.has(hashVec(key));
	}
	set(key: K, value: V): this {
		this.#map.set(hashVec(key), value);
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

declare global {
	interface Math {
		clamp: (val: number, min: number, max: number) => number;
		lerp: (a: number, b: number, t: number) => number;
	}
}

// Math prototype fun :~)
if (typeof Math.clamp === 'undefined') {
	Math.clamp = clamp;
}

if (typeof Math.lerp === 'undefined') {
	Math.lerp = lerp;
}

declare global {
	interface Array<T> {
		shuffle: (random?: Random) => this;
		toShuffled: (random?: Random) => T[];
	}
}

// Array prototype fun :~)
if (typeof Array.prototype.shuffle === 'undefined') {
	Array.prototype.shuffle = function shuffle<T>(
		this: T[],
		random?: Random,
	): T[] {
		return random?.shuffle(this) ?? Random.shuffle(this);
	};
}

if (typeof Array.prototype.toShuffled === 'undefined') {
	Array.prototype.toShuffled = function toShuffle<T>(
		this: T[],
		random?: Random,
	): T[] {
		const newArr = [...this];
		return newArr.shuffle(random);
	};
}

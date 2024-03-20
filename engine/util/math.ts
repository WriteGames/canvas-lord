export type V2 = [x: number, y: number];
export type V3 = [x: number, y: number, z: number];
export type V4 = [x: number, y: number, z: number, w: number];

export type Vector = V2 | V3 | V4;

export const V2 = Object.defineProperties(
	{},
	{
		zero: {
			value: [0, 0] as V2,
			writable: false,
		},
		one: {
			value: [1, 1] as V2,
			writable: false,
		},
	},
) as {
	zero: V2;
	one: V2;
};

type FuncMapVector = <A extends Vector, B extends Vector>(a: A, b: B) => A;
type FuncMapVectorByScalar = <P extends Vector>(p: P, s: number) => P;

type FuncCompare<T extends any> = (a: T, b: T) => boolean;

export const addPos: FuncMapVector = (a, b) => {
	return a.map((v, i) => v + (b[i] ?? 0)) as typeof a;
};

export const addScalar: FuncMapVectorByScalar = (p, s) => {
	return p.map((v) => v + s) as unknown as typeof p;
};

export const subPos: FuncMapVector = (a, b) => {
	return a.map((v, i) => v - (b[i] ?? 0)) as typeof a;
};

export const scalePos: FuncMapVectorByScalar = (p, s) => {
	return p.map((v) => v * s) as unknown as typeof p;
};

export const posEqual = (a: Vector, b: Vector): boolean =>
	a.length === b.length && a.every((v, i) => equal(v, b[i] as number));

export const equal: FuncCompare<number> = (a, b) => {
	return Math.abs(a - b) < Number.EPSILON;
};

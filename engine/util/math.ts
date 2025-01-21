export const EPSILON = 0.000001;

// Math prototype fun :~)
if (typeof Math.clamp === 'undefined') {
	Math.clamp = (val, min, max) => {
		if (val < min) return min;
		if (val > max) return max;
		return val;
	};
}

if (typeof Math.lerp === 'undefined') {
	Math.lerp = (a, b, t) => {
		return t * (b - a) + a;
	};
}

export type Line2D = [Vec2, Vec2];

/*export*/ type V2 = [x: number, y: number];
export type V3 = [x: number, y: number, z: number];
export type V4 = [x: number, y: number, z: number, w: number];

export type Vector = V2 | Readonly<V2> | V3 | Readonly<V3> | V4 | Readonly<V4>;

const X = 0;
const Y = 1;
const Z = 2;
const W = 3;

export class Vec2 extends Array<number> {
	// length: 2 = 2;

	constructor(x = 0, y = 0) {
		super(x, y);
	}

	get x(): number {
		return this[X];
	}

	set x(value: number) {
		this[X] = value;
	}

	get y(): number {
		return this[Y];
	}

	set y(value: number) {
		this[Y] = value;
	}

	get magnitude(): number {
		return magnitude2D(this);
	}

	map<U>(
		// TODO: index: 0 | 1 ?
		callbackfn: (value: number, index: number, array: number[]) => U,
		thisArg?: any,
	): [U, U] {
		return super.map(callbackfn, thisArg) as [U, U];
	}

	every<S extends number>(
		predicate: (value: number, index: number, array: number[]) => boolean,
		thisArg?: any,
	): this is S[] {
		return super.every(predicate, thisArg);
	}

	join(separator?: string): string {
		return super.join(separator);
	}

	[Symbol.iterator]() {
		return super.values();
	}

	clone(): Vec2 {
		return new Vec2(...this);
	}

	// TODO: add 'self' methods
	// addSelf(v: Vec2): this {
	// 	this.#values = this.map((val, i) => val + (v[i] ?? 0));
	// 	return this;
	// }

	add(v: Vec2): Vec2 {
		return Vec2.add(this, v);
	}

	static add(a: Vec2, b: Vec2): Vec2 {
		return addPos(a, b);
	}

	sub(v: Vec2): Vec2 {
		return Vec2.sub(this, v);
	}

	static sub(a: Vec2, b: Vec2): Vec2 {
		return subPos(a, b);
	}

	scale(s: number): Vec2 {
		return Vec2.scale(this, s);
	}

	static scale(v: Vec2, s: number): Vec2 {
		return scalePos(v, s);
	}

	invScale(s: number): Vec2 {
		return Vec2.scale(this, 1 / s);
	}

	static invScale(v: Vec2, s: number): Vec2 {
		return scalePos(v, 1 / s);
	}

	cross(v: Vec2) {
		return Vec2.cross(this, v);
	}

	static cross(a: Vec2, b: Vec2) {
		return crossProduct2D(a, b);
	}

	dot(v: Vec2) {
		return Vec2.dot(this, v);
	}

	static dot(a: Vec2, b: Vec2) {
		return dotProduct2D(a, b);
	}

	equal(v: Vec2): boolean {
		return Vec2.equal(this, v);
	}

	static equal(a: Vec2, b: Vec2): boolean {
		return posEqual(a, b);
	}

	static get zero(): Vec2 {
		return new Vec2(0, 0);
	}

	static get one(): Vec2 {
		return new Vec2(1, 1);
	}

	static get right(): Vec2 {
		return new Vec2(1, 0);
	}

	static get up(): Vec2 {
		return new Vec2(0, 1);
	}
}

const vec = new Vec2(1, 3);
const [a, b, c, d, e] = vec;

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

type FuncMapVector = <T extends Vector | Vec2, A extends T, B extends T>(
	a: A,
	b: B,
) => A;
type FuncMapVectorByScalar = <P extends Vector>(
	p: Vec2 | Vector,
	s: number,
) => Vec2;

type FuncReduceVector = <A extends Vector, B extends Vector>(
	a: Vec2,
	b: Vec2,
) => number;

type FuncCompare<T extends any> = (a: T, b: T) => boolean;

export const hashPos = (pos: Vector | Vec2) => pos.join(',');

export const addPos: FuncMapVector = (a, b) => {
	return a.map((v, i) => v + (b[i] ?? 0)) as typeof a;
};

export const subPos: FuncMapVector = (a, b) => {
	return a.map((v, i) => v - (b[i] ?? 0)) as typeof a;
};

export const addScalar: FuncMapVectorByScalar = (p, s) => {
	return new Vec2(...p.map((v) => v + s));
};

export const scalePos: FuncMapVectorByScalar = (p, s) => {
	return new Vec2(...p.map((v) => v * s));
};

export const posEqual = (a: Vector | Vec2, b: Vector | Vec2): boolean => {
	const aa = [...a];
	const bb = [...b];
	return (
		aa.length === bb.length && aa.every((v, i) => equal(v, bb[i] as number))
	);
};

export const equal: FuncCompare<number> = (a, b) => {
	return Math.abs(a - b) < Number.EPSILON;
};

export const indexToPos = (index: number, stride: number): Vec2 =>
	new Vec2(index % stride, Math.floor(index / stride));
export const posToIndex = ([x, y]: Vec2, stride: number): number =>
	y * stride + x;

export const crossProduct2D: FuncReduceVector = (a, b) =>
	a[0] * b[1] - a[1] * b[0];
export const dotProduct2D: FuncReduceVector = (a, b) =>
	a[0] * b[0] + a[1] * b[1];
export const magnitude2D = (v: Vec2): number => Math.sqrt(v.x ** 2 + v.y ** 2);

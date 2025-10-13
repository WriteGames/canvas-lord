import type { Vector } from './common';

export const isVec2 = (vec: Vector | Vec2): vec is Vec2 => {
	return vec instanceof Vec2;
};

const X = 0;
const Y = 1;

export class Vec2 extends Array<number> {
	// length: 2 = 2 as const;

	constructor(x = 0, y = 0) {
		super(x, y);
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

	set(v: Vec2): void {
		this.x = v.x;
		this.y = v.y;
	}

	setXY(x: number, y: number): void {
		this.x = x;
		this.y = y;
	}

	static normalize = (v: Vec2): Vec2 => {
		return v.clone().invScale(v.magnitude);
	};
	normalize(): this {
		const mag = this.magnitude;
		this.x /= mag;
		this.y /= mag;
		return this;
	}

	map<U>(
		// DECIDE: index: 0 | 1 ?
		callbackfn: (value: number, index: number, array: number[]) => U,
		thisArg?: unknown,
	): [U, U] {
		return super.map(callbackfn, thisArg) as [U, U];
	}

	every<S extends number>(
		predicate: (value: number, index: number, array: number[]) => boolean,
		thisArg?: unknown,
	): this is S[] {
		return super.every(predicate, thisArg);
	}

	join(separator?: string): string {
		return super.join(separator);
	}

	[Symbol.iterator](): ArrayIterator<number> {
		return super.values();
	}

	clone(): Vec2 {
		return new Vec2(...this);
	}

	static add = (a: Vec2, b: Vec2): Vec2 => addPos(a, b);
	add(v: Vec2): this {
		this.x += v.x;
		this.y += v.y;
		return this;
	}

	static plus = (a: Vec2, b: Vec2): Vec2 => Vec2.add(a, b);
	plus(v: Vec2): this {
		return this.add(v);
	}

	static sub = (a: Vec2, b: Vec2): Vec2 => subPos(a, b);
	sub(v: Vec2): this {
		this.x -= v.x;
		this.y -= v.y;
		return this;
	}

	static minus = (a: Vec2, b: Vec2): Vec2 => Vec2.sub(a, b);
	minus(v: Vec2): this {
		return this.sub(v);
	}

	static scale = (v: Vec2, s: number): Vec2 => scalePos(v, s);
	scale(s: number): this {
		this.x *= s;
		this.y *= s;
		return this;
	}

	static invScale = (v: Vec2, s: number): Vec2 => scalePos(v, 1 / s);
	invScale(s: number): this {
		const iS = 1 / s;
		this.x *= iS;
		this.y *= iS;
		return this;
	}

	static cross = (a: Vec2, b: Vec2): number => crossProduct2D(a, b);
	cross(v: Vec2): number {
		return Vec2.cross(this, v);
	}

	static dot = (a: Vec2, b: Vec2): number => dotProduct2D(a, b);
	dot(v: Vec2): number {
		return Vec2.dot(this, v);
	}

	static rotate = (v: Vec2, angle: number): Vec2 => rotate2D(v, angle);
	rotate(angle: number): Vec2 {
		return Vec2.rotate(this, angle);
	}

	static equal = (a: Vec2, b: Vec2): boolean => posEqual(a, b);
	equal(v: Vec2): boolean {
		return Vec2.equal(this, v);
	}

	static lerp = (a: Vec2, b: Vec2, t: number): Vec2 => {
		return Vec2.sub(b, a).scale(t).add(a);
	};
}

// TYPE(bret): Find a home for these
// type V2 = [number, number];
// type V3 = [number, number, number];
// type V4 = [number, number, number, number];
// type Vector = V2 | V3 | V4;

type FuncMapVector = <T extends Vector | Vec2, A extends T, B extends T>(
	a: A,
	b: B,
) => A;
// type FuncMapVectorByScalar = <P extends Vector>(
type FuncMapVectorByScalar = <T extends Vec2 | Vector>(p: T, s: number) => T;

// type FuncReduceVector = <A extends Vector, B extends Vector>(
type FuncReduceVector = (a: Vec2, b: Vec2) => number;

type FuncCompare<T> = (a: T, b: T) => boolean;

export const hashPos = (pos: Vector | Vec2): string => pos.join(',');

export const addPos: FuncMapVector = (a, b) => {
	return a.map((v, i) => v + (b[i] ?? 0)) as typeof a;
};

export const subPos: FuncMapVector = (a, b) => {
	return a.map((v, i) => v - (b[i] ?? 0)) as typeof a;
};

export const addScalar: FuncMapVectorByScalar = (p, s) => {
	const sums = p.map((v) => v + s);
	if (isVec2(p)) return new Vec2(...sums) as typeof p;
	return sums as typeof p;
};

export const scalePos: FuncMapVectorByScalar = (p, s) => {
	const scaled = p.map((v) => v * s);
	if (isVec2(p)) return new Vec2(...scaled) as typeof p;
	return scaled as typeof p;
};

export const posEqual = (a: Vector | Vec2, b: Vector | Vec2): boolean => {
	const aa = [...a];
	const bb = [...b];
	return aa.length === bb.length && aa.every((v, i) => equal(v, bb[i]));
};

export const equal: FuncCompare<number> = (a, b) => {
	return Math.abs(a - b) < Number.EPSILON;
};

export const indexToPos = (index: number, stride: number): Vec2 =>
	new Vec2(index % stride, Math.floor(index / stride));
export const posToIndex = ([x, y]: Vec2, stride: number): number =>
	y * stride + x;

export const rotate2D = (v: Vec2, angle: number): Vec2 => {
	const cos = Math.cos(angle);
	const sin = Math.sin(angle);
	return new Vec2(v.x * cos - v.y * sin, v.x * sin + v.y * cos);
};

export const crossProduct2D: FuncReduceVector = (a, b) =>
	a[0] * b[1] - a[1] * b[0];
export const dotProduct2D: FuncReduceVector = (a, b) =>
	a[0] * b[0] + a[1] * b[1];
export const magnitude2D = (v: Vec2): number => Math.sqrt(v.x ** 2 + v.y ** 2);
